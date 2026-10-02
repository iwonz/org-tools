import { describe, expect, test } from "vitest";

import { compareScreenshotPixels } from "./screenshot-stability.mjs";

const pixels = (values, { channels = 3, height = 1, width = 1 } = {}) => ({
  channels,
  data: Uint8Array.from(values),
  height,
  width,
});

describe("screenshot pixel stability", () => {
  test("accepts exact pixels and bounded antialiasing noise", () => {
    expect(compareScreenshotPixels(pixels([10, 20, 30]), pixels([10, 20, 30]), [])).toEqual({
      changedPixels: 0,
      matches: true,
      reason: "match",
    });
    expect(compareScreenshotPixels(pixels([10, 20, 30]), pixels([12, 19, 33]), [])).toEqual({
      changedPixels: 1,
      matches: true,
      reason: "match",
    });
  });

  test("allows a larger delta only inside a declared raster region", () => {
    const region = [{ bottom: 1, left: 0, right: 1, top: 0 }];
    expect(
      compareScreenshotPixels(pixels([10, 20, 30]), pixels([80, 20, 30]), region).matches,
    ).toBe(true);
    expect(compareScreenshotPixels(pixels([10, 20, 30]), pixels([80, 20, 30]), [])).toEqual({
      changedPixels: 1,
      matches: false,
      reason: "unscoped-delta",
    });
  });

  test("keeps ordinary and scoped raster pixel budgets independent", () => {
    const reference = pixels(new Array(12).fill(0), { width: 4 });
    const candidate = pixels([1, 0, 0, 1, 0, 0, 80, 0, 0, 80, 0, 0], { width: 4 });
    const region = [{ bottom: 1, left: 2, right: 4, top: 0 }];
    expect(compareScreenshotPixels(reference, candidate, region, { pixelBudget: 2 })).toEqual({
      changedPixels: 4,
      matches: true,
      reason: "match",
    });
  });

  test("rejects either pixel category when its own budget is exceeded", () => {
    const reference = pixels(new Array(15).fill(0), { width: 5 });
    const region = [{ bottom: 1, left: 3, right: 5, top: 0 }];
    expect(
      compareScreenshotPixels(
        reference,
        pixels([1, 0, 0, 1, 0, 0, 1, 0, 0, 80, 0, 0, 80, 0, 0], { width: 5 }),
        region,
        { pixelBudget: 2 },
      ),
    ).toEqual({ changedPixels: 3, matches: false, reason: "pixel-budget" });
    expect(
      compareScreenshotPixels(
        reference,
        pixels([1, 0, 0, 0, 0, 0, 80, 0, 0, 80, 0, 0, 0, 0, 0], { width: 5 }),
        [{ bottom: 1, left: 2, right: 5, top: 0 }],
        { pixelBudget: 1 },
      ),
    ).toEqual({ changedPixels: 3, matches: false, reason: "pixel-budget" });
  });

  test("rejects an exceeded pixel budget and incompatible images", () => {
    expect(
      compareScreenshotPixels(
        pixels([0, 0, 0, 0, 0, 0], { width: 2 }),
        pixels([1, 0, 0, 1, 0, 0], { width: 2 }),
        [],
        { pixelBudget: 1 },
      ),
    ).toEqual({ changedPixels: 2, matches: false, reason: "pixel-budget" });
    expect(
      compareScreenshotPixels(pixels([0, 0, 0]), pixels([0, 0, 0, 0, 0, 0], { width: 2 }), []),
    ).toEqual({ changedPixels: 0, matches: false, reason: "dimensions" });
  });
});
