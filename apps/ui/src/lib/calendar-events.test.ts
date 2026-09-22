import type { Employee } from "@org-tools/types";
import { describe, expect, test } from "vitest";

import { createUiOrgStructure } from "@/lib/build-ui-org-structure";
import { buildCalendarDayDialogRows } from "@/lib/calendar-day-dialog";
import { getCalendarBirthdayEmployees, isCalendarLeapYear } from "@/lib/calendar-events";

const employee = (id: string): Employee => ({
  avatarBase64Url: null,
  birthday: "29.02.1900",
  customFieldValues: {},
  email: null,
  firstName: "Leap",
  fullName: `Leap ${id}`,
  gender: "unspecified",
  id,
  lastName: id,
  phone: null,
  profileUrl: null,
  tags: [],
  tagPriority: null,
  unitIds: [],
  unitPositions: [],
  username: null,
});

describe("calendar event dates", () => {
  test("recognizes Gregorian leap years", () => {
    expect(isCalendarLeapYear(2024)).toBe(true);
    expect(isCalendarLeapYear(2100)).toBe(false);
    expect(isCalendarLeapYear(2000)).toBe(true);
  });

  test("projects February 29 birthdays to February 28 only in non-leap years", () => {
    const leapEmployee = employee("00000000-0000-4000-8000-000000000001");
    const index = new Map([["02-29", [leapEmployee]]]);
    expect(getCalendarBirthdayEmployees(index, 2025, 2, 28)).toEqual([leapEmployee]);
    expect(getCalendarBirthdayEmployees(index, 2024, 2, 28)).toEqual([]);
    expect(getCalendarBirthdayEmployees(index, 2024, 2, 29)).toEqual([leapEmployee]);
  });

  test("indexes exact tag dates and groups labels without using the date as identity", () => {
    const tagId = "00000000-0000-4000-8000-000000000010";
    const first = {
      ...employee("00000000-0000-4000-8000-000000000001"),
      tags: [{ date: "2026-08-12", label: "Last day", tagId }],
    };
    const second = {
      ...employee("00000000-0000-4000-8000-000000000002"),
      tags: [{ date: "2026-09-01", label: "Last day", tagId }],
    };
    const employees = [first, second];
    const structure = createUiOrgStructure({
      allEmployees: employees,
      deepEmployees: employees,
      deepUnits: [],
      employeesById: new Map(employees.map((item) => [item.id, item])),
      roots: [],
      tagDefinitions: [{ color: null, id: tagId, label: "Last day" }],
      unitsById: new Map(),
    });
    expect(structure.indexes.datedTagEventsByDate.get("2026-08-12")?.[0]?.employee.id).toBe(
      first.id,
    );
    expect(structure.indexes.datedTagGroups).toHaveLength(1);
    expect(structure.indexes.datedTagGroups[0]?.events).toHaveLength(2);
  });

  test("builds Birthdays and catalog-ordered Tag groups as one stable row stream", () => {
    const first = { ...employee("00000000-0000-4000-8000-000000000001"), fullName: "Avery One" };
    const second = {
      ...employee("00000000-0000-4000-8000-000000000002"),
      fullName: "Blake Two",
    };
    const rows = buildCalendarDayDialogRows({
      birthdayEmployees: [second],
      events: [
        {
          color: null,
          date: "2026-09-03",
          employee: second,
          label: "Release",
          source: { kind: "tag", tagId: "00000000-0000-4000-8000-000000000010" },
        },
        {
          color: null,
          date: "2026-09-03",
          employee: first,
          label: "Anniversary",
          source: { kind: "tag", tagId: "00000000-0000-4000-8000-000000000011" },
        },
        {
          color: null,
          date: "2026-09-03",
          employee: first,
          label: "Release",
          source: { kind: "tag", tagId: "00000000-0000-4000-8000-000000000010" },
        },
      ],
      locale: "en",
    });

    expect(rows.map((row) => row.key)).toEqual([
      "birthdays",
      `birthdays:${second.id}`,
      "tag:release",
      `tag:release:${first.id}`,
      `tag:release:${second.id}`,
      "tag:anniversary",
      `tag:anniversary:${first.id}`,
    ]);
  });

  test("indexes every populated Composite date with a neutral event label", () => {
    const definitionId = "00000000-0000-4000-8000-000000000020";
    const primaryFieldId = "00000000-0000-4000-8000-000000000021";
    const issuedFieldId = "00000000-0000-4000-8000-000000000022";
    const expiresFieldId = "00000000-0000-4000-8000-000000000023";
    const item = {
      ...employee("00000000-0000-4000-8000-000000000001"),
      customFieldValues: {
        [definitionId]: [
          {
            [expiresFieldId]: "02.03.2031",
            [issuedFieldId]: "01.02.2026",
            [primaryFieldId]: "First aid",
          },
        ],
      },
    };
    const structure = createUiOrgStructure({
      allEmployees: [item],
      customFieldDefinitions: [
        {
          fields: [
            {
              id: primaryFieldId,
              name: "Certificate",
              options: [],
              required: true,
              valueType: "text",
            },
            {
              id: issuedFieldId,
              name: "Issued",
              options: [],
              required: false,
              valueType: "date",
            },
            {
              id: expiresFieldId,
              name: "Expires",
              options: [],
              required: false,
              valueType: "date",
            },
          ],
          id: definitionId,
          key: "certificates",
          kind: "composite",
          name: "Certificates",
          primaryFieldId,
          required: false,
        },
      ],
      deepEmployees: [item],
      deepUnits: [],
      employeesById: new Map([[item.id, item]]),
      roots: [],
      unitsById: new Map(),
    });
    expect(structure.indexes.datedTagEventsByDate.get("2026-02-01")?.[0]).toMatchObject({
      color: null,
      label: "Certificates · First aid · Issued",
      source: { fieldId: definitionId, kind: "composite" },
    });
    expect(structure.indexes.datedTagEventsByDate.get("2031-03-02")?.[0]?.label).toBe(
      "Certificates · First aid · Expires",
    );
  });
});
