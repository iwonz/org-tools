import type { CustomEmployeeFieldDefinition, Employee, EmployeeTag } from "@org-tools/types";
import { fromMarkdown } from "mdast-util-from-markdown";
import { gfmFromMarkdown } from "mdast-util-gfm";
import { gfm } from "micromark-extension-gfm";

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
import {
  renderTemplateFormatParts,
  type TemplateFieldResolver,
  type TemplateFormatPart,
} from "@/lib/template-format";
import type { ExportEmployeeFieldKey } from "@/stores/export-session-store";

export const EMPLOYEE_DISPLAY_UNIT_FIELD_KEYS = [
  "unitId",
  "unitName",
  "unitFullPath",
  "position",
  "isBoss",
] as const;

export type EmployeeDisplayUnitFieldKey = (typeof EMPLOYEE_DISPLAY_UNIT_FIELD_KEYS)[number];

export type EmployeeDisplayRenderOptions = {
  bossLabel: string;
  customEmployeeFieldDefinitions: readonly CustomEmployeeFieldDefinition[];
  employee: Employee;
  format: string;
  unitContexts: readonly EmployeeUnitContext[];
};

export type EmployeeDisplayTextMarks = {
  bold: boolean;
  code: boolean;
  italic: boolean;
  strike: boolean;
};

export type EmployeeDisplayTextNode = {
  explicitLink: boolean;
  fieldName: string | null;
  href: string | null;
  marks: EmployeeDisplayTextMarks;
  text: string;
  type: "text";
};

export type EmployeeDisplayTagsNode = {
  tags: EmployeeTag[];
  type: "tags";
};

export type EmployeeDisplayPosition = {
  label: string;
  unitContext: EmployeeUnitContext;
};

export type EmployeeDisplayPositionsNode = {
  positions: EmployeeDisplayPosition[];
  type: "positions";
};

export type EmployeeDisplayNode =
  | EmployeeDisplayPositionsNode
  | EmployeeDisplayTagsNode
  | EmployeeDisplayTextNode;

export type EmployeeDisplayLine = {
  nodes: EmployeeDisplayNode[];
  text: string;
};

type MarkdownNode = {
  children?: MarkdownNode[];
  position?: {
    end: { offset?: number };
    start: { offset?: number };
  };
  type: string;
  url?: string;
  value?: string;
};

type MarkdownContext = {
  explicitLink: boolean;
  href: string | null;
  marks: EmployeeDisplayTextMarks;
};

const EMPTY_MARKS: EmployeeDisplayTextMarks = {
  bold: false,
  code: false,
  italic: false,
  strike: false,
};
const BLOCK_SENTINEL = "\u{e100}";
const FIELD_MARKER_PATTERN = /\u{e101}ORGTOOLS_FIELD_(\d+)\u{e102}/gu;
const MARKDOWN_CACHE_LIMIT = 256;
const markdownTreeCache = new Map<string, MarkdownNode>();

const fieldMarker = (index: number) => `\u{e101}ORGTOOLS_FIELD_${index}\u{e102}`;

export const isSafeEmployeeDisplayHref = (href: string) => {
  const trimmed = href.trim();
  if (!trimmed) return false;
  try {
    const protocol = new URL(trimmed).protocol.toLocaleLowerCase();
    return (
      protocol === "http:" || protocol === "https:" || protocol === "mailto:" || protocol === "tel:"
    );
  } catch {
    return false;
  }
};

const getMarkdownTree = (skeleton: string) => {
  const source = `${BLOCK_SENTINEL}${skeleton}`;
  const cached = markdownTreeCache.get(source);
  if (cached) {
    markdownTreeCache.delete(source);
    markdownTreeCache.set(source, cached);
    return { source, tree: cached };
  }
  const tree = fromMarkdown(source, {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()],
  }) as MarkdownNode;
  markdownTreeCache.set(source, tree);
  while (markdownTreeCache.size > MARKDOWN_CACHE_LIMIT) {
    const oldestKey = markdownTreeCache.keys().next().value;
    if (oldestKey === undefined) break;
    markdownTreeCache.delete(oldestKey);
  }
  return { source, tree };
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

const renderEmployeeDisplayParts = (options: EmployeeDisplayRenderOptions) =>
  renderTemplateFormatParts({
    formatValue: asExportText,
    resolveField: createEmployeeDisplayFieldResolver(options),
    template: options.format,
  });

const splitEmployeeDisplayParts = (parts: readonly TemplateFormatPart[]) => {
  const rawLines: TemplateFormatPart[][] = [[]];
  for (const part of parts) {
    const fragments = part.text.replace(/\r\n?/gu, "\n").split("\n");
    for (const [index, fragment] of fragments.entries()) {
      if (fragment) rawLines.at(-1)?.push({ fieldName: part.fieldName, text: fragment });
      if (index < fragments.length - 1) rawLines.push([]);
    }
  }
  return rawLines.flatMap((lineParts) => {
    const rawText = lineParts.map((part) => part.text).join("");
    const text = rawText.trim();
    if (!text) return [];
    const start = rawText.indexOf(text);
    const end = start + text.length;
    const trimmedParts: TemplateFormatPart[] = [];
    let offset = 0;
    for (const part of lineParts) {
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
    return [trimmedParts];
  });
};

const appendTextNode = (
  nodes: EmployeeDisplayNode[],
  node: Omit<EmployeeDisplayTextNode, "type">,
) => {
  if (!node.text) return;
  const previous = nodes.at(-1);
  if (
    previous?.type === "text" &&
    previous.explicitLink === node.explicitLink &&
    previous.fieldName === node.fieldName &&
    previous.href === node.href &&
    previous.marks.bold === node.marks.bold &&
    previous.marks.code === node.marks.code &&
    previous.marks.italic === node.marks.italic &&
    previous.marks.strike === node.marks.strike
  ) {
    previous.text += node.text;
    return;
  }
  nodes.push({ ...node, type: "text" });
};

const replaceMarkers = (value: string, fields: readonly TemplateFormatPart[]) =>
  value.replace(
    FIELD_MARKER_PATTERN,
    (_, rawIndex: string) => fields[Number(rawIndex)]?.text ?? "",
  );

const materializeMarkdownLine = ({
  employee,
  fields,
  skeleton,
  unitContexts,
}: {
  employee: Employee;
  fields: readonly TemplateFormatPart[];
  skeleton: string;
  unitContexts: readonly EmployeeUnitContext[];
}): EmployeeDisplayLine | null => {
  const { source, tree } = getMarkdownTree(skeleton);
  const nodes: EmployeeDisplayNode[] = [];
  let strippedBlockSentinel = false;
  const appendValue = (value: string, context: MarkdownContext) => {
    const cleanValue = strippedBlockSentinel ? value : value.replace(BLOCK_SENTINEL, "");
    strippedBlockSentinel = true;
    let cursor = 0;
    for (const match of cleanValue.matchAll(FIELD_MARKER_PATTERN)) {
      const matchIndex = match.index ?? 0;
      appendTextNode(nodes, {
        ...context,
        fieldName: null,
        text: cleanValue.slice(cursor, matchIndex),
      });
      const field = fields[Number(match[1])];
      if (field?.fieldName === "tags") {
        if (employee.tags.length > 0) nodes.push({ tags: [...employee.tags], type: "tags" });
      } else if (field?.fieldName === "position") {
        const positions = unitContexts.flatMap((unitContext) =>
          unitContext.position ? [{ label: unitContext.position, unitContext }] : [],
        );
        if (positions.length > 0) nodes.push({ positions, type: "positions" });
      } else if (field) {
        appendTextNode(nodes, {
          ...context,
          fieldName: field.fieldName,
          text: field.text,
        });
      }
      cursor = matchIndex + match[0].length;
    }
    appendTextNode(nodes, {
      ...context,
      fieldName: null,
      text: cleanValue.slice(cursor),
    });
  };
  const visit = (node: MarkdownNode, context: MarkdownContext) => {
    if (node.type === "text") {
      appendValue(node.value ?? "", context);
      return;
    }
    if (node.type === "strong" || node.type === "emphasis" || node.type === "delete") {
      const marks = {
        ...context.marks,
        bold: context.marks.bold || node.type === "strong",
        italic: context.marks.italic || node.type === "emphasis",
        strike: context.marks.strike || node.type === "delete",
      };
      for (const child of node.children ?? []) visit(child, { ...context, marks });
      return;
    }
    if (node.type === "inlineCode") {
      appendValue(node.value ?? "", {
        ...context,
        marks: { ...context.marks, code: true },
      });
      return;
    }
    if (node.type === "link") {
      const resolvedHref = replaceMarkers(node.url ?? "", fields).trim();
      const href = isSafeEmployeeDisplayHref(resolvedHref) ? resolvedHref : null;
      for (const child of node.children ?? []) {
        visit(child, { ...context, explicitLink: true, href });
      }
      return;
    }
    if (node.type === "root" || node.type === "paragraph") {
      for (const child of node.children ?? []) visit(child, context);
      return;
    }
    const start = node.position?.start.offset;
    const end = node.position?.end.offset;
    if (start !== undefined && end !== undefined) {
      appendValue(source.slice(start, end), context);
      return;
    }
    if (node.value) appendValue(node.value, context);
    else for (const child of node.children ?? []) visit(child, context);
  };
  visit(tree, { explicitLink: false, href: null, marks: EMPTY_MARKS });
  const text = nodes
    .map((node) => {
      if (node.type === "text") return node.text;
      if (node.type === "tags") return node.tags.map((tag) => tag.label).join("; ");
      return node.positions.map((position) => position.label).join("; ");
    })
    .join("")
    .trim();
  return text ? { nodes, text } : null;
};

export const renderEmployeeDisplayRichLines = (
  options: EmployeeDisplayRenderOptions,
): EmployeeDisplayLine[] =>
  splitEmployeeDisplayParts(renderEmployeeDisplayParts(options)).flatMap((parts) => {
    const fields: TemplateFormatPart[] = [];
    const skeleton = parts
      .map((part) => {
        if (part.fieldName === null) return part.text;
        const index = fields.length;
        fields.push(part);
        return fieldMarker(index);
      })
      .join("");
    const line = materializeMarkdownLine({
      employee: options.employee,
      fields,
      skeleton,
      unitContexts: options.unitContexts,
    });
    return line ? [line] : [];
  });

export const renderEmployeeDisplayText = (options: EmployeeDisplayRenderOptions) =>
  renderEmployeeDisplayRichLines(options)
    .map((line) => line.text)
    .join("\n");

export const normalizeEmployeeDisplayLines = (text: string) =>
  text
    .split(/\r\n?|\n/u)
    .map((line) => line.trim())
    .filter(Boolean);

export const renderEmployeeDisplayLineDetails = renderEmployeeDisplayRichLines;

export const renderEmployeeDisplayLines = (options: EmployeeDisplayRenderOptions) =>
  renderEmployeeDisplayRichLines(options).map((line) => line.text);
