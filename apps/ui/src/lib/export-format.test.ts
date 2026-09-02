import type { Employee, EmployeeUnitPosition } from "@org-tools/types";
import { describe, expect, test } from "vitest";

import { buildEmployeeUnitContextIndex } from "@/lib/employee-unit-contexts";
import {
  buildEmployeeExportRows,
  countEmployeeExportRows,
  createExportText,
  getExportEmployeeFieldValue,
  validateExportFieldNames,
} from "@/lib/export-format";
import {
  createDefaultExportFieldNames,
  type ExportEmployeeFieldKey,
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
  unitPath: {
    fullName: "Research",
    ids: [ROOT_UNIT_ID],
    names: ["Research"],
  },
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
  birthday: "12-10",
  email: "ada@example.test",
  firstName: "Ada",
  fullName: "Ada Lovelace",
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
  gender: overrides.gender ?? "female",
});

const createText = ({
  employee,
  selectedEmployeeFieldKeys,
  tabMode,
}: {
  employee: Employee;
  selectedEmployeeFieldKeys: ExportEmployeeFieldKey[];
  tabMode: "csv" | "json" | "template";
}) =>
  createExportText({
    fieldNames: createDefaultExportFieldNames(),
    rows: [{ context: "employeeFallback", employee, unitContext: null }],
    selectedEmployeeFieldKeys,
    selectedFlatUnitFieldKeys: [],
    selectedJsonUnitFieldKeys: ["unitName"],
    tabMode,
    templateFormat: selectedEmployeeFieldKeys.map((field) => `{${field}}`).join(" | "),
    unitFullPathSeparator: " · ",
  });

describe("Employee export rows", () => {
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
    expect(firstRows).toHaveLength(1);
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

  test("retains an unassigned directly selected Employee in First Unit mode", () => {
    const employee = createEmployee({ unitIds: [], unitPositions: [] });
    const rows = buildEmployeeExportRows({
      employee,
      isDirectlySelected: true,
      mode: "firstUnit",
      unitContexts: [],
      unitOrderById: new Map(),
    });

    expect(rows).toEqual([{ context: "employeeFallback", employee, unitContext: null }]);
    expect(
      countEmployeeExportRows({
        isDirectlySelected: true,
        mode: "firstUnit",
        unitContexts: [],
        unitOrderById: new Map(),
      }),
    ).toBe(1);
  });
});

describe("generic export formats", () => {
  test("exports persisted profile, embedded avatar, birthday, tags, and contact fields directly", () => {
    const employee = createEmployee();
    const selectedEmployeeFieldKeys: ExportEmployeeFieldKey[] = [
      "firstName",
      "lastName",
      "email",
      "username",
      "profileUrl",
      "avatarBase64Url",
      "phone",
      "birthday",
      "gender",
      "tags",
    ];
    const json = JSON.parse(
      createText({ employee, selectedEmployeeFieldKeys, tabMode: "json" }),
    ) as Array<Record<string, unknown>>;

    expect(json[0]).toMatchObject({
      avatarBase64Url: EMBEDDED_AVATAR,
      birthday: "12-10",
      email: "ada@example.test",
      firstName: "Ada",
      gender: "female",
      lastName: "Lovelace",
      phone: "+1 555-0101",
      profileUrl: "https://example.test/profiles/ada",
      tags: ["Research", "Computing"],
      username: "ada",
      units: [],
    });
  });

  test("does not construct a profile URL from username", () => {
    const employee = createEmployee({ profileUrl: null, username: "standalone-handle" });
    expect(getExportEmployeeFieldValue(employee, "profileUrl")).toBeNull();
  });

  test("keeps Unit assignments nested in JSON", () => {
    const employee = createEmployee();
    const contexts = buildEmployeeUnitContextIndex([employee]).get(employee.id) ?? [];
    const rows = buildEmployeeExportRows({
      employee,
      isDirectlySelected: true,
      mode: "allUnits",
      unitContexts: contexts,
      unitOrderById: new Map([
        [ROOT_UNIT_ID, 0],
        [CHILD_UNIT_ID, 1],
      ]),
    });
    const json = JSON.parse(
      createExportText({
        fieldNames: createDefaultExportFieldNames(),
        rows,
        selectedEmployeeFieldKeys: ["username"],
        selectedFlatUnitFieldKeys: ["unitName", "position"],
        selectedJsonUnitFieldKeys: ["unitName", "position", "isBoss"],
        tabMode: "json",
        templateFormat: "",
        unitFullPathSeparator: " · ",
      }),
    ) as Array<{ units: Array<{ isBoss: boolean; position: string; unitName: string }> }>;

    expect(json[0]?.units).toEqual([
      { isBoss: true, position: "Research Lead", unitName: "Research" },
      { isBoss: false, position: "Systems Engineer", unitName: "Computing" },
    ]);
  });

  test("neutralizes formula-leading spreadsheet values", () => {
    const csv = createText({
      employee: createEmployee({ firstName: "=2+3" }),
      selectedEmployeeFieldKeys: ["firstName"],
      tabMode: "csv",
    });

    expect(csv).toBe('firstName\r\n"\'=2+3"');
  });

  test("keeps tags as arrays in JSON and renders them as text in flat formats", () => {
    const employee = createEmployee();
    expect(
      JSON.parse(createText({ employee, selectedEmployeeFieldKeys: ["tags"], tabMode: "json" }))[0]
        .tags,
    ).toEqual(["Research", "Computing"]);
    expect(createText({ employee, selectedEmployeeFieldKeys: ["tags"], tabMode: "template" })).toBe(
      "Research; Computing",
    );
  });
});

describe("export field names", () => {
  test("reports semantic duplicate, empty, and reserved output-name errors", () => {
    const fieldNames = createDefaultExportFieldNames();
    fieldNames.username = "identity";
    fieldNames.email = "identity";
    fieldNames.firstName = "";
    fieldNames.profileUrl = "units";

    const csvValidation = validateExportFieldNames({
      fieldNames,
      selectedEmployeeFieldKeys: ["username", "email", "firstName"],
      selectedFlatUnitFieldKeys: [],
      selectedJsonUnitFieldKeys: ["unitName"],
      tabMode: "csv",
    });
    const jsonValidation = validateExportFieldNames({
      fieldNames,
      selectedEmployeeFieldKeys: ["profileUrl"],
      selectedFlatUnitFieldKeys: [],
      selectedJsonUnitFieldKeys: ["unitName"],
      tabMode: "json",
    });

    expect(csvValidation.isValid).toBe(false);
    expect(csvValidation.errors).toEqual(
      expect.arrayContaining([
        {
          fieldKey: "email",
          fieldName: "identity",
          group: "csv",
          kind: "duplicate",
          previousFieldKey: "username",
        },
        { fieldKey: "firstName", group: "csv", kind: "missing" },
      ]),
    );
    expect(jsonValidation.errors).toContainEqual({
      fieldName: "units",
      group: "employee",
      kind: "reserved",
    });
  });
});
