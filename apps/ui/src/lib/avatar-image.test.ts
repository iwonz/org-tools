import { describe, expect, it } from "vitest";

import { LocalizedError } from "@/i18n/messages";
import {
  AVATAR_OUTPUT_SIZE,
  avatarDataUrlToBlob,
  encodeAvatarCanvasBlob,
  isSupportedAvatarBlob,
  MAX_AVATAR_PREVIEW_DIMENSION,
  MAX_AVATAR_SOURCE_BYTES,
  MAX_AVATAR_SOURCE_PIXELS,
} from "@/lib/avatar-image";

const createCanvasEncoder = (outputs: Array<Blob | Error | null>, requestedTypes: string[]) =>
  ({
    toBlob: (callback: BlobCallback, type?: string) => {
      requestedTypes.push(type ?? "");
      const output = outputs.shift() ?? null;
      if (output instanceof Error) throw output;
      callback(output);
    },
  }) as HTMLCanvasElement;

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

  it("prefers WebP and accepts a browser-selected PNG from the preferred attempt", async () => {
    const requestedTypes: string[] = [];
    const webp = new Blob(["webp"], { type: "image/webp" });
    await expect(
      encodeAvatarCanvasBlob(createCanvasEncoder([webp], requestedTypes), 0.9),
    ).resolves.toBe(webp);
    expect(requestedTypes).toEqual(["image/webp"]);

    requestedTypes.length = 0;
    const png = new Blob(["png"], { type: "image/png" });
    await expect(
      encodeAvatarCanvasBlob(createCanvasEncoder([png], requestedTypes), 0.9),
    ).resolves.toBe(png);
    expect(requestedTypes).toEqual(["image/webp"]);
  });

  it("retries PNG after a null, throwing, or unsupported WebP result", async () => {
    for (const preferredResult of [null, new Error("encoder unavailable"), new Blob([])]) {
      const requestedTypes: string[] = [];
      const png = new Blob(["png"], { type: "image/png" });
      await expect(
        encodeAvatarCanvasBlob(createCanvasEncoder([preferredResult, png], requestedTypes), 0.9),
      ).resolves.toBe(png);
      expect(requestedTypes).toEqual(["image/webp", "image/png"]);
    }
  });

  it("reports an owned error only after both local encoders fail", async () => {
    const requestedTypes: string[] = [];
    await expect(
      encodeAvatarCanvasBlob(createCanvasEncoder([null, null], requestedTypes), 0.9),
    ).rejects.toBeInstanceOf(LocalizedError);
    expect(requestedTypes).toEqual(["image/webp", "image/png"]);
  });
});
