import type { Employee, EmployeeId, UnitId } from "@org-tools/types";
import { unparse } from "papaparse";

import type { EmployeeOrgUnitContext, EmployeeUnitContext } from "@/lib/employee-unit-contexts";
import { getEmployeeOrgUnitContexts, getTopOrgUnitContext } from "@/lib/employee-unit-contexts";
import {
  formatTemplateTextValue,
  renderTemplateFormat,
  type TemplateFieldValue,
} from "@/lib/template-format";
import {
  exportEmployeeFieldKeys,
  exportFieldKeys,
  exportJsonUnitFieldKeys,
  exportUnitFieldKeys,
} from "@/stores/export-session-store";
import type {
  ExportEmployeeFieldKey,
  ExportFieldKey,
  ExportFieldNameMap,
  ExportJsonUnitFieldKey,
  ExportRowMode,
  ExportTabMode,
  ExportUnitFieldKey,
} from "@/stores/org-store";

type ExportRowContext = "employeeFallback" | "unit";

export type ExportRow = {
  context: ExportRowContext;
  employee: Employee;
  unitContext: EmployeeUnitContext | null;
};

export const exportFields: Array<{ key: ExportFieldKey; label: string }> = exportFieldKeys.map(
  (fieldKey) => ({ key: fieldKey, label: fieldKey }),
);
export const exportEmployeeFields: Array<{ key: ExportEmployeeFieldKey; label: string }> =
  exportEmployeeFieldKeys.map((fieldKey) => ({ key: fieldKey, label: fieldKey }));
export const exportUnitFields: Array<{ key: ExportUnitFieldKey; label: string }> =
  exportUnitFieldKeys.map((fieldKey) => ({ key: fieldKey, label: fieldKey }));
export const exportJsonUnitFields: Array<{ key: ExportJsonUnitFieldKey; label: string }> =
  exportJsonUnitFieldKeys.map((fieldKey) => ({ key: fieldKey, label: fieldKey }));
export const exportFieldByKey = new Map(exportFields.map((field) => [field.key, field]));
export const exportEmployeeFieldByKey = new Map(
  exportEmployeeFields.map((field) => [field.key, field]),
);
export const exportUnitFieldByKey = new Map(exportUnitFields.map((field) => [field.key, field]));
export const exportJsonUnitFieldByKey = new Map(
  exportJsonUnitFields.map((field) => [field.key, field]),
);

export type ExportFieldNameError =
  | { fieldKey: ExportFieldKey; group: "csv" | "employee" | "unit"; kind: "missing" }
  | { fieldName: string; group: "csv" | "employee" | "unit"; kind: "reserved" }
  | {
      fieldKey: ExportFieldKey;
      fieldName: string;
      group: "csv" | "employee" | "unit";
      kind: "duplicate";
      previousFieldKey: ExportFieldKey;
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
    if (!employeesById.has(employee.id)) {
      employeesById.set(employee.id, employee);
    }
  }

  return [...employeesById.values()];
};

export const asExportText = formatTemplateTextValue;

const getExportFieldOutputName = (fieldNames: ExportFieldNameMap, fieldKey: ExportFieldKey) => {
  const fieldName = fieldNames[fieldKey]?.trim();

  return fieldName || fieldKey;
};

const validateExportFieldNameGroup = <FieldKey extends ExportFieldKey>({
  fieldKeys,
  fieldNames,
  reservedNames = [],
  group,
}: {
  fieldKeys: FieldKey[];
  fieldNames: ExportFieldNameMap;
  group: ExportFieldNameError["group"];
  reservedNames?: string[];
}) => {
  const errors: ExportFieldNameError[] = [];
  const seenFieldNames = new Map<string, FieldKey>();
  const reservedFieldNames = new Set(reservedNames);

  for (const fieldKey of fieldKeys) {
    const rawFieldName = fieldNames[fieldKey] ?? fieldKey;
    const fieldName = rawFieldName.trim();

    if (!fieldName) {
      errors.push({ fieldKey, group, kind: "missing" });
      continue;
    }

    if (reservedFieldNames.has(fieldName)) {
      errors.push({ fieldName, group, kind: "reserved" });
    }

    const previousFieldKey = seenFieldNames.get(fieldName);

    if (previousFieldKey) {
      errors.push({
        fieldKey,
        fieldName,
        group,
        kind: "duplicate",
        previousFieldKey,
      });
      continue;
    }

    seenFieldNames.set(fieldName, fieldKey);
  }

  return errors;
};

export const validateExportFieldNames = ({
  fieldNames,
  selectedEmployeeFieldKeys,
  selectedFlatUnitFieldKeys,
  selectedJsonUnitFieldKeys,
  tabMode,
}: {
  fieldNames: ExportFieldNameMap;
  selectedEmployeeFieldKeys: ExportEmployeeFieldKey[];
  selectedFlatUnitFieldKeys: ExportUnitFieldKey[];
  selectedJsonUnitFieldKeys: ExportJsonUnitFieldKey[];
  tabMode: ExportTabMode;
}): ExportFieldNameValidation => {
  if (tabMode === "template") {
    return { errors: [], isValid: true };
  }

  const errors =
    tabMode === "json"
      ? [
          ...validateExportFieldNameGroup({
            fieldKeys: selectedEmployeeFieldKeys,
            fieldNames,
            reservedNames: ["units"],
            group: "employee",
          }),
          ...validateExportFieldNameGroup({
            fieldKeys: selectedJsonUnitFieldKeys,
            fieldNames,
            group: "unit",
          }),
        ]
      : [
          ...validateExportFieldNameGroup({
            fieldKeys: [...selectedEmployeeFieldKeys, ...selectedFlatUnitFieldKeys],
            fieldNames,
            group: "csv",
          }),
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

const createUnitRows = (employee: Employee, unitContexts: EmployeeUnitContext[]) =>
  getEmployeeOrgUnitContexts(unitContexts).map((unitContext) =>
    createUnitRow(employee, unitContext),
  );

const createOrgRow = (employee: Employee, unitContext: EmployeeOrgUnitContext): ExportRow => ({
  context: "unit",
  employee,
  unitContext,
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
  const topOrgContext = getTopOrgUnitContext(unitContexts, unitOrderById);

  if (mode === "allUnits") {
    const rows = createUnitRows(employee, unitContexts);

    if (rows.length === 0 && isDirectlySelected) {
      rows.push(createEmployeeFallbackRow(employee));
    }

    return rows;
  }

  if (mode === "firstUnit") {
    if (topOrgContext) return [createOrgRow(employee, topOrgContext)];
    return isDirectlySelected ? [createEmployeeFallbackRow(employee)] : [];
  }

  return [createEmployeeFallbackRow(employee)];
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
  const topOrgContext = getTopOrgUnitContext(unitContexts, unitOrderById);
  const orgContextCount = getEmployeeOrgUnitContexts(unitContexts).length;

  if (mode === "allUnits") {
    return orgContextCount === 0 && isDirectlySelected ? 1 : orgContextCount;
  }

  if (mode === "firstUnit") {
    return topOrgContext || isDirectlySelected ? 1 : 0;
  }

  return isDirectlySelected ? 1 : 0;
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
      return employee.tags.flatMap(({ date, label }) => (date ? [{ date, tag: label }] : []));
  }
};

const getExportEmployeeTextFieldValue = (employee: Employee, fieldKey: ExportEmployeeFieldKey) => {
  if (fieldKey === "tagDates") {
    return employee.tags.flatMap(({ date, label }) => (date ? [`${label}=${date}`] : []));
  }
  return getExportEmployeeFieldValue(employee, fieldKey);
};

const getUnitFieldValue = (
  row: ExportRow,
  fieldKey: ExportUnitFieldKey,
  options: { json: boolean; unitFullPathSeparator: string },
) => {
  const unitContext = row.unitContext;

  if (row.context === "unit" && unitContext) {
    switch (fieldKey) {
      case "unitId":
        return unitContext.unitId;
      case "unitName":
        return unitContext.unitName;
      case "unitFullPath":
        return unitContext.unitPosition.unitPath.names.join(options.unitFullPathSeparator);
      case "position":
        return options.json ? (unitContext.position ?? null) : unitContext.position;
      case "isBoss":
        return unitContext.isBoss;
    }
  }

  switch (fieldKey) {
    case "unitId":
      return options.json ? null : "";
    case "unitName":
    case "unitFullPath":
      return "";
    case "position":
      return options.json ? null : "";
    case "isBoss":
      return false;
  }
};

const toFlatRecord = (
  fieldNames: ExportFieldNameMap,
  row: ExportRow,
  selectedEmployeeFieldKeys: ExportEmployeeFieldKey[],
  selectedFlatUnitFieldKeys: ExportUnitFieldKey[],
  unitFullPathSeparator: string,
  stringifyArrays: boolean,
) =>
  Object.fromEntries([
    ...selectedEmployeeFieldKeys.map((fieldKey) => {
      const value = getExportEmployeeTextFieldValue(row.employee, fieldKey);

      return [
        getExportFieldOutputName(fieldNames, fieldKey),
        stringifyArrays ? asExportText(value) : value,
      ] as const;
    }),
    ...selectedFlatUnitFieldKeys.map((fieldKey) => {
      const value = getUnitFieldValue(row, fieldKey, { json: false, unitFullPathSeparator });

      return [
        getExportFieldOutputName(fieldNames, fieldKey),
        stringifyArrays ? asExportText(value) : value,
      ] as const;
    }),
  ]);

const createJsonUnitRecord = (
  fieldNames: ExportFieldNameMap,
  row: ExportRow,
  selectedJsonUnitFieldKeys: ExportJsonUnitFieldKey[],
  unitFullPathSeparator: string,
) =>
  Object.fromEntries(
    selectedJsonUnitFieldKeys.map((fieldKey) => [
      getExportFieldOutputName(fieldNames, fieldKey),
      getUnitFieldValue(row, fieldKey, { json: true, unitFullPathSeparator }),
    ]),
  );

const createJsonEmployeeRecord = (
  fieldNames: ExportFieldNameMap,
  rows: ExportRow[],
  selectedEmployeeFieldKeys: ExportEmployeeFieldKey[],
  selectedJsonUnitFieldKeys: ExportJsonUnitFieldKey[],
  unitFullPathSeparator: string,
) => {
  const firstRow = rows[0];

  if (!firstRow) return {};

  const entries: Array<[string, unknown]> = [];

  for (const fieldKey of selectedEmployeeFieldKeys) {
    entries.push([
      getExportFieldOutputName(fieldNames, fieldKey),
      getExportEmployeeFieldValue(firstRow.employee, fieldKey),
    ]);
  }

  entries.push([
    "units",
    rows
      .filter((row) => row.context === "unit")
      .map((row) =>
        createJsonUnitRecord(fieldNames, row, selectedJsonUnitFieldKeys, unitFullPathSeparator),
      ),
  ]);

  return Object.fromEntries(entries);
};

const toJsonRecords = (
  fieldNames: ExportFieldNameMap,
  rows: ExportRow[],
  selectedEmployeeFieldKeys: ExportEmployeeFieldKey[],
  selectedJsonUnitFieldKeys: ExportJsonUnitFieldKey[],
  unitFullPathSeparator: string,
) => {
  const rowsByEmployeeId = new Map<EmployeeId, ExportRow[]>();

  for (const row of rows) {
    rowsByEmployeeId.set(row.employee.id, [...(rowsByEmployeeId.get(row.employee.id) ?? []), row]);
  }

  return [...rowsByEmployeeId.values()].map((employeeRows) =>
    createJsonEmployeeRecord(
      fieldNames,
      employeeRows,
      selectedEmployeeFieldKeys,
      selectedJsonUnitFieldKeys,
      unitFullPathSeparator,
    ),
  );
};

export const createExportText = ({
  fieldNames,
  rows,
  selectedEmployeeFieldKeys,
  selectedFlatUnitFieldKeys,
  selectedJsonUnitFieldKeys,
  tabMode,
  templateFormat,
  unitFullPathSeparator,
}: {
  fieldNames: ExportFieldNameMap;
  rows: ExportRow[];
  selectedEmployeeFieldKeys: ExportEmployeeFieldKey[];
  selectedFlatUnitFieldKeys: ExportUnitFieldKey[];
  selectedJsonUnitFieldKeys: ExportJsonUnitFieldKey[];
  tabMode: ExportTabMode;
  templateFormat: string;
  unitFullPathSeparator: string;
}) => {
  if (tabMode === "json") {
    return JSON.stringify(
      toJsonRecords(
        fieldNames,
        rows,
        selectedEmployeeFieldKeys,
        selectedJsonUnitFieldKeys,
        unitFullPathSeparator,
      ),
      null,
      2,
    );
  }

  if (tabMode === "template") {
    return rows
      .map((row) =>
        renderTemplateFormat({
          formatValue: asExportText,
          resolveField: (fieldName): TemplateFieldValue => {
            if (!exportFieldByKey.has(fieldName as ExportFieldKey)) return { known: false };

            if (exportEmployeeFieldByKey.has(fieldName as ExportEmployeeFieldKey)) {
              return {
                known: true,
                value: getExportEmployeeTextFieldValue(
                  row.employee,
                  fieldName as ExportEmployeeFieldKey,
                ),
              };
            }

            return {
              known: true,
              value: getUnitFieldValue(row, fieldName as ExportUnitFieldKey, {
                json: false,
                unitFullPathSeparator,
              }),
            };
          },
          template: templateFormat,
        }),
      )
      .join("");
  }

  return unparse(
    {
      data: rows.map((row) =>
        toFlatRecord(
          fieldNames,
          row,
          selectedEmployeeFieldKeys,
          selectedFlatUnitFieldKeys,
          unitFullPathSeparator,
          true,
        ),
      ),
      fields: [...selectedEmployeeFieldKeys, ...selectedFlatUnitFieldKeys].map((fieldKey) =>
        getExportFieldOutputName(fieldNames, fieldKey),
      ),
    },
    {
      escapeFormulae: true,
      header: true,
      newline: "\r\n",
    },
  );
};
