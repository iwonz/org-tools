"use client";

import type {
  OrgEditorCanvasElement,
  OrgEditorCanvasElementId,
  OrgEditorRectAnchorId,
} from "@org-tools/types";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

import { useUiText } from "@/i18n/use-ui-text";
import {
  getOrgEditorArrowControlPoints,
  getOrgEditorCanvasElementAnchorPoint,
  getOrgEditorCanvasImagePlaceholderPoints,
  isOrgEditorRectElement,
  layoutOrgEditorCanvasText,
  ORG_EDITOR_ARROW_ANCHOR_IDS,
  ORG_EDITOR_CANVAS_RESIZE_HANDLE_IDS,
  ORG_EDITOR_CANVAS_ROTATE_HANDLE_IDS,
  ORG_EDITOR_RECT_ANCHOR_IDS,
  type OrgEditorCanvasRect,
  type OrgEditorCanvasResizeHandle,
} from "@/lib/org-editor-canvas";
import { employeeTagColorToHex } from "@/lib/tag-color";
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

const resizeHandleClassName = (anchorId: OrgEditorCanvasResizeHandle) =>
  cn(
    "pointer-events-auto absolute z-20 size-3 rounded-sm border border-signal bg-background",
    anchorId.startsWith("top") && "-top-1.5",
    anchorId.startsWith("bottom") && "-bottom-1.5",
    anchorId === "leftCenter" && "-left-1.5 top-1/2 -translate-y-1/2 cursor-ew-resize",
    anchorId === "rightCenter" && "-right-1.5 top-1/2 -translate-y-1/2 cursor-ew-resize",
    (anchorId === "topCenter" || anchorId === "bottomCenter") &&
      "left-1/2 -translate-x-1/2 cursor-ns-resize",
    (anchorId === "topLeft" || anchorId === "bottomLeft") && "-left-1.5",
    (anchorId === "topRight" || anchorId === "bottomRight") && "-right-1.5",
    (anchorId === "topLeft" || anchorId === "bottomRight") && "cursor-nwse-resize",
    (anchorId === "topRight" || anchorId === "bottomLeft") && "cursor-nesw-resize",
  );

const rotateHandleClassName = (cornerId: (typeof ORG_EDITOR_CANVAS_ROTATE_HANDLE_IDS)[number]) =>
  cn(
    "pointer-events-auto absolute z-20 size-4 cursor-grab rounded-full border border-signal bg-background shadow-sm active:cursor-grabbing",
    cornerId.startsWith("top") ? "-top-7" : "-bottom-7",
    cornerId.endsWith("Left") ? "-left-7" : "-right-7",
  );

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
      {ORG_EDITOR_CANVAS_RESIZE_HANDLE_IDS.map((anchorId) => (
        <button
          aria-label={t("Resize canvas element")}
          className={resizeHandleClassName(anchorId)}
          data-canvas-group-resize-handle={group ? anchorId : undefined}
          data-canvas-resize-handle={group ? undefined : anchorId}
          key={`resize:${anchorId}`}
          onPointerDown={(event) => onHandlePointerDown(event, { anchorId, type: "resize" })}
          type="button"
        />
      ))}
      {ORG_EDITOR_CANVAS_ROTATE_HANDLE_IDS.map((cornerId) => (
        <button
          aria-label={t("Rotate canvas element")}
          className={rotateHandleClassName(cornerId)}
          data-canvas-group-rotate-handle={group ? cornerId : undefined}
          data-canvas-rotate-handle={group ? undefined : cornerId}
          key={`rotate:${cornerId}`}
          onPointerDown={(event) => onHandlePointerDown(event, { cornerId, type: "rotate" })}
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
      className="pointer-events-none absolute z-40 border-2 border-dashed border-signal"
      data-canvas-group-frame
      style={{ height: bounds.height, left: bounds.x, top: bounds.y, width: bounds.width }}
    >
      <CanvasPerimeterTransformHandles group onHandlePointerDown={onHandlePointerDown} />
    </div>
  );
}

const getCanvasFont = (fontFamily: string, weight: number, size: number) =>
  `${weight} ${size}px "${fontFamily.replaceAll('"', "")}", Arial, sans-serif`;

const CanvasText = ({
  element,
}: {
  element: Extract<OrgEditorCanvasElement, { type: "sticker" | "text" }>;
}) => {
  const lines = useMemo(() => {
    const canvas = typeof document === "undefined" ? null : document.createElement("canvas");
    const context = canvas?.getContext("2d");
    return layoutOrgEditorCanvasText({
      height: element.height,
      measure: (value, typography) => {
        if (!context) return [...value].length * typography.fontSize * 0.55;
        context.font = getCanvasFont(
          typography.fontFamily,
          typography.fontWeight,
          typography.fontSize,
        );
        return context.measureText(value).width;
      },
      padding: element.type === "sticker" ? 16 : 4,
      text: element.text,
      typography: element.typography,
      width: element.width,
    });
  }, [element]);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {lines.map((line) => (
        <span
          className="absolute whitespace-pre"
          key={`${line.x}:${line.y}:${line.text}`}
          style={{
            color: employeeTagColorToHex(element.typography.color),
            fontFamily: element.typography.fontFamily,
            fontSize: element.typography.fontSize,
            fontWeight: element.typography.fontWeight,
            left: line.x,
            lineHeight: `${Math.ceil(element.typography.fontSize * 1.25)}px`,
            top: line.y,
          }}
        >
          {line.text || "\u00a0"}
        </span>
      ))}
    </div>
  );
};

const RectHandles = ({
  element,
  onHandlePointerDown,
}: {
  element: Exclude<OrgEditorCanvasElement, { type: "arrow" }>;
  onHandlePointerDown: (
    event: React.PointerEvent<Element>,
    handle: OrgEditorCanvasElementHandle,
  ) => void;
}) => {
  const t = useUiText();

  return (
    <>
      <CanvasPerimeterTransformHandles onHandlePointerDown={onHandlePointerDown} />
      {ORG_EDITOR_RECT_ANCHOR_IDS.map((anchorId) => {
        if (anchorId === "center") return null;
        const point = getOrgEditorCanvasElementAnchorPoint(
          { ...element, rotation: 0, x: 0, y: 0 },
          anchorId,
        );
        if (!point) return null;
        const inset = Math.min(10, element.width / 3, element.height / 3);
        return (
          <button
            aria-label={t("Attach canvas element")}
            className="absolute z-30 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-background bg-signal"
            data-canvas-anchor-id={anchorId}
            key={anchorId}
            onPointerDown={(event) =>
              onHandlePointerDown(event, {
                anchorId: anchorId as OrgEditorRectAnchorId,
                type: "attach",
              })
            }
            style={{
              left: Math.min(element.width - inset, Math.max(inset, point.x)),
              top: Math.min(element.height - inset, Math.max(inset, point.y)),
            }}
            type="button"
          />
        );
      })}
    </>
  );
};

export function OrgEditorCanvasElementNode({
  editingText,
  element,
  imageUnavailableLabel,
  isSelected,
  onEditingTextChange,
  onFinishEditing,
  onDoubleClick,
  onContextMenu,
  onHandlePointerDown,
  onPointerDown,
  showHandles = isSelected,
}: {
  element: OrgEditorCanvasElement;
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
  onFinishEditing?: () => void;
  onPointerDown: (event: React.PointerEvent<Element>, element: OrgEditorCanvasElement) => void;
  showHandles?: boolean;
}) {
  const t = useUiText();
  const [imageFailed, setImageFailed] = useState(false);
  const textEditorRef = useRef<HTMLTextAreaElement | null>(null);
  const imageDataUrl = element.type === "image" ? element.dataUrl : null;

  useEffect(() => {
    if (editingText !== null && editingText !== undefined) textEditorRef.current?.focus();
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
              {ORG_EDITOR_ARROW_ANCHOR_IDS.map((anchorId) => {
                const point = getOrgEditorCanvasElementAnchorPoint(element, anchorId);
                return point ? (
                  <circle
                    className="pointer-events-none fill-signal stroke-background"
                    cx={point.x}
                    cy={point.y}
                    data-canvas-anchor-id={anchorId}
                    key={anchorId}
                    r={3}
                  />
                ) : null;
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
        "absolute m-0 min-w-0 touch-none border-0 p-0",
        element.type === "sticker" && "rounded-xl shadow-sm",
        element.type === "image" && "rounded-lg",
        isSelected && "outline outline-2 outline-offset-2 outline-signal",
      )}
      data-canvas-element-id={element.id}
      data-canvas-element-layer={element.layer}
      data-canvas-element-type={element.type}
      onContextMenu={(event) => onContextMenu(event, element)}
      onDoubleClick={() => onDoubleClick(element.id)}
      onPointerDown={(event) => onPointerDown(event, element)}
      style={{
        backgroundColor:
          element.type === "sticker" ? employeeTagColorToHex(element.backgroundColor) : undefined,
        height: element.height,
        left: element.x,
        top: element.y,
        transform: `rotate(${element.rotation}deg)`,
        transformOrigin: "center",
        width: element.width,
      }}
    >
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
      ) : editingText !== null && editingText !== undefined ? (
        <textarea
          aria-label={t("Canvas element text")}
          className="absolute inset-0 z-10 size-full resize-none border-0 bg-transparent p-2 outline-none"
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
            fontFamily: element.typography.fontFamily,
            fontSize: element.typography.fontSize,
            fontWeight: element.typography.fontWeight,
            textAlign: element.typography.horizontalAlign,
          }}
          value={editingText}
        />
      ) : (
        <CanvasText element={element} />
      )}
      {showHandles && isSelected && isOrgEditorRectElement(element) && (
        <RectHandles
          element={element}
          onHandlePointerDown={(event, handle) => onHandlePointerDown(event, element, handle)}
        />
      )}
    </fieldset>
  );
}
