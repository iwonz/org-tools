import { describe, expect, it } from "vitest";

import { createUuid, isUuid } from "@/lib/uuid";

describe("UUID helpers", () => {
  it("uses the supplied cryptographic UUID provider", () => {
    const value = "00000000-0000-4000-8000-000000000123";
    expect(createUuid({ randomUUID: () => value })).toBe(value);
    expect(isUuid(value)).toBe(true);
  });

  it("fails closed when platform cryptography is unavailable", () => {
    expect(() => createUuid(null)).toThrow("cryptographically secure UUID generator");
  });

  it("rejects malformed identifiers", () => {
    expect(isUuid("00000000-0000-0000-0000-000000000000")).toBe(false);
    expect(isUuid("not-a-uuid")).toBe(false);
  });
});
