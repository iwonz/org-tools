"use client";

import type {
  EmployeeTagColor,
  OrgEditorCanvasElement,
  OrgEditorVerticalAlign,
} from "@org-tools/types";
import {
  HiOutlineArrowDownTray,
  HiOutlineArrowLongRight,
  HiOutlineBars3BottomLeft,
  HiOutlineBars3BottomRight,
  HiOutlineBars3CenterLeft,
  HiOutlineChatBubbleBottomCenterText,
  HiOutlineCursorArrowRays,
  HiOutlineDocumentDuplicate,
  HiOutlineDocumentText,
  HiOutlineLockClosed,
  HiOutlineLockOpen,
  HiOutlinePhoto,
  HiOutlineQueueList,
  HiOutlineTrash,
} from "react-icons/hi2";

import { TagColorPicker } from "@/components/tag-color-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUiText } from "@/i18n/use-ui-text";
import { ORG_EDITOR_CANVAS_FONTS } from "@/lib/org-editor-canvas";
import { cn } from "@/lib/utils";

export type OrgEditorCanvasTool = "arrow" | "image" | "select" | "sticker" | "text";

const toolDefinitions = [
  { icon: HiOutlineCursorArrowRays, tool: "select" as const },
  { icon: HiOutlineDocumentText, tool: "text" as const },
  { icon: HiOutlineArrowLongRight, tool: "arrow" as const },
  { icon: HiOutlineChatBubbleBottomCenterText, tool: "sticker" as const },
  { icon: HiOutlinePhoto, tool: "image" as const },
];

export function OrgEditorCanvasToolbar({
  activeTool,
  onDelete,
  onDuplicate,
  onExport,
  onImage,
  onLayer,
  onOrder,
  onToolChange,
  onUpdate,
  selectedElements,
}: {
  activeTool: OrgEditorCanvasTool;
  onDelete: () => void;
  onDuplicate: () => void;
  onExport: () => void;
  onImage: () => void;
  onLayer: (layer: OrgEditorCanvasElement["layer"]) => void;
  onOrder: (direction: "back" | "backward" | "forward" | "front") => void;
  onToolChange: (tool: OrgEditorCanvasTool) => void;
  onUpdate: (update: (element: OrgEditorCanvasElement) => OrgEditorCanvasElement) => void;
  selectedElements: OrgEditorCanvasElement[];
}) {
  const t = useUiText();
  const selected = selectedElements.length === 1 ? selectedElements[0] : null;
  const textElement = selected?.type === "text" || selected?.type === "sticker" ? selected : null;

  return (
    <div
      className="flex max-w-[min(52rem,calc(100vw-1.5rem))] flex-col items-end gap-1"
      data-demo-id="org-editor-canvas-tools"
    >
      <div className="flex items-center gap-1 rounded-lg border border-border/80 bg-background/95 p-1 shadow-sm backdrop-blur">
        {toolDefinitions.map(({ icon: Icon, tool }) => {
          const label = t(
            tool === "select"
              ? "Select tool"
              : tool === "text"
                ? "Text tool"
                : tool === "arrow"
                  ? "Arrow tool"
                  : tool === "sticker"
                    ? "Sticker tool"
                    : "Image tool",
          );
          return (
            <Button
              aria-label={label}
              aria-pressed={activeTool === tool}
              className={cn(
                "size-8 p-0",
                activeTool === tool && "bg-accent-strong text-foreground",
              )}
              data-canvas-tool={tool}
              key={tool}
              onClick={() => {
                onToolChange(tool);
                if (tool === "image") onImage();
              }}
              title={label}
              type="button"
              variant="ghost"
            >
              <Icon />
            </Button>
          );
        })}
        <Button
          data-demo-id="org-editor-view-image-export-action"
          onClick={onExport}
          size="sm"
          title={t("Export View image")}
          type="button"
          variant="ghost"
        >
          <HiOutlineArrowDownTray />
          <span>{t("Export image")}</span>
        </Button>
      </div>

      {selectedElements.length > 0 && (
        <div
          className="flex w-[min(46rem,calc(100vw-1.5rem))] max-w-full flex-wrap items-center justify-end gap-1 rounded-lg border border-border/80 bg-background/95 p-1 shadow-sm backdrop-blur"
          data-demo-id="org-editor-canvas-properties"
        >
          {textElement && (
            <div
              className="flex min-w-0 basis-full flex-wrap items-center justify-end gap-1 rounded-md bg-muted/45 p-1"
              data-canvas-property-group="typography"
            >
              <Select
                onValueChange={(fontFamily) =>
                  onUpdate((element) =>
                    element.type === "text" || element.type === "sticker"
                      ? { ...element, typography: { ...element.typography, fontFamily } }
                      : element,
                  )
                }
                value={textElement.typography.fontFamily}
              >
                <SelectTrigger aria-label={t("Font")} className="h-8 w-28 min-w-0 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORG_EDITOR_CANVAS_FONTS.map((font) => (
                    <SelectItem key={font} value={font}>
                      <span style={{ fontFamily: font }}>{font}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                aria-label={t("Font size")}
                className="h-8 w-16 text-xs"
                max={200}
                min={8}
                onChange={(event) => {
                  const fontSize = Number(event.currentTarget.value);
                  if (!Number.isFinite(fontSize)) return;
                  onUpdate((element) =>
                    element.type === "text" || element.type === "sticker"
                      ? {
                          ...element,
                          typography: {
                            ...element.typography,
                            fontSize: Math.min(200, Math.max(8, fontSize)),
                          },
                        }
                      : element,
                  );
                }}
                type="number"
                value={textElement.typography.fontSize}
              />
              <Select
                onValueChange={(value) => {
                  const fontWeight = Number(value) as 400 | 500 | 700;
                  onUpdate((element) =>
                    element.type === "text" || element.type === "sticker"
                      ? { ...element, typography: { ...element.typography, fontWeight } }
                      : element,
                  );
                }}
                value={String(textElement.typography.fontWeight)}
              >
                <SelectTrigger aria-label={t("Font weight")} className="h-8 w-24 min-w-0 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="400">{t("Regular")}</SelectItem>
                  <SelectItem value="500">{t("Medium")}</SelectItem>
                  <SelectItem value="700">{t("Bold")}</SelectItem>
                </SelectContent>
              </Select>
              {(["left", "center", "right"] as const).map((alignment) => {
                const Icon =
                  alignment === "left"
                    ? HiOutlineBars3BottomLeft
                    : alignment === "center"
                      ? HiOutlineBars3CenterLeft
                      : HiOutlineBars3BottomRight;
                return (
                  <Button
                    aria-label={t(
                      alignment === "left"
                        ? "Align left"
                        : alignment === "center"
                          ? "Align center"
                          : "Align right",
                    )}
                    className={cn(
                      "size-8 p-0",
                      textElement.typography.horizontalAlign === alignment && "bg-accent-strong",
                    )}
                    key={alignment}
                    onClick={() =>
                      onUpdate((element) =>
                        element.type === "text" || element.type === "sticker"
                          ? {
                              ...element,
                              typography: { ...element.typography, horizontalAlign: alignment },
                            }
                          : element,
                      )
                    }
                    type="button"
                    variant="ghost"
                  >
                    <Icon />
                  </Button>
                );
              })}
              <TagColorPicker
                allowNoColor={false}
                label={t("Text color")}
                onChange={(color) => {
                  if (!color) return;
                  onUpdate((element) =>
                    element.type === "text" || element.type === "sticker"
                      ? { ...element, typography: { ...element.typography, color } }
                      : element,
                  );
                }}
                value={textElement.typography.color}
                variant="icon"
              />
              {textElement.type === "sticker" && (
                <TagColorPicker
                  allowNoColor={false}
                  label={t("Sticker color")}
                  onChange={(backgroundColor: EmployeeTagColor | null) => {
                    if (!backgroundColor) return;
                    onUpdate((element) =>
                      element.type === "sticker" ? { ...element, backgroundColor } : element,
                    );
                  }}
                  value={textElement.backgroundColor}
                  variant="icon"
                />
              )}
              <Select
                onValueChange={(value) => {
                  const verticalAlign = value as OrgEditorVerticalAlign;
                  onUpdate((element) =>
                    element.type === "text" || element.type === "sticker"
                      ? { ...element, typography: { ...element.typography, verticalAlign } }
                      : element,
                  );
                }}
                value={textElement.typography.verticalAlign}
              >
                <SelectTrigger
                  aria-label={t("Vertical alignment")}
                  className="h-8 w-28 min-w-0 text-xs"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top">{t("Align top")}</SelectItem>
                  <SelectItem value="middle">{t("Align middle")}</SelectItem>
                  <SelectItem value="bottom">{t("Align bottom")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {selected?.type === "arrow" && (
            <div
              className="flex min-w-0 basis-full flex-wrap items-center justify-end gap-1 rounded-md bg-muted/45 p-1"
              data-canvas-property-group="arrow"
            >
              <TagColorPicker
                allowNoColor={false}
                label={t("Arrow color")}
                onChange={(strokeColor) => {
                  if (!strokeColor) return;
                  onUpdate((element) =>
                    element.type === "arrow" ? { ...element, strokeColor } : element,
                  );
                }}
                value={selected.strokeColor}
                variant="icon"
              />
              <Input
                aria-label={t("Line width")}
                className="h-8 w-16 text-xs"
                max={24}
                min={1}
                onChange={(event) => {
                  const strokeWidth = Number(event.currentTarget.value);
                  if (!Number.isFinite(strokeWidth)) return;
                  onUpdate((element) =>
                    element.type === "arrow"
                      ? { ...element, strokeWidth: Math.min(24, Math.max(1, strokeWidth)) }
                      : element,
                  );
                }}
                type="number"
                value={selected.strokeWidth}
              />
              <Button
                onClick={() =>
                  onUpdate((element) =>
                    element.type === "arrow"
                      ? { ...element, dash: element.dash === "solid" ? "dashed" : "solid" }
                      : element,
                  )
                }
                size="sm"
                type="button"
                variant="ghost"
              >
                {t(selected.dash === "solid" ? "Solid line" : "Dashed line")}
              </Button>
              <Select
                onValueChange={(value) => {
                  const startMarker = value as "arrow" | "none";
                  onUpdate((element) =>
                    element.type === "arrow" ? { ...element, startMarker } : element,
                  );
                }}
                value={selected.startMarker}
              >
                <SelectTrigger
                  aria-label={t("Arrow start marker")}
                  className="h-8 w-28 min-w-0 text-xs"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("No marker")}</SelectItem>
                  <SelectItem value="arrow">{t("Arrow marker")}</SelectItem>
                </SelectContent>
              </Select>
              <Select
                onValueChange={(value) => {
                  const endMarker = value as "arrow" | "none";
                  onUpdate((element) =>
                    element.type === "arrow" ? { ...element, endMarker } : element,
                  );
                }}
                value={selected.endMarker}
              >
                <SelectTrigger
                  aria-label={t("Arrow end marker")}
                  className="h-8 w-28 min-w-0 text-xs"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("No marker")}</SelectItem>
                  <SelectItem value="arrow">{t("Arrow marker")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {selected?.type === "image" && (
            <Button
              aria-label={t("Lock aspect ratio")}
              className="size-8 p-0"
              onClick={() =>
                onUpdate((element) =>
                  element.type === "image"
                    ? { ...element, lockAspectRatio: !element.lockAspectRatio }
                    : element,
                )
              }
              title={t("Lock aspect ratio")}
              type="button"
              variant="ghost"
            >
              {selected.lockAspectRatio ? <HiOutlineLockClosed /> : <HiOutlineLockOpen />}
            </Button>
          )}

          {selected && selected.type !== "arrow" && (
            <div
              className="flex items-center gap-1 rounded-md bg-muted/45 p-1"
              data-canvas-property-group="geometry"
            >
              <Input
                aria-label={t("Element width")}
                className="h-8 w-20 text-xs"
                max={20_000}
                min={24}
                onChange={(event) => {
                  const width = Number(event.currentTarget.value);
                  if (!Number.isFinite(width)) return;
                  onUpdate((element) =>
                    element.type === "arrow"
                      ? element
                      : element.type === "image" && element.lockAspectRatio
                        ? {
                            ...element,
                            height: Math.min(
                              20_000,
                              Math.max(
                                24,
                                (Math.min(20_000, Math.max(24, width)) / element.width) *
                                  element.height,
                              ),
                            ),
                            width: Math.min(20_000, Math.max(24, width)),
                          }
                        : { ...element, width: Math.min(20_000, Math.max(24, width)) },
                  );
                }}
                type="number"
                value={selected.width}
              />
              <Input
                aria-label={t("Element height")}
                className="h-8 w-20 text-xs"
                max={20_000}
                min={24}
                onChange={(event) => {
                  const height = Number(event.currentTarget.value);
                  if (!Number.isFinite(height)) return;
                  onUpdate((element) =>
                    element.type === "arrow"
                      ? element
                      : element.type === "image" && element.lockAspectRatio
                        ? {
                            ...element,
                            height: Math.min(20_000, Math.max(24, height)),
                            width: Math.min(
                              20_000,
                              Math.max(
                                24,
                                (Math.min(20_000, Math.max(24, height)) / element.height) *
                                  element.width,
                              ),
                            ),
                          }
                        : { ...element, height: Math.min(20_000, Math.max(24, height)) },
                  );
                }}
                type="number"
                value={selected.height}
              />
              <Input
                aria-label={t("Rotation")}
                className="h-8 w-20 text-xs"
                max={180}
                min={-180}
                onChange={(event) => {
                  const rotation = Number(event.currentTarget.value);
                  if (!Number.isFinite(rotation)) return;
                  onUpdate((element) =>
                    element.type === "arrow"
                      ? element
                      : { ...element, rotation: Math.min(180, Math.max(-180, rotation)) },
                  );
                }}
                type="number"
                value={selected.rotation}
              />
            </div>
          )}

          <div
            className="flex items-center gap-1 rounded-md bg-muted/45 p-1"
            data-canvas-property-group="arrangement"
          >
            <Select
              onValueChange={(value) => onLayer(value as OrgEditorCanvasElement["layer"])}
              value={selected?.layer ?? selectedElements[0]?.layer ?? "aboveUnits"}
            >
              <SelectTrigger aria-label={t("Layer")} className="h-8 w-28 min-w-0 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="behindUnits">{t("Behind Units")}</SelectItem>
                <SelectItem value="aboveUnits">{t("Above Units")}</SelectItem>
              </SelectContent>
            </Select>
            <Button
              aria-label={t("Send to back")}
              className="size-8 p-0"
              onClick={() => onOrder("back")}
              title={t("Send to back")}
              type="button"
              variant="ghost"
            >
              <HiOutlineQueueList />
            </Button>
            <Button
              aria-label={t("Send backward")}
              className="size-8 p-0"
              onClick={() => onOrder("backward")}
              title={t("Send backward")}
              type="button"
              variant="ghost"
            >
              <HiOutlineQueueList />
            </Button>
            <Button
              aria-label={t("Bring forward")}
              className="size-8 p-0"
              onClick={() => onOrder("forward")}
              title={t("Bring forward")}
              type="button"
              variant="ghost"
            >
              <HiOutlineQueueList className="rotate-180" />
            </Button>
            <Button
              aria-label={t("Bring to front")}
              className="size-8 p-0"
              onClick={() => onOrder("front")}
              title={t("Bring to front")}
              type="button"
              variant="ghost"
            >
              <HiOutlineQueueList className="rotate-180" />
            </Button>
            <Button
              aria-label={t("Duplicate")}
              className="size-8 p-0"
              onClick={onDuplicate}
              title={t("Duplicate")}
              type="button"
              variant="ghost"
            >
              <HiOutlineDocumentDuplicate />
            </Button>
            <Button
              aria-label={t("Delete")}
              className="size-8 p-0 text-destructive"
              onClick={onDelete}
              title={t("Delete")}
              type="button"
              variant="ghost"
            >
              <HiOutlineTrash />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
