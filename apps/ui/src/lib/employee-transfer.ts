import type {
  EditableEmployeeFields,
  EmployeeId,
  EmployeeTag,
  OrganizationEmployee,
  OrgEditorUnit,
  OrgToolsState,
  UnitId,
} from "@org-tools/types";

import { LocalizedError, uiMessage } from "@/i18n/messages";
import { buildOrganizationStructure } from "@/lib/build-organization-structure";
import {
  createUuid,
  isEmployeeGender,
  isUuid,
  normalizeEditableEmployeeFields,
} from "@/lib/employee-data";
import { createEmployeeId, normalizeEmployeeIdentityPart } from "@/lib/employee-id";
import { isValidEmployeeTagDate } from "@/lib/employee-tags";
import { parseOrgToolsState } from "@/lib/org-file";

export const MAX_EMPLOYEE_IMPORT_BYTES = 25 * 1024 * 1024;
export const EMPLOYEE_EXPORT_FILE_NAME = "org-tools-employees.json";

export type EmployeeTransferTeam = {
  id: UnitId;
  isBoss: boolean;
  name: string;
  path: string[];
  position: string | null;
};

export type EmployeeTransferRecord = OrganizationEmployee & {
  teams: EmployeeTransferTeam[];
};

export const EMPLOYEE_IMPORT_FIELDS = [
  "firstName",
  "lastName",
  "email",
  "username",
  "phone",
  "profileUrl",
  "avatarBase64Url",
  "birthday",
  "gender",
  "tags",
  "teams",
] as const;

export type EmployeeImportField = (typeof EMPLOYEE_IMPORT_FIELDS)[number];
export type EmployeeImportMapping = Record<EmployeeImportField, string | null>;
export type EmployeeImportPolicy = "skip" | "teamsOnly" | "update";

export type EmployeeImportSource = {
  fileName: string;
  fileSizeBytes: number;
  paths: string[];
  rows: Record<string, unknown>[];
};

export type EmployeeImportRow = {
  fields: EditableEmployeeFields;
  id: EmployeeId;
  index: number;
  matched: boolean;
  teams: EmployeeTransferTeam[];
};

export type EmployeeImportPreview = {
  mappedFields: Set<Exclude<EmployeeImportField, "teams">>;
  matchedCount: number;
  newCount: number;
  rows: EmployeeImportRow[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const hasExactKeys = (value: Record<string, unknown>, keys: readonly string[]): boolean => {
  const allowed = new Set(keys);
  return (
    keys.every((key) => Object.hasOwn(value, key)) &&
    Object.keys(value).every((key) => allowed.has(key))
  );
};

const getPathValue = (row: Record<string, unknown>, path: string): unknown => {
  let value: unknown = row;
  for (const part of path.split(".")) {
    if (!isRecord(value) || !Object.hasOwn(value, part)) return undefined;
    value = value[part];
  }
  return value;
};

const collectPaths = (
  value: Record<string, unknown>,
  target: Set<string>,
  prefix = "",
  depth = 0,
): void => {
  if (depth > 3) return;
  for (const [key, item] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (Array.isArray(item) || item === null || typeof item !== "object") target.add(path);
    if (isRecord(item)) collectPaths(item, target, path, depth + 1);
  }
};

export const createEmptyEmployeeImportMapping = (): EmployeeImportMapping =>
  Object.fromEntries(EMPLOYEE_IMPORT_FIELDS.map((field) => [field, null])) as EmployeeImportMapping;

const normalizePathName = (value: string): string =>
  value.replace(/[^a-z0-9]/giu, "").toLowerCase();

export const createSuggestedEmployeeImportMapping = (
  paths: readonly string[],
): EmployeeImportMapping => {
  const mapping = createEmptyEmployeeImportMapping();
  const available = new Map(
    paths.map((path) => [normalizePathName(path.split(".").at(-1) ?? path), path]),
  );
  const aliases: Record<EmployeeImportField, string[]> = {
    avatarBase64Url: ["avatarbase64url", "avatar"],
    birthday: ["birthday", "birthdate"],
    email: ["email", "mail"],
    firstName: ["firstname", "givenname", "name"],
    gender: ["gender", "sex"],
    lastName: ["lastname", "surname", "familyname"],
    phone: ["phone", "telephone"],
    profileUrl: ["profileurl", "profile"],
    tags: ["tags"],
    teams: ["teams", "units"],
    username: ["username", "login"],
  };
  for (const field of EMPLOYEE_IMPORT_FIELDS) {
    mapping[field] = aliases[field].map((alias) => available.get(alias)).find(Boolean) ?? null;
  }
  return mapping;
};

export const parseEmployeeImportText = (
  fileName: string,
  text: string,
  fileSizeBytes = new Blob([text]).size,
): EmployeeImportSource => {
  if (fileSizeBytes > MAX_EMPLOYEE_IMPORT_BYTES) {
    throw new LocalizedError(
      uiMessage("The selected file is {size} MiB; the limit is {limit} MiB.", {
        limit: Math.round(MAX_EMPLOYEE_IMPORT_BYTES / 1024 / 1024),
        size: Math.ceil(fileSizeBytes / 1024 / 1024),
      }),
    );
  }
  let input: unknown;
  try {
    input = JSON.parse(text) as unknown;
  } catch {
    throw new LocalizedError(uiMessage("Could not read or parse the selected file."));
  }
  if (!Array.isArray(input) || input.some((row) => !isRecord(row))) {
    throw new LocalizedError(uiMessage("Employee import must be a JSON array of objects."));
  }
  const paths = new Set<string>();
  for (const row of input.slice(0, 100)) collectPaths(row, paths);
  if (input.length > 0 && paths.size === 0) {
    throw new LocalizedError(uiMessage("Employee import does not contain mappable fields."));
  }
  return {
    fileName,
    fileSizeBytes,
    paths: [...paths].sort((first, second) => first.localeCompare(second, "en")),
    rows: input,
  };
};

export const parseEmployeeImportFile = async (file: File): Promise<EmployeeImportSource> => {
  try {
    return parseEmployeeImportText(file.name, await file.text(), file.size);
  } catch (error) {
    if (error instanceof LocalizedError) throw error;
    throw new LocalizedError(uiMessage("Could not read or parse the selected file."));
  }
};

const requireString = (value: unknown): string => {
  if (typeof value !== "string") throw new Error("Expected text.");
  return value;
};

const optionalString = (value: unknown): string | null => {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") throw new Error("Expected optional text.");
  return value;
};

const parseTags = (value: unknown): EmployeeTag[] => {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new Error("Expected a tag array.");
  const tags: EmployeeTag[] = [];
  for (const item of value) {
    if (
      !isRecord(item) ||
      !hasExactKeys(item, ["date", "label"]) ||
      typeof item.label !== "string" ||
      !(item.date === null || (typeof item.date === "string" && isValidEmployeeTagDate(item.date)))
    ) {
      throw new Error("Expected current tag objects.");
    }
    tags.push({ date: item.date, label: item.label });
  }
  return tags;
};

const parseTeams = (value: unknown): EmployeeTransferTeam[] => {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new Error("Expected a Team array.");
  return value.map((item) => {
    if (
      !isRecord(item) ||
      !hasExactKeys(item, ["id", "isBoss", "name", "path", "position"]) ||
      !isUuid(item.id) ||
      typeof item.isBoss !== "boolean" ||
      typeof item.name !== "string" ||
      !item.name.trim() ||
      !Array.isArray(item.path) ||
      item.path.length === 0 ||
      !item.path.every((part) => typeof part === "string" && part.trim()) ||
      !(item.position === null || typeof item.position === "string")
    ) {
      throw new Error("Expected current Team assignment objects.");
    }
    return {
      id: item.id,
      isBoss: item.isBoss,
      name: item.name.trim(),
      path: item.path.map((part) => (part as string).trim()),
      position: item.position?.trim() || null,
    };
  });
};

export const deriveEmployeeImportPreview = (
  source: EmployeeImportSource,
  mapping: EmployeeImportMapping,
  currentEmployees: readonly OrganizationEmployee[],
): EmployeeImportPreview => {
  if (!mapping.firstName || !mapping.lastName || !mapping.email) {
    throw new LocalizedError(uiMessage("Map first name, last name, and email before continuing."));
  }
  const currentIds = new Set(currentEmployees.map((employee) => employee.id));
  const seenIds = new Set<EmployeeId>();
  const mappedFields = new Set<Exclude<EmployeeImportField, "teams">>(
    EMPLOYEE_IMPORT_FIELDS.filter(
      (field): field is Exclude<EmployeeImportField, "teams"> =>
        field !== "teams" && mapping[field] !== null,
    ),
  );
  const rows: EmployeeImportRow[] = [];
  try {
    for (let index = 0; index < source.rows.length; index += 1) {
      const sourceRow = source.rows[index];
      if (!sourceRow) continue;
      const value = (field: EmployeeImportField) => {
        const path = mapping[field];
        return path ? getPathValue(sourceRow, path) : undefined;
      };
      const genderValue = value("gender");
      if (genderValue !== undefined && !isEmployeeGender(genderValue))
        throw new Error("Invalid gender.");
      const fields = normalizeEditableEmployeeFields({
        avatarBase64Url: optionalString(value("avatarBase64Url")),
        birthday: optionalString(value("birthday")),
        email: optionalString(value("email")),
        firstName: requireString(value("firstName")),
        gender: genderValue === undefined ? "unspecified" : genderValue,
        lastName: requireString(value("lastName")),
        phone: optionalString(value("phone")),
        profileUrl: optionalString(value("profileUrl")),
        tags: parseTags(value("tags")),
        username: optionalString(value("username")),
      });
      const id = createEmployeeId(fields);
      if (seenIds.has(id)) {
        throw new LocalizedError(uiMessage("Employee import contains duplicate identities."));
      }
      seenIds.add(id);
      rows.push({
        fields,
        id,
        index,
        matched: currentIds.has(id),
        teams: parseTeams(value("teams")),
      });
    }
  } catch (error) {
    if (error instanceof LocalizedError) throw error;
    throw new LocalizedError(
      uiMessage("Employee row {number} does not match the selected mapping.", {
        number: rows.length + 1,
      }),
    );
  }
  const matchedCount = rows.reduce((count, row) => count + Number(row.matched), 0);
  return { mappedFields, matchedCount, newCount: rows.length - matchedCount, rows };
};

const unitPathKey = (path: readonly string[]): string =>
  path.map(normalizeEmployeeIdentityPart).join("\u001f");

const createUnitPaths = (units: readonly OrgEditorUnit[]) => {
  const unitById = new Map(units.map((unit) => [unit.id, unit]));
  const pathById = new Map<UnitId, string[]>();
  const resolve = (unit: OrgEditorUnit, visiting = new Set<UnitId>()): string[] => {
    const cached = pathById.get(unit.id);
    if (cached) return cached;
    if (visiting.has(unit.id)) throw new Error("Cyclic Unit path.");
    visiting.add(unit.id);
    const path = unit.parentId
      ? [...resolve(unitById.get(unit.parentId) as OrgEditorUnit, visiting), unit.name]
      : [unit.name];
    pathById.set(unit.id, path);
    return path;
  };
  for (const unit of units) resolve(unit);
  return pathById;
};

export const createEmployeeExport = (state: OrgToolsState): EmployeeTransferRecord[] => {
  const current = parseOrgToolsState(structuredClone(state));
  const structure = buildOrganizationStructure(current.organization.employees, {
    ...current.organization.structure,
    selectedItems: current.ui.editor.selectedItems,
    viewport: current.ui.editor.viewport,
  });
  return current.organization.employees.map((employee) => ({
    ...structuredClone(employee),
    teams: (structure.indexes.employeesById.get(employee.id)?.unitPositions ?? []).map(
      (position) => ({
        id: position.unitId,
        isBoss: position.isBoss,
        name: position.unitName,
        path: [...position.unitPath.names],
        position: position.position,
      }),
    ),
  }));
};

const cloneUnit = (unit: OrgEditorUnit): OrgEditorUnit => ({
  ...unit,
  employeeIds: [...unit.employeeIds],
  employeePositions: unit.employeePositions.map((position) => ({ ...position })),
  liveFilter: unit.liveFilter ? structuredClone(unit.liveFilter) : null,
});

export const applyEmployeeImport = ({
  bulkPolicy,
  currentState,
  importTeams,
  overrides,
  preview,
}: {
  bulkPolicy: EmployeeImportPolicy;
  currentState: OrgToolsState;
  importTeams: boolean;
  overrides: ReadonlyMap<EmployeeId, EmployeeImportPolicy>;
  preview: EmployeeImportPreview;
}): OrgToolsState => {
  const state = parseOrgToolsState(structuredClone(currentState));
  const now = new Date().toISOString();
  const employeeById = new Map(
    state.organization.employees.map((employee) => [employee.id, employee]),
  );
  const appliedPolicyById = new Map<EmployeeId, EmployeeImportPolicy>();
  for (const row of preview.rows) {
    const existing = employeeById.get(row.id);
    const policy = existing ? (overrides.get(row.id) ?? bulkPolicy) : "update";
    appliedPolicyById.set(row.id, policy);
    if (existing && policy === "skip") continue;
    if (!existing) {
      employeeById.set(row.id, {
        ...structuredClone(row.fields),
        createdAt: now,
        id: row.id,
        updatedAt: now,
      });
      continue;
    }
    if (policy === "teamsOnly") continue;
    const next = { ...existing, updatedAt: now };
    for (const field of preview.mappedFields) {
      Object.assign(next, { [field]: structuredClone(row.fields[field]) });
    }
    employeeById.set(row.id, next);
  }

  const units = state.organization.structure.units.map(cloneUnit);
  if (importTeams) {
    const unitById = new Map(units.map((unit) => [unit.id, unit]));
    const pathById = createUnitPaths(units);
    const idByPath = new Map<string, UnitId>();
    for (const [unitId, path] of pathById) {
      const key = unitPathKey(path);
      if (idByPath.has(key))
        throw new LocalizedError(uiMessage("Team paths must be unique before import."));
      idByPath.set(key, unitId);
    }
    const resolveTeam = (team: EmployeeTransferTeam): OrgEditorUnit => {
      const direct = unitById.get(team.id);
      if (direct) return direct;
      const matchedId = idByPath.get(unitPathKey(team.path));
      if (matchedId) return unitById.get(matchedId) as OrgEditorUnit;
      let parentId: UnitId | null = null;
      const currentPath: string[] = [];
      let resolved: OrgEditorUnit | null = null;
      for (const part of team.path) {
        currentPath.push(part);
        const key = unitPathKey(currentPath);
        const existingId = idByPath.get(key);
        if (existingId) {
          parentId = existingId;
          resolved = unitById.get(existingId) ?? null;
          continue;
        }
        const id = createUuid();
        resolved = {
          bossEmployeeId: null,
          collapsed: false,
          createdAt: now,
          employeeIds: [],
          employeePositions: [],
          id,
          liveFilter: null,
          name: part,
          order: units.length,
          parentId,
          updatedAt: now,
          x: (units.length % 10) * 360,
          y: Math.floor(units.length / 10) * 240,
        };
        units.push(resolved);
        unitById.set(id, resolved);
        idByPath.set(key, id);
        parentId = id;
      }
      if (!resolved) throw new LocalizedError(uiMessage("Team assignment has an empty path."));
      return resolved;
    };

    for (const row of preview.rows) {
      if (appliedPolicyById.get(row.id) === "skip") continue;
      for (const team of row.teams) {
        const unit = resolveTeam(team);
        if (unit.liveFilter)
          throw new LocalizedError(
            uiMessage("Employees cannot be assigned directly to a dynamic Team."),
          );
        if (!unit.employeeIds.includes(row.id)) unit.employeeIds.push(row.id);
        const positionIndex = unit.employeePositions.findIndex(
          (item) => item.employeeId === row.id,
        );
        const position = { employeeId: row.id, position: team.position };
        if (positionIndex < 0) unit.employeePositions.push(position);
        else unit.employeePositions[positionIndex] = position;
        if (team.isBoss) unit.bossEmployeeId = row.id;
        else if (unit.bossEmployeeId === row.id) unit.bossEmployeeId = null;
        unit.updatedAt = now;
      }
    }
  }

  state.organization.employees = [...employeeById.values()];
  state.organization.structure.units = units;
  return parseOrgToolsState(state);
};
