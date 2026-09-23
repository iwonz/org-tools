import { describe, expect, test } from "vitest";

import {
  normalizeEmployeeDisplayLineGapInput,
  parseEmployeeDisplayLineGapInput,
} from "@/lib/employee-display-line-gap";

describe("Employee display line-gap input", () => {
  test("accepts only bounded integer input for immediate persistence", () => {
    expect(parseEmployeeDisplayLineGapInput("0")).toBe(0);
    expect(parseEmployeeDisplayLineGapInput(" 24 ")).toBe(24);
    expect(parseEmployeeDisplayLineGapInput("04")).toBe(4);
    expect(parseEmployeeDisplayLineGapInput("")).toBeNull();
    expect(parseEmployeeDisplayLineGapInput("1.5")).toBeNull();
    expect(parseEmployeeDisplayLineGapInput("-1")).toBeNull();
    expect(parseEmployeeDisplayLineGapInput("25")).toBeNull();
    expect(parseEmployeeDisplayLineGapInput("gap")).toBeNull();
  });

  test("normalizes parseable commits and restores nonnumeric input", () => {
    expect(normalizeEmployeeDisplayLineGapInput("-3", 4)).toBe(0);
    expect(normalizeEmployeeDisplayLineGapInput("8.6", 4)).toBe(9);
    expect(normalizeEmployeeDisplayLineGapInput("90", 4)).toBe(24);
    expect(normalizeEmployeeDisplayLineGapInput("", 7)).toBe(7);
    expect(normalizeEmployeeDisplayLineGapInput("gap", 7)).toBe(7);
  });
});
