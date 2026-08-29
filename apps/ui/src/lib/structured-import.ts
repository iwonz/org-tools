import type {
  EditableEmployeeFields,
  EmployeeLiveFilterRule,
  EmployeeTag,
  OrgEditorUnit,
  OrgToolsState,
  OrgToolsStateContent,
  WorkspaceEmployee,
} from "@org-tools/types";

import { LocalizedError, uiMessage } from "@/i18n/messages";
import {
  createUuid,
  normalizeEditableEmployeeFields,
  normalizeOptionalEmployeeText,
} from "@/lib/employee-data";
import { normalizeEmployeeTags } from "@/lib/employee-tags";
import { hasEmployeeLiveFilterCriteria } from "@/lib/live-unit-filter";
import { parseOrgToolsState } from "@/lib/org-file";
import { createStructuredSave } from "@/lib/structured-save";

export const MAX_STRUCTURED_IMPORT_EMPLOYEES = 20_000;
export const MAX_STRUCTURED_IMPORT_UNITS = 4_000;

export type MappedImportEmployee = Partial<EditableEmployeeFields> & {
  key: string;
  tags?: EmployeeTag[];
};

export type MappedImportUnitEmployee = {
  employeeKey: string;
  isBoss?: boolean;
  position?: string | null;
};

export type MappedImportLiveFilter = Omit<EmployeeLiveFilterRule, "selectedUnitIds"> & {
  selectedUnitKeys: string[];
};

export type MappedImportUnit = {
  children: MappedImportUnit[];
  collapsed?: boolean;
  employees: MappedImportUnitEmployee[];
  key: string;
  liveBossEmployeeKey?: string;
  liveFilter?: MappedImportLiveFilter;
  name: string;
  positionOverrides?: Array<{ employeeKey: string; position: string | null }>;
  x?: number;
  y?: number;
};

export type MappedImportDocument = {
  employees: MappedImportEmployee[];
  units: MappedImportUnit[];
};

export type StructuredImportEmployeePlan = {
  existingEmployeeId: string | null;
  fields: EditableEmployeeFields;
  key: string;
  status: "existing" | "new";
};

export type StructuredImportAssignmentPlan = {
  employeeKey: string;
  isBoss: boolean;
  position: string | null;
};

export type StructuredImportUnitPlan = {
  assignments: StructuredImportAssignmentPlan[];
  children: StructuredImportUnitPlan[];
  key: string;
  liveRoles: StructuredImportAssignmentPlan[];
  mode: "live" | "manual";
  name: string;
};

export type StructuredImportPlan = {
  assignmentCount: number;
  employees: StructuredImportEmployeePlan[];
  existingEmployeeCount: number;
  liveUnitCount: number;
  manualUnitCount: number;
  newEmployeeCount: number;
  unitCount: number;
  units: StructuredImportUnitPlan[];
};

export type StateImportOperation = "append" | "replace";

const normalizeIdentity = (value: string | null | undefined) =>
  value?.trim().toLocaleLowerCase("en-US") || null;

const normalizeMappedEmployee = (employee: MappedImportEmployee): EditableEmployeeFields =>
  normalizeEditableEmployeeFields({
    avatarBase64Url: employee.avatarBase64Url ?? null,
    birthday: employee.birthday ?? null,
    email: employee.email ?? null,
    firstName: employee.firstName ?? "",
    gender: employee.gender ?? "unspecified",
    lastName: employee.lastName ?? "",
    phone: employee.phone ?? null,
    profileUrl: employee.profileUrl ?? null,
    tags: normalizeEmployeeTags(employee.tags ?? []),
    username: employee.username ?? null,
  });

type ExistingStructuredEmployeeIdentity = Pick<WorkspaceEmployee, "email" | "id" | "username">;

const buildIdentityIndex = (
  employees: readonly ExistingStructuredEmployeeIdentity[],
  field: "email" | "username",
) => {
  const index = new Map<string, ExistingStructuredEmployeeIdentity[]>();
  for (const employee of employees) {
    const identity = normalizeIdentity(employee[field]);
    if (!identity) continue;
    const matches = index.get(identity) ?? [];
    matches.push(employee);
    index.set(identity, matches);
  }
  return index;
};

const normalizeLiveRule = (
  filter: MappedImportLiveFilter,
  unitIdByKey: ReadonlyMap<string, string>,
): EmployeeLiveFilterRule => {
  const selectedUnitIds = [...new Set(filter.selectedUnitKeys)].map((key) => {
    const id = unitIdByKey.get(key);
    if (!id) {
      throw new LocalizedError(uiMessage("Import reference is unknown: {key}.", { key }));
    }
    return id;
  });
  return {
    birthday: filter.birthday ? { ...filter.birthday } : null,
    includeWithoutTags: filter.includeWithoutTags,
    includeWithoutUnits: filter.includeWithoutUnits,
    query: filter.query.trim(),
    selectedPositions: [...new Set(filter.selectedPositions.map((value) => value.trim()))].filter(
      Boolean,
    ),
    selectedTags: normalizeEmployeeTags(filter.selectedTags).map(({ label }) => label),
    selectedUnitIds,
  };
};

const countAndValidateUnits = (
  units: readonly MappedImportUnit[],
  employeeKeys: ReadonlySet<string>,
  unitKeys: ReadonlySet<string>,
) => {
  let assignmentCount = 0;
  let liveUnitCount = 0;
  let manualUnitCount = 0;
  let unitCount = 0;
  const visit = (unit: MappedImportUnit) => {
    unitCount += 1;
    if (unitCount > MAX_STRUCTURED_IMPORT_UNITS) {
      throw new LocalizedError(uiMessage("Structured import is invalid."));
    }
    const isLive = unit.liveFilter !== undefined;
    if (isLive) {
      liveUnitCount += 1;
      const liveFilter = unit.liveFilter;
      if (!liveFilter) throw new LocalizedError(uiMessage("Structured import is invalid."));
      const placeholderIds = new Map([...unitKeys].map((key) => [key, key]));
      if (
        unit.employees.length > 0 ||
        !hasEmployeeLiveFilterCriteria(normalizeLiveRule(liveFilter, placeholderIds))
      ) {
        throw new LocalizedError(
          uiMessage("Live Unit {name} must have a non-empty filter and no direct Employees.", {
            name: unit.name,
          }),
        );
      }
      if (unit.liveBossEmployeeKey && !employeeKeys.has(unit.liveBossEmployeeKey)) {
        throw new LocalizedError(
          uiMessage("Import reference is unknown: {key}.", { key: unit.liveBossEmployeeKey }),
        );
      }
      const overrideKeys = new Set<string>();
      for (const override of unit.positionOverrides ?? []) {
        if (!employeeKeys.has(override.employeeKey) || overrideKeys.has(override.employeeKey)) {
          throw new LocalizedError(
            uiMessage("Unit {name} has invalid Live position overrides.", { name: unit.name }),
          );
        }
        overrideKeys.add(override.employeeKey);
      }
    } else {
      manualUnitCount += 1;
      if (unit.liveBossEmployeeKey || unit.positionOverrides) {
        throw new LocalizedError(
          uiMessage("Manual Unit {name} cannot have Live-only fields.", { name: unit.name }),
        );
      }
      const assignedKeys = new Set<string>();
      let bossCount = 0;
      for (const assignment of unit.employees) {
        if (!employeeKeys.has(assignment.employeeKey) || assignedKeys.has(assignment.employeeKey)) {
          throw new LocalizedError(
            uiMessage("Unit {name} has invalid Employee assignments.", { name: unit.name }),
          );
        }
        assignedKeys.add(assignment.employeeKey);
        if (assignment.isBoss) bossCount += 1;
      }
      if (bossCount > 1) {
        throw new LocalizedError(
          uiMessage("Unit {name} has invalid Employee assignments.", { name: unit.name }),
        );
      }
      assignmentCount += unit.employees.length;
    }
    for (const child of unit.children) visit(child);
  };
  for (const unit of units) visit(unit);
  return { assignmentCount, liveUnitCount, manualUnitCount, unitCount };
};

export const planMappedImport = (
  document: MappedImportDocument,
  existingEmployees: readonly ExistingStructuredEmployeeIdentity[],
): StructuredImportPlan => {
  if (document.employees.length > MAX_STRUCTURED_IMPORT_EMPLOYEES) {
    throw new LocalizedError(uiMessage("Structured import is invalid."));
  }
  const employeeKeys = document.employees.map(({ key }) => key.trim());
  if (employeeKeys.some((key) => !key) || new Set(employeeKeys).size !== employeeKeys.length) {
    throw new LocalizedError(uiMessage("Import key is missing or duplicated: {key}.", { key: "" }));
  }
  const usernameIndex = buildIdentityIndex(existingEmployees, "username");
  const emailIndex = buildIdentityIndex(existingEmployees, "email");
  const incomingUsernames = new Set<string>();
  const incomingEmails = new Set<string>();
  const employees = document.employees.map<StructuredImportEmployeePlan>((employee) => {
    const fields = normalizeMappedEmployee(employee);
    const username = normalizeIdentity(fields.username);
    const email = normalizeIdentity(fields.email);
    if ((username && incomingUsernames.has(username)) || (email && incomingEmails.has(email))) {
      throw new LocalizedError(uiMessage("Employee identities are ambiguous or duplicated."));
    }
    if (username) incomingUsernames.add(username);
    if (email) incomingEmails.add(email);
    const usernameMatches = username ? (usernameIndex.get(username) ?? []) : [];
    const emailMatches = email ? (emailIndex.get(email) ?? []) : [];
    const matchedIds = new Set([...usernameMatches, ...emailMatches].map(({ id }) => id));
    if (usernameMatches.length > 1 || emailMatches.length > 1 || matchedIds.size > 1) {
      throw new LocalizedError(uiMessage("Employee identities are ambiguous or duplicated."));
    }
    const existingEmployeeId = [...matchedIds][0] ?? null;
    return {
      existingEmployeeId,
      fields,
      key: employee.key,
      status: existingEmployeeId ? "existing" : "new",
    };
  });

  const unitKeyList: string[] = [];
  const toUnitPlan = (unit: MappedImportUnit): StructuredImportUnitPlan => {
    const key = unit.key.trim();
    if (!key || !unit.name.trim()) {
      throw new LocalizedError(uiMessage("Structured import is invalid."));
    }
    unitKeyList.push(key);
    const livePositionByEmployeeKey = new Map(
      (unit.positionOverrides ?? []).map(({ employeeKey, position }) => [
        employeeKey,
        normalizeOptionalEmployeeText(position),
      ]),
    );
    const liveRoleKeys = [
      ...(unit.liveBossEmployeeKey ? [unit.liveBossEmployeeKey] : []),
      ...(unit.positionOverrides ?? []).map(({ employeeKey }) => employeeKey),
    ];
    return {
      assignments: unit.liveFilter
        ? []
        : unit.employees.map(({ employeeKey, isBoss, position }) => ({
            employeeKey,
            isBoss: Boolean(isBoss),
            position: normalizeOptionalEmployeeText(position),
          })),
      children: unit.children.map(toUnitPlan),
      key,
      liveRoles: unit.liveFilter
        ? [...new Set(liveRoleKeys)].map((employeeKey) => ({
            employeeKey,
            isBoss: unit.liveBossEmployeeKey === employeeKey,
            position: livePositionByEmployeeKey.get(employeeKey) ?? null,
          }))
        : [],
      mode: unit.liveFilter ? "live" : "manual",
      name: unit.name.trim(),
    };
  };
  const units = document.units.map(toUnitPlan);
  if (new Set(unitKeyList).size !== unitKeyList.length) {
    throw new LocalizedError(uiMessage("Import key is missing or duplicated: {key}.", { key: "" }));
  }
  const counts = countAndValidateUnits(document.units, new Set(employeeKeys), new Set(unitKeyList));
  return {
    ...counts,
    employees,
    existingEmployeeCount: employees.filter(({ status }) => status === "existing").length,
    newEmployeeCount: employees.filter(({ status }) => status === "new").length,
    units,
  };
};

const stateProjectionToMappedDocument = (
  state: OrgToolsState,
  content: Exclude<OrgToolsStateContent, "workspace">,
): MappedImportDocument => {
  const projected = createStructuredSave(state, content);
  const main = projected.views[0];
  if (!main) throw new LocalizedError(uiMessage("Structured import is invalid."));
  const unitsByParent = new Map<string | null, OrgEditorUnit[]>();
  for (const unit of main.state.units) {
    const siblings = unitsByParent.get(unit.parentId) ?? [];
    siblings.push(unit);
    unitsByParent.set(unit.parentId, siblings);
  }
  for (const siblings of unitsByParent.values()) {
    siblings.sort((first, second) => first.order - second.order);
  }
  const toUnit = (unit: OrgEditorUnit): MappedImportUnit => ({
    children: (unitsByParent.get(unit.id) ?? []).map(toUnit),
    collapsed: unit.collapsed,
    employees: unit.liveFilter
      ? []
      : unit.employeeIds.map((employeeId) => ({
          employeeKey: employeeId,
          ...(unit.bossEmployeeId === employeeId ? { isBoss: true } : {}),
          position:
            unit.employeePositions.find((entry) => entry.employeeId === employeeId)?.position ??
            null,
        })),
    key: unit.id,
    ...(unit.liveFilter
      ? {
          ...(unit.bossEmployeeId ? { liveBossEmployeeKey: unit.bossEmployeeId } : {}),
          liveFilter: {
            ...unit.liveFilter,
            birthday: unit.liveFilter.birthday ? { ...unit.liveFilter.birthday } : null,
            selectedPositions: [...unit.liveFilter.selectedPositions],
            selectedTags: [...unit.liveFilter.selectedTags],
            selectedUnitKeys: [...unit.liveFilter.selectedUnitIds],
          },
          positionOverrides: unit.employeePositions.map(({ employeeId, position }) => ({
            employeeKey: employeeId,
            position,
          })),
        }
      : {}),
    name: unit.name,
    x: unit.x,
    y: unit.y,
  });
  return {
    employees: projected.employees.map((employee) => ({
      avatarBase64Url: employee.avatarBase64Url,
      birthday: employee.birthday,
      email: employee.email,
      firstName: employee.firstName,
      gender: employee.gender,
      key: employee.id,
      lastName: employee.lastName,
      phone: employee.phone,
      profileUrl: employee.profileUrl,
      tags: employee.tags.map((tag) => ({ ...tag })),
      username: employee.username,
    })),
    units: (unitsByParent.get(null) ?? []).map(toUnit),
  };
};

export const getAvailableStateImportContents = (
  content: OrgToolsStateContent,
): OrgToolsStateContent[] => {
  if (content === "workspace") return ["teams", "employees", "teamsEmployees", "workspace"];
  if (content === "teamsEmployees") return ["teams", "employees", "teamsEmployees"];
  return [content];
};

export const planStateImport = (
  source: OrgToolsState,
  content: Exclude<OrgToolsStateContent, "workspace">,
  existingEmployees: readonly ExistingStructuredEmployeeIdentity[],
): StructuredImportPlan =>
  planMappedImport(stateProjectionToMappedDocument(source, content), existingEmployees);

type StateImportCandidateOptions = { createId?: () => string; now?: string };

export const buildMappedImportCandidate = (
  currentState: OrgToolsState,
  document: MappedImportDocument,
  options: StateImportCandidateOptions = {},
): OrgToolsState => {
  const candidate = parseOrgToolsState(structuredClone(currentState));
  if (candidate.content !== "workspace") {
    throw new LocalizedError(uiMessage("Structured import is invalid."));
  }
  const plan = planMappedImport(document, candidate.employees);
  const createId = options.createId ?? createUuid;
  const now = options.now ?? new Date().toISOString();
  const employeeIdByKey = new Map<string, string>();
  for (const employee of plan.employees) {
    if (employee.existingEmployeeId) {
      employeeIdByKey.set(employee.key, employee.existingEmployeeId);
    } else {
      const id = createId();
      employeeIdByKey.set(employee.key, id);
      candidate.employees.push({ ...employee.fields, createdAt: now, id, updatedAt: now });
    }
  }

  const main = candidate.views.find(({ kind }) => kind === "main");
  if (!main) throw new LocalizedError(uiMessage("Structured import is invalid."));
  const unitIdByKey = new Map<string, string>();
  const allocate = (units: readonly MappedImportUnit[]) => {
    for (const unit of units) {
      unitIdByKey.set(unit.key, createId());
      allocate(unit.children);
    }
  };
  allocate(document.units);
  const existingRootOrder = main.state.units.reduce(
    (maximum, unit) => (unit.parentId === null ? Math.max(maximum, unit.order + 1) : maximum),
    0,
  );
  const sourceUnits: MappedImportUnit[] = [];
  const collect = (units: readonly MappedImportUnit[]) => {
    for (const unit of units) {
      sourceUnits.push(unit);
      collect(unit.children);
    }
  };
  collect(document.units);
  const sourceMinX = Math.min(...sourceUnits.map(({ x }) => x ?? 0), 0);
  const sourceMinY = Math.min(...sourceUnits.map(({ y }) => y ?? 0), 0);
  const currentMaxX = Math.max(...main.state.units.map(({ x }) => x), -420);
  const offsetX = currentMaxX + 420 - sourceMinX;
  const offsetY = -sourceMinY;
  let fallbackIndex = 0;
  const newUnits: OrgEditorUnit[] = [];
  const build = (unit: MappedImportUnit, parentId: string | null, order: number) => {
    const id = unitIdByKey.get(unit.key);
    if (!id) throw new LocalizedError(uiMessage("Structured import is invalid."));
    const employeeIds = unit.employees.map(({ employeeKey }) => {
      const employeeId = employeeIdByKey.get(employeeKey);
      if (!employeeId) {
        throw new LocalizedError(
          uiMessage("Import reference is unknown: {key}.", { key: employeeKey }),
        );
      }
      return employeeId;
    });
    const liveFilter = unit.liveFilter ? normalizeLiveRule(unit.liveFilter, unitIdByKey) : null;
    const bossAssignment = unit.employees.findIndex(({ isBoss }) => isBoss);
    const liveBossEmployeeId = unit.liveBossEmployeeKey
      ? employeeIdByKey.get(unit.liveBossEmployeeKey)
      : undefined;
    if (unit.liveBossEmployeeKey && !liveBossEmployeeId) {
      throw new LocalizedError(
        uiMessage("Import reference is unknown: {key}.", { key: unit.liveBossEmployeeKey }),
      );
    }
    const employeePositions = liveFilter
      ? (unit.positionOverrides ?? []).map(({ employeeKey, position }) => {
          const employeeId = employeeIdByKey.get(employeeKey);
          if (!employeeId) {
            throw new LocalizedError(
              uiMessage("Import reference is unknown: {key}.", { key: employeeKey }),
            );
          }
          return { employeeId, position: normalizeOptionalEmployeeText(position) };
        })
      : unit.employees.flatMap(({ position }, index) => {
          const employeeId = employeeIds[index];
          const normalized = normalizeOptionalEmployeeText(position);
          return employeeId && normalized ? [{ employeeId, position: normalized }] : [];
        });
    newUnits.push({
      bossEmployeeId: liveFilter
        ? (liveBossEmployeeId ?? null)
        : bossAssignment >= 0
          ? (employeeIds[bossAssignment] ?? null)
          : null,
      collapsed: unit.collapsed ?? false,
      createdAt: now,
      employeeIds: liveFilter ? [] : employeeIds,
      employeePositions,
      id,
      liveFilter,
      name: unit.name.trim(),
      order,
      parentId,
      updatedAt: now,
      x: (unit.x ?? fallbackIndex * 360) + offsetX,
      y: (unit.y ?? 0) + offsetY,
    });
    fallbackIndex += 1;
    unit.children.forEach((child, childIndex) => {
      build(child, id, childIndex);
    });
  };
  document.units.forEach((unit, index) => {
    build(unit, null, existingRootOrder + index);
  });
  main.state.units.push(...newUnits);
  main.updatedAt = now;
  return parseOrgToolsState(candidate);
};

export const buildStateImportCandidate = (
  currentState: OrgToolsState,
  source: OrgToolsState,
  content: OrgToolsStateContent,
  operation: StateImportOperation,
  options: StateImportCandidateOptions = {},
): OrgToolsState => {
  const available = getAvailableStateImportContents(source.content);
  if (!available.includes(content)) {
    throw new LocalizedError(uiMessage("Structured import is invalid."));
  }
  if (content === "workspace") {
    return parseOrgToolsState(structuredClone(source));
  }
  const partial = createStructuredSave(source, content);
  if (operation === "replace") {
    return parseOrgToolsState({ ...partial, content: "workspace" });
  }
  return buildMappedImportCandidate(
    currentState,
    stateProjectionToMappedDocument(partial, content),
    options,
  );
};
