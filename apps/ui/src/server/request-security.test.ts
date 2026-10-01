import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { digestToken } from "@/server/auth-crypto";
import {
  RequestSecurityError,
  validateMutationRequest,
  validatePublicMutationRequest,
} from "@/server/request-security";

const previousEnvironment = { ...process.env };
const publicOrigin = "http://localhost:3000";

const request = (headers: Record<string, string> = {}) =>
  new Request(`${publicOrigin}/api/commands`, {
    headers: {
      "content-type": "application/json",
      origin: publicOrigin,
      "sec-fetch-site": "same-origin",
      ...headers,
    },
    method: "POST",
  });

beforeEach(() => {
  Object.assign(process.env, {
    ORG_TOOLS_BACKUP_PATH: "/tmp/org-tools-tests/backups",
    ORG_TOOLS_DB_HOST: "db",
    ORG_TOOLS_DB_PASSWORD: "database-app-password-with-32-chars",
    ORG_TOOLS_DB_PORT: "5432",
    ORG_TOOLS_DB_SSLMODE: "disable",
    ORG_TOOLS_DB_USER: "org_tools_app",
    ORG_TOOLS_PORT: "3000",
    ORG_TOOLS_PUBLIC_ORIGIN: publicOrigin,
    ORG_TOOLS_SETUP_TOKEN: "setup-token-with-at-least-thirty-two-characters",
    POSTGRES_DB: "org_tools",
  });
});

afterEach(() => {
  process.env = { ...previousEnvironment };
});

describe("mutation request security", () => {
  it("requires an exact origin, same-origin Fetch Metadata, and JSON", () => {
    expect(() => validatePublicMutationRequest(request())).not.toThrow();
    expect(() =>
      validatePublicMutationRequest(request({ origin: "https://other.example.test" })),
    ).toThrow(RequestSecurityError);
    expect(() =>
      validatePublicMutationRequest(request({ "sec-fetch-site": "cross-site" })),
    ).toThrow(RequestSecurityError);
    expect(() => validatePublicMutationRequest(request({ "content-type": "text/plain" }))).toThrow(
      RequestSecurityError,
    );
  });

  it("accepts the current and immediately previous session-bound CSRF token", () => {
    const current = "current-csrf-token";
    const previous = "previous-csrf-token";
    const hashes = [digestToken(current), digestToken(previous)] as const;
    expect(() =>
      validateMutationRequest(request({ "x-org-tools-csrf": current }), hashes),
    ).not.toThrow();
    expect(() =>
      validateMutationRequest(request({ "x-org-tools-csrf": previous }), hashes),
    ).not.toThrow();
    expect(() =>
      validateMutationRequest(request({ "x-org-tools-csrf": "unrelated" }), hashes),
    ).toThrow(RequestSecurityError);
  });
});
