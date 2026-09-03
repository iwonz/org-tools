import type { EmployeeTagColor } from "@org-tools/types";
import { describe, expect, it } from "vitest";
import {
  customTagColorSurfaceStyle,
  employeeTagColorToHex,
  formatTagColorInput,
  hexToHsv,
  hsvToHex,
  isCustomEmployeeTagColor,
  normalizeCustomEmployeeTagColor,
  parseTagColorInput,
  tagColorInputPlaceholder,
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
  });

  it("round-trips palette values through HSV without changing canonical output", () => {
    for (const hex of ["#000000", "#ffffff", "#7c3aed", "#06b6d4"] as const) {
      expect(hsvToHex(hexToHsv(hex))).toBe(hex);
    }
    expect(employeeTagColorToHex("blue")).toBe("#3b82f6");
    expect(employeeTagColorToHex("#7c3aed")).toBe("#7c3aed");
  });
});
