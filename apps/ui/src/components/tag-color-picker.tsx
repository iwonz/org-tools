"use client";

import type { EmployeeTagColor, EmployeeTagColorName } from "@org-tools/types";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HiCheck, HiOutlineChevronDown, HiOutlineSwatch } from "react-icons/hi2";

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
import type { UiTextKey } from "@/i18n/messages";
import { useUiText } from "@/i18n/use-ui-text";
import {
  customTagColorSurfaceStyle,
  decodeTagColorDraft,
  EMPLOYEE_TAG_COLOR_NAMES,
  employeeTagColorToHex,
  encodeTagColorDraft,
  formatTagColorInput,
  hexToHsv,
  hsvToHex,
  isCustomEmployeeTagColor,
  parseTagColorInput,
  type TagColorDraft,
  type TagColorInputMode,
  tagColorInputPlaceholder,
  tagColorOpacityByteToPercent,
  tagColorOpacityPercentToByte,
  tagColorSurfaceClassName,
} from "@/lib/tag-color";
import { cn } from "@/lib/utils";

const TAG_COLOR_MESSAGE_KEYS = {
  amber: "Amber",
  blue: "Blue",
  cyan: "Cyan",
  green: "Green",
  orange: "Orange",
  red: "Red",
  rose: "Rose",
  teal: "Teal",
} as const satisfies Record<EmployeeTagColorName, UiTextKey>;

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

const parseOpacityInput = (value: string) => {
  if (!/^(?:0|[1-9]\d?|100)$/u.test(value)) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 100 ? parsed : null;
};

function TagColorLabel({
  color,
  emptyLabel,
  showOpacity = true,
  showSelectionSlot = false,
  selected = false,
}: {
  color: EmployeeTagColor | null;
  emptyLabel?: string | undefined;
  selected?: boolean;
  showOpacity?: boolean;
  showSelectionSlot?: boolean;
}) {
  const t = useUiText();
  const decoded = decodeTagColorDraft(color);
  const opacity = tagColorOpacityByteToPercent(decoded.opacityByte);
  const label = color
    ? decoded.baseColor && !isCustomEmployeeTagColor(decoded.baseColor)
      ? `${t(TAG_COLOR_MESSAGE_KEYS[decoded.baseColor])}${showOpacity && opacity < 100 ? ` · ${opacity}%` : ""}`
      : `${t("Custom color")} · ${employeeTagColorToHex(decoded.baseColor)}${showOpacity && opacity < 100 ? ` · ${opacity}%` : ""}`
    : (emptyLabel ?? t("No color"));

  return (
    <span
      className={cn(
        "inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-md px-2 py-0.5 text-sm font-medium",
        tagColorSurfaceClassName(color),
      )}
      data-tag-color={color ?? "none"}
      data-tag-color-surface
      style={customTagColorSurfaceStyle(color)}
    >
      <span className="truncate">{label}</span>
      {showSelectionSlot && (
        <span
          aria-hidden="true"
          className="inline-flex size-3 shrink-0 items-center justify-center"
        >
          {selected && <HiCheck className="size-3" />}
        </span>
      )}
    </span>
  );
}

export function TagColorPicker({
  onChange,
  value,
  variant = "field",
  label,
  allowNoColor = true,
  noColorLabel,
}: {
  onChange: (color: EmployeeTagColor | null) => void;
  label?: string;
  noColorLabel?: string | undefined;
  allowNoColor?: boolean;
  value: EmployeeTagColor | null;
  variant?: "field" | "icon";
}) {
  const t = useUiText();
  const [open, setOpen] = useState(false);
  const [inputMode, setInputMode] = useState<TagColorInputMode>("hex");
  const inputModeRef = useRef<TagColorInputMode>("hex");
  const initialDraft = decodeTagColorDraft(value);
  const [draft, setDraft] = useState<TagColorDraft>(initialDraft);
  const [inputValue, setInputValue] = useState(() => formatTagColorInput("hex", value));
  const [inputInvalid, setInputInvalid] = useState(false);
  const [opacityInput, setOpacityInput] = useState(() =>
    String(tagColorOpacityByteToPercent(initialDraft.opacityByte)),
  );
  const [opacityInvalid, setOpacityInvalid] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const gestureStartDraftRef = useRef<TagColorDraft | null>(null);
  const draftValue = encodeTagColorDraft(draft);
  const displayValue = open ? draftValue : value;
  const currentHex = employeeTagColorToHex(draft.baseColor).slice(0, 7) as `#${string}`;
  const hsv = hexToHsv(currentHex);
  const opacityPercent = tagColorOpacityByteToPercent(draft.opacityByte);

  const resetDraft = (color: EmployeeTagColor | null) => {
    const nextDraft = decodeTagColorDraft(color);
    setDraft(nextDraft);
    setInputValue(formatTagColorInput(inputModeRef.current, color));
    setInputInvalid(false);
    setOpacityInput(String(tagColorOpacityByteToPercent(nextDraft.opacityByte)));
    setOpacityInvalid(false);
    gestureStartDraftRef.current = null;
  };

  useEffect(() => {
    const nextDraft = decodeTagColorDraft(value);
    setDraft(nextDraft);
    setInputValue(formatTagColorInput(inputModeRef.current, value));
    setInputInvalid(false);
    setOpacityInput(String(tagColorOpacityByteToPercent(nextDraft.opacityByte)));
    setOpacityInvalid(false);
    gestureStartDraftRef.current = null;
  }, [value]);

  const previewDraft = (nextDraft: TagColorDraft) => {
    const nextValue = encodeTagColorDraft(nextDraft);
    setDraft(nextDraft);
    setInputValue(formatTagColorInput(inputModeRef.current, nextValue));
    setInputInvalid(false);
    setOpacityInput(String(tagColorOpacityByteToPercent(nextDraft.opacityByte)));
    setOpacityInvalid(false);
  };

  const previewBaseColor = (baseColor: TagColorDraft["baseColor"]) =>
    previewDraft({ ...draft, baseColor });

  const previewOpacity = (percent: number) => {
    const opacityByte = tagColorOpacityPercentToByte(percent);
    const nextDraft = { ...draft, opacityByte };
    setDraft(nextDraft);
    setOpacityInput(String(percent));
    setOpacityInvalid(false);
    if (inputModeRef.current === "rgba") {
      setInputValue(formatTagColorInput("rgba", encodeTagColorDraft(nextDraft)));
      setInputInvalid(false);
    }
  };

  const restoreGestureDraft = () => {
    const startDraft = gestureStartDraftRef.current;
    gestureStartDraftRef.current = null;
    if (startDraft) previewDraft(startDraft);
  };

  const updateSaturationAndValue = (clientX: number, clientY: number, element: HTMLElement) => {
    const bounds = element.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) return;
    previewBaseColor(
      hsvToHex({
        hue: hsv.hue,
        saturation: clamp((clientX - bounds.left) / bounds.width, 0, 1),
        value: clamp(1 - (clientY - bounds.top) / bounds.height, 0, 1),
      }),
    );
  };

  const applyDraft = () => {
    if (inputInvalid || opacityInvalid) return;
    const nextValue = encodeTagColorDraft(draft);
    const currentDraft = decodeTagColorDraft(value);
    const unchanged =
      draft.baseColor === currentDraft.baseColor && draft.opacityByte === currentDraft.opacityByte;
    if (!unchanged && nextValue !== value) onChange(nextValue);
    setOpen(false);
  };

  const cancelDraft = () => {
    resetDraft(value);
    setOpen(false);
  };

  return (
    <Popover
      modal
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          resetDraft(value);
          setOpen(true);
          return;
        }
        resetDraft(value);
        setOpen(false);
      }}
      open={open}
    >
      <PopoverTrigger asChild>
        {variant === "icon" ? (
          <button
            aria-expanded={open}
            aria-label={label ?? t("Choose Tag color")}
            className="inline-flex size-9 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent/65 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
            data-demo-id="tag-color-trigger"
            ref={triggerRef}
            title={label ?? t("Choose Tag color")}
            type="button"
          >
            <HiOutlineSwatch className="size-5" />
          </button>
        ) : (
          <button
            aria-expanded={open}
            aria-label={label ?? t("Choose Tag color")}
            className="flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-start outline-none transition-colors hover:bg-accent/45 focus-visible:border-signal/55 focus-visible:ring-2 focus-visible:ring-ring/20"
            data-demo-id="tag-color-trigger"
            ref={triggerRef}
            type="button"
          >
            <TagColorLabel color={displayValue} emptyLabel={noColorLabel} />
            <HiOutlineChevronDown className="size-4 shrink-0 text-muted-foreground" />
          </button>
        )}
      </PopoverTrigger>
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            aria-hidden="true"
            className="pointer-events-auto fixed inset-0 z-[59]"
            data-demo-id="tag-color-dismiss-layer"
            onPointerDown={(event) => {
              event.preventDefault();
              cancelDraft();
            }}
          />,
          document.body,
        )}
      <PopoverContent
        align="start"
        className="max-h-[min(36rem,var(--radix-popover-content-available-height))] w-[min(19rem,var(--radix-popover-content-available-width))] overflow-y-auto p-2"
        data-demo-id="tag-color-dropdown"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          triggerRef.current?.focus();
        }}
        onEscapeKeyDown={() => resetDraft(value)}
      >
        <div className="grid gap-2 p-1" data-demo-id="tag-color-full-palette">
          <div className="flex items-center justify-between gap-3 px-1">
            <span className="text-xs font-medium text-muted-foreground">
              {t("Full color palette")}
            </span>
            <code className="text-xs text-muted-foreground">
              {draftValue === null
                ? (noColorLabel ?? t("No color"))
                : employeeTagColorToHex(draftValue)}
            </code>
          </div>
          <div
            aria-label={t("Choose custom color")}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={Math.round(hsv.value * 100)}
            aria-valuetext={currentHex}
            className="relative h-32 cursor-crosshair touch-none overflow-hidden rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/45"
            onKeyDown={(event) => {
              const step = event.shiftKey ? 0.1 : 0.02;
              const next = { ...hsv };
              if (event.key === "ArrowLeft") next.saturation -= step;
              else if (event.key === "ArrowRight") next.saturation += step;
              else if (event.key === "ArrowUp") next.value += step;
              else if (event.key === "ArrowDown") next.value -= step;
              else return;
              event.preventDefault();
              previewBaseColor(
                hsvToHex({
                  ...next,
                  saturation: clamp(next.saturation, 0, 1),
                  value: clamp(next.value, 0, 1),
                }),
              );
            }}
            onPointerCancel={restoreGestureDraft}
            onPointerDown={(event) => {
              gestureStartDraftRef.current = draft;
              event.currentTarget.setPointerCapture(event.pointerId);
              updateSaturationAndValue(event.clientX, event.clientY, event.currentTarget);
            }}
            onPointerMove={(event) => {
              if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
              updateSaturationAndValue(event.clientX, event.clientY, event.currentTarget);
            }}
            onPointerUp={(event) => {
              if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
              updateSaturationAndValue(event.clientX, event.clientY, event.currentTarget);
              event.currentTarget.releasePointerCapture(event.pointerId);
              gestureStartDraftRef.current = null;
            }}
            role="slider"
            style={{
              background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsv.hue} 100% 50%))`,
            }}
            tabIndex={0}
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_1px_4px_rgb(0_0_0/0.55)]"
              style={{
                backgroundColor: currentHex,
                left: `${hsv.saturation * 100}%`,
                top: `${(1 - hsv.value) * 100}%`,
              }}
            />
          </div>
          <input
            aria-label={t("Hue")}
            className="tag-color-hue h-4 w-full cursor-pointer appearance-none bg-transparent"
            max={359}
            min={0}
            onChange={(event) =>
              previewBaseColor(hsvToHex({ ...hsv, hue: Number(event.currentTarget.value) }))
            }
            onPointerCancel={restoreGestureDraft}
            onPointerDown={() => {
              gestureStartDraftRef.current = draft;
            }}
            onPointerUp={() => {
              gestureStartDraftRef.current = null;
            }}
            type="range"
            value={Math.round(hsv.hue)}
          />
        </div>
        <div className="my-2 h-px bg-border/80" />
        <div className="grid gap-2 px-1" data-demo-id="tag-color-opacity-control">
          <div className="text-xs font-medium text-muted-foreground">{t("Opacity")}</div>
          <div className="grid grid-cols-[minmax(0,1fr)_4.75rem] items-center gap-2">
            <input
              aria-label={t("Opacity")}
              className="tag-color-opacity h-4 w-full cursor-pointer appearance-none disabled:cursor-not-allowed disabled:opacity-45"
              disabled={draft.baseColor === null}
              max={100}
              min={0}
              onChange={(event) => previewOpacity(Number(event.currentTarget.value))}
              style={{
                background: `linear-gradient(to right, transparent, ${currentHex}), repeating-conic-gradient(#d4d4d8 0 25%, #fff 0 50%) 0 / 8px 8px`,
              }}
              type="range"
              value={opacityPercent}
            />
            <div className="relative">
              <Input
                aria-invalid={opacityInvalid}
                aria-label={`${t("Opacity")} (%)`}
                className="h-9 pe-7"
                disabled={draft.baseColor === null}
                inputMode="numeric"
                max={100}
                min={0}
                onChange={(event) => {
                  const nextValue = event.currentTarget.value;
                  const parsed = parseOpacityInput(nextValue);
                  setOpacityInput(nextValue);
                  setOpacityInvalid(parsed === null);
                  if (parsed !== null) {
                    const nextDraft = {
                      ...draft,
                      opacityByte: tagColorOpacityPercentToByte(parsed),
                    };
                    setDraft(nextDraft);
                    if (inputModeRef.current === "rgba") {
                      setInputValue(formatTagColorInput("rgba", encodeTagColorDraft(nextDraft)));
                      setInputInvalid(false);
                    }
                  }
                }}
                step={1}
                type="number"
                value={opacityInput}
              />
              <span className="pointer-events-none absolute inset-y-0 end-2 flex items-center text-xs text-muted-foreground">
                %
              </span>
            </div>
          </div>
        </div>
        <div className="my-2 h-px bg-border/80" />
        <div className="grid gap-2 px-1 pb-1" data-demo-id="tag-color-exact-input">
          <div className="text-xs font-medium text-muted-foreground">{t("Exact color")}</div>
          <div className="grid grid-cols-[minmax(7.5rem,0.8fr)_minmax(0,1.2fr)] gap-2">
            <Select
              onValueChange={(mode: TagColorInputMode) => {
                inputModeRef.current = mode;
                setInputMode(mode);
                setInputValue(formatTagColorInput(mode, draftValue));
                setInputInvalid(false);
              }}
              value={inputMode}
            >
              <SelectTrigger aria-label={t("Color format")} className="min-w-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="keyword">{t("HTML Keyword")}</SelectItem>
                <SelectItem value="hex">HEX</SelectItem>
                <SelectItem value="rgb">RGB</SelectItem>
                <SelectItem value="rgba">RGBA</SelectItem>
              </SelectContent>
            </Select>
            <Input
              aria-invalid={inputInvalid}
              aria-label={t("Color value")}
              onChange={(event) => {
                const nextValue = event.currentTarget.value;
                const parsed = parseTagColorInput(inputMode, nextValue);
                setInputValue(nextValue);
                setInputInvalid(parsed === null);
                if (!parsed) return;
                const parsedDraft = decodeTagColorDraft(parsed);
                const nextDraft =
                  inputMode === "rgba"
                    ? parsedDraft
                    : { ...parsedDraft, opacityByte: draft.opacityByte };
                setDraft(nextDraft);
                setOpacityInput(String(tagColorOpacityByteToPercent(nextDraft.opacityByte)));
                setOpacityInvalid(false);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.preventDefault();
              }}
              placeholder={tagColorInputPlaceholder(inputMode)}
              spellCheck={false}
              value={inputValue}
            />
          </div>
          {inputInvalid && (
            <p className="text-xs text-destructive" role="alert">
              {t("Enter a valid {format} color.", {
                format: inputMode === "keyword" ? t("HTML Keyword") : inputMode.toUpperCase(),
              })}
            </p>
          )}
        </div>
        <div className="my-2 h-px bg-border/80" />
        <div
          className="flex flex-wrap gap-1.5 px-1"
          data-demo-id="tag-color-presets"
          role="listbox"
        >
          {[...(allowNoColor ? [null] : []), ...EMPLOYEE_TAG_COLOR_NAMES].map((baseColor) => {
            const selected = draft.baseColor === baseColor;
            const optionValue =
              baseColor === null
                ? null
                : encodeTagColorDraft({ ...draft, baseColor: baseColor as EmployeeTagColorName });
            return (
              <button
                aria-selected={selected}
                className="min-w-0 cursor-pointer rounded-md text-start outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                key={baseColor ?? "none"}
                onClick={() => previewBaseColor(baseColor as EmployeeTagColorName | null)}
                role="option"
                type="button"
              >
                <TagColorLabel
                  color={optionValue}
                  emptyLabel={noColorLabel}
                  selected={selected}
                  showOpacity={false}
                  showSelectionSlot
                />
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex justify-end gap-2 border-t border-border/80 px-1 pt-3">
          <Button onClick={cancelDraft} size="sm" type="button" variant="ghost">
            {t("Cancel")}
          </Button>
          <Button
            disabled={inputInvalid || opacityInvalid}
            onClick={applyDraft}
            size="sm"
            type="button"
          >
            {t("Apply")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
