"use client";

import type {
  OrgEditorCanvasElement,
  OrgEditorCanvasElementId,
  OrgEditorInlineTypography,
  OrgEditorRectAnchorId,
  OrgEditorTextFormatRun,
} from "@org-tools/types";
import Image from "next/image";
import { type CSSProperties, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { useUiText } from "@/i18n/use-ui-text";
import {
  getOrgEditorArrowControlPoints,
  getOrgEditorCanvasCssFontFamily,
  getOrgEditorCanvasElementFont,
  getOrgEditorCanvasImagePlaceholderPoints,
  getOrgEditorCanvasTextLayout,
  getOrgEditorInlineTypography,
  getOrgEditorRichTextLayout,
  getOrgEditorTextFillRects,
  getOrgEditorTextGraphemes,
  getOrgEditorTextStyleAt,
  isOrgEditorRectElement,
  normalizeOrgEditorCanvasDimension,
  ORG_EDITOR_CANVAS_ROTATE_HANDLE_IDS,
  type OrgEditorCanvasRect,
  type OrgEditorCanvasResizeHandle,
  resolveOrgEditorCanvasInlineTypography,
  resolveOrgEditorCanvasTypography,
} from "@/lib/org-editor-canvas";
import { employeeTagColorToHex, getStickerColorStyle } from "@/lib/tag-color";
import { cn } from "@/lib/utils";

export type OrgEditorCanvasElementHandle =
  | { anchorId: OrgEditorRectAnchorId; type: "attach" }
  | { anchorId: OrgEditorCanvasResizeHandle; type: "resize" }
  | {
      cornerId: (typeof ORG_EDITOR_CANVAS_ROTATE_HANDLE_IDS)[number];
      type: "rotate";
    }
  | { endpoint: "end" | "start"; type: "arrowEndpoint" }
  | { endpoint: "end" | "start"; type: "arrowControl" };

export type OrgEditorCanvasTextDraft = {
  formatRuns: OrgEditorTextFormatRun[];
  pendingTypography: OrgEditorInlineTypography | null;
  selection: { end: number; start: number };
  text: string;
};

const getContentEditableSelection = (root: HTMLElement) => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) return null;
  const offsetOf = (node: Node, offset: number) => {
    const prefix = document.createRange();
    prefix.selectNodeContents(root);
    prefix.setEnd(node, offset);
    return prefix.toString().length;
  };
  return {
    end: offsetOf(range.endContainer, range.endOffset),
    start: offsetOf(range.startContainer, range.startOffset),
  };
};

const restoreContentEditableSelection = (
  root: HTMLElement,
  selectionRange: { end: number; start: number },
) => {
  const textNodes: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) textNodes.push(node as Text);
  const resolve = (requestedOffset: number) => {
    let remaining = Math.max(0, requestedOffset);
    for (const node of textNodes) {
      if (remaining <= node.data.length) return { node, offset: remaining };
      remaining -= node.data.length;
    }
    const node = textNodes.at(-1) ?? root;
    return { node, offset: node instanceof Text ? node.data.length : node.childNodes.length };
  };
  const start = resolve(selectionRange.start);
  const end = resolve(selectionRange.end);
  const range = document.createRange();
  range.setStart(start.node, start.offset);
  range.setEnd(end.node, end.offset);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
};

const canvasUiMetric = (name: string, fallback: number) =>
  `var(--org-editor-canvas-ui-${name}, ${fallback}px)`;
const CANVAS_CORNER_RESIZE_HANDLE_IDS = ORG_EDITOR_CANVAS_ROTATE_HANDLE_IDS;
const CANVAS_SIDE_RESIZE_HANDLE_IDS = [
  "topCenter",
  "rightCenter",
  "bottomCenter",
  "leftCenter",
] as const satisfies readonly OrgEditorCanvasResizeHandle[];

const getCornerInsetStyle = (
  cornerId: (typeof ORG_EDITOR_CANVAS_ROTATE_HANDLE_IDS)[number],
  inset: number,
): CSSProperties => ({
  [cornerId.endsWith("Left") ? "left" : "right"]: canvasUiMetric(
    inset === -4 ? "corner-offset" : "rotate-offset",
    inset,
  ),
  [cornerId.startsWith("top") ? "top" : "bottom"]: canvasUiMetric(
    inset === -4 ? "corner-offset" : "rotate-offset",
    inset,
  ),
});

const getSideHandleStyle = (
  anchorId: (typeof CANVAS_SIDE_RESIZE_HANDLE_IDS)[number],
): CSSProperties => {
  const thickness = canvasUiMetric("side-size", 12);
  const offset = canvasUiMetric("side-offset", -6);
  const cornerClearance = canvasUiMetric("corner-size", 8);
  if (anchorId === "leftCenter" || anchorId === "rightCenter") {
    return {
      bottom: cornerClearance,
      height: "auto",
      [anchorId === "leftCenter" ? "left" : "right"]: offset,
      top: cornerClearance,
      width: thickness,
    };
  }
  return {
    [anchorId === "topCenter" ? "top" : "bottom"]: offset,
    height: thickness,
    left: cornerClearance,
    right: cornerClearance,
    width: "auto",
  };
};

function CanvasPerimeterTransformHandles({
  group = false,
  onHandlePointerDown,
  textWidthOnly = false,
}: {
  group?: boolean;
  onHandlePointerDown: (
    event: React.PointerEvent<HTMLButtonElement>,
    handle: Extract<OrgEditorCanvasElementHandle, { type: "resize" | "rotate" }>,
  ) => void;
  textWidthOnly?: boolean;
}) {
  const t = useUiText();
  return (
    <>
      {CANVAS_SIDE_RESIZE_HANDLE_IDS.filter(
        (anchorId) => !textWidthOnly || anchorId === "leftCenter" || anchorId === "rightCenter",
      ).map((anchorId) => (
        <button
          aria-label={t("Resize canvas element")}
          className={cn(
            "pointer-events-auto absolute z-20 border-0 bg-transparent p-0",
            (anchorId === "leftCenter" || anchorId === "rightCenter") && "cursor-ew-resize",
            (anchorId === "topCenter" || anchorId === "bottomCenter") && "cursor-ns-resize",
          )}
          data-canvas-group-resize-handle={group ? anchorId : undefined}
          data-canvas-resize-handle={group ? undefined : anchorId}
          data-canvas-transform-handle="side-resize"
          key={`resize:${anchorId}`}
          onPointerDown={(event) => onHandlePointerDown(event, { anchorId, type: "resize" })}
          style={getSideHandleStyle(anchorId)}
          type="button"
        />
      ))}
      {CANVAS_CORNER_RESIZE_HANDLE_IDS.map((anchorId) => (
        <button
          aria-label={t("Resize canvas element")}
          className={cn(
            "pointer-events-auto absolute z-30 rounded-full border border-signal bg-background p-0 shadow-sm",
            (anchorId === "topLeft" || anchorId === "bottomRight") && "cursor-nwse-resize",
            (anchorId === "topRight" || anchorId === "bottomLeft") && "cursor-nesw-resize",
          )}
          data-canvas-group-resize-handle={group ? anchorId : undefined}
          data-canvas-resize-handle={group ? undefined : anchorId}
          data-canvas-transform-handle="corner-resize"
          key={`resize:${anchorId}`}
          onPointerDown={(event) => onHandlePointerDown(event, { anchorId, type: "resize" })}
          style={{
            ...getCornerInsetStyle(anchorId, -4),
            borderWidth: canvasUiMetric("outline-width", 1),
            height: canvasUiMetric("corner-size", 8),
            width: canvasUiMetric("corner-size", 8),
          }}
          type="button"
        />
      ))}
      {ORG_EDITOR_CANVAS_ROTATE_HANDLE_IDS.map((cornerId) => (
        <button
          aria-label={t("Rotate canvas element")}
          className="canvas-rotate-cursor pointer-events-auto absolute z-20 border-0 bg-transparent p-0"
          data-canvas-group-rotate-handle={group ? cornerId : undefined}
          data-canvas-rotate-handle={group ? undefined : cornerId}
          data-canvas-transform-handle="corner-rotate"
          key={`rotate:${cornerId}`}
          onPointerDown={(event) => onHandlePointerDown(event, { cornerId, type: "rotate" })}
          style={{
            ...getCornerInsetStyle(cornerId, -22),
            height: canvasUiMetric("rotate-size", 18),
            width: canvasUiMetric("rotate-size", 18),
          }}
          type="button"
        />
      ))}
    </>
  );
}

export function OrgEditorCanvasGroupFrame({
  bounds,
  onHandlePointerDown,
}: {
  bounds: OrgEditorCanvasRect;
  onHandlePointerDown: (
    event: React.PointerEvent<HTMLButtonElement>,
    handle: Extract<OrgEditorCanvasElementHandle, { type: "resize" | "rotate" }>,
  ) => void;
}) {
  return (
    <div
      className="pointer-events-none absolute z-40"
      data-canvas-group-frame
      style={{
        height: bounds.height,
        left: bounds.x,
        outline: `${canvasUiMetric("outline-width", 1)} solid var(--signal)`,
        outlineOffset: canvasUiMetric("outline-offset", 2),
        top: bounds.y,
        width: bounds.width,
      }}
    >
      <CanvasPerimeterTransformHandles group onHandlePointerDown={onHandlePointerDown} />
    </div>
  );
}

const CanvasText = ({
  element,
}: {
  element: Extract<OrgEditorCanvasElement, { type: "sticker" | "text" }>;
}) => {
  const [, setFontRevision] = useState(0);
  const typography = resolveOrgEditorCanvasTypography(element.typography);
  const fontRequests =
    element.type === "text"
      ? [element.typography, ...element.formatRuns.map((run) => run.typography)].map(
          getOrgEditorCanvasElementFont,
        )
      : [getOrgEditorCanvasElementFont(element.typography)];
  const fontRequestKey = [...new Set(fontRequests)].sort().join("|");

  useEffect(() => {
    if (!document.fonts) return;
    let cancelled = false;
    void Promise.all(
      fontRequestKey
        .split("|")
        .filter(Boolean)
        .map((request) => document.fonts.load(request)),
    ).then(() => {
      if (!cancelled) setFontRevision((revision) => revision + 1);
    });
    return () => {
      cancelled = true;
    };
  }, [fontRequestKey]);

  if (element.type === "text") {
    const layout = getCanvasRichTextLayout(element);
    return (
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-visible">
        {getOrgEditorTextFillRects(element, layout).map((rect) => (
          <span
            className="absolute"
            data-canvas-text-fill={element.fillMode}
            key={`fill:${rect.x}:${rect.y}:${rect.width}:${rect.height}`}
            style={{
              backgroundColor: employeeTagColorToHex(element.fillColor),
              borderRadius: rect.radius,
              height: rect.height,
              left: rect.x,
              top: rect.y,
              width: rect.width,
            }}
          />
        ))}
        {layout.lines.flatMap((line) =>
          line.fragments.map((fragment) => (
            <span
              className="absolute whitespace-pre"
              key={`${fragment.start}:${fragment.end}`}
              style={{
                color: employeeTagColorToHex(fragment.typography.color),
                fontFamily: getOrgEditorCanvasCssFontFamily(fragment.typography.fontFamily),
                fontSize: fragment.typography.fontSize,
                fontWeight: fragment.typography.fontWeight,
                left: fragment.x,
                lineHeight: `${Math.ceil(fragment.typography.fontSize * 1.25)}px`,
                top: fragment.y,
              }}
            >
              {fragment.text}
            </span>
          )),
        )}
      </div>
    );
  }

  const lines = getCanvasTextLayout(element, element.text, element.height).lines;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {lines.map((line) => (
        <span
          className="absolute whitespace-pre"
          key={`${line.x}:${line.y}:${line.text}`}
          style={{
            color: employeeTagColorToHex(element.typography.color),
            fontFamily: getOrgEditorCanvasCssFontFamily(typography.fontFamily),
            fontSize: typography.fontSize,
            fontWeight: typography.fontWeight,
            left: line.x,
            lineHeight: `${Math.ceil(typography.fontSize * 1.25)}px`,
            top: line.y,
          }}
        >
          {line.text || "\u00a0"}
        </span>
      ))}
    </div>
  );
};

const getCanvasMeasureContext = () =>
  typeof document === "undefined" ? null : document.createElement("canvas").getContext("2d");

const getCanvasRichTextLayout = (element: Extract<OrgEditorCanvasElement, { type: "text" }>) => {
  const context = getCanvasMeasureContext();
  return getOrgEditorRichTextLayout({
    autoWidth: element.autoWidth,
    formatRuns: element.formatRuns,
    measure: (value, fragmentTypography) => {
      if (!context) return [...value].length * fragmentTypography.fontSize * 0.55;
      context.font = getOrgEditorCanvasElementFont(fragmentTypography);
      return context.measureText(value).width;
    },
    text: element.text,
    typography: element.typography,
    width: element.width,
  });
};

const getCanvasTextLayout = (
  element: Extract<OrgEditorCanvasElement, { type: "sticker" | "text" }>,
  text: string,
  height: number,
) => {
  const context = getCanvasMeasureContext();
  return getOrgEditorCanvasTextLayout({
    height,
    measure: (value, typography) => {
      if (!context) return [...value].length * typography.fontSize * 0.55;
      context.font = getOrgEditorCanvasElementFont(typography);
      return context.measureText(value).width;
    },
    padding: element.type === "sticker" ? 16 : 4,
    text,
    typography: resolveOrgEditorCanvasTypography(element.typography),
    width: element.width,
  });
};

const getRichTextDraftSegments = (
  element: Extract<OrgEditorCanvasElement, { type: "text" }>,
  draft: OrgEditorCanvasTextDraft,
) => {
  const base = resolveOrgEditorCanvasInlineTypography(
    getOrgEditorInlineTypography(element.typography),
  );
  const segments: Array<{
    end: number;
    start: number;
    text: string;
    typography: OrgEditorInlineTypography;
  }> = [];
  for (const grapheme of getOrgEditorTextGraphemes(draft.text)) {
    const typography = resolveOrgEditorCanvasInlineTypography(
      getOrgEditorTextStyleAt(base, draft.formatRuns, grapheme.start),
    );
    const previous = segments.at(-1);
    if (
      previous &&
      previous.end === grapheme.start &&
      previous.typography.color === typography.color &&
      previous.typography.fontFamily === typography.fontFamily &&
      previous.typography.fontSize === typography.fontSize &&
      previous.typography.fontWeight === typography.fontWeight
    ) {
      previous.end = grapheme.end;
      previous.text += grapheme.text;
    } else {
      segments.push({ ...grapheme, typography });
    }
  }
  return segments;
};

function CanvasRichTextEditor({
  draft,
  element,
  onDraftTextChange,
  onFinishEditing,
  onSelectionChange,
}: {
  draft: OrgEditorCanvasTextDraft;
  element: Extract<OrgEditorCanvasElement, { type: "text" }>;
  onDraftTextChange?:
    | ((text: string, selection: { end: number; start: number }) => void)
    | undefined;
  onFinishEditing?: (() => void) | undefined;
  onSelectionChange?: ((selection: { end: number; start: number }) => void) | undefined;
}) {
  const t = useUiText();
  const editorRef = useRef<HTMLDivElement | null>(null);
  const composingRef = useRef(false);
  const segments = useMemo(() => getRichTextDraftSegments(element, draft), [draft, element]);

  useLayoutEffect(() => {
    const root = editorRef.current;
    if (!root) return;
    const shouldRestoreSelection = document.activeElement === root;
    root.replaceChildren();
    if (segments.length === 0) {
      root.append(document.createElement("br"));
    } else {
      for (const segment of segments) {
        const span = document.createElement("span");
        span.dataset.textStart = String(segment.start);
        span.dataset.textEnd = String(segment.end);
        span.style.color = employeeTagColorToHex(segment.typography.color);
        span.style.fontFamily = getOrgEditorCanvasCssFontFamily(segment.typography.fontFamily);
        span.style.fontSize = `${segment.typography.fontSize}px`;
        span.style.fontWeight = String(segment.typography.fontWeight);
        span.style.lineHeight = `${Math.ceil(segment.typography.fontSize * 1.25)}px`;
        span.textContent = segment.text;
        root.append(span);
      }
    }
    if (shouldRestoreSelection) restoreContentEditableSelection(root, draft.selection);
  }, [draft.selection, segments]);

  useEffect(() => {
    editorRef.current?.focus({ preventScroll: true });
  }, []);

  const publishSelection = () => {
    const root = editorRef.current;
    if (!root) return;
    const selection = getContentEditableSelection(root);
    if (selection) onSelectionChange?.(selection);
  };
  const publishText = () => {
    const root = editorRef.current;
    if (!root) return;
    const selection = getContentEditableSelection(root) ?? draft.selection;
    const innerText = root.innerText.replace(/\r\n?/gu, "\n");
    onDraftTextChange?.(root.textContent ? innerText : "", selection);
  };

  return (
    // biome-ignore lint/a11y/useSemanticElements: Rich selection formatting requires a contenteditable surface.
    <div
      aria-label={t("Canvas element text")}
      className="absolute inset-0 z-10 overflow-visible border-0 bg-transparent outline-none"
      contentEditable
      data-canvas-text-editor={element.id}
      onBlur={(event) => {
        const nextTarget = event.relatedTarget;
        if (
          nextTarget instanceof Element &&
          nextTarget.closest('[data-demo-id="org-editor-canvas-properties"]')
        ) {
          return;
        }
        onFinishEditing?.();
      }}
      onCompositionEnd={() => {
        composingRef.current = false;
        publishText();
      }}
      onCompositionStart={() => {
        composingRef.current = true;
      }}
      onInput={() => {
        if (!composingRef.current) publishText();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onFinishEditing?.();
        }
        event.stopPropagation();
      }}
      onKeyUp={publishSelection}
      onPaste={(event) => {
        event.preventDefault();
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        const range = selection.getRangeAt(0);
        if (!editorRef.current?.contains(range.commonAncestorContainer)) return;
        range.deleteContents();
        const textNode = document.createTextNode(event.clipboardData.getData("text/plain"));
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        publishText();
      }}
      onPointerDown={(event) => event.stopPropagation()}
      onPointerUp={publishSelection}
      ref={editorRef}
      role="textbox"
      spellCheck={false}
      style={{
        padding: 4,
        textAlign: element.typography.horizontalAlign,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}
      suppressContentEditableWarning
      tabIndex={0}
    />
  );
}

const RectHandles = ({
  elementType,
  onHandlePointerDown,
}: {
  elementType: "image" | "sticker" | "text";
  onHandlePointerDown: (
    event: React.PointerEvent<Element>,
    handle: OrgEditorCanvasElementHandle,
  ) => void;
}) => {
  return (
    <CanvasPerimeterTransformHandles
      onHandlePointerDown={onHandlePointerDown}
      textWidthOnly={elementType === "text"}
    />
  );
};

export function OrgEditorCanvasElementNode({
  editingRichTextDraft,
  editingText,
  element,
  imageUnavailableLabel,
  isSelected,
  onEditingTextChange,
  onEditingRichTextChange,
  onEditingSelectionChange,
  onFinishEditing,
  onDoubleClick,
  onContextMenu,
  onHandlePointerDown,
  onPointerDown,
  showHandles = isSelected,
}: {
  element: OrgEditorCanvasElement;
  editingRichTextDraft?: OrgEditorCanvasTextDraft | null;
  editingText?: string | null;
  imageUnavailableLabel: string;
  isSelected: boolean;
  onDoubleClick: (elementId: OrgEditorCanvasElementId) => void;
  onContextMenu: (event: React.MouseEvent<Element>, element: OrgEditorCanvasElement) => void;
  onHandlePointerDown: (
    event: React.PointerEvent<Element>,
    element: OrgEditorCanvasElement,
    handle: OrgEditorCanvasElementHandle,
  ) => void;
  onEditingTextChange?: (text: string) => void;
  onEditingRichTextChange?: (text: string, selection: { end: number; start: number }) => void;
  onEditingSelectionChange?: (selection: { end: number; start: number }) => void;
  onFinishEditing?: () => void;
  onPointerDown: (event: React.PointerEvent<Element>, element: OrgEditorCanvasElement) => void;
  showHandles?: boolean;
}) {
  const t = useUiText();
  const [imageFailed, setImageFailed] = useState(false);
  const textEditorRef = useRef<HTMLTextAreaElement | null>(null);
  const imageDataUrl = element.type === "image" ? element.dataUrl : null;
  const richDraftLayout =
    element.type === "text" && editingRichTextDraft
      ? getCanvasRichTextLayout({
          ...element,
          formatRuns: editingRichTextDraft.formatRuns,
          text: editingRichTextDraft.text,
        })
      : null;
  const displayedElement =
    element.type === "text" && richDraftLayout
      ? {
          ...element,
          formatRuns: editingRichTextDraft?.formatRuns ?? element.formatRuns,
          height: richDraftLayout.height,
          text: editingRichTextDraft?.text ?? element.text,
          width: richDraftLayout.width,
          x:
            element.autoWidth && element.typography.horizontalAlign === "right"
              ? element.x - (richDraftLayout.width - element.width)
              : element.autoWidth && element.typography.horizontalAlign === "center"
                ? element.x - (richDraftLayout.width - element.width) / 2
                : element.x,
        }
      : element;
  const rectElement = isOrgEditorRectElement(displayedElement) ? displayedElement : null;
  const stickerColors =
    element.type === "sticker" ? getStickerColorStyle(element.backgroundColor) : null;
  const textDraft =
    (element.type === "text" || element.type === "sticker") &&
    editingText !== null &&
    editingText !== undefined
      ? editingText
      : null;
  const initialDraftLayout =
    textDraft !== null && (element.type === "text" || element.type === "sticker")
      ? getCanvasTextLayout(element, textDraft, element.height)
      : null;
  const displayHeight = initialDraftLayout
    ? normalizeOrgEditorCanvasDimension(
        Math.max(rectElement?.height ?? 0, initialDraftLayout.minimumHeight),
      )
    : (rectElement?.height ?? 0);
  const draftLayout =
    initialDraftLayout && (element.type === "text" || element.type === "sticker")
      ? getCanvasTextLayout(element, textDraft ?? "", displayHeight)
      : null;

  useEffect(() => {
    if (editingText !== null && editingText !== undefined) {
      textEditorRef.current?.focus({ preventScroll: true });
    }
  }, [editingText]);

  useEffect(() => {
    if (imageDataUrl !== null) setImageFailed(false);
  }, [imageDataUrl]);

  if (element.type === "arrow") {
    const { control1, control2 } = getOrgEditorArrowControlPoints(element);
    const path = `M ${element.start.x} ${element.start.y} C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${element.end.x} ${element.end.y}`;
    const markerId = `canvas-arrow-${element.id}`;
    return (
      <button
        aria-label={t("Arrow canvas element")}
        className="absolute left-0 top-0 size-px overflow-visible border-0 bg-transparent p-0"
        data-canvas-element-id={element.id}
        data-canvas-element-layer={element.layer}
        data-canvas-element-type={element.type}
        onContextMenu={(event) => onContextMenu(event, element)}
        onPointerDown={(event) => onPointerDown(event, element)}
        type="button"
      >
        <svg aria-hidden="true" className="absolute left-0 top-0 size-px overflow-visible">
          <defs>
            <marker
              id={`${markerId}-end`}
              markerHeight="7"
              markerWidth="7"
              orient="auto"
              refX="7"
              refY="3.5"
            >
              <path d="M 0 0 L 7 3.5 L 0 7 z" fill={employeeTagColorToHex(element.strokeColor)} />
            </marker>
            <marker
              id={`${markerId}-start`}
              markerHeight="7"
              markerWidth="7"
              orient="auto-start-reverse"
              refX="7"
              refY="3.5"
            >
              <path d="M 0 0 L 7 3.5 L 0 7 z" fill={employeeTagColorToHex(element.strokeColor)} />
            </marker>
          </defs>
          <path
            className="pointer-events-stroke"
            d={path}
            fill="none"
            stroke="transparent"
            strokeWidth={Math.max(element.strokeWidth, 12)}
            vectorEffect="non-scaling-stroke"
          />
          <path
            className={cn(
              "pointer-events-none",
              isSelected && "drop-shadow-[0_0_2px_var(--signal)]",
            )}
            d={path}
            fill="none"
            markerEnd={element.endMarker === "arrow" ? `url(#${markerId}-end)` : undefined}
            markerStart={element.startMarker === "arrow" ? `url(#${markerId}-start)` : undefined}
            stroke={employeeTagColorToHex(element.strokeColor)}
            strokeDasharray={element.dash === "dashed" ? "8 6" : undefined}
            strokeLinecap="round"
            strokeWidth={element.strokeWidth}
            vectorEffect="non-scaling-stroke"
          />
          {isSelected && (
            <>
              <path
                d={path}
                fill="none"
                stroke="var(--signal)"
                strokeDasharray="4 4"
                strokeWidth={1}
              />
              {(["start", "end"] as const).map((endpoint) => {
                const point = element[endpoint];
                const control = endpoint === "start" ? control1 : control2;
                return (
                  <g key={endpoint}>
                    <line
                      stroke="var(--signal)"
                      strokeWidth={1}
                      x1={point.x}
                      x2={control.x}
                      y1={point.y}
                      y2={control.y}
                    />
                    <circle
                      className="cursor-crosshair fill-background stroke-signal"
                      cx={point.x}
                      cy={point.y}
                      data-canvas-arrow-endpoint={endpoint}
                      onPointerDown={(event) =>
                        onHandlePointerDown(event, element, { endpoint, type: "arrowEndpoint" })
                      }
                      r={6}
                      strokeWidth={2}
                    />
                    <circle
                      className="cursor-move fill-signal"
                      cx={control.x}
                      cy={control.y}
                      data-canvas-arrow-control={endpoint}
                      onPointerDown={(event) =>
                        onHandlePointerDown(event, element, { endpoint, type: "arrowControl" })
                      }
                      r={5}
                    />
                  </g>
                );
              })}
            </>
          )}
        </svg>
      </button>
    );
  }

  return (
    <fieldset
      aria-label={
        element.type === "sticker"
          ? t("Sticker canvas element")
          : element.type === "image"
            ? t("Image canvas element")
            : t("Text canvas element")
      }
      className={cn(
        "group absolute m-0 min-w-0 touch-none border-0 p-0",
        element.type === "sticker" && "rounded",
        element.type === "image" && "rounded-lg",
      )}
      data-canvas-element-id={element.id}
      data-canvas-element-layer={element.layer}
      data-canvas-element-text={
        element.type === "text" || element.type === "sticker" ? element.text : undefined
      }
      data-canvas-element-type={element.type}
      data-canvas-font-family={
        element.type === "text" || element.type === "sticker"
          ? resolveOrgEditorCanvasTypography(element.typography).fontFamily
          : undefined
      }
      onContextMenu={(event) => onContextMenu(event, element)}
      onDoubleClick={() => onDoubleClick(element.id)}
      onPointerDown={(event) => onPointerDown(event, element)}
      style={{
        height: displayHeight,
        left: displayedElement.type === "arrow" ? 0 : displayedElement.x,
        outline: isSelected
          ? `${canvasUiMetric("outline-width", 1)} solid var(--signal)`
          : undefined,
        outlineOffset: isSelected ? canvasUiMetric("outline-offset", 2) : undefined,
        top: displayedElement.type === "arrow" ? 0 : displayedElement.y,
        transform: `rotate(${element.rotation}deg)`,
        transformOrigin: "center",
        width: displayedElement.type === "arrow" ? 0 : displayedElement.width,
      }}
    >
      {element.type === "sticker" && stickerColors && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded"
          data-canvas-sticker-paper
          style={{
            backgroundColor: stickerColors.fillStyle,
            border: `1px solid ${stickerColors.borderStyle}`,
          }}
        />
      )}
      {element.type === "text" && editingRichTextDraft && richDraftLayout && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          {getOrgEditorTextFillRects(
            displayedElement as Extract<OrgEditorCanvasElement, { type: "text" }>,
            richDraftLayout,
          ).map((rect) => (
            <span
              className="absolute"
              data-canvas-text-fill={element.fillMode}
              key={`draft-fill:${rect.x}:${rect.y}:${rect.width}:${rect.height}`}
              style={{
                backgroundColor: employeeTagColorToHex(element.fillColor),
                borderRadius: rect.radius,
                height: rect.height,
                left: rect.x,
                top: rect.y,
                width: rect.width,
              }}
            />
          ))}
        </div>
      )}
      {element.type === "image" ? (
        <div className="size-full overflow-hidden rounded-lg bg-muted">
          {imageFailed ? (
            <div
              aria-label={imageUnavailableLabel}
              className="size-full"
              role="img"
              style={{ backgroundColor: "#e2e8f0" }}
            >
              <svg
                aria-hidden="true"
                className="size-full"
                preserveAspectRatio="none"
                viewBox={`0 0 ${element.width} ${element.height}`}
              >
                <polyline
                  fill="none"
                  points={getOrgEditorCanvasImagePlaceholderPoints(element.width, element.height)
                    .map((point) => `${point.x},${point.y}`)
                    .join(" ")}
                  stroke="#94a3b8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>
          ) : (
            <Image
              alt=""
              className="pointer-events-none size-full object-contain"
              draggable={false}
              height={element.intrinsicHeight}
              onError={() => setImageFailed(true)}
              src={element.dataUrl}
              unoptimized
              width={element.intrinsicWidth}
            />
          )}
        </div>
      ) : element.type === "text" && editingRichTextDraft ? (
        <CanvasRichTextEditor
          draft={editingRichTextDraft}
          element={displayedElement as Extract<OrgEditorCanvasElement, { type: "text" }>}
          onDraftTextChange={onEditingRichTextChange}
          onFinishEditing={onFinishEditing}
          onSelectionChange={onEditingSelectionChange}
        />
      ) : textDraft !== null && draftLayout ? (
        <textarea
          aria-label={t("Canvas element text")}
          className="absolute start-0 z-10 resize-none border-0 bg-transparent outline-none"
          data-canvas-text-editor={element.id}
          onBlur={onFinishEditing}
          onChange={(event) => onEditingTextChange?.(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              onFinishEditing?.();
            }
            event.stopPropagation();
          }}
          onPointerDown={(event) => event.stopPropagation()}
          ref={textEditorRef}
          style={{
            color: employeeTagColorToHex(element.typography.color),
            fontFamily: getOrgEditorCanvasCssFontFamily(element.typography.fontFamily),
            fontSize: element.typography.fontSize,
            fontWeight: resolveOrgEditorCanvasTypography(element.typography).fontWeight,
            height: draftLayout.contentHeight,
            lineHeight: `${draftLayout.lineHeight}px`,
            overflow: "hidden",
            padding: `0 ${element.type === "sticker" ? 16 : 4}px`,
            textAlign: element.typography.horizontalAlign,
            top: draftLayout.firstY,
            width: element.width,
          }}
          value={textDraft}
        />
      ) : (
        <CanvasText element={element} />
      )}
      {showHandles && isSelected && isOrgEditorRectElement(element) && (
        <RectHandles
          elementType={element.type}
          onHandlePointerDown={(event, handle) => onHandlePointerDown(event, element, handle)}
        />
      )}
    </fieldset>
  );
}
