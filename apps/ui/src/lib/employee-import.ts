import type { EditableEmployeeFields, OrgToolsState } from "@org-tools/types";
import { LocalizedError, uiMessage } from "@/i18n/messages";
import {
  MAX_AVATAR_BYTES,
  normalizeAvatarBase64Url as normalizeSafeAvatarBase64Url,
  normalizeProfileUrl as normalizeSafeProfileUrl,
} from "@/lib/employee-data";
import { normalizeEmployeeTags } from "@/lib/employee-tags";
import { parseOrgToolsState } from "@/lib/org-file";

export const MAX_EMPLOYEE_IMPORT_ROWS = 50_000;
export const MAX_EMPLOYEE_IMPORT_SOURCE_FIELDS = 500;
export const MAX_EMPLOYEE_AVATAR_BYTES = MAX_AVATAR_BYTES;

export const EMPLOYEE_IMPORT_TARGETS = [
  "firstName",
  "lastName",
  "email",
  "username",
  "profileUrl",
  "avatarBase64Url",
  "phone",
  "birthday",
  "gender",
  "tags",
] as const;

export type EmployeeImportTarget = (typeof EMPLOYEE_IMPORT_TARGETS)[number];

export type ImportedEmployeeDraft = EditableEmployeeFields;

export type ExistingEmployeeIdentity = {
  email: string | null;
  id: string;
  username: string | null;
};

export type EmployeeFieldMapping = Record<EmployeeImportTarget, string | null>;

export type EmployeeImportSourceRow = {
  rowNumber: number;
  values: Record<string, unknown>;
};

export type EmployeeImportCollection = {
  id: string;
  label: string;
  rows: EmployeeImportSourceRow[];
  sourceFields: string[];
};

export type EmployeeImportDocument = {
  collections: EmployeeImportCollection[];
};

export type ParsedEmployeeImportSource =
  | {
      kind: "state";
      state: OrgToolsState;
    }
  | {
      document: EmployeeImportDocument;
      kind: "tabular";
    };

export type NormalizedEmployeeImportRow = {
  draft: ImportedEmployeeDraft | null;
  errors: string[];
  rowNumber: number;
  sourceValues: Record<string, unknown>;
  status: "empty" | "invalid" | "valid";
};

export type EmployeeImportPlanRow = Omit<NormalizedEmployeeImportRow, "status"> & {
  status: "conflict" | "duplicate" | "empty" | "invalid" | "new";
};

export type EmployeeImportPlan = {
  canCommit: boolean;
  configurationErrors: string[];
  conflictRowCount: number;
  drafts: ImportedEmployeeDraft[];
  duplicateRowCount: number;
  emptyRowCount: number;
  invalidRowCount: number;
  newEmployeeCount: number;
  rows: EmployeeImportPlanRow[];
  totalRowCount: number;
};

type EmployeeImportTargetDefinition = {
  aliases: readonly string[];
  label: string;
};

export const EMPLOYEE_IMPORT_TARGET_DEFINITIONS: Record<
  EmployeeImportTarget,
  EmployeeImportTargetDefinition
> = {
  avatarBase64Url: {
    aliases: [
      "avatarbase64url",
      "avatarbase64",
      "avatar",
      "imagebase64url",
      "imagebase64",
      "photobase64url",
      "photobase64",
    ],
    label: "Embedded avatar",
  },
  birthday: {
    aliases: ["birthday", "birthdate", "dateofbirth", "dob"],
    label: "Birthday",
  },
  email: {
    aliases: ["email", "emailaddress", "mail", "mailaddress"],
    label: "Email",
  },
  firstName: {
    aliases: ["firstname", "givenname", "given", "forename"],
    label: "First name",
  },
  gender: {
    aliases: ["gender", "sex"],
    label: "Gender",
  },
  lastName: {
    aliases: ["lastname", "surname", "familyname", "family"],
    label: "Last name",
  },
  phone: {
    aliases: ["phone", "phonenumber", "mobile", "mobilephone", "telephone"],
    label: "Phone",
  },
  profileUrl: {
    aliases: ["profileurl", "profilelink", "profile", "personalurl", "homepage"],
    label: "Profile URL",
  },
  tags: {
    aliases: ["tags", "tag", "labels", "label"],
    label: "Tags",
  },
  username: {
    aliases: ["username", "userlogin", "login", "handle", "userhandle"],
    label: "Username",
  },
};

const EMPTY_MAPPING: EmployeeFieldMapping = {
  avatarBase64Url: null,
  birthday: null,
  email: null,
  firstName: null,
  gender: null,
  lastName: null,
  phone: null,
  profileUrl: null,
  tags: null,
  username: null,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isScalar = (value: unknown): value is boolean | number | string =>
  typeof value === "boolean" ||
  (typeof value === "number" && Number.isFinite(value)) ||
  typeof value === "string";

const joinJsonPath = (parentPath: string, key: string) =>
  /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key)
    ? `${parentPath}.${key}`
    : `${parentPath}[${JSON.stringify(key)}]`;

const joinFieldPath = (parentPath: string, key: string) =>
  parentPath.length === 0 ? key : `${parentPath}.${key}`;

const flattenJsonRow = (
  value: Record<string, unknown>,
  parentPath = "",
  result: Record<string, unknown> = {},
  depth = 0,
): Record<string, unknown> => {
  if (depth > 20)
    throw new LocalizedError(uiMessage("JSON nesting exceeds the supported depth of 20 levels."));

  for (const [key, nestedValue] of Object.entries(value)) {
    const fieldPath = joinFieldPath(parentPath, key);
    if (isRecord(nestedValue)) {
      flattenJsonRow(nestedValue, fieldPath, result, depth + 1);
      continue;
    }

    if (nestedValue === null || isScalar(nestedValue) || Array.isArray(nestedValue)) {
      result[fieldPath] = nestedValue;
    }
  }

  return result;
};

const createCollection = (
  id: string,
  label: string,
  rows: readonly Record<string, unknown>[],
): EmployeeImportCollection => {
  if (rows.length > MAX_EMPLOYEE_IMPORT_ROWS) {
    throw new LocalizedError(
      uiMessage("{collection} contains {count} rows; the limit is {limit}.", {
        collection: label,
        count: rows.length,
        limit: MAX_EMPLOYEE_IMPORT_ROWS,
      }),
    );
  }

  const sourceFieldSet = new Set<string>();
  const flattenedRows = rows.map((row, rowIndex) => {
    const values = flattenJsonRow(row);
    for (const field of Object.keys(values)) sourceFieldSet.add(field);
    const collectNestedArrayFields = (value: Record<string, unknown>, depth = 0): void => {
      if (depth > 20) return;
      for (const nestedValue of Object.values(value)) {
        if (!Array.isArray(nestedValue)) continue;
        for (const item of nestedValue) {
          if (!isRecord(item)) continue;
          for (const field of Object.keys(flattenJsonRow(item))) sourceFieldSet.add(field);
          collectNestedArrayFields(item, depth + 1);
        }
      }
    };
    collectNestedArrayFields(row);
    return { rowNumber: rowIndex + 1, values };
  });

  if (sourceFieldSet.size > MAX_EMPLOYEE_IMPORT_SOURCE_FIELDS) {
    throw new LocalizedError(
      uiMessage("{collection} contains {count} fields; the limit is {limit}.", {
        collection: label,
        count: sourceFieldSet.size,
        limit: MAX_EMPLOYEE_IMPORT_SOURCE_FIELDS,
      }),
    );
  }

  return {
    id,
    label,
    rows: flattenedRows,
    sourceFields: [...sourceFieldSet],
  };
};

export const parseJsonEmployeeImport = (value: unknown): EmployeeImportDocument => {
  const collectionRowsByPath = new Map<string, Record<string, unknown>[]>();
  const visit = (currentValue: unknown, path: string, depth: number): void => {
    if (depth > 20)
      throw new LocalizedError(uiMessage("JSON nesting exceeds the supported depth of 20 levels."));

    if (Array.isArray(currentValue)) {
      const rows = currentValue.filter(isRecord);
      const isObjectCollection =
        rows.length > 0 && currentValue.every((item) => item === null || isRecord(item));
      if (!isObjectCollection) return;

      const existingRows = collectionRowsByPath.get(path) ?? [];
      existingRows.push(...rows);
      collectionRowsByPath.set(path, existingRows);
      for (const row of rows) visit(row, `${path}[]`, depth + 1);
      return;
    }

    if (!isRecord(currentValue)) return;
    for (const [key, nestedValue] of Object.entries(currentValue)) {
      if (isRecord(nestedValue) || Array.isArray(nestedValue)) {
        visit(nestedValue, joinJsonPath(path, key), depth + 1);
      }
    }
  };

  if (Array.isArray(value)) {
    const rows = value.filter(isRecord);
    if (rows.length === 0 || !value.every((item) => item === null || isRecord(item))) {
      throw new LocalizedError(uiMessage("JSON root arrays must contain objects."));
    }
    collectionRowsByPath.set("$", rows);
    for (const row of rows) visit(row, "$[]", 1);
  } else if (isRecord(value)) {
    visit(value, "$", 0);
    const rootFields = flattenJsonRow(value);
    if (Object.keys(rootFields).length > 0) collectionRowsByPath.set("$", [value]);
  } else {
    throw new LocalizedError(uiMessage("JSON must be an object or an array of objects."));
  }

  if (collectionRowsByPath.size === 0) {
    throw new LocalizedError(
      uiMessage("JSON does not contain an object row or an object collection."),
    );
  }

  const collections = [...collectionRowsByPath].map(([path, rows]) =>
    createCollection(path, path, rows),
  );
  return { collections };
};

const isWorkspaceStateLike = (value: unknown) =>
  isRecord(value) &&
  typeof value.kind === "string" &&
  "employees" in value &&
  "views" in value &&
  value.kind.includes("state");

export const parseEmployeeImportText = (text: string): ParsedEmployeeImportSource => {
  let value: unknown;
  try {
    value = JSON.parse(text.replace(/^\uFEFF/, ""));
  } catch {
    throw new LocalizedError(uiMessage("JSON could not be parsed."));
  }

  if (isRecord(value) && value.kind === "org-tools-state") {
    return { kind: "state", state: parseOrgToolsState(value) };
  }
  if (isWorkspaceStateLike(value)) {
    throw new LocalizedError(
      uiMessage(
        'Unsupported workspace state. Open a current document with kind "org-tools-state".',
      ),
    );
  }

  return { document: parseJsonEmployeeImport(value), kind: "tabular" };
};

const normalizeFieldName = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "");

const getLeafFieldName = (value: string) => {
  const segments = value.split(".");
  return segments.at(-1) ?? value;
};

export const createEmployeeImportAutoMapping = (
  sourceFields: readonly string[],
): EmployeeFieldMapping => {
  const mapping = { ...EMPTY_MAPPING };
  const usedFields = new Set<string>();

  for (const target of EMPLOYEE_IMPORT_TARGETS) {
    const aliases = EMPLOYEE_IMPORT_TARGET_DEFINITIONS[target].aliases;
    const scoredFields = sourceFields
      .filter((field) => !usedFields.has(field))
      .map((field, index) => {
        const normalizedField = normalizeFieldName(field);
        const normalizedLeaf = normalizeFieldName(getLeafFieldName(field));
        const exactAliasIndex = aliases.indexOf(normalizedField);
        const leafAliasIndex = aliases.indexOf(normalizedLeaf);
        const score =
          exactAliasIndex >= 0
            ? 1_000 - exactAliasIndex
            : leafAliasIndex >= 0
              ? 500 - leafAliasIndex
              : -1;
        return { field, index, score };
      })
      .filter(({ score }) => score >= 0)
      .sort((first, second) => second.score - first.score || first.index - second.index);
    const match = scoredFields[0]?.field ?? null;
    if (match) {
      mapping[target] = match;
      usedFields.add(match);
    }
  }

  return mapping;
};

export const createEmptyEmployeeImportMapping = (): EmployeeFieldMapping => ({ ...EMPTY_MAPPING });

const isEmptySourceValue = (value: unknown) =>
  value === null ||
  value === undefined ||
  (typeof value === "string" && value.trim().length === 0) ||
  (Array.isArray(value) && value.length === 0);

const sourceValueToText = (
  value: unknown,
  target: EmployeeImportTarget,
  errors: string[],
): string | null => {
  if (isEmptySourceValue(value)) return null;
  if (!isScalar(value)) {
    errors.push(`${EMPLOYEE_IMPORT_TARGET_DEFINITIONS[target].label} must be a scalar value.`);
    return null;
  }
  return String(value).trim() || null;
};

const normalizeProfileUrl = (value: string | null, errors: string[]) => {
  try {
    return normalizeSafeProfileUrl(value);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "Profile URL is invalid.");
    return null;
  }
};

const normalizeAvatarBase64Url = (value: string | null, errors: string[]) => {
  try {
    return normalizeSafeAvatarBase64Url(value);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "Embedded avatar is invalid.");
    return null;
  }
};

const isValidMonthDay = (month: number, day: number) => {
  const date = new Date(Date.UTC(2000, month - 1, day));
  return date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

const normalizeBirthday = (value: string | null, errors: string[]) => {
  if (value === null) return null;
  const match = /^(?:\d{4}-)?(\d{1,2})-(\d{1,2})$/.exec(value);
  const month = match?.[1] ? Number.parseInt(match[1], 10) : Number.NaN;
  const day = match?.[2] ? Number.parseInt(match[2], 10) : Number.NaN;
  if (!Number.isInteger(month) || !Number.isInteger(day) || !isValidMonthDay(month, day)) {
    errors.push("Birthday must use MM-DD or YYYY-MM-DD with a valid month and day.");
    return null;
  }
  return `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

const normalizeGender = (value: string | null, errors: string[]) => {
  if (value === null) return "unspecified" as const;
  const normalized = value.toLocaleLowerCase("en-US").replace(/[^a-z0-9]+/g, "");
  if (["female", "f", "woman", "women"].includes(normalized)) return "female" as const;
  if (["male", "m", "man", "men"].includes(normalized)) return "male" as const;
  if (["unspecified", "unknown", "notset", "prefernottoanswer"].includes(normalized)) {
    return "unspecified" as const;
  }
  errors.push("Gender must be Male, Female, or Unspecified.");
  return "unspecified" as const;
};

const normalizeTags = (value: unknown, delimiter: string, errors: string[]) => {
  if (isEmptySourceValue(value)) return [];
  if (Array.isArray(value)) {
    if (!value.every((tag) => tag === null || isScalar(tag))) {
      errors.push("Tags arrays may contain only scalar values.");
      return [];
    }
    return normalizeEmployeeTags(value.filter(isScalar).map(String));
  }
  if (!isScalar(value)) {
    errors.push("Tags must be an array or a delimited scalar value.");
    return [];
  }
  const text = String(value);
  return normalizeEmployeeTags(delimiter.length > 0 ? text.split(delimiter) : [text]);
};

const getMappedValue = (
  values: Readonly<Record<string, unknown>>,
  mapping: EmployeeFieldMapping,
  target: EmployeeImportTarget,
) => {
  const sourceField = mapping[target];
  return sourceField === null ? undefined : values[sourceField];
};

export const normalizeEmployeeImportRows = (
  collection: EmployeeImportCollection,
  mapping: EmployeeFieldMapping,
  tagDelimiter = ",",
): NormalizedEmployeeImportRow[] =>
  collection.rows.map((row) => {
    const mappedValues = EMPLOYEE_IMPORT_TARGETS.map((target) =>
      getMappedValue(row.values, mapping, target),
    );
    if (mappedValues.every(isEmptySourceValue)) {
      return {
        draft: null,
        errors: [],
        rowNumber: row.rowNumber,
        sourceValues: row.values,
        status: "empty" as const,
      };
    }

    const errors: string[] = [];
    const firstName =
      sourceValueToText(getMappedValue(row.values, mapping, "firstName"), "firstName", errors) ??
      "";
    const lastName =
      sourceValueToText(getMappedValue(row.values, mapping, "lastName"), "lastName", errors) ?? "";
    const email = sourceValueToText(getMappedValue(row.values, mapping, "email"), "email", errors);
    const username = sourceValueToText(
      getMappedValue(row.values, mapping, "username"),
      "username",
      errors,
    );
    const phone = sourceValueToText(getMappedValue(row.values, mapping, "phone"), "phone", errors);
    const profileUrl = normalizeProfileUrl(
      sourceValueToText(getMappedValue(row.values, mapping, "profileUrl"), "profileUrl", errors),
      errors,
    );
    const avatarBase64Url = normalizeAvatarBase64Url(
      sourceValueToText(
        getMappedValue(row.values, mapping, "avatarBase64Url"),
        "avatarBase64Url",
        errors,
      ),
      errors,
    );
    const birthday = normalizeBirthday(
      sourceValueToText(getMappedValue(row.values, mapping, "birthday"), "birthday", errors),
      errors,
    );
    const gender = normalizeGender(
      sourceValueToText(getMappedValue(row.values, mapping, "gender"), "gender", errors),
      errors,
    );
    const tags = normalizeTags(getMappedValue(row.values, mapping, "tags"), tagDelimiter, errors);

    if (!firstName && !lastName && !username && !email) {
      errors.push("Map at least one name, username, or email value for this row.");
    }

    return {
      draft: {
        avatarBase64Url,
        birthday,
        email,
        firstName,
        gender,
        lastName,
        phone,
        profileUrl,
        tags,
        username,
      },
      errors,
      rowNumber: row.rowNumber,
      sourceValues: row.values,
      status: errors.length > 0 ? ("invalid" as const) : ("valid" as const),
    };
  });

const normalizeIdentity = (value: string | null) => value?.trim().toLowerCase() || null;

const appendIdentity = <T>(index: Map<string, T[]>, identity: string | null, value: T) => {
  if (identity === null) return;
  const values = index.get(identity) ?? [];
  values.push(value);
  index.set(identity, values);
};

const getConfigurationErrors = (mapping: EmployeeFieldMapping) => {
  const hasIdentityMapping = ["firstName", "lastName", "email", "username"].some(
    (target) => mapping[target as EmployeeImportTarget] !== null,
  );
  return hasIdentityMapping
    ? []
    : ["Map at least one of First name, Last name, Email, or Username before importing."];
};

export const planEmployeeImport = (
  normalizedRows: readonly NormalizedEmployeeImportRow[],
  existingEmployees: readonly ExistingEmployeeIdentity[],
  mapping: EmployeeFieldMapping,
): EmployeeImportPlan => {
  const configurationErrors = getConfigurationErrors(mapping);
  const employeeIdsByUsername = new Map<string, string[]>();
  const employeeIdsByEmail = new Map<string, string[]>();
  for (const employee of existingEmployees) {
    appendIdentity(employeeIdsByUsername, normalizeIdentity(employee.username), employee.id);
    appendIdentity(employeeIdsByEmail, normalizeIdentity(employee.email), employee.id);
  }

  const rows: EmployeeImportPlanRow[] = normalizedRows.map((row) => ({
    ...row,
    errors: [...row.errors],
    status: row.status === "valid" ? "new" : row.status,
  }));

  for (const row of rows) {
    if (row.status !== "new" || row.draft === null) continue;
    const username = normalizeIdentity(row.draft.username);
    const email = normalizeIdentity(row.draft.email);
    const usernameMatches = username ? (employeeIdsByUsername.get(username) ?? []) : [];
    const emailMatches = email ? (employeeIdsByEmail.get(email) ?? []) : [];
    const matchedIds = new Set([...usernameMatches, ...emailMatches]);

    if (usernameMatches.length > 1) {
      row.errors.push("Username matches multiple existing Employees.");
    }
    if (emailMatches.length > 1) {
      row.errors.push("Email matches multiple existing Employees.");
    }
    if (matchedIds.size > 1) {
      row.errors.push("Username and email identify different existing Employees.");
    }
    if (row.errors.length > 0) {
      row.status = "conflict";
    } else if (matchedIds.size === 1) {
      row.status = "duplicate";
    }
  }

  const newRowsByUsername = new Map<string, EmployeeImportPlanRow[]>();
  const newRowsByEmail = new Map<string, EmployeeImportPlanRow[]>();
  for (const row of rows) {
    if (row.status !== "new" || row.draft === null) continue;
    appendIdentity(newRowsByUsername, normalizeIdentity(row.draft.username), row);
    appendIdentity(newRowsByEmail, normalizeIdentity(row.draft.email), row);
  }
  for (const [username, matchingRows] of newRowsByUsername) {
    if (matchingRows.length < 2) continue;
    for (const row of matchingRows) {
      row.status = "conflict";
      row.errors.push(`Username "${username}" appears in multiple import rows.`);
    }
  }
  for (const [email, matchingRows] of newRowsByEmail) {
    if (matchingRows.length < 2) continue;
    for (const row of matchingRows) {
      row.status = "conflict";
      row.errors.push(`Email "${email}" appears in multiple import rows.`);
    }
  }

  const invalidRowCount = rows.filter((row) => row.status === "invalid").length;
  const conflictRowCount = rows.filter((row) => row.status === "conflict").length;
  const canCommit =
    configurationErrors.length === 0 && invalidRowCount === 0 && conflictRowCount === 0;
  const newDrafts = rows.flatMap((row) =>
    row.status === "new" && row.draft !== null ? [row.draft] : [],
  );

  return {
    canCommit,
    configurationErrors,
    conflictRowCount,
    drafts: canCommit ? newDrafts : [],
    duplicateRowCount: rows.filter((row) => row.status === "duplicate").length,
    emptyRowCount: rows.filter((row) => row.status === "empty").length,
    invalidRowCount,
    newEmployeeCount: newDrafts.length,
    rows,
    totalRowCount: rows.length,
  };
};

export const getEmployeeImportSourceExamples = (
  collection: EmployeeImportCollection,
  sourceField: string,
  limit = 3,
) => {
  const examples: string[] = [];
  for (const row of collection.rows) {
    const value = row.values[sourceField];
    if (isEmptySourceValue(value)) continue;
    const formatted = Array.isArray(value)
      ? value
          .filter((item) => item !== null)
          .map(String)
          .join(", ")
      : String(value);
    examples.push(formatted.length > 80 ? `${formatted.slice(0, 77)}...` : formatted);
    if (examples.length >= limit) break;
  }
  return examples;
};
