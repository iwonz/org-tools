import type { OrgToolsState } from "@org-tools/types";

import { parseOrgToolsState, parseOrgToolsUiState } from "@/lib/org-file";
import type { StateApiError, StateApiErrorCode, StatePutApiRequest } from "@/lib/state-runtime";
import { StateConfigurationError } from "@/server/state-config";
import { StateRepositoryError } from "@/server/state-repository";

const LOOPBACK_HOSTNAMES = new Set(["127.0.0.1", "::1", "[::1]", "localhost"]);
type ApiStatus = 400 | 403 | 409 | 415 | 500 | 503;

export class StateApiRequestError extends Error {
  readonly code: StateApiErrorCode;
  readonly status: ApiStatus;

  constructor(code: StateApiErrorCode, message: string, status: ApiStatus) {
    super(message);
    this.name = "StateApiRequestError";
    this.code = code;
    this.status = status;
  }
}

const parseHost = (host: string): string => {
  try {
    return new URL(`http://${host}`).hostname;
  } catch {
    throw new StateApiRequestError("invalid_input", "Request Host is invalid.", 403);
  }
};

export const assertStateApiRequest = (request: Request, mutation = false): void => {
  const host = request.headers.get("host");
  if (!host || !LOOPBACK_HOSTNAMES.has(parseHost(host))) {
    throw new StateApiRequestError("invalid_input", "State API is loopback-only.", 403);
  }
  if (!mutation) return;
  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (contentType !== "application/json") {
    throw new StateApiRequestError("invalid_input", "Expected application/json.", 415);
  }
  const originValue = request.headers.get("origin");
  if (!originValue) {
    throw new StateApiRequestError("invalid_input", "Mutation Origin is required.", 403);
  }
  try {
    const origin = new URL(originValue);
    if (
      origin.host !== host ||
      !LOOPBACK_HOSTNAMES.has(origin.hostname) ||
      (origin.protocol !== "http:" && origin.protocol !== "https:")
    ) {
      throw new Error("Origin mismatch.");
    }
  } catch {
    throw new StateApiRequestError("invalid_input", "Mutation Origin must match Host.", 403);
  }
};

export const readJsonValue = async (request: Request): Promise<unknown> => {
  try {
    return await request.json();
  } catch {
    throw new StateApiRequestError("invalid_input", "Request body is not valid JSON.", 400);
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const hasExactKeys = (value: Record<string, unknown>, keys: readonly string[]) =>
  Object.keys(value).sort().join("\0") === [...keys].sort().join("\0");

export const parseStatePutRequest = (input: unknown): StatePutApiRequest => {
  if (
    !isRecord(input) ||
    typeof input.scope !== "string" ||
    !Number.isSafeInteger(input.expectedRevision) ||
    (input.expectedRevision as number) < 1
  ) {
    throw new StateApiRequestError("invalid_input", "State update shape is invalid.", 400);
  }
  try {
    if (input.scope === "all" && hasExactKeys(input, ["expectedRevision", "scope", "state"])) {
      return {
        expectedRevision: input.expectedRevision as number,
        scope: "all",
        state: parseOrgToolsState(input.state),
      };
    }
    if (input.scope === "ui" && hasExactKeys(input, ["expectedRevision", "scope", "ui"])) {
      return {
        expectedRevision: input.expectedRevision as number,
        scope: "ui",
        ui: parseOrgToolsUiState(input.ui),
      };
    }
    if (
      input.scope === "organization" &&
      hasExactKeys(input, ["expectedRevision", "organization", "scope"]) &&
      isRecord(input.organization)
    ) {
      return {
        expectedRevision: input.expectedRevision as number,
        organization: input.organization as OrgToolsState["organization"],
        scope: "organization",
      };
    }
  } catch {
    throw new StateApiRequestError("invalid_state", "State update is invalid.", 400);
  }
  throw new StateApiRequestError("invalid_input", "State update shape is invalid.", 400);
};

export const jsonResponse = (value: unknown, init?: ResponseInit): Response => {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "no-store");
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(value), { ...init, headers });
};

const statusForCode = (code: StateApiErrorCode): ApiStatus => {
  if (code === "invalid_input" || code === "invalid_state") return 400;
  if (code === "corrupt_stored_state") return 500;
  return 503;
};

export const stateApiErrorResponse = (error: unknown): Response => {
  if (error instanceof StateApiRequestError) {
    return jsonResponse({ error: { code: error.code } } satisfies StateApiError, {
      status: error.status,
    });
  }
  if (error instanceof StateRepositoryError) {
    const details =
      error.code === "revision_conflict" &&
      typeof error.details === "object" &&
      error.details !== null &&
      "currentRevision" in error.details &&
      Number.isSafeInteger(error.details.currentRevision)
        ? { currentRevision: error.details.currentRevision as number }
        : {};
    return jsonResponse({ error: { code: error.code, ...details } } satisfies StateApiError, {
      status: error.code === "revision_conflict" ? 200 : statusForCode(error.code),
    });
  }
  if (error instanceof StateConfigurationError) {
    return jsonResponse({ error: { code: "database_unavailable" } } satisfies StateApiError, {
      status: 503,
    });
  }
  return jsonResponse({ error: { code: "database_unavailable" } } satisfies StateApiError, {
    status: 503,
  });
};

export const withStateApi = async (
  request: Request,
  operation: () => unknown | Promise<unknown>,
  options?: { mutation?: boolean },
): Promise<Response> => {
  try {
    assertStateApiRequest(request, options?.mutation);
    return jsonResponse(await operation());
  } catch (error) {
    return stateApiErrorResponse(error);
  }
};
