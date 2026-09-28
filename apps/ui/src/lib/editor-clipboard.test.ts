import { describe, expect, test } from "vitest";

import {
  createEditorClipboardTextMarker,
  ORG_EDITOR_CLIPBOARD_WEB_FORMAT,
  parseEditorClipboardTextMarker,
  readEditorClipboardMarker,
  resolveEditorClipboardPasteSource,
  setEditorClipboardMarker,
} from "@/lib/editor-clipboard";

const createDataTransfer = () => {
  const values = new Map<string, string>();
  return {
    getData: (type: string) => values.get(type) ?? "",
    setData: (type: string, value: string) => {
      values.set(type, value);
    },
  } as DataTransfer;
};

describe("Editor clipboard marker", () => {
  test("writes an opaque custom marker with a plain-text fallback", () => {
    const dataTransfer = createDataTransfer();
    setEditorClipboardMarker(dataTransfer, "copy-token");

    expect(dataTransfer.getData(ORG_EDITOR_CLIPBOARD_WEB_FORMAT)).toBe("copy-token");
    expect(dataTransfer.getData("text/plain")).toBe(createEditorClipboardTextMarker("copy-token"));
    expect(readEditorClipboardMarker(dataTransfer)).toBe("copy-token");
    expect(parseEditorClipboardTextMarker("external text")).toBeNull();
  });

  test("falls back to plain text when the custom format is unavailable", () => {
    const marker = createEditorClipboardTextMarker("fallback-token");
    const dataTransfer = {
      getData: (type: string) => (type === "text/plain" ? marker : ""),
    } as DataTransfer;

    expect(readEditorClipboardMarker(dataTransfer)).toBe("fallback-token");
  });
});

describe("Editor clipboard paste arbitration", () => {
  test.each([
    {
      currentToken: "current",
      expected: "structure",
      hasImage: true,
      markerToken: "current",
    },
    { currentToken: "current", expected: "image", hasImage: true, markerToken: null },
    { currentToken: "current", expected: "foreign", hasImage: false, markerToken: "other" },
    { currentToken: "current", expected: "foreign", hasImage: false, markerToken: null },
    { currentToken: null, expected: "image", hasImage: true, markerToken: "old" },
  ] as const)("resolves $expected for the current clipboard payload", (value) => {
    expect(resolveEditorClipboardPasteSource(value)).toBe(value.expected);
  });
});
