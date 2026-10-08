import { describe, expect, it } from "vitest";

import {
  evaluateTimingPolicy,
  median,
  percentile95,
} from "../packages/screenshots/tests/performance-policy.ts";

describe("Editor performance policy", () => {
  it("keeps structural runs free from wall-clock thresholds", () => {
    expect(
      evaluateTimingPolicy({
        inputMaximumMs: 5_000,
        inputMedianP95Ms: 5_000,
        inputP95Samples: [5_000],
        mode: "structural",
        panMaximumMs: 5_000,
        panMedianP95Ms: 5_000,
        panP95Samples: [5_000],
      }),
    ).toEqual([]);
  });

  it("accepts three bounded Full samples", () => {
    expect(
      evaluateTimingPolicy({
        inputMaximumMs: 250,
        inputMedianP95Ms: 180,
        inputP95Samples: [170, 180, 190],
        mode: "full",
        panMaximumMs: 300,
        panMedianP95Ms: 90,
        panP95Samples: [85, 90, 95],
      }),
    ).toEqual([]);
  });

  it("reports missing samples and each Full ceiling", () => {
    expect(
      evaluateTimingPolicy({
        inputMaximumMs: 1_001,
        inputMedianP95Ms: 201,
        inputP95Samples: [201],
        mode: "full",
        panMaximumMs: 101,
        panMedianP95Ms: 101,
        panP95Samples: [101],
      }),
    ).toHaveLength(4);
  });

  it("calculates stable p95 and median values", () => {
    expect(percentile95([5, 1, 3, 4, 2])).toBe(4);
    expect(median([30, 10, 20])).toBe(20);
  });
});
