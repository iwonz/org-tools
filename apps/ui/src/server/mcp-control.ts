import { McpRepositoryError, type McpRepositoryErrorCode } from "@/server/mcp-repository";
import { jsonResponse, StateApiRequestError } from "@/server/state-api";
import { StateConfigurationError } from "@/server/state-config";
import { StateRepositoryError } from "@/server/state-repository";

export type McpControlErrorCode = McpRepositoryErrorCode | "corrupt_stored_state" | "invalid_state";

type McpControlError = {
  error: {
    code: McpControlErrorCode;
    currentRevision?: number;
    conflicts?: Array<{
      entityId: string;
      entityType: string;
      field: string | null;
      viewId: string | null;
    }>;
  };
};

const safeDetails = (error: McpRepositoryError): McpControlError["error"] => {
  const result: McpControlError["error"] = { code: error.code };
  if (typeof error.details !== "object" || error.details === null) return result;
  if (
    "currentRevision" in error.details &&
    Number.isSafeInteger(error.details.currentRevision) &&
    (error.details.currentRevision as number) >= 1
  ) {
    result.currentRevision = error.details.currentRevision as number;
  }
  if ("conflicts" in error.details && Array.isArray(error.details.conflicts)) {
    result.conflicts = error.details.conflicts.slice(0, 50).flatMap((value) => {
      if (typeof value !== "object" || value === null) return [];
      const record = value as Record<string, unknown>;
      if (
        typeof record.entityId !== "string" ||
        typeof record.entityType !== "string" ||
        !(record.field === null || typeof record.field === "string") ||
        !(record.viewId === null || typeof record.viewId === "string")
      ) {
        return [];
      }
      return [
        {
          entityId: record.entityId,
          entityType: record.entityType,
          field: record.field,
          viewId: record.viewId,
        },
      ];
    });
  }
  return result;
};

export const mcpControlErrorResponse = (
  error: unknown,
  options?: { expectedUndoConflict?: boolean },
): Response => {
  if (error instanceof StateApiRequestError) {
    return jsonResponse({ error: { code: "invalid_input" } } satisfies McpControlError, {
      status: error.status,
    });
  }
  if (error instanceof McpRepositoryError) {
    if (options?.expectedUndoConflict && error.code === "undo_conflict") {
      return jsonResponse({ error: safeDetails(error) } satisfies McpControlError);
    }
    const status =
      error.code === "revision_conflict" || error.code === "undo_conflict"
        ? 409
        : error.code === "not_found"
          ? 404
          : error.code === "invalid_input"
            ? 400
            : error.code === "mcp_disabled"
              ? 403
              : error.code === "preview_expired"
                ? 410
                : 503;
    return jsonResponse({ error: safeDetails(error) } satisfies McpControlError, { status });
  }
  if (error instanceof StateRepositoryError) {
    const code =
      error.code === "corrupt_stored_state" || error.code === "invalid_state"
        ? error.code
        : "database_unavailable";
    return jsonResponse({ error: { code } } satisfies McpControlError, { status: 503 });
  }
  if (error instanceof StateConfigurationError) {
    return jsonResponse({ error: { code: "database_unavailable" } } satisfies McpControlError, {
      status: 503,
    });
  }
  return jsonResponse({ error: { code: "database_unavailable" } } satisfies McpControlError, {
    status: 503,
  });
};
