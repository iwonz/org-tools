"use client";

import type { EmployeeTagColor, EmployeeTagColorName } from "@org-tools/types";
import { useEffect, useRef, useState } from "react";
import { HiCheck, HiOutlineChevronDown, HiOutlineSwatch } from "react-icons/hi2";

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
  EMPLOYEE_TAG_COLOR_NAMES,
  employeeTagColorToHex,
  formatTagColorInput,
  hexToHsv,
  hsvToHex,
  isCustomEmployeeTagColor,
  parseTagColorInput,
  type TagColorInputMode,
  tagColorInputPlaceholder,
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

function TagColorLabel({ color }: { color: EmployeeTagColor | null }) {
  const t = useUiText();
  const label = color
    ? isCustomEmployeeTagColor(color)
      ? `${t("Custom color")} · ${color}`
      : t(TAG_COLOR_MESSAGE_KEYS[color])
    : t("No color");

  return (
    <span
      className={cn(
        "inline-flex min-w-0 max-w-full rounded-md px-2 py-0.5 text-sm font-medium",
        tagColorSurfaceClassName(color),
      )}
      data-tag-color={color ?? "none"}
      data-tag-color-surface
      style={customTagColorSurfaceStyle(color)}
    >
      <span className="truncate">{label}</span>
    </span>
  );
}

export function TagColorPicker({
  onChange,
  value,
  variant = "field",
}: {
  onChange: (color: EmployeeTagColor | null) => void;
  value: EmployeeTagColor | null;
  variant?: "field" | "icon";
}) {
  const t = useUiText();
  const [open, setOpen] = useState(false);
  const [inputMode, setInputMode] = useState<TagColorInputMode>("hex");
  const [inputValue, setInputValue] = useState(() => formatTagColorInput("hex", value));
  const [inputInvalid, setInputInvalid] = useState(false);
  const [draftColor, setDraftColor] = useState<EmployeeTagColor | null>(value);
  const draftColorRef = useRef<EmployeeTagColor | null>(value);
  const lastCommittedRef = useRef<EmployeeTagColor | null>(value);
  const currentHex = employeeTagColorToHex(draftColor);
  const hsv = hexToHsv(currentHex);

  useEffect(() => {
    draftColorRef.current = value;
    lastCommittedRef.current = value;
    setDraftColor(value);
    setInputValue(formatTagColorInput(inputMode, value));
    setInputInvalid(false);
  }, [inputMode, value]);

  const previewColor = (color: EmployeeTagColor | null) => {
    draftColorRef.current = color;
    setDraftColor(color);
    setInputValue(formatTagColorInput(inputMode, color));
    setInputInvalid(false);
  };

  const commitColor = (color: EmployeeTagColor | null) => {
    previewColor(color);
    if (lastCommittedRef.current === color) return;
    lastCommittedRef.current = color;
    onChange(color);
  };

  const updateSaturationAndValue = (clientX: number, clientY: number, element: HTMLElement) => {
    const bounds = element.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) return null;
    const color = hsvToHex({
      hue: hsv.hue,
      saturation: clamp((clientX - bounds.left) / bounds.width, 0, 1),
      value: clamp(1 - (clientY - bounds.top) / bounds.height, 0, 1),
    });
    previewColor(color);
    return color;
  };

  return (
    <Popover
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          previewColor(value);
          lastCommittedRef.current = value;
          return;
        }
        previewColor(value);
      }}
      open={open}
    >
      <PopoverTrigger asChild>
        {variant === "icon" ? (
          <button
            aria-expanded={open}
            aria-label={t("Choose Tag color")}
            className="inline-flex size-9 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent/65 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
            data-demo-id="tag-color-trigger"
            title={t("Choose Tag color")}
            type="button"
          >
            <HiOutlineSwatch className="size-5" />
          </button>
        ) : (
          <button
            aria-expanded={open}
            aria-label={t("Choose Tag color")}
            className="flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-start outline-none transition-colors hover:bg-accent/45 focus-visible:border-signal/55 focus-visible:ring-2 focus-visible:ring-ring/20"
            data-demo-id="tag-color-trigger"
            type="button"
          >
            <TagColorLabel color={value} />
            <HiOutlineChevronDown className="size-4 shrink-0 text-muted-foreground" />
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="max-h-[min(36rem,var(--radix-popover-content-available-height))] w-[min(19rem,var(--radix-popover-content-available-width))] overflow-y-auto p-2"
        data-demo-id="tag-color-dropdown"
      >
        <div className="grid gap-2 p-1" data-demo-id="tag-color-full-palette">
          <div className="flex items-center justify-between gap-3 px-1">
            <span className="text-xs font-medium text-muted-foreground">
              {t("Full color palette")}
            </span>
            <code className="text-xs text-muted-foreground">{currentHex}</code>
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
              previewColor(
                hsvToHex({
                  ...next,
                  saturation: clamp(next.saturation, 0, 1),
                  value: clamp(next.value, 0, 1),
                }),
              );
            }}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              updateSaturationAndValue(event.clientX, event.clientY, event.currentTarget);
            }}
            onPointerMove={(event) => {
              if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
              updateSaturationAndValue(event.clientX, event.clientY, event.currentTarget);
            }}
            onPointerUp={(event) => {
              if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
              const color = updateSaturationAndValue(
                event.clientX,
                event.clientY,
                event.currentTarget,
              );
              event.currentTarget.releasePointerCapture(event.pointerId);
              if (color) commitColor(color);
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
            onBlur={() => commitColor(draftColorRef.current)}
            onChange={(event) =>
              previewColor(hsvToHex({ ...hsv, hue: Number(event.currentTarget.value) }))
            }
            onKeyUp={() => commitColor(draftColorRef.current)}
            onPointerUp={() => commitColor(draftColorRef.current)}
            type="range"
            value={Math.round(hsv.hue)}
          />
        </div>
        <div className="my-2 h-px bg-border/80" />
        <div className="grid gap-2 px-1 pb-1" data-demo-id="tag-color-exact-input">
          <div className="text-xs font-medium text-muted-foreground">{t("Exact color")}</div>
          <div className="grid grid-cols-[minmax(7.5rem,0.8fr)_minmax(0,1.2fr)] gap-2">
            <Select
              onValueChange={(mode: TagColorInputMode) => setInputMode(mode)}
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
                if (parsed) {
                  draftColorRef.current = parsed;
                  setDraftColor(parsed);
                }
              }}
              onBlur={() => {
                const parsed = parseTagColorInput(inputMode, inputValue);
                if (parsed) commitColor(parsed);
              }}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                const parsed = parseTagColorInput(inputMode, inputValue);
                if (parsed) commitColor(parsed);
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
        <div className="grid gap-0.5" role="listbox">
          {[null, ...EMPLOYEE_TAG_COLOR_NAMES].map((color) => {
            const selected = draftColor === color;
            return (
              <button
                aria-selected={selected}
                className="flex min-h-9 cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-1.5 text-start outline-none transition-colors hover:bg-accent/65 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40"
                key={color ?? "none"}
                onClick={() => {
                  commitColor(color);
                  setOpen(false);
                }}
                role="option"
                type="button"
              >
                <TagColorLabel color={color} />
                {selected && <HiCheck className="size-4 shrink-0 text-signal" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
