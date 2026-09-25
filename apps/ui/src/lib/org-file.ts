import type {
  AppLocale,
  CustomEmployeeFieldDefinition,
  CustomEmployeeFieldValue,
  EmployeeDisplayFormats,
  EmployeeDisplayLineGaps,
  EmployeeId,
  EmployeeLiveFilterRule,
  EmployeeTagAssignment,
  EmployeeTagColor,
  EmployeeTagDefinition,
  OrganizationEmployee,
  OrgEditorAnchorOwner,
  OrgEditorAnchorRef,
  OrgEditorArrowEndpointAttachment,
  OrgEditorAttachment,
  OrgEditorCanvasElement,
  OrgEditorCanvasViewport,
  OrgEditorEmployeePosition,
  OrgEditorInlineTypography,
  OrgEditorLayoutMode,
  OrgEditorOpenPosition,
  OrgEditorSelectedItem,
  OrgEditorTextFormatRun,
  OrgEditorTypography,
  OrgEditorUnit,
  OrgEditorViewSettings,
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
import {
  createEmptyAnalyticsUiState,
  normalizeAnalyticsDashboards,
  normalizeAnalyticsUiState,
  validateAnalyticsGraph,
} from "@/lib/analytics-state";
import {
  normalizeCustomEmployeeFieldValue,
  validateCustomEmployeeFieldDefinitions,
} from "@/lib/custom-employee-fields";
import {
  createUuid,
  isEmployeeGender,
  isSafeAvatarBase64Url,
  isSafeProfileUrl,
  isUuid,
  normalizeBirthday,
} from "@/lib/employee-data";
import {
  createDefaultEmployeeDisplayFormats,
  DEFAULT_EMPLOYEE_DISPLAY_LINE_GAPS,
} from "@/lib/employee-display-defaults";
import { createEmployeeIdentityKey, isEmployeeId } from "@/lib/employee-id";
import { isValidEmployeeTagDate } from "@/lib/employee-tags";
import { getLiveUnitTopologicalOrder, hasEmployeeLiveFilterCriteria } from "@/lib/live-unit-filter";
import {
  createDefaultOrgEditorState,
  normalizeOrgEditorOpenPositionTitle,
  normalizeOrgEditorUnitNoteMarkdown,
} from "@/lib/org-editor";
import {
  hasOrgEditorCanvasElementDependencyCycle,
  isFiniteOrgEditorCanvasNumber,
  isOrgEditorCanvasColor,
  isOrgEditorCanvasFont,
  isOrgEditorTextFormatRunSequence,
  normalizeOrgEditorRotation,
  normalizeOrgEditorTextFormatRuns,
  ORG_EDITOR_ARROW_ANCHOR_IDS,
  ORG_EDITOR_CANVAS_MAX_FONT_SIZE,
  ORG_EDITOR_CANVAS_MAX_RECT_SIZE,
  ORG_EDITOR_CANVAS_MAX_STROKE_WIDTH,
  ORG_EDITOR_CANVAS_MIN_FONT_SIZE,
  ORG_EDITOR_CANVAS_MIN_RECT_SIZE,
  ORG_EDITOR_CANVAS_TEXT_MAX_UTF8_BYTES,
  ORG_EDITOR_EMPLOYEE_ANCHOR_IDS,
  ORG_EDITOR_RECT_ANCHOR_IDS,
} from "@/lib/org-editor-canvas";
import { parseOrgEditorCanvasImageDataUrl } from "@/lib/org-editor-canvas-image";

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
    if (!isUuid(key)) return null;
    if (
      fieldValue === null ||
      isString(fieldValue) ||
      typeof fieldValue === "boolean" ||
      isFiniteNumber(fieldValue)
    ) {
      result[key] = fieldValue;
      continue;
    }
    if (Array.isArray(fieldValue) && fieldValue.every(isString)) {
      result[key] = [...fieldValue];
      continue;
    }
    if (
      Array.isArray(fieldValue) &&
      fieldValue.every(
        (record) =>
          isRecord(record) &&
          Object.entries(record).every(
            ([fieldId, cell]) =>
              isUuid(fieldId) &&
              (cell === null ||
                isString(cell) ||
                typeof cell === "boolean" ||
                isFiniteNumber(cell)),
          ),
      )
    ) {
      result[key] = fieldValue as CustomEmployeeFieldValue;
      continue;
    }
    return null;
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
      hasExactKeys(item, [
        "allowCustomOptions",
        "id",
        "key",
        "kind",
        "multiple",
        "name",
        "options",
        "required",
        "valueType",
      ]) &&
      typeof item.allowCustomOptions === "boolean" &&
      typeof item.multiple === "boolean" &&
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
        allowCustomOptions: item.allowCustomOptions,
        id: item.id,
        key: item.key,
        kind: "value",
        multiple: item.multiple,
        name: item.name,
        options,
        required: item.required,
        valueType: item.valueType,
      });
      continue;
    }
    if (
      item.kind === "composite" &&
      hasExactKeys(item, ["fields", "id", "key", "kind", "name", "primaryFieldId", "required"]) &&
      Array.isArray(item.fields) &&
      isUuid(item.primaryFieldId) &&
      typeof item.required === "boolean"
    ) {
      const fieldIds = new Set<string>();
      const fields = item.fields.flatMap((field) => {
        if (
          !isRecord(field) ||
          !hasExactKeys(field, ["id", "name", "options", "required", "valueType"]) ||
          !isUuid(field.id) ||
          !isString(field.name) ||
          typeof field.required !== "boolean" ||
          !(
            field.valueType === "text" ||
            field.valueType === "number" ||
            field.valueType === "boolean" ||
            field.valueType === "date" ||
            field.valueType === "option"
          ) ||
          !Array.isArray(field.options) ||
          fieldIds.has(field.id)
        ) {
          return [];
        }
        const optionIds = new Set<string>();
        const options = field.options.flatMap((option) => {
          if (
            !isRecord(option) ||
            !hasExactKeys(option, ["id", "label"]) ||
            !isUuid(option.id) ||
            !isString(option.label) ||
            !option.label.trim() ||
            optionIds.has(option.id)
          ) {
            return [];
          }
          optionIds.add(option.id);
          return [
            { id: option.id, label: option.label.normalize("NFKC").trim().replace(/\s+/gu, " ") },
          ];
        });
        if (options.length !== field.options.length) return [];
        fieldIds.add(field.id);
        return [
          {
            id: field.id,
            name: field.name,
            options,
            required: field.required,
            valueType: field.valueType as "boolean" | "date" | "number" | "option" | "text",
          },
        ];
      });
      if (fields.length !== item.fields.length) return null;
      definitions.push({
        fields,
        id: item.id,
        key: item.key,
        kind: "composite",
        name: item.name,
        primaryFieldId: item.primaryFieldId,
        required: item.required,
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

const normalizeOpenPositions = (value: unknown): OrgEditorOpenPosition[] | null => {
  if (!Array.isArray(value)) return null;
  const positions: OrgEditorOpenPosition[] = [];
  for (const position of value) {
    if (
      !isRecord(position) ||
      !hasExactKeys(position, ["backgroundColor", "id", "tags", "title"]) ||
      !(position.backgroundColor === null || isOrgEditorCanvasColor(position.backgroundColor)) ||
      !isUuid(position.id) ||
      !isString(position.title) ||
      !normalizeOrgEditorOpenPositionTitle(position.title) ||
      position.title !== normalizeOrgEditorOpenPositionTitle(position.title)
    ) {
      return null;
    }
    const tags = normalizeTagAssignments(position.tags);
    if (!tags) return null;
    positions.push({
      backgroundColor: position.backgroundColor,
      id: position.id,
      tags,
      title: position.title,
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
      "openPositions",
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
  const openPositions = normalizeOpenPositions(value.openPositions);
  if (!employeePositions || !openPositions) return null;
  const noteMarkdown = normalizeOrgEditorUnitNoteMarkdown(value.noteMarkdown);
  if (noteMarkdown === null || noteMarkdown !== value.noteMarkdown) return null;
  const liveFilter = value.liveFilter === null ? null : normalizeLiveFilterRule(value.liveFilter);
  if (value.liveFilter !== null && !liveFilter) return null;
  if (liveFilter && (value.employeeIds.length > 0 || openPositions.length > 0)) return null;
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
    openPositions,
    order: value.order as number,
    parentId: value.parentId,
    updatedAt: value.updatedAt,
    x: value.x,
    y: value.y,
  };
};

const normalizeSelectedItem = (value: unknown): OrgEditorSelectedItem | null => {
  if (!isRecord(value)) return null;
  if (
    value.type === "element" &&
    hasExactKeys(value, ["elementId", "type"]) &&
    isUuid(value.elementId)
  ) {
    return { elementId: value.elementId, type: "element" };
  }
  if (!isUuid(value.unitId)) return null;
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
  if (
    value.type === "openPosition" &&
    hasExactKeys(value, ["openPositionId", "type", "unitId"]) &&
    isUuid(value.openPositionId)
  ) {
    return {
      openPositionId: value.openPositionId,
      type: "openPosition",
      unitId: value.unitId,
    };
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

const isSettingsColor = (value: unknown): value is EmployeeTagColor =>
  typeof value === "string" &&
  ((TAG_COLOR_NAMES as readonly string[]).includes(value) || CUSTOM_TAG_COLOR_PATTERN.test(value));

const normalizeViewSettings = (value: unknown): OrgEditorViewSettings | null => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "groupByTag",
      "showTagCloud",
      "distributedColor",
      "undistributedColor",
    ]) ||
    typeof value.groupByTag !== "boolean" ||
    typeof value.showTagCloud !== "boolean" ||
    !isSettingsColor(value.distributedColor) ||
    !isSettingsColor(value.undistributedColor)
  )
    return null;
  return {
    groupByTag: value.groupByTag,
    showTagCloud: value.showTagCloud,
    distributedColor: value.distributedColor,
    undistributedColor: value.undistributedColor,
  };
};

const normalizeCanvasPoint = (value: unknown) => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ["x", "y"]) ||
    !isFiniteOrgEditorCanvasNumber(value.x) ||
    !isFiniteOrgEditorCanvasNumber(value.y)
  ) {
    return null;
  }
  return { x: value.x, y: value.y };
};

const normalizeCanvasAnchorOwner = (value: unknown): OrgEditorAnchorOwner | null => {
  if (!isRecord(value) || typeof value.type !== "string") return null;
  if (value.type === "unit" && hasExactKeys(value, ["type", "unitId"]) && isUuid(value.unitId)) {
    return { type: "unit", unitId: value.unitId };
  }
  if (
    value.type === "employee" &&
    hasExactKeys(value, ["employeeId", "type", "unitId"]) &&
    isEmployeeId(value.employeeId) &&
    isUuid(value.unitId)
  ) {
    return { employeeId: value.employeeId, type: "employee", unitId: value.unitId };
  }
  if (
    value.type === "openPosition" &&
    hasExactKeys(value, ["openPositionId", "type", "unitId"]) &&
    isUuid(value.openPositionId) &&
    isUuid(value.unitId)
  ) {
    return {
      openPositionId: value.openPositionId,
      type: "openPosition",
      unitId: value.unitId,
    };
  }
  if (
    value.type === "element" &&
    hasExactKeys(value, ["elementId", "type"]) &&
    isUuid(value.elementId)
  ) {
    return { elementId: value.elementId, type: "element" };
  }
  return null;
};

const normalizeCanvasAnchorRef = (value: unknown): OrgEditorAnchorRef | null => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ["anchorId", "owner"]) ||
    !isString(value.anchorId)
  ) {
    return null;
  }
  const owner = normalizeCanvasAnchorOwner(value.owner);
  return owner ? { anchorId: value.anchorId as OrgEditorAnchorRef["anchorId"], owner } : null;
};

const normalizeCanvasAttachment = (value: unknown): OrgEditorAttachment | null => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ["offset", "sourceAnchorId", "target"]) ||
    !(ORG_EDITOR_RECT_ANCHOR_IDS as readonly string[]).includes(value.sourceAnchorId as string)
  ) {
    return null;
  }
  const offset = normalizeCanvasPoint(value.offset);
  const target = normalizeCanvasAnchorRef(value.target);
  return offset && target
    ? {
        offset,
        sourceAnchorId: value.sourceAnchorId as OrgEditorAttachment["sourceAnchorId"],
        target,
      }
    : null;
};

const normalizeCanvasEndpointAttachment = (
  value: unknown,
): OrgEditorArrowEndpointAttachment | null => {
  if (!isRecord(value) || !hasExactKeys(value, ["offset", "target"])) return null;
  const offset = normalizeCanvasPoint(value.offset);
  const target = normalizeCanvasAnchorRef(value.target);
  return offset && target ? { offset, target } : null;
};

const normalizeCanvasTypography = (value: unknown): OrgEditorTypography | null => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "color",
      "fontFamily",
      "fontSize",
      "fontWeight",
      "horizontalAlign",
      "verticalAlign",
    ]) ||
    !isOrgEditorCanvasColor(value.color) ||
    !isOrgEditorCanvasFont(value.fontFamily) ||
    !isFiniteNumber(value.fontSize) ||
    value.fontSize < ORG_EDITOR_CANVAS_MIN_FONT_SIZE ||
    value.fontSize > ORG_EDITOR_CANVAS_MAX_FONT_SIZE ||
    ![400, 500, 700].includes(value.fontWeight as number) ||
    !["left", "center", "right"].includes(value.horizontalAlign as string) ||
    !["top", "middle", "bottom"].includes(value.verticalAlign as string)
  ) {
    return null;
  }
  return {
    color: value.color,
    fontFamily: value.fontFamily,
    fontSize: value.fontSize,
    fontWeight: value.fontWeight as OrgEditorTypography["fontWeight"],
    horizontalAlign: value.horizontalAlign as OrgEditorTypography["horizontalAlign"],
    verticalAlign: value.verticalAlign as OrgEditorTypography["verticalAlign"],
  };
};

const normalizeCanvasInlineTypography = (value: unknown): OrgEditorInlineTypography | null => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ["color", "fontFamily", "fontSize", "fontWeight"]) ||
    !isOrgEditorCanvasColor(value.color) ||
    !isOrgEditorCanvasFont(value.fontFamily) ||
    !isFiniteNumber(value.fontSize) ||
    value.fontSize < ORG_EDITOR_CANVAS_MIN_FONT_SIZE ||
    value.fontSize > ORG_EDITOR_CANVAS_MAX_FONT_SIZE ||
    ![400, 500, 700].includes(value.fontWeight as number)
  ) {
    return null;
  }
  return {
    color: value.color,
    fontFamily: value.fontFamily,
    fontSize: value.fontSize,
    fontWeight: value.fontWeight as OrgEditorTypography["fontWeight"],
  };
};

const normalizeCanvasTextFormatRuns = (
  value: unknown,
  text: string,
  typography: OrgEditorTypography,
): OrgEditorTextFormatRun[] | null => {
  if (!Array.isArray(value)) return null;
  const formatRuns: OrgEditorTextFormatRun[] = [];
  for (const candidate of value) {
    if (
      !isRecord(candidate) ||
      !hasExactKeys(candidate, ["end", "start", "typography"]) ||
      !Number.isInteger(candidate.start) ||
      !Number.isInteger(candidate.end)
    ) {
      return null;
    }
    const runTypography = normalizeCanvasInlineTypography(candidate.typography);
    if (!runTypography) return null;
    formatRuns.push({
      end: candidate.end as number,
      start: candidate.start as number,
      typography: runTypography,
    });
  }
  if (!isOrgEditorTextFormatRunSequence(text, formatRuns)) return null;
  return normalizeOrgEditorTextFormatRuns(text, typography, formatRuns);
};

const normalizeCanvasRectBase = (value: Record<string, unknown>) => {
  if (
    !isUuid(value.id) ||
    !["aboveUnits", "behindUnits"].includes(value.layer as string) ||
    !isFiniteOrgEditorCanvasNumber(value.x) ||
    !isFiniteOrgEditorCanvasNumber(value.y) ||
    !isFiniteNumber(value.width) ||
    value.width < ORG_EDITOR_CANVAS_MIN_RECT_SIZE ||
    value.width > ORG_EDITOR_CANVAS_MAX_RECT_SIZE ||
    !isFiniteNumber(value.height) ||
    value.height < ORG_EDITOR_CANVAS_MIN_RECT_SIZE ||
    value.height > ORG_EDITOR_CANVAS_MAX_RECT_SIZE ||
    !isFiniteNumber(value.rotation)
  ) {
    return null;
  }
  const attachment = value.attachment === null ? null : normalizeCanvasAttachment(value.attachment);
  if (value.attachment !== null && !attachment) return null;
  return {
    attachment,
    height: value.height,
    id: value.id,
    layer: value.layer as "aboveUnits" | "behindUnits",
    rotation: normalizeOrgEditorRotation(value.rotation),
    width: value.width,
    x: value.x,
    y: value.y,
  };
};

const normalizeCanvasElement = (value: unknown): OrgEditorCanvasElement | null => {
  if (!isRecord(value) || typeof value.type !== "string") return null;
  if (value.type === "text" || value.type === "sticker") {
    const precedingKeys = [
      "attachment",
      ...(value.type === "sticker" ? ["backgroundColor"] : []),
      "height",
      "id",
      "layer",
      "rotation",
      "text",
      "typography",
      "type",
      "width",
      "x",
      "y",
    ];
    const currentTextKeys = [...precedingKeys, "autoWidth", "fillColor", "fillMode", "formatRuns"];
    const currentStickerKeys = [...precedingKeys, "formatRuns"];
    const isPrecedingText = value.type === "text" && hasExactKeys(value, precedingKeys);
    const isCurrentText = value.type === "text" && hasExactKeys(value, currentTextKeys);
    const isPrecedingSticker = value.type === "sticker" && hasExactKeys(value, precedingKeys);
    const isCurrentSticker = value.type === "sticker" && hasExactKeys(value, currentStickerKeys);
    const hasExpectedKeys =
      value.type === "sticker"
        ? isPrecedingSticker || isCurrentSticker
        : isPrecedingText || isCurrentText;
    if (!hasExpectedKeys || !isString(value.text)) return null;
    if (new TextEncoder().encode(value.text).byteLength > ORG_EDITOR_CANVAS_TEXT_MAX_UTF8_BYTES) {
      return null;
    }
    const base = normalizeCanvasRectBase(value);
    const typography = normalizeCanvasTypography(value.typography);
    if (!base || !typography) return null;
    if (value.type === "sticker") {
      if (!isOrgEditorCanvasColor(value.backgroundColor)) return null;
      const formatRuns = isCurrentSticker
        ? normalizeCanvasTextFormatRuns(value.formatRuns, value.text, typography)
        : [];
      if (!formatRuns) return null;
      return {
        ...base,
        backgroundColor: value.backgroundColor,
        formatRuns,
        text: value.text,
        typography,
        type: "sticker",
      };
    }
    if (isPrecedingText) {
      return {
        ...base,
        autoWidth: false,
        fillColor: "amber",
        fillMode: "none",
        formatRuns: [],
        text: value.text,
        typography: { ...typography, verticalAlign: "top" },
        type: "text",
      };
    }
    if (
      typeof value.autoWidth !== "boolean" ||
      !["none", "block", "lines"].includes(value.fillMode as string) ||
      !isOrgEditorCanvasColor(value.fillColor)
    ) {
      return null;
    }
    const formatRuns = normalizeCanvasTextFormatRuns(value.formatRuns, value.text, typography);
    if (!formatRuns) return null;
    return {
      ...base,
      autoWidth: value.autoWidth,
      fillColor: value.fillColor,
      fillMode: value.fillMode as "block" | "lines" | "none",
      formatRuns,
      text: value.text,
      typography: { ...typography, verticalAlign: "top" },
      type: "text",
    };
  }
  if (value.type === "image") {
    if (
      !hasExactKeys(value, [
        "attachment",
        "dataUrl",
        "height",
        "id",
        "intrinsicHeight",
        "intrinsicWidth",
        "layer",
        "lockAspectRatio",
        "rotation",
        "type",
        "width",
        "x",
        "y",
      ]) ||
      !isString(value.dataUrl) ||
      typeof value.lockAspectRatio !== "boolean" ||
      !Number.isInteger(value.intrinsicWidth) ||
      !Number.isInteger(value.intrinsicHeight)
    ) {
      return null;
    }
    const base = normalizeCanvasRectBase(value);
    const source = parseOrgEditorCanvasImageDataUrl(value.dataUrl);
    if (
      !base ||
      !source ||
      source.width !== value.intrinsicWidth ||
      source.height !== value.intrinsicHeight
    ) {
      return null;
    }
    return {
      ...base,
      dataUrl: source.dataUrl,
      intrinsicHeight: source.height,
      intrinsicWidth: source.width,
      lockAspectRatio: value.lockAspectRatio,
      type: "image",
    };
  }
  if (value.type !== "arrow") return null;
  if (
    !hasExactKeys(value, [
      "dash",
      "end",
      "endControl",
      "endMarker",
      "id",
      "layer",
      "start",
      "startControl",
      "startMarker",
      "strokeColor",
      "strokeWidth",
      "type",
    ]) ||
    !isUuid(value.id) ||
    !["aboveUnits", "behindUnits"].includes(value.layer as string) ||
    !["solid", "dashed"].includes(value.dash as string) ||
    !["arrow", "none"].includes(value.startMarker as string) ||
    !["arrow", "none"].includes(value.endMarker as string) ||
    !isOrgEditorCanvasColor(value.strokeColor) ||
    !isFiniteNumber(value.strokeWidth) ||
    value.strokeWidth < 1 ||
    value.strokeWidth > ORG_EDITOR_CANVAS_MAX_STROKE_WIDTH
  ) {
    return null;
  }
  const normalizeEndpoint = (endpoint: unknown) => {
    if (
      !isRecord(endpoint) ||
      !hasExactKeys(endpoint, ["attachment", "x", "y"]) ||
      !isFiniteOrgEditorCanvasNumber(endpoint.x) ||
      !isFiniteOrgEditorCanvasNumber(endpoint.y)
    ) {
      return null;
    }
    const attachment =
      endpoint.attachment === null ? null : normalizeCanvasEndpointAttachment(endpoint.attachment);
    return endpoint.attachment !== null && !attachment
      ? null
      : { attachment, x: endpoint.x, y: endpoint.y };
  };
  const start = normalizeEndpoint(value.start);
  const end = normalizeEndpoint(value.end);
  const startControl = normalizeCanvasPoint(value.startControl);
  const endControl = normalizeCanvasPoint(value.endControl);
  if (!start || !end || !startControl || !endControl) return null;
  return {
    dash: value.dash as "dashed" | "solid",
    end,
    endControl,
    endMarker: value.endMarker as "arrow" | "none",
    id: value.id,
    layer: value.layer as "aboveUnits" | "behindUnits",
    start,
    startControl,
    startMarker: value.startMarker as "arrow" | "none",
    strokeColor: value.strokeColor,
    strokeWidth: value.strokeWidth,
    type: "arrow",
  };
};

const normalizeViewDocument = (value: unknown): OrgToolsViewDocument | null => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ["createdAt", "id", "kind", "name", "structure", "updatedAt"]) ||
    !isUuid(value.id) ||
    !isTimestamp(value.createdAt) ||
    !isTimestamp(value.updatedAt) ||
    (value.kind !== "custom" && value.kind !== "system") ||
    !isRecord(value.structure) ||
    !hasExactKeys(value.structure, ["canvasElements", "layoutMode", "settings", "units"]) ||
    !isLayoutMode(value.structure.layoutMode) ||
    !Array.isArray(value.structure.canvasElements) ||
    !Array.isArray(value.structure.units)
  ) {
    return null;
  }
  if (value.kind === "system" ? value.name !== null : !isString(value.name)) return null;
  if (value.kind === "custom") {
    const name = normalizeViewName(value.name as string);
    if (!name || name.length > 100 || name !== value.name) return null;
  }
  const settings = normalizeViewSettings(value.structure.settings);
  if (!settings) return null;
  const canvasElements = value.structure.canvasElements.map(normalizeCanvasElement);
  const units = value.structure.units.map(normalizeEditorUnit);
  if (canvasElements.some((element) => !element) || units.some((unit) => !unit)) return null;
  return {
    createdAt: value.createdAt,
    id: value.id,
    kind: value.kind,
    name: value.kind === "system" ? null : (value.name as string),
    structure: {
      canvasElements: canvasElements as OrgEditorCanvasElement[],
      layoutMode: value.structure.layoutMode,
      settings,
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
      if (!definition || definition.kind === "template") {
        throw new Error("Employee references a missing stored custom field.");
      }
      try {
        normalizeCustomEmployeeFieldValue(definition, value);
      } catch {
        throw new Error("Employee custom field value is invalid.");
      }
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
  const unitsByViewId = new Map<ViewId, Map<UnitId, OrgEditorUnit>>();
  const elementIdsByViewId = new Map<ViewId, Set<string>>();
  const systemFilters = [
    state.ui.analytics.drilldown.filters,
    state.ui.employees.filters,
    state.ui.units.employeeFilters,
  ];
  const downloadFilters = [state.ui.download.employeeFilters, state.ui.download.selectedFilters];
  const allFilters = [...systemFilters, ...downloadFilters];
  for (const view of views) {
    const units = view.structure.units;
    const unitIds = new Set(units.map((unit) => unit.id));
    const unitById = new Map(units.map((unit) => [unit.id, unit] as const));
    const openPositionIds = units.flatMap((unit) =>
      unit.openPositions.map((position) => position.id),
    );
    const canvasElements = view.structure.canvasElements;
    const elementById = new Map(canvasElements.map((element) => [element.id, element] as const));
    const elementIds = new Set(elementById.keys());
    unitIdsByViewId.set(view.id, unitIds);
    unitsByViewId.set(view.id, unitById);
    elementIdsByViewId.set(view.id, elementIds);
    allUnitIds.push(...unitIds);
    assertUniqueIds(
      canvasElements.map((element) => element.id),
      "State has duplicate canvas element IDs inside a View.",
    );
    assertUniqueIds(openPositionIds, "State has duplicate open position IDs inside a View.");
    const validateAnchorRef = (ref: OrgEditorAnchorRef) => {
      if (ref.owner.type === "unit") {
        if (!unitIds.has(ref.owner.unitId))
          throw new Error("Canvas anchor references a missing Unit.");
        if (!(ORG_EDITOR_RECT_ANCHOR_IDS as readonly string[]).includes(ref.anchorId)) {
          throw new Error("Canvas Unit anchor is invalid.");
        }
        return;
      }
      if (ref.owner.type === "employee") {
        const ownerUnit = unitById.get(ref.owner.unitId);
        if (!ownerUnit || !employeeIds.has(ref.owner.employeeId)) {
          throw new Error("Canvas anchor references a missing Employee occurrence.");
        }
        if (
          ownerUnit.liveFilter === null &&
          !ownerUnit.employeeIds.includes(ref.owner.employeeId)
        ) {
          throw new Error("Canvas anchor references a missing Employee occurrence.");
        }
        if (!(ORG_EDITOR_EMPLOYEE_ANCHOR_IDS as readonly string[]).includes(ref.anchorId)) {
          throw new Error("Canvas Employee anchor is invalid.");
        }
        return;
      }
      if (ref.owner.type === "openPosition") {
        const owner = ref.owner;
        const ownerUnit = unitById.get(owner.unitId);
        if (!ownerUnit?.openPositions.some((position) => position.id === owner.openPositionId)) {
          throw new Error("Canvas anchor references a missing open position.");
        }
        if (!(ORG_EDITOR_EMPLOYEE_ANCHOR_IDS as readonly string[]).includes(ref.anchorId)) {
          throw new Error("Canvas open position anchor is invalid.");
        }
        return;
      }
      const target = elementById.get(ref.owner.elementId);
      if (!target) throw new Error("Canvas anchor references a missing element.");
      const validAnchors =
        target.type === "arrow" ? ORG_EDITOR_ARROW_ANCHOR_IDS : ORG_EDITOR_RECT_ANCHOR_IDS;
      if (!(validAnchors as readonly string[]).includes(ref.anchorId)) {
        throw new Error("Canvas element anchor is invalid.");
      }
    };
    for (const element of canvasElements) {
      const refs =
        element.type === "arrow"
          ? [element.start.attachment?.target, element.end.attachment?.target]
          : [element.attachment?.target];
      for (const ref of refs) if (ref) validateAnchorRef(ref);
    }
    if (hasOrgEditorCanvasElementDependencyCycle(canvasElements)) {
      throw new Error("State has a cyclic canvas attachment graph.");
    }
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
      for (const openPosition of unit.openPositions) {
        if (openPosition.tags.some((tag) => !tagIds.has(tag.tagId))) {
          throw new Error(`Unit "${unit.name}" open position references a missing Tag.`);
        }
      }
      if (!unit.liveFilter) {
        if (positionIds.some((employeeId) => !unit.employeeIds.includes(employeeId))) {
          throw new Error(`Unit "${unit.name}" has a position without an Employee assignment.`);
        }
        if (unit.bossEmployeeId !== null && !unit.employeeIds.includes(unit.bossEmployeeId)) {
          throw new Error(`Unit "${unit.name}" has an unassigned boss.`);
        }
      } else {
        if (unit.openPositions.length > 0) {
          throw new Error(`Live Unit "${unit.name}" contains an open position.`);
        }
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
    const viewElementIds = elementIdsByViewId.get(viewUi.viewId) ?? new Set<string>();
    assertUniqueIds(viewUi.distributionModeUnitIds, "Distribution mode Unit IDs must be unique.");
    if (viewUi.distributionModeUnitIds.some((unitId) => !viewUnitIds.has(unitId))) {
      throw new Error("Distribution mode references a Unit outside its View.");
    }
    for (const item of viewUi.selectedItems) {
      if (item.type === "element") {
        if (!viewElementIds.has(item.elementId))
          throw new Error("Editor selects a missing element.");
        continue;
      }
      if (!viewUnitIds.has(item.unitId)) throw new Error("Editor selects a missing Unit.");
      if (item.type === "employee" && !employeeIds.has(item.employeeId)) {
        throw new Error("Editor selects a missing Employee.");
      }
      if (item.type === "openPosition") {
        const unit = unitsByViewId.get(viewUi.viewId)?.get(item.unitId);
        if (!unit?.openPositions.some((position) => position.id === item.openPositionId)) {
          throw new Error("Editor selects a missing open position.");
        }
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
  validateAnalyticsGraph(
    state.organization.analyticsDashboards,
    state.ui.analytics,
    state.organization.views,
    state.organization.employeeFieldDefinitions,
  );
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
  const analytics = normalizeAnalyticsUiState(value.analytics, normalizeEmployeeSearchFilters);
  const employeeFilters = normalizeEmployeeSearchFilters(value.employees.filters);
  const unitEmployeeFilters = normalizeEmployeeSearchFilters(value.units.employeeFilters);
  const download = normalizeDownloadState(value.download);
  const viewUiStates = value.editor.views.map(normalizeViewUiState);
  if (
    !analytics ||
    !employeeFilters ||
    !unitEmployeeFilters ||
    !download ||
    viewUiStates.some((item) => !item)
  )
    return null;
  return {
    activeTab: value.activeTab,
    analytics,
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

const isEmployeeDisplayLineGap = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 24;

export const parseOrgToolsState = (input: unknown): OrgToolsState => {
  if (!isRecord(input)) throw new Error("State must be a JSON object.");
  if (
    !hasExactKeys(input, ["organization", "ui"]) ||
    !isRecord(input.organization) ||
    !hasExactKeys(input.organization, [
      "analyticsDashboards",
      "employeeDisplayFormats",
      "employeeDisplayLineGaps",
      "employeeFieldDefinitions",
      "employees",
      "tags",
      "views",
    ]) ||
    !Array.isArray(input.organization.analyticsDashboards) ||
    !isRecord(input.organization.employeeDisplayFormats) ||
    !hasExactKeys(input.organization.employeeDisplayFormats, [
      "editor",
      "editorExport",
      "employees",
      "units",
    ]) ||
    !isString(input.organization.employeeDisplayFormats.editor) ||
    !isString(input.organization.employeeDisplayFormats.editorExport) ||
    !isString(input.organization.employeeDisplayFormats.employees) ||
    !isString(input.organization.employeeDisplayFormats.units) ||
    !isRecord(input.organization.employeeDisplayLineGaps) ||
    !hasExactKeys(input.organization.employeeDisplayLineGaps, [
      "editor",
      "editorExport",
      "employees",
      "units",
    ]) ||
    !isEmployeeDisplayLineGap(input.organization.employeeDisplayLineGaps.editor) ||
    !isEmployeeDisplayLineGap(input.organization.employeeDisplayLineGaps.editorExport) ||
    !isEmployeeDisplayLineGap(input.organization.employeeDisplayLineGaps.employees) ||
    !isEmployeeDisplayLineGap(input.organization.employeeDisplayLineGaps.units) ||
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
  const analyticsDashboards = normalizeAnalyticsDashboards(input.organization.analyticsDashboards);
  if (!analyticsDashboards) throw new Error("State contains invalid Analytics dashboards.");
  const employees = input.organization.employees.map(normalizeOrganizationEmployee);
  if (employees.some((employee) => !employee))
    throw new Error("State contains an invalid Employee.");
  const views = input.organization.views.map(normalizeViewDocument);
  if (views.some((view) => !view)) throw new Error("State contains an invalid View structure.");
  const state: OrgToolsState = {
    organization: {
      analyticsDashboards,
      employeeDisplayFormats: {
        editor: input.organization.employeeDisplayFormats.editor,
        editorExport: input.organization.employeeDisplayFormats.editorExport,
        employees: input.organization.employeeDisplayFormats.employees,
        units: input.organization.employeeDisplayFormats.units,
      } satisfies EmployeeDisplayFormats,
      employeeDisplayLineGaps: {
        editor: input.organization.employeeDisplayLineGaps.editor,
        editorExport: input.organization.employeeDisplayLineGaps.editorExport,
        employees: input.organization.employeeDisplayLineGaps.employees,
        units: input.organization.employeeDisplayLineGaps.units,
      } satisfies EmployeeDisplayLineGaps,
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
      analyticsDashboards: [],
      employeeDisplayFormats: createDefaultEmployeeDisplayFormats(locale),
      employeeDisplayLineGaps: { ...DEFAULT_EMPLOYEE_DISPLAY_LINE_GAPS },
      employeeFieldDefinitions: [],
      employees: [],
      tags: [],
      views: [
        {
          createdAt: now,
          id: systemViewId,
          kind: "system",
          name: null,
          structure: {
            canvasElements: editor.canvasElements,
            layoutMode: editor.layoutMode,
            settings: editor.settings,
            units: editor.units,
          },
          updatedAt: now,
        },
      ],
    },
    ui: {
      activeTab: "orgEditor",
      analytics: createEmptyAnalyticsUiState(createEmptyEmployeeFiltersState),
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
