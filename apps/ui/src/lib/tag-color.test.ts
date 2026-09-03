import type { EmployeeTagColor } from "@org-tools/types";
import { describe, expect, it } from "vitest";
import { tagColorSurfaceClassName } from "@/lib/tag-color";

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
});
