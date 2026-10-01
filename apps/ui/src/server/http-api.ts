import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import { PasswordPolicyError } from "@/server/auth-crypto";
import type { AuthenticatedSession } from "@/server/auth-service";
import {
  AuthenticationError,
  AuthService,
  clearSessionCookie,
  sessionCookieName,
} from "@/server/auth-service";
import { SessionRevokedError, withDatabaseTransaction } from "@/server/database";
import { AuthorizationDeniedError } from "@/server/organization-authorization";
import { appendAuditEvent, OrganizationConflictError } from "@/server/organization-repository";
import {
  parseCookie,
  RequestSecurityError,
  validateMutationRequest,
} from "@/server/request-security";
import { assertSchemaReady } from "@/server/schema-readiness";

type ApiRequestContext = {
  actorAccountId: string | null;
  action: string;
  correlationId: string;
};

const requestContext = new AsyncLocalStorage<ApiRequestContext>();

export const json = (value: unknown, init: ResponseInit = {}): Response => {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "no-store");
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("X-Content-Type-Options", "nosniff");
  return Response.json(value, { ...init, headers });
};

export const errorResponse = (error: unknown): Response => {
  if (error instanceof SessionRevokedError) {
    return json({ error: { code: "unauthenticated" } }, { status: 401 });
  }
  if (error instanceof AuthenticationError) {
    const status =
      error.code === "rate_limited"
        ? 429
        : error.code === "unauthenticated"
          ? 401
          : error.code === "password_change_required"
            ? 403
            : 400;
    return json({ error: { code: error.code } }, { status });
  }
  if (error instanceof RequestSecurityError) {
    return json({ error: { code: "invalid_request" } }, { status: 403 });
  }
  if (error instanceof AuthorizationDeniedError) {
    return json({ error: { code: "resource_unavailable" } }, { status: 404 });
  }
  if (error instanceof OrganizationConflictError) {
    return json(
      {
        error: {
          code: "revision_conflict",
          revision: error.revision,
          securityRevision: error.securityRevision,
        },
      },
      { status: 409 },
    );
  }
  if (error instanceof PasswordPolicyError) {
    return json({ error: { code: "invalid_password" } }, { status: 400 });
  }
  if (error instanceof SyntaxError)
    return json({ error: { code: "invalid_input" } }, { status: 400 });
  console.error("Org Tools request failed", {
    correlationId: requestContext.getStore()?.correlationId ?? randomUUID(),
    errorName: error instanceof Error ? error.name : "UnknownError",
  });
  return json({ error: { code: "server_error" } }, { status: 500 });
};

const auditFailedRequest = async (error: unknown): Promise<void> => {
  const context = requestContext.getStore();
  if (!context || (context.actorAccountId === null && error instanceof AuthenticationError)) return;
  await withDatabaseTransaction((client) =>
    appendAuditEvent(client, {
      action: context.action,
      actorAccountId: context.actorAccountId,
      correlationId: context.correlationId,
      result:
        error instanceof AuthorizationDeniedError || error instanceof RequestSecurityError
          ? "denied"
          : "failed",
      targetIds: [],
    }),
  ).catch(() => undefined);
};

export const withApi = async (
  operation: () => Promise<Response>,
  request?: Request,
): Promise<Response> =>
  requestContext.run(
    {
      action: request
        ? `api.${request.method.toLocaleLowerCase()}.${new URL(request.url).pathname}`
        : "api.request",
      actorAccountId: null,
      correlationId: randomUUID(),
    },
    async () => {
      try {
        await assertSchemaReady();
        return await operation();
      } catch (error) {
        await auditFailedRequest(error);
        return errorResponse(error);
      }
    },
  );

export const authenticateRequest = async (
  request: Request,
  options: { allowPasswordChange?: boolean; mutation?: boolean } = {},
): Promise<AuthenticatedSession> => {
  const service = new AuthService();
  const session = await service.authenticate(parseCookie(request, sessionCookieName()));
  const context = requestContext.getStore();
  if (context) context.actorAccountId = session.account.id;
  if (session.account.mustChangePassword && !options.allowPasswordChange) {
    throw new AuthenticationError("password_change_required");
  }
  if (options.mutation) {
    validateMutationRequest(request, [session.csrfHash, session.previousCsrfHash]);
  }
  return session;
};

export const clearCookieHeaders = (): HeadersInit => ({ "Set-Cookie": clearSessionCookie() });
