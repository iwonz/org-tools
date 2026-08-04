import { describe, expect, test } from "vitest";

import {
  createEmployeeTagDateUpdates,
  createEmployeeTagUpdates,
  getEmployeeTagDateSelectionState,
  getEmployeeTagSelectionState,
  normalizeEmployeeTags,
  orderEmployeeTagsForDisplay,
  sortEmployeeTags,
  toggleEmployeeTagForTargets,
} from "@/lib/employee-tags";

const FIRST_ID = "00000000-0000-4000-8000-000000000001";
const SECOND_ID = "00000000-0000-4000-8000-000000000002";
const tag = (label: string, date: string | null = null) => ({ date, label });

describe("Employee tag selection", () => {
  test("normalizes whitespace and case-insensitive duplicates", () => {
    expect(normalizeEmployeeTags([" QA ", "qa", "", " Design "])).toEqual([
      tag("QA"),
      tag("Design"),
    ]);
  });

  test("reports unchecked, mixed, and checked selection states", () => {
    const employees = [
      { id: FIRST_ID, tags: [tag("QA")] },
      { id: SECOND_ID, tags: [] },
    ];

    expect(getEmployeeTagSelectionState(employees, "Design")).toBe(false);
    expect(getEmployeeTagSelectionState(employees, "qa")).toBe("indeterminate");
    expect(getEmployeeTagSelectionState([{ id: FIRST_ID, tags: [tag("QA")] }], "qa")).toBe(true);
  });

  test("adds a mixed tag to unique Employees and removes a fully selected tag", () => {
    const employees = [
      { id: FIRST_ID, tags: [tag("QA", "2026-02-01")] },
      { id: FIRST_ID, tags: [tag("QA", "2026-02-01")] },
      { id: SECOND_ID, tags: [tag("Design")] },
    ];

    expect(toggleEmployeeTagForTargets(employees, "QA")).toEqual([
      { employeeId: SECOND_ID, tags: [tag("Design"), tag("QA")] },
    ]);
    expect(
      toggleEmployeeTagForTargets(
        [
          { id: FIRST_ID, tags: [tag("QA", "2026-02-01")] },
          { id: SECOND_ID, tags: [tag("QA"), tag("Design")] },
        ],
        "qa",
      ),
    ).toEqual([
      { employeeId: FIRST_ID, tags: [] },
      { employeeId: SECOND_ID, tags: [tag("Design")] },
    ]);
  });

  test("creates and assigns a normalized tag in one operation", () => {
    expect(
      createEmployeeTagUpdates({
        employees: [
          { id: FIRST_ID, tags: [] },
          { id: SECOND_ID, tags: [tag("QA")] },
        ],
        selected: true,
        tag: "  New team  ",
      }),
    ).toEqual([
      { employeeId: FIRST_ID, tags: [tag("New team")] },
      { employeeId: SECOND_ID, tags: [tag("QA"), tag("New team")] },
    ]);
  });

  test("sorts numeric labels and keeps every matching-first display tag", () => {
    expect(sortEmployeeTags([tag("Core"), tag("Team 10"), tag("Alpha"), tag("Team 2")])).toEqual([
      tag("Alpha"),
      tag("Core"),
      tag("Team 2"),
      tag("Team 10"),
    ]);
    expect(
      orderEmployeeTagsForDisplay(
        [tag("Core"), tag("QA 10"), tag("Alpha"), tag("QA 2"), tag("Beta")],
        ["qa"],
      ),
    ).toEqual([tag("QA 2"), tag("QA 10"), tag("Alpha"), tag("Beta"), tag("Core")]);
  });

  test("reports mixed dates and applies a common date without adding missing tags", () => {
    const employees = [
      { id: FIRST_ID, tags: [tag("Exit", "2026-08-01")] },
      { id: SECOND_ID, tags: [tag("Exit", "2026-08-02")] },
    ];
    expect(getEmployeeTagDateSelectionState(employees, "exit")).toBe("mixed");
    expect(createEmployeeTagDateUpdates({ date: "2026-08-03", employees, tag: "Exit" })).toEqual([
      { employeeId: FIRST_ID, tags: [tag("Exit", "2026-08-03")] },
      { employeeId: SECOND_ID, tags: [tag("Exit", "2026-08-03")] },
    ]);
  });
});
