import type {
  AppLocale,
  EditableEmployeeFields,
  EmployeeId,
  EmployeeLiveFilterRule,
  EmployeeTag,
  OrganizationEmployee,
  OrgEditorCanvasViewport,
  OrgEditorEmployee,
  OrgEditorEmployeeOverride,
  OrgEditorEmployeePosition,
  OrgEditorLayoutMode,
  OrgEditorSelectedItem,
  OrgEditorUnit,
  OrgToolsDownloadSelection,
  OrgToolsDownloadState,
  OrgToolsEmployeeFilters,
  OrgToolsState,
  OrgToolsUiState,
  OrgToolsViewDocument,
  OrgView,
  UiActiveTab,
  UiTheme,
  UnitId,
} from "@org-tools/types";

import {
  createUuid,
  isEmployeeGender,
  isUuid,
  normalizeEditableEmployeeFields,
} from "@/lib/employee-data";
import { isValidEmployeeTagDate } from "@/lib/employee-tags";
import { getLiveUnitTopologicalOrder, hasEmployeeLiveFilterCriteria } from "@/lib/live-unit-filter";
import { createDefaultOrgEditorState } from "@/lib/org-editor";

export type LoadedOrgFile = {
  kind: "orgToolsState";
  state: OrgToolsState;
};

const EMPLOYEE_FIELD_KEYS = [
  "avatarBase64Url",
  "birthday",
  "email",
  "firstName",
  "gender",
  "lastName",
  "phone",
  "profileUrl",
  "tags",
  "username",
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const hasExactKeys = (value: Record<string, unknown>, requiredKeys: readonly string[]): boolean => {
  const allowedKeys = new Set(requiredKeys);
  return (
    requiredKeys.every((key) => Object.hasOwn(value, key)) &&
    Object.keys(value).every((key) => allowedKeys.has(key))
  );
};

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
const isString = (value: unknown): value is string => typeof value === "string";
const isNullableString = (value: unknown): value is string | null =>
  value === null || isString(value);
const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(isString);
const isUuidArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(isUuid);
const isTimestamp = (value: unknown): value is string =>
  isString(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString() === value;

const isTheme = (value: unknown): value is UiTheme =>
  value === "light" || value === "dark" || value === "system";
const isLocale = (value: unknown): value is AppLocale => value === "en" || value === "ru";
const isActiveTab = (value: unknown): value is UiActiveTab =>
  value === "units" ||
  value === "employees" ||
  value === "orgEditor" ||
  value === "export" ||
  value === "analytics" ||
  value === "calendar";
const isLayoutMode = (value: unknown): value is OrgEditorLayoutMode =>
  value === "leftRight" || value === "topDown";

const normalizeTagRecords = (value: unknown): EmployeeTag[] | null => {
  if (!Array.isArray(value)) return null;
  const tags: EmployeeTag[] = [];
  const dateByNormalizedLabel = new Map<string, string | null>();
  for (const item of value) {
    if (
      !isRecord(item) ||
      !hasExactKeys(item, ["date", "label"]) ||
      !isString(item.label) ||
      !(item.date === null || (isString(item.date) && isValidEmployeeTagDate(item.date)))
    ) {
      return null;
    }
    const label = item.label.trim();
    const normalizedLabel = label.toLocaleLowerCase("en-US");
    if (!normalizedLabel) return null;
    if (dateByNormalizedLabel.has(normalizedLabel)) {
      if (dateByNormalizedLabel.get(normalizedLabel) !== item.date) return null;
      continue;
    }
    dateByNormalizedLabel.set(normalizedLabel, item.date);
    tags.push({ date: item.date, label });
  }
  return tags;
};

const normalizeEmployeeFields = (value: Record<string, unknown>): EditableEmployeeFields | null => {
  const tags = normalizeTagRecords(value.tags);
  if (
    !isNullableString(value.avatarBase64Url) ||
    !isNullableString(value.birthday) ||
    !isNullableString(value.email) ||
    !isString(value.firstName) ||
    !isEmployeeGender(value.gender) ||
    !isString(value.lastName) ||
    !isNullableString(value.phone) ||
    !isNullableString(value.profileUrl) ||
    !tags ||
    !isNullableString(value.username)
  ) {
    return null;
  }

  try {
    const fields = normalizeEditableEmployeeFields({
      avatarBase64Url: value.avatarBase64Url,
      birthday: value.birthday,
      email: value.email,
      firstName: value.firstName,
      gender: value.gender,
      lastName: value.lastName,
      phone: value.phone,
      profileUrl: value.profileUrl,
      tags,
      username: value.username,
    });
    return fields;
  } catch {
    return null;
  }
};

const normalizeLiveFilterRule = (value: unknown): EmployeeLiveFilterRule | null => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "birthday",
      "includeWithoutTags",
      "includeWithoutUnits",
      "query",
      "selectedPositions",
      "selectedTags",
      "selectedUnitIds",
    ]) ||
    !isString(value.query) ||
    typeof value.includeWithoutTags !== "boolean" ||
    typeof value.includeWithoutUnits !== "boolean" ||
    !isStringArray(value.selectedPositions) ||
    !isStringArray(value.selectedTags) ||
    !isUuidArray(value.selectedUnitIds)
  ) {
    return null;
  }

  let birthday: EmployeeLiveFilterRule["birthday"];
  if (value.birthday === null) {
    birthday = null;
  } else if (
    isRecord(value.birthday) &&
    hasExactKeys(value.birthday, ["day", "month"]) &&
    Number.isInteger(value.birthday.day) &&
    Number.isInteger(value.birthday.month)
  ) {
    const day = value.birthday.day as number;
    const month = value.birthday.month as number;
    const date = new Date(Date.UTC(2000, month - 1, day));
    if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
    birthday = { day, month };
  } else {
    return null;
  }

  return {
    birthday,
    includeWithoutTags: value.includeWithoutTags,
    includeWithoutUnits: value.includeWithoutUnits,
    query: value.query.trim(),
    selectedPositions: [
      ...new Set(value.selectedPositions.map((position) => position.trim())),
    ].filter(Boolean),
    selectedTags: [...new Set(value.selectedTags.map((tag) => tag.trim()))].filter(Boolean),
    selectedUnitIds: [...value.selectedUnitIds],
  };
};

const normalizeEditorEmployee = (value: unknown): OrgEditorEmployee | null => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [...EMPLOYEE_FIELD_KEYS, "createdAt", "id", "updatedAt"])
  ) {
    return null;
  }
  const fields = normalizeEmployeeFields(value);
  if (
    !fields ||
    !isUuid(value.id) ||
    !isTimestamp(value.createdAt) ||
    !isTimestamp(value.updatedAt)
  ) {
    return null;
  }
  return { ...fields, createdAt: value.createdAt, id: value.id, updatedAt: value.updatedAt };
};

const normalizeEmployeeOverride = (value: unknown): OrgEditorEmployeeOverride | null => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [...EMPLOYEE_FIELD_KEYS, "employeeId", "updatedAt"])
  ) {
    return null;
  }
  const fields = normalizeEmployeeFields(value);
  if (!fields || !isUuid(value.employeeId) || !isTimestamp(value.updatedAt)) return null;
  return { ...fields, employeeId: value.employeeId, updatedAt: value.updatedAt };
};

const normalizeEmployeePositions = (value: unknown): OrgEditorEmployeePosition[] | null => {
  if (!Array.isArray(value)) return null;
  const positions: OrgEditorEmployeePosition[] = [];
  for (const position of value) {
    if (
      !isRecord(position) ||
      !hasExactKeys(position, ["employeeId", "position"]) ||
      !isUuid(position.employeeId) ||
      !isNullableString(position.position)
    ) {
      return null;
    }
    positions.push({
      employeeId: position.employeeId,
      position: position.position?.trim() || null,
    });
  }
  return positions;
};

const normalizeEditorUnit = (value: unknown): OrgEditorUnit | null => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "bossEmployeeId",
      "collapsed",
      "createdAt",
      "employeeIds",
      "employeePositions",
      "id",
      "liveFilter",
      "name",
      "order",
      "parentId",
      "updatedAt",
      "x",
      "y",
    ]) ||
    !isUuid(value.id) ||
    !(value.parentId === null || isUuid(value.parentId)) ||
    !(value.bossEmployeeId === null || isUuid(value.bossEmployeeId)) ||
    typeof value.collapsed !== "boolean" ||
    !isTimestamp(value.createdAt) ||
    !isUuidArray(value.employeeIds) ||
    !isString(value.name) ||
    !value.name.trim() ||
    !Number.isInteger(value.order) ||
    (value.order as number) < 0 ||
    !isTimestamp(value.updatedAt) ||
    !isFiniteNumber(value.x) ||
    !isFiniteNumber(value.y)
  ) {
    return null;
  }

  const employeePositions = normalizeEmployeePositions(value.employeePositions);
  if (!employeePositions) return null;
  const liveFilter = value.liveFilter === null ? null : normalizeLiveFilterRule(value.liveFilter);
  if (value.liveFilter !== null && !liveFilter) return null;
  if (liveFilter && value.employeeIds.length > 0) return null;

  return {
    bossEmployeeId: value.bossEmployeeId,
    collapsed: value.collapsed,
    createdAt: value.createdAt,
    employeeIds: [...value.employeeIds],
    employeePositions,
    id: value.id,
    liveFilter,
    name: value.name.trim(),
    order: value.order as number,
    parentId: value.parentId,
    updatedAt: value.updatedAt,
    x: value.x,
    y: value.y,
  };
};

const normalizeSelectedItem = (value: unknown): OrgEditorSelectedItem | null => {
  if (!isRecord(value) || !isUuid(value.unitId)) return null;
  if (value.type === "unit" && hasExactKeys(value, ["type", "unitId"])) {
    return { type: "unit", unitId: value.unitId };
  }
  if (
    value.type === "employee" &&
    hasExactKeys(value, ["employeeId", "type", "unitId"]) &&
    isUuid(value.employeeId)
  ) {
    return { employeeId: value.employeeId, type: "employee", unitId: value.unitId };
  }
  return null;
};

const normalizeViewport = (value: unknown): OrgEditorCanvasViewport | null => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ["scale", "x", "y"]) ||
    !isFiniteNumber(value.scale) ||
    value.scale <= 0 ||
    !isFiniteNumber(value.x) ||
    !isFiniteNumber(value.y)
  ) {
    return null;
  }
  return { scale: value.scale, x: value.x, y: value.y };
};

const normalizeEditorDocument = (value: unknown): OrgToolsViewDocument["document"] | null => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ["employeeOverrides", "employees", "layoutMode", "units"]) ||
    !Array.isArray(value.employeeOverrides) ||
    !Array.isArray(value.employees) ||
    !isLayoutMode(value.layoutMode) ||
    !Array.isArray(value.units)
  ) {
    return null;
  }

  const employeeOverrides = value.employeeOverrides.map(normalizeEmployeeOverride);
  const employees = value.employees.map(normalizeEditorEmployee);
  const units = value.units.map(normalizeEditorUnit);
  if (
    employeeOverrides.some((item) => !item) ||
    employees.some((item) => !item) ||
    units.some((item) => !item)
  ) {
    return null;
  }

  return {
    employeeOverrides: employeeOverrides as OrgEditorEmployeeOverride[],
    employees: employees as OrgEditorEmployee[],
    layoutMode: value.layoutMode,
    units: units as OrgEditorUnit[],
  };
};

const normalizeOrganizationEmployee = (value: unknown): OrganizationEmployee | null => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [...EMPLOYEE_FIELD_KEYS, "createdAt", "id", "updatedAt"])
  ) {
    return null;
  }
  const fields = normalizeEmployeeFields(value);
  if (
    !fields ||
    !isUuid(value.id) ||
    !isTimestamp(value.createdAt) ||
    !isTimestamp(value.updatedAt)
  ) {
    return null;
  }
  return { ...fields, createdAt: value.createdAt, id: value.id, updatedAt: value.updatedAt };
};

const normalizeOrgViewDocument = (value: unknown): OrgToolsViewDocument | null => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ["createdAt", "document", "id", "kind", "name", "updatedAt"]) ||
    !isString(value.name) ||
    !value.name.trim() ||
    !isTimestamp(value.createdAt) ||
    !isTimestamp(value.updatedAt) ||
    !isUuid(value.id) ||
    (value.kind !== "main" && value.kind !== "custom")
  ) {
    return null;
  }
  const document = normalizeEditorDocument(value.document);
  if (!document) return null;
  return {
    createdAt: value.createdAt,
    document,
    id: value.id,
    kind: value.kind,
    name: value.name.trim(),
    updatedAt: value.updatedAt,
  };
};

const normalizeEmployeeSearchFilters = (value: unknown): OrgToolsEmployeeFilters | null => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "birthday",
      "includeWithoutTags",
      "includeWithoutUnits",
      "selectedGenders",
      "selectedPositions",
      "selectedTags",
      "selectedUnitIds",
    ]) ||
    typeof value.includeWithoutTags !== "boolean" ||
    typeof value.includeWithoutUnits !== "boolean" ||
    !Array.isArray(value.selectedGenders) ||
    !value.selectedGenders.every(isEmployeeGender) ||
    !isStringArray(value.selectedPositions) ||
    !isStringArray(value.selectedTags) ||
    !isUuidArray(value.selectedUnitIds)
  ) {
    return null;
  }
  let birthday: OrgToolsEmployeeFilters["birthday"] = null;
  if (value.birthday !== null) {
    if (
      !isRecord(value.birthday) ||
      !hasExactKeys(value.birthday, ["day", "month"]) ||
      !Number.isInteger(value.birthday.day) ||
      !Number.isInteger(value.birthday.month)
    ) {
      return null;
    }
    const day = value.birthday.day as number;
    const month = value.birthday.month as number;
    const date = new Date(Date.UTC(2000, month - 1, day));
    if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
    birthday = { day, month };
  }
  return {
    birthday,
    includeWithoutTags: value.includeWithoutTags,
    includeWithoutUnits: value.includeWithoutUnits,
    selectedGenders: [...value.selectedGenders],
    selectedPositions: [...value.selectedPositions],
    selectedTags: [...value.selectedTags],
    selectedUnitIds: [...value.selectedUnitIds],
  };
};

const normalizeDownloadSelection = (value: unknown): OrgToolsDownloadSelection | null => {
  if (!isRecord(value) || !isString(value.id) || !value.id) return null;
  if (
    value.type === "unit" &&
    hasExactKeys(value, ["id", "type", "unitId"]) &&
    isUuid(value.unitId)
  ) {
    return { id: value.id, type: "unit", unitId: value.unitId };
  }
  if (
    value.type === "employee" &&
    hasExactKeys(value, ["employeeId", "id", "type"]) &&
    isUuid(value.employeeId)
  ) {
    return { employeeId: value.employeeId, id: value.id, type: "employee" };
  }
  return null;
};

const normalizeStringRecord = (value: unknown): Record<string, string> | null => {
  if (!isRecord(value) || Object.values(value).some((entry) => !isString(entry))) return null;
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, entry as string]));
};

const normalizeDownloadState = (value: unknown): OrgToolsDownloadState | null => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "employeeFieldOrder",
      "employeeFilters",
      "employeeQuery",
      "excludedEmployeeIds",
      "fieldNames",
      "flatUnitFieldOrder",
      "jsonUnitFieldOrder",
      "rowMode",
      "sourceViewId",
      "selectedEmployeeFieldKeys",
      "selectedFilters",
      "selectedFlatUnitFieldKeys",
      "selectedJsonUnitFieldKeys",
      "selectedQuery",
      "selections",
      "tabMode",
      "templateFormat",
      "unitFullPathSeparator",
      "unitQuery",
    ]) ||
    !isStringArray(value.employeeFieldOrder) ||
    !isString(value.employeeQuery) ||
    !isUuidArray(value.excludedEmployeeIds) ||
    !isStringArray(value.flatUnitFieldOrder) ||
    !isStringArray(value.jsonUnitFieldOrder) ||
    (value.rowMode !== "allUnits" && value.rowMode !== "firstUnit") ||
    !isUuid(value.sourceViewId) ||
    !isStringArray(value.selectedEmployeeFieldKeys) ||
    !isStringArray(value.selectedFlatUnitFieldKeys) ||
    !isStringArray(value.selectedJsonUnitFieldKeys) ||
    !isString(value.selectedQuery) ||
    !Array.isArray(value.selections) ||
    (value.tabMode !== "csv" && value.tabMode !== "json" && value.tabMode !== "template") ||
    !isString(value.templateFormat) ||
    !isString(value.unitFullPathSeparator) ||
    value.unitFullPathSeparator.length > 5 ||
    !isString(value.unitQuery)
  ) {
    return null;
  }
  const employeeFilters = normalizeEmployeeSearchFilters(value.employeeFilters);
  const selectedFilters = normalizeEmployeeSearchFilters(value.selectedFilters);
  const fieldNames = normalizeStringRecord(value.fieldNames);
  const selections = value.selections.map(normalizeDownloadSelection);
  if (!employeeFilters || !selectedFilters || !fieldNames || selections.some((item) => !item)) {
    return null;
  }
  return {
    employeeFieldOrder: [...value.employeeFieldOrder],
    employeeFilters,
    employeeQuery: value.employeeQuery,
    excludedEmployeeIds: [...value.excludedEmployeeIds],
    fieldNames,
    flatUnitFieldOrder: [...value.flatUnitFieldOrder],
    jsonUnitFieldOrder: [...value.jsonUnitFieldOrder],
    rowMode: value.rowMode,
    sourceViewId: value.sourceViewId,
    selectedEmployeeFieldKeys: [...value.selectedEmployeeFieldKeys],
    selectedFilters,
    selectedFlatUnitFieldKeys: [...value.selectedFlatUnitFieldKeys],
    selectedJsonUnitFieldKeys: [...value.selectedJsonUnitFieldKeys],
    selectedQuery: value.selectedQuery,
    selections: selections as OrgToolsDownloadSelection[],
    tabMode: value.tabMode,
    templateFormat: value.templateFormat,
    unitFullPathSeparator: value.unitFullPathSeparator,
    unitQuery: value.unitQuery,
  };
};

const assertUniqueIds = (ids: readonly string[], message: string): void => {
  if (new Set(ids).size !== ids.length) throw new Error(message);
};

const validateEditorStateGraph = (
  view: OrgView,
  organizationEmployeeIds: ReadonlySet<EmployeeId>,
  allLocalEmployeeIds: Set<EmployeeId>,
  allUnitIds: Set<UnitId>,
): void => {
  const localEmployeeIdList = view.state.employees.map((employee) => employee.id);
  assertUniqueIds(localEmployeeIdList, `View "${view.name}" has duplicate Employee IDs.`);
  const localEmployeeIds = new Set(localEmployeeIdList);
  for (const employeeId of localEmployeeIds) {
    if (organizationEmployeeIds.has(employeeId) || allLocalEmployeeIds.has(employeeId)) {
      throw new Error(`View "${view.name}" reuses an Employee ID.`);
    }
    allLocalEmployeeIds.add(employeeId);
  }

  const overrideIds = view.state.employeeOverrides.map((override) => override.employeeId);
  assertUniqueIds(overrideIds, `View "${view.name}" has duplicate Employee overrides.`);
  if (overrideIds.some((employeeId) => !organizationEmployeeIds.has(employeeId))) {
    throw new Error(`View "${view.name}" overrides a missing organization Employee.`);
  }
  if (view.kind === "main" && (localEmployeeIds.size > 0 || overrideIds.length > 0)) {
    throw new Error("The Main View cannot contain local Employees or Employee overrides.");
  }

  const availableEmployeeIds = new Set([...organizationEmployeeIds, ...localEmployeeIds]);
  const unitIdList = view.state.units.map((unit) => unit.id);
  assertUniqueIds(unitIdList, `View "${view.name}" has duplicate Unit IDs.`);
  const unitIds = new Set(unitIdList);
  for (const unitId of unitIds) {
    if (allUnitIds.has(unitId)) throw new Error(`View "${view.name}" reuses a Unit ID.`);
    allUnitIds.add(unitId);
  }

  for (const unit of view.state.units) {
    if (unit.parentId !== null && !unitIds.has(unit.parentId)) {
      throw new Error(`Unit "${unit.name}" references a missing parent Unit.`);
    }
    assertUniqueIds(unit.employeeIds, `Unit "${unit.name}" has duplicate Employee assignments.`);
    const positionIds = unit.employeePositions.map((position) => position.employeeId);
    assertUniqueIds(positionIds, `Unit "${unit.name}" has duplicate position assignments.`);
    const referencedEmployeeIds = [
      ...unit.employeeIds,
      ...positionIds,
      ...(unit.bossEmployeeId ? [unit.bossEmployeeId] : []),
    ];
    if (referencedEmployeeIds.some((employeeId) => !availableEmployeeIds.has(employeeId))) {
      throw new Error(`Unit "${unit.name}" references a missing Employee.`);
    }
    if (!unit.liveFilter) {
      if (positionIds.some((employeeId) => !unit.employeeIds.includes(employeeId))) {
        throw new Error(`Unit "${unit.name}" has a position without an Employee assignment.`);
      }
      if (unit.bossEmployeeId !== null && !unit.employeeIds.includes(unit.bossEmployeeId)) {
        throw new Error(`Unit "${unit.name}" has an unassigned boss.`);
      }
    } else {
      if (!hasEmployeeLiveFilterCriteria(unit.liveFilter)) {
        throw new Error(`Live Unit "${unit.name}" has an empty filter rule.`);
      }
      if (unit.liveFilter.selectedUnitIds.some((unitId) => !unitIds.has(unitId))) {
        throw new Error(`Live Unit "${unit.name}" references a missing Unit.`);
      }
      if (unit.liveFilter.selectedUnitIds.includes(unit.id)) {
        throw new Error(`Live Unit "${unit.name}" cannot reference itself.`);
      }
    }
  }

  const visited = new Set<UnitId>();
  const visiting = new Set<UnitId>();
  const unitById = new Map(view.state.units.map((unit) => [unit.id, unit]));
  const visitParent = (unitId: UnitId): void => {
    if (visited.has(unitId)) return;
    if (visiting.has(unitId)) throw new Error(`View "${view.name}" has a cyclic Unit hierarchy.`);
    visiting.add(unitId);
    const parentId = unitById.get(unitId)?.parentId;
    if (parentId) visitParent(parentId);
    visiting.delete(unitId);
    visited.add(unitId);
  };
  for (const unitId of unitIds) visitParent(unitId);
  getLiveUnitTopologicalOrder(view.state.units);

  for (const item of view.state.selectedItems) {
    if (!unitIds.has(item.unitId)) {
      throw new Error(`View "${view.name}" selects a missing Unit.`);
    }
    if (item.type === "employee" && !availableEmployeeIds.has(item.employeeId)) {
      throw new Error(`View "${view.name}" selects a missing Employee.`);
    }
  }
};

export const materializeOrgViews = (state: OrgToolsState): OrgView[] => {
  const viewUiById = new Map(state.ui.views.map((view) => [view.viewId, view]));
  return state.organization.views.map((view) => {
    const viewUi = viewUiById.get(view.id);
    if (!viewUi) throw new Error(`View "${view.name}" is missing durable UI state.`);
    return {
      createdAt: view.createdAt,
      id: view.id,
      kind: view.kind,
      name: view.name,
      state: {
        ...structuredClone(view.document),
        selectedItems: structuredClone(viewUi.selectedItems),
        viewport: { ...viewUi.viewport },
      },
      updatedAt: view.updatedAt,
    };
  });
};

const validateStateGraph = (state: OrgToolsState): void => {
  const views = materializeOrgViews(state);
  const organizationEmployeeIds = new Set(
    state.organization.employees.map((employee) => employee.id),
  );
  assertUniqueIds(
    state.organization.employees.map((employee) => employee.id),
    "State has duplicate Employee IDs.",
  );
  const viewIds = views.map((view) => view.id);
  assertUniqueIds(viewIds, "State has duplicate View IDs.");
  assertUniqueIds(
    state.ui.views.map((view) => view.viewId),
    "State has duplicate View UI records.",
  );
  if (state.ui.views.length !== viewIds.length) {
    throw new Error("Every View must have exactly one durable UI record.");
  }
  if (!viewIds.includes(state.ui.activeViewId)) throw new Error("Active View does not exist.");
  if (!viewIds.includes(state.ui.download.sourceViewId)) {
    throw new Error("Data Download source View does not exist.");
  }
  if (views.filter((view) => view.kind === "main").length !== 1) {
    throw new Error("State must contain exactly one Main View.");
  }

  const names = new Set<string>();
  const allLocalEmployeeIds = new Set<EmployeeId>();
  const allUnitIds = new Set<UnitId>();
  for (const view of views) {
    const name = view.name.toLocaleLowerCase("en-US");
    if (names.has(name)) throw new Error("View names must be unique ignoring case.");
    names.add(name);
    validateEditorStateGraph(view, organizationEmployeeIds, allLocalEmployeeIds, allUnitIds);
  }

  const mainView = views.find((view) => view.kind === "main");
  const mainUnitIds = new Set(mainView?.state.units.map((unit) => unit.id) ?? []);
  if (state.ui.selectedUnitId !== null && !mainUnitIds.has(state.ui.selectedUnitId)) {
    throw new Error("Selected Unit does not exist in the Main View.");
  }
  if (state.ui.expandedUnitIds.some((unitId) => !mainUnitIds.has(unitId))) {
    throw new Error("Expanded Units must exist in the Main View.");
  }
  assertUniqueIds(state.ui.expandedUnitIds, "Expanded Unit IDs must be unique.");
};

const normalizeUiState = (value: unknown): OrgToolsUiState | null => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "activeTab",
      "activeViewId",
      "analytics",
      "calendar",
      "download",
      "editor",
      "employees",
      "expandedUnitIds",
      "locale",
      "selectedUnitId",
      "sidebarCollapsed",
      "theme",
      "units",
      "views",
    ]) ||
    !isActiveTab(value.activeTab) ||
    !isUuid(value.activeViewId) ||
    !isUuidArray(value.expandedUnitIds) ||
    !isLocale(value.locale) ||
    !(value.selectedUnitId === null || isUuid(value.selectedUnitId)) ||
    typeof value.sidebarCollapsed !== "boolean" ||
    !isTheme(value.theme) ||
    !Array.isArray(value.views)
  ) {
    return null;
  }
  if (
    !isRecord(value.analytics) ||
    !hasExactKeys(value.analytics, ["filters", "query"]) ||
    !isString(value.analytics.query) ||
    !isRecord(value.calendar) ||
    !hasExactKeys(value.calendar, ["cloudExpanded", "monthIndex", "year"]) ||
    typeof value.calendar.cloudExpanded !== "boolean" ||
    !Number.isInteger(value.calendar.monthIndex) ||
    (value.calendar.monthIndex as number) < 0 ||
    (value.calendar.monthIndex as number) > 11 ||
    !Number.isInteger(value.calendar.year) ||
    (value.calendar.year as number) < 1 ||
    (value.calendar.year as number) > 9999 ||
    !isRecord(value.editor) ||
    !hasExactKeys(value.editor, ["searchOpen", "searchQuery"]) ||
    typeof value.editor.searchOpen !== "boolean" ||
    !isString(value.editor.searchQuery) ||
    !isRecord(value.employees) ||
    !hasExactKeys(value.employees, ["filters", "query"]) ||
    !isString(value.employees.query) ||
    !isRecord(value.units) ||
    !hasExactKeys(value.units, ["employeeFilters", "employeeQuery", "unitQuery"]) ||
    !isString(value.units.employeeQuery) ||
    !isString(value.units.unitQuery)
  ) {
    return null;
  }
  const analyticsFilters = normalizeEmployeeSearchFilters(value.analytics.filters);
  const employeeFilters = normalizeEmployeeSearchFilters(value.employees.filters);
  const unitEmployeeFilters = normalizeEmployeeSearchFilters(value.units.employeeFilters);
  const download = normalizeDownloadState(value.download);
  const views = value.views.map((view) => {
    if (
      !isRecord(view) ||
      !hasExactKeys(view, ["selectedItems", "viewId", "viewport"]) ||
      !isUuid(view.viewId) ||
      !Array.isArray(view.selectedItems)
    ) {
      return null;
    }
    const selectedItems = view.selectedItems.map(normalizeSelectedItem);
    const viewport = normalizeViewport(view.viewport);
    if (selectedItems.some((item) => !item) || !viewport) return null;
    return {
      selectedItems: selectedItems as OrgEditorSelectedItem[],
      viewId: view.viewId,
      viewport,
    };
  });
  if (
    !analyticsFilters ||
    !employeeFilters ||
    !unitEmployeeFilters ||
    !download ||
    views.some((view) => !view)
  ) {
    return null;
  }
  return {
    activeTab: value.activeTab,
    activeViewId: value.activeViewId,
    analytics: { filters: analyticsFilters, query: value.analytics.query },
    calendar: {
      cloudExpanded: value.calendar.cloudExpanded,
      monthIndex: value.calendar.monthIndex as number,
      year: value.calendar.year as number,
    },
    download,
    editor: { searchOpen: value.editor.searchOpen, searchQuery: value.editor.searchQuery },
    employees: { filters: employeeFilters, query: value.employees.query },
    expandedUnitIds: [...value.expandedUnitIds],
    locale: value.locale,
    selectedUnitId: value.selectedUnitId,
    sidebarCollapsed: value.sidebarCollapsed,
    theme: value.theme,
    units: {
      employeeFilters: unitEmployeeFilters,
      employeeQuery: value.units.employeeQuery,
      unitQuery: value.units.unitQuery,
    },
    views: views as OrgToolsUiState["views"],
  };
};

export const parseOrgToolsUiState = (input: unknown): OrgToolsUiState => {
  const ui = normalizeUiState(input);
  if (!ui) throw new Error("State contains an invalid durable UI state.");
  return ui;
};

export const parseOrgToolsState = (input: unknown): OrgToolsState => {
  if (!isRecord(input)) throw new Error("State must be a JSON object.");
  const value = input;
  if (
    !hasExactKeys(value, ["organization", "ui"]) ||
    !isRecord(value.organization) ||
    !hasExactKeys(value.organization, ["employees", "views"]) ||
    !Array.isArray(value.organization.employees) ||
    !Array.isArray(value.organization.views)
  ) {
    throw new Error("State has an invalid top-level structure.");
  }

  const employees = value.organization.employees.map(normalizeOrganizationEmployee);
  if (employees.some((employee) => !employee)) {
    throw new Error("State contains an invalid Employee.");
  }
  const views = value.organization.views.map(normalizeOrgViewDocument);
  if (views.some((view) => !view)) {
    throw new Error("State contains an invalid View or editor document.");
  }
  const ui = parseOrgToolsUiState(value.ui);

  const state: OrgToolsState = {
    organization: {
      employees: employees as OrganizationEmployee[],
      views: views as OrgToolsViewDocument[],
    },
    ui,
  };
  validateStateGraph(state);
  return state;
};

export const isOrgToolsStateDocument = (value: unknown): value is Record<string, unknown> =>
  isRecord(value) && hasExactKeys(value, ["organization", "ui"]);

export const parseOrgFileJson = (value: unknown): LoadedOrgFile => ({
  kind: "orgToolsState",
  state: parseOrgToolsState(value),
});

export const createEmptyEmployeeFiltersState = (): OrgToolsEmployeeFilters => ({
  birthday: null,
  includeWithoutTags: false,
  includeWithoutUnits: false,
  selectedGenders: [],
  selectedPositions: [],
  selectedTags: [],
  selectedUnitIds: [],
});

export const createBlankDownloadState = (sourceViewId: string): OrgToolsDownloadState => ({
  employeeFieldOrder: [
    "id",
    "firstName",
    "lastName",
    "fullName",
    "gender",
    "username",
    "profileUrl",
    "email",
    "phone",
    "avatarBase64Url",
    "birthday",
    "tags",
    "tagDates",
  ],
  employeeFilters: createEmptyEmployeeFiltersState(),
  employeeQuery: "",
  excludedEmployeeIds: [],
  fieldNames: Object.fromEntries(
    [
      "id",
      "firstName",
      "lastName",
      "fullName",
      "gender",
      "username",
      "profileUrl",
      "email",
      "phone",
      "avatarBase64Url",
      "birthday",
      "tags",
      "tagDates",
      "unitId",
      "unitName",
      "unitFullPath",
      "position",
      "isBoss",
    ].map((key) => [key, key]),
  ),
  flatUnitFieldOrder: ["unitId", "unitName", "unitFullPath", "position", "isBoss"],
  jsonUnitFieldOrder: ["unitId", "unitName", "unitFullPath", "position", "isBoss"],
  rowMode: "allUnits",
  sourceViewId,
  selectedEmployeeFieldKeys: ["username"],
  selectedFilters: createEmptyEmployeeFiltersState(),
  selectedFlatUnitFieldKeys: ["unitName", "unitFullPath"],
  selectedJsonUnitFieldKeys: ["unitId", "unitName", "unitFullPath", "position", "isBoss"],
  selectedQuery: "",
  selections: [],
  tabMode: "csv",
  templateFormat: "{email}, ",
  unitFullPathSeparator: " / ",
  unitQuery: "",
});

export const createBlankOrgToolsState = (
  theme: UiTheme = "system",
  locale: AppLocale = "en",
): OrgToolsState => {
  const now = new Date().toISOString();
  const mainViewId = createUuid();
  const editor = createDefaultOrgEditorState();
  const currentDate = new Date();
  return {
    organization: {
      employees: [],
      views: [
        {
          createdAt: now,
          document: {
            employeeOverrides: editor.employeeOverrides,
            employees: editor.employees,
            layoutMode: editor.layoutMode,
            units: editor.units,
          },
          id: mainViewId,
          kind: "main",
          name: "Main",
          updatedAt: now,
        },
      ],
    },
    ui: {
      activeTab: "orgEditor",
      activeViewId: mainViewId,
      analytics: { filters: createEmptyEmployeeFiltersState(), query: "" },
      calendar: {
        cloudExpanded: false,
        monthIndex: currentDate.getMonth(),
        year: currentDate.getFullYear(),
      },
      download: createBlankDownloadState(mainViewId),
      editor: { searchOpen: false, searchQuery: "" },
      employees: { filters: createEmptyEmployeeFiltersState(), query: "" },
      expandedUnitIds: [],
      locale,
      selectedUnitId: null,
      sidebarCollapsed: true,
      theme,
      units: {
        employeeFilters: createEmptyEmployeeFiltersState(),
        employeeQuery: "",
        unitQuery: "",
      },
      views: [
        {
          selectedItems: editor.selectedItems,
          viewId: mainViewId,
          viewport: editor.viewport,
        },
      ],
    },
  };
};

export const downloadJson = (value: unknown, fileName: string): void => {
  downloadText(JSON.stringify(value), fileName, "application/json;charset=utf-8");
};

export const downloadText = (
  value: string,
  fileName: string,
  type = "text/plain;charset=utf-8",
): void => {
  downloadBlob(new Blob([value], { type }), fileName);
};

export const copyTextToClipboard = async (value: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }
};

export const downloadBlob = (blob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};
