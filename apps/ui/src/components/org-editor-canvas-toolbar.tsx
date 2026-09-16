"use client";

import type {
  EmployeeTagColor,
  OrgEditorCanvasElement,
  OrgEditorHorizontalAlign,
  OrgEditorVerticalAlign,
} from "@org-tools/types";
import { useState } from "react";
import {
  HiOutlineArrowLongRight,
  HiOutlineArrowsPointingOut,
  HiOutlineBars3BottomLeft,
  HiOutlineBars3BottomRight,
  HiOutlineBars3CenterLeft,
  HiOutlineBold,
  HiOutlineCursorArrowRays,
  HiOutlinePhoto,
} from "react-icons/hi2";
import { TbLetterT, TbSticker } from "react-icons/tb";

import {
  ORG_EDITOR_TOOLBAR_BUTTON_CLASS_NAME,
  ORG_EDITOR_TOOLBAR_FIELD_CLASS_NAME,
  ORG_EDITOR_TOOLBAR_ICON_BUTTON_CLASS_NAME,
  ORG_EDITOR_TOOLBAR_SURFACE_CLASS_NAME,
} from "@/components/org-editor-toolbar-style";
import { TagColorPicker } from "@/components/tag-color-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUiText } from "@/i18n/use-ui-text";
import {
  getOrgEditorCanvasCssFontFamily,
  normalizeOrgEditorCanvasDimension,
  normalizeOrgEditorCanvasDimensions,
  ORG_EDITOR_CANVAS_FONTS,
  resolveOrgEditorCanvasFontFamily,
  resolveOrgEditorCanvasTypography,
} from "@/lib/org-editor-canvas";
import { cn } from "@/lib/utils";

export type OrgEditorCanvasTool = "arrow" | "image" | "select" | "sticker" | "text";

const toolDefinitions = [
  { icon: HiOutlineCursorArrowRays, tool: "select" as const },
  { icon: TbLetterT, tool: "text" as const },
  { icon: HiOutlineArrowLongRight, tool: "arrow" as const },
  { icon: TbSticker, tool: "sticker" as const },
  { icon: HiOutlinePhoto, tool: "image" as const },
];

const horizontalAlignments = ["left", "center", "right"] as const;
const verticalAlignments = ["top", "middle", "bottom"] as const;

const getHorizontalAlignmentLabel = (alignment: OrgEditorHorizontalAlign) =>
  alignment === "left" ? "Align left" : alignment === "center" ? "Align center" : "Align right";

const getVerticalAlignmentLabel = (alignment: OrgEditorVerticalAlign) =>
  alignment === "top" ? "Align top" : alignment === "middle" ? "Align middle" : "Align bottom";

function AlignmentIcon({ alignment }: { alignment: OrgEditorHorizontalAlign }) {
  const Icon =
    alignment === "left"
      ? HiOutlineBars3BottomLeft
      : alignment === "center"
        ? HiOutlineBars3CenterLeft
        : HiOutlineBars3BottomRight;
  return <Icon />;
}

export function OrgEditorCanvasToolbar({
  activeTool,
  onImage,
  onToolChange,
  onUpdate,
  selectedElements,
}: {
  activeTool: OrgEditorCanvasTool;
  onImage: () => void;
  onToolChange: (tool: OrgEditorCanvasTool) => void;
  onUpdate: (update: (element: OrgEditorCanvasElement) => OrgEditorCanvasElement) => void;
  selectedElements: OrgEditorCanvasElement[];
}) {
  const t = useUiText();
  const [alignmentOpen, setAlignmentOpen] = useState(false);
  const selected = selectedElements.length === 1 ? selectedElements[0] : null;
  const textElement = selected?.type === "text" || selected?.type === "sticker" ? selected : null;
  const resolvedTextTypography = textElement
    ? resolveOrgEditorCanvasTypography(textElement.typography)
    : null;

  const updateTextTypography = (
    patch: Partial<Extract<OrgEditorCanvasElement, { type: "text" | "sticker" }>["typography"]>,
  ) =>
    onUpdate((element) =>
      element.type === "text" || element.type === "sticker"
        ? {
            ...element,
            typography: { ...resolveOrgEditorCanvasTypography(element.typography), ...patch },
          }
        : element,
    );

  return (
    <div
      className="flex max-w-[min(52rem,calc(100vw-1.5rem))] flex-col-reverse items-center gap-1"
      data-demo-id="org-editor-canvas-tools"
    >
      <div
        className={cn("flex items-center gap-1", ORG_EDITOR_TOOLBAR_SURFACE_CLASS_NAME)}
        data-demo-id="org-editor-canvas-tool-actions"
      >
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
                ORG_EDITOR_TOOLBAR_ICON_BUTTON_CLASS_NAME,
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
      </div>

      {selected && (
        <div
          className={cn(
            "inline-flex max-w-[min(46rem,calc(100vw-1.5rem))] items-center gap-1",
            ORG_EDITOR_TOOLBAR_SURFACE_CLASS_NAME,
          )}
          data-demo-id="org-editor-canvas-properties"
        >
          {textElement && (
            <>
              <Select
                onValueChange={(fontFamily) => updateTextTypography({ fontFamily })}
                value={resolveOrgEditorCanvasFontFamily(textElement.typography.fontFamily)}
              >
                <SelectTrigger
                  aria-label={t("Font")}
                  className={cn(ORG_EDITOR_TOOLBAR_FIELD_CLASS_NAME, "w-28")}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORG_EDITOR_CANVAS_FONTS.map((font) => (
                    <SelectItem key={font} value={font}>
                      <span style={{ fontFamily: getOrgEditorCanvasCssFontFamily(font) }}>
                        {font === "system-ui" ? t("System") : t("Georgia")}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                aria-label={t("Font size")}
                className={cn(ORG_EDITOR_TOOLBAR_FIELD_CLASS_NAME, "w-16")}
                max={200}
                min={8}
                onChange={(event) => {
                  const fontSize = Number(event.currentTarget.value);
                  if (Number.isFinite(fontSize)) {
                    updateTextTypography({ fontSize: Math.min(200, Math.max(8, fontSize)) });
                  }
                }}
                type="number"
                value={textElement.typography.fontSize}
              />
              <Button
                aria-label={t("Bold")}
                aria-pressed={resolvedTextTypography?.fontWeight === 700}
                className={cn(
                  ORG_EDITOR_TOOLBAR_ICON_BUTTON_CLASS_NAME,
                  resolvedTextTypography?.fontWeight === 700 && "bg-accent-strong text-foreground",
                )}
                data-canvas-bold-trigger
                onClick={() =>
                  updateTextTypography({
                    fontWeight: resolvedTextTypography?.fontWeight === 700 ? 400 : 700,
                  })
                }
                title={t("Bold")}
                type="button"
                variant="ghost"
              >
                <HiOutlineBold />
              </Button>
              <TagColorPicker
                allowNoColor={false}
                label={t("Text color")}
                onChange={(color) => color && updateTextTypography({ color })}
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
              <Popover onOpenChange={setAlignmentOpen} open={alignmentOpen}>
                <PopoverTrigger asChild>
                  <Button
                    aria-label={t("Alignment")}
                    className={ORG_EDITOR_TOOLBAR_ICON_BUTTON_CLASS_NAME}
                    data-canvas-alignment-trigger
                    title={`${t(getHorizontalAlignmentLabel(textElement.typography.horizontalAlign))} · ${t(getVerticalAlignmentLabel(textElement.typography.verticalAlign))}`}
                    type="button"
                    variant="ghost"
                  >
                    <AlignmentIcon alignment={textElement.typography.horizontalAlign} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="grid grid-cols-3 gap-1 p-1.5">
                  {verticalAlignments.flatMap((verticalAlign) =>
                    horizontalAlignments.map((horizontalAlign) => {
                      const active =
                        textElement.typography.horizontalAlign === horizontalAlign &&
                        textElement.typography.verticalAlign === verticalAlign;
                      const label = `${t(getHorizontalAlignmentLabel(horizontalAlign))} · ${t(getVerticalAlignmentLabel(verticalAlign))}`;
                      return (
                        <Button
                          aria-label={label}
                          aria-pressed={active}
                          className={cn("relative size-8 p-0", active && "bg-accent-strong")}
                          data-canvas-alignment={`${verticalAlign}:${horizontalAlign}`}
                          key={`${verticalAlign}:${horizontalAlign}`}
                          onClick={() => {
                            updateTextTypography({ horizontalAlign, verticalAlign });
                            setAlignmentOpen(false);
                          }}
                          title={label}
                          type="button"
                          variant="ghost"
                        >
                          <span
                            aria-hidden="true"
                            className={cn(
                              "absolute size-1.5 rounded-full bg-current",
                              horizontalAlign === "left"
                                ? "left-1.5"
                                : horizontalAlign === "right"
                                  ? "right-1.5"
                                  : "left-1/2 -translate-x-1/2",
                              verticalAlign === "top"
                                ? "top-1.5"
                                : verticalAlign === "bottom"
                                  ? "bottom-1.5"
                                  : "top-1/2 -translate-y-1/2",
                            )}
                          />
                        </Button>
                      );
                    }),
                  )}
                </PopoverContent>
              </Popover>
            </>
          )}

          {selected?.type === "arrow" && (
            <>
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
                className={cn(ORG_EDITOR_TOOLBAR_FIELD_CLASS_NAME, "w-16")}
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
                className={cn(ORG_EDITOR_TOOLBAR_BUTTON_CLASS_NAME, "px-2 text-xs")}
                onClick={() =>
                  onUpdate((element) =>
                    element.type === "arrow"
                      ? { ...element, dash: element.dash === "solid" ? "dashed" : "solid" }
                      : element,
                  )
                }
                title={t(selected.dash === "solid" ? "Solid line" : "Dashed line")}
                type="button"
                variant="ghost"
              >
                {t(selected.dash === "solid" ? "Solid line" : "Dashed line")}
              </Button>
              {(["start", "end"] as const).map((endpoint) => (
                <Select
                  key={endpoint}
                  onValueChange={(value) =>
                    onUpdate((element) =>
                      element.type === "arrow"
                        ? { ...element, [`${endpoint}Marker`]: value as "arrow" | "none" }
                        : element,
                    )
                  }
                  value={selected[`${endpoint}Marker`]}
                >
                  <SelectTrigger
                    aria-label={t(endpoint === "start" ? "Arrow start marker" : "Arrow end marker")}
                    className={cn(ORG_EDITOR_TOOLBAR_FIELD_CLASS_NAME, "w-24")}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("No marker")}</SelectItem>
                    <SelectItem value="arrow">{t("Arrow marker")}</SelectItem>
                  </SelectContent>
                </Select>
              ))}
            </>
          )}

          {selected && selected.type !== "arrow" && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  aria-label={t("Geometry")}
                  className={ORG_EDITOR_TOOLBAR_ICON_BUTTON_CLASS_NAME}
                  data-canvas-geometry-trigger
                  title={t("Geometry")}
                  type="button"
                  variant="ghost"
                >
                  <HiOutlineArrowsPointingOut />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="grid w-56 grid-cols-3 gap-2 p-2">
                <Input
                  aria-label={t("Element width")}
                  max={20_000}
                  min={24}
                  onChange={(event) => {
                    const width = Number(event.currentTarget.value);
                    if (!Number.isFinite(width)) return;
                    onUpdate((element) =>
                      element.type === "arrow"
                        ? element
                        : {
                            ...element,
                            ...normalizeOrgEditorCanvasDimensions({
                              height: element.height,
                              width,
                            }),
                          },
                    );
                  }}
                  step={1}
                  title={t("Element width")}
                  type="number"
                  value={normalizeOrgEditorCanvasDimension(selected.width)}
                />
                <Input
                  aria-label={t("Element height")}
                  max={20_000}
                  min={24}
                  onChange={(event) => {
                    const height = Number(event.currentTarget.value);
                    if (!Number.isFinite(height)) return;
                    onUpdate((element) =>
                      element.type === "arrow"
                        ? element
                        : {
                            ...element,
                            ...normalizeOrgEditorCanvasDimensions({
                              height,
                              width: element.width,
                            }),
                          },
                    );
                  }}
                  step={1}
                  title={t("Element height")}
                  type="number"
                  value={normalizeOrgEditorCanvasDimension(selected.height)}
                />
                <Input
                  aria-label={t("Rotation")}
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
                  step={1}
                  title={t("Rotation")}
                  type="number"
                  value={selected.rotation}
                />
              </PopoverContent>
            </Popover>
          )}
        </div>
      )}
    </div>
  );
}
