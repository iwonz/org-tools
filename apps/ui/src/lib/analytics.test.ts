import type { Employee } from "@org-tools/types";
import { describe, expect, test } from "vitest";

import { buildAnalytics } from "@/lib/analytics";

const employee = (
  id: string,
  firstName: string,
  birthday: string | null,
  gender: Employee["gender"] = "unspecified",
): Employee => ({
  avatarBase64Url: null,
  birthday,
  customFieldValues: {},
  email: `${firstName.toLowerCase()}@example.test`,
  firstName,
  fullName: `${firstName} Example`,
  gender,
  id,
  lastName: "Example",
  phone: null,
  profileUrl: null,
  tags: [],
  unitIds: [],
  unitPositions: [],
  username: null,
});

describe("Analytics", () => {
  test("excludes missing and unknown years from year and age analytics", () => {
    const result = buildAnalytics(
      [
        employee("00000000-0000-4000-8000-000000000001", "Known", "03.09.2000"),
        employee("00000000-0000-4000-8000-000000000002", "Unknown", "03.09.1900"),
        employee("00000000-0000-4000-8000-000000000003", "Missing", null),
      ],
      { now: new Date(2026, 8, 3, 12) },
    );

    expect(result.birthdayYearCounts).toEqual([
      expect.objectContaining({ count: 1, kind: "birthdayYear", label: "2000" }),
    ]);
    expect(result.ageCohorts.all).toMatchObject({
      averageAge: 26,
      employeeCount: 1,
    });
    expect(result.birthdayDateCounts[0]?.count).toBe(2);
  });

  test("changes completed age only on the local birthday boundary", () => {
    const employees = [
      employee("00000000-0000-4000-8000-000000000001", "Alex", "04.09.2000", "male"),
    ];

    expect(
      buildAnalytics(employees, { now: new Date(2026, 8, 3, 12) }).ageCohorts.all.averageAge,
    ).toBe(25);
    expect(
      buildAnalytics(employees, { now: new Date(2026, 8, 4, 12) }).ageCohorts.all.averageAge,
    ).toBe(26);
  });

  test("builds overall and gender cohorts and resolves equal dates deterministically", () => {
    const result = buildAnalytics(
      [
        employee("00000000-0000-4000-8000-000000000003", "Zed", "01.01.2000", "male"),
        employee("00000000-0000-4000-8000-000000000002", "Ada", "01.01.2000", "female"),
        employee("00000000-0000-4000-8000-000000000001", "Alex", "03.09.2010"),
      ],
      { now: new Date(2026, 8, 3, 12) },
    );

    expect(result.ageCohorts.all.employeeCount).toBe(3);
    expect(result.ageCohorts.male.employeeCount).toBe(1);
    expect(result.ageCohorts.female.employeeCount).toBe(1);
    expect(result.ageCohorts.all.oldest?.employee.firstName).toBe("Ada");
    expect(result.ageCohorts.all.youngest?.employee.firstName).toBe("Alex");
    expect(result.ageCohorts.all.averageAge).toBeCloseTo(22.67, 2);
  });

  test("returns explicit empty cohort values", () => {
    const result = buildAnalytics([], { now: new Date(2026, 8, 3, 12) });

    expect(result.ageCohorts.female).toEqual({
      averageAge: null,
      employeeCount: 0,
      oldest: null,
      youngest: null,
    });
  });
});
