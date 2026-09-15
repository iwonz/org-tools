import { describe, expect, test } from "vitest";

import {
  loadOrgEditorCanvasImageFile,
  parseOrgEditorCanvasImageDataUrl,
} from "@/lib/org-editor-canvas-image";

const ONE_PIXEL_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAF/gL+3q1HAAAAAElFTkSuQmCC";

const toDataUrl = (mimeType: string, bytes: Uint8Array) => {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `data:${mimeType};base64,${btoa(binary)}`;
};

describe("Org Editor embedded canvas images", () => {
  test("validates local PNG dimensions and bytes", () => {
    const source = parseOrgEditorCanvasImageDataUrl(ONE_PIXEL_PNG);
    expect(source).toMatchObject({ height: 1, mimeType: "image/png", width: 1 });
    expect(source?.bytes.byteLength).toBeGreaterThan(20);
  });

  test("rejects remote, unsupported, malformed, and dimensionless values", () => {
    expect(parseOrgEditorCanvasImageDataUrl("https://example.test/image.png")).toBeNull();
    expect(parseOrgEditorCanvasImageDataUrl("data:image/svg+xml;base64,PHN2Zz4=")).toBeNull();
    expect(parseOrgEditorCanvasImageDataUrl("data:image/png;base64,aGVsbG8=")).toBeNull();
    expect(parseOrgEditorCanvasImageDataUrl("data:image/png;base64,***")).toBeNull();
    expect(parseOrgEditorCanvasImageDataUrl("data:image/png;base64,aA")).toBeNull();
  });

  test("reads bounded JPEG and WebP headers and rejects oversized dimensions", () => {
    const jpeg = new Uint8Array(21);
    jpeg.set([0xff, 0xd8, 0xff, 0xc0, 0, 17, 8, 0, 2, 0, 3]);
    expect(parseOrgEditorCanvasImageDataUrl(toDataUrl("image/jpeg", jpeg))).toMatchObject({
      height: 2,
      width: 3,
    });

    const webp = new Uint8Array(30);
    webp.set(
      [..."RIFF"].map((character) => character.charCodeAt(0)),
      0,
    );
    webp.set(
      [..."WEBPVP8X"].map((character) => character.charCodeAt(0)),
      8,
    );
    webp.set([2, 0, 0, 1, 0, 0], 24);
    expect(parseOrgEditorCanvasImageDataUrl(toDataUrl("image/webp", webp))).toMatchObject({
      height: 2,
      width: 3,
    });

    const pngPayload = ONE_PIXEL_PNG.split(",")[1];
    if (!pngPayload) throw new Error("Expected PNG payload.");
    const png = Uint8Array.from(atob(pngPayload), (character) => character.charCodeAt(0));
    const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
    view.setUint32(16, 10_000);
    view.setUint32(20, 5_000);
    expect(parseOrgEditorCanvasImageDataUrl(toDataUrl("image/png", png))).toBeNull();
  });

  test("loads a supported local Blob without a remote request", async () => {
    const parsed = parseOrgEditorCanvasImageDataUrl(ONE_PIXEL_PNG);
    expect(parsed).not.toBeNull();
    if (!parsed) return;
    const blob = new Blob([parsed.bytes], { type: "image/png" });
    await expect(loadOrgEditorCanvasImageFile(blob)).resolves.toMatchObject({
      height: 1,
      mimeType: "image/png",
      width: 1,
    });
    await expect(
      loadOrgEditorCanvasImageFile(new Blob([parsed.bytes], { type: "image/svg+xml" })),
    ).resolves.toBeNull();
  });
});
