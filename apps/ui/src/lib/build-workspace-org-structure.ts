import type {
  Employee,
  EmployeeId,
  EmployeeUnitPosition,
  OrgEditorState,
  OrgEditorUnit,
  UiOrgStructure,
  Unit,
  UnitId,
  UnitMembership,
  UnitPath,
  WorkspaceEmployee,
} from "@org-tools/types";

import { createUiOrgStructure, createUnitPath } from "@/lib/build-ui-org-structure";
import {
  applyOrgEditorEmployeeOverride,
  createEmployeeFromOrgEditorEmployee,
} from "@/lib/employee-data";
import { buildEmployeeUnitMembershipIndex } from "@/lib/employee-unit-contexts";
import { resolveLiveUnitMemberships } from "@/lib/live-unit-filter";
import { getEffectiveLiveEmployeePosition } from "@/lib/live-unit-position";
import { createEmployeeSearchDocument } from "@/lib/search-index";

const createWorkspaceEmployee = (employee: WorkspaceEmployee): Employee => ({
  avatarBase64Url: employee.avatarBase64Url,
  birthday: employee.birthday,
  email: employee.email,
  firstName: employee.firstName,
  fullName:
    `${employee.firstName} ${employee.lastName}`.trim() ||
    employee.username ||
    employee.email ||
    "Employee",
  id: employee.id,
  lastName: employee.lastName,
  phone: employee.phone,
  profileUrl: employee.profileUrl,
  scope: "workspace",
  tags: employee.tags.map((tag) => ({ ...tag })),
  unitIds: [],
  unitPositions: [],
  username: employee.username,
});

const createPath = (parentPath: UnitPath | null, unit: OrgEditorUnit): UnitPath =>
  createUnitPath(parentPath, unit.id, unit.name);

const compareUnits = (firstUnit: OrgEditorUnit, secondUnit: OrgEditorUnit) => {
  const orderComparison = firstUnit.order - secondUnit.order;

  return orderComparison !== 0
    ? orderComparison
    : String(firstUnit.id).localeCompare(String(secondUnit.id));
};

export const createUnitMemberships = (state: OrgEditorState): UnitMembership[] =>
  state.units.flatMap((unit) =>
    unit.liveFilter !== null
      ? []
      : [...new Set(unit.employeeIds)].map((employeeId) => ({
          employeeId,
          isBoss: unit.bossEmployeeId === employeeId,
          position:
            unit.employeePositions.find(
              (employeePosition) => employeePosition.employeeId === employeeId,
            )?.position ?? null,
          unitId: unit.id,
        })),
  );

export type WorkspaceOrgStructureBuildResult = {
  liveEmployeeIdsByUnitId: Map<UnitId, EmployeeId[]>;
  structure: UiOrgStructure;
};

/**
 * Builds the shared derived model for the Units tab, the main Org View and
 * custom Org Views. Only the active document should be built.
 */
export const buildWorkspaceOrgStructureWithResolution = (
  workspaceEmployees: readonly WorkspaceEmployee[],
  state: OrgEditorState,
): WorkspaceOrgStructureBuildResult => {
  const employeesById = new Map<EmployeeId, Employee>();

  for (const workspaceEmployee of workspaceEmployees) {
    if (employeesById.has(workspaceEmployee.id)) {
      throw new Error(`Duplicate employee id: ${workspaceEmployee.id}.`);
    }

    employeesById.set(workspaceEmployee.id, createWorkspaceEmployee(workspaceEmployee));
  }

  for (const employeeOverride of state.employeeOverrides) {
    const employee = employeesById.get(employeeOverride.employeeId);

    if (!employee) continue;
    employeesById.set(
      employeeOverride.employeeId,
      applyOrgEditorEmployeeOverride(employee, employeeOverride),
    );
  }

  for (const localEmployee of state.employees) {
    if (employeesById.has(localEmployee.id)) {
      throw new Error(`Duplicate employee id: ${localEmployee.id}.`);
    }

    employeesById.set(localEmployee.id, createEmployeeFromOrgEditorEmployee(localEmployee));
  }

  const editorUnitById = new Map<UnitId, OrgEditorUnit>();
  for (const editorUnit of state.units) {
    if (editorUnitById.has(editorUnit.id)) {
      throw new Error(`Duplicate Unit id: ${editorUnit.id}.`);
    }
    editorUnitById.set(editorUnit.id, editorUnit);
  }

  const childrenByParentId = new Map<UnitId | null, OrgEditorUnit[]>();
  for (const editorUnit of state.units) {
    if (editorUnit.parentId !== null && !editorUnitById.has(editorUnit.parentId)) {
      throw new Error(`Unit ${editorUnit.id} has missing parent ${editorUnit.parentId}.`);
    }

    const children = childrenByParentId.get(editorUnit.parentId) ?? [];
    children.push(editorUnit);
    childrenByParentId.set(editorUnit.parentId, children);
  }
  for (const children of childrenByParentId.values()) children.sort(compareUnits);

  const unitsById = new Map<UnitId, Unit>();
  for (const editorUnit of state.units) {
    unitsById.set(editorUnit.id, {
      children: [],
      deepEmployeeIds: [],
      directEmployeeIds: [],
      id: editorUnit.id,
      name: editorUnit.name,
      membershipMode: editorUnit.liveFilter === null ? "manual" : "live",
      order: editorUnit.order,
      parentId: editorUnit.parentId,
      path: { fullName: "", ids: [], names: [] },
    });
  }

  const roots: Unit[] = [];
  const deepUnits: Unit[] = [];
  const visitedUnitIds = new Set<UnitId>();
  const visitingUnitIds = new Set<UnitId>();

  const visit = (editorUnit: OrgEditorUnit, parentPath: UnitPath | null): Unit => {
    if (visitingUnitIds.has(editorUnit.id)) {
      throw new Error(`Cycle detected at Unit ${editorUnit.id}.`);
    }

    const unit = unitsById.get(editorUnit.id);
    if (!unit) throw new Error(`Unit ${editorUnit.id} is missing.`);

    visitingUnitIds.add(editorUnit.id);
    unit.path = createPath(parentPath, editorUnit);
    unit.children = (childrenByParentId.get(editorUnit.id) ?? []).map((childUnit) =>
      visit(childUnit, unit.path),
    );
    visitingUnitIds.delete(editorUnit.id);
    visitedUnitIds.add(editorUnit.id);
    deepUnits.push(unit);

    return unit;
  };

  for (const editorRoot of childrenByParentId.get(null) ?? []) {
    roots.push(visit(editorRoot, null));
  }

  if (visitedUnitIds.size !== state.units.length) {
    throw new Error("Structure contains Units outside of its root forest.");
  }

  const memberships = createUnitMemberships(state);
  for (const membership of memberships) {
    const unit = unitsById.get(membership.unitId);
    if (!unit) continue;

    const employee = employeesById.get(membership.employeeId);
    if (!employee) continue;

    const unitPosition: EmployeeUnitPosition = {
      isBoss: membership.isBoss,
      parentId: unit.parentId,
      position: membership.position,
      unitId: unit.id,
      unitName: unit.name,
      unitPath: unit.path,
    };

    unit.directEmployeeIds.push(employee.id);
    employee.unitIds.push(unit.id);
    employee.unitPositions.push(unitPosition);
  }

  const allEmployees = [...employeesById.values()];
  const manualEmployeeSearchDocuments = allEmployees.map(createEmployeeSearchDocument);
  const manualMembershipsByEmployeeId = buildEmployeeUnitMembershipIndex(allEmployees);
  const liveResolution = resolveLiveUnitMemberships({
    documents: manualEmployeeSearchDocuments,
    manualMembershipsByEmployeeId,
    units: state.units,
  });
  const unitOrderById = new Map(deepUnits.map((unit, index) => [unit.id, index]));

  for (const editorUnit of state.units) {
    if (editorUnit.liveFilter === null) continue;

    const unit = unitsById.get(editorUnit.id);
    if (!unit) continue;
    const resolvedEmployeeIds = liveResolution.employeeIdsByUnitId.get(editorUnit.id) ?? [];
    const bossEmployeeId =
      editorUnit.bossEmployeeId !== null && resolvedEmployeeIds.includes(editorUnit.bossEmployeeId)
        ? editorUnit.bossEmployeeId
        : null;

    for (const employeeId of resolvedEmployeeIds) {
      const employee = employeesById.get(employeeId);
      if (!employee) continue;

      const unitPosition: EmployeeUnitPosition = {
        isBoss: bossEmployeeId === employeeId,
        parentId: unit.parentId,
        position: getEffectiveLiveEmployeePosition({
          employee,
          positionOverrides: editorUnit.employeePositions,
          rule: editorUnit.liveFilter,
          unitOrderById,
          unitsById,
        }),
        unitId: unit.id,
        unitName: unit.name,
        unitPath: unit.path,
      };

      unit.directEmployeeIds.push(employee.id);
      employee.unitIds.push(unit.id);
      employee.unitPositions.push(unitPosition);
    }
  }

  const collectDeepEmployeeIds = (unit: Unit): EmployeeId[] => {
    const deepEmployeeIds = new Set<EmployeeId>(unit.directEmployeeIds);

    for (const childUnit of unit.children) {
      for (const employeeId of collectDeepEmployeeIds(childUnit)) {
        deepEmployeeIds.add(employeeId);
      }
    }

    unit.deepEmployeeIds = [...deepEmployeeIds];
    return unit.deepEmployeeIds;
  };

  const deepEmployeeIdSet = new Set<EmployeeId>();
  for (const root of roots) {
    for (const employeeId of collectDeepEmployeeIds(root)) deepEmployeeIdSet.add(employeeId);
  }

  const deepEmployees = [...deepEmployeeIdSet]
    .map((employeeId) => employeesById.get(employeeId))
    .filter((employee): employee is Employee => Boolean(employee));
  const employeeSearchDocuments = allEmployees.map(createEmployeeSearchDocument);

  return {
    liveEmployeeIdsByUnitId: liveResolution.employeeIdsByUnitId,
    structure: createUiOrgStructure({
      allEmployees,
      deepEmployees,
      deepUnits,
      employeeSearchDocuments,
      employeesById,
      manualEmployeeSearchDocuments,
      roots,
      unitsById,
    }),
  };
};

export const buildWorkspaceOrgStructure = (
  workspaceEmployees: readonly WorkspaceEmployee[],
  state: OrgEditorState,
): UiOrgStructure => buildWorkspaceOrgStructureWithResolution(workspaceEmployees, state).structure;
