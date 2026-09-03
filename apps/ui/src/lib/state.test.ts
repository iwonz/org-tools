import type { CustomEmployeeFieldDefinition, EditableEmployeeFields } from "@org-tools/types";
import { describe, expect, test } from "vitest";

import { isUuid } from "@/lib/employee-data";
import { isEmployeeId } from "@/lib/employee-id";
import { createEmptyEmployeeSearchFilters } from "@/lib/employee-search";
import { createEmptyEmployeeLiveFilterRule } from "@/lib/live-unit-filter";
import { createBlankOrgToolsState, parseOrgFileJson, parseOrgToolsState } from "@/lib/org-file";
import type { OrgEditorUnitConfiguration } from "@/stores/org-editor-store";
import { OrgStore } from "@/stores/org-store";

const uuid = (value: number) => `00000000-0000-4000-8000-${String(value).padStart(12, "0")}`;

const employeeFields = (
  overrides: Partial<EditableEmployeeFields> = {},
): EditableEmployeeFields => ({
  avatarBase64Url: null,
  birthday: null,
  email: "alex@example.test",
  firstName: "Alex",
  gender: "unspecified",
  lastName: "Morgan",
  phone: null,
  profileUrl: null,
  tags: [{ date: null, label: "Platform" }],
  username: "alex",
  ...overrides,
});

const manualUnit = (name: string): OrgEditorUnitConfiguration => ({
  assignments: [],
  bossEmployeeId: null,
  membershipMode: "manual",
  name,
});

const populatedStore = () => {
  const store = new OrgStore();
  const unitId = store.createUnit(manualUnit("Platform"));
  const employeeId = store.createEmployee(employeeFields(), [
    { isBoss: true, position: "Lead", unitId },
  ]);
  return { employeeId, store, unitId };
};

describe("OrgToolsState", () => {
  test("starts with one editable organization structure", () => {
    const store = new OrgStore();
    expect(store.activeTab).toBe("orgEditor");
    expect(store.units?.roots).toEqual([]);
    expect(store.createOrgToolsState().organization).toEqual({
      employeeFieldDefinitions: [],
      employees: [],
      structure: { layoutMode: "topDown", units: [] },
      tags: [],
    });
  });

  test("round-trips Employees, assignments, structure, and Editor UI", () => {
    const { employeeId, store, unitId } = populatedStore();
    store.updateEmployee(
      employeeId,
      employeeFields({ email: "alex.morgan@example.test", gender: "female" }),
      [{ isBoss: true, position: "Engineering Lead", unitId }],
    );
    const nextEmployeeId = store.organizationEmployees[0]?.id;
    if (!nextEmployeeId) throw new Error("Expected an Employee.");
    store.orgEditor.setViewport({ scale: 1.25, x: 40, y: 60 });
    store.orgEditor.setSelectedItems([{ type: "unit", unitId }]);
    store.setTheme("dark");

    const state = store.createOrgToolsState();
    const restored = new OrgStore();
    restored.loadOrgToolsState(
      parseOrgFileJson(JSON.parse(JSON.stringify(state))).state,
      "state.json",
      null,
    );

    expect(isEmployeeId(nextEmployeeId)).toBe(true);
    expect(restored.theme).toBe("dark");
    expect(restored.orgEditor.viewport).toEqual({ scale: 1.25, x: 40, y: 60 });
    expect(
      restored.uiOrgStructure?.indexes.employeesById.get(nextEmployeeId)?.unitPositions[0],
    ).toMatchObject({
      isBoss: true,
      position: "Engineering Lead",
      unitId,
    });
    expect(restored.createOrgToolsState()).toEqual(state);
  });

  test("keeps the stable Employee UUID after an identity edit", () => {
    const { employeeId, store, unitId } = populatedStore();
    store.addExportSelection({ employeeId, id: `employee:${employeeId}`, type: "employee" });
    store.orgEditor.setSelectedItems([{ employeeId, type: "employee", unitId }]);
    store.updateEmployee(employeeId, employeeFields({ email: "new@example.test" }), [
      { isBoss: true, position: "Lead", unitId },
    ]);
    const nextId = store.organizationEmployees[0]?.id;
    expect(nextId).toBe(employeeId);
    expect(store.orgEditor.units[0]?.employeeIds).toEqual([nextId]);
    expect(store.orgEditor.units[0]?.bossEmployeeId).toBe(nextId);
    expect(store.orgEditor.selectedItems).toEqual([
      { employeeId: nextId, type: "employee", unitId },
    ]);
    expect(store.exportSelections[0]).toMatchObject({ employeeId: nextId });
  });

  test("rejects duplicate normalized identities atomically", () => {
    const { store, unitId } = populatedStore();
    const before = store.createOrgToolsState();
    expect(() =>
      store.createEmployee(
        employeeFields({ email: " ALEX@EXAMPLE.TEST ", firstName: "ＡLEX", lastName: "Morgan" }),
        [{ isBoss: false, position: null, unitId }],
      ),
    ).toThrow("already exists");
    expect(store.createOrgToolsState()).toEqual(before);
  });

  test("rejects old View state and non-UUID Employee IDs", () => {
    const state = populatedStore().store.createOrgToolsState();
    const oldShape = structuredClone(state) as unknown as Record<string, unknown>;
    oldShape.organization = { employees: state.organization.employees, views: [] };
    expect(() => parseOrgToolsState(oldShape)).toThrow("top-level structure");

    const mismatched = structuredClone(state);
    const employee = mismatched.organization.employees[0];
    if (!employee) throw new Error("Expected an Employee.");
    employee.id = "0".repeat(64);
    expect(() => parseOrgToolsState(mismatched)).toThrow("invalid Employee");
  });

  test("accepts complete birthdays and rejects obsolete birthday state", () => {
    const state = populatedStore().store.createOrgToolsState();
    const employee = state.organization.employees[0];
    if (!employee) throw new Error("Expected an Employee.");
    employee.birthday = "29.02.1900";
    expect(parseOrgToolsState(state).organization.employees[0]?.birthday).toBe("29.02.1900");

    const obsolete = structuredClone(state);
    const obsoleteEmployee = obsolete.organization.employees[0];
    if (!obsoleteEmployee) throw new Error("Expected an Employee.");
    obsoleteEmployee.birthday = "02-29";
    expect(() => parseOrgToolsState(obsolete)).toThrow("invalid Employee");
  });

  test("rejects obsolete CSV and flat Unit Download state", () => {
    const state = createBlankOrgToolsState();
    const obsolete = structuredClone(state) as unknown as {
      ui: { download: Record<string, unknown> };
    };
    obsolete.ui.download = {
      ...obsolete.ui.download,
      flatUnitFieldOrder: ["unitName"],
      tabMode: "csv",
      unitFullPathSeparator: " / ",
    };
    expect(() => parseOrgToolsState(obsolete)).toThrow("invalid durable UI state");
  });

  test("requires one complete unified JSON top-level field order", () => {
    const state = createBlankOrgToolsState();
    state.ui.download.jsonTopLevelFieldOrder = [
      "tags",
      "username",
      "units",
      ...state.ui.download.jsonTopLevelFieldOrder.filter(
        (field) => field !== "tags" && field !== "username" && field !== "units",
      ),
    ];
    expect(parseOrgToolsState(state).ui.download.jsonTopLevelFieldOrder.slice(0, 3)).toEqual([
      "tags",
      "username",
      "units",
    ]);

    const missing = structuredClone(state);
    missing.ui.download.jsonTopLevelFieldOrder.pop();
    expect(() => parseOrgToolsState(missing)).toThrow("invalid durable UI state");

    const obsolete = structuredClone(state) as unknown as {
      ui: { download: Record<string, unknown> };
    };
    obsolete.ui.download.employeeFieldOrder = obsolete.ui.download.jsonTopLevelFieldOrder;
    delete obsolete.ui.download.jsonTopLevelFieldOrder;
    expect(() => parseOrgToolsState(obsolete)).toThrow("invalid durable UI state");
  });

  test("uses UUIDs for Employees and Units", () => {
    const { employeeId, unitId } = populatedStore();
    expect(isEmployeeId(employeeId)).toBe(true);
    expect(isUuid(unitId)).toBe(true);
  });

  test("enforces required custom values on the next Employee save", () => {
    const { employeeId, store, unitId } = populatedStore();
    const definition: CustomEmployeeFieldDefinition = {
      id: uuid(301),
      key: "department",
      kind: "value",
      name: "Department",
      options: [],
      required: true,
      valueType: "text",
    };
    store.saveEmployeeFieldDefinition(definition);

    expect(() =>
      store.updateEmployee(employeeId, employeeFields(), [
        { isBoss: true, position: "Lead", unitId },
      ]),
    ).toThrow("required custom field");

    store.updateEmployee(
      employeeId,
      employeeFields({ customFieldValues: { [definition.id]: "Engineering" } }),
      [{ isBoss: true, position: "Lead", unitId }],
    );
    expect(store.organizationEmployees[0]?.customFieldValues[definition.id]).toBe("Engineering");
  });

  test("clears incompatible values and filters when a Value field type changes", () => {
    const { employeeId, store, unitId } = populatedStore();
    const definition: CustomEmployeeFieldDefinition = {
      id: uuid(302),
      key: "department",
      kind: "value",
      name: "Department",
      options: [],
      required: false,
      valueType: "text",
    };
    store.saveEmployeeFieldDefinition(definition);
    store.updateEmployee(
      employeeId,
      employeeFields({ customFieldValues: { [definition.id]: "Engineering" } }),
      [{ isBoss: true, position: "Lead", unitId }],
    );
    store.setEmployeesUi("", {
      ...createEmptyEmployeeSearchFilters(),
      customFields: [
        { fieldId: definition.id, includeUnset: false, selectedValues: ["Engineering"] },
      ],
    });
    const liveUnitId = store.createUnit({
      bossEmployeeId: null,
      liveFilter: {
        ...createEmptyEmployeeLiveFilterRule(),
        customFields: [
          { fieldId: definition.id, includeUnset: false, selectedValues: ["Engineering"] },
        ],
      },
      membershipMode: "live",
      name: "Department view",
      positionOverrides: [],
    });

    store.saveEmployeeFieldDefinition({ ...definition, valueType: "number" });

    expect(store.organizationEmployees[0]?.customFieldValues[definition.id]).toBeUndefined();
    expect(store.employeesUi.filters.customFields).toEqual([]);
    expect(store.orgEditor.units.find((unit) => unit.id === liveUnitId)?.liveFilter).toBeNull();
    expect(() => store.createOrgToolsState()).not.toThrow();
  });

  test("cascades Tag deletion through assignments and saved filters", () => {
    const { store } = populatedStore();
    const tag = store.tagDefinitions[0];
    if (!tag) throw new Error("Expected a Tag definition.");
    store.setEmployeesUi("", {
      ...createEmptyEmployeeSearchFilters(),
      selectedTags: [tag.id],
    });
    const liveUnitId = store.createUnit({
      bossEmployeeId: null,
      liveFilter: { ...createEmptyEmployeeLiveFilterRule(), selectedTags: [tag.id] },
      membershipMode: "live",
      name: "Tagged Employees",
      positionOverrides: [],
    });

    store.deleteTagDefinition(tag.id);

    expect(store.tagDefinitions).toEqual([]);
    expect(store.organizationEmployees[0]?.tags).toEqual([]);
    expect(store.employeesUi.filters.selectedTags).toEqual([]);
    expect(store.orgEditor.units.find((unit) => unit.id === liveUnitId)?.liveFilter).toBeNull();
    expect(() => store.createOrgToolsState()).not.toThrow();
  });

  test("rejects missing references and cyclic Live Unit dependencies", () => {
    const { store } = populatedStore();
    const invalid = structuredClone(store.createOrgToolsState());
    const unit = invalid.organization.structure.units[0];
    if (!unit) throw new Error("Expected a Unit.");
    unit.parentId = uuid(999);
    expect(() => parseOrgToolsState(invalid)).toThrow("missing parent Unit");

    const state = createBlankOrgToolsState();
    const now = "2026-09-02T00:00:00.000Z";
    const firstId = uuid(101);
    const secondId = uuid(102);
    const rule = (selectedUnitIds: string[]) => ({
      ...createEmptyEmployeeLiveFilterRule(),
      selectedUnitIds,
    });
    state.organization.structure.units = [
      {
        bossEmployeeId: null,
        collapsed: false,
        createdAt: now,
        employeeIds: [],
        employeePositions: [],
        id: firstId,
        liveFilter: rule([secondId]),
        name: "First",
        order: 0,
        parentId: null,
        updatedAt: now,
        x: 0,
        y: 0,
      },
      {
        bossEmployeeId: null,
        collapsed: false,
        createdAt: now,
        employeeIds: [],
        employeePositions: [],
        id: secondId,
        liveFilter: rule([firstId]),
        name: "Second",
        order: 1,
        parentId: null,
        updatedAt: now,
        x: 360,
        y: 0,
      },
    ];
    expect(() => parseOrgToolsState(state)).toThrow("cyclic dependency");
  });
});
