import type { EmployeeTagColor } from "@org-tools/types";
import { describe, expect, it } from "vitest";
import {
  customTagColorSurfaceStyle,
  employeeTagColorToHex,
  hexToHsv,
  hsvToHex,
  isCustomEmployeeTagColor,
  normalizeCustomEmployeeTagColor,
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
    expect(normalizeCustomEmployeeTagColor("#7c3aed80")).toBeNull();
    expect(isCustomEmployeeTagColor("#7c3aed")).toBe(true);
    expect(isCustomEmployeeTagColor("#7C3AED")).toBe(false);
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
  });

  it("round-trips palette values through HSV without changing canonical output", () => {
    for (const hex of ["#000000", "#ffffff", "#7c3aed", "#06b6d4"] as const) {
      expect(hsvToHex(hexToHsv(hex))).toBe(hex);
    }
    expect(employeeTagColorToHex("blue")).toBe("#3b82f6");
    expect(employeeTagColorToHex("#7c3aed")).toBe("#7c3aed");
  });
});
