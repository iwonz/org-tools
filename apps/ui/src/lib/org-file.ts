import type {
  EditableEmployeeFields,
  EmployeeId,
  EmployeeLiveFilterRule,
  EmployeeTag,
  OrgEditorCanvasViewport,
  OrgEditorEmployee,
  OrgEditorEmployeeOverride,
  OrgEditorEmployeePosition,
  OrgEditorLayoutMode,
  OrgEditorSelectedItem,
  OrgEditorState,
  OrgEditorUnit,
  OrgToolsState,
  OrgToolsStateContent,
  OrgView,
  UiActiveTab,
  UiTheme,
  UnitId,
  WorkspaceEmployee,
} from "@org-tools/types";

import { createUuid, isUuid, normalizeEditableEmployeeFields } from "@/lib/employee-data";
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
const isActiveTab = (value: unknown): value is UiActiveTab =>
  value === "units" ||
  value === "employees" ||
  value === "orgEditor" ||
  value === "export" ||
  value === "analytics" ||
  value === "calendar";
const isStateContent = (value: unknown): value is OrgToolsStateContent =>
  value === "teams" || value === "employees" || value === "teamsEmployees" || value === "workspace";
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

const normalizeEditorState = (value: unknown): OrgEditorState | null => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "employeeOverrides",
      "employees",
      "layoutMode",
      "selectedItems",
      "units",
      "viewport",
    ]) ||
    !Array.isArray(value.employeeOverrides) ||
    !Array.isArray(value.employees) ||
    !isLayoutMode(value.layoutMode) ||
    !Array.isArray(value.selectedItems) ||
    !Array.isArray(value.units)
  ) {
    return null;
  }

  const employeeOverrides = value.employeeOverrides.map(normalizeEmployeeOverride);
  const employees = value.employees.map(normalizeEditorEmployee);
  const selectedItems = value.selectedItems.map(normalizeSelectedItem);
  const units = value.units.map(normalizeEditorUnit);
  const viewport = normalizeViewport(value.viewport);
  if (
    employeeOverrides.some((item) => !item) ||
    employees.some((item) => !item) ||
    selectedItems.some((item) => !item) ||
    units.some((item) => !item) ||
    !viewport
  ) {
    return null;
  }

  return {
    employeeOverrides: employeeOverrides as OrgEditorEmployeeOverride[],
    employees: employees as OrgEditorEmployee[],
    layoutMode: value.layoutMode,
    selectedItems: selectedItems as OrgEditorSelectedItem[],
    units: units as OrgEditorUnit[],
    viewport,
  };
};

const normalizeWorkspaceEmployee = (value: unknown): WorkspaceEmployee | null => {
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

const normalizeOrgView = (value: unknown): OrgView | null => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ["createdAt", "id", "kind", "name", "state", "updatedAt"]) ||
    !isString(value.name) ||
    !value.name.trim() ||
    !isTimestamp(value.createdAt) ||
    !isTimestamp(value.updatedAt)
  ) {
    return null;
  }
  const state = normalizeEditorState(value.state);
  if (!state) return null;

  if (value.kind === "main" && isUuid(value.id)) {
    return {
      createdAt: value.createdAt,
      id: value.id,
      kind: "main",
      name: value.name.trim(),
      state,
      updatedAt: value.updatedAt,
    };
  }
  if (value.kind === "custom" && isUuid(value.id)) {
    return {
      createdAt: value.createdAt,
      id: value.id,
      kind: "custom",
      name: value.name.trim(),
      state,
      updatedAt: value.updatedAt,
    };
  }
  return null;
};

const assertUniqueIds = (ids: readonly string[], message: string): void => {
  if (new Set(ids).size !== ids.length) throw new Error(message);
};

const validateEditorStateGraph = (
  view: OrgView,
  workspaceEmployeeIds: ReadonlySet<EmployeeId>,
  allLocalEmployeeIds: Set<EmployeeId>,
  allUnitIds: Set<UnitId>,
): void => {
  const localEmployeeIdList = view.state.employees.map((employee) => employee.id);
  assertUniqueIds(localEmployeeIdList, `View "${view.name}" has duplicate Employee IDs.`);
  const localEmployeeIds = new Set(localEmployeeIdList);
  for (const employeeId of localEmployeeIds) {
    if (workspaceEmployeeIds.has(employeeId) || allLocalEmployeeIds.has(employeeId)) {
      throw new Error(`View "${view.name}" reuses an Employee ID.`);
    }
    allLocalEmployeeIds.add(employeeId);
  }

  const overrideIds = view.state.employeeOverrides.map((override) => override.employeeId);
  assertUniqueIds(overrideIds, `View "${view.name}" has duplicate Employee overrides.`);
  if (overrideIds.some((employeeId) => !workspaceEmployeeIds.has(employeeId))) {
    throw new Error(`View "${view.name}" overrides a missing workspace Employee.`);
  }
  if (view.kind === "main" && (localEmployeeIds.size > 0 || overrideIds.length > 0)) {
    throw new Error("The Main View cannot contain local Employees or Employee overrides.");
  }

  const availableEmployeeIds = new Set([...workspaceEmployeeIds, ...localEmployeeIds]);
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

const validateStateGraph = (state: OrgToolsState): void => {
  const workspaceEmployeeIds = new Set(state.employees.map((employee) => employee.id));
  assertUniqueIds(
    state.employees.map((employee) => employee.id),
    "Workspace has duplicate Employee IDs.",
  );
  const viewIds = state.views.map((view) => view.id);
  assertUniqueIds(viewIds, "Workspace has duplicate View IDs.");
  if (!viewIds.includes(state.activeViewId)) throw new Error("Active View does not exist.");
  if (state.views.filter((view) => view.kind === "main").length !== 1) {
    throw new Error("Workspace must contain exactly one Main View.");
  }

  const names = new Set<string>();
  const allLocalEmployeeIds = new Set<EmployeeId>();
  const allUnitIds = new Set<UnitId>();
  for (const view of state.views) {
    const name = view.name.toLocaleLowerCase("en-US");
    if (names.has(name)) throw new Error("View names must be unique ignoring case.");
    names.add(name);
    validateEditorStateGraph(view, workspaceEmployeeIds, allLocalEmployeeIds, allUnitIds);
  }

  const mainView = state.views.find((view) => view.kind === "main");
  const mainUnitIds = new Set(mainView?.state.units.map((unit) => unit.id) ?? []);
  if (state.ui.selectedUnitId !== null && !mainUnitIds.has(state.ui.selectedUnitId)) {
    throw new Error("Selected Unit does not exist in the Main View.");
  }
  if (state.ui.expandedUnitIds.some((unitId) => !mainUnitIds.has(unitId))) {
    throw new Error("Expanded Units must exist in the Main View.");
  }
  assertUniqueIds(state.ui.expandedUnitIds, "Expanded Unit IDs must be unique.");
};

const isCanonicalPartialUi = (state: OrgToolsState): boolean =>
  state.ui.activeTab === "orgEditor" &&
  state.ui.expandedUnitIds.length === 0 &&
  state.ui.selectedUnitId === null &&
  state.ui.theme === "system";

const validateStateContent = (state: OrgToolsState): void => {
  if (state.content === "workspace") return;
  if (state.views.length !== 1 || state.views[0]?.kind !== "main") {
    throw new Error("Partial workspace state must contain exactly one Main View.");
  }
  const main = state.views[0];
  if (state.activeViewId !== main.id || !isCanonicalPartialUi(state)) {
    throw new Error("Partial workspace state has a non-canonical UI shell.");
  }
  if (
    main.state.employees.length > 0 ||
    main.state.employeeOverrides.length > 0 ||
    main.state.selectedItems.length > 0
  ) {
    throw new Error("Partial workspace state contains unsupported View-local data.");
  }

  if (state.content === "employees") {
    if (main.state.units.length > 0) {
      throw new Error("Employees state must contain an empty Main View.");
    }
    return;
  }

  if (state.content === "teams") {
    if (state.employees.length > 0) {
      throw new Error("Teams state cannot contain Employees.");
    }
    for (const unit of main.state.units) {
      if (
        unit.employeeIds.length > 0 ||
        unit.employeePositions.length > 0 ||
        unit.bossEmployeeId !== null
      ) {
        throw new Error("Teams state cannot contain Employee assignments or roles.");
      }
    }
  }
};

export const parseOrgToolsState = (input: unknown): OrgToolsState => {
  if (!isRecord(input)) throw new Error("Workspace state must be a JSON object.");
  const value = input;
  if (value.kind !== "org-tools-state") {
    throw new Error("Unsupported workspace kind. Expected org-tools-state.");
  }
  if (
    !hasExactKeys(value, ["activeViewId", "content", "employees", "kind", "ui", "views"]) ||
    !isStateContent(value.content) ||
    !isUuid(value.activeViewId) ||
    !Array.isArray(value.employees) ||
    !Array.isArray(value.views)
  ) {
    throw new Error("Workspace state has an invalid top-level structure.");
  }

  const employees = value.employees.map(normalizeWorkspaceEmployee);
  if (employees.some((employee) => !employee)) {
    throw new Error("Workspace state contains an invalid Employee.");
  }
  const views = value.views.map(normalizeOrgView);
  if (views.some((view) => !view)) {
    throw new Error("Workspace state contains an invalid View or editor document.");
  }

  const ui = value.ui;
  if (
    !isRecord(ui) ||
    !hasExactKeys(ui, ["activeTab", "expandedUnitIds", "selectedUnitId", "theme"]) ||
    !isActiveTab(ui.activeTab) ||
    !isUuidArray(ui.expandedUnitIds) ||
    !(ui.selectedUnitId === null || isUuid(ui.selectedUnitId)) ||
    !isTheme(ui.theme)
  ) {
    throw new Error("Workspace state contains an invalid UI state.");
  }

  const state: OrgToolsState = {
    activeViewId: value.activeViewId,
    content: value.content,
    employees: employees as WorkspaceEmployee[],
    kind: "org-tools-state",
    ui: {
      activeTab: ui.activeTab,
      expandedUnitIds: [...ui.expandedUnitIds],
      selectedUnitId: ui.selectedUnitId,
      theme: ui.theme,
    },
    views: views as OrgView[],
  };
  validateStateGraph(state);
  validateStateContent(state);
  return state;
};

export const isOrgToolsStateDocument = (value: unknown): value is Record<string, unknown> =>
  isRecord(value) && value.kind === "org-tools-state";

export const parseOrgFileJson = (value: unknown): LoadedOrgFile => ({
  kind: "orgToolsState",
  state: parseOrgToolsState(value),
});

export const createBlankOrgToolsState = (theme: UiTheme = "system"): OrgToolsState => {
  const now = new Date().toISOString();
  const mainViewId = createUuid();
  return {
    activeViewId: mainViewId,
    content: "workspace",
    employees: [],
    kind: "org-tools-state",
    ui: {
      activeTab: "orgEditor",
      expandedUnitIds: [],
      selectedUnitId: null,
      theme,
    },
    views: [
      {
        createdAt: now,
        id: mainViewId,
        kind: "main",
        name: "Main",
        state: createDefaultOrgEditorState(),
        updatedAt: now,
      },
    ],
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
