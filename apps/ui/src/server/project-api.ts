import { isUuid } from "@/lib/employee-data";
import type { ProjectApiError, ProjectApiErrorCode } from "@/lib/project-workspace";
import { ProjectConfigurationError } from "@/server/project-config";
import { ProjectRepositoryError } from "@/server/project-repository";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;
const LOOPBACK_HOSTNAMES = new Set(["127.0.0.1", "::1", "[::1]", "localhost"]);

type ApiStatus = 400 | 403 | 404 | 409 | 415 | 500 | 503;

export class ProjectApiRequestError extends Error {
  readonly code: ProjectApiErrorCode;
  readonly status: ApiStatus;

  constructor(code: ProjectApiErrorCode, message: string, status: ApiStatus) {
    super(message);
    this.name = "ProjectApiRequestError";
    this.code = code;
    this.status = status;
  }
}

const parseHost = (host: string): string => {
  try {
    return new URL(`http://${host}`).hostname;
  } catch {
    throw new ProjectApiRequestError("invalid_input", "Request Host is invalid.", 403);
  }
};

export const assertProjectApiRequest = (request: Request, mutation = false): void => {
  const host = request.headers.get("host");
  if (!host || !LOOPBACK_HOSTNAMES.has(parseHost(host))) {
    throw new ProjectApiRequestError(
      "invalid_input",
      "Project API is available only from the local runtime.",
      403,
    );
  }
  if (!mutation) return;

  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (contentType !== "application/json") {
    throw new ProjectApiRequestError(
      "invalid_input",
      "Mutation requests must use application/json.",
      415,
    );
  }
  const originValue = request.headers.get("origin");
  if (!originValue) {
    throw new ProjectApiRequestError("invalid_input", "Mutation Origin is required.", 403);
  }
  try {
    const origin = new URL(originValue);
    if (
      origin.host !== host ||
      !LOOPBACK_HOSTNAMES.has(origin.hostname) ||
      (origin.protocol !== "http:" && origin.protocol !== "https:")
    ) {
      throw new Error("Origin does not match Host.");
    }
  } catch {
    throw new ProjectApiRequestError(
      "invalid_input",
      "Mutation Origin must match the local runtime.",
      403,
    );
  }
};

export const readJsonObject = async (
  request: Request,
  exactKeys: readonly string[],
): Promise<Record<string, unknown>> => {
  let value: unknown;
  try {
    value = await request.json();
  } catch {
    throw new ProjectApiRequestError("invalid_input", "Request body is not valid JSON.", 400);
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ProjectApiRequestError("invalid_input", "Request body must be a JSON object.", 400);
  }
  const actualKeys = Object.keys(value).sort();
  const expectedKeys = [...exactKeys].sort();
  if (
    actualKeys.length !== expectedKeys.length ||
    !actualKeys.every((key, index) => key === expectedKeys[index])
  ) {
    throw new ProjectApiRequestError("invalid_input", "Request body shape is invalid.", 400);
  }
  return value as Record<string, unknown>;
};

export function assertProjectId(id: unknown): asserts id is string {
  if (!isUuid(id)) {
    throw new ProjectApiRequestError("invalid_input", "Project ID is invalid.", 400);
  }
}

export const jsonResponse = (value: unknown, init?: ResponseInit): Response => {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", NO_STORE_HEADERS["Cache-Control"]);
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(value), { ...init, headers });
};

const statusForRepositoryCode = (code: ProjectApiErrorCode): ApiStatus => {
  switch (code) {
    case "duplicate_name":
    case "invalid_input":
    case "invalid_state":
      return 400;
    case "not_found":
      return 404;
    case "revision_conflict":
      return 409;
    case "corrupt_stored_state":
      return 500;
    case "database_unavailable":
      return 503;
  }
};

export const projectApiErrorResponse = (error: unknown): Response => {
  if (error instanceof ProjectApiRequestError) {
    return jsonResponse(
      { error: { code: error.code, message: error.message } },
      { status: error.status },
    );
  }
  if (error instanceof ProjectRepositoryError) {
    const body: ProjectApiError = {
      error: { code: error.code, message: error.message },
    };
    if (error.currentRevision !== undefined) {
      body.error.currentRevision = error.currentRevision;
    }
    return jsonResponse(body, { status: statusForRepositoryCode(error.code) });
  }
  if (error instanceof ProjectConfigurationError) {
    return jsonResponse(
      {
        error: {
          code: "database_unavailable",
          message: "The Org Tools database configuration is unavailable.",
        },
      } satisfies ProjectApiError,
      { status: 503 },
    );
  }
  return jsonResponse(
    {
      error: {
        code: "database_unavailable",
        message: "The Org Tools database is unavailable.",
      },
    } satisfies ProjectApiError,
    { status: 503 },
  );
};

export const withProjectApi = async (
  request: Request,
  operation: () => unknown | Promise<unknown>,
  options?: { mutation?: boolean; status?: number },
): Promise<Response> => {
  try {
    assertProjectApiRequest(request, options?.mutation);
    return jsonResponse(await operation(), { status: options?.status ?? 200 });
  } catch (error) {
    return projectApiErrorResponse(error);
  }
};
