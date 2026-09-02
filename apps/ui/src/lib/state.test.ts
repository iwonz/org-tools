import type { EditableEmployeeFields } from "@org-tools/types";
import { describe, expect, test } from "vitest";

import { isUuid } from "@/lib/employee-data";
import { isEmployeeId } from "@/lib/employee-id";
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
      employees: [],
      structure: { layoutMode: "topDown", units: [] },
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

  test("re-keys all durable Employee references after an identity edit", () => {
    const { employeeId, store, unitId } = populatedStore();
    store.addExportSelection({ employeeId, id: `employee:${employeeId}`, type: "employee" });
    store.orgEditor.setSelectedItems([{ employeeId, type: "employee", unitId }]);
    store.updateEmployee(employeeId, employeeFields({ email: "new@example.test" }), [
      { isBoss: true, position: "Lead", unitId },
    ]);
    const nextId = store.organizationEmployees[0]?.id;
    expect(nextId).not.toBe(employeeId);
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

  test("rejects old View state and mismatched Employee hashes", () => {
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

  test("uses SHA-256 IDs for Employees and UUIDs for Units", () => {
    const { employeeId, unitId } = populatedStore();
    expect(isEmployeeId(employeeId)).toBe(true);
    expect(isUuid(unitId)).toBe(true);
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
