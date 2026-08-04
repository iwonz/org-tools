import { describe, expect, it } from "vitest";

import { LocalizedError } from "@/i18n/messages";
import {
  AVATAR_OUTPUT_SIZE,
  avatarDataUrlToBlob,
  isSupportedAvatarBlob,
  MAX_AVATAR_PREVIEW_DIMENSION,
  MAX_AVATAR_SOURCE_BYTES,
  MAX_AVATAR_SOURCE_PIXELS,
} from "@/lib/avatar-image";

describe("avatar image helpers", () => {
  it("accepts only the supported local image media types", () => {
    expect(isSupportedAvatarBlob(new Blob([], { type: "image/png" }))).toBe(true);
    expect(isSupportedAvatarBlob(new Blob([], { type: "image/jpeg" }))).toBe(true);
    expect(isSupportedAvatarBlob(new Blob([], { type: "image/webp" }))).toBe(true);
    expect(isSupportedAvatarBlob(new Blob([], { type: "image/svg+xml" }))).toBe(false);
  });

  it("converts a validated embedded avatar into a local Blob", () => {
    const blob = avatarDataUrlToBlob("data:image/webp;base64,aGVsbG8=");

    expect(blob.type).toBe("image/webp");
    expect(blob.size).toBe(5);
  });

  it("rejects unsupported or malformed embedded sources with an owned error", () => {
    expect(() => avatarDataUrlToBlob("data:image/svg+xml;base64,PHN2Zz4=")).toThrowError(
      LocalizedError,
    );
    expect(() => avatarDataUrlToBlob("not-an-image")).toThrowError(LocalizedError);
  });

  it("keeps source, decode, preview, and output bounds explicit", () => {
    expect(MAX_AVATAR_SOURCE_BYTES).toBe(25 * 1024 * 1024);
    expect(MAX_AVATAR_SOURCE_PIXELS).toBe(40_000_000);
    expect(MAX_AVATAR_PREVIEW_DIMENSION).toBe(4096);
    expect(AVATAR_OUTPUT_SIZE).toBe(512);
  });
});
