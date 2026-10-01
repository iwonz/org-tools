import { describe, expect, it } from "vitest";

import {
  assertPasswordPolicy,
  createOpaqueToken,
  createSessionCsrfToken,
  hashPassword,
  normalizeAccountEmail,
  safeTokenEqual,
  verifyPassword,
} from "@/server/auth-crypto";

describe("authentication crypto", () => {
  it("normalizes account email deterministically", () => {
    expect(normalizeAccountEmail("  USER＠EXAMPLE.TEST ")).toBe("user@example.test");
  });

  it("counts Unicode code points for password bounds", () => {
    expect(() => assertPasswordPolicy("🙂".repeat(15))).not.toThrow();
    expect(() => assertPasswordPolicy("🙂".repeat(14))).toThrow();
    expect(() => assertPasswordPolicy("x".repeat(129))).toThrow();
  });

  it("hashes and verifies Argon2id credentials", async () => {
    const password = "correct horse battery staple";
    const encoded = await hashPassword(password);
    expect(encoded.startsWith("$argon2id$")).toBe(true);
    await expect(verifyPassword(encoded, password)).resolves.toMatchObject({ valid: true });
    await expect(verifyPassword(encoded, "incorrect password value")).resolves.toMatchObject({
      valid: false,
    });
  });

  it("creates opaque 256-bit tokens and compares them safely", () => {
    const token = createOpaqueToken();
    expect(Buffer.from(token, "base64url")).toHaveLength(32);
    expect(safeTokenEqual(token, token)).toBe(true);
    expect(safeTokenEqual(token, createOpaqueToken())).toBe(false);
  });

  it("derives a stable session-bound CSRF token", () => {
    const secret = "database-app-password-with-32-chars";
    const first = createSessionCsrfToken("10000000-0000-4000-8000-000000000001", secret);
    expect(Buffer.from(first, "base64url")).toHaveLength(32);
    expect(createSessionCsrfToken("10000000-0000-4000-8000-000000000001", secret)).toBe(first);
    expect(createSessionCsrfToken("20000000-0000-4000-8000-000000000002", secret)).not.toBe(first);
  });
});
