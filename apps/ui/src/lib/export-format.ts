import type {
  CustomEmployeeFieldDefinition,
  Employee,
  EmployeeFieldId,
  EmployeeId,
  UnitId,
} from "@org-tools/types";

import { evaluateCustomEmployeeFields } from "@/lib/custom-employee-fields";
import type { EmployeeUnitContext } from "@/lib/employee-unit-contexts";
import { getEmployeeOrgUnitContexts, getTopOrgUnitContext } from "@/lib/employee-unit-contexts";
import { normalizeSearchValue } from "@/lib/search-index";
import {
  formatTemplateTextValue,
  renderTemplateFormat,
  type TemplateFieldValue,
} from "@/lib/template-format";
import {
  exportEmployeeFieldKeys,
  exportFieldKeys,
  exportJsonEmployeeFieldKeys,
  exportJsonTagFieldKeys,
  exportJsonUnitFieldKeys,
  exportUnitFieldKeys,
} from "@/stores/export-session-store";
import type {
  ExportEmployeeFieldKey,
  ExportFieldKey,
  ExportJsonEmployeeFieldKey,
  ExportJsonFieldNames,
  ExportJsonTagFieldKey,
  ExportJsonTopLevelFieldKey,
  ExportJsonUnitFieldKey,
  ExportRowMode,
  ExportTabMode,
  ExportUnitFieldKey,
} from "@/stores/org-store";

type ExportRowContext = "employeeFallback" | "unit";
export const EXPORT_UNIT_PATH_SEPARATOR = " / ";

export type ExportRow = {
  context: ExportRowContext;
  employee: Employee;
  unitContext: EmployeeUnitContext | null;
};

export const EXPORT_PREVIEW_MAX_RECORDS = 50;
export const EXPORT_PREVIEW_MAX_BYTES = 128 * 1024;

export const exportFields: Array<{ key: ExportFieldKey; label: string }> = exportFieldKeys.map(
  (fieldKey) => ({ key: fieldKey, label: fieldKey }),
);
export const exportEmployeeFields: Array<{ key: ExportEmployeeFieldKey; label: string }> =
  exportEmployeeFieldKeys.map((fieldKey) => ({ key: fieldKey, label: fieldKey }));
export const exportJsonEmployeeFields: Array<{ key: ExportJsonEmployeeFieldKey; label: string }> =
  exportJsonEmployeeFieldKeys.map((fieldKey) => ({ key: fieldKey, label: fieldKey }));
export const exportUnitFields: Array<{ key: ExportUnitFieldKey; label: string }> =
  exportUnitFieldKeys.map((fieldKey) => ({ key: fieldKey, label: fieldKey }));
export const exportJsonUnitFields: Array<{ key: ExportJsonUnitFieldKey; label: string }> =
  exportJsonUnitFieldKeys.map((fieldKey) => ({ key: fieldKey, label: fieldKey }));
export const exportJsonTagFields: Array<{ key: ExportJsonTagFieldKey; label: string }> =
  exportJsonTagFieldKeys.map((fieldKey) => ({ key: fieldKey, label: fieldKey }));
export const exportFieldByKey = new Map(exportFields.map((field) => [field.key, field]));
export const exportEmployeeFieldByKey = new Map(
  exportEmployeeFields.map((field) => [field.key, field]),
);
export const exportJsonEmployeeFieldByKey = new Map(
  exportJsonEmployeeFields.map((field) => [field.key, field]),
);
export const exportUnitFieldByKey = new Map(exportUnitFields.map((field) => [field.key, field]));
export const exportJsonUnitFieldByKey = new Map(
  exportJsonUnitFields.map((field) => [field.key, field]),
);
export const exportJsonTagFieldByKey = new Map(
  exportJsonTagFields.map((field) => [field.key, field]),
);

export type ExportFieldNameError =
  | { fieldKey: string; group: "employee" | "tag" | "topLevel" | "unit"; kind: "missing" }
  | {
      fieldKey: string;
      fieldName: string;
      group: "employee" | "tag" | "topLevel" | "unit";
      kind: "duplicate";
      previousFieldKey: string;
    };

export type ExportFieldNameValidation = {
  errors: ExportFieldNameError[];
  isValid: boolean;
};

export const exportRowModeOptions: Array<{
  description: string;
  title: string;
  value: ExportRowMode;
}> = [
  {
    description: "Creates one record for every Unit assigned to an Employee.",
    title: "All Employee Units",
    value: "allUnits",
  },
  {
    description: "Creates one record per Employee using the highest Unit in the tree.",
    title: "First Unit",
    value: "firstUnit",
  },
];

export const uniqueByEmployeeId = (employees: Employee[]) => {
  const employeesById = new Map<EmployeeId, Employee>();
  for (const employee of employees) {
    if (!employeesById.has(employee.id)) employeesById.set(employee.id, employee);
  }
  return [...employeesById.values()];
};

export const asExportText = formatTemplateTextValue;

const validateNameGroup = (
  entries: Array<{ fieldKey: string; fieldName: string }>,
  group: ExportFieldNameError["group"],
) => {
  const errors: ExportFieldNameError[] = [];
  const seen = new Map<string, string>();
  for (const entry of entries) {
    const name = entry.fieldName.trim();
    if (!name) {
      errors.push({ fieldKey: entry.fieldKey, group, kind: "missing" });
      continue;
    }
    const previousFieldKey = seen.get(name);
    if (previousFieldKey) {
      errors.push({
        fieldKey: entry.fieldKey,
        fieldName: name,
        group,
        kind: "duplicate",
        previousFieldKey,
      });
    } else {
      seen.set(name, entry.fieldKey);
    }
  }
  return errors;
};

export const validateExportFieldNames = ({
  customEmployeeFieldDefinitions = [],
  jsonFieldNames,
  selectedCustomEmployeeFieldIds = [],
  selectedEmployeeFieldKeys,
  selectedJsonTagFieldKeys,
  selectedJsonUnitFieldKeys,
  tabMode,
}: {
  customEmployeeFieldDefinitions?: readonly CustomEmployeeFieldDefinition[];
  jsonFieldNames: ExportJsonFieldNames;
  selectedCustomEmployeeFieldIds?: readonly EmployeeFieldId[];
  selectedEmployeeFieldKeys: ExportJsonEmployeeFieldKey[];
  selectedJsonTagFieldKeys: ExportJsonTagFieldKey[];
  selectedJsonUnitFieldKeys: ExportJsonUnitFieldKey[];
  tabMode: ExportTabMode;
}): ExportFieldNameValidation => {
  if (tabMode === "template") return { errors: [], isValid: true };
  const topLevelEntries: Array<{ fieldKey: string; fieldName: string }> =
    selectedEmployeeFieldKeys.map((fieldKey) => ({
      fieldKey,
      fieldName: jsonFieldNames.employee[fieldKey],
    }));
  const definitionById = new Map(customEmployeeFieldDefinitions.map((field) => [field.id, field]));
  for (const fieldId of selectedCustomEmployeeFieldIds) {
    topLevelEntries.push({
      fieldKey: `custom:${fieldId}`,
      fieldName: jsonFieldNames.custom[fieldId] ?? definitionById.get(fieldId)?.key ?? "",
    });
  }
  if (selectedJsonUnitFieldKeys.length > 0) {
    topLevelEntries.push({ fieldKey: "units", fieldName: jsonFieldNames.units.collection });
  }
  if (selectedJsonTagFieldKeys.length > 0) {
    topLevelEntries.push({ fieldKey: "tags", fieldName: jsonFieldNames.tags.collection });
  }
  const errors = [
    ...validateNameGroup(topLevelEntries, "topLevel"),
    ...validateNameGroup(
      selectedJsonUnitFieldKeys.map((fieldKey) => ({
        fieldKey,
        fieldName: jsonFieldNames.units.fields[fieldKey],
      })),
      "unit",
    ),
    ...validateNameGroup(
      selectedJsonTagFieldKeys.map((fieldKey) => ({
        fieldKey,
        fieldName: jsonFieldNames.tags.fields[fieldKey],
      })),
      "tag",
    ),
  ];
  return { errors, isValid: errors.length === 0 };
};

const createUnitRow = (employee: Employee, unitContext: EmployeeUnitContext): ExportRow => ({
  context: "unit",
  employee,
  unitContext,
});

const createEmployeeFallbackRow = (employee: Employee): ExportRow => ({
  context: "employeeFallback",
  employee,
  unitContext: null,
});

export const buildEmployeeExportRows = ({
  employee,
  isDirectlySelected,
  mode,
  unitContexts,
  unitOrderById,
}: {
  employee: Employee;
  isDirectlySelected: boolean;
  mode: ExportRowMode;
  unitContexts: EmployeeUnitContext[];
  unitOrderById: Map<UnitId, number>;
}) => {
  const contexts = getEmployeeOrgUnitContexts(unitContexts);
  if (mode === "allUnits") {
    const rows = contexts.map((context) => createUnitRow(employee, context));
    if (rows.length === 0 && isDirectlySelected) rows.push(createEmployeeFallbackRow(employee));
    return rows;
  }
  const topContext = getTopOrgUnitContext(unitContexts, unitOrderById);
  if (topContext) return [createUnitRow(employee, topContext)];
  return isDirectlySelected ? [createEmployeeFallbackRow(employee)] : [];
};

export const countEmployeeExportRows = ({
  isDirectlySelected,
  mode,
  unitContexts,
  unitOrderById,
}: {
  isDirectlySelected: boolean;
  mode: ExportRowMode;
  unitContexts: EmployeeUnitContext[];
  unitOrderById: Map<UnitId, number>;
}) => {
  if (mode === "allUnits") {
    const count = getEmployeeOrgUnitContexts(unitContexts).length;
    return count === 0 && isDirectlySelected ? 1 : count;
  }
  return getTopOrgUnitContext(unitContexts, unitOrderById) || isDirectlySelected ? 1 : 0;
};

export const getExportEmployeeFieldValue = (
  employee: Employee,
  fieldKey: ExportEmployeeFieldKey,
) => {
  switch (fieldKey) {
    case "id":
      return employee.id;
    case "firstName":
      return employee.firstName;
    case "lastName":
      return employee.lastName;
    case "fullName":
      return employee.fullName;
    case "gender":
      return employee.gender;
    case "username":
      return employee.username;
    case "profileUrl":
      return employee.profileUrl;
    case "email":
      return employee.email;
    case "phone":
      return employee.phone;
    case "avatarBase64Url":
      return employee.avatarBase64Url;
    case "birthday":
      return employee.birthday;
    case "tags":
      return employee.tags.map(({ label }) => label);
    case "tagDates":
      return employee.tags.flatMap(({ date, label }) => (date ? [`${label}=${date}`] : []));
  }
};

const getUnitFieldValue = (row: ExportRow, fieldKey: ExportUnitFieldKey, json: boolean) => {
  const context = row.unitContext;
  if (row.context === "unit" && context) {
    switch (fieldKey) {
      case "unitId":
        return context.unitId;
      case "unitName":
        return context.unitName;
      case "unitFullPath":
        return context.unitPosition.unitPath.names.join(EXPORT_UNIT_PATH_SEPARATOR);
      case "position":
        return json ? (context.position ?? null) : context.position;
      case "isBoss":
        return context.isBoss;
    }
  }
  switch (fieldKey) {
    case "unitId":
      return json ? null : "";
    case "unitName":
    case "unitFullPath":
      return "";
    case "position":
      return json ? null : "";
    case "isBoss":
      return false;
  }
};

const rowsByEmployee = (rows: ExportRow[]) => {
  const result = new Map<EmployeeId, ExportRow[]>();
  for (const row of rows) {
    const current = result.get(row.employee.id);
    if (current) current.push(row);
    else result.set(row.employee.id, [row]);
  }
  return [...result.values()];
};

export type StructuredJsonExportOptions = {
  customEmployeeFieldDefinitions?: readonly CustomEmployeeFieldDefinition[];
  excludedJsonTagKeys: readonly string[];
  excludedJsonUnitIds: readonly UnitId[];
  jsonFieldNames: ExportJsonFieldNames;
  jsonTopLevelFieldOrder: readonly ExportJsonTopLevelFieldKey[];
  selectedEmployeeFieldKeys: readonly ExportJsonEmployeeFieldKey[];
  selectedCustomEmployeeFieldIds?: readonly EmployeeFieldId[];
  selectedJsonTagFieldKeys: readonly ExportJsonTagFieldKey[];
  selectedJsonUnitFieldKeys: readonly ExportJsonUnitFieldKey[];
};

export const createStructuredJsonRecords = (
  rows: ExportRow[],
  options: StructuredJsonExportOptions,
) => {
  const excludedUnitIds = new Set(options.excludedJsonUnitIds);
  const excludedTagKeys = new Set(options.excludedJsonTagKeys);
  return rowsByEmployee(rows).map((employeeRows) => {
    const firstRow = employeeRows[0];
    if (!firstRow) return {};
    const employee = firstRow.employee;
    const selectedEmployeeFields = new Set(options.selectedEmployeeFieldKeys);
    const selectedCustomFields = new Set(options.selectedCustomEmployeeFieldIds ?? []);
    const customValues = evaluateCustomEmployeeFields(
      employee,
      options.customEmployeeFieldDefinitions ?? [],
    );
    const entries: Array<[string, unknown]> = [];
    for (const fieldKey of options.jsonTopLevelFieldOrder) {
      if (fieldKey === "units") {
        if (options.selectedJsonUnitFieldKeys.length === 0) continue;
        entries.push([
          options.jsonFieldNames.units.collection.trim(),
          employeeRows.flatMap((row) => {
            if (!row.unitContext || excludedUnitIds.has(row.unitContext.unitId)) return [];
            return [
              Object.fromEntries(
                options.selectedJsonUnitFieldKeys.map((unitFieldKey) => [
                  options.jsonFieldNames.units.fields[unitFieldKey].trim(),
                  getUnitFieldValue(row, unitFieldKey, true),
                ]),
              ),
            ];
          }),
        ]);
        continue;
      }
      if (fieldKey === "tags") {
        if (options.selectedJsonTagFieldKeys.length === 0) continue;
        entries.push([
          options.jsonFieldNames.tags.collection.trim(),
          employee.tags.flatMap((tag) => {
            if (excludedTagKeys.has(normalizeSearchValue(tag.label))) return [];
            return [
              Object.fromEntries(
                options.selectedJsonTagFieldKeys.map((tagFieldKey) => [
                  options.jsonFieldNames.tags.fields[tagFieldKey].trim(),
                  tag[tagFieldKey],
                ]),
              ),
            ];
          }),
        ]);
        continue;
      }
      if (fieldKey.startsWith("custom:")) {
        const fieldId = fieldKey.slice(7) as EmployeeFieldId;
        if (!selectedCustomFields.has(fieldId)) continue;
        const fieldName = options.jsonFieldNames.custom[fieldId]?.trim();
        if (fieldName) entries.push([fieldName, customValues.get(fieldId) ?? null]);
        continue;
      }
      const employeeFieldKey = fieldKey as ExportJsonEmployeeFieldKey;
      if (!selectedEmployeeFields.has(employeeFieldKey)) continue;
      entries.push([
        options.jsonFieldNames.employee[employeeFieldKey].trim(),
        getExportEmployeeFieldValue(employee, employeeFieldKey),
      ]);
    }
    return Object.fromEntries(entries);
  });
};

const createTemplateRowText = (
  row: ExportRow,
  templateFormat: string,
  customEmployeeFieldDefinitions: readonly CustomEmployeeFieldDefinition[],
) => {
  const customValues = evaluateCustomEmployeeFields(row.employee, customEmployeeFieldDefinitions);
  const customDefinitionByKey = new Map(
    customEmployeeFieldDefinitions.map((definition) => [definition.key, definition]),
  );
  return renderTemplateFormat({
    formatValue: asExportText,
    resolveField: (fieldName): TemplateFieldValue => {
      const customDefinition = customDefinitionByKey.get(fieldName);
      if (customDefinition) {
        return { known: true, value: customValues.get(customDefinition.id) ?? null };
      }
      if (!exportFieldByKey.has(fieldName as ExportFieldKey)) return { known: false };
      if (exportEmployeeFieldByKey.has(fieldName as ExportEmployeeFieldKey)) {
        return {
          known: true,
          value: getExportEmployeeFieldValue(row.employee, fieldName as ExportEmployeeFieldKey),
        };
      }
      return {
        known: true,
        value: getUnitFieldValue(row, fieldName as ExportUnitFieldKey, false),
      };
    },
    template: templateFormat,
  });
};

export const filterTemplateEmptyLines = (text: string, removeEmptyLines: boolean) => {
  if (!removeEmptyLines) return text;
  return text
    .split(/\r\n?|\n/u)
    .filter((line) => line.trim().length > 0)
    .join("\n");
};

const countTemplateLineFragments = (fragments: Iterable<string>, removeEmptyLines: boolean) => {
  let count = 0;
  let hasCharacters = false;
  let hasNonWhitespace = false;
  let previousWasCarriageReturn = false;
  const finishLine = () => {
    if (!removeEmptyLines || hasNonWhitespace) count += 1;
    hasCharacters = false;
    hasNonWhitespace = false;
  };

  for (const fragment of fragments) {
    for (const character of fragment) {
      if (previousWasCarriageReturn) {
        previousWasCarriageReturn = false;
        if (character === "\n") continue;
      }
      if (character === "\r") {
        finishLine();
        previousWasCarriageReturn = true;
        continue;
      }
      if (character === "\n") {
        finishLine();
        continue;
      }
      hasCharacters = true;
      if (!/\s/u.test(character)) hasNonWhitespace = true;
    }
  }
  if (hasCharacters) finishLine();
  return count;
};

export const countTemplateOutputLines = (
  rows: Iterable<ExportRow>,
  templateFormat: string,
  customEmployeeFieldDefinitions: readonly CustomEmployeeFieldDefinition[] = [],
  removeEmptyLines = false,
) =>
  countTemplateLineFragments(
    (function* renderRows() {
      for (const row of rows) {
        yield createTemplateRowText(row, templateFormat, customEmployeeFieldDefinitions);
      }
    })(),
    removeEmptyLines,
  );

export const createTemplateText = (
  rows: ExportRow[],
  templateFormat: string,
  customEmployeeFieldDefinitions: readonly CustomEmployeeFieldDefinition[] = [],
  removeEmptyLines = false,
) =>
  filterTemplateEmptyLines(
    rows
      .map((row) => createTemplateRowText(row, templateFormat, customEmployeeFieldDefinitions))
      .join(""),
    removeEmptyLines,
  );

export const createExportText = ({
  rows,
  tabMode,
  templateFormat,
  removeEmptyLines = false,
  ...jsonOptions
}: StructuredJsonExportOptions & {
  rows: ExportRow[];
  tabMode: ExportTabMode;
  templateFormat: string;
  removeEmptyLines?: boolean;
}) =>
  tabMode === "json"
    ? JSON.stringify(createStructuredJsonRecords(rows, jsonOptions), null, 2)
    : createTemplateText(
        rows,
        templateFormat,
        jsonOptions.customEmployeeFieldDefinitions,
        removeEmptyLines,
      );

const yieldForExportWork = () =>
  new Promise<void>((resolve) => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => resolve());
      return;
    }
    setTimeout(resolve, 0);
  });

export const createExportTextAsync = async ({
  rows,
  tabMode,
  templateFormat,
  removeEmptyLines = false,
  ...jsonOptions
}: StructuredJsonExportOptions & {
  rows: ExportRow[];
  tabMode: ExportTabMode;
  templateFormat: string;
  removeEmptyLines?: boolean;
}) => {
  const batchSize = 500;
  if (tabMode === "json") {
    const groups = rowsByEmployee(rows);
    const records: Array<Record<string, unknown>> = [];
    for (let index = 0; index < groups.length; index += batchSize) {
      records.push(
        ...createStructuredJsonRecords(groups.slice(index, index + batchSize).flat(), jsonOptions),
      );
      if (index + batchSize < groups.length) await yieldForExportWork();
    }
    return JSON.stringify(records, null, 2);
  }

  const parts: string[] = [];
  for (let index = 0; index < rows.length; index += batchSize) {
    parts.push(
      createTemplateText(
        rows.slice(index, index + batchSize),
        templateFormat,
        jsonOptions.customEmployeeFieldDefinitions,
        false,
      ),
    );
    if (index + batchSize < rows.length) await yieldForExportWork();
  }
  return filterTemplateEmptyLines(parts.join(""), removeEmptyLines);
};

const truncateUtf8 = (text: string, maxBytes: number) => {
  if (new Blob([text]).size <= maxBytes) return { text, truncated: false };
  let low = 0;
  let high = text.length;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (new Blob([text.slice(0, middle)]).size <= maxBytes) low = middle;
    else high = middle - 1;
  }
  return { text: `${text.slice(0, low).trimEnd()}\n…`, truncated: true };
};

export const createExportPreview = ({
  rows,
  tabMode,
  templateFormat,
  removeEmptyLines = false,
  ...jsonOptions
}: StructuredJsonExportOptions & {
  rows: ExportRow[];
  tabMode: ExportTabMode;
  templateFormat: string;
  removeEmptyLines?: boolean;
}) => {
  const groupedRows = tabMode === "json" ? rowsByEmployee(rows) : null;
  const limitedRows = groupedRows
    ? groupedRows.slice(0, EXPORT_PREVIEW_MAX_RECORDS).flat()
    : rows.slice(0, EXPORT_PREVIEW_MAX_RECORDS);
  const fullCount = groupedRows
    ? groupedRows.length
    : countTemplateOutputLines(
        rows,
        templateFormat,
        jsonOptions.customEmployeeFieldDefinitions,
        removeEmptyLines,
      );
  const shownCount = groupedRows
    ? rowsByEmployee(limitedRows).length
    : countTemplateOutputLines(
        limitedRows,
        templateFormat,
        jsonOptions.customEmployeeFieldDefinitions,
        removeEmptyLines,
      );
  const text = createExportText({
    ...jsonOptions,
    removeEmptyLines,
    rows: limitedRows,
    tabMode,
    templateFormat,
  });
  const bounded = truncateUtf8(text, EXPORT_PREVIEW_MAX_BYTES);
  return {
    fullCount,
    shownCount,
    text: bounded.text,
    truncated:
      bounded.truncated ||
      (groupedRows ? groupedRows.length : rows.length) > EXPORT_PREVIEW_MAX_RECORDS,
  };
};
