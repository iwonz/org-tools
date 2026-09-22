import type { EmployeeTagColor } from "@org-tools/types";
import { describe, expect, it } from "vitest";
import { createUuid } from "@/lib/employee-data";
import { createDefaultOrgEditorState, createOrgEditorUnitFromScratch } from "@/lib/org-editor";
import {
  createOrgEditorArrowElement,
  createOrgEditorStickerElement,
  createOrgEditorTextElement,
} from "@/lib/org-editor-canvas";
import {
  collectUsedEmployeeTagColors,
  customTagColorSurfaceStyle,
  decodeTagColorDraft,
  employeeTagColorToHex,
  encodeTagColorDraft,
  formatTagColorInput,
  getStickerColorStyle,
  getTagColorCanvasStyle,
  hexToHsv,
  hsvToHex,
  isCustomEmployeeTagColor,
  normalizeCustomEmployeeTagColor,
  parseTagColorInput,
  tagColorInputPlaceholder,
  tagColorOpacityByteToPercent,
  tagColorOpacityPercentToByte,
  tagColorSurfaceClassName,
} from "@/lib/tag-color";

const COLORS: EmployeeTagColor[] = [
  "amber",
  "blue",
  "cyan",
  "green",
  "orange",
  "red",
  "rose",
  "teal",
];

describe("tagColorSurfaceClassName", () => {
  it("collects every durable Tag and View color in stable appearance order", () => {
    const text = createOrgEditorTextElement({ x: 0, y: 0 });
    const sticker = createOrgEditorStickerElement({ x: 0, y: 0 });
    const arrow = createOrgEditorArrowElement({ x: 0, y: 0 }, { x: 100, y: 100 });
    const firstView = {
      ...createDefaultOrgEditorState(),
      canvasElements: [
        {
          ...text,
          fillColor: "cyan" as const,
          formatRuns: [
            {
              end: 1,
              start: 0,
              typography: { ...text.typography, color: "orange" as const },
            },
          ],
          typography: { ...text.typography, color: "red" as const },
        },
        {
          ...sticker,
          backgroundColor: "rose" as const,
          formatRuns: [
            {
              end: 1,
              start: 0,
              typography: { ...sticker.typography, color: "#123456ff" as const },
            },
          ],
          typography: { ...sticker.typography, color: "teal" as const },
        },
        { ...arrow, strokeColor: "#123456" as const },
      ],
      settings: {
        ...createDefaultOrgEditorState().settings,
        distributedColor: "green" as const,
        undistributedColor: "amber" as const,
      },
      units: [
        createOrgEditorUnitFromScratch({
          name: "Example Unit",
          openPositions: [
            {
              backgroundColor: "#7c3aed00",
              id: createUuid(),
              tags: [],
              title: "Open position",
            },
          ],
          x: 0,
          y: 0,
        }),
      ],
    };
    const inactiveView = {
      ...createDefaultOrgEditorState(),
      canvasElements: [
        {
          ...createOrgEditorArrowElement({ x: 0, y: 0 }, { x: 10, y: 10 }),
          strokeColor: "#abcdef" as const,
        },
      ],
    };

    expect(
      collectUsedEmployeeTagColors(
        [{ color: "blue" }, { color: "#3b82f6" }, { color: null }, { color: "#7c3aed80" }],
        [firstView, inactiveView],
      ),
    ).toEqual([
      "blue",
      "#7c3aed80",
      "green",
      "amber",
      "#7c3aed00",
      "red",
      "orange",
      "cyan",
      "teal",
      "#123456ff",
      "rose",
      "#abcdef",
    ]);
  });

  it("returns a distinct background and readable foreground for every catalog color", () => {
    const classNames = COLORS.map((color) => tagColorSurfaceClassName(color));

    expect(new Set(classNames)).toHaveLength(COLORS.length);
    for (const className of classNames) {
      expect(className).toMatch(/\bbg-/u);
      expect(className).toMatch(/\btext-/u);
      expect(className).toContain("dark:bg-");
      expect(className).toContain("dark:text-");
    }
  });

  it("uses the same neutral surface when no color is configured", () => {
    expect(tagColorSurfaceClassName(null)).toBe(tagColorSurfaceClassName(undefined));
    expect(tagColorSurfaceClassName(null)).toContain("bg-primary/10");
  });

  it("normalizes and recognizes only canonical custom colors", () => {
    expect(normalizeCustomEmployeeTagColor(" #7C3AED ")).toBe("#7c3aed");
    expect(normalizeCustomEmployeeTagColor("#abc")).toBeNull();
    expect(normalizeCustomEmployeeTagColor("#7C3AED80")).toBe("#7c3aed80");
    expect(isCustomEmployeeTagColor("#7c3aed")).toBe(true);
    expect(isCustomEmployeeTagColor("#7c3aed80")).toBe(true);
    expect(isCustomEmployeeTagColor("#7C3AED")).toBe(false);
  });

  it("round-trips named, custom, null, and alpha color drafts", () => {
    expect(decodeTagColorDraft(null)).toEqual({ baseColor: null, opacityByte: 255 });
    expect(decodeTagColorDraft("blue")).toEqual({ baseColor: "blue", opacityByte: 255 });
    expect(decodeTagColorDraft("#7c3aed")).toEqual({
      baseColor: "#7c3aed",
      opacityByte: 255,
    });
    expect(decodeTagColorDraft("#3b82f666")).toEqual({
      baseColor: "blue",
      opacityByte: 102,
    });
    expect(encodeTagColorDraft({ baseColor: "blue", opacityByte: 255 })).toBe("blue");
    expect(encodeTagColorDraft({ baseColor: "#7c3aed", opacityByte: 255 })).toBe("#7c3aed");
    expect(encodeTagColorDraft({ baseColor: "blue", opacityByte: 102 })).toBe("#3b82f666");
    expect(encodeTagColorDraft({ baseColor: "blue", opacityByte: 0 })).toBe("#3b82f600");
  });

  it("maps integer opacity percentages to canonical alpha bytes", () => {
    expect(tagColorOpacityPercentToByte(40)).toBe(102);
    expect(tagColorOpacityByteToPercent(102)).toBe(40);
    expect(tagColorOpacityPercentToByte(-1)).toBe(0);
    expect(tagColorOpacityPercentToByte(101)).toBe(255);
  });

  it("normalizes each exact input mode to canonical HEX", () => {
    expect(parseTagColorInput("keyword", "rebeccapurple")).toBe("#663399");
    expect(parseTagColorInput("keyword", "RED")).toBe("#ff0000");
    expect(parseTagColorInput("hex", " #C0F ")).toBe("#cc00ff");
    expect(parseTagColorInput("hex", "#7C3AED")).toBe("#7c3aed");
    expect(parseTagColorInput("rgb", "rgb(124, 58, 237)")).toBe("#7c3aed");
    expect(parseTagColorInput("rgba", "rgba(124, 58, 237, .5)")).toBe("#7c3aed80");
    expect(parseTagColorInput("rgba", "rgba(124, 58, 237, 1)")).toBe("#7c3aed");
  });

  it("rejects invalid exact color input without coercing channel bounds", () => {
    expect(parseTagColorInput("keyword", "transparent")).toBeNull();
    expect(parseTagColorInput("hex", "#12")).toBeNull();
    expect(parseTagColorInput("hex", "#7c3aed80")).toBeNull();
    expect(parseTagColorInput("rgb", "rgb(256, 0, 0)")).toBeNull();
    expect(parseTagColorInput("rgb", "rgba(1, 2, 3, .5)")).toBeNull();
    expect(parseTagColorInput("rgba", "rgba(1, 2, 3, 1.2)")).toBeNull();
  });

  it("formats the selected color for each exact editor and supplies matching placeholders", () => {
    expect(formatTagColorInput("hex", "#7c3aed80")).toBe("#7c3aed");
    expect(formatTagColorInput("rgb", "#7c3aed80")).toBe("rgb(124, 58, 237)");
    expect(formatTagColorInput("rgba", "#7c3aed80")).toBe("rgba(124, 58, 237, .502)");
    expect(formatTagColorInput("keyword", "#663399")).toBe("rebeccapurple");
    expect(tagColorInputPlaceholder("rgba")).toContain("rgba(");
  });

  it("creates theme-aware tonal variables for an arbitrary color", () => {
    expect(tagColorSurfaceClassName("#7c3aed")).toBe("tag-color-custom");
    expect(customTagColorSurfaceStyle("blue")).toBeUndefined();
    expect(customTagColorSurfaceStyle("#7c3aed")).toMatchObject({
      "--tag-custom-fill": expect.stringMatching(/^#[0-9a-f]{6}$/u),
      "--tag-custom-fill-dark": expect.stringMatching(/^#[0-9a-f]{6}$/u),
      "--tag-custom-foreground": expect.stringMatching(/^#[0-9a-f]{6}$/u),
      "--tag-custom-foreground-dark": expect.stringMatching(/^#[0-9a-f]{6}$/u),
    });
    expect(customTagColorSurfaceStyle("#7c3aed80")).not.toEqual(
      customTagColorSurfaceStyle("#7c3aed"),
    );
    expect(customTagColorSurfaceStyle("#7c3aed66")).toMatchObject({
      "--tag-custom-fill": "#7c3aed66",
      "--tag-custom-fill-active": expect.stringMatching(/^#[0-9a-f]{6}66$/u),
      "--tag-custom-fill-dark": "#7c3aed66",
      "--tag-custom-fill-hover": expect.stringMatching(/^#[0-9a-f]{6}66$/u),
      "--tag-custom-foreground": expect.stringMatching(/^#[0-9a-f]{6}$/u),
      "--tag-custom-foreground-dark": expect.stringMatching(/^#[0-9a-f]{6}$/u),
    });
  });

  it("round-trips palette values through HSV without changing canonical output", () => {
    for (const hex of ["#000000", "#ffffff", "#7c3aed", "#06b6d4"] as const) {
      expect(hsvToHex(hexToHsv(hex))).toBe(hex);
    }
    expect(employeeTagColorToHex("blue")).toBe("#3b82f6");
    expect(employeeTagColorToHex("#7c3aed")).toBe("#7c3aed");
  });

  it("resolves neutral, named, custom, and alpha colors for PNG canvas chips", () => {
    expect(getTagColorCanvasStyle(null)).toEqual({
      fillStyle: "rgba(29, 29, 29, 0.1)",
      textStyle: "#1d1d1d",
    });
    expect(getTagColorCanvasStyle("blue").fillStyle).toMatch(/^#[0-9a-f]{6}$/u);
    expect(getTagColorCanvasStyle("#7c3aed")).not.toEqual(getTagColorCanvasStyle(null));
    expect(getTagColorCanvasStyle("#7c3aed80")).not.toEqual(getTagColorCanvasStyle("#7c3aed"));
    expect(getTagColorCanvasStyle("#7c3aed66").fillStyle).toBe("#7c3aed66");
  });

  it("derives deterministic shared flat Sticker colors", () => {
    const named = getStickerColorStyle("amber");
    const hex = getStickerColorStyle("#7c3aed");
    const custom = getStickerColorStyle("#7c3aed80");

    expect(named.fillStyle).toBe(employeeTagColorToHex("amber"));
    expect(named.borderStyle).toMatch(/^#[0-9a-f]{6}$/u);
    expect(named.borderStyle).not.toBe(named.fillStyle);
    expect(hex).toEqual({ borderStyle: "#7036d3", fillStyle: "#7c3aed" });
    expect(custom.fillStyle).toBe("#7c3aed80");
    expect(custom.borderStyle).toBe("#7036d380");
  });

  it("shares the light DOM and canvas tonal fill for distribution colors", () => {
    for (const color of ["green", "#7c3aed", "#7c3aed80"] as const) {
      const surfaceStyle = customTagColorSurfaceStyle(employeeTagColorToHex(color));
      expect(getTagColorCanvasStyle(color).fillStyle).toBe(
        Reflect.get(surfaceStyle ?? {}, "--tag-custom-fill"),
      );
    }
  });
});
