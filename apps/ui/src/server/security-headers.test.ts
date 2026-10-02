import { describe, expect, it } from "vitest";

import { securityHeaders } from "@/server/security-headers";

const headerMap = (environment: string | undefined) =>
  new Map(securityHeaders(environment).map(({ key, value }) => [key, value]));

describe("security headers", () => {
  it("locks production pages to local application resources", () => {
    const headers = headerMap("production");
    expect(headers.get("Content-Security-Policy")).toContain("default-src 'self'");
    expect(headers.get("Content-Security-Policy")).toContain("frame-ancestors 'none'");
    expect(headers.get("Content-Security-Policy")).not.toContain("'unsafe-eval'");
    expect(headers.get("X-Frame-Options")).toBe("DENY");
    expect(headers.get("Referrer-Policy")).toBe("no-referrer");
    expect(headers.get("Permissions-Policy")).toContain("camera=()");
  });

  it("allows webpack evaluation only in the development runtime", () => {
    expect(headerMap("development").get("Content-Security-Policy")).toContain("'unsafe-eval'");
  });
});
