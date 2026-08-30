import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync, type StatementSync } from "node:sqlite";
import type { OrgToolsState } from "@org-tools/types";

import { createBlankOrgToolsState, parseOrgToolsState } from "@/lib/org-file";
import {
  createProjectUiState,
  PROJECT_NAME_MAX_LENGTH,
  type ProjectApiErrorCode,
  type ProjectDocument,
  type ProjectListResponse,
  type ProjectSummary,
  type ProjectUiState,
  parseProjectUiState,
  sanitizeProjectUiState,
} from "@/lib/project-workspace";
import { resolveProjectRuntimeConfig } from "@/server/project-config";

const SCHEMA_VERSION = 1;
const DEFAULT_BUSY_TIMEOUT_MS = 5_000;

type ProjectRow = {
  created_at: string;
  id: string;
  name: string;
  state_json: string;
  state_revision: number | bigint;
  ui_json: string;
  updated_at: string;
};

type SummaryRow = Omit<ProjectRow, "state_json" | "ui_json">;

export class ProjectRepositoryError extends Error {
  readonly code: ProjectApiErrorCode;
  readonly currentRevision?: number;

  constructor(
    code: ProjectApiErrorCode,
    message: string,
    options?: { cause?: unknown; currentRevision?: number },
  ) {
    super(message, { cause: options?.cause });
    this.name = "ProjectRepositoryError";
    this.code = code;
    if (options?.currentRevision !== undefined) {
      this.currentRevision = options.currentRevision;
    }
  }
}

const toNumber = (value: number | bigint) => Number(value);

const toSummary = (row: SummaryRow): ProjectSummary => ({
  createdAt: row.created_at,
  id: row.id,
  name: row.name,
  stateRevision: toNumber(row.state_revision),
  updatedAt: row.updated_at,
});

export const normalizeProjectName = (input: unknown): { key: string; name: string } => {
  if (typeof input !== "string") {
    throw new ProjectRepositoryError("invalid_input", "Project name must be a string.");
  }
  const name = input.trim().normalize("NFC");
  if (!name || name.length > PROJECT_NAME_MAX_LENGTH) {
    throw new ProjectRepositoryError(
      "invalid_input",
      `Project name must contain 1 to ${PROJECT_NAME_MAX_LENGTH} characters after trimming.`,
    );
  }
  return { key: name.normalize("NFKC").toLocaleLowerCase("en-US"), name };
};

const parseStoredState = (value: string): OrgToolsState => {
  try {
    const state = parseOrgToolsState(JSON.parse(value));
    if (state.content !== "workspace") throw new Error("Stored project is not a full workspace.");
    return state;
  } catch (error) {
    throw new ProjectRepositoryError(
      "corrupt_stored_state",
      "The stored project state is corrupt.",
      { cause: error },
    );
  }
};

const validateWritableState = (input: unknown): OrgToolsState => {
  try {
    const state = parseOrgToolsState(input);
    if (state.content !== "workspace") throw new Error("Project Save requires a full workspace.");
    return state;
  } catch (error) {
    throw new ProjectRepositoryError("invalid_state", "Project state is invalid.", {
      cause: error,
    });
  }
};

const parseStoredUi = (value: string, state: OrgToolsState): ProjectUiState => {
  try {
    return sanitizeProjectUiState(parseProjectUiState(JSON.parse(value)), state);
  } catch (error) {
    throw new ProjectRepositoryError(
      "corrupt_stored_state",
      "The stored project UI state is corrupt.",
      { cause: error },
    );
  }
};

const isUniqueConstraintError = (error: unknown) =>
  error instanceof Error &&
  (("code" in error &&
    typeof error.code === "string" &&
    error.code.startsWith("ERR_SQLITE_CONSTRAINT")) ||
    ("errcode" in error &&
      typeof error.errcode === "number" &&
      [19, 1555, 2067].includes(error.errcode)));

export class ProjectRepository {
  readonly databasePath: string;
  private readonly database: DatabaseSync;

  constructor(databasePath: string) {
    this.databasePath = databasePath;
    try {
      if (databasePath !== ":memory:") mkdirSync(dirname(databasePath), { recursive: true });
      this.database = new DatabaseSync(databasePath);
      this.initialize();
    } catch (error) {
      throw new ProjectRepositoryError(
        "database_unavailable",
        "The Org Tools database is unavailable.",
        { cause: error },
      );
    }
  }

  close(): void {
    this.database.close();
  }

  private initialize(): void {
    this.database.exec(`
      PRAGMA journal_mode = DELETE;
      PRAGMA foreign_keys = ON;
      PRAGMA synchronous = FULL;
      PRAGMA busy_timeout = ${DEFAULT_BUSY_TIMEOUT_MS};
    `);
    const versionRow = this.database.prepare("PRAGMA user_version").get() as
      | { user_version: number | bigint }
      | undefined;
    const version = versionRow ? toNumber(versionRow.user_version) : 0;
    if (version !== 0 && version !== SCHEMA_VERSION) {
      throw new Error(`Unsupported database schema version ${version}.`);
    }
    if (version === SCHEMA_VERSION) return;

    this.transaction(() => {
      this.database.exec(`
        CREATE TABLE projects (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          name_key TEXT NOT NULL UNIQUE,
          state_json TEXT NOT NULL,
          ui_json TEXT NOT NULL,
          state_revision INTEGER NOT NULL CHECK (state_revision >= 1),
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        ) STRICT;
        CREATE TABLE app_state (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          last_project_id TEXT REFERENCES projects(id) ON DELETE SET NULL
        ) STRICT;
        INSERT INTO app_state (id, last_project_id) VALUES (1, NULL);
        PRAGMA user_version = 1;
      `);
    });
  }

  private transaction<T>(operation: () => T): T {
    this.database.exec("BEGIN IMMEDIATE");
    try {
      const result = operation();
      this.database.exec("COMMIT");
      return result;
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }

  private getProjectRow(id: string): ProjectRow {
    const row = this.database
      .prepare(
        `SELECT id, name, state_json, ui_json, state_revision, created_at, updated_at
         FROM projects WHERE id = ?`,
      )
      .get(id) as ProjectRow | undefined;
    if (!row) throw new ProjectRepositoryError("not_found", "Project not found.");
    return row;
  }

  private insertProject(nameInput: unknown): ProjectDocument {
    const { key, name } = normalizeProjectName(nameInput);
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const state = createBlankOrgToolsState("system");
    const ui = createProjectUiState(state);
    try {
      this.database
        .prepare(
          `INSERT INTO projects
           (id, name, name_key, state_json, ui_json, state_revision, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
        )
        .run(id, name, key, JSON.stringify(state), JSON.stringify(ui), timestamp, timestamp);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ProjectRepositoryError("duplicate_name", "A project with this name exists.");
      }
      throw error;
    }
    this.database.prepare("UPDATE app_state SET last_project_id = ? WHERE id = 1").run(id);
    return {
      createdAt: timestamp,
      id,
      name,
      state,
      stateRevision: 1,
      ui,
      updatedAt: timestamp,
    };
  }

  private nextDefaultProjectName(): string {
    const rows = this.database.prepare("SELECT name_key FROM projects").all() as Array<{
      name_key: string;
    }>;
    const names = new Set(rows.map((row) => row.name_key));
    let index = 1;
    while (true) {
      const candidate = index === 1 ? "New project" : `New project ${index}`;
      if (!names.has(normalizeProjectName(candidate).key)) return candidate;
      index += 1;
    }
  }

  listProjects(): ProjectListResponse {
    const projects = (
      this.database
        .prepare(
          `SELECT id, name, state_revision, created_at, updated_at
           FROM projects ORDER BY updated_at DESC, created_at DESC`,
        )
        .all() as SummaryRow[]
    ).map(toSummary);
    const state = this.database
      .prepare("SELECT last_project_id FROM app_state WHERE id = 1")
      .get() as { last_project_id: string | null } | undefined;
    const currentProjectId = projects.some((project) => project.id === state?.last_project_id)
      ? (state?.last_project_id ?? null)
      : null;
    return { currentProjectId, projects };
  }

  ensureProjectList(): ProjectListResponse {
    const list = this.listProjects();
    if (list.currentProjectId) return list;
    if (list.projects[0]) {
      this.database
        .prepare("UPDATE app_state SET last_project_id = ? WHERE id = 1")
        .run(list.projects[0].id);
      return { ...list, currentProjectId: list.projects[0].id };
    }
    const project = this.createProject(this.nextDefaultProjectName());
    return { currentProjectId: project.id, projects: [project] };
  }

  ensureCurrentProject(): ProjectDocument {
    const list = this.ensureProjectList();
    if (!list.currentProjectId) throw new Error("Current project resolution failed.");
    return this.openProject(list.currentProjectId);
  }

  createProject(name: unknown): ProjectDocument {
    return this.transaction(() => this.insertProject(name));
  }

  openProject(id: string): ProjectDocument {
    const row = this.getProjectRow(id);
    const state = parseStoredState(row.state_json);
    const ui = parseStoredUi(row.ui_json, state);
    this.database.prepare("UPDATE app_state SET last_project_id = ? WHERE id = 1").run(id);
    return { ...toSummary(row), state, ui };
  }

  renameProject(id: string, nameInput: unknown): ProjectSummary {
    const { key, name } = normalizeProjectName(nameInput);
    const timestamp = new Date().toISOString();
    try {
      const result = this.database
        .prepare("UPDATE projects SET name = ?, name_key = ?, updated_at = ? WHERE id = ?")
        .run(name, key, timestamp, id);
      if (toNumber(result.changes) === 0) {
        throw new ProjectRepositoryError("not_found", "Project not found.");
      }
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ProjectRepositoryError("duplicate_name", "A project with this name exists.");
      }
      throw error;
    }
    return toSummary(this.getProjectRow(id));
  }

  deleteProject(id: string): { nextProject: ProjectDocument } {
    return this.transaction(() => {
      const current = this.listProjects().currentProjectId;
      const result = this.database.prepare("DELETE FROM projects WHERE id = ?").run(id);
      if (toNumber(result.changes) === 0) {
        throw new ProjectRepositoryError("not_found", "Project not found.");
      }
      const remaining = this.listProjects().projects[0];
      const nextProject = remaining
        ? this.openProject(current === id || current === null ? remaining.id : current)
        : this.insertProject(this.nextDefaultProjectName());
      return { nextProject };
    });
  }

  saveState(id: string, input: unknown, expectedRevision: unknown): ProjectDocument {
    const state = validateWritableState(input);
    if (
      typeof expectedRevision !== "number" ||
      !Number.isSafeInteger(expectedRevision) ||
      expectedRevision < 1
    ) {
      throw new ProjectRepositoryError("invalid_input", "Expected revision is invalid.");
    }

    return this.transaction(() => {
      const row = this.getProjectRow(id);
      const currentRevision = toNumber(row.state_revision);
      if (currentRevision !== expectedRevision) {
        throw new ProjectRepositoryError("revision_conflict", "Project revision conflict.", {
          currentRevision,
        });
      }
      const nextRevision = currentRevision + 1;
      const timestamp = new Date().toISOString();
      this.database
        .prepare(
          `UPDATE projects
           SET state_json = ?, state_revision = ?, updated_at = ?
           WHERE id = ? AND state_revision = ?`,
        )
        .run(JSON.stringify(state), nextRevision, timestamp, id, currentRevision);
      const ui = parseStoredUi(row.ui_json, state);
      return {
        createdAt: row.created_at,
        id,
        name: row.name,
        state,
        stateRevision: nextRevision,
        ui,
        updatedAt: timestamp,
      };
    });
  }

  saveUi(id: string, input: unknown): ProjectUiState {
    let parsedUi: ProjectUiState;
    try {
      parsedUi = parseProjectUiState(input);
    } catch (error) {
      throw new ProjectRepositoryError("invalid_input", "Project UI state is invalid.", {
        cause: error,
      });
    }
    return this.transaction(() => {
      const row = this.getProjectRow(id);
      const state = parseStoredState(row.state_json);
      const ui = sanitizeProjectUiState(parsedUi, state);
      this.database
        .prepare("UPDATE projects SET ui_json = ?, updated_at = ? WHERE id = ?")
        .run(JSON.stringify(ui), new Date().toISOString(), id);
      return ui;
    });
  }

  /** Used only by isolated repository tests that exercise corrupt-data recovery. */
  unsafeStatementForTests(sql: string): StatementSync {
    if (process.env.NODE_ENV !== "test") {
      throw new Error("Unsafe database access is available only in tests.");
    }
    return this.database.prepare(sql);
  }
}

type ProjectRepositoryGlobal = typeof globalThis & {
  __orgToolsProjectRepository?: { path: string; repository: ProjectRepository };
};

export const getProjectRepository = (): ProjectRepository => {
  const { databasePath } = resolveProjectRuntimeConfig();
  const shared = globalThis as ProjectRepositoryGlobal;
  if (shared.__orgToolsProjectRepository?.path === databasePath) {
    return shared.__orgToolsProjectRepository.repository;
  }
  shared.__orgToolsProjectRepository?.repository.close();
  const repository = new ProjectRepository(databasePath);
  shared.__orgToolsProjectRepository = { path: databasePath, repository };
  return repository;
};

export const resetProjectRepositoryForTests = (): void => {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("The project repository can be reset only in tests.");
  }
  const shared = globalThis as ProjectRepositoryGlobal;
  shared.__orgToolsProjectRepository?.repository.close();
  delete shared.__orgToolsProjectRepository;
};
