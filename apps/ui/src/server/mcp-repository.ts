import { randomBytes, timingSafeEqual } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import type { OrgToolsState } from "@org-tools/types";

import { parseOrgToolsState } from "@/lib/org-file";
import { McpDomainError, previewDomainOperations, previewSelectiveUndo } from "@/server/mcp-domain";
import type {
  McpActivity,
  McpApplyResult,
  McpChangeSummary,
  McpPreviewResult,
  SemanticDiffEntry,
} from "@/server/mcp-types";
import { resolveStateRuntimeConfig } from "@/server/state-config";
import { emitStateRevision } from "@/server/state-events";
import { getStateRepository } from "@/server/state-repository";

const PREVIEW_TTL_MS = 10 * 60 * 1_000;
const MAX_CHANGES = 100;
const MAX_CHANGE_BYTES = 64 * 1024 * 1024;
const MAX_PREVIEW_COLLECTION_SIZE = 100;

export type McpRepositoryErrorCode =
  | "database_unavailable"
  | "invalid_input"
  | "mcp_disabled"
  | "not_found"
  | "preview_expired"
  | "revision_conflict"
  | "undo_conflict";

export class McpRepositoryError extends Error {
  readonly code: McpRepositoryErrorCode;
  readonly details?: unknown;

  constructor(
    code: McpRepositoryErrorCode,
    message: string,
    details?: unknown,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "McpRepositoryError";
    this.code = code;
    this.details = details;
  }
}

export type McpSettings = {
  createdAt: string;
  enabled: boolean;
  hasToken: boolean;
  maskedToken: string | null;
  rotatedAt: string | null;
  updatedAt: string;
};

type SettingsRow = {
  created_at: string;
  enabled: number | bigint;
  rotated_at: string | null;
  token: string | null;
  updated_at: string;
};

type PreviewRow = {
  actor: string;
  affected_ids_json: string;
  after_organization_json: string;
  applied_change_id: string | null;
  base_revision: number | bigint;
  before_organization_json: string;
  created_at: string;
  diff_json: string;
  expires_at: string;
  id: string;
  operations_json: string;
  reason: string;
  result_json: string | null;
  summary_json: string;
};

type ChangeRow = {
  actor: string;
  affected_ids_json: string;
  base_revision: number | bigint;
  created_at: string;
  forward_diff_json: string;
  id: string;
  inverse_diff_json: string;
  reason: string;
  result_revision: number | bigint;
  summary_json: string;
};

type StateRow = { organization_json: string; revision: number | bigint; ui_json: string };

const toNumber = (value: number | bigint) => Number(value);
const newToken = () => `ot_mcp_${randomBytes(32).toString("base64url")}`;
const newId = () => crypto.randomUUID();

const parseJson = <T>(value: string, code: McpRepositoryErrorCode = "database_unavailable"): T => {
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    throw new McpRepositoryError(code, "Stored MCP metadata is invalid.", undefined, {
      cause: error,
    });
  }
};

const inverseDiff = (diff: readonly SemanticDiffEntry[]): SemanticDiffEntry[] =>
  [...diff].reverse().map((entry) => ({
    ...entry,
    after: structuredClone(entry.before),
    afterExists: entry.beforeExists,
    before: structuredClone(entry.after),
    beforeExists: entry.afterExists,
  }));

const maskToken = (token: string | null): string | null =>
  token ? `ot_mcp_${"•".repeat(24)}` : null;

export class McpRepository {
  readonly databasePath: string;
  private readonly database: DatabaseSync;

  constructor(databasePath: string) {
    this.databasePath = databasePath;
    this.database = new DatabaseSync(databasePath);
    this.database.exec(`
      PRAGMA journal_mode = DELETE;
      PRAGMA foreign_keys = ON;
      PRAGMA synchronous = FULL;
      PRAGMA busy_timeout = 5000;
    `);
    this.settingsRow();
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

  private settingsRow(): SettingsRow {
    const row = this.database
      .prepare(
        "SELECT enabled, token, created_at, updated_at, rotated_at FROM mcp_settings WHERE id = 1",
      )
      .get() as SettingsRow | undefined;
    if (!row) throw new McpRepositoryError("database_unavailable", "MCP settings are missing.");
    return row;
  }

  private stateRow(): StateRow {
    const row = this.database
      .prepare("SELECT organization_json, ui_json, revision FROM application_state WHERE id = 1")
      .get() as StateRow | undefined;
    if (!row) throw new McpRepositoryError("database_unavailable", "Application state is missing.");
    return row;
  }

  private parseState(row = this.stateRow()): OrgToolsState {
    try {
      return parseOrgToolsState({
        organization: JSON.parse(row.organization_json),
        ui: JSON.parse(row.ui_json),
      });
    } catch (error) {
      throw new McpRepositoryError(
        "database_unavailable",
        "Application state is corrupt.",
        undefined,
        { cause: error },
      );
    }
  }

  getSettings(): McpSettings {
    const row = this.settingsRow();
    return {
      createdAt: row.created_at,
      enabled: Boolean(row.enabled),
      hasToken: Boolean(row.token),
      maskedToken: maskToken(row.token),
      rotatedAt: row.rotated_at,
      updatedAt: row.updated_at,
    };
  }

  setEnabled(enabled: boolean): McpSettings {
    this.transaction(() => {
      const current = this.settingsRow();
      const timestamp = new Date().toISOString();
      this.database
        .prepare("UPDATE mcp_settings SET enabled = ?, token = ?, updated_at = ? WHERE id = 1")
        .run(enabled ? 1 : 0, current.token ?? newToken(), timestamp);
    });
    return this.getSettings();
  }

  revealToken(): string {
    const token = this.settingsRow().token;
    if (!token) throw new McpRepositoryError("not_found", "MCP token has not been created.");
    return token;
  }

  rotateToken(): { settings: McpSettings; token: string } {
    const token = newToken();
    this.transaction(() => {
      const timestamp = new Date().toISOString();
      this.database
        .prepare("UPDATE mcp_settings SET token = ?, updated_at = ?, rotated_at = ? WHERE id = 1")
        .run(token, timestamp, timestamp);
      this.database.prepare("DELETE FROM mcp_previews WHERE applied_change_id IS NULL").run();
    });
    return { settings: this.getSettings(), token };
  }

  authenticate(token: string): boolean {
    const settings = this.settingsRow();
    if (!settings.enabled || !settings.token) return false;
    const expected = Buffer.from(settings.token);
    const supplied = Buffer.from(token);
    return expected.length === supplied.length && timingSafeEqual(expected, supplied);
  }

  previewChange(input: {
    actor?: string | undefined;
    expectedRevision: number;
    operations: unknown;
    reason: string;
  }): McpPreviewResult {
    const actor = input.actor?.trim().slice(0, 120) || "local-agent";
    const reason = input.reason.trim().slice(0, 1_000);
    if (!reason) throw new McpRepositoryError("invalid_input", "A reason is required.");
    const row = this.stateRow();
    const revision = toNumber(row.revision);
    if (revision !== input.expectedRevision) {
      throw new McpRepositoryError("revision_conflict", "State revision is stale.", {
        currentRevision: revision,
      });
    }
    const state = this.parseState(row);
    let preview: ReturnType<typeof previewDomainOperations>;
    try {
      preview = previewDomainOperations(state, input.operations);
    } catch (error) {
      if (error instanceof McpDomainError) {
        throw new McpRepositoryError(
          error.code === "not_found" ? "not_found" : "invalid_input",
          error.message,
          error.details,
          { cause: error },
        );
      }
      throw error;
    }
    if (
      preview.diff.length > MAX_PREVIEW_COLLECTION_SIZE ||
      preview.affectedIds.length > MAX_PREVIEW_COLLECTION_SIZE
    ) {
      throw new McpRepositoryError(
        "invalid_input",
        "The change is too large for one auditable preview; split it into smaller batches.",
        {
          affectedIdCount: preview.affectedIds.length,
          diffEntryCount: preview.diff.length,
          maximum: MAX_PREVIEW_COLLECTION_SIZE,
        },
      );
    }
    const previewId = newId();
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.parse(createdAt) + PREVIEW_TTL_MS).toISOString();
    this.transaction(() => {
      this.pruneExpiredPreviews();
      this.database
        .prepare(
          `INSERT INTO mcp_previews
           (id, base_revision, actor, reason, operations_json, before_organization_json,
            after_organization_json, diff_json, summary_json, affected_ids_json, created_at,
            expires_at, applied_change_id, result_json)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL)`,
        )
        .run(
          previewId,
          revision,
          actor,
          reason,
          JSON.stringify(input.operations),
          JSON.stringify(state.organization),
          JSON.stringify(preview.state.organization),
          JSON.stringify(preview.diff),
          JSON.stringify(preview.summary),
          JSON.stringify(preview.affectedIds),
          createdAt,
          expiresAt,
        );
    });
    return {
      affectedIds: preview.affectedIds,
      baseRevision: revision,
      diff: preview.diff,
      expiresAt,
      previewId,
      resolvedRefs: preview.resolvedRefs,
      summary: preview.summary,
    };
  }

  private previewRow(previewId: string): PreviewRow {
    const row = this.database.prepare("SELECT * FROM mcp_previews WHERE id = ?").get(previewId) as
      | PreviewRow
      | undefined;
    if (!row) throw new McpRepositoryError("not_found", "Preview was not found.", { previewId });
    return row;
  }

  applyPreview(previewId: string): McpApplyResult {
    let committedRevision: number | null = null;
    const result = this.transaction(() => {
      const preview = this.previewRow(previewId);
      if (preview.applied_change_id && preview.result_json)
        return parseJson<McpApplyResult>(preview.result_json);
      if (Date.parse(preview.expires_at) <= Date.now()) {
        throw new McpRepositoryError("preview_expired", "Preview has expired.", { previewId });
      }
      const current = this.stateRow();
      const baseRevision = toNumber(preview.base_revision);
      const currentRevision = toNumber(current.revision);
      if (currentRevision !== baseRevision) {
        throw new McpRepositoryError("revision_conflict", "Preview base revision is stale.", {
          currentRevision,
        });
      }
      const nextState = parseOrgToolsState({
        organization: parseJson(preview.after_organization_json),
        ui: parseJson(current.ui_json),
      });
      const resultRevision = currentRevision + 1;
      const changeId = newId();
      const summary = parseJson<McpChangeSummary>(preview.summary_json);
      const affectedIds = parseJson<string[]>(preview.affected_ids_json);
      const diff = parseJson<SemanticDiffEntry[]>(preview.diff_json);
      const createdAt = new Date().toISOString();
      const applyResult: McpApplyResult = {
        affectedIds,
        baseRevision,
        changeId,
        resultRevision,
        summary,
      };
      this.database
        .prepare(
          `UPDATE application_state
           SET organization_json = ?, revision = ?, updated_at = ? WHERE id = 1`,
        )
        .run(JSON.stringify(nextState.organization), resultRevision, createdAt);
      this.database
        .prepare(
          `INSERT INTO mcp_changes
           (id, actor, reason, forward_diff_json, inverse_diff_json, summary_json,
            affected_ids_json, base_revision, result_revision, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          changeId,
          preview.actor,
          preview.reason,
          JSON.stringify(diff),
          JSON.stringify(inverseDiff(diff)),
          JSON.stringify(summary),
          JSON.stringify(affectedIds),
          baseRevision,
          resultRevision,
          createdAt,
        );
      this.database
        .prepare("UPDATE mcp_previews SET applied_change_id = ?, result_json = ? WHERE id = ?")
        .run(changeId, JSON.stringify(applyResult), previewId);
      this.database
        .prepare(
          `UPDATE mcp_previews
           SET operations_json = '[]', before_organization_json = '{}',
               after_organization_json = '{}', diff_json = '[]',
               summary_json = '{}', affected_ids_json = '[]'
           WHERE id = ?`,
        )
        .run(previewId);
      this.pruneActivity();
      committedRevision = resultRevision;
      return applyResult;
    });
    if (committedRevision !== null)
      emitStateRevision({ revision: committedRevision, source: "mcp" });
    return result;
  }

  previewUndo(input: {
    actor?: string | undefined;
    changeId: string;
    expectedRevision: number;
    reason?: string | undefined;
  }): McpPreviewResult {
    const change = this.changeRow(input.changeId);
    const row = this.stateRow();
    const revision = toNumber(row.revision);
    if (revision !== input.expectedRevision) {
      throw new McpRepositoryError("revision_conflict", "State revision is stale.", {
        currentRevision: revision,
      });
    }
    const state = this.parseState(row);
    const forwardDiff = parseJson<SemanticDiffEntry[]>(change.forward_diff_json);
    let undo: ReturnType<typeof previewSelectiveUndo>;
    try {
      undo = previewSelectiveUndo(state, forwardDiff);
    } catch (error) {
      if (error instanceof McpDomainError) {
        throw new McpRepositoryError("undo_conflict", error.message, error.details, {
          cause: error,
        });
      }
      throw error;
    }
    const previewId = newId();
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.parse(createdAt) + PREVIEW_TTL_MS).toISOString();
    const actor = input.actor?.trim().slice(0, 120) || "local-user";
    const reason = input.reason?.trim().slice(0, 1_000) || `Undo change ${input.changeId}`;
    this.transaction(() => {
      this.pruneExpiredPreviews();
      this.database
        .prepare(
          `INSERT INTO mcp_previews
           (id, base_revision, actor, reason, operations_json, before_organization_json,
            after_organization_json, diff_json, summary_json, affected_ids_json, created_at,
            expires_at, applied_change_id, result_json)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL)`,
        )
        .run(
          previewId,
          revision,
          actor,
          reason,
          JSON.stringify([{ changeId: input.changeId, type: "undo.change" }]),
          JSON.stringify(state.organization),
          JSON.stringify(undo.state.organization),
          JSON.stringify(undo.diff),
          JSON.stringify(undo.summary),
          JSON.stringify(undo.affectedIds),
          createdAt,
          expiresAt,
        );
    });
    return {
      affectedIds: undo.affectedIds,
      baseRevision: revision,
      diff: undo.diff,
      expiresAt,
      previewId,
      resolvedRefs: {},
      summary: undo.summary,
    };
  }

  listChanges(input: { cursor?: string | undefined; limit?: number | undefined } = {}): {
    items: McpActivity[];
    nextCursor: string | null;
  } {
    const limit = Math.min(100, Math.max(1, Math.trunc(input.limit ?? 50)));
    const offset = input.cursor
      ? Number.parseInt(Buffer.from(input.cursor, "base64url").toString("utf8"), 10)
      : 0;
    if (!Number.isSafeInteger(offset) || offset < 0)
      throw new McpRepositoryError("invalid_input", "Activity cursor is invalid.");
    const rows = this.database
      .prepare("SELECT * FROM mcp_changes ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?")
      .all(limit + 1, offset) as ChangeRow[];
    const items = rows.slice(0, limit).map((row) => this.activityFromRow(row));
    const nextCursor =
      rows.length > limit ? Buffer.from(String(offset + limit)).toString("base64url") : null;
    return { items, nextCursor };
  }

  getChange(
    changeId: string,
  ): McpActivity & { forwardDiff: SemanticDiffEntry[]; inverseDiff: SemanticDiffEntry[] } {
    const row = this.changeRow(changeId);
    return {
      ...this.activityFromRow(row),
      forwardDiff: parseJson(row.forward_diff_json),
      inverseDiff: parseJson(row.inverse_diff_json),
    };
  }

  private changeRow(changeId: string): ChangeRow {
    const row = this.database.prepare("SELECT * FROM mcp_changes WHERE id = ?").get(changeId) as
      | ChangeRow
      | undefined;
    if (!row) throw new McpRepositoryError("not_found", "Change was not found.", { changeId });
    return row;
  }

  private activityFromRow(row: ChangeRow): McpActivity {
    return {
      actor: row.actor,
      affectedIds: parseJson(row.affected_ids_json),
      baseRevision: toNumber(row.base_revision),
      changeId: row.id,
      createdAt: row.created_at,
      reason: row.reason,
      resultRevision: toNumber(row.result_revision),
      summary: parseJson(row.summary_json),
    };
  }

  private pruneExpiredPreviews(): void {
    this.database
      .prepare("DELETE FROM mcp_previews WHERE applied_change_id IS NULL AND expires_at <= ?")
      .run(new Date().toISOString());
  }

  private pruneActivity(): void {
    this.database
      .prepare(
        `DELETE FROM mcp_changes WHERE id IN (
           SELECT id FROM mcp_changes ORDER BY created_at DESC, id DESC LIMIT -1 OFFSET ?
         )`,
      )
      .run(MAX_CHANGES);
    const sizeRow = this.database
      .prepare(
        `SELECT COALESCE(SUM(
           length(CAST(forward_diff_json AS BLOB)) +
           length(CAST(inverse_diff_json AS BLOB)) +
           length(CAST(summary_json AS BLOB)) +
           length(CAST(affected_ids_json AS BLOB)) +
           length(CAST(actor AS BLOB)) + length(CAST(reason AS BLOB))
         ), 0) AS bytes FROM mcp_changes`,
      )
      .get() as { bytes: number | bigint };
    let bytes = toNumber(sizeRow.bytes);
    while (bytes > MAX_CHANGE_BYTES) {
      const oldest = this.database
        .prepare(
          `SELECT id, length(CAST(forward_diff_json AS BLOB)) +
           length(CAST(inverse_diff_json AS BLOB)) +
           length(CAST(summary_json AS BLOB)) + length(CAST(affected_ids_json AS BLOB)) +
           length(CAST(actor AS BLOB)) + length(CAST(reason AS BLOB)) AS bytes
           FROM mcp_changes ORDER BY created_at ASC, id ASC LIMIT 1`,
        )
        .get() as { bytes: number | bigint; id: string } | undefined;
      if (!oldest) break;
      this.database.prepare("DELETE FROM mcp_changes WHERE id = ?").run(oldest.id);
      bytes -= toNumber(oldest.bytes);
    }
    this.database
      .prepare(
        `DELETE FROM mcp_previews
         WHERE applied_change_id IS NOT NULL
           AND applied_change_id NOT IN (SELECT id FROM mcp_changes)`,
      )
      .run();
  }
}

type McpRepositoryGlobal = typeof globalThis & {
  __orgToolsMcpRepository?: { path: string; repository: McpRepository };
};

export const getMcpRepository = (): McpRepository => {
  getStateRepository();
  const { databasePath } = resolveStateRuntimeConfig();
  const shared = globalThis as McpRepositoryGlobal;
  if (shared.__orgToolsMcpRepository?.path === databasePath)
    return shared.__orgToolsMcpRepository.repository;
  shared.__orgToolsMcpRepository?.repository.close();
  const repository = new McpRepository(databasePath);
  shared.__orgToolsMcpRepository = { path: databasePath, repository };
  return repository;
};

export const resetMcpRepositoryForTests = (): void => {
  if (process.env.NODE_ENV !== "test")
    throw new Error("The MCP repository can be reset only in tests.");
  const shared = globalThis as McpRepositoryGlobal;
  shared.__orgToolsMcpRepository?.repository.close();
  delete shared.__orgToolsMcpRepository;
};
