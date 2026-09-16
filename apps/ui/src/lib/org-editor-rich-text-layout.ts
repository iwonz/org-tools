import type {
  OrgEditorCanvasElement,
  OrgEditorInlineTypography,
  OrgEditorRectAnchorId,
} from "@org-tools/types";

import {
  fitOrgEditorCanvasRichTextElement,
  getOrgEditorCanvasElementFont,
  getOrgEditorInlineTypography,
  getOrgEditorRichTextLayout,
  getOrgEditorTextGraphemes,
  getOrgEditorTextStyleAt,
  ORG_EDITOR_CANVAS_TEXT_AUTO_MAX_WIDTH,
  ORG_EDITOR_CANVAS_TEXT_PADDING,
  type OrgEditorRichTextLayout,
  resolveOrgEditorCanvasInlineTypography,
} from "@/lib/org-editor-canvas";
import { recordOrgEditorPerformance } from "@/lib/org-editor-performance";

type RichTextElement = Extract<OrgEditorCanvasElement, { type: "sticker" | "text" }>;

const MAX_MEASURE_CACHE_ENTRIES = 32_768;
const MAX_LAYOUT_CACHE_ENTRIES = 2_048;

const areInlineTypographiesEqual = (
  first: OrgEditorInlineTypography,
  second: OrgEditorInlineTypography,
) =>
  first.color === second.color &&
  first.fontFamily === second.fontFamily &&
  first.fontSize === second.fontSize &&
  first.fontWeight === second.fontWeight;

const areElementTypographiesEqual = (first: RichTextElement, second: RichTextElement) =>
  first.typography.color === second.typography.color &&
  first.typography.fontFamily === second.typography.fontFamily &&
  first.typography.fontSize === second.typography.fontSize &&
  first.typography.fontWeight === second.typography.fontWeight &&
  first.typography.horizontalAlign === second.typography.horizontalAlign &&
  first.typography.verticalAlign === second.typography.verticalAlign;

const areFormatRunsEqual = (first: RichTextElement, second: RichTextElement) =>
  first.formatRuns.length === second.formatRuns.length &&
  first.formatRuns.every((run, index) => {
    const candidate = second.formatRuns[index];
    return (
      candidate !== undefined &&
      run.start === candidate.start &&
      run.end === candidate.end &&
      areInlineTypographiesEqual(run.typography, candidate.typography)
    );
  });

export const createOrgEditorRichTextLayoutEngine = ({
  createContext,
  maxMeasureCacheEntries = MAX_MEASURE_CACHE_ENTRIES,
}: {
  createContext: () => CanvasRenderingContext2D | null;
  maxMeasureCacheEntries?: number;
}) => {
  let context: CanvasRenderingContext2D | null | undefined;
  let layoutByElement = new WeakMap<object, OrgEditorRichTextLayout>();
  const measureCache = new Map<string, number>();
  const latestLayoutByElementId = new Map<
    string,
    { element: RichTextElement; layout: OrgEditorRichTextLayout }
  >();

  const measure = (value: string, typography: OrgEditorInlineTypography) => {
    const font = getOrgEditorCanvasElementFont(typography);
    const key = `${font}\u0000${value}`;
    const cached = measureCache.get(key);
    if (cached !== undefined) {
      measureCache.delete(key);
      measureCache.set(key, cached);
      recordOrgEditorPerformance("textMeasureHits");
      return cached;
    }

    context ??= createContext();
    let width = [...value].length * typography.fontSize * 0.55;
    if (context) {
      context.font = font;
      width = context.measureText(value).width;
    }
    measureCache.set(key, width);
    if (measureCache.size > maxMeasureCacheEntries) {
      const oldestKey = measureCache.keys().next().value;
      if (oldestKey !== undefined) measureCache.delete(oldestKey);
    }
    recordOrgEditorPerformance("textMeasureMisses");
    return width;
  };

  const getAppendedLayout = (
    previousElement: RichTextElement,
    previousLayout: OrgEditorRichTextLayout,
    element: RichTextElement,
  ): OrgEditorRichTextLayout | null => {
    if (
      element.type !== previousElement.type ||
      element.width !== previousElement.width ||
      element.height !== previousElement.height ||
      (element.type === "text" &&
        previousElement.type === "text" &&
        element.autoWidth !== previousElement.autoWidth) ||
      (element.type === "text" &&
        element.autoWidth &&
        previousLayout.width !== ORG_EDITOR_CANVAS_TEXT_AUTO_MAX_WIDTH) ||
      !areElementTypographiesEqual(previousElement, element) ||
      !areFormatRunsEqual(previousElement, element) ||
      element.text.length <= previousElement.text.length ||
      !element.text.startsWith(previousElement.text)
    ) {
      return null;
    }
    const appendedText = element.text.slice(previousElement.text.length);
    if (appendedText.includes("\n")) return null;
    const previousLine = previousLayout.lines.at(-1);
    if (!previousLine) return null;
    const base = resolveOrgEditorCanvasInlineTypography(
      getOrgEditorInlineTypography(element.typography),
    );
    const appended = getOrgEditorTextGraphemes(appendedText).map((grapheme) => {
      const start = previousElement.text.length + grapheme.start;
      const typography = resolveOrgEditorCanvasInlineTypography(
        getOrgEditorTextStyleAt(base, element.formatRuns, start),
      );
      return {
        end: previousElement.text.length + grapheme.end,
        start,
        text: grapheme.text,
        typography: {
          ...typography,
          fontSize: typography.fontSize * previousLayout.effectiveScale,
        },
        width: measure(grapheme.text, typography) * previousLayout.effectiveScale,
      };
    });
    const appendedWidth = appended.reduce((sum, grapheme) => sum + grapheme.width, 0);
    const padding = element.type === "sticker" ? 16 : ORG_EDITOR_CANVAS_TEXT_PADDING;
    if (previousLine.width === 0 && appended.every((grapheme) => /\s/u.test(grapheme.text))) {
      return null;
    }
    if (previousLine.width + appendedWidth > previousLayout.width - padding * 2) return null;

    const nextLineHeight = Math.max(
      previousLine.height,
      ...appended.map((grapheme) => Math.ceil(grapheme.typography.fontSize * 1.25)),
    );
    if (nextLineHeight !== previousLine.height) return null;
    const nextLineWidth = previousLine.width + appendedWidth;
    const nextLineX =
      element.typography.horizontalAlign === "right"
        ? previousLayout.width - padding - nextLineWidth
        : element.typography.horizontalAlign === "center"
          ? (previousLayout.width - nextLineWidth) / 2
          : padding;
    const xDelta = nextLineX - previousLine.x;
    const nextFragments = previousLine.fragments.map((fragment) => ({
      ...fragment,
      x: fragment.x + xDelta,
      y: previousLine.y + (nextLineHeight - Math.ceil(fragment.typography.fontSize * 1.25)) / 2,
    }));
    let nextX = nextLineX + previousLine.width;
    for (const grapheme of appended) {
      const previousFragment = nextFragments.at(-1);
      if (
        previousFragment &&
        previousFragment.end === grapheme.start &&
        areInlineTypographiesEqual(previousFragment.typography, grapheme.typography)
      ) {
        previousFragment.end = grapheme.end;
        previousFragment.text += grapheme.text;
        previousFragment.width += grapheme.width;
      } else {
        nextFragments.push({
          ...grapheme,
          x: nextX,
          y: previousLine.y + (nextLineHeight - Math.ceil(grapheme.typography.fontSize * 1.25)) / 2,
        });
      }
      nextX += grapheme.width;
    }
    const nextLine = {
      fragments: nextFragments,
      height: nextLineHeight,
      width: nextLineWidth,
      x: nextLineX,
      y: previousLine.y,
    };
    return {
      contentHeight: previousLayout.contentHeight,
      effectiveScale: previousLayout.effectiveScale,
      height: previousLayout.height,
      lines: [...previousLayout.lines.slice(0, -1), nextLine],
      width: previousLayout.width,
    };
  };

  const rememberLayout = (element: RichTextElement, layout: OrgEditorRichTextLayout) => {
    latestLayoutByElementId.delete(element.id);
    latestLayoutByElementId.set(element.id, { element, layout });
    if (latestLayoutByElementId.size > MAX_LAYOUT_CACHE_ENTRIES) {
      const oldestId = latestLayoutByElementId.keys().next().value;
      if (oldestId !== undefined) latestLayoutByElementId.delete(oldestId);
    }
  };

  const getLayout = (element: RichTextElement): OrgEditorRichTextLayout => {
    const cached = layoutByElement.get(element);
    if (cached) return cached;
    recordOrgEditorPerformance("richTextLayoutComputations");
    const previous = latestLayoutByElementId.get(element.id);
    const layout =
      (previous && getAppendedLayout(previous.element, previous.layout, element)) ||
      getOrgEditorRichTextLayout({
        autoWidth: element.type === "text" && element.autoWidth,
        formatRuns: element.formatRuns,
        height: element.height,
        measure,
        mode: element.type,
        text: element.text,
        typography: element.typography,
        width: element.width,
      });
    layoutByElement.set(element, layout);
    rememberLayout(element, layout);
    return layout;
  };

  return {
    fit<Element extends RichTextElement>(
      element: Element,
      preserveAnchorId: OrgEditorRectAnchorId | null = null,
    ): Element {
      return fitOrgEditorCanvasRichTextElement(element, measure, preserveAnchorId);
    },
    getLayout,
    getMeasureCacheSize: () => measureCache.size,
    invalidateFonts(): void {
      context = undefined;
      layoutByElement = new WeakMap();
      latestLayoutByElementId.clear();
      measureCache.clear();
      recordOrgEditorPerformance("fontInvalidations");
    },
  };
};

export const orgEditorRichTextLayoutEngine = createOrgEditorRichTextLayoutEngine({
  createContext: () =>
    typeof document === "undefined" ? null : document.createElement("canvas").getContext("2d"),
});

const fontLoadByRequest = new Map<string, Promise<unknown>>();

export const loadOrgEditorCanvasFonts = async (requests: readonly string[]) => {
  if (typeof document === "undefined" || !document.fonts) return false;
  let addedRequest = false;
  await Promise.all(
    requests.filter(Boolean).map((request) => {
      const pending = fontLoadByRequest.get(request);
      if (pending) return pending;
      const load = document.fonts.load(request);
      fontLoadByRequest.set(request, load);
      addedRequest = true;
      return load;
    }),
  );
  return addedRequest;
};
