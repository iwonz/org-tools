"use client";

import type {
  EmployeeTagColor,
  OrgEditorCanvasElement,
  OrgEditorHorizontalAlign,
  OrgEditorInlineTypography,
  OrgEditorVerticalAlign,
} from "@org-tools/types";
import { useState } from "react";
import {
  HiOutlineArrowsPointingOut,
  HiOutlineArrowUpRight,
  HiOutlineBars3BottomLeft,
  HiOutlineBars3BottomRight,
  HiOutlineBars3CenterLeft,
  HiOutlineBold,
  HiOutlineCursorArrowRays,
} from "react-icons/hi2";
import { PiSticker } from "react-icons/pi";
import { TbLetterT, TbPhotoSquareRounded } from "react-icons/tb";

import type { OrgEditorCanvasTextDraft } from "@/components/org-editor-canvas-element";
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
  getOrgEditorTextRangeTypography,
  normalizeOrgEditorCanvasDimension,
  normalizeOrgEditorCanvasDimensions,
  ORG_EDITOR_CANVAS_FONTS,
  resolveOrgEditorCanvasTypography,
} from "@/lib/org-editor-canvas";
import { cn } from "@/lib/utils";

export type OrgEditorCanvasTool = "arrow" | "image" | "select" | "sticker" | "text";

const toolDefinitions = [
  { icon: HiOutlineCursorArrowRays, tool: "select" as const },
  { icon: TbLetterT, tool: "text" as const },
  { icon: ArrowToolIcon, tool: "arrow" as const },
  { icon: PiSticker, tool: "sticker" as const },
  { icon: ImageToolIcon, tool: "image" as const },
];

function ArrowToolIcon() {
  return <HiOutlineArrowUpRight aria-hidden="true" data-canvas-tool-icon="arrow-up-right" />;
}

function ImageToolIcon() {
  return <TbPhotoSquareRounded aria-hidden="true" data-canvas-tool-icon="image-rounded" />;
}

function ArrowMarkerIcon({ endpoint }: { endpoint: "end" | "start" }) {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path
        d={
          endpoint === "start"
            ? "M20 7C14 7 10 10 5 16M5 16l1-5M5 16l5-1"
            : "M4 7c6 0 10 3 15 9M19 16l-1-5M19 16l-5-1"
        }
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

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
  editingTextDraft,
  onImage,
  onPropertyInteractionStart,
  onToolChange,
  onTextTypographyChange,
  onUpdate,
  selectedElements,
}: {
  activeTool: OrgEditorCanvasTool;
  editingTextDraft?: OrgEditorCanvasTextDraft | null;
  onImage: () => void;
  onPropertyInteractionStart?: () => void;
  onToolChange: (tool: OrgEditorCanvasTool) => void;
  onTextTypographyChange?: (patch: Partial<OrgEditorInlineTypography>) => void;
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
  const selectedTextTypography =
    textElement && editingTextDraft
      ? (editingTextDraft.pendingTypography ??
        getOrgEditorTextRangeTypography({
          end: editingTextDraft.selection.end,
          formatRuns: editingTextDraft.formatRuns,
          start: editingTextDraft.selection.start,
          text: editingTextDraft.text,
          typography: textElement.typography,
        }))
      : resolvedTextTypography;

  const updateTextTypography = (patch: Partial<OrgEditorInlineTypography>) => {
    if (textElement && onTextTypographyChange) {
      onTextTypographyChange(patch);
      return;
    }
    onUpdate((element) =>
      element.type === "text" || element.type === "sticker"
        ? {
            ...element,
            typography: { ...resolveOrgEditorCanvasTypography(element.typography), ...patch },
          }
        : element,
    );
  };

  return (
    <div
      className="flex w-max max-w-[min(52rem,calc(100vw-1.5rem))] flex-col-reverse items-center gap-1"
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

      {selected && selected.type !== "image" && (
        <div
          className={cn(
            "inline-flex w-max max-w-[min(46rem,calc(100vw-1.5rem))] items-center gap-1 overflow-x-auto",
            ORG_EDITOR_TOOLBAR_SURFACE_CLASS_NAME,
          )}
          data-demo-id="org-editor-canvas-properties"
          onPointerDownCapture={onPropertyInteractionStart}
        >
          {textElement && (
            <>
              <Select
                {...(selectedTextTypography?.fontFamily
                  ? { value: selectedTextTypography.fontFamily }
                  : {})}
                onValueChange={(fontFamily) => updateTextTypography({ fontFamily })}
              >
                <SelectTrigger
                  aria-label={t("Font")}
                  className={cn(ORG_EDITOR_TOOLBAR_FIELD_CLASS_NAME, "w-28")}
                >
                  <SelectValue placeholder={t("Mixed")} />
                </SelectTrigger>
                <SelectContent>
                  {ORG_EDITOR_CANVAS_FONTS.map((font) => (
                    <SelectItem key={font} value={font}>
                      <span style={{ fontFamily: getOrgEditorCanvasCssFontFamily(font) }}>
                        {font === "system-ui" ? t("System") : font}
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
                value={selectedTextTypography?.fontSize ?? ""}
              />
              <Button
                aria-label={t("Bold")}
                aria-pressed={
                  selectedTextTypography?.fontWeight === null
                    ? "mixed"
                    : selectedTextTypography?.fontWeight === 700
                }
                className={cn(
                  ORG_EDITOR_TOOLBAR_ICON_BUTTON_CLASS_NAME,
                  selectedTextTypography?.fontWeight === 700 && "bg-accent-strong text-foreground",
                )}
                data-canvas-bold-trigger
                onClick={() =>
                  updateTextTypography({
                    fontWeight: selectedTextTypography?.fontWeight === 700 ? 400 : 700,
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
                value={selectedTextTypography?.color ?? textElement.typography.color}
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
              {textElement.type === "text" && (
                <>
                  <Select
                    onValueChange={(fillMode) =>
                      onUpdate((element) =>
                        element.type === "text"
                          ? { ...element, fillMode: fillMode as "block" | "lines" | "none" }
                          : element,
                      )
                    }
                    value={textElement.fillMode}
                  >
                    <SelectTrigger
                      aria-label={t("Text background")}
                      className={cn(ORG_EDITOR_TOOLBAR_FIELD_CLASS_NAME, "w-48")}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t("No background")}</SelectItem>
                      <SelectItem value="block">{t("Block background")}</SelectItem>
                      <SelectItem value="lines">{t("Line background")}</SelectItem>
                    </SelectContent>
                  </Select>
                  {textElement.fillMode !== "none" && (
                    <TagColorPicker
                      allowNoColor={false}
                      label={t("Background color")}
                      onChange={(fillColor) => {
                        if (!fillColor) return;
                        onUpdate((element) =>
                          element.type === "text" ? { ...element, fillColor } : element,
                        );
                      }}
                      value={textElement.fillColor}
                      variant="icon"
                    />
                  )}
                </>
              )}
              <Popover onOpenChange={setAlignmentOpen} open={alignmentOpen}>
                <PopoverTrigger asChild>
                  <Button
                    aria-label={t("Alignment")}
                    className={ORG_EDITOR_TOOLBAR_ICON_BUTTON_CLASS_NAME}
                    data-canvas-alignment-trigger
                    title={
                      textElement.type === "text"
                        ? t(getHorizontalAlignmentLabel(textElement.typography.horizontalAlign))
                        : `${t(getHorizontalAlignmentLabel(textElement.typography.horizontalAlign))} · ${t(getVerticalAlignmentLabel(textElement.typography.verticalAlign))}`
                    }
                    type="button"
                    variant="ghost"
                  >
                    <AlignmentIcon alignment={textElement.typography.horizontalAlign} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="grid grid-cols-3 gap-1 p-1.5">
                  {(textElement.type === "text" ? (["top"] as const) : verticalAlignments).flatMap(
                    (verticalAlign) =>
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
                              onUpdate((element) =>
                                element.type === "text" || element.type === "sticker"
                                  ? {
                                      ...element,
                                      typography: {
                                        ...element.typography,
                                        horizontalAlign,
                                        verticalAlign,
                                      },
                                    }
                                  : element,
                              );
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
                <Button
                  aria-label={t(endpoint === "start" ? "Arrow start marker" : "Arrow end marker")}
                  aria-pressed={selected[`${endpoint}Marker`] === "arrow"}
                  className={cn(
                    ORG_EDITOR_TOOLBAR_ICON_BUTTON_CLASS_NAME,
                    selected[`${endpoint}Marker`] === "arrow" && "bg-accent-strong text-foreground",
                  )}
                  data-canvas-arrow-marker={endpoint}
                  key={endpoint}
                  onClick={() =>
                    onUpdate((element) =>
                      element.type === "arrow"
                        ? {
                            ...element,
                            [`${endpoint}Marker`]:
                              element[`${endpoint}Marker`] === "arrow" ? "none" : "arrow",
                          }
                        : element,
                    )
                  }
                  title={t(endpoint === "start" ? "Arrow start marker" : "Arrow end marker")}
                  type="button"
                  variant="ghost"
                >
                  <ArrowMarkerIcon endpoint={endpoint} />
                </Button>
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
              <PopoverContent align="end" className={cn("grid gap-2 p-2", "w-56 grid-cols-3")}>
                <Input
                  aria-label={t("Element width")}
                  max={20_000}
                  min={selected.type === "text" ? 48 : 24}
                  onChange={(event) => {
                    const width = Number(event.currentTarget.value);
                    if (!Number.isFinite(width)) return;
                    onUpdate((element) =>
                      element.type === "arrow"
                        ? element
                        : element.type === "text"
                          ? {
                              ...element,
                              autoWidth: false,
                              width: Math.max(48, normalizeOrgEditorCanvasDimension(width)),
                            }
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
                  value={Math.max(
                    selected.type === "text" ? 48 : 24,
                    normalizeOrgEditorCanvasDimension(selected.width),
                  )}
                />
                <Input
                  aria-label={t("Element height")}
                  max={20_000}
                  min={selected.type === "text" ? 32 : 24}
                  onChange={(event) => {
                    const height = Number(event.currentTarget.value);
                    if (!Number.isFinite(height)) return;
                    onUpdate((element) =>
                      element.type === "arrow"
                        ? element
                        : element.type === "text"
                          ? {
                              ...element,
                              autoWidth: false,
                              height: Math.max(32, normalizeOrgEditorCanvasDimension(height)),
                            }
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
                  value={Math.max(
                    selected.type === "text" ? 32 : 24,
                    normalizeOrgEditorCanvasDimension(selected.height),
                  )}
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
