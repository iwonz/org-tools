"use client";

import type {
  OrgEditorCanvasElement,
  OrgEditorCanvasElementId,
  OrgEditorInlineTypography,
  OrgEditorRectAnchorId,
  OrgEditorTextFormatRun,
  OrgEditorTypography,
} from "@org-tools/types";
import Image from "next/image";
import {
  type CSSProperties,
  memo,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useUiText } from "@/i18n/use-ui-text";
import {
  getOrgEditorArrowControlPoints,
  getOrgEditorCanvasCssFontFamily,
  getOrgEditorCanvasImagePlaceholderPoints,
  getOrgEditorInlineTypography,
  getOrgEditorTextFillRects,
  getOrgEditorTextGraphemes,
  getOrgEditorTextStyleAt,
  isOrgEditorRectElement,
  ORG_EDITOR_CANVAS_ROTATE_HANDLE_IDS,
  type OrgEditorCanvasRect,
  type OrgEditorCanvasResizeHandle,
  type OrgEditorRichTextLayout,
  resolveOrgEditorCanvasInlineTypography,
  resolveOrgEditorCanvasTypography,
} from "@/lib/org-editor-canvas";
import { recordOrgEditorPerformance } from "@/lib/org-editor-performance";
import { orgEditorRichTextLayoutEngine } from "@/lib/org-editor-rich-text-layout";
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

export type OrgEditorCanvasTextMutation = {
  end: number;
  insertedText: string;
  start: number;
};

const getContentEditableSelection = (root: HTMLElement) => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  const offsetOf = (node: Node, offset: number) => {
    const segment = (node instanceof Element ? node : node.parentElement)?.closest<HTMLElement>(
      "[data-text-start]",
    );
    if (segment && root.contains(segment)) {
      const segmentStart = Number.parseInt(segment.dataset.textStart ?? "", 10);
      if (Number.isFinite(segmentStart)) {
        if (node instanceof Text && node.parentNode === segment) return segmentStart + offset;
        const localPrefix = document.createRange();
        localPrefix.selectNodeContents(segment);
        localPrefix.setEnd(node, offset);
        return segmentStart + localPrefix.toString().length;
      }
    }
    const prefix = document.createRange();
    prefix.selectNodeContents(root);
    prefix.setEnd(node, offset);
    return prefix.toString().length;
  };
  const rootLength = root.textContent?.length ?? 0;
  const endpointOffset = (node: Node | null, offset: number) => {
    if (!node) return null;
    if (root.contains(node)) return offsetOf(node, offset);
    const relation = root.compareDocumentPosition(node);
    if (relation & Node.DOCUMENT_POSITION_FOLLOWING) return rootLength;
    if (relation & Node.DOCUMENT_POSITION_PRECEDING) return 0;
    return null;
  };
  const anchor = endpointOffset(selection.anchorNode, selection.anchorOffset);
  const focus = endpointOffset(selection.focusNode, selection.focusOffset);
  if (anchor === null || focus === null) return null;
  if (!root.contains(selection.anchorNode) && !root.contains(selection.focusNode)) return null;
  return {
    end: Math.max(anchor, focus),
    start: Math.min(anchor, focus),
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
}: {
  group?: boolean;
  onHandlePointerDown: (
    event: React.PointerEvent<HTMLButtonElement>,
    handle: Extract<OrgEditorCanvasElementHandle, { type: "resize" | "rotate" }>,
  ) => void;
}) {
  const t = useUiText();
  return (
    <>
      {CANVAS_SIDE_RESIZE_HANDLE_IDS.map((anchorId) => (
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
  const layout = orgEditorRichTextLayoutEngine.getLayout(element);
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-visible">
      {element.type === "text" &&
        getOrgEditorTextFillRects(element, layout).map((rect) => (
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
};

const getRichTextDraftSegments = (
  baseTypography: OrgEditorTypography,
  formatRuns: OrgEditorTextFormatRun[],
  text: string,
  effectiveScale: number,
) => {
  const base = resolveOrgEditorCanvasInlineTypography(getOrgEditorInlineTypography(baseTypography));
  const segments: Array<{
    end: number;
    start: number;
    text: string;
    typography: OrgEditorInlineTypography;
  }> = [];
  for (const grapheme of getOrgEditorTextGraphemes(text)) {
    const typography = resolveOrgEditorCanvasInlineTypography(
      getOrgEditorTextStyleAt(base, formatRuns, grapheme.start),
    );
    const effectiveTypography = {
      ...typography,
      fontSize: typography.fontSize * effectiveScale,
    };
    const previous = segments.at(-1);
    if (
      previous &&
      previous.end === grapheme.start &&
      previous.typography.color === effectiveTypography.color &&
      previous.typography.fontFamily === effectiveTypography.fontFamily &&
      previous.typography.fontSize === effectiveTypography.fontSize &&
      previous.typography.fontWeight === effectiveTypography.fontWeight
    ) {
      previous.end = grapheme.end;
      previous.text += grapheme.text;
    } else {
      segments.push({ ...grapheme, typography: effectiveTypography });
    }
  }
  return segments;
};

function CanvasRichTextEditor({
  draft,
  element,
  layout,
  onDraftTextChange,
  onEditingFocus,
  onFinishEditing,
  onSelectionChange,
  shouldKeepEditingOnBlur,
}: {
  draft: OrgEditorCanvasTextDraft;
  element: Extract<OrgEditorCanvasElement, { type: "sticker" | "text" }>;
  layout: OrgEditorRichTextLayout;
  onDraftTextChange?:
    | ((
        text: string,
        selection: { end: number; start: number },
        mutation?: OrgEditorCanvasTextMutation,
      ) => void)
    | undefined;
  onEditingFocus?: (() => void) | undefined;
  onFinishEditing?: (() => void) | undefined;
  onSelectionChange?: ((selection: { end: number; start: number }) => void) | undefined;
  shouldKeepEditingOnBlur?: (() => boolean) | undefined;
}) {
  const t = useUiText();
  const editorRef = useRef<HTMLDivElement | null>(null);
  const composingRef = useRef(false);
  const propertyInteractionRef = useRef(false);
  const lastPublishedTextRef = useRef<string | null>(null);
  const pendingMutationRef = useRef<OrgEditorCanvasTextMutation | null>(null);
  const renderedStyleSignatureRef = useRef<string | null>(null);
  const selectionRef = useRef(draft.selection);
  selectionRef.current = draft.selection;
  const typography = useMemo<OrgEditorTypography>(
    () => ({
      color: element.typography.color,
      fontFamily: element.typography.fontFamily,
      fontSize: element.typography.fontSize,
      fontWeight: element.typography.fontWeight,
      horizontalAlign: element.typography.horizontalAlign,
      verticalAlign: element.typography.verticalAlign,
    }),
    [
      element.typography.color,
      element.typography.fontFamily,
      element.typography.fontSize,
      element.typography.fontWeight,
      element.typography.horizontalAlign,
      element.typography.verticalAlign,
    ],
  );
  const segments = useMemo(
    () => getRichTextDraftSegments(typography, draft.formatRuns, draft.text, layout.effectiveScale),
    [draft.formatRuns, draft.text, layout.effectiveScale, typography],
  );
  const segmentStyleSignature = useMemo(
    () =>
      segments
        .map(
          (segment) =>
            `${segment.typography.color}:${segment.typography.fontFamily}:${segment.typography.fontSize}:${segment.typography.fontWeight}`,
        )
        .join("|"),
    [segments],
  );

  useLayoutEffect(() => {
    const root = editorRef.current;
    if (!root) return;
    if (
      segments.length <= 1 &&
      renderedStyleSignatureRef.current === segmentStyleSignature &&
      (lastPublishedTextRef.current === draft.text || document.activeElement === root)
    ) {
      return;
    }
    const shouldRestoreSelection =
      document.activeElement === root ||
      propertyInteractionRef.current ||
      (document.activeElement instanceof Element &&
        Boolean(document.activeElement.closest('[data-demo-id="org-editor-canvas-properties"]')));
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
    lastPublishedTextRef.current = draft.text;
    renderedStyleSignatureRef.current = segmentStyleSignature;
    if (shouldRestoreSelection) {
      root.focus({ preventScroll: true });
      restoreContentEditableSelection(root, selectionRef.current);
    }
  }, [draft.text, segmentStyleSignature, segments]);

  useEffect(() => {
    const root = editorRef.current;
    if (!root) return;
    root.focus({ preventScroll: true });
    restoreContentEditableSelection(root, selectionRef.current);
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
    const mutation = pendingMutationRef.current ?? undefined;
    pendingMutationRef.current = null;
    const previousText = lastPublishedTextRef.current;
    const nextText =
      mutation && previousText !== null
        ? `${previousText.slice(0, mutation.start)}${mutation.insertedText}${previousText.slice(mutation.end)}`
        : root.textContent
          ? root.innerText.replace(/\r\n?/gu, "\n")
          : "";
    lastPublishedTextRef.current = nextText;
    onDraftTextChange?.(nextText, selection, mutation);
  };

  useEffect(() => {
    const publishDocumentSelection = () => publishSelection();
    const preserveToolbarSelection = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest('[data-demo-id="org-editor-canvas-properties"]')) {
        propertyInteractionRef.current = true;
        publishSelection();
        return;
      }
      if (
        propertyInteractionRef.current &&
        target.closest(
          '[data-radix-popper-content-wrapper], [data-radix-select-viewport], [data-demo-id="tag-color-dropdown"], [role="listbox"], [role="option"]',
        )
      ) {
        return;
      }
      propertyInteractionRef.current = false;
    };
    document.addEventListener("selectionchange", publishDocumentSelection);
    document.addEventListener("pointerdown", preserveToolbarSelection, true);
    window.addEventListener("pointerup", publishDocumentSelection);
    return () => {
      document.removeEventListener("selectionchange", publishDocumentSelection);
      document.removeEventListener("pointerdown", preserveToolbarSelection, true);
      window.removeEventListener("pointerup", publishDocumentSelection);
    };
  });

  return (
    // biome-ignore lint/a11y/useSemanticElements: Rich selection formatting requires a contenteditable surface.
    <div
      aria-label={t("Canvas element text")}
      className="absolute inset-0 z-10 overflow-visible border-0 bg-transparent outline-none"
      contentEditable
      data-canvas-text-editor={element.id}
      onBlur={(event) => {
        if (shouldKeepEditingOnBlur?.()) return;
        const nextTarget = event.relatedTarget;
        if (
          nextTarget instanceof Element &&
          nextTarget.closest('[data-demo-id="org-editor-canvas-properties"]')
        ) {
          return;
        }
        queueMicrotask(() => {
          if (propertyInteractionRef.current) return;
          const activeElement = document.activeElement;
          if (
            activeElement instanceof Element &&
            activeElement.closest(
              '[data-demo-id="org-editor-canvas-properties"], [data-radix-popper-content-wrapper], [data-radix-select-viewport], [data-demo-id="tag-color-dropdown"], [role="listbox"], [role="option"]',
            )
          ) {
            return;
          }
          if (
            document.querySelector(
              '[data-demo-id="org-editor-canvas-properties"] [data-state="open"]',
            )
          ) {
            return;
          }
          onFinishEditing?.();
        });
      }}
      onCompositionEnd={() => {
        composingRef.current = false;
        pendingMutationRef.current = null;
        publishText();
      }}
      onCompositionStart={() => {
        composingRef.current = true;
      }}
      onInput={() => {
        if (!composingRef.current) publishText();
      }}
      onBeforeInput={(event) => {
        if (composingRef.current) return;
        const selection = editorRef.current ? getContentEditableSelection(editorRef.current) : null;
        if (!selection) return;
        const input = event.nativeEvent as InputEvent;
        const insertedText =
          input.data ??
          (input.inputType === "insertParagraph" || input.inputType === "insertLineBreak"
            ? "\n"
            : null);
        pendingMutationRef.current = insertedText === null ? null : { ...selection, insertedText };
      }}
      onFocus={onEditingFocus}
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
        const editor = editorRef.current;
        const editSelection = editor ? getContentEditableSelection(editor) : null;
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        const range = selection.getRangeAt(0);
        if (!editorRef.current?.contains(range.commonAncestorContainer)) return;
        range.deleteContents();
        const pastedText = event.clipboardData.getData("text/plain");
        const textNode = document.createTextNode(pastedText);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        pendingMutationRef.current = editSelection
          ? { ...editSelection, insertedText: pastedText }
          : null;
        publishText();
      }}
      onPointerDown={(event) => {
        propertyInteractionRef.current = false;
        event.stopPropagation();
      }}
      onPointerUp={publishSelection}
      ref={editorRef}
      role="textbox"
      spellCheck={false}
      style={{
        boxSizing: "border-box",
        minHeight: layout.height,
        paddingBottom: element.type === "sticker" ? 16 : 4,
        paddingLeft: element.type === "sticker" ? 16 : 4,
        paddingRight: element.type === "sticker" ? 16 : 4,
        paddingTop: layout.lines[0]?.y ?? (element.type === "sticker" ? 16 : 4),
        textAlign: element.typography.horizontalAlign,
        whiteSpace: "pre-wrap",
        width: layout.width,
        wordBreak: "break-word",
      }}
      suppressContentEditableWarning
      tabIndex={0}
    />
  );
}

const RectHandles = ({
  onHandlePointerDown,
}: {
  onHandlePointerDown: (
    event: React.PointerEvent<Element>,
    handle: OrgEditorCanvasElementHandle,
  ) => void;
}) => {
  return <CanvasPerimeterTransformHandles onHandlePointerDown={onHandlePointerDown} />;
};

function OrgEditorCanvasElementNodeComponent({
  editingRichTextDraft,
  element,
  imageUnavailableLabel,
  isSelected,
  onEditingRichTextChange,
  onEditingSelectionChange,
  onEditingFocus,
  onFinishEditing,
  onDoubleClick,
  onContextMenu,
  onHandlePointerDown,
  onPointerDown,
  shouldKeepEditingOnBlur,
  showHandles = isSelected,
}: {
  element: OrgEditorCanvasElement;
  editingRichTextDraft?: OrgEditorCanvasTextDraft | null;
  imageUnavailableLabel: string;
  isSelected: boolean;
  onDoubleClick: (elementId: OrgEditorCanvasElementId) => void;
  onContextMenu: (event: React.MouseEvent<Element>, element: OrgEditorCanvasElement) => void;
  onHandlePointerDown: (
    event: React.PointerEvent<Element>,
    element: OrgEditorCanvasElement,
    handle: OrgEditorCanvasElementHandle,
  ) => void;
  onEditingRichTextChange?: (
    text: string,
    selection: { end: number; start: number },
    mutation?: OrgEditorCanvasTextMutation,
  ) => void;
  onEditingSelectionChange?: (selection: { end: number; start: number }) => void;
  onEditingFocus?: (() => void) | undefined;
  onFinishEditing?: () => void;
  onPointerDown: (event: React.PointerEvent<Element>, element: OrgEditorCanvasElement) => void;
  shouldKeepEditingOnBlur?: (() => boolean) | undefined;
  showHandles?: boolean;
}) {
  recordOrgEditorPerformance("canvasElementRenders");
  const t = useUiText();
  const [imageFailed, setImageFailed] = useState(false);
  const imageDataUrl = element.type === "image" ? element.dataUrl : null;
  const richDraftLayout =
    (element.type === "text" || element.type === "sticker") && editingRichTextDraft
      ? orgEditorRichTextLayoutEngine.getLayout({
          ...element,
          formatRuns: editingRichTextDraft.formatRuns,
          text: editingRichTextDraft.text,
        })
      : null;
  const displayedElement =
    (element.type === "text" || element.type === "sticker") && richDraftLayout
      ? {
          ...element,
          formatRuns: editingRichTextDraft?.formatRuns ?? element.formatRuns,
          height: richDraftLayout.height,
          text: editingRichTextDraft?.text ?? element.text,
          width: richDraftLayout.width,
          x:
            element.type === "text" &&
            element.autoWidth &&
            element.typography.horizontalAlign === "right"
              ? element.x - (richDraftLayout.width - element.width)
              : element.type === "text" &&
                  element.autoWidth &&
                  element.typography.horizontalAlign === "center"
                ? element.x - (richDraftLayout.width - element.width) / 2
                : element.x,
        }
      : element;
  const rectElement = isOrgEditorRectElement(displayedElement) ? displayedElement : null;
  const stickerColors =
    element.type === "sticker" ? getStickerColorStyle(element.backgroundColor) : null;
  const displayHeight = rectElement?.height ?? 0;

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
      ) : (element.type === "text" || element.type === "sticker") && editingRichTextDraft ? (
        <CanvasRichTextEditor
          draft={editingRichTextDraft}
          element={
            displayedElement as Extract<OrgEditorCanvasElement, { type: "sticker" | "text" }>
          }
          layout={richDraftLayout as OrgEditorRichTextLayout}
          onDraftTextChange={onEditingRichTextChange}
          onEditingFocus={onEditingFocus}
          onFinishEditing={onFinishEditing}
          onSelectionChange={onEditingSelectionChange}
          shouldKeepEditingOnBlur={shouldKeepEditingOnBlur}
        />
      ) : (
        <CanvasText element={element} />
      )}
      {showHandles && isSelected && isOrgEditorRectElement(element) && (
        <RectHandles
          onHandlePointerDown={(event, handle) => onHandlePointerDown(event, element, handle)}
        />
      )}
    </fieldset>
  );
}

export const OrgEditorCanvasElementNode = memo(
  OrgEditorCanvasElementNodeComponent,
  (
    previous: Parameters<typeof OrgEditorCanvasElementNodeComponent>[0],
    next: Parameters<typeof OrgEditorCanvasElementNodeComponent>[0],
  ) =>
    previous.element === next.element &&
    previous.editingRichTextDraft === next.editingRichTextDraft &&
    previous.imageUnavailableLabel === next.imageUnavailableLabel &&
    previous.isSelected === next.isSelected &&
    previous.showHandles === next.showHandles,
);
