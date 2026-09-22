import type {
  CustomEmployeeFieldDefinition,
  Employee,
  EmployeeId,
  EmployeeUnitPosition,
  UnitId,
} from "@org-tools/types";
import { describe, expect, test } from "vitest";

import { renderEmployeeDisplayLines } from "@/lib/employee-display";
import { createOrgUnitContext } from "@/lib/employee-unit-contexts";
import { OrgStore } from "@/stores/org-store";

const uuid = (value: number) => `00000000-0000-4000-8000-${String(value).padStart(12, "0")}`;

const employee: Employee = {
  avatarBase64Url: null,
  birthday: null,
  customFieldValues: { [uuid(20)]: "Staff" },
  email: "avery.stone@example.test",
  firstName: "Avery",
  fullName: "Avery Stone",
  gender: "unspecified",
  id: uuid(1) as EmployeeId,
  lastName: "Stone",
  phone: null,
  profileUrl: null,
  tagPriority: 0,
  tags: [
    { color: null, date: null, label: "Design", tagId: uuid(10) },
    { color: null, date: null, label: "Mentor", tagId: uuid(11) },
  ],
  unitIds: [uuid(2) as UnitId, uuid(3) as UnitId],
  unitPositions: [],
  username: "avery",
};

const unitPosition = (
  value: number,
  unitName: string,
  position: string | null,
  isBoss = false,
): EmployeeUnitPosition => ({
  isBoss,
  parentId: null,
  position,
  unitId: uuid(value) as UnitId,
  unitName,
  unitPath: { fullName: unitName, ids: [uuid(value) as UnitId], names: [unitName] },
});

describe("Employee display formats", () => {
  test("renders normalized lines with aggregate and contextual Unit values", () => {
    const contexts = [
      createOrgUnitContext(unitPosition(2, "Product", "Lead", true)),
      createOrgUnitContext(unitPosition(3, "Research", "Advisor")),
    ];
    const format = " {fullName} \n{position}\n{unitName}\n{isBoss}\n\n{tags}";
    expect(
      renderEmployeeDisplayLines({
        bossLabel: "Manager",
        customEmployeeFieldDefinitions: [],
        employee,
        format,
        unitContexts: contexts,
      }),
    ).toEqual(["Avery Stone", "Lead; Advisor", "Product; Research", "Manager", "Design; Mentor"]);
    expect(
      renderEmployeeDisplayLines({
        bossLabel: "Manager",
        customEmployeeFieldDefinitions: [],
        employee,
        format: "{position}\n{unitName}\n{isBoss}",
        unitContexts: contexts.slice(1, 2),
      }),
    ).toEqual(["Advisor", "Research"]);
    expect(
      renderEmployeeDisplayLines({
        bossLabel: "Manager",
        customEmployeeFieldDefinitions: [],
        employee,
        format: "\n  \n",
        unitContexts: contexts,
      }),
    ).toEqual([]);
  });

  test("renders custom fields and conditionals through the shared grammar", () => {
    const definition: CustomEmployeeFieldDefinition = {
      allowCustomOptions: false,
      id: uuid(20),
      key: "level",
      kind: "value",
      multiple: false,
      name: "Level",
      options: [],
      required: false,
      valueType: "text",
    };
    expect(
      renderEmployeeDisplayLines({
        bossLabel: "Manager",
        customEmployeeFieldDefinitions: [definition],
        employee,
        format: "{level ? 'Level: {level}' : ''}\n{phone}",
        unitContexts: [],
      }),
    ).toEqual(["Level: Staff"]);
  });

  test("rewrites and protects custom fields referenced by saved formats", () => {
    const store = new OrgStore();
    const definition: CustomEmployeeFieldDefinition = {
      allowCustomOptions: false,
      id: uuid(30),
      key: "focus",
      kind: "value",
      multiple: false,
      name: "Focus",
      options: [],
      required: false,
      valueType: "text",
    };
    store.saveEmployeeFieldDefinition(definition);
    store.setEmployeeDisplayFormats({ ...store.employeeDisplayFormats, employees: "{focus}" });
    expect(() => store.saveEmployeeFieldDefinition({ ...definition, key: "invalid key" })).toThrow(
      "Custom Employee field is invalid.",
    );
    expect(store.employeeDisplayFormats.employees).toBe("{focus}");
    store.saveEmployeeFieldDefinition({ ...definition, key: "specialty" });
    expect(store.employeeDisplayFormats.employees).toBe("{specialty}");
    expect(() => store.deleteEmployeeFieldDefinition(definition.id)).toThrow(
      "Custom Employee field is still in use.",
    );
  });
});
