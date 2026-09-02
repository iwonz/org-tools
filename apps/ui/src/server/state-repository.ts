import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync, type StatementSync } from "node:sqlite";
import type { OrgToolsState } from "@org-tools/types";

import { createBlankOrgToolsState, parseOrgToolsState } from "@/lib/org-file";
import type { StateApiErrorCode, StateDocument, StatePutRequest } from "@/lib/state-runtime";
import { resolveStateRuntimeConfig } from "@/server/state-config";

const DEFAULT_BUSY_TIMEOUT_MS = 5_000;

type StateRow = {
  created_at: string;
  organization_json: string;
  revision: number | bigint;
  ui_json: string;
  updated_at: string;
};

export class StateRepositoryError extends Error {
  readonly code: StateApiErrorCode;

  constructor(code: StateApiErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "StateRepositoryError";
    this.code = code;
  }
}

const toNumber = (value: number | bigint) => Number(value);

const parseStoredState = (row: StateRow): OrgToolsState => {
  try {
    return parseOrgToolsState({
      organization: JSON.parse(row.organization_json),
      ui: JSON.parse(row.ui_json),
    });
  } catch (error) {
    throw new StateRepositoryError("corrupt_stored_state", "Stored state is corrupt.", {
      cause: error,
    });
  }
};

const validateState = (input: unknown): OrgToolsState => {
  try {
    return parseOrgToolsState(input);
  } catch (error) {
    throw new StateRepositoryError("invalid_state", "State is invalid.", {
      cause: error,
    });
  }
};

const tableNames = (database: DatabaseSync): string[] =>
  (
    database
      .prepare(
        "SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
      )
      .all() as Array<{ name: string }>
  ).map((row) => row.name);

const hasExactColumns = (
  database: DatabaseSync,
  table: string,
  expectedColumns: readonly string[],
): boolean => {
  const columns = (database.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>)
    .map((row) => row.name)
    .sort();
  return columns.join("\0") === [...expectedColumns].sort().join("\0");
};

const hasExactStateColumns = (database: DatabaseSync): boolean =>
  hasExactColumns(database, "application_state", [
    "created_at",
    "id",
    "organization_json",
    "revision",
    "ui_json",
    "updated_at",
  ]);

export class StateRepository {
  readonly databasePath: string;
  private readonly database: DatabaseSync;

  constructor(databasePath: string) {
    this.databasePath = databasePath;
    let database: DatabaseSync | undefined;
    try {
      if (databasePath !== ":memory:") mkdirSync(dirname(databasePath), { recursive: true });
      database = new DatabaseSync(databasePath);
      this.database = database;
      this.initialize();
    } catch (error) {
      database?.close();
      if (error instanceof StateRepositoryError) throw error;
      throw new StateRepositoryError("database_unavailable", "Database is unavailable.", {
        cause: error,
      });
    }
  }

  close(): void {
    this.database.close();
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

  private createSchema(): void {
    const state = createBlankOrgToolsState();
    const timestamp = new Date().toISOString();
    this.database.exec(`
      CREATE TABLE application_state (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        organization_json TEXT NOT NULL,
        ui_json TEXT NOT NULL,
        revision INTEGER NOT NULL CHECK (revision >= 1),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      ) STRICT;
    `);
    this.database
      .prepare(
        `INSERT INTO application_state
         (id, organization_json, ui_json, revision, created_at, updated_at)
         VALUES (1, ?, ?, 1, ?, ?)`,
      )
      .run(JSON.stringify(state.organization), JSON.stringify(state.ui), timestamp, timestamp);
  }

  private initialize(): void {
    this.database.exec(`
      PRAGMA journal_mode = DELETE;
      PRAGMA foreign_keys = ON;
      PRAGMA synchronous = FULL;
      PRAGMA busy_timeout = ${DEFAULT_BUSY_TIMEOUT_MS};
    `);
    const tables = tableNames(this.database);
    if (tables.length === 0) {
      this.transaction(() => this.createSchema());
      return;
    }
    if (tables.join("\0") !== "application_state" || !hasExactStateColumns(this.database)) {
      throw new StateRepositoryError("database_unavailable", "Database schema is not recognized.");
    }
    this.read();
  }

  private row(): StateRow {
    const row = this.database
      .prepare(
        `SELECT organization_json, ui_json, revision, created_at, updated_at
         FROM application_state WHERE id = 1`,
      )
      .get() as StateRow | undefined;
    if (!row) {
      throw new StateRepositoryError("corrupt_stored_state", "Stored state row is missing.");
    }
    return row;
  }

  read(): StateDocument {
    const row = this.row();
    return { revision: toNumber(row.revision), state: parseStoredState(row) };
  }

  write(input: StatePutRequest): StateDocument {
    return this.transaction(() => {
      const current = this.read();
      let nextState: OrgToolsState;
      if (input.scope === "all") {
        nextState = validateState(input.state);
      } else if (input.scope === "organization") {
        nextState = validateState({ organization: input.organization, ui: current.state.ui });
      } else {
        nextState = validateState({ organization: current.state.organization, ui: input.ui });
      }
      const revision = current.revision + 1;
      this.database
        .prepare(
          `UPDATE application_state
           SET organization_json = ?, ui_json = ?, revision = ?, updated_at = ?
           WHERE id = 1`,
        )
        .run(
          JSON.stringify(nextState.organization),
          JSON.stringify(nextState.ui),
          revision,
          new Date().toISOString(),
        );
      return { revision, state: nextState };
    });
  }

  unsafeStatementForTests(sql: string): StatementSync {
    if (process.env.NODE_ENV !== "test") {
      throw new Error("Unsafe database access is available only in tests.");
    }
    return this.database.prepare(sql);
  }
}

type StateRepositoryGlobal = typeof globalThis & {
  __orgToolsStateRepository?: { path: string; repository: StateRepository };
};

export const getStateRepository = (): StateRepository => {
  const { databasePath } = resolveStateRuntimeConfig();
  const shared = globalThis as StateRepositoryGlobal;
  if (shared.__orgToolsStateRepository?.path === databasePath) {
    return shared.__orgToolsStateRepository.repository;
  }
  shared.__orgToolsStateRepository?.repository.close();
  const repository = new StateRepository(databasePath);
  shared.__orgToolsStateRepository = { path: databasePath, repository };
  return repository;
};

export const resetStateRepositoryForTests = (): void => {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("The state repository can be reset only in tests.");
  }
  const shared = globalThis as StateRepositoryGlobal;
  shared.__orgToolsStateRepository?.repository.close();
  delete shared.__orgToolsStateRepository;
};
