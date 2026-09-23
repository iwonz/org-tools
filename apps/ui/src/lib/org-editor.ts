import type {
  Employee,
  EmployeeId,
  EmployeeTag,
  EmployeeTagColor,
  OrgEditorCanvasViewport,
  OrgEditorEmployeePosition,
  OrgEditorLayoutMode,
  OrgEditorOpenPosition,
  OrgEditorOpenPositionId,
  OrgEditorSelectedItem,
  OrgEditorState,
  OrgEditorUnit,
  OrgEditorUnitId,
  OrgEditorViewSettings,
  TagId,
  Unit,
} from "@org-tools/types";
import { createUuid } from "@/lib/employee-data";
import { type EmployeeDisplayLine, getEmployeeDisplayPositionText } from "@/lib/employee-display";

export const ORG_EDITOR_UNIT_MIN_WIDTH = 280;
export const ORG_EDITOR_UNIT_HEADER_HEIGHT = 72;
export const ORG_EDITOR_UNIT_BORDER_WIDTH = 1;
export const ORG_EDITOR_UNIT_BORDER_RADIUS = 8;
export const ORG_EDITOR_EMPLOYEE_ROW_HEIGHT = 48;
export const ORG_EDITOR_EMPLOYEE_AVATAR_SIZE = 20;
export const ORG_EDITOR_EMPLOYEE_CONTENT_GAP = 8;
export const ORG_EDITOR_EMPLOYEE_CONTENT_RIGHT_PADDING = 4;
export const ORG_EDITOR_EMPLOYEE_NAME_FONT_SIZE = 12;
export const ORG_EDITOR_EMPLOYEE_NAME_LINE_HEIGHT = 16;
export const ORG_EDITOR_EMPLOYEE_ROW_BORDER_RADIUS = 6;
export const ORG_EDITOR_EMPLOYEE_ROW_GAP = 4;
export const ORG_EDITOR_EMPLOYEE_ROW_HORIZONTAL_PADDING = 8;
export const ORG_EDITOR_EMPLOYEE_TAG_STYLE = {
  fontSize: 9,
  gap: 2,
  height: 12,
  horizontalPadding: 6,
  radius: 6,
  widthPerCharacter: 5.2,
} as const;
export const ORG_EDITOR_EMPLOYEE_TAG_ROW_HEIGHT =
  ORG_EDITOR_EMPLOYEE_TAG_STYLE.height + ORG_EDITOR_EMPLOYEE_TAG_STYLE.gap;
export const ORG_EDITOR_EMPLOYEE_TAG_GAP = ORG_EDITOR_EMPLOYEE_TAG_STYLE.gap;
export const ORG_EDITOR_EMPLOYEE_CONTENT_VERTICAL_PADDING = 16;
export const ORG_EDITOR_UNIT_HORIZONTAL_GAP = 40;
export const ORG_EDITOR_UNIT_CONTENT_PADDING = 8;
export const ORG_EDITOR_UNIT_EMPLOYEE_LIST_TOP_PADDING = ORG_EDITOR_UNIT_CONTENT_PADDING;
export const ORG_EDITOR_UNIT_EMPLOYEE_LIST_HORIZONTAL_PADDING = ORG_EDITOR_UNIT_CONTENT_PADDING;
export const ORG_EDITOR_UNIT_VERTICAL_PADDING = 16;
export const ORG_EDITOR_UNIT_VERTICAL_GAP = 40;
export const ORG_EDITOR_UNIT_LAYER_GAP = 64;
export const ORG_EDITOR_UNIT_ROOT_GAP = 64;
export const ORG_EDITOR_UNIT_MIN_HEIGHT = 120;
export const ORG_EDITOR_UNIT_COLLAPSED_HEIGHT = ORG_EDITOR_UNIT_HEADER_HEIGHT;
export const ORG_EDITOR_UNIT_TAG_FOOTER_CHIP_HEIGHT = 20;
export const ORG_EDITOR_UNIT_TAG_FOOTER_CHIP_HORIZONTAL_PADDING = 8;
export const ORG_EDITOR_UNIT_TAG_FOOTER_COUNT_GAP = 4;
export const ORG_EDITOR_UNIT_TAG_FOOTER_GAP = 4;
export const ORG_EDITOR_UNIT_TAG_FOOTER_LINE_HEIGHT = 12;
export const ORG_EDITOR_UNIT_TAG_FOOTER_PADDING = 8;
export const ORG_EDITOR_UNIT_TAG_FOOTER_VERTICAL_PADDING = 4;
export const ORG_EDITOR_DEFAULT_LAYOUT_MODE: OrgEditorLayoutMode = "topDown";
export const ORG_EDITOR_GRID_SIZE = 24;
export const ORG_EDITOR_UNIT_NOTE_MAX_UTF8_BYTES = 64 * 1024;
export const ORG_EDITOR_GRID_MIN_SCREEN_SIZE = 24;
export const ORG_EDITOR_CANVAS_DEFAULT_VIEWPORT: OrgEditorCanvasViewport = {
  scale: 1,
  x: 0,
  y: 0,
};

export type OrgEditorUnitTreeNode = {
  children: OrgEditorUnitTreeNode[];
  unit: OrgEditorUnit;
};

export type OrgEditorSourceIndex = {
  employeesById: ReadonlyMap<EmployeeId, Employee>;
};

export type OrgEditorUnitEmployeeSummary = {
  directCount: number;
  hasChildUnits: boolean;
  totalCount: number;
};

export type OrgEditorUnitTagSummary = {
  color: EmployeeTagColor | null;
  count: number;
  label: string;
  tagId: TagId;
};

export type OrgEditorUnitRow =
  | { employeeId: EmployeeId; key: string; type: "employee" }
  | { key: string; openPosition: OrgEditorOpenPosition; type: "openPosition" };

export const createOrgEditorEmployeeRowKey = (employeeId: EmployeeId) => `employee:${employeeId}`;
export const createOrgEditorOpenPositionRowKey = (openPositionId: OrgEditorOpenPositionId) =>
  `openPosition:${openPositionId}`;

export type OrgEditorUnitTagFooterLine = {
  id: string;
  label: string;
  suffix: string | null;
  width: number;
};

export type OrgEditorUnitTagFooterChipLayout = {
  color: EmployeeTagColor | null;
  count: number;
  height: number;
  label: string;
  lines: OrgEditorUnitTagFooterLine[];
  tagId: TagId;
  width: number;
  x: number;
  y: number;
};

export type OrgEditorUnitTagFooterLayout = {
  chips: OrgEditorUnitTagFooterChipLayout[];
  height: number;
  rowCount: number;
};

const COMPACT_FOOTER_TEXT_SAFETY = 3;
const WRAPPED_FOOTER_RENDER_SAFETY = 4;

const getCompactFooterGlyphWidth = (glyph: string) => {
  if (/\p{Mark}/u.test(glyph)) return 0;
  if (/\s/u.test(glyph)) return 2.8;
  if (/\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}|\p{Script=Hangul}/u.test(glyph)) {
    return 10;
  }
  if (/\p{Script=Arabic}/u.test(glyph)) return 5.6;
  if (/\p{N}/u.test(glyph)) return 5.6;
  if (/[ilI|!.,:;'"`]/u.test(glyph)) return 2.3;
  if (/[jtfr·]/u.test(glyph)) return 3;
  if (/[MWmw@%&\u0416\u0424\u0428\u0429\u042b\u042e]/u.test(glyph)) return 8.4;
  if (/\p{Lu}/u.test(glyph)) return 7;
  if (/[acersuvxyz]/u.test(glyph)) return 5;
  if (/[bdghnopq]/u.test(glyph)) return 5.6;
  return 5.4;
};

const measureCompactFooterText = (value: string) =>
  [...value.normalize("NFC")].reduce(
    (width, glyph) => width + getCompactFooterGlyphWidth(glyph),
    0,
  );

const measureCompactFooterLabel = (value: string) =>
  measureCompactFooterText(value) + ([...value].length <= 3 ? 0 : COMPACT_FOOTER_TEXT_SAFETY);

const getGraphemes = (value: string) => {
  if (typeof Intl.Segmenter === "function") {
    return [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(value)].map(
      ({ segment }) => segment,
    );
  }
  return [...value];
};

const wrapCompactFooterLabel = (label: string, maxWidth: number) => {
  const normalizedLabel = label.normalize("NFC").trim();
  if (!normalizedLabel) return [""];
  const lines: string[] = [];
  let line = "";

  const pushWord = (word: string) => {
    const candidate = line ? `${line} ${word}` : word;
    if (measureCompactFooterText(candidate) <= maxWidth) {
      line = candidate;
      return;
    }
    if (line) {
      lines.push(line);
      line = "";
    }
    if (measureCompactFooterText(word) <= maxWidth) {
      line = word;
      return;
    }
    let chunk = "";
    for (const grapheme of getGraphemes(word)) {
      const nextChunk = `${chunk}${grapheme}`;
      if (chunk && measureCompactFooterText(nextChunk) > maxWidth) {
        lines.push(chunk);
        chunk = grapheme;
      } else {
        chunk = nextChunk;
      }
    }
    line = chunk;
  };

  for (const word of normalizedLabel.split(/\s+/u)) pushWord(word);
  if (line || lines.length === 0) lines.push(line);
  return lines;
};

const createOrgEditorUnitTagFooterChipDraft = (
  summary: OrgEditorUnitTagSummary,
  availableWidth: number,
) => {
  const safeWidth = Math.max(1, availableWidth);
  const maxTextWidth = Math.max(
    1,
    safeWidth - ORG_EDITOR_UNIT_TAG_FOOTER_CHIP_HORIZONTAL_PADDING * 2,
  );
  // Keep the shared metric comfortably inside the browser-rendered Noto glyph width.
  // The same wrapped lines are consumed by DOM and canvas export, so this safety
  // allowance prevents a platform font rasterizer from clipping the final grapheme.
  const wrapTextWidth = Math.max(1, maxTextWidth - 24);
  const suffix = `· ${summary.count}`;
  const suffixWidth = measureCompactFooterText(suffix);
  const label = summary.label.normalize("NFC").trim();
  const labelWidth = measureCompactFooterLabel(label);
  const naturalContentWidth = labelWidth + ORG_EDITOR_UNIT_TAG_FOOTER_COUNT_GAP + suffixWidth;
  let lines: OrgEditorUnitTagFooterLine[];

  if (naturalContentWidth <= maxTextWidth) {
    lines = [{ id: `${summary.tagId}:0`, label, suffix, width: naturalContentWidth }];
  } else {
    const wrappedLabels = wrapCompactFooterLabel(label, wrapTextWidth);
    lines = wrappedLabels.map((lineLabel, index) => ({
      id: `${summary.tagId}:${index}`,
      label: lineLabel,
      suffix: null,
      width: measureCompactFooterLabel(lineLabel),
    }));
    const lastLine = lines.at(-1);
    if (
      lastLine &&
      lastLine.width + ORG_EDITOR_UNIT_TAG_FOOTER_COUNT_GAP + suffixWidth <= wrapTextWidth
    ) {
      lastLine.suffix = suffix;
      lastLine.width += ORG_EDITOR_UNIT_TAG_FOOTER_COUNT_GAP + suffixWidth;
    } else {
      lines.push({ id: `${summary.tagId}:${lines.length}`, label: "", suffix, width: suffixWidth });
    }
  }

  const contentWidth =
    Math.max(...lines.map((line) => line.width)) +
    (lines.length > 1 ? WRAPPED_FOOTER_RENDER_SAFETY : 0);
  const width = Math.min(
    safeWidth,
    Math.max(40, Math.ceil(contentWidth + ORG_EDITOR_UNIT_TAG_FOOTER_CHIP_HORIZONTAL_PADDING * 2)),
  );
  const height = Math.max(
    ORG_EDITOR_UNIT_TAG_FOOTER_CHIP_HEIGHT,
    lines.length * ORG_EDITOR_UNIT_TAG_FOOTER_LINE_HEIGHT +
      ORG_EDITOR_UNIT_TAG_FOOTER_VERTICAL_PADDING * 2,
  );

  return { ...summary, height, lines, width };
};

export const snapOrgEditorCoordinate = (value: number) =>
  Math.round(value / ORG_EDITOR_GRID_SIZE) * ORG_EDITOR_GRID_SIZE;

export const snapOrgEditorPoint = <Point extends { x: number; y: number }>(
  point: Point,
): Point => ({
  ...point,
  x: snapOrgEditorCoordinate(point.x),
  y: snapOrgEditorCoordinate(point.y),
});

export const snapOrgEditorUnits = (units: OrgEditorUnit[]) =>
  units.map((unit) => snapOrgEditorPoint(unit));

export const getAdaptiveOrgEditorGridSize = (scale: number) => {
  const normalizedScale = Number.isFinite(scale) && scale > 0 ? scale : 1;
  const minimumMultiplier =
    ORG_EDITOR_GRID_MIN_SCREEN_SIZE / (ORG_EDITOR_GRID_SIZE * normalizedScale);
  const multiplier = 2 ** Math.max(0, Math.ceil(Math.log2(minimumMultiplier)));

  return ORG_EDITOR_GRID_SIZE * multiplier;
};

export const createOrgEditorUnitId = () => createUuid();

export const normalizeOrgEditorUnitNoteMarkdown = (value: string): string | null => {
  const normalized = value.replace(/\r\n?/gu, "\n");
  if (new TextEncoder().encode(normalized).byteLength > ORG_EDITOR_UNIT_NOTE_MAX_UTF8_BYTES) {
    return null;
  }
  return normalized.trim() ? normalized : "";
};

export const normalizeOrgEditorOpenPositionTitle = (value: string) =>
  value.normalize("NFKC").trim().replace(/\s+/gu, " ");

const employeeRowLayoutSourceByUnitId = new Map<
  OrgEditorUnitId,
  { heightByRowKey: ReadonlyMap<string, number>; orderedRows: readonly OrgEditorUnitRow[] }
>();
const tagFooterHeightByUnitId = new Map<OrgEditorUnitId, number>();

export const buildOrgEditorUnitTagSummary = (
  unit: Pick<OrgEditorUnit, "employeeIds">,
  employeeById: ReadonlyMap<EmployeeId, Employee>,
  tagOrder: readonly TagId[],
): OrgEditorUnitTagSummary[] => {
  const countByTagId = new Map<TagId, number>();
  const tagById = new Map<TagId, { color: EmployeeTagColor | null; label: string }>();
  for (const employeeId of new Set(unit.employeeIds)) {
    const seen = new Set<TagId>();
    for (const tag of employeeById.get(employeeId)?.tags ?? []) {
      if (!tag.tagId || seen.has(tag.tagId)) continue;
      seen.add(tag.tagId);
      countByTagId.set(tag.tagId, (countByTagId.get(tag.tagId) ?? 0) + 1);
      tagById.set(tag.tagId, { color: tag.color ?? null, label: tag.label });
    }
  }
  const orderByTagId = new Map(tagOrder.map((tagId, index) => [tagId, index]));
  return [...countByTagId]
    .map(([tagId, count]) => ({
      color: tagById.get(tagId)?.color ?? null,
      count,
      label: tagById.get(tagId)?.label ?? "",
      tagId,
    }))
    .sort(
      (first, second) =>
        (orderByTagId.get(first.tagId) ?? Number.MAX_SAFE_INTEGER) -
          (orderByTagId.get(second.tagId) ?? Number.MAX_SAFE_INTEGER) ||
        first.label.localeCompare(second.label),
    );
};

export const getOrgEditorUnitTagFooterHeight = (
  summaries: readonly OrgEditorUnitTagSummary[],
  availableWidth: number,
) => createOrgEditorUnitTagFooterLayout(summaries, availableWidth).height;

export const createOrgEditorUnitTagFooterLayout = (
  summaries: readonly OrgEditorUnitTagSummary[],
  availableWidth: number,
): OrgEditorUnitTagFooterLayout => {
  if (summaries.length === 0 || availableWidth <= 0) {
    return { chips: [], height: 0, rowCount: 0 };
  }
  const safeWidth = Math.max(1, availableWidth);
  const drafts = summaries.map((summary) =>
    createOrgEditorUnitTagFooterChipDraft(summary, safeWidth),
  );
  const chips: OrgEditorUnitTagFooterChipLayout[] = [];
  let rowCount = 1;
  let rowHeight = 0;
  let x = ORG_EDITOR_UNIT_TAG_FOOTER_PADDING;
  let y = ORG_EDITOR_UNIT_TAG_FOOTER_PADDING;

  for (const draft of drafts) {
    const rowStart = ORG_EDITOR_UNIT_TAG_FOOTER_PADDING;
    const rowEnd = rowStart + safeWidth;
    if (x > rowStart && x + draft.width > rowEnd) {
      y += rowHeight + ORG_EDITOR_UNIT_TAG_FOOTER_GAP;
      x = rowStart;
      rowHeight = 0;
      rowCount += 1;
    }
    chips.push({
      color: draft.color,
      count: draft.count,
      height: draft.height,
      label: draft.label,
      lines: draft.lines,
      tagId: draft.tagId,
      width: draft.width,
      x,
      y,
    });
    rowHeight = Math.max(rowHeight, draft.height);
    x += draft.width + ORG_EDITOR_UNIT_TAG_FOOTER_GAP;
  }

  return {
    chips,
    height: y + rowHeight + ORG_EDITOR_UNIT_TAG_FOOTER_PADDING,
    rowCount,
  };
};

export const getOrgEditorUnitTagFooterChipWidth = (
  summary: Pick<OrgEditorUnitTagSummary, "count" | "label">,
  availableWidth: number,
) =>
  createOrgEditorUnitTagFooterChipDraft(
    { color: null, count: summary.count, label: summary.label, tagId: "" },
    availableWidth,
  ).width;

export const setOrgEditorUnitTagFooterHeight = (unitId: OrgEditorUnitId, height: number): void => {
  tagFooterHeightByUnitId.set(unitId, height);
};

export const packOrgEditorTagLabels = (
  labels: readonly string[],
  availableWidth: number,
): number => {
  if (labels.length === 0) return 0;
  let rows = 1;
  let usedWidth = 0;
  for (const label of labels) {
    const chipWidth = getOrgEditorTagChipWidth(label, availableWidth);
    const nextWidth =
      usedWidth === 0 ? chipWidth : usedWidth + ORG_EDITOR_EMPLOYEE_TAG_GAP + chipWidth;
    if (usedWidth > 0 && nextWidth > availableWidth) {
      rows += 1;
      usedWidth = chipWidth;
    } else {
      usedWidth = nextWidth;
    }
  }
  return rows;
};

export const getOrgEditorTagChipWidth = (label: string, availableWidth: number) =>
  Math.min(
    availableWidth,
    Math.max(
      24,
      ORG_EDITOR_EMPLOYEE_TAG_STYLE.horizontalPadding * 2 +
        label.length * ORG_EDITOR_EMPLOYEE_TAG_STYLE.widthPerCharacter,
    ),
  );

export const getOrgEditorEmployeeRowHeightForTagLabels = (
  labels: readonly string[],
  availableWidth: number,
) =>
  ORG_EDITOR_EMPLOYEE_ROW_HEIGHT +
  Math.max(0, packOrgEditorTagLabels(labels, availableWidth) - 1) *
    ORG_EDITOR_EMPLOYEE_TAG_ROW_HEIGHT;

export const getOrgEditorEmployeeRowHeightForDisplayLines = (lineCount: number) =>
  Math.max(
    ORG_EDITOR_EMPLOYEE_ROW_HEIGHT,
    Math.max(0, lineCount) * ORG_EDITOR_EMPLOYEE_NAME_LINE_HEIGHT +
      ORG_EDITOR_EMPLOYEE_CONTENT_VERTICAL_PADDING,
  );

export const getOrgEditorEmployeeRichVisualLineCount = (
  lines: readonly EmployeeDisplayLine[],
  availableWidth: number,
  formatTag: (tag: EmployeeTag) => string = (tag) => tag.label,
) =>
  lines.reduce((total, line) => {
    let lineRows = 1;
    for (const node of line.nodes) {
      if (node.type === "tags") {
        lineRows = Math.max(
          lineRows,
          packOrgEditorTagLabels(node.tags.map(formatTag), availableWidth),
        );
      }
      if (node.type === "positions") {
        lineRows = Math.max(
          lineRows,
          packOrgEditorTagLabels(
            node.positions.map(getEmployeeDisplayPositionText),
            availableWidth,
          ),
        );
      }
    }
    return total + lineRows;
  }, 0);

export const getOrgEditorEmployeeRowHeightForRichLines = (
  lines: readonly EmployeeDisplayLine[],
  availableWidth: number,
  formatTag?: (tag: EmployeeTag) => string,
) =>
  getOrgEditorEmployeeRowHeightForDisplayLines(
    getOrgEditorEmployeeRichVisualLineCount(lines, availableWidth, formatTag),
  );

export const getOrgEditorEmployeeDisplayLineBaselines = ({
  employeeRowHeight,
  employeeRowOffset,
  lineCount,
  unitY,
}: {
  employeeRowHeight: number;
  employeeRowOffset: number;
  lineCount: number;
  unitY: number;
}) => {
  const rowTop =
    unitY +
    ORG_EDITOR_UNIT_BORDER_WIDTH +
    ORG_EDITOR_UNIT_HEADER_HEIGHT +
    ORG_EDITOR_UNIT_EMPLOYEE_LIST_TOP_PADDING +
    employeeRowOffset;
  const contentHeight = lineCount * ORG_EDITOR_EMPLOYEE_NAME_LINE_HEIGHT;
  const contentTop = rowTop + (employeeRowHeight - contentHeight) / 2;
  return Array.from(
    { length: lineCount },
    (_, index) =>
      contentTop +
      index * ORG_EDITOR_EMPLOYEE_NAME_LINE_HEIGHT +
      (ORG_EDITOR_EMPLOYEE_NAME_LINE_HEIGHT + ORG_EDITOR_EMPLOYEE_NAME_FONT_SIZE) / 2 -
      1,
  );
};

export const getOrgEditorEmployeeTextMaxWidth = (unitWidth: number) =>
  Math.max(
    0,
    unitWidth -
      ORG_EDITOR_UNIT_BORDER_WIDTH * 2 -
      ORG_EDITOR_UNIT_EMPLOYEE_LIST_HORIZONTAL_PADDING * 2 -
      ORG_EDITOR_EMPLOYEE_ROW_HORIZONTAL_PADDING * 2 -
      ORG_EDITOR_EMPLOYEE_AVATAR_SIZE -
      ORG_EDITOR_EMPLOYEE_CONTENT_GAP -
      ORG_EDITOR_EMPLOYEE_CONTENT_RIGHT_PADDING,
  );

export const getOrgEditorEmployeeVisualGeometry = ({
  employeeRowHeight,
  employeeRowOffset,
  tagBlockHeight,
  tagRowCount,
  unitWidth,
  unitX,
  unitY,
}: {
  employeeRowHeight: number;
  employeeRowOffset: number;
  tagBlockHeight?: number;
  tagRowCount: number;
  unitWidth: number;
  unitX: number;
  unitY: number;
}) => {
  const rowTop =
    unitY +
    ORG_EDITOR_UNIT_BORDER_WIDTH +
    ORG_EDITOR_UNIT_HEADER_HEIGHT +
    ORG_EDITOR_UNIT_EMPLOYEE_LIST_TOP_PADDING +
    employeeRowOffset;
  const avatarX =
    unitX +
    ORG_EDITOR_UNIT_BORDER_WIDTH +
    ORG_EDITOR_UNIT_EMPLOYEE_LIST_HORIZONTAL_PADDING +
    ORG_EDITOR_EMPLOYEE_ROW_HORIZONTAL_PADDING +
    ORG_EDITOR_EMPLOYEE_AVATAR_SIZE / 2;
  const textX =
    unitX +
    ORG_EDITOR_UNIT_BORDER_WIDTH +
    ORG_EDITOR_UNIT_EMPLOYEE_LIST_HORIZONTAL_PADDING +
    ORG_EDITOR_EMPLOYEE_ROW_HORIZONTAL_PADDING +
    ORG_EDITOR_EMPLOYEE_AVATAR_SIZE +
    ORG_EDITOR_EMPLOYEE_CONTENT_GAP;
  const resolvedTagBlockHeight =
    tagBlockHeight ??
    (tagRowCount === 0
      ? 0
      : tagRowCount * ORG_EDITOR_EMPLOYEE_TAG_STYLE.height +
        (tagRowCount - 1) * ORG_EDITOR_EMPLOYEE_TAG_STYLE.gap);
  const contentHeight =
    ORG_EDITOR_EMPLOYEE_NAME_LINE_HEIGHT +
    (resolvedTagBlockHeight === 0 ? 0 : 2 + resolvedTagBlockHeight);
  const contentTop = rowTop + (employeeRowHeight - contentHeight) / 2;

  return {
    avatarX,
    avatarY: rowTop + employeeRowHeight / 2,
    rowTop,
    tagY: contentTop + ORG_EDITOR_EMPLOYEE_NAME_LINE_HEIGHT + 2,
    textBaselineY:
      contentTop +
      (ORG_EDITOR_EMPLOYEE_NAME_LINE_HEIGHT + ORG_EDITOR_EMPLOYEE_NAME_FONT_SIZE) / 2 -
      1,
    textMaxWidth: getOrgEditorEmployeeTextMaxWidth(unitWidth),
    textX,
  };
};

export const getOrgEditorEmployeeRowSurfaceBounds = ({
  employeeRowHeight,
  employeeRowOffset,
  unit,
}: {
  employeeRowHeight: number;
  employeeRowOffset: number;
  unit: OrgEditorUnit;
}) => ({
  height: employeeRowHeight,
  width:
    getOrgEditorUnitWidth(unit) -
    ORG_EDITOR_UNIT_BORDER_WIDTH * 2 -
    ORG_EDITOR_UNIT_EMPLOYEE_LIST_HORIZONTAL_PADDING * 2,
  x: unit.x + ORG_EDITOR_UNIT_BORDER_WIDTH + ORG_EDITOR_UNIT_EMPLOYEE_LIST_HORIZONTAL_PADDING,
  y:
    unit.y +
    ORG_EDITOR_UNIT_BORDER_WIDTH +
    ORG_EDITOR_UNIT_HEADER_HEIGHT +
    ORG_EDITOR_UNIT_EMPLOYEE_LIST_TOP_PADDING +
    employeeRowOffset,
});

export const setOrgEditorUnitEmployeeRowHeights = (
  unitId: OrgEditorUnitId,
  heights: ReadonlyMap<EmployeeId, number>,
  orderedEmployeeIds: readonly EmployeeId[],
): void => {
  employeeRowLayoutSourceByUnitId.set(unitId, {
    heightByRowKey: new Map(
      [...heights].map(([employeeId, height]) => [
        createOrgEditorEmployeeRowKey(employeeId),
        height,
      ]),
    ),
    orderedRows: orderedEmployeeIds.map((employeeId) => ({
      employeeId,
      key: createOrgEditorEmployeeRowKey(employeeId),
      type: "employee" as const,
    })),
  });
};

export const setOrgEditorUnitRowHeights = (
  unitId: OrgEditorUnitId,
  heights: ReadonlyMap<string, number>,
  orderedRows: readonly OrgEditorUnitRow[],
): void => {
  employeeRowLayoutSourceByUnitId.set(unitId, {
    heightByRowKey: new Map(heights),
    orderedRows: [...orderedRows],
  });
};

export type OrgEditorEmployeeRowLayout = {
  heights: number[];
  offsets: number[];
  rows: OrgEditorUnitRow[];
  totalHeight: number;
};

export const getOrgEditorEmployeeRowStackLayout = (heights: readonly number[]) => {
  const offsets: number[] = [];
  let totalHeight = 0;
  for (const [index, height] of heights.entries()) {
    if (index > 0) totalHeight += ORG_EDITOR_EMPLOYEE_ROW_GAP;
    offsets.push(totalHeight);
    totalHeight += height;
  }
  return { offsets, totalHeight };
};

export const getOrgEditorEmployeeRowLayout = (
  unit: Pick<
    OrgEditorUnit,
    "bossEmployeeId" | "collapsed" | "employeeIds" | "id" | "openPositions"
  >,
): OrgEditorEmployeeRowLayout => {
  const source = employeeRowLayoutSourceByUnitId.get(unit.id);
  const orderedRows = source?.orderedRows ?? [
    ...unit.employeeIds.map((employeeId) => ({
      employeeId,
      key: createOrgEditorEmployeeRowKey(employeeId),
      type: "employee" as const,
    })),
    ...unit.openPositions.map((openPosition) => ({
      key: createOrgEditorOpenPositionRowKey(openPosition.id),
      openPosition,
      type: "openPosition" as const,
    })),
  ];
  const rows = unit.collapsed
    ? orderedRows
        .filter((row) => row.type === "employee" && row.employeeId === unit.bossEmployeeId)
        .slice(0, 1)
    : [...orderedRows];
  const heightByRowKey = source?.heightByRowKey;
  const heights = rows.map((row) => heightByRowKey?.get(row.key) ?? ORG_EDITOR_EMPLOYEE_ROW_HEIGHT);
  const { offsets, totalHeight } = getOrgEditorEmployeeRowStackLayout(heights);
  return { heights, offsets, rows, totalHeight };
};

export const findOrgEditorEmployeeRowIndex = (
  layout: OrgEditorEmployeeRowLayout,
  offset: number,
): number => {
  let low = 0;
  let high = layout.offsets.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    const rowEnd = (layout.offsets[middle] ?? 0) + (layout.heights[middle] ?? 0);
    if (rowEnd < offset) low = middle + 1;
    else high = middle;
  }
  return low;
};

export const createDefaultOrgEditorViewSettings = (): OrgEditorViewSettings => ({
  groupByTag: true,
  showTagCloud: true,
  distributedColor: "green",
  undistributedColor: "amber",
});

export const createDefaultOrgEditorState = (): OrgEditorState => {
  return {
    canvasElements: [],
    settings: createDefaultOrgEditorViewSettings(),
    distributionModeUnitIds: [],
    layoutMode: ORG_EDITOR_DEFAULT_LAYOUT_MODE,
    selectedItems: [],
    units: [],
    viewport: ORG_EDITOR_CANVAS_DEFAULT_VIEWPORT,
  };
};

export const createOrgEditorSelectedItemKey = (item: OrgEditorSelectedItem) =>
  item.type === "unit"
    ? `unit:${item.unitId}`
    : item.type === "employee"
      ? `employee:${item.unitId}:${item.employeeId}`
      : item.type === "openPosition"
        ? `openPosition:${item.unitId}:${item.openPositionId}`
        : `element:${item.elementId}`;

export const getOrgEditorUnitWidth = (unit: Pick<OrgEditorUnit, "name">) =>
  Math.max(ORG_EDITOR_UNIT_MIN_WIDTH, 124 + getOrgEditorUnitDisplayName(unit).length * 9);

export const getOrgEditorUnitVisibleEmployeeCount = (
  unit: Pick<OrgEditorUnit, "bossEmployeeId" | "collapsed" | "employeeIds" | "openPositions">,
) => {
  if (!unit.collapsed) return Math.max(1, unit.employeeIds.length + unit.openPositions.length);

  return unit.bossEmployeeId !== null && unit.employeeIds.includes(unit.bossEmployeeId) ? 1 : 0;
};

export const getOrgEditorUnitHeightForEmployeeRows = ({
  collapsed,
  employeeRowHeights,
}: {
  collapsed: boolean;
  employeeRowHeights: readonly number[];
}) => {
  if (collapsed && employeeRowHeights.length === 0) return ORG_EDITOR_UNIT_COLLAPSED_HEIGHT;

  return Math.max(
    collapsed ? ORG_EDITOR_UNIT_COLLAPSED_HEIGHT : ORG_EDITOR_UNIT_MIN_HEIGHT,
    ORG_EDITOR_UNIT_HEADER_HEIGHT +
      ORG_EDITOR_UNIT_VERTICAL_PADDING +
      getOrgEditorEmployeeRowStackLayout(employeeRowHeights).totalHeight,
  );
};

export const getOrgEditorUnitHeight = (
  unit: Pick<
    OrgEditorUnit,
    "bossEmployeeId" | "collapsed" | "employeeIds" | "id" | "openPositions"
  >,
) => {
  const rowLayout = getOrgEditorEmployeeRowLayout(unit);
  return (
    getOrgEditorUnitHeightForEmployeeRows({
      collapsed: unit.collapsed,
      employeeRowHeights: rowLayout.heights,
    }) + (unit.collapsed ? 0 : (tagFooterHeightByUnitId.get(unit.id) ?? 0))
  );
};

export const getOrgEditorUnitDisplayName = (unit: Pick<OrgEditorUnit, "name">) =>
  unit.name.trim() || "Untitled";

export const getOrgEditorUnitBounds = (unit: OrgEditorUnit) => ({
  height: getOrgEditorUnitHeight(unit),
  width: getOrgEditorUnitWidth(unit),
  x: unit.x,
  y: unit.y,
});

export const getOrgEditorEmployeeBounds = (unit: OrgEditorUnit, employeeIndex: number) => ({
  height:
    (getOrgEditorEmployeeRowLayout(unit).heights[employeeIndex] ?? ORG_EDITOR_EMPLOYEE_ROW_HEIGHT) -
    6,
  width: getOrgEditorUnitWidth(unit) - 28,
  x: unit.x + 14,
  y:
    unit.y +
    ORG_EDITOR_UNIT_HEADER_HEIGHT +
    ORG_EDITOR_UNIT_EMPLOYEE_LIST_TOP_PADDING +
    (getOrgEditorEmployeeRowLayout(unit).offsets[employeeIndex] ??
      employeeIndex * ORG_EDITOR_EMPLOYEE_ROW_HEIGHT),
});

export const getOrgEditorUnitRowBounds = getOrgEditorEmployeeBounds;

type MeasuredOrgEditorLayoutTree = {
  placements: Array<{
    center: number;
    depth: number;
    unit: OrgEditorUnit;
  }>;
  rootCenter: number;
  span: number;
};

export const layoutOrgEditorUnits = (
  units: OrgEditorUnit[],
  layoutMode: OrgEditorLayoutMode,
  origin?: { x: number; y: number },
) => {
  if (units.length === 0) return [];

  const unitBounds = units.map(getOrgEditorUnitBounds);
  const layoutOrigin = origin ?? {
    x: Math.min(...unitBounds.map((bounds) => bounds.x)),
    y: Math.min(...unitBounds.map((bounds) => bounds.y)),
  };
  const roots = buildOrgEditorUnitTree(units);
  const placements = new Map<OrgEditorUnitId, { center: number; depth: number }>();
  const maxHeightByDepth = new Map<number, number>();
  const maxWidthByDepth = new Map<number, number>();
  const breadthGap =
    layoutMode === "leftRight" ? ORG_EDITOR_UNIT_VERTICAL_GAP : ORG_EDITOR_UNIT_HORIZONTAL_GAP;

  const measureNode = (node: OrgEditorUnitTreeNode, depth: number): MeasuredOrgEditorLayoutTree => {
    const nodeHeight = getOrgEditorUnitHeight(node.unit);
    const nodeWidth = getOrgEditorUnitWidth(node.unit);
    const nodeBreadth = layoutMode === "leftRight" ? nodeHeight : nodeWidth;
    maxHeightByDepth.set(depth, Math.max(maxHeightByDepth.get(depth) ?? 0, nodeHeight));
    maxWidthByDepth.set(depth, Math.max(maxWidthByDepth.get(depth) ?? 0, nodeWidth));

    if (node.children.length === 0) {
      const rootCenter = nodeBreadth / 2;

      return {
        placements: [{ center: rootCenter, depth, unit: node.unit }],
        rootCenter,
        span: nodeBreadth,
      };
    }

    const measuredChildren = node.children.map((childNode) => measureNode(childNode, depth + 1));
    const childrenSpan =
      measuredChildren.reduce((span, measuredChild) => span + measuredChild.span, 0) +
      breadthGap * Math.max(0, measuredChildren.length - 1);
    let span = Math.max(nodeBreadth, childrenSpan);
    let childCursor = (span - childrenSpan) / 2;
    const childRootCenters: number[] = [];
    const placements: MeasuredOrgEditorLayoutTree["placements"] = [];

    for (const measuredChild of measuredChildren) {
      childRootCenters.push(measuredChild.rootCenter + childCursor);
      placements.push(
        ...measuredChild.placements.map((placement) => ({
          ...placement,
          center: placement.center + childCursor,
        })),
      );
      childCursor += measuredChild.span + breadthGap;
    }

    let rootCenter = (Math.min(...childRootCenters) + Math.max(...childRootCenters)) / 2;
    const rootLeft = rootCenter - nodeBreadth / 2;
    let rootRight = rootCenter + nodeBreadth / 2;

    if (rootLeft < 0) {
      const offset = -rootLeft;

      rootCenter += offset;
      rootRight += offset;
      span += offset;
      for (const placement of placements) {
        placement.center += offset;
      }
    }

    if (rootRight > span) {
      span = rootRight;
    }

    placements.push({ center: rootCenter, depth, unit: node.unit });

    return { placements, rootCenter, span };
  };

  let rootCursor = 0;
  for (const rootNode of roots) {
    const measuredRoot = measureNode(rootNode, 0);

    for (const placement of measuredRoot.placements) {
      placements.set(placement.unit.id, {
        center: placement.center + rootCursor,
        depth: placement.depth,
      });
    }

    rootCursor += measuredRoot.span + ORG_EDITOR_UNIT_ROOT_GAP;
  }

  const depthOffsets = new Map<number, number>();
  let currentDepthOffset = 0;
  const maxDepth = Math.max(...[...placements.values()].map((placement) => placement.depth));

  for (let depth = 0; depth <= maxDepth; depth += 1) {
    depthOffsets.set(depth, currentDepthOffset);
    currentDepthOffset +=
      (layoutMode === "leftRight"
        ? (maxWidthByDepth.get(depth) ?? ORG_EDITOR_UNIT_MIN_WIDTH)
        : (maxHeightByDepth.get(depth) ?? ORG_EDITOR_UNIT_MIN_HEIGHT)) + ORG_EDITOR_UNIT_LAYER_GAP;
  }

  const now = new Date().toISOString();

  return units.map((unit) => {
    const placement = placements.get(unit.id);
    if (!placement) return unit;

    if (layoutMode === "leftRight") {
      return snapOrgEditorPoint({
        ...unit,
        updatedAt: now,
        x: layoutOrigin.x + (depthOffsets.get(placement.depth) ?? 0),
        y: layoutOrigin.y + placement.center - getOrgEditorUnitHeight(unit) / 2,
      });
    }

    return snapOrgEditorPoint({
      ...unit,
      updatedAt: now,
      x: layoutOrigin.x + placement.center - getOrgEditorUnitWidth(unit) / 2,
      y: layoutOrigin.y + (depthOffsets.get(placement.depth) ?? 0),
    });
  });
};

export const isPointInsideRect = (
  point: { x: number; y: number },
  rect: { height: number; width: number; x: number; y: number },
) =>
  point.x >= rect.x &&
  point.x <= rect.x + rect.width &&
  point.y >= rect.y &&
  point.y <= rect.y + rect.height;

export const doRectsIntersect = (
  firstRect: { height: number; width: number; x: number; y: number },
  secondRect: { height: number; width: number; x: number; y: number },
) =>
  firstRect.x < secondRect.x + secondRect.width &&
  firstRect.x + firstRect.width > secondRect.x &&
  firstRect.y < secondRect.y + secondRect.height &&
  firstRect.y + firstRect.height > secondRect.y;

export const buildOrgEditorUnitTree = (units: OrgEditorUnit[]): OrgEditorUnitTreeNode[] => {
  const childrenByParentId = new Map<OrgEditorUnitId | null, OrgEditorUnit[]>();

  for (const unit of units) {
    const currentChildren = childrenByParentId.get(unit.parentId) ?? [];

    currentChildren.push(unit);
    childrenByParentId.set(unit.parentId, currentChildren);
  }

  for (const children of childrenByParentId.values()) {
    children.sort((firstUnit, secondUnit) => {
      const orderComparison = firstUnit.order - secondUnit.order;

      return orderComparison !== 0
        ? orderComparison
        : String(firstUnit.id).localeCompare(String(secondUnit.id));
    });
  }

  const buildNode = (
    unit: OrgEditorUnit,
    visitedUnitIds: Set<OrgEditorUnitId>,
  ): OrgEditorUnitTreeNode => {
    if (visitedUnitIds.has(unit.id)) {
      return { children: [], unit } satisfies OrgEditorUnitTreeNode;
    }

    const nextVisitedUnitIds = new Set(visitedUnitIds);
    nextVisitedUnitIds.add(unit.id);

    return {
      children: (childrenByParentId.get(unit.id) ?? []).map((childUnit) =>
        buildNode(childUnit, nextVisitedUnitIds),
      ),
      unit,
    } satisfies OrgEditorUnitTreeNode;
  };

  return (childrenByParentId.get(null) ?? []).map((unit) => buildNode(unit, new Set()));
};

export const buildOrgEditorUnitEmployeeSummaryById = (units: OrgEditorUnit[]) => {
  const unitById = new Map(units.map((unit) => [unit.id, unit] as const));
  const childrenByParentId = new Map<OrgEditorUnitId | null, OrgEditorUnit[]>();
  const summaryByUnitId = new Map<OrgEditorUnitId, OrgEditorUnitEmployeeSummary>();

  for (const unit of units) {
    const parentId = unit.parentId && unitById.has(unit.parentId) ? unit.parentId : null;
    const siblings = childrenByParentId.get(parentId) ?? [];

    siblings.push(unit);
    childrenByParentId.set(parentId, siblings);
  }

  const collectUnitSummary = (
    unit: OrgEditorUnit,
    visitedUnitIds: ReadonlySet<OrgEditorUnitId>,
  ) => {
    if (visitedUnitIds.has(unit.id)) {
      return new Set<EmployeeId>();
    }

    const nextVisitedUnitIds = new Set(visitedUnitIds);
    nextVisitedUnitIds.add(unit.id);

    const ownUniqueEmployeeIds = new Set(unit.employeeIds);
    const totalEmployeeIds = new Set(ownUniqueEmployeeIds);
    const childUnits = childrenByParentId.get(unit.id) ?? [];

    for (const childUnit of childUnits) {
      for (const employeeId of collectUnitSummary(childUnit, nextVisitedUnitIds)) {
        totalEmployeeIds.add(employeeId);
      }
    }

    summaryByUnitId.set(unit.id, {
      directCount: ownUniqueEmployeeIds.size,
      hasChildUnits: childUnits.length > 0,
      totalCount: totalEmployeeIds.size,
    });

    return totalEmployeeIds;
  };

  for (const rootUnit of childrenByParentId.get(null) ?? []) {
    collectUnitSummary(rootUnit, new Set());
  }

  for (const unit of units) {
    if (!summaryByUnitId.has(unit.id)) {
      summaryByUnitId.set(unit.id, {
        directCount: new Set(unit.employeeIds).size,
        hasChildUnits: false,
        totalCount: new Set(unit.employeeIds).size,
      });
    }
  }

  return summaryByUnitId;
};

export const getOrgEditorUnitDescendantIds = (units: OrgEditorUnit[], unitId: OrgEditorUnitId) => {
  const childrenByParentId = new Map<OrgEditorUnitId | null, OrgEditorUnit[]>();

  for (const unit of units) {
    const currentChildren = childrenByParentId.get(unit.parentId) ?? [];

    currentChildren.push(unit);
    childrenByParentId.set(unit.parentId, currentChildren);
  }

  const descendantIds: OrgEditorUnitId[] = [];
  const stack = [unitId];
  const visitedUnitIds = new Set<OrgEditorUnitId>();

  while (stack.length > 0) {
    const currentUnitId = stack.pop();

    if (!currentUnitId || visitedUnitIds.has(currentUnitId)) continue;

    visitedUnitIds.add(currentUnitId);
    descendantIds.push(currentUnitId);

    for (const childUnit of childrenByParentId.get(currentUnitId) ?? []) {
      stack.push(childUnit.id);
    }
  }

  return descendantIds;
};

export const sortOrgEditorEmployeeIds = ({
  bossEmployeeId,
  employeeById,
  employeeIds,
  groupByTag = false,
}: {
  groupByTag?: boolean;
  bossEmployeeId: EmployeeId | null;
  employeeById: ReadonlyMap<EmployeeId, Employee>;
  employeeIds: EmployeeId[];
}) =>
  [...employeeIds].sort((firstEmployeeId, secondEmployeeId) => {
    if (firstEmployeeId === bossEmployeeId) return -1;
    if (secondEmployeeId === bossEmployeeId) return 1;

    const firstEmployee = employeeById.get(firstEmployeeId);
    const secondEmployee = employeeById.get(secondEmployeeId);
    if (groupByTag) {
      const priority =
        (firstEmployee?.tagPriority ?? Number.MAX_SAFE_INTEGER) -
        (secondEmployee?.tagPriority ?? Number.MAX_SAFE_INTEGER);
      if (priority !== 0) return priority;
    }
    const nameCompare = (firstEmployee?.fullName ?? "").localeCompare(
      secondEmployee?.fullName ?? "",
      "en-US",
      { numeric: true, sensitivity: "base" },
    );

    return (
      nameCompare ||
      String(firstEmployeeId).localeCompare(String(secondEmployeeId), "en-US", {
        numeric: true,
        sensitivity: "base",
      })
    );
  });

export const getOrgEditorOrderedEmployeeIds = (
  unit: OrgEditorUnit,
  employeeById: ReadonlyMap<EmployeeId, Employee>,
  groupByTag: boolean,
) =>
  sortOrgEditorEmployeeIds({
    bossEmployeeId: unit.bossEmployeeId,
    employeeById,
    employeeIds: unit.employeeIds,
    groupByTag,
  });

export const getOrgEditorOrderedUnitRows = (
  unit: OrgEditorUnit,
  employeeById: ReadonlyMap<EmployeeId, Employee>,
  groupByTag: boolean,
  tagOrder: readonly TagId[] = [],
): OrgEditorUnitRow[] => {
  const tagRankById = new Map(tagOrder.map((tagId, index) => [tagId, index]));
  const rows: OrgEditorUnitRow[] = [
    ...unit.employeeIds.map((employeeId) => ({
      employeeId,
      key: createOrgEditorEmployeeRowKey(employeeId),
      type: "employee" as const,
    })),
    ...unit.openPositions.map((openPosition) => ({
      key: createOrgEditorOpenPositionRowKey(openPosition.id),
      openPosition,
      type: "openPosition" as const,
    })),
  ];
  const priority = (row: OrgEditorUnitRow) => {
    if (!groupByTag) return Number.MAX_SAFE_INTEGER;
    if (row.type === "employee") {
      return employeeById.get(row.employeeId)?.tagPriority ?? Number.MAX_SAFE_INTEGER;
    }
    return row.openPosition.tags.reduce(
      (best, assignment) => Math.min(best, tagRankById.get(assignment.tagId) ?? best),
      Number.MAX_SAFE_INTEGER,
    );
  };
  const label = (row: OrgEditorUnitRow) =>
    row.type === "employee"
      ? (employeeById.get(row.employeeId)?.fullName ?? "")
      : row.openPosition.title;
  const id = (row: OrgEditorUnitRow) =>
    row.type === "employee" ? row.employeeId : row.openPosition.id;

  return rows.sort((first, second) => {
    if (first.type === "employee" && first.employeeId === unit.bossEmployeeId) return -1;
    if (second.type === "employee" && second.employeeId === unit.bossEmployeeId) return 1;
    const priorityDifference = priority(first) - priority(second);
    if (priorityDifference !== 0) return priorityDifference;
    return (
      label(first).localeCompare(label(second), "en-US", { numeric: true, sensitivity: "base" }) ||
      id(first).localeCompare(id(second), "en-US", { numeric: true, sensitivity: "base" })
    );
  });
};

export const getOrgEditorEmployeePosition = (
  unit: Pick<OrgEditorUnit, "employeePositions">,
  employeeId: EmployeeId,
) =>
  unit.employeePositions.find((employeePosition) => employeePosition.employeeId === employeeId)
    ?.position ?? null;

export const getOrgEditorVisibleEmployeeIds = (
  unit: OrgEditorUnit,
  employeeById: ReadonlyMap<EmployeeId, Employee>,
  groupByTag: boolean,
) => {
  const orderedEmployeeIds = getOrgEditorOrderedEmployeeIds(unit, employeeById, groupByTag);

  if (!unit.collapsed) return orderedEmployeeIds;

  return orderedEmployeeIds.filter((employeeId) => employeeId === unit.bossEmployeeId).slice(0, 1);
};

export const getOrgEditorVisibleUnitRows = (
  unit: OrgEditorUnit,
  employeeById: ReadonlyMap<EmployeeId, Employee>,
  groupByTag: boolean,
  tagOrder: readonly TagId[] = [],
) => {
  const rows = getOrgEditorOrderedUnitRows(unit, employeeById, groupByTag, tagOrder);
  return unit.collapsed
    ? rows
        .filter((row) => row.type === "employee" && row.employeeId === unit.bossEmployeeId)
        .slice(0, 1)
    : rows;
};

export const createOrgEditorUnitFromScratch = ({
  bossEmployeeId = null,
  collapsed = false,
  employeeIds = [],
  employeePositions = [],
  id = createOrgEditorUnitId(),
  liveFilter = null,
  name,
  noteMarkdown = "",
  openPositions = [],
  order = 0,
  parentId = null,
  x,
  y,
}: {
  bossEmployeeId?: EmployeeId | null;
  collapsed?: boolean;
  employeeIds?: EmployeeId[];
  employeePositions?: OrgEditorEmployeePosition[];
  id?: OrgEditorUnitId;
  liveFilter?: OrgEditorUnit["liveFilter"];
  name: string;
  noteMarkdown?: string;
  openPositions?: OrgEditorOpenPosition[];
  order?: number;
  parentId?: OrgEditorUnitId | null;
  x: number;
  y: number;
}): OrgEditorUnit => {
  const now = new Date().toISOString();
  const uniqueEmployeeIds = liveFilter === null ? [...new Set(employeeIds)] : [];
  const employeeIdSet = new Set(uniqueEmployeeIds);
  const employeePositionByEmployeeId = new Map<EmployeeId, OrgEditorEmployeePosition>();

  for (const employeePosition of employeePositions) {
    const position = employeePosition.position?.trim() || null;

    if (liveFilter === null && (!employeeIdSet.has(employeePosition.employeeId) || !position)) {
      continue;
    }
    employeePositionByEmployeeId.set(employeePosition.employeeId, {
      employeeId: employeePosition.employeeId,
      position,
    });
  }

  return {
    bossEmployeeId,
    collapsed,
    createdAt: now,
    employeeIds: uniqueEmployeeIds,
    employeePositions: [...employeePositionByEmployeeId.values()],
    id,
    liveFilter,
    name,
    noteMarkdown: normalizeOrgEditorUnitNoteMarkdown(noteMarkdown) ?? "",
    openPositions:
      liveFilter === null
        ? openPositions.map((position) => ({
            ...position,
            tags: position.tags.map((tag) => ({ ...tag })),
            title: normalizeOrgEditorOpenPositionTitle(position.title),
          }))
        : [],
    order,
    parentId,
    updatedAt: now,
    x,
    y,
  };
};

export const createOrgEditorUnitsFromOrgUnit = ({
  employeesById,
  layoutMode = ORG_EDITOR_DEFAULT_LAYOUT_MODE,
  origin,
  rootUnit,
}: {
  employeesById?: ReadonlyMap<EmployeeId, Employee>;
  layoutMode?: OrgEditorLayoutMode;
  origin: { x: number; y: number };
  rootUnit: Unit;
}) => {
  const units: OrgEditorUnit[] = [];
  let rowIndex = 0;

  const visitUnit = (unit: Unit, depth: number, parentId: OrgEditorUnitId | null) => {
    const bossEmployeeId =
      unit.directEmployeeIds.find((employeeId) =>
        employeesById
          ?.get(employeeId)
          ?.unitPositions.some(
            (unitPosition) => unitPosition.unitId === unit.id && unitPosition.isBoss,
          ),
      ) ?? null;
    const editorUnit = createOrgEditorUnitFromScratch({
      bossEmployeeId,
      employeeIds: unit.directEmployeeIds,
      employeePositions: unit.directEmployeeIds.flatMap((employeeId) => {
        const position =
          employeesById
            ?.get(employeeId)
            ?.unitPositions.find((unitPosition) => unitPosition.unitId === unit.id)?.position ??
          null;

        return position ? [{ employeeId, position }] : [];
      }),
      name: unit.name,
      order: unit.order,
      parentId,
      x: origin.x + depth * 360,
      y: origin.y + rowIndex * 190,
    });

    rowIndex += 1;
    units.push(editorUnit);

    for (const childUnit of unit.children) {
      visitUnit(childUnit, depth + 1, editorUnit.id);
    }
  };

  visitUnit(rootUnit, 0, null);

  return layoutOrgEditorUnits(units, layoutMode, origin);
};
