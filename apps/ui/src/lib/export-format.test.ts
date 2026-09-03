import type { Employee, EmployeeUnitPosition } from "@org-tools/types";
import { describe, expect, test } from "vitest";

import { buildEmployeeUnitContextIndex } from "@/lib/employee-unit-contexts";
import {
  buildEmployeeExportRows,
  countEmployeeExportRows,
  createExportPreview,
  createExportText,
  createStructuredJsonRecords,
  getExportEmployeeFieldValue,
  validateExportFieldNames,
} from "@/lib/export-format";
import {
  createDefaultExportJsonFieldNames,
  defaultExportJsonTopLevelFieldOrder,
} from "@/stores/export-session-store";

const EMPLOYEE_ID = "00000000-0000-4000-8000-000000000001";
const ROOT_UNIT_ID = "00000000-0000-4000-8000-000000000002";
const CHILD_UNIT_ID = "00000000-0000-4000-8000-000000000003";
const EMBEDDED_AVATAR = "data:image/png;base64,aGVsbG8=";

const rootPosition: EmployeeUnitPosition = {
  isBoss: true,
  parentId: null,
  position: "Research Lead",
  unitId: ROOT_UNIT_ID,
  unitName: "Research",
  unitPath: { fullName: "Research", ids: [ROOT_UNIT_ID], names: ["Research"] },
};
const childPosition: EmployeeUnitPosition = {
  isBoss: false,
  parentId: ROOT_UNIT_ID,
  position: "Systems Engineer",
  unitId: CHILD_UNIT_ID,
  unitName: "Computing",
  unitPath: {
    fullName: "Research · Computing",
    ids: [ROOT_UNIT_ID, CHILD_UNIT_ID],
    names: ["Research", "Computing"],
  },
};

const createEmployee = (overrides: Partial<Employee> = {}): Employee => ({
  avatarBase64Url: EMBEDDED_AVATAR,
  birthday: "10.12.1985",
  customFieldValues: {},
  email: "ada@example.test",
  firstName: "Ada",
  fullName: "Ada Lovelace",
  gender: "female",
  id: EMPLOYEE_ID,
  lastName: "Lovelace",
  phone: "+1 555-0101",
  profileUrl: "https://example.test/profiles/ada",
  tags: [
    { date: null, label: "Research" },
    { date: "2026-12-10", label: "Computing" },
  ],
  unitIds: [ROOT_UNIT_ID, CHILD_UNIT_ID],
  unitPositions: [rootPosition, childPosition],
  username: "ada",
  ...overrides,
});

const createRows = (employee = createEmployee()) =>
  buildEmployeeExportRows({
    employee,
    isDirectlySelected: true,
    mode: "allUnits",
    unitContexts: buildEmployeeUnitContextIndex([employee]).get(employee.id) ?? [],
    unitOrderById: new Map([
      [ROOT_UNIT_ID, 0],
      [CHILD_UNIT_ID, 1],
    ]),
  });

const createJsonOptions = () => ({
  excludedJsonTagKeys: [] as string[],
  excludedJsonUnitIds: [] as string[],
  jsonFieldNames: createDefaultExportJsonFieldNames(),
  jsonTopLevelFieldOrder: defaultExportJsonTopLevelFieldOrder,
  selectedEmployeeFieldKeys: ["username", "email"] as const,
  selectedJsonTagFieldKeys: ["label", "date"] as const,
  selectedJsonUnitFieldKeys: ["unitId", "unitName", "unitFullPath", "position", "isBoss"] as const,
});

describe("Employee export rows", () => {
  test("retains the canonical complete birthday scalar", () => {
    expect(getExportEmployeeFieldValue(createEmployee(), "birthday")).toBe("10.12.1985");
    expect(
      getExportEmployeeFieldValue(createEmployee({ birthday: "29.02.1900" }), "birthday"),
    ).toBe("29.02.1900");
  });

  test("supports All Units and First Unit with stable tree precedence", () => {
    const employee = createEmployee();
    const contexts = buildEmployeeUnitContextIndex([employee]).get(employee.id) ?? [];
    const unitOrderById = new Map([
      [ROOT_UNIT_ID, 0],
      [CHILD_UNIT_ID, 1],
    ]);
    const allRows = buildEmployeeExportRows({
      employee,
      isDirectlySelected: true,
      mode: "allUnits",
      unitContexts: contexts,
      unitOrderById,
    });
    const firstRows = buildEmployeeExportRows({
      employee,
      isDirectlySelected: true,
      mode: "firstUnit",
      unitContexts: contexts,
      unitOrderById,
    });

    expect(allRows.map((row) => row.unitContext?.unitId)).toEqual([ROOT_UNIT_ID, CHILD_UNIT_ID]);
    expect(firstRows[0]?.unitContext?.unitId).toBe(ROOT_UNIT_ID);
    expect(
      countEmployeeExportRows({
        isDirectlySelected: true,
        mode: "allUnits",
        unitContexts: contexts,
        unitOrderById,
      }),
    ).toBe(2);
  });

  test("retains an unassigned directly selected Employee", () => {
    const employee = createEmployee({ unitIds: [], unitPositions: [] });
    expect(
      buildEmployeeExportRows({
        employee,
        isDirectlySelected: true,
        mode: "firstUnit",
        unitContexts: [],
        unitOrderById: new Map(),
      }),
    ).toEqual([{ context: "employeeFallback", employee, unitContext: null }]);
  });
});

describe("structured JSON export", () => {
  test("emits the exact complete birthday in JSON", () => {
    const options = createJsonOptions();
    expect(
      createStructuredJsonRecords(createRows(), {
        ...options,
        selectedEmployeeFieldKeys: ["birthday"],
        selectedJsonTagFieldKeys: [],
        selectedJsonUnitFieldKeys: [],
      }),
    ).toEqual([{ birthday: "10.12.1985" }]);
  });

  test("creates one Employee record with nested Units, Tags, and a fixed Unit path separator", () => {
    const result = createStructuredJsonRecords(createRows(), createJsonOptions());
    expect(result).toEqual([
      {
        email: "ada@example.test",
        tags: [
          { date: null, label: "Research" },
          { date: "2026-12-10", label: "Computing" },
        ],
        units: [
          {
            isBoss: true,
            position: "Research Lead",
            unitFullPath: "Research",
            unitId: ROOT_UNIT_ID,
            unitName: "Research",
          },
          {
            isBoss: false,
            position: "Systems Engineer",
            unitFullPath: "Research / Computing",
            unitId: CHILD_UNIT_ID,
            unitName: "Computing",
          },
        ],
        username: "ada",
      },
    ]);
  });

  test("emits scalar and collection keys in the configured top-level and nested order", () => {
    const options = createJsonOptions();
    const reordered = [
      "tags",
      "email",
      "units",
      ...options.jsonTopLevelFieldOrder.filter(
        (field) => field !== "tags" && field !== "email" && field !== "units",
      ),
    ] as typeof options.jsonTopLevelFieldOrder;
    const record = createStructuredJsonRecords(createRows(), {
      ...options,
      jsonTopLevelFieldOrder: reordered,
      selectedEmployeeFieldKeys: ["email"],
      selectedJsonTagFieldKeys: ["date", "label"],
      selectedJsonUnitFieldKeys: ["isBoss", "unitName"],
    })[0];

    expect(Object.keys(record ?? {})).toEqual(["tags", "email", "units"]);
    const tags = record?.tags as Record<string, unknown>[] | undefined;
    const units = record?.units as Record<string, unknown>[] | undefined;
    expect(Object.keys(tags?.[0] ?? {})).toEqual(["date", "label"]);
    expect(Object.keys(units?.[0] ?? {})).toEqual(["isBoss", "unitName"]);
  });

  test("omits disabled groups, keeps empty enabled groups, and excludes exact Units and normalized Tags", () => {
    const options = createJsonOptions();
    const withoutGroups = createStructuredJsonRecords(createRows(), {
      ...options,
      selectedJsonTagFieldKeys: [],
      selectedJsonUnitFieldKeys: [],
    });
    expect(withoutGroups[0]).not.toHaveProperty("tags");
    expect(withoutGroups[0]).not.toHaveProperty("units");

    const filtered = createStructuredJsonRecords(createRows(), {
      ...options,
      excludedJsonTagKeys: ["research", "computing"],
      excludedJsonUnitIds: [ROOT_UNIT_ID, CHILD_UNIT_ID],
    });
    expect(filtered[0]).toMatchObject({ tags: [], units: [] });
  });

  test("supports collection and nested field naming and validates collisions", () => {
    const names = createDefaultExportJsonFieldNames();
    names.units.collection = "teams";
    names.units.fields.unitName = "name";
    names.tags.collection = "labels";
    names.employee.email = "username";
    const validation = validateExportFieldNames({
      jsonFieldNames: names,
      selectedEmployeeFieldKeys: ["username", "email"],
      selectedJsonTagFieldKeys: ["label"],
      selectedJsonUnitFieldKeys: ["unitName"],
      tabMode: "json",
    });
    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContainEqual({
      fieldKey: "email",
      fieldName: "username",
      group: "topLevel",
      kind: "duplicate",
      previousFieldKey: "username",
    });

    names.employee.email = "mail";
    const record = createStructuredJsonRecords(createRows(), {
      ...createJsonOptions(),
      jsonFieldNames: names,
      selectedJsonTagFieldKeys: ["label"],
      selectedJsonUnitFieldKeys: ["unitName"],
    })[0];
    expect(record).toMatchObject({
      labels: [{ label: "Research" }, { label: "Computing" }],
      teams: [{ name: "Research" }, { name: "Computing" }],
    });
  });

  test("bounds preview to 50 records", () => {
    const rows = Array.from({ length: 80 }, (_, index) => ({
      context: "employeeFallback" as const,
      employee: createEmployee({
        id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
        username: `employee-${index}`,
      }),
      unitContext: null,
    }));
    const preview = createExportPreview({
      ...createJsonOptions(),
      rows,
      tabMode: "json",
      templateFormat: "",
    });
    expect(preview.fullCount).toBe(80);
    expect(preview.shownCount).toBe(50);
    expect(preview.truncated).toBe(true);
  });
});

describe("Template export", () => {
  test("emits the exact unknown-year birthday in Template output", () => {
    expect(
      createExportText({
        ...createJsonOptions(),
        rows: createRows(createEmployee({ birthday: "29.02.1900" })).slice(0, 1),
        tabMode: "template",
        templateFormat: "{birthday}",
      }),
    ).toBe("29.02.1900");
  });

  test("keeps row mode output and Employee tag tokens", () => {
    const text = createExportText({
      ...createJsonOptions(),
      rows: createRows(),
      tabMode: "template",
      templateFormat: "{fullName}|{unitFullPath}|{tags}|{tagDates}\n",
    });
    expect(text).toContain(
      "Ada Lovelace|Research / Computing|Research; Computing|Computing=2026-12-10",
    );
  });

  test("does not synthesize a profile URL", () => {
    expect(
      getExportEmployeeFieldValue(createEmployee({ profileUrl: null }), "profileUrl"),
    ).toBeNull();
  });
});
