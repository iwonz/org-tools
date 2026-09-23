import { describe, expect, test, vi } from "vitest";

import { createEmployeeDisplayTextMeasureEngine } from "@/lib/employee-display-measure";

describe("Employee display text measurement", () => {
  test("measures each semantic font with the Canvas context and caches exact results", () => {
    let font = "";
    const measureText = vi.fn((value: string) => ({
      width:
        value.length * 7.25 +
        [...font].reduce((total, character) => total + (character.codePointAt(0) ?? 0), 0) / 1_000,
    }));
    const context = {
      get font() {
        return font;
      },
      set font(value: string) {
        font = value;
      },
      measureText,
    } as unknown as CanvasRenderingContext2D;
    const engine = createEmployeeDisplayTextMeasureEngine({
      createContext: () => context,
      maxEntries: 8,
    });
    const base = { fontFamily: "Test Sans", fontSize: 14 };

    const regular = engine.measure("mail@example.test", { ...base, fontWeight: 400 });
    const bold = engine.measure("mail@example.test", { ...base, fontWeight: 600 });
    const italic = engine.measure("mail@example.test", {
      ...base,
      fontStyle: "italic",
      fontWeight: 400,
    });
    const code = engine.measure("mail@example.test", {
      fontFamily: "Test Mono",
      fontSize: 12.6,
      fontWeight: 400,
    });

    expect(new Set([regular, bold, italic, code]).size).toBe(4);
    expect(measureText).toHaveBeenCalledTimes(4);
    expect(engine.measure("mail@example.test", { ...base, fontWeight: 400 })).toBe(regular);
    expect(measureText).toHaveBeenCalledTimes(4);
  });

  test("bounds the cache and clears measured values after font invalidation", () => {
    const measureText = vi.fn((value: string) => ({ width: value.length * 6 }));
    const context = {
      font: "",
      measureText,
    } as unknown as CanvasRenderingContext2D;
    const engine = createEmployeeDisplayTextMeasureEngine({
      createContext: () => context,
      maxEntries: 2,
    });
    const style = { fontFamily: "Test Sans", fontSize: 11, fontWeight: 400 };

    engine.measure("one", style);
    engine.measure("two", style);
    engine.measure("three", style);
    expect(engine.getCacheSize()).toBe(2);

    engine.invalidate();
    expect(engine.getCacheSize()).toBe(0);
    engine.measure("three", style);
    expect(measureText).toHaveBeenCalledTimes(4);
  });
});
