import type { EditableEmployeeFields } from "@org-tools/types";

import { LocalizedError, uiMessage } from "@/i18n/messages";
import {
  EMPLOYEE_IMPORT_TARGETS,
  type EmployeeFieldMapping,
  type EmployeeImportCollection,
  type ExistingEmployeeIdentity,
  normalizeEmployeeImportRows,
} from "@/lib/employee-import";
import {
  type MappedImportDocument,
  type MappedImportEmployee,
  type MappedImportUnit,
  planMappedImport,
  type StructuredImportPlan,
} from "@/lib/structured-import";

export type GenericImportTarget = "employees" | "teams" | "teamsEmployees";

export const TEAM_IMPORT_TARGETS = [
  "teamName",
  "teamKey",
  "children",
  "employees",
  "employeeKey",
  "position",
  "isBoss",
] as const;

export type TeamImportTarget = (typeof TEAM_IMPORT_TARGETS)[number];
export type TeamFieldMapping = Record<TeamImportTarget, string | null>;

export const TEAM_IMPORT_TARGET_DEFINITIONS: Record<
  TeamImportTarget,
  { aliases: readonly string[]; label: string }
> = {
  children: { aliases: ["children", "subteams", "subunits"], label: "Child Teams" },
  employeeKey: {
    aliases: ["employeekey", "personkey", "memberkey", "employeeid"],
    label: "Employee key",
  },
  employees: { aliases: ["employees", "members", "people"], label: "Employees array" },
  isBoss: { aliases: ["isboss", "boss", "islead", "lead"], label: "Boss flag" },
  position: { aliases: ["position", "role", "jobtitle", "title"], label: "Position" },
  teamKey: {
    aliases: ["teamkey", "unitkey", "teamid", "unitid", "key"],
    label: "Team key",
  },
  teamName: {
    aliases: ["teamname", "unitname", "name", "team", "unit"],
    label: "Team name",
  },
};

const EMPTY_TEAM_MAPPING: TeamFieldMapping = {
  children: null,
  employeeKey: null,
  employees: null,
  isBoss: null,
  position: null,
  teamKey: null,
  teamName: null,
};

const normalizeFieldName = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "");
const leafName = (value: string) => value.split(".").at(-1) ?? value;

export const createEmptyTeamFieldMapping = (): TeamFieldMapping => ({ ...EMPTY_TEAM_MAPPING });

export const createTeamImportAutoMapping = (sourceFields: readonly string[]): TeamFieldMapping => {
  const mapping = createEmptyTeamFieldMapping();
  for (const target of TEAM_IMPORT_TARGETS) {
    const aliases = TEAM_IMPORT_TARGET_DEFINITIONS[target].aliases;
    const match = sourceFields
      .map((field, index) => {
        const normalized = normalizeFieldName(field);
        const leaf = normalizeFieldName(leafName(field));
        const exact = aliases.indexOf(normalized);
        const leafIndex = aliases.indexOf(leaf);
        return {
          field,
          index,
          score: exact >= 0 ? 1_000 - exact : leafIndex >= 0 ? 500 - leafIndex : -1,
        };
      })
      .filter(({ score }) => score >= 0)
      .sort((first, second) => second.score - first.score || first.index - second.index)[0];
    mapping[target] = match?.field ?? null;
  }
  return mapping;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isEmpty = (value: unknown) =>
  value === null || value === undefined || (typeof value === "string" && !value.trim());
const textValue = (value: unknown): string | null => {
  if (isEmpty(value)) return null;
  if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") {
    return null;
  }
  return String(value).trim() || null;
};
const mappedValue = (
  values: Readonly<Record<string, unknown>>,
  mapping: TeamFieldMapping,
  target: TeamImportTarget,
) => {
  const field = mapping[target];
  return field ? values[field] : undefined;
};

const flattenRecord = (
  value: Record<string, unknown>,
  parent = "",
  result: Record<string, unknown> = {},
): Record<string, unknown> => {
  for (const [key, nested] of Object.entries(value)) {
    const path = parent ? `${parent}.${key}` : key;
    if (isRecord(nested)) flattenRecord(nested, path, result);
    else result[path] = nested;
  }
  return result;
};

const employeeMappingOnly = (mapping: EmployeeFieldMapping): EmployeeFieldMapping =>
  Object.fromEntries(
    EMPLOYEE_IMPORT_TARGETS.map((target) => [target, mapping[target]]),
  ) as EmployeeFieldMapping;

const normalizeEmployee = (
  values: Record<string, unknown>,
  mapping: EmployeeFieldMapping,
  tagDelimiter: string,
  rowNumber: number,
): EditableEmployeeFields | null => {
  const hasMappedValue = EMPLOYEE_IMPORT_TARGETS.some((target) => {
    const field = mapping[target];
    return field !== null && !isEmpty(values[field]);
  });
  if (!hasMappedValue) return null;
  const collection: EmployeeImportCollection = {
    id: "$employee",
    label: "Employee",
    rows: [{ rowNumber, values }],
    sourceFields: Object.keys(values),
  };
  const normalized = normalizeEmployeeImportRows(
    collection,
    employeeMappingOnly(mapping),
    tagDelimiter,
  )[0];
  if (!normalized?.draft || normalized.errors.length > 0) {
    throw new LocalizedError(uiMessage("Resolve all mapping, validation, and identity conflicts."));
  }
  return normalized.draft;
};

const parseBoss = (value: unknown): boolean => {
  if (isEmpty(value)) return false;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLocaleLowerCase("en-US");
    if (["1", "true", "yes", "y"].includes(normalized)) return true;
    if (["0", "false", "no", "n"].includes(normalized)) return false;
  }
  throw new LocalizedError(uiMessage("Resolve all mapping, validation, and identity conflicts."));
};

const createEmployeeRegistry = () => {
  const employeeByKey = new Map<string, MappedImportEmployee>();
  const add = (key: string, fields: EditableEmployeeFields) => {
    const candidate: MappedImportEmployee = { ...fields, key };
    const existing = employeeByKey.get(key);
    if (existing && JSON.stringify(existing) !== JSON.stringify(candidate)) {
      throw new LocalizedError(uiMessage("Employee identities are ambiguous or duplicated."));
    }
    employeeByKey.set(key, existing ?? candidate);
  };
  return { add, employeeByKey };
};

const employeeKeyFor = (
  values: Record<string, unknown>,
  mapping: TeamFieldMapping,
  fields: EditableEmployeeFields,
  fallback: string,
) =>
  textValue(mappedValue(values, mapping, "employeeKey")) ??
  fields.username?.trim() ??
  fields.email?.trim() ??
  fallback;

const buildJsonDocument = (
  collection: EmployeeImportCollection,
  employeeMapping: EmployeeFieldMapping,
  teamMapping: TeamFieldMapping,
  target: Exclude<GenericImportTarget, "employees">,
  tagDelimiter: string,
): MappedImportDocument => {
  if (!teamMapping.teamName) {
    throw new LocalizedError(uiMessage("Resolve all mapping, validation, and identity conflicts."));
  }
  const registry = createEmployeeRegistry();
  const seenTeamKeys = new Set<string>();
  let employeeIndex = 0;
  const visit = (
    values: Record<string, unknown>,
    path: string,
    rowNumber: number,
  ): MappedImportUnit => {
    const name = textValue(mappedValue(values, teamMapping, "teamName"));
    if (!name) throw new LocalizedError(uiMessage("Structured import is invalid."));
    const key = textValue(mappedValue(values, teamMapping, "teamKey")) ?? path;
    if (seenTeamKeys.has(key)) {
      throw new LocalizedError(uiMessage("Import key is missing or duplicated: {key}.", { key }));
    }
    seenTeamKeys.add(key);
    const assignments: MappedImportUnit["employees"] = [];
    if (target === "teamsEmployees" && teamMapping.employees) {
      const rawEmployees = mappedValue(values, teamMapping, "employees");
      if (rawEmployees !== undefined && !Array.isArray(rawEmployees)) {
        throw new LocalizedError(uiMessage("Structured import is invalid."));
      }
      for (const rawEmployee of (rawEmployees as unknown[] | undefined) ?? []) {
        if (!isRecord(rawEmployee)) {
          throw new LocalizedError(uiMessage("Structured import is invalid."));
        }
        const employeeValues = flattenRecord(rawEmployee);
        const fields = normalizeEmployee(employeeValues, employeeMapping, tagDelimiter, rowNumber);
        if (!fields) continue;
        const employeeKey = employeeKeyFor(
          employeeValues,
          teamMapping,
          fields,
          `${key}:employee:${employeeIndex++}`,
        );
        registry.add(employeeKey, fields);
        assignments.push({
          employeeKey,
          isBoss: parseBoss(mappedValue(employeeValues, teamMapping, "isBoss")),
          position: textValue(mappedValue(employeeValues, teamMapping, "position")),
        });
      }
    }
    const rawChildren = teamMapping.children
      ? mappedValue(values, teamMapping, "children")
      : undefined;
    if (rawChildren !== undefined && !Array.isArray(rawChildren)) {
      throw new LocalizedError(uiMessage("Structured import is invalid."));
    }
    const children = ((rawChildren as unknown[] | undefined) ?? []).map((rawChild, index) => {
      if (!isRecord(rawChild)) throw new LocalizedError(uiMessage("Structured import is invalid."));
      return visit(flattenRecord(rawChild), `${key}:child:${index}`, rowNumber);
    });
    return { children, employees: assignments, key, name };
  };
  const units = collection.rows.map(({ rowNumber, values }, index) =>
    visit(values, `team:${index + 1}`, rowNumber),
  );
  return { employees: [...registry.employeeByKey.values()], units };
};

export type GenericImportPlan = {
  document: MappedImportDocument;
  preview: StructuredImportPlan;
};

export const buildGenericImportPlan = (
  collection: EmployeeImportCollection,
  employeeMapping: EmployeeFieldMapping,
  teamMapping: TeamFieldMapping,
  target: Exclude<GenericImportTarget, "employees">,
  existingEmployees: readonly ExistingEmployeeIdentity[],
  tagDelimiter = ",",
): GenericImportPlan => {
  const document = buildJsonDocument(
    collection,
    employeeMapping,
    teamMapping,
    target,
    tagDelimiter,
  );
  return { document, preview: planMappedImport(document, existingEmployees) };
};
