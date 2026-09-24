import type { CustomEmployeeFieldDefinition, Employee, EmployeeTag } from "@org-tools/types";
import { fromMarkdown } from "mdast-util-from-markdown";
import { gfmFromMarkdown } from "mdast-util-gfm";
import { gfm } from "micromark-extension-gfm";

import {
  evaluateCustomEmployeeFields,
  isEmployeeDisplayPositionsKey,
  normalizeCustomEmployeeFieldKey,
} from "@/lib/custom-employee-fields";
import {
  DEFAULT_EMPLOYEE_DISPLAY_FONT_FAMILY,
  EMPLOYEE_DISPLAY_MONOSPACE_FONT_FAMILY,
  type EmployeeDisplayFontStyle,
  type EmployeeDisplayTextMeasure,
  employeeDisplayTextMeasureEngine,
} from "@/lib/employee-display-measure";
import type { EmployeeUnitContext } from "@/lib/employee-unit-contexts";
import {
  asExportText,
  exportEmployeeFieldByKey,
  getExportEmployeeFieldValue,
} from "@/lib/export-format";
import { getTagSurfaceHeight, TAG_SURFACE_METRICS, takeFittingText } from "@/lib/tag-surface";
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
  customEmployeeFieldDefinitions: readonly CustomEmployeeFieldDefinition[];
  employee: Employee;
  format: string;
  positionNotSpecifiedLabel?: string;
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

export const getEmployeeDisplayPositionText = (position: EmployeeDisplayPosition) =>
  `${position.label} · ${position.unitContext.unitName}`;

const getEmployeeDisplayNodeText = (node: EmployeeDisplayNode) => {
  if (node.type === "text") return node.text;
  if (node.type === "tags") return node.tags.map((tag) => tag.label).join("; ");
  return node.positions.map(getEmployeeDisplayPositionText).join("; ");
};

export type EmployeeDisplayNode =
  | EmployeeDisplayPositionsNode
  | EmployeeDisplayTagsNode
  | EmployeeDisplayTextNode;

export type EmployeeDisplayLine = {
  blank?: true;
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
      return contexts.some((context) => context.isBoss);
  }
};

const createEmployeeDisplayFieldResolver = ({
  customEmployeeFieldDefinitions,
  employee,
  positionNotSpecifiedLabel = "Position not specified",
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
    if (isEmployeeDisplayPositionsKey(fieldName)) {
      return {
        known: true,
        value: unitContexts.map(
          (unitContext) =>
            `${unitContext.position || positionNotSpecifiedLabel} · ${unitContext.unitName}`,
        ),
      };
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
        value: getUnitDisplayValue(unitContexts, fieldName as EmployeeDisplayUnitFieldKey),
      };
    }
    return { known: false };
  };
};

const renderEmployeeDisplayParts = (options: EmployeeDisplayRenderOptions, template: string) =>
  renderTemplateFormatParts({
    formatValue: (value, fieldName) => (fieldName === "isBoss" ? "" : asExportText(value)),
    resolveField: createEmployeeDisplayFieldResolver(options),
    template,
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
  positionNotSpecifiedLabel,
  skeleton,
  supportsSemanticPositions,
  unitContexts,
}: {
  employee: Employee;
  fields: readonly TemplateFormatPart[];
  positionNotSpecifiedLabel: string;
  skeleton: string;
  supportsSemanticPositions: boolean;
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
      } else if (
        field?.fieldName &&
        supportsSemanticPositions &&
        isEmployeeDisplayPositionsKey(field.fieldName)
      ) {
        const positions = unitContexts.map((unitContext) => ({
          label: unitContext.position || positionNotSpecifiedLabel,
          unitContext,
        }));
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
      return node.positions.map(getEmployeeDisplayPositionText).join("; ");
    })
    .join("")
    .trim();
  return text ? { nodes, text } : null;
};

export const renderEmployeeDisplayRichLines = (
  options: EmployeeDisplayRenderOptions,
): EmployeeDisplayLine[] => {
  const sourceLines = options.format.replace(/\r\n?/gu, "\n").split("\n");
  const lines = sourceLines.map((sourceLine): EmployeeDisplayLine | "blank" | null => {
    if (!sourceLine.trim()) return "blank";
    const parts = splitEmployeeDisplayParts(renderEmployeeDisplayParts(options, sourceLine))[0];
    if (!parts) return null;
    const supportsSemanticPositions = !options.customEmployeeFieldDefinitions.some((definition) =>
      isEmployeeDisplayPositionsKey(definition.key),
    );
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
      positionNotSpecifiedLabel: options.positionNotSpecifiedLabel ?? "Position not specified",
      skeleton,
      supportsSemanticPositions,
      unitContexts: options.unitContexts,
    });
    return line;
  });
  const firstContentIndex = lines.findIndex((line) => line !== null && line !== "blank");
  if (firstContentIndex === -1) return [];
  let lastContentIndex = firstContentIndex;
  for (let index = firstContentIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line !== null && line !== "blank") lastContentIndex = index;
  }
  return lines.flatMap((line, index) => {
    if (line === null) return [];
    if (line === "blank") {
      return index > firstContentIndex && index < lastContentIndex
        ? [{ blank: true, nodes: [], text: "" } satisfies EmployeeDisplayLine]
        : [];
    }
    return [line];
  });
};

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

export const measureEmployeeDisplayTextNode = (node: EmployeeDisplayTextNode) => {
  return employeeDisplayTextMeasureEngine.measure(node.text, {
    fontFamily: node.marks.code
      ? EMPLOYEE_DISPLAY_MONOSPACE_FONT_FAMILY
      : DEFAULT_EMPLOYEE_DISPLAY_FONT_FAMILY,
    fontSize: 14 * (node.marks.code ? 0.9 : 1),
    fontStyle: node.marks.italic ? "italic" : "normal",
    fontWeight: node.marks.bold ? 600 : 400,
  });
};

export const wrapEmployeeDisplayRichLines = (
  lines: readonly EmployeeDisplayLine[],
  availableWidth: number,
  measureText: (node: EmployeeDisplayTextNode) => number = measureEmployeeDisplayTextNode,
): EmployeeDisplayLine[] => {
  if (availableWidth <= 0) return [...lines];
  const wrapped: EmployeeDisplayLine[] = [];
  const pushNodes = (nodes: EmployeeDisplayNode[]) => {
    if (nodes.length === 0) return;
    wrapped.push({ nodes, text: nodes.map(getEmployeeDisplayNodeText).join("").trimEnd() });
  };
  for (const line of lines) {
    if (line.blank) {
      wrapped.push(line);
      continue;
    }
    let rowNodes: EmployeeDisplayNode[] = [];
    let rowWidth = 0;
    const flush = () => {
      pushNodes(rowNodes);
      rowNodes = [];
      rowWidth = 0;
    };
    for (const node of line.nodes) {
      if (node.type !== "text") {
        if (rowNodes.length > 0) flush();
        wrapped.push({ nodes: [node], text: getEmployeeDisplayNodeText(node) });
        continue;
      }
      for (const token of node.text.match(/\s+|\S+/gu) ?? []) {
        const whitespace = /^\s+$/u.test(token);
        if (whitespace && rowNodes.length === 0) continue;
        const tokenNode = { ...node, text: token };
        const tokenWidth = measureText(tokenNode);
        if (rowNodes.length > 0 && rowWidth + tokenWidth > availableWidth) {
          flush();
          if (whitespace) continue;
        }
        if (!whitespace && tokenWidth > availableWidth) {
          let chunk = "";
          for (const character of token) {
            const candidate = `${chunk}${character}`;
            if (chunk && measureText({ ...node, text: candidate }) > availableWidth) {
              appendTextNode(rowNodes, { ...node, text: chunk });
              flush();
              chunk = character;
            } else {
              chunk = candidate;
            }
          }
          if (chunk) {
            appendTextNode(rowNodes, { ...node, text: chunk });
            rowWidth = measureText({ ...node, text: chunk });
          }
          continue;
        }
        appendTextNode(rowNodes, { ...node, text: token });
        rowWidth += tokenWidth;
      }
    }
    flush();
  }
  return wrapped;
};

export type EmployeeDisplayVisualFragment =
  | {
      height: number;
      node: EmployeeDisplayTextNode;
      text: string;
      type: "text";
      width: number;
      x: number;
    }
  | {
      continued: boolean;
      end: number;
      height: number;
      start: number;
      tag: EmployeeTag;
      text: string;
      type: "tag";
      width: number;
      x: number;
    }
  | {
      continued: boolean;
      end: number;
      height: number;
      position: EmployeeDisplayPosition;
      start: number;
      text: string;
      type: "position";
      width: number;
      x: number;
    };

export type EmployeeDisplayVisualLine = {
  blank?: true;
  blockY: number;
  fragments: EmployeeDisplayVisualFragment[];
  gapAfter: number;
  height: number;
  text: string;
  width: number;
  y: number;
};

export type EmployeeDisplayVisualBlock = {
  height: number;
  lines: EmployeeDisplayVisualLine[];
  y: number;
};

export type EmployeeDisplayVisualLayout = {
  blocks: EmployeeDisplayVisualBlock[];
  direction: "ltr" | "rtl";
  height: number;
  lines: EmployeeDisplayVisualLine[];
  textMode: EmployeeDisplayTextMode;
};

export type EmployeeDisplayTextMode = "card" | "editor";

const getEmployeeDisplayTextStyle = (
  fontFamily: string,
  mode: EmployeeDisplayTextMode,
  node: EmployeeDisplayTextNode,
): EmployeeDisplayFontStyle => ({
  fontFamily: node.marks.code ? EMPLOYEE_DISPLAY_MONOSPACE_FONT_FAMILY : fontFamily,
  fontSize: (mode === "editor" ? 12 : 14) * (node.marks.code ? 0.9 : 1),
  fontStyle: node.marks.italic ? "italic" : "normal",
  fontWeight: node.marks.bold ? 600 : 400,
});

const getTagTextStyle = (fontFamily: string, fontWeight = 400): EmployeeDisplayFontStyle => ({
  fontFamily,
  fontSize: TAG_SURFACE_METRICS.fontSize,
  fontStyle: "normal",
  fontWeight,
});

const EMPLOYEE_DISPLAY_LAYOUT_CACHE_LIMIT = 8;
const employeeDisplayLayoutCache = new WeakMap<
  readonly EmployeeDisplayLine[],
  Map<string, EmployeeDisplayVisualLayout>
>();
const employeeDisplayMeasureIds = new WeakMap<EmployeeDisplayTextMeasure, number>();
let nextEmployeeDisplayMeasureId = 1;

const getEmployeeDisplayMeasureId = (measureText: EmployeeDisplayTextMeasure) => {
  const existing = employeeDisplayMeasureIds.get(measureText);
  if (existing) return existing;
  const id = nextEmployeeDisplayMeasureId;
  nextEmployeeDisplayMeasureId += 1;
  employeeDisplayMeasureIds.set(measureText, id);
  return id;
};

export const layoutEmployeeDisplayRichLines = (
  sourceLines: readonly EmployeeDisplayLine[],
  {
    availableWidth,
    direction = "ltr",
    font = "system-ui",
    formatTag = (tag) => tag.label,
    lineGap = 0,
    locale = "en",
    measureText = employeeDisplayTextMeasureEngine.measure,
    measurementRevision = 0,
    textMode = "editor",
  }: {
    availableWidth: number;
    direction?: "ltr" | "rtl";
    font?: string;
    formatTag?: (tag: EmployeeTag) => string;
    lineGap?: number;
    locale?: string;
    measureText?: EmployeeDisplayTextMeasure;
    measurementRevision?: number;
    textMode?: EmployeeDisplayTextMode;
  },
): EmployeeDisplayVisualLayout => {
  const safeWidth = Math.max(1, availableWidth);
  const metrics = TAG_SURFACE_METRICS;
  const baseLineHeight = textMode === "editor" ? 16 : 20;
  const surfaceHeight = getTagSurfaceHeight();
  const blocks: EmployeeDisplayVisualBlock[] = [];
  const lines: EmployeeDisplayVisualLine[] = [];
  const formattedTagText = new Map<EmployeeTag, string>();
  const getFormattedTagText = (tag: EmployeeTag) => {
    const cached = formattedTagText.get(tag);
    if (cached !== undefined) return cached;
    const value = formatTag(tag);
    formattedTagText.set(tag, value);
    return value;
  };
  const cacheKey = JSON.stringify([
    safeWidth,
    textMode,
    direction,
    font,
    lineGap,
    locale,
    getEmployeeDisplayMeasureId(measureText),
    measurementRevision,
    sourceLines.map((line) => [
      Boolean(line.blank),
      line.nodes.map((node) =>
        node.type === "text"
          ? [node.type, node.text, node.href, node.fieldName, node.explicitLink, node.marks]
          : node.type === "tags"
            ? [node.type, node.tags.map((tag) => [tag.tagId, getFormattedTagText(tag), tag.color])]
            : [
                node.type,
                node.positions.map((position) => [
                  position.label,
                  position.unitContext.id,
                  position.unitContext.unitName,
                ]),
              ],
      ),
    ]),
  ]);
  const sourceCache = employeeDisplayLayoutCache.get(sourceLines);
  const cachedLayout = sourceCache?.get(cacheKey);
  if (cachedLayout) {
    sourceCache?.delete(cacheKey);
    sourceCache?.set(cacheKey, cachedLayout);
    return cachedLayout;
  }

  for (const sourceLine of sourceLines) {
    const blockLines: EmployeeDisplayVisualLine[] = [];
    if (sourceLine.blank) {
      blockLines.push({
        blank: true,
        blockY: 0,
        fragments: [],
        gapAfter: lineGap,
        height: baseLineHeight,
        text: "",
        width: 0,
        y: 0,
      });
      blocks.push({ height: baseLineHeight, lines: blockLines, y: 0 });
      lines.push(...blockLines);
      continue;
    }
    let fragments: EmployeeDisplayVisualFragment[] = [];
    let width = 0;
    const pushLine = (gapAfter = lineGap) => {
      if (fragments.length === 0) return;
      blockLines.push({
        blockY: 0,
        fragments,
        gapAfter,
        height: Math.max(baseLineHeight, ...fragments.map((fragment) => fragment.height)),
        text: fragments
          .map((fragment) => fragment.text)
          .join("")
          .trimEnd(),
        width,
        y: 0,
      });
      fragments = [];
      width = 0;
    };
    const appendText = (node: EmployeeDisplayTextNode) => {
      let rest = node.text;
      while (rest) {
        if (fragments.length === 0) rest = rest.trimStart();
        if (!rest) break;
        const remainingWidth = Math.max(1, safeWidth - width);
        const style = getEmployeeDisplayTextStyle(font, textMode, node);
        const fitted = takeFittingText(
          rest,
          remainingWidth,
          (value) => measureText(value, style) + (node.marks.code ? 4 : 0),
        );
        if (!fitted.text && fragments.length > 0) {
          pushLine();
          continue;
        }
        const text = fitted.text || rest;
        const textWidth = Math.min(
          remainingWidth,
          measureText(text, style) + (node.marks.code ? 4 : 0),
        );
        fragments.push({
          height: baseLineHeight,
          node,
          text,
          type: "text",
          width: textWidth,
          x: width,
        });
        width += textWidth;
        rest = fitted.rest;
        if (rest) pushLine();
      }
    };
    const measureSurfaceText = (
      type: "position" | "tag",
      value: EmployeeDisplayPosition | EmployeeTag,
      text: string,
      sourceStart: number,
    ) => {
      if (type === "tag") return measureText(text, getTagTextStyle(font));
      const position = value as EmployeeDisplayPosition;
      const positionEnd = position.label.length;
      const separatorEnd = positionEnd + 3;
      const sourceEnd = sourceStart + text.length;
      let measured = 0;
      const ranges = [
        { end: positionEnd, start: 0, weight: 500 },
        { end: separatorEnd, start: positionEnd, weight: 400 },
        { end: Number.POSITIVE_INFINITY, start: separatorEnd, weight: 400 },
      ];
      for (const range of ranges) {
        const from = Math.max(sourceStart, range.start);
        const to = Math.min(sourceEnd, range.end);
        if (from >= to) continue;
        measured += measureText(
          text.slice(from - sourceStart, to - sourceStart),
          getTagTextStyle(font, range.weight),
        );
      }
      return measured;
    };
    const appendSurfacePart = (
      type: "position" | "tag",
      value: EmployeeDisplayPosition | EmployeeTag,
      sourceText: string,
      initialStart = 0,
      initialContinued = false,
    ) => {
      let rest = sourceText.normalize("NFC").trim() || " ";
      let start = initialStart;
      let continued = initialContinued;
      while (rest) {
        const gap = width > 0 ? metrics.gap : 0;
        const borderWidth = type === "position" ? 2 : 0;
        let maxTextWidth = safeWidth - width - gap - metrics.horizontalPadding * 2 - borderWidth;
        const fullRowTextWidth = safeWidth - metrics.horizontalPadding * 2 - borderWidth;
        const measuredRest = measureSurfaceText(type, value, rest, start);
        if (width > 0 && measuredRest <= fullRowTextWidth && measuredRest > maxTextWidth) {
          pushLine(metrics.gap);
          continue;
        }
        if (maxTextWidth <= 0 && fragments.length > 0) {
          pushLine(metrics.gap);
          continue;
        }
        maxTextWidth = Math.max(1, maxTextWidth);
        const fitted = takeFittingText(rest, maxTextWidth, (text) =>
          measureSurfaceText(type, value, text, start),
        );
        if (!fitted.text && fragments.length > 0) {
          pushLine(metrics.gap);
          continue;
        }
        const text = fitted.text || rest;
        const fragmentWidth = Math.min(
          safeWidth,
          measureSurfaceText(type, value, text, start) +
            metrics.horizontalPadding * 2 +
            borderWidth,
        );
        const x = width + gap;
        const common = {
          continued,
          end: start + text.length,
          height: surfaceHeight,
          start,
          text,
          width: fragmentWidth,
          x,
        };
        fragments.push(
          type === "tag"
            ? { ...common, tag: value as EmployeeTag, type }
            : { ...common, position: value as EmployeeDisplayPosition, type },
        );
        width = x + fragmentWidth;
        start += text.length + Math.max(0, rest.length - fitted.rest.length - text.length);
        rest = fitted.rest;
        continued = true;
        if (rest) pushLine(metrics.gap);
      }
    };
    const appendSurface = (
      type: "position" | "tag",
      value: EmployeeDisplayPosition | EmployeeTag,
      sourceText: string,
    ) => {
      const label = type === "tag" ? (value as EmployeeTag).label.normalize("NFC") : sourceText;
      const normalizedSource = sourceText.normalize("NFC");
      const suffix =
        type === "tag" && normalizedSource.startsWith(label)
          ? normalizedSource.slice(label.length)
          : "";
      appendSurfacePart(type, value, suffix ? label : normalizedSource);
      if (!suffix) return;
      const lastFragment = fragments.at(-1);
      if (lastFragment?.type === type) {
        const combinedText = `${lastFragment.text}${suffix}`;
        const combinedWidth = Math.min(
          safeWidth,
          measureSurfaceText(type, value, combinedText, lastFragment.start) +
            metrics.horizontalPadding * 2 +
            (type === "position" ? 2 : 0),
        );
        if (lastFragment.x + combinedWidth <= safeWidth) {
          lastFragment.text = combinedText;
          lastFragment.end += suffix.length;
          lastFragment.width = combinedWidth;
          width = lastFragment.x + combinedWidth;
          return;
        }
      }
      const atomicSuffix = suffix.trimStart();
      const atomicSuffixWidth =
        measureSurfaceText(type, value, atomicSuffix, label.length) + metrics.horizontalPadding * 2;
      if (atomicSuffixWidth <= safeWidth) {
        if (fragments.length > 0) pushLine(metrics.gap);
        fragments.push({
          continued: true,
          end: label.length + suffix.length,
          height: surfaceHeight,
          start: label.length,
          tag: value as EmployeeTag,
          text: atomicSuffix,
          type: "tag",
          width: atomicSuffixWidth,
          x: 0,
        });
        width = atomicSuffixWidth;
        return;
      }
      appendSurfacePart(type, value, atomicSuffix, label.length, true);
    };

    for (const node of sourceLine.nodes) {
      if (node.type === "text") {
        appendText(node);
      } else if (node.type === "tags") {
        for (const tag of node.tags) appendSurface("tag", tag, getFormattedTagText(tag));
      } else {
        for (const position of node.positions) {
          appendSurface("position", position, getEmployeeDisplayPositionText(position));
        }
      }
    }
    pushLine();
    if (blockLines.length > 0) {
      let blockHeight = 0;
      for (const [index, line] of blockLines.entries()) {
        line.blockY = blockHeight;
        blockHeight += line.height + (index + 1 < blockLines.length ? line.gapAfter : 0);
      }
      blocks.push({ height: blockHeight, lines: blockLines, y: 0 });
      lines.push(...blockLines);
    }
  }

  if (direction === "rtl") {
    for (const line of lines) {
      for (const fragment of line.fragments) {
        fragment.x = safeWidth - fragment.x - fragment.width;
      }
    }
  }

  let layoutHeight = 0;
  for (const [index, block] of blocks.entries()) {
    block.y = layoutHeight;
    for (const line of block.lines) line.y = block.y + line.blockY;
    layoutHeight += block.height + (index + 1 < blocks.length ? lineGap : 0);
  }

  const layout: EmployeeDisplayVisualLayout = {
    blocks,
    direction,
    height: layoutHeight,
    lines,
    textMode,
  };
  const nextCache = sourceCache ?? new Map<string, EmployeeDisplayVisualLayout>();
  nextCache.set(cacheKey, layout);
  while (nextCache.size > EMPLOYEE_DISPLAY_LAYOUT_CACHE_LIMIT) {
    const oldest = nextCache.keys().next().value;
    if (oldest === undefined) break;
    nextCache.delete(oldest);
  }
  if (!sourceCache) employeeDisplayLayoutCache.set(sourceLines, nextCache);
  return layout;
};
