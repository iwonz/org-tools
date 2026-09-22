import type { CustomEmployeeFieldDefinition, Employee } from "@org-tools/types";

import {
  evaluateCustomEmployeeFields,
  normalizeCustomEmployeeFieldKey,
} from "@/lib/custom-employee-fields";
import type { EmployeeUnitContext } from "@/lib/employee-unit-contexts";
import {
  asExportText,
  exportEmployeeFieldByKey,
  getExportEmployeeFieldValue,
} from "@/lib/export-format";
import { renderTemplateFormatParts, type TemplateFieldResolver } from "@/lib/template-format";
import type { ExportEmployeeFieldKey } from "@/stores/export-session-store";

export const EMPLOYEE_DISPLAY_UNIT_FIELD_KEYS = [
  "unitId",
  "unitName",
  "unitFullPath",
  "position",
  "isBoss",
] as const;

export type EmployeeDisplayUnitFieldKey = (typeof EMPLOYEE_DISPLAY_UNIT_FIELD_KEYS)[number];

type EmployeeDisplayRenderOptions = {
  bossLabel: string;
  customEmployeeFieldDefinitions: readonly CustomEmployeeFieldDefinition[];
  employee: Employee;
  format: string;
  unitContexts: readonly EmployeeUnitContext[];
};

const getUnitDisplayValue = (
  contexts: readonly EmployeeUnitContext[],
  fieldName: EmployeeDisplayUnitFieldKey,
  bossLabel: string,
) => {
  switch (fieldName) {
    case "unitId":
      return contexts.map((context) => context.unitId);
    case "unitName":
      return contexts.map((context) => context.unitName);
    case "unitFullPath":
      return contexts.map((context) => context.unitFullPath);
    case "position":
      return contexts.flatMap((context) => (context.position ? [context.position] : []));
    case "isBoss":
      return contexts.some((context) => context.isBoss) ? bossLabel : "";
  }
};

const createEmployeeDisplayFieldResolver = ({
  bossLabel,
  customEmployeeFieldDefinitions,
  employee,
  unitContexts,
}: Omit<EmployeeDisplayRenderOptions, "format">): TemplateFieldResolver => {
  const customValues = evaluateCustomEmployeeFields(employee, customEmployeeFieldDefinitions);
  const customDefinitionByKey = new Map(
    customEmployeeFieldDefinitions.map((definition) => [
      normalizeCustomEmployeeFieldKey(definition.key),
      definition,
    ]),
  );
  return (fieldName) => {
    const customDefinition = customDefinitionByKey.get(normalizeCustomEmployeeFieldKey(fieldName));
    if (customDefinition) {
      return { known: true, value: customValues.get(customDefinition.id) ?? null };
    }
    if (exportEmployeeFieldByKey.has(fieldName as ExportEmployeeFieldKey)) {
      return {
        known: true,
        value: getExportEmployeeFieldValue(employee, fieldName as ExportEmployeeFieldKey),
      };
    }
    if (EMPLOYEE_DISPLAY_UNIT_FIELD_KEYS.includes(fieldName as EmployeeDisplayUnitFieldKey)) {
      return {
        known: true,
        value: getUnitDisplayValue(
          unitContexts,
          fieldName as EmployeeDisplayUnitFieldKey,
          bossLabel,
        ),
      };
    }
    return { known: false };
  };
};

export type EmployeeDisplayLinePart = {
  fieldName: string | null;
  text: string;
};

export type EmployeeDisplayLine = {
  parts: EmployeeDisplayLinePart[];
  text: string;
};

const renderEmployeeDisplayParts = (options: EmployeeDisplayRenderOptions) =>
  renderTemplateFormatParts({
    formatValue: asExportText,
    resolveField: createEmployeeDisplayFieldResolver(options),
    template: options.format,
  });

export const renderEmployeeDisplayText = (options: EmployeeDisplayRenderOptions) =>
  renderEmployeeDisplayParts(options)
    .map((part) => part.text)
    .join("");

export const normalizeEmployeeDisplayLines = (text: string) =>
  text
    .split(/\r\n?|\n/u)
    .map((line) => line.trim())
    .filter(Boolean);

export const renderEmployeeDisplayLineDetails = (
  options: EmployeeDisplayRenderOptions,
): EmployeeDisplayLine[] => {
  const rawLines: EmployeeDisplayLinePart[][] = [[]];
  for (const part of renderEmployeeDisplayParts(options)) {
    const fragments = part.text.replace(/\r\n?/gu, "\n").split("\n");
    for (const [index, fragment] of fragments.entries()) {
      if (fragment) rawLines.at(-1)?.push({ fieldName: part.fieldName, text: fragment });
      if (index < fragments.length - 1) rawLines.push([]);
    }
  }
  return rawLines.flatMap((parts) => {
    const rawText = parts.map((part) => part.text).join("");
    const text = rawText.trim();
    if (!text) return [];
    const start = rawText.indexOf(text);
    const end = start + text.length;
    const trimmedParts: EmployeeDisplayLinePart[] = [];
    let offset = 0;
    for (const part of parts) {
      const partStart = offset;
      const partEnd = offset + part.text.length;
      offset = partEnd;
      const overlapStart = Math.max(start, partStart);
      const overlapEnd = Math.min(end, partEnd);
      if (overlapStart >= overlapEnd) continue;
      trimmedParts.push({
        fieldName: part.fieldName,
        text: part.text.slice(overlapStart - partStart, overlapEnd - partStart),
      });
    }
    return [{ parts: trimmedParts, text }];
  });
};

export const renderEmployeeDisplayLines = (
  options: Parameters<typeof renderEmployeeDisplayText>[0],
) => renderEmployeeDisplayLineDetails(options).map((line) => line.text);
