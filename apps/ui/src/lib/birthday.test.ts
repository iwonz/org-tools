import { describe, expect, test } from "vitest";

import {
  createEmployeeBirthday,
  getBirthdayDaysInMonth,
  parseEmployeeBirthday,
  UNKNOWN_BIRTH_YEAR,
} from "@/lib/birthday";
import { normalizeBirthday } from "@/lib/employee-data";

const NOW = new Date("2026-09-02T12:00:00.000Z");

describe("Employee birthdays", () => {
  test("parses and creates canonical complete dates", () => {
    expect(createEmployeeBirthday(9, 8, 1988)).toBe("09.08.1988");
    expect(parseEmployeeBirthday("09.08.1988", NOW)).toEqual({
      day: 9,
      month: 8,
      year: 1988,
      yearKnown: true,
    });
  });

  test("treats 1900 as an unknown year and accepts an unknown-year leap day", () => {
    expect(parseEmployeeBirthday("29.02.1900", NOW)).toEqual({
      day: 29,
      month: 2,
      year: UNKNOWN_BIRTH_YEAR,
      yearKnown: false,
    });
    expect(getBirthdayDaysInMonth(2, UNKNOWN_BIRTH_YEAR)).toBe(29);
  });

  test.each(["02-29", "29.02", "1900-02-29", "29/02/1900", "9.08.1988"])(
    "rejects obsolete or non-canonical shape %s",
    (birthday) => {
      expect(parseEmployeeBirthday(birthday, NOW)).toBeNull();
    },
  );

  test.each(["31.04.1988", "29.02.1901", "00.01.1988", "01.13.1988", "03.09.2026"])(
    "rejects impossible or future date %s",
    (birthday) => {
      expect(parseEmployeeBirthday(birthday, NOW)).toBeNull();
    },
  );

  test("uses localized validation descriptors", () => {
    expect(() => normalizeBirthday("02-29")).toThrow("Birthday must use the DD.MM.YYYY format.");
    expect(() => normalizeBirthday("31.04.1988")).toThrow(
      "Birthday must be a valid date that is not in the future.",
    );
  });
});
