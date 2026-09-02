import type {
  AppLocale,
  EditableEmployeeFields,
  EmployeeId,
  EmployeeLiveFilterRule,
  EmployeeTag,
  OrganizationEmployee,
  OrgEditorCanvasViewport,
  OrgEditorEmployeePosition,
  OrgEditorLayoutMode,
  OrgEditorSelectedItem,
  OrgEditorUnit,
  OrgToolsDownloadSelection,
  OrgToolsDownloadState,
  OrgToolsEmployeeFilters,
  OrgToolsState,
  OrgToolsUiState,
  UiActiveTab,
  UiTheme,
  UnitId,
} from "@org-tools/types";

import { isEmployeeGender, isUuid, normalizeEditableEmployeeFields } from "@/lib/employee-data";
import { createEmployeeId, isEmployeeId } from "@/lib/employee-id";
import { isValidEmployeeTagDate } from "@/lib/employee-tags";
import { getLiveUnitTopologicalOrder, hasEmployeeLiveFilterCriteria } from "@/lib/live-unit-filter";
import { createDefaultOrgEditorState } from "@/lib/org-editor";

export type LoadedOrgFile = { kind: "orgToolsState"; state: OrgToolsState };

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
const isEmployeeIdArray = (value: unknown): value is EmployeeId[] =>
  Array.isArray(value) && value.every(isEmployeeId);
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
    const normalizedLabel = label.toLowerCase();
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
    return normalizeEditableEmployeeFields({
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
  } catch {
    return null;
  }
};

export const normalizeOrganizationEmployee = (value: unknown): OrganizationEmployee | null => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [...EMPLOYEE_FIELD_KEYS, "createdAt", "id", "updatedAt"])
  ) {
    return null;
  }
  const fields = normalizeEmployeeFields(value);
  if (
    !fields ||
    !isEmployeeId(value.id) ||
    value.id !== createEmployeeId(fields) ||
    !isTimestamp(value.createdAt) ||
    !isTimestamp(value.updatedAt)
  ) {
    return null;
  }
  return { ...fields, createdAt: value.createdAt, id: value.id, updatedAt: value.updatedAt };
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
    selectedPositions: [...new Set(value.selectedPositions.map((item) => item.trim()))].filter(
      Boolean,
    ),
    selectedTags: [...new Set(value.selectedTags.map((item) => item.trim()))].filter(Boolean),
    selectedUnitIds: [...value.selectedUnitIds],
  };
};

const normalizeEmployeePositions = (value: unknown): OrgEditorEmployeePosition[] | null => {
  if (!Array.isArray(value)) return null;
  const positions: OrgEditorEmployeePosition[] = [];
  for (const position of value) {
    if (
      !isRecord(position) ||
      !hasExactKeys(position, ["employeeId", "position"]) ||
      !isEmployeeId(position.employeeId) ||
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
    !(value.bossEmployeeId === null || isEmployeeId(value.bossEmployeeId)) ||
    typeof value.collapsed !== "boolean" ||
    !isTimestamp(value.createdAt) ||
    !isEmployeeIdArray(value.employeeIds) ||
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
    isEmployeeId(value.employeeId)
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
    isEmployeeId(value.employeeId)
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
    !isEmployeeIdArray(value.excludedEmployeeIds) ||
    !isStringArray(value.flatUnitFieldOrder) ||
    !isStringArray(value.jsonUnitFieldOrder) ||
    (value.rowMode !== "allUnits" && value.rowMode !== "firstUnit") ||
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
  if (!employeeFilters || !selectedFilters || !fieldNames || selections.some((item) => !item))
    return null;
  return {
    employeeFieldOrder: [...value.employeeFieldOrder],
    employeeFilters,
    employeeQuery: value.employeeQuery,
    excludedEmployeeIds: [...value.excludedEmployeeIds],
    fieldNames,
    flatUnitFieldOrder: [...value.flatUnitFieldOrder],
    jsonUnitFieldOrder: [...value.jsonUnitFieldOrder],
    rowMode: value.rowMode,
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

const validateStateGraph = (state: OrgToolsState): void => {
  const employees = state.organization.employees;
  const employeeIds = new Set(employees.map((employee) => employee.id));
  assertUniqueIds(
    employees.map((employee) => employee.id),
    "State has duplicate Employee IDs.",
  );
  const units = state.organization.structure.units;
  const unitIds = new Set(units.map((unit) => unit.id));
  assertUniqueIds(
    units.map((unit) => unit.id),
    "State has duplicate Unit IDs.",
  );
  for (const unit of units) {
    if (unit.parentId !== null && !unitIds.has(unit.parentId)) {
      throw new Error(`Unit "${unit.name}" references a missing parent Unit.`);
    }
    assertUniqueIds(unit.employeeIds, `Unit "${unit.name}" has duplicate Employee assignments.`);
    const positionIds = unit.employeePositions.map((position) => position.employeeId);
    assertUniqueIds(positionIds, `Unit "${unit.name}" has duplicate position assignments.`);
    const referenced = [
      ...unit.employeeIds,
      ...positionIds,
      ...(unit.bossEmployeeId ? [unit.bossEmployeeId] : []),
    ];
    if (referenced.some((employeeId) => !employeeIds.has(employeeId))) {
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
  const unitById = new Map(units.map((unit) => [unit.id, unit]));
  const visitParent = (unitId: UnitId): void => {
    if (visited.has(unitId)) return;
    if (visiting.has(unitId)) throw new Error("State has a cyclic Unit hierarchy.");
    visiting.add(unitId);
    const parentId = unitById.get(unitId)?.parentId;
    if (parentId) visitParent(parentId);
    visiting.delete(unitId);
    visited.add(unitId);
  };
  for (const unitId of unitIds) visitParent(unitId);
  getLiveUnitTopologicalOrder(units);
  if (state.ui.selectedUnitId !== null && !unitIds.has(state.ui.selectedUnitId)) {
    throw new Error("Selected Unit does not exist.");
  }
  if (state.ui.expandedUnitIds.some((unitId) => !unitIds.has(unitId))) {
    throw new Error("Expanded Units do not exist.");
  }
  assertUniqueIds(state.ui.expandedUnitIds, "Expanded Unit IDs must be unique.");
  for (const item of state.ui.editor.selectedItems) {
    if (!unitById.has(item.unitId)) throw new Error("Editor selects a missing Unit.");
    if (item.type === "employee" && !employeeIds.has(item.employeeId)) {
      throw new Error("Editor selects a missing Employee.");
    }
  }
};

const normalizeUiState = (value: unknown): OrgToolsUiState | null => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "activeTab",
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
    ]) ||
    !isActiveTab(value.activeTab) ||
    !isUuidArray(value.expandedUnitIds) ||
    !isLocale(value.locale) ||
    !(value.selectedUnitId === null || isUuid(value.selectedUnitId)) ||
    typeof value.sidebarCollapsed !== "boolean" ||
    !isTheme(value.theme)
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
    !hasExactKeys(value.editor, ["searchOpen", "searchQuery", "selectedItems", "viewport"]) ||
    typeof value.editor.searchOpen !== "boolean" ||
    !isString(value.editor.searchQuery) ||
    !Array.isArray(value.editor.selectedItems) ||
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
  const selectedItems = value.editor.selectedItems.map(normalizeSelectedItem);
  const viewport = normalizeViewport(value.editor.viewport);
  if (
    !analyticsFilters ||
    !employeeFilters ||
    !unitEmployeeFilters ||
    !download ||
    !viewport ||
    selectedItems.some((item) => !item)
  )
    return null;
  return {
    activeTab: value.activeTab,
    analytics: { filters: analyticsFilters, query: value.analytics.query },
    calendar: {
      cloudExpanded: value.calendar.cloudExpanded,
      monthIndex: value.calendar.monthIndex as number,
      year: value.calendar.year as number,
    },
    download,
    editor: {
      searchOpen: value.editor.searchOpen,
      searchQuery: value.editor.searchQuery,
      selectedItems: selectedItems as OrgEditorSelectedItem[],
      viewport,
    },
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
  };
};

export const parseOrgToolsUiState = (input: unknown): OrgToolsUiState => {
  const ui = normalizeUiState(input);
  if (!ui) throw new Error("State contains an invalid durable UI state.");
  return ui;
};

export const parseOrgToolsState = (input: unknown): OrgToolsState => {
  if (!isRecord(input)) throw new Error("State must be a JSON object.");
  if (
    !hasExactKeys(input, ["organization", "ui"]) ||
    !isRecord(input.organization) ||
    !hasExactKeys(input.organization, ["employees", "structure"]) ||
    !Array.isArray(input.organization.employees) ||
    !isRecord(input.organization.structure) ||
    !hasExactKeys(input.organization.structure, ["layoutMode", "units"]) ||
    !isLayoutMode(input.organization.structure.layoutMode) ||
    !Array.isArray(input.organization.structure.units)
  ) {
    throw new Error("State has an invalid top-level structure.");
  }
  const employees = input.organization.employees.map(normalizeOrganizationEmployee);
  if (employees.some((employee) => !employee))
    throw new Error("State contains an invalid Employee.");
  const units = input.organization.structure.units.map(normalizeEditorUnit);
  if (units.some((unit) => !unit)) throw new Error("State contains an invalid Unit structure.");
  const state: OrgToolsState = {
    organization: {
      employees: employees as OrganizationEmployee[],
      structure: {
        layoutMode: input.organization.structure.layoutMode,
        units: units as OrgEditorUnit[],
      },
    },
    ui: parseOrgToolsUiState(input.ui),
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

export const createBlankDownloadState = (): OrgToolsDownloadState => ({
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
  const editor = createDefaultOrgEditorState();
  const currentDate = new Date();
  return {
    organization: {
      employees: [],
      structure: { layoutMode: editor.layoutMode, units: editor.units },
    },
    ui: {
      activeTab: "orgEditor",
      analytics: { filters: createEmptyEmployeeFiltersState(), query: "" },
      calendar: {
        cloudExpanded: false,
        monthIndex: currentDate.getMonth(),
        year: currentDate.getFullYear(),
      },
      download: createBlankDownloadState(),
      editor: {
        searchOpen: false,
        searchQuery: "",
        selectedItems: editor.selectedItems,
        viewport: editor.viewport,
      },
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
