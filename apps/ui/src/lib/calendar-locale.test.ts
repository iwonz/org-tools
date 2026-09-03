import { describe, expect, test } from "vitest";

import { formatCalendarDayTitle, getCalendarWeekStart } from "@/lib/calendar-locale";

describe("Calendar locale", () => {
  test("formats all supported locales and removes the Russian year suffix", () => {
    const date = new Date("2026-08-12T00:00:00Z");

    expect(formatCalendarDayTitle(date, "ru")).toContain("2026");
    expect(formatCalendarDayTitle(date, "ru")).not.toMatch(/\u0433\./u);
    for (const locale of ["ar", "en", "es", "fr", "zh"] as const) {
      expect(formatCalendarDayTitle(date, locale).length).toBeGreaterThan(4);
    }
  });

  test("uses locale-aware week starts", () => {
    expect(getCalendarWeekStart("en")).toBe(0);
    expect(getCalendarWeekStart("ar")).toBe(6);
    for (const locale of ["es", "fr", "ru", "zh"] as const) {
      expect(getCalendarWeekStart(locale)).toBe(1);
    }
  });
});
