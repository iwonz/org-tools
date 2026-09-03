import type {
  AppLocale,
  CustomEmployeeFieldDefinition,
  CustomEmployeeFieldValue,
  EmployeeId,
  EmployeeLiveFilterRule,
  EmployeeTagAssignment,
  EmployeeTagColor,
  EmployeeTagDefinition,
  OrganizationEmployee,
  OrgEditorCanvasViewport,
  OrgEditorEmployeePosition,
  OrgEditorLayoutMode,
  OrgEditorSelectedItem,
  OrgEditorUnit,
  OrgToolsDownloadEmployeeFieldKey,
  OrgToolsDownloadJsonTopLevelFieldKey,
  OrgToolsDownloadSelection,
  OrgToolsDownloadState,
  OrgToolsDownloadTagFieldKey,
  OrgToolsDownloadUnitFieldKey,
  OrgToolsEmployeeFilters,
  OrgToolsState,
  OrgToolsUiState,
  OrgToolsViewDocument,
  OrgToolsViewUiState,
  UiActiveTab,
  UiTheme,
  UnitId,
  ViewId,
} from "@org-tools/types";

import { validateCustomEmployeeFieldDefinitions } from "@/lib/custom-employee-fields";
import {
  createUuid,
  isEmployeeGender,
  isSafeAvatarBase64Url,
  isSafeProfileUrl,
  isUuid,
  normalizeBirthday,
} from "@/lib/employee-data";
import { createEmployeeIdentityKey, isEmployeeId } from "@/lib/employee-id";
import { isValidEmployeeTagDate } from "@/lib/employee-tags";
import { getLiveUnitTopologicalOrder, hasEmployeeLiveFilterCriteria } from "@/lib/live-unit-filter";
import { createDefaultOrgEditorState, normalizeOrgEditorUnitNoteMarkdown } from "@/lib/org-editor";

export type LoadedOrgFile = { kind: "orgToolsState"; state: OrgToolsState };

const EMPLOYEE_FIELD_KEYS = [
  "avatarBase64Url",
  "birthday",
  "customFieldValues",
  "email",
  "firstName",
  "gender",
  "lastName",
  "phone",
  "profileUrl",
  "tags",
  "username",
] as const;
const DOWNLOAD_EMPLOYEE_FIELD_KEYS = [
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
] as const satisfies readonly OrgToolsDownloadEmployeeFieldKey[];
const DOWNLOAD_JSON_TOP_LEVEL_FIELD_KEYS = [
  ...DOWNLOAD_EMPLOYEE_FIELD_KEYS,
  "units",
  "tags",
] as const satisfies readonly OrgToolsDownloadJsonTopLevelFieldKey[];
const TAG_COLOR_NAMES = [
  "amber",
  "blue",
  "cyan",
  "green",
  "orange",
  "red",
  "rose",
  "teal",
] as const;
const CUSTOM_TAG_COLOR_PATTERN = /^(?:#[0-9a-f]{6}|#[0-9a-f]{8})$/u;
const DOWNLOAD_TAG_FIELD_KEYS = [
  "label",
  "date",
] as const satisfies readonly OrgToolsDownloadTagFieldKey[];
const DOWNLOAD_UNIT_FIELD_KEYS = [
  "unitId",
  "unitName",
  "unitFullPath",
  "position",
  "isBoss",
] as const satisfies readonly OrgToolsDownloadUnitFieldKey[];

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
const isLocale = (value: unknown): value is AppLocale =>
  value === "ar" ||
  value === "en" ||
  value === "es" ||
  value === "fr" ||
  value === "ru" ||
  value === "zh";
const isActiveTab = (value: unknown): value is UiActiveTab =>
  value === "units" ||
  value === "employees" ||
  value === "orgEditor" ||
  value === "export" ||
  value === "analytics" ||
  value === "calendar";
const isLayoutMode = (value: unknown): value is OrgEditorLayoutMode =>
  value === "leftRight" || value === "topDown";

const normalizeTagAssignments = (value: unknown): EmployeeTagAssignment[] | null => {
  if (!Array.isArray(value)) return null;
  const tags: EmployeeTagAssignment[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (
      !isRecord(item) ||
      !hasExactKeys(item, ["date", "tagId"]) ||
      !isUuid(item.tagId) ||
      !(item.date === null || (isString(item.date) && isValidEmployeeTagDate(item.date)))
    ) {
      return null;
    }
    if (seen.has(item.tagId)) return null;
    seen.add(item.tagId);
    tags.push({ date: item.date, tagId: item.tagId });
  }
  return tags;
};

const normalizeCustomFieldValues = (
  value: unknown,
): Record<string, CustomEmployeeFieldValue> | null => {
  if (!isRecord(value)) return null;
  const result: Record<string, CustomEmployeeFieldValue> = {};
  for (const [key, fieldValue] of Object.entries(value)) {
    if (
      !isUuid(key) ||
      !(
        fieldValue === null ||
        isString(fieldValue) ||
        typeof fieldValue === "boolean" ||
        isFiniteNumber(fieldValue)
      )
    )
      return null;
    result[key] = fieldValue;
  }
  return result;
};

const normalizeEmployeeFields = (value: Record<string, unknown>) => {
  const tags = normalizeTagAssignments(value.tags);
  const customFieldValues = normalizeCustomFieldValues(value.customFieldValues);
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
    !customFieldValues ||
    !isNullableString(value.username)
  ) {
    return null;
  }
  try {
    const firstName = value.firstName.trim();
    const lastName = value.lastName.trim();
    const email = value.email?.trim() || null;
    const username = value.username?.trim() || null;
    if (!firstName && !lastName && !username && !email) return null;
    const avatarBase64Url = value.avatarBase64Url?.trim() || null;
    const profileUrl = value.profileUrl?.trim() || null;
    if (avatarBase64Url && !isSafeAvatarBase64Url(avatarBase64Url)) return null;
    if (profileUrl && !isSafeProfileUrl(profileUrl)) return null;
    return {
      avatarBase64Url,
      birthday: normalizeBirthday(value.birthday),
      customFieldValues,
      email,
      firstName,
      gender: value.gender,
      lastName,
      phone: value.phone?.trim() || null,
      profileUrl,
      tags,
      username,
    };
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
    !isTimestamp(value.createdAt) ||
    !isTimestamp(value.updatedAt)
  ) {
    return null;
  }
  return { ...fields, createdAt: value.createdAt, id: value.id, updatedAt: value.updatedAt };
};

const normalizeTagDefinitions = (value: unknown): EmployeeTagDefinition[] | null => {
  if (!Array.isArray(value)) return null;
  const definitions: EmployeeTagDefinition[] = [];
  const ids = new Set<string>();
  const labels = new Set<string>();
  for (const item of value) {
    if (
      !isRecord(item) ||
      !hasExactKeys(item, ["color", "id", "label"]) ||
      !isUuid(item.id) ||
      !isString(item.label)
    )
      return null;
    const label = item.label.normalize("NFKC").trim().replace(/\s+/gu, " ");
    const normalizedLabel = label.toLocaleLowerCase("en-US");
    if (!label || ids.has(item.id) || labels.has(normalizedLabel)) return null;
    if (
      !(
        item.color === null ||
        (isString(item.color) &&
          (TAG_COLOR_NAMES.includes(item.color as (typeof TAG_COLOR_NAMES)[number]) ||
            CUSTOM_TAG_COLOR_PATTERN.test(item.color)))
      )
    )
      return null;
    ids.add(item.id);
    labels.add(normalizedLabel);
    definitions.push({ color: item.color as EmployeeTagColor | null, id: item.id, label });
  }
  return definitions;
};

const isCanonicalCustomDate = (value: string) => {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value);
  if (!match) return false;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
};

const normalizeCustomFieldDefinitions = (
  value: unknown,
): CustomEmployeeFieldDefinition[] | null => {
  if (!Array.isArray(value)) return null;
  const definitions: CustomEmployeeFieldDefinition[] = [];
  const ids = new Set<string>();
  for (const item of value) {
    if (
      !isRecord(item) ||
      !isUuid(item.id) ||
      !isString(item.name) ||
      !isString(item.key) ||
      ids.has(item.id)
    )
      return null;
    ids.add(item.id);
    if (
      item.kind === "template" &&
      hasExactKeys(item, ["hash", "id", "key", "kind", "name", "template"]) &&
      isString(item.template) &&
      (item.hash === "none" || item.hash === "md5" || item.hash === "sha256")
    ) {
      definitions.push({
        hash: item.hash,
        id: item.id,
        key: item.key,
        kind: "template",
        name: item.name,
        template: item.template,
      });
      continue;
    }
    if (
      item.kind === "value" &&
      hasExactKeys(item, ["id", "key", "kind", "name", "options", "required", "valueType"]) &&
      typeof item.required === "boolean" &&
      (item.valueType === "text" ||
        item.valueType === "number" ||
        item.valueType === "boolean" ||
        item.valueType === "date" ||
        item.valueType === "option") &&
      Array.isArray(item.options)
    ) {
      const optionIds = new Set<string>();
      const options = item.options.flatMap((option) => {
        if (
          !isRecord(option) ||
          !hasExactKeys(option, ["id", "label"]) ||
          !isUuid(option.id) ||
          !isString(option.label) ||
          !option.label.trim() ||
          optionIds.has(option.id)
        )
          return [];
        optionIds.add(option.id);
        return [
          { id: option.id, label: option.label.normalize("NFKC").trim().replace(/\s+/gu, " ") },
        ];
      });
      if (
        options.length !== item.options.length ||
        (item.valueType !== "option" && options.length > 0)
      )
        return null;
      definitions.push({
        id: item.id,
        key: item.key,
        kind: "value",
        name: item.name,
        options,
        required: item.required,
        valueType: item.valueType,
      });
      continue;
    }
    return null;
  }
  return validateCustomEmployeeFieldDefinitions(definitions) === null ? definitions : null;
};

const normalizeLiveFilterRule = (value: unknown): EmployeeLiveFilterRule | null => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "birthday",
      "customFields",
      "includeWithoutTags",
      "includeWithoutUnits",
      "query",
      "selectedGenders",
      "selectedPositions",
      "selectedTags",
      "selectedUnitIds",
    ]) ||
    !isString(value.query) ||
    typeof value.includeWithoutTags !== "boolean" ||
    typeof value.includeWithoutUnits !== "boolean" ||
    !Array.isArray(value.customFields) ||
    !Array.isArray(value.selectedGenders) ||
    !value.selectedGenders.every(isEmployeeGender) ||
    !isStringArray(value.selectedPositions) ||
    !isUuidArray(value.selectedTags) ||
    !isUuidArray(value.selectedUnitIds)
  ) {
    return null;
  }
  let birthday: EmployeeLiveFilterRule["birthday"];
  if (value.birthday === null) {
    birthday = null;
  } else if (
    isRecord(value.birthday) &&
    hasExactKeys(value.birthday, ["day", "month", "year"]) &&
    Number.isInteger(value.birthday.day) &&
    Number.isInteger(value.birthday.month) &&
    Number.isInteger(value.birthday.year)
  ) {
    const day = value.birthday.day as number;
    const month = value.birthday.month as number;
    const year = value.birthday.year as number;
    const validationYear = year === 1900 ? 2000 : year;
    const date = new Date(Date.UTC(validationYear, month - 1, day));
    if (
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day ||
      year < 1900 ||
      year > new Date().getFullYear()
    )
      return null;
    birthday = { day, month, year };
  } else {
    return null;
  }
  const customFields = normalizeCustomFieldFilters(value.customFields);
  if (!customFields) return null;
  return {
    birthday,
    customFields,
    includeWithoutTags: value.includeWithoutTags,
    includeWithoutUnits: value.includeWithoutUnits,
    query: value.query.trim(),
    selectedGenders: [...value.selectedGenders],
    selectedPositions: [...new Set(value.selectedPositions.map((item) => item.trim()))].filter(
      Boolean,
    ),
    selectedTags: [...new Set(value.selectedTags)],
    selectedUnitIds: [...value.selectedUnitIds],
  };
};

function normalizeCustomFieldFilters(value: unknown) {
  if (!Array.isArray(value)) return null;
  const seen = new Set<string>();
  const result: EmployeeLiveFilterRule["customFields"] = [];
  for (const item of value) {
    if (
      !isRecord(item) ||
      !hasExactKeys(item, ["fieldId", "includeUnset", "selectedValues"]) ||
      !isUuid(item.fieldId) ||
      typeof item.includeUnset !== "boolean" ||
      !isStringArray(item.selectedValues) ||
      seen.has(item.fieldId)
    )
      return null;
    seen.add(item.fieldId);
    result.push({
      fieldId: item.fieldId,
      includeUnset: item.includeUnset,
      selectedValues: [...new Set(item.selectedValues)],
    });
  }
  return result;
}

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
      "noteMarkdown",
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
    !isString(value.noteMarkdown) ||
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
  const noteMarkdown = normalizeOrgEditorUnitNoteMarkdown(value.noteMarkdown);
  if (noteMarkdown === null || noteMarkdown !== value.noteMarkdown) return null;
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
    noteMarkdown,
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
      "customFields",
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
    !isUuidArray(value.selectedTags) ||
    !isUuidArray(value.selectedUnitIds)
  ) {
    return null;
  }
  let birthday: OrgToolsEmployeeFilters["birthday"] = null;
  if (value.birthday !== null) {
    if (
      !isRecord(value.birthday) ||
      !hasExactKeys(value.birthday, ["day", "month", "year"]) ||
      !Number.isInteger(value.birthday.day) ||
      !Number.isInteger(value.birthday.month) ||
      !Number.isInteger(value.birthday.year)
    ) {
      return null;
    }
    const day = value.birthday.day as number;
    const month = value.birthday.month as number;
    const year = value.birthday.year as number;
    const validationYear = year === 1900 ? 2000 : year;
    const date = new Date(Date.UTC(validationYear, month - 1, day));
    if (
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day ||
      year < 1900 ||
      year > new Date().getFullYear()
    )
      return null;
    birthday = { day, month, year };
  }
  const customFields = normalizeCustomFieldFilters(value.customFields);
  if (!customFields) return null;
  return {
    birthday,
    customFields,
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

const normalizeExactStringRecord = <Key extends string>(
  value: unknown,
  keys: readonly Key[],
): Record<Key, string> | null => {
  if (!isRecord(value) || !hasExactKeys(value, keys) || keys.some((key) => !isString(value[key]))) {
    return null;
  }
  return Object.fromEntries(keys.map((key) => [key, value[key]])) as Record<Key, string>;
};

const normalizeEnumArray = <Value extends string>(
  value: unknown,
  allowed: readonly Value[],
): Value[] | null => {
  if (!Array.isArray(value)) return null;
  const allowedSet = new Set<string>(allowed);
  return value.every((item) => isString(item) && allowedSet.has(item)) ? (value as Value[]) : null;
};

const normalizeCompleteEnumOrder = <Value extends string>(
  value: unknown,
  required: readonly Value[],
): Value[] | null => {
  const normalized = normalizeEnumArray(value, required);
  return normalized &&
    normalized.length === required.length &&
    new Set(normalized).size === required.length
    ? normalized
    : null;
};

const normalizeDownloadJsonFieldNames = (
  value: unknown,
): OrgToolsDownloadState["jsonFieldNames"] | null => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ["custom", "employee", "tags", "units"]) ||
    !isRecord(value.custom)
  )
    return null;
  if (!isRecord(value.tags) || !hasExactKeys(value.tags, ["collection", "fields"])) return null;
  if (!isRecord(value.units) || !hasExactKeys(value.units, ["collection", "fields"])) return null;
  const employee = normalizeExactStringRecord(value.employee, DOWNLOAD_EMPLOYEE_FIELD_KEYS);
  const tagFields = normalizeExactStringRecord(value.tags.fields, DOWNLOAD_TAG_FIELD_KEYS);
  const unitFields = normalizeExactStringRecord(value.units.fields, DOWNLOAD_UNIT_FIELD_KEYS);
  if (
    !employee ||
    !tagFields ||
    !unitFields ||
    !isString(value.tags.collection) ||
    !isString(value.units.collection)
  ) {
    return null;
  }
  const custom: Record<string, string> = {};
  for (const [fieldId, name] of Object.entries(value.custom)) {
    if (!isUuid(fieldId) || !isString(name)) return null;
    custom[fieldId] = name;
  }
  return {
    custom,
    employee,
    tags: { collection: value.tags.collection, fields: tagFields },
    units: { collection: value.units.collection, fields: unitFields },
  };
};

const normalizeDownloadState = (value: unknown): OrgToolsDownloadState | null => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "employeeFilters",
      "employeeQuery",
      "excludedEmployeeIds",
      "excludedJsonTagKeys",
      "excludedJsonUnitIds",
      "jsonFieldNames",
      "jsonTagFieldOrder",
      "jsonTopLevelFieldOrder",
      "jsonUnitFieldOrder",
      "rowMode",
      "selectedCustomEmployeeFieldIds",
      "selectedEmployeeFieldKeys",
      "selectedFilters",
      "selectedJsonTagFieldKeys",
      "selectedJsonUnitFieldKeys",
      "selectedQuery",
      "selections",
      "tabMode",
      "templateFormat",
      "unitQuery",
      "sourceViewId",
    ]) ||
    !isString(value.employeeQuery) ||
    !isEmployeeIdArray(value.excludedEmployeeIds) ||
    !isStringArray(value.excludedJsonTagKeys) ||
    !isUuidArray(value.excludedJsonUnitIds) ||
    !Array.isArray(value.jsonTagFieldOrder) ||
    !Array.isArray(value.jsonTopLevelFieldOrder) ||
    !Array.isArray(value.jsonUnitFieldOrder) ||
    (value.rowMode !== "allUnits" && value.rowMode !== "firstUnit") ||
    !Array.isArray(value.selectedEmployeeFieldKeys) ||
    !isUuidArray(value.selectedCustomEmployeeFieldIds) ||
    !Array.isArray(value.selectedJsonTagFieldKeys) ||
    !Array.isArray(value.selectedJsonUnitFieldKeys) ||
    !isString(value.selectedQuery) ||
    !Array.isArray(value.selections) ||
    (value.tabMode !== "json" && value.tabMode !== "template") ||
    !isString(value.templateFormat) ||
    !isString(value.unitQuery) ||
    !isUuid(value.sourceViewId)
  ) {
    return null;
  }
  const employeeFilters = normalizeEmployeeSearchFilters(value.employeeFilters);
  const selectedFilters = normalizeEmployeeSearchFilters(value.selectedFilters);
  const jsonFieldNames = normalizeDownloadJsonFieldNames(value.jsonFieldNames);
  const selections = value.selections.map(normalizeDownloadSelection);
  const rawTopLevelFieldOrder = value.jsonTopLevelFieldOrder as unknown[];
  const jsonTopLevelFieldOrder =
    rawTopLevelFieldOrder.every(
      (item) =>
        isString(item) &&
        (DOWNLOAD_JSON_TOP_LEVEL_FIELD_KEYS.includes(item as never) ||
          (item.startsWith("custom:") && isUuid(item.slice(7)))),
    ) &&
    new Set(rawTopLevelFieldOrder).size === rawTopLevelFieldOrder.length &&
    DOWNLOAD_JSON_TOP_LEVEL_FIELD_KEYS.every((key) => rawTopLevelFieldOrder.includes(key))
      ? (rawTopLevelFieldOrder as OrgToolsDownloadJsonTopLevelFieldKey[])
      : null;
  const jsonTagFieldOrder = normalizeCompleteEnumOrder(
    value.jsonTagFieldOrder,
    DOWNLOAD_TAG_FIELD_KEYS,
  );
  const jsonUnitFieldOrder = normalizeCompleteEnumOrder(
    value.jsonUnitFieldOrder,
    DOWNLOAD_UNIT_FIELD_KEYS,
  );
  const selectedEmployeeFieldKeys = normalizeEnumArray(
    value.selectedEmployeeFieldKeys,
    DOWNLOAD_EMPLOYEE_FIELD_KEYS,
  );
  const selectedJsonTagFieldKeys = normalizeEnumArray(
    value.selectedJsonTagFieldKeys,
    DOWNLOAD_TAG_FIELD_KEYS,
  );
  const selectedJsonUnitFieldKeys = normalizeEnumArray(
    value.selectedJsonUnitFieldKeys,
    DOWNLOAD_UNIT_FIELD_KEYS,
  );
  if (
    !employeeFilters ||
    !selectedFilters ||
    !jsonFieldNames ||
    !jsonTopLevelFieldOrder ||
    !jsonTagFieldOrder ||
    !jsonUnitFieldOrder ||
    !selectedEmployeeFieldKeys ||
    !selectedJsonTagFieldKeys ||
    !selectedJsonUnitFieldKeys ||
    selections.some((item) => !item)
  )
    return null;
  return {
    employeeFilters,
    employeeQuery: value.employeeQuery,
    excludedEmployeeIds: [...value.excludedEmployeeIds],
    excludedJsonTagKeys: [...new Set(value.excludedJsonTagKeys)],
    excludedJsonUnitIds: [...new Set(value.excludedJsonUnitIds)] as UnitId[],
    jsonFieldNames,
    jsonTagFieldOrder,
    jsonTopLevelFieldOrder,
    jsonUnitFieldOrder,
    rowMode: value.rowMode,
    selectedCustomEmployeeFieldIds: [...new Set(value.selectedCustomEmployeeFieldIds)],
    selectedEmployeeFieldKeys,
    selectedFilters,
    selectedJsonTagFieldKeys,
    selectedJsonUnitFieldKeys,
    selectedQuery: value.selectedQuery,
    selections: selections as OrgToolsDownloadSelection[],
    tabMode: value.tabMode,
    templateFormat: value.templateFormat,
    unitQuery: value.unitQuery,
    sourceViewId: value.sourceViewId,
  };
};

const assertUniqueIds = (ids: readonly string[], message: string): void => {
  if (new Set(ids).size !== ids.length) throw new Error(message);
};

const normalizeViewName = (value: string) => value.normalize("NFKC").trim().replace(/\s+/gu, " ");

const normalizeViewDocument = (value: unknown): OrgToolsViewDocument | null => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ["createdAt", "id", "kind", "name", "structure", "updatedAt"]) ||
    !isUuid(value.id) ||
    !isTimestamp(value.createdAt) ||
    !isTimestamp(value.updatedAt) ||
    (value.kind !== "custom" && value.kind !== "system") ||
    !isRecord(value.structure) ||
    !hasExactKeys(value.structure, ["layoutMode", "units"]) ||
    !isLayoutMode(value.structure.layoutMode) ||
    !Array.isArray(value.structure.units)
  ) {
    return null;
  }
  if (value.kind === "system" ? value.name !== null : !isString(value.name)) return null;
  if (value.kind === "custom") {
    const name = normalizeViewName(value.name as string);
    if (!name || name.length > 100 || name !== value.name) return null;
  }
  const units = value.structure.units.map(normalizeEditorUnit);
  if (units.some((unit) => !unit)) return null;
  return {
    createdAt: value.createdAt,
    id: value.id,
    kind: value.kind,
    name: value.kind === "system" ? null : (value.name as string),
    structure: {
      layoutMode: value.structure.layoutMode,
      units: units as OrgEditorUnit[],
    },
    updatedAt: value.updatedAt,
  } as OrgToolsViewDocument;
};

const validateStateGraph = (state: OrgToolsState): void => {
  const employees = state.organization.employees;
  const fieldDefinitions = state.organization.employeeFieldDefinitions;
  const fieldDefinitionById = new Map(
    fieldDefinitions.map((definition) => [definition.id, definition]),
  );
  const tagIds = new Set(state.organization.tags.map((tag) => tag.id));
  const employeeIds = new Set(employees.map((employee) => employee.id));
  assertUniqueIds(
    employees.map((employee) => employee.id),
    "State has duplicate Employee IDs.",
  );
  const identityKeys = employees.map(createEmployeeIdentityKey);
  assertUniqueIds(identityKeys, "State has duplicate Employee identities.");
  for (const employee of employees) {
    if (employee.tags.some((assignment) => !tagIds.has(assignment.tagId))) {
      throw new Error("Employee references a missing Tag.");
    }
    for (const [fieldId, value] of Object.entries(employee.customFieldValues)) {
      const definition = fieldDefinitionById.get(fieldId);
      if (definition?.kind !== "value")
        throw new Error("Employee references a missing Value field.");
      if (value === null) continue;
      if (definition.valueType === "text" && typeof value !== "string")
        throw new Error("Employee custom text value is invalid.");
      if (definition.valueType === "number" && !isFiniteNumber(value))
        throw new Error("Employee custom number value is invalid.");
      if (definition.valueType === "boolean" && typeof value !== "boolean")
        throw new Error("Employee custom boolean value is invalid.");
      if (definition.valueType === "date" && !(isString(value) && isCanonicalCustomDate(value)))
        throw new Error("Employee custom date value is invalid.");
      if (
        definition.valueType === "option" &&
        !(isString(value) && definition.options.some((option) => option.id === value))
      )
        throw new Error("Employee custom option value is invalid.");
    }
  }
  const views = state.organization.views;
  assertUniqueIds(
    views.map((view) => view.id),
    "State has duplicate View IDs.",
  );
  const systemViews = views.filter((view) => view.kind === "system");
  if (systemViews.length !== 1) throw new Error("State must contain exactly one system View.");
  const customNameKeys = views.flatMap((view) =>
    view.kind === "custom" ? [normalizeViewName(view.name).toLocaleLowerCase("en-US")] : [],
  );
  assertUniqueIds(customNameKeys, "State has duplicate custom View names.");
  const allUnitIds: UnitId[] = [];
  const unitIdsByViewId = new Map<ViewId, Set<UnitId>>();
  const systemFilters = [
    state.ui.analytics.filters,
    state.ui.employees.filters,
    state.ui.units.employeeFilters,
  ];
  const downloadFilters = [state.ui.download.employeeFilters, state.ui.download.selectedFilters];
  const allFilters = [...systemFilters, ...downloadFilters];
  for (const view of views) {
    const units = view.structure.units;
    const unitIds = new Set(units.map((unit) => unit.id));
    unitIdsByViewId.set(view.id, unitIds);
    allUnitIds.push(...unitIds);
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
        allFilters.push(unit.liveFilter);
        if (!hasEmployeeLiveFilterCriteria(unit.liveFilter)) {
          throw new Error(`Live Unit "${unit.name}" has an empty filter rule.`);
        }
        if (unit.liveFilter.selectedUnitIds.some((unitId) => !unitIds.has(unitId))) {
          throw new Error(`Live Unit "${unit.name}" references a missing Unit in its View.`);
        }
        if (unit.liveFilter.selectedUnitIds.includes(unit.id)) {
          throw new Error(`Live Unit "${unit.name}" cannot reference itself.`);
        }
      }
    }
    const visited = new Set<UnitId>();
    const visiting = new Set<UnitId>();
    const localUnitById = new Map(units.map((unit) => [unit.id, unit]));
    const visitParent = (unitId: UnitId): void => {
      if (visited.has(unitId)) return;
      if (visiting.has(unitId)) throw new Error("State has a cyclic Unit hierarchy.");
      visiting.add(unitId);
      const parentId = localUnitById.get(unitId)?.parentId;
      if (parentId) visitParent(parentId);
      visiting.delete(unitId);
      visited.add(unitId);
    };
    for (const unitId of unitIds) visitParent(unitId);
    getLiveUnitTopologicalOrder(units);
  }
  assertUniqueIds(allUnitIds, "State has duplicate Unit IDs across Views.");
  const systemView = systemViews[0] as OrgToolsViewDocument;
  const systemUnitIds = unitIdsByViewId.get(systemView.id) ?? new Set<UnitId>();
  if (state.ui.selectedUnitId !== null && !systemUnitIds.has(state.ui.selectedUnitId)) {
    throw new Error("Selected Unit does not exist.");
  }
  if (state.ui.expandedUnitIds.some((unitId) => !systemUnitIds.has(unitId))) {
    throw new Error("Expanded Units do not exist.");
  }
  for (const filters of allFilters) {
    if (filters.selectedTags.some((tagId) => !tagIds.has(tagId)))
      throw new Error("Filter references a missing Tag.");
    if (filters.customFields.some((filter) => !fieldDefinitionById.has(filter.fieldId)))
      throw new Error("Filter references a missing custom field.");
  }
  const customOrderIds = state.ui.download.jsonTopLevelFieldOrder.flatMap((key) =>
    key.startsWith("custom:") ? [key.slice(7)] : [],
  );
  if (
    customOrderIds.length !== fieldDefinitions.length ||
    customOrderIds.some((id) => !fieldDefinitionById.has(id))
  )
    throw new Error("Download custom field order is invalid.");
  if (state.ui.download.selectedCustomEmployeeFieldIds.some((id) => !fieldDefinitionById.has(id)))
    throw new Error("Download selects a missing custom field.");
  if (
    Object.keys(state.ui.download.jsonFieldNames.custom).some((id) => !fieldDefinitionById.has(id))
  )
    throw new Error("Download names a missing custom field.");
  const viewIds = new Set(views.map((view) => view.id));
  if (!viewIds.has(state.ui.editor.activeViewId)) throw new Error("Active View does not exist.");
  if (!viewIds.has(state.ui.download.sourceViewId))
    throw new Error("Download View does not exist.");
  assertUniqueIds(
    state.ui.editor.views.map((viewUi) => viewUi.viewId),
    "Editor View UI entries must be unique.",
  );
  if (
    state.ui.editor.views.length !== views.length ||
    state.ui.editor.views.some((viewUi) => !viewIds.has(viewUi.viewId))
  ) {
    throw new Error("Editor View UI must match organization Views.");
  }
  for (const viewUi of state.ui.editor.views) {
    const viewUnitIds = unitIdsByViewId.get(viewUi.viewId) ?? new Set<UnitId>();
    assertUniqueIds(viewUi.distributionModeUnitIds, "Distribution mode Unit IDs must be unique.");
    if (viewUi.distributionModeUnitIds.some((unitId) => !viewUnitIds.has(unitId))) {
      throw new Error("Distribution mode references a Unit outside its View.");
    }
    for (const item of viewUi.selectedItems) {
      if (!viewUnitIds.has(item.unitId)) throw new Error("Editor selects a missing Unit.");
      if (item.type === "employee" && !employeeIds.has(item.employeeId)) {
        throw new Error("Editor selects a missing Employee.");
      }
    }
  }
  const downloadUnitIds = unitIdsByViewId.get(state.ui.download.sourceViewId) ?? new Set<UnitId>();
  if (
    systemFilters.some((filters) =>
      filters.selectedUnitIds.some((unitId) => !systemUnitIds.has(unitId)),
    )
  ) {
    throw new Error("System filters reference a Unit outside the system View.");
  }
  if (
    downloadFilters.some((filters) =>
      filters.selectedUnitIds.some((unitId) => !downloadUnitIds.has(unitId)),
    )
  ) {
    throw new Error("Download filters reference a Unit outside its source View.");
  }
  if (
    state.ui.download.selections.some(
      (selection) => selection.type === "unit" && !downloadUnitIds.has(selection.unitId),
    ) ||
    state.ui.download.excludedJsonUnitIds.some((unitId) => !downloadUnitIds.has(unitId))
  ) {
    throw new Error("Download references a Unit outside its source View.");
  }
  assertUniqueIds(state.ui.expandedUnitIds, "Expanded Unit IDs must be unique.");
};

const normalizeViewUiState = (value: unknown): OrgToolsViewUiState | null => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ["distributionModeUnitIds", "selectedItems", "viewId", "viewport"]) ||
    !isUuid(value.viewId) ||
    !isUuidArray(value.distributionModeUnitIds) ||
    !Array.isArray(value.selectedItems)
  ) {
    return null;
  }
  const selectedItems = value.selectedItems.map(normalizeSelectedItem);
  const viewport = normalizeViewport(value.viewport);
  if (!viewport || selectedItems.some((item) => !item)) return null;
  return {
    distributionModeUnitIds: value.distributionModeUnitIds,
    selectedItems: selectedItems as OrgEditorSelectedItem[],
    viewId: value.viewId,
    viewport,
  };
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
    !hasExactKeys(value.calendar, ["monthIndex", "year"]) ||
    !Number.isInteger(value.calendar.monthIndex) ||
    (value.calendar.monthIndex as number) < 0 ||
    (value.calendar.monthIndex as number) > 11 ||
    !Number.isInteger(value.calendar.year) ||
    (value.calendar.year as number) < 1 ||
    (value.calendar.year as number) > 9999 ||
    !isRecord(value.editor) ||
    !hasExactKeys(value.editor, ["activeViewId", "searchOpen", "searchQuery", "views"]) ||
    !isUuid(value.editor.activeViewId) ||
    typeof value.editor.searchOpen !== "boolean" ||
    !isString(value.editor.searchQuery) ||
    !Array.isArray(value.editor.views) ||
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
  const viewUiStates = value.editor.views.map(normalizeViewUiState);
  if (
    !analyticsFilters ||
    !employeeFilters ||
    !unitEmployeeFilters ||
    !download ||
    viewUiStates.some((item) => !item)
  )
    return null;
  return {
    activeTab: value.activeTab,
    analytics: { filters: analyticsFilters, query: value.analytics.query },
    calendar: {
      monthIndex: value.calendar.monthIndex as number,
      year: value.calendar.year as number,
    },
    download,
    editor: {
      activeViewId: value.editor.activeViewId,
      searchOpen: value.editor.searchOpen,
      searchQuery: value.editor.searchQuery,
      views: viewUiStates as OrgToolsViewUiState[],
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
    !hasExactKeys(input.organization, ["employeeFieldDefinitions", "employees", "tags", "views"]) ||
    !Array.isArray(input.organization.employeeFieldDefinitions) ||
    !Array.isArray(input.organization.employees) ||
    !Array.isArray(input.organization.tags) ||
    !Array.isArray(input.organization.views)
  ) {
    throw new Error("State has an invalid top-level structure.");
  }
  const employeeFieldDefinitions = normalizeCustomFieldDefinitions(
    input.organization.employeeFieldDefinitions,
  );
  const tags = normalizeTagDefinitions(input.organization.tags);
  if (!employeeFieldDefinitions) throw new Error("State contains invalid custom Employee fields.");
  if (!tags) throw new Error("State contains invalid Tags.");
  const employees = input.organization.employees.map(normalizeOrganizationEmployee);
  if (employees.some((employee) => !employee))
    throw new Error("State contains an invalid Employee.");
  const views = input.organization.views.map(normalizeViewDocument);
  if (views.some((view) => !view)) throw new Error("State contains an invalid View structure.");
  const state: OrgToolsState = {
    organization: {
      employeeFieldDefinitions,
      employees: employees as OrganizationEmployee[],
      tags,
      views: views as OrgToolsViewDocument[],
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
  customFields: [],
  includeWithoutTags: false,
  includeWithoutUnits: false,
  selectedGenders: [],
  selectedPositions: [],
  selectedTags: [],
  selectedUnitIds: [],
});

export const createBlankDownloadState = (sourceViewId: ViewId): OrgToolsDownloadState => ({
  jsonTopLevelFieldOrder: [
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
    "units",
    "tags",
  ],
  employeeFilters: createEmptyEmployeeFiltersState(),
  employeeQuery: "",
  excludedEmployeeIds: [],
  excludedJsonTagKeys: [],
  excludedJsonUnitIds: [],
  jsonFieldNames: {
    custom: {},
    employee: Object.fromEntries(DOWNLOAD_EMPLOYEE_FIELD_KEYS.map((key) => [key, key])) as Record<
      OrgToolsDownloadEmployeeFieldKey,
      string
    >,
    tags: {
      collection: "tags",
      fields: { date: "date", label: "label" },
    },
    units: {
      collection: "units",
      fields: {
        isBoss: "isBoss",
        position: "position",
        unitFullPath: "unitFullPath",
        unitId: "unitId",
        unitName: "unitName",
      },
    },
  },
  jsonTagFieldOrder: ["label", "date"],
  jsonUnitFieldOrder: ["unitId", "unitName", "unitFullPath", "position", "isBoss"],
  rowMode: "allUnits",
  selectedCustomEmployeeFieldIds: [],
  selectedEmployeeFieldKeys: ["username"],
  selectedFilters: createEmptyEmployeeFiltersState(),
  selectedJsonTagFieldKeys: [],
  selectedJsonUnitFieldKeys: [],
  selectedQuery: "",
  selections: [],
  tabMode: "json",
  templateFormat: "{email}, ",
  unitQuery: "",
  sourceViewId,
});

export const createBlankOrgToolsState = (
  theme: UiTheme = "system",
  locale: AppLocale = "en",
): OrgToolsState => {
  const editor = createDefaultOrgEditorState();
  const currentDate = new Date();
  const systemViewId = createUuid();
  const now = currentDate.toISOString();
  return {
    organization: {
      employeeFieldDefinitions: [],
      employees: [],
      tags: [],
      views: [
        {
          createdAt: now,
          id: systemViewId,
          kind: "system",
          name: null,
          structure: { layoutMode: editor.layoutMode, units: editor.units },
          updatedAt: now,
        },
      ],
    },
    ui: {
      activeTab: "orgEditor",
      analytics: { filters: createEmptyEmployeeFiltersState(), query: "" },
      calendar: {
        monthIndex: currentDate.getMonth(),
        year: currentDate.getFullYear(),
      },
      download: createBlankDownloadState(systemViewId),
      editor: {
        activeViewId: systemViewId,
        searchOpen: false,
        searchQuery: "",
        views: [
          {
            distributionModeUnitIds: editor.distributionModeUnitIds,
            selectedItems: editor.selectedItems,
            viewId: systemViewId,
            viewport: editor.viewport,
          },
        ],
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
