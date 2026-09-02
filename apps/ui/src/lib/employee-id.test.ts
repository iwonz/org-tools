import { createHash } from "node:crypto";
import { describe, expect, test } from "vitest";

import {
  createEmployeeId,
  createEmployeeIdentityKey,
  isEmployeeId,
  sha256Hex,
} from "@/lib/employee-id";

describe("Employee identity", () => {
  test.each([
    ["", "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"],
    ["abc", "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"],
    [
      "The quick brown fox jumps over the lazy dog",
      "d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592",
    ],
  ])("matches the SHA-256 known answer for %j", (input, expected) => {
    expect(sha256Hex(input)).toBe(expected);
  });

  test("matches Node crypto for Unicode input", () => {
    const input =
      "\u0418\u0432\u0430\u043d\u001f\u041f\u0435\u0442\u0440\u043e\u0432\u001fivan@example.test";
    expect(sha256Hex(input)).toBe(createHash("sha256").update(input, "utf8").digest("hex"));
  });

  test("normalizes compatibility, case, and whitespace", () => {
    const first = { email: " User@Example.Test ", firstName: "ＡNNA", lastName: " Van   Dyke " };
    const second = { email: "user@example.test", firstName: "anna", lastName: "van dyke" };
    expect(createEmployeeIdentityKey(first)).toBe(createEmployeeIdentityKey(second));
    expect(createEmployeeId(first)).toBe(createEmployeeId(second));
    expect(isEmployeeId(createEmployeeId(first))).toBe(true);
    expect(isEmployeeId(`${createEmployeeId(first)}0`)).toBe(false);
  });
});
