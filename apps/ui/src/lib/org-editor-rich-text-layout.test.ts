import { describe, expect, it, vi } from "vitest";

import {
  cloneOrgEditorCanvasElement,
  createOrgEditorTextElement,
  getOrgEditorRichTextLayout,
} from "@/lib/org-editor-canvas";
import { createOrgEditorRichTextLayoutEngine } from "@/lib/org-editor-rich-text-layout";

const createMeasureContext = () => {
  const measureText = vi.fn((value: string) => ({ width: [...value].length * 9 }));
  const context = { font: "", measureText } as unknown as CanvasRenderingContext2D;
  return { context, measureText };
};

describe("Org Editor rich-text layout engine", () => {
  it("reuses one element layout and bounded grapheme measurements", () => {
    const { context, measureText } = createMeasureContext();
    const engine = createOrgEditorRichTextLayoutEngine({
      createContext: () => context,
      maxMeasureCacheEntries: 2,
    });
    const element = { ...createOrgEditorTextElement({ x: 0, y: 0 }), text: "aaaa" };

    const first = engine.getLayout(element);
    expect(engine.getLayout(element)).toBe(first);
    expect(measureText).toHaveBeenCalledTimes(1);

    const clone = cloneOrgEditorCanvasElement(element);
    if (clone.type !== "text") throw new Error("Expected Text clone.");
    expect(engine.getLayout(clone)).toEqual(first);
    expect(measureText).toHaveBeenCalledTimes(1);

    engine.getLayout({ ...clone, text: "abc" });
    expect(engine.getMeasureCacheSize()).toBeLessThanOrEqual(2);
    engine.invalidateFonts();
    expect(engine.getMeasureCacheSize()).toBe(0);
    engine.getLayout(element);
    expect(measureText.mock.calls.length).toBeGreaterThan(1);
  });

  it("matches the canonical cold layout for Unicode and mixed formatting", () => {
    const { context } = createMeasureContext();
    const engine = createOrgEditorRichTextLayoutEngine({ createContext: () => context });
    const element = {
      ...createOrgEditorTextElement({ x: 0, y: 0 }),
      formatRuns: [
        {
          end: 5,
          start: 0,
          typography: {
            color: "blue" as const,
            fontFamily: "Georgia",
            fontSize: 24,
            fontWeight: 700 as const,
          },
        },
      ],
      text: "A👩🏽‍💻 B\nsecond line",
      width: 120,
    };
    const cold = getOrgEditorRichTextLayout({
      autoWidth: element.autoWidth,
      formatRuns: element.formatRuns,
      height: element.height,
      measure: (value) => [...value].length * 9,
      text: element.text,
      typography: element.typography,
      width: element.width,
    });

    expect(engine.getLayout(element)).toEqual(cold);
  });

  it("extends a fitting final line without recomputing the stable long-text prefix", () => {
    const { context } = createMeasureContext();
    const engine = createOrgEditorRichTextLayoutEngine({ createContext: () => context });
    const element = {
      ...createOrgEditorTextElement({ x: 0, y: 0 }),
      text: "long performance text ".repeat(3_000).slice(0, 60_000),
    };
    const previous = engine.getLayout(element);
    const appended = { ...element, text: `${element.text}z` };
    const incremental = engine.getLayout(appended);
    const cold = getOrgEditorRichTextLayout({
      autoWidth: appended.autoWidth,
      formatRuns: appended.formatRuns,
      height: appended.height,
      measure: (value) => [...value].length * 9,
      text: appended.text,
      typography: appended.typography,
      width: appended.width,
    });

    expect(incremental).toEqual(cold);
    expect(incremental.lines[0]).toBe(previous.lines[0]);
  });
});
