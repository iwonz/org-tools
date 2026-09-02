"use client";

import { HiOutlineCheckCircle } from "react-icons/hi2";

import { type UiTextKey, useCountText, useUiText } from "@/i18n/use-ui-text";
import { exportRowModeOptions } from "@/lib/export-format";
import { cn } from "@/lib/utils";
import type { ExportRowMode } from "@/stores/org-store";

export function ExportRowModeControl({
  onValueChange,
  rowCountByMode,
  value,
}: {
  onValueChange: (value: ExportRowMode) => void;
  rowCountByMode: Record<ExportRowMode, number>;
  value: ExportRowMode;
}) {
  const t = useUiText();
  const countText = useCountText();

  return (
    <fieldset className="grid pb-2" data-demo-id="export-row-mode">
      <legend className="mb-2.5 text-sm font-medium">
        {t("When an Employee belongs to multiple Units")}
      </legend>
      <div className="grid gap-2">
        {exportRowModeOptions.map((option) => {
          const checked = value === option.value;
          return (
            <label
              className={cn(
                "grid cursor-pointer gap-2 rounded-md bg-muted/35 p-3 text-sm transition-colors hover:bg-accent/55 active:bg-accent-strong/65",
                checked && "bg-accent-strong/65 text-foreground",
              )}
              key={option.value}
            >
              <span className="flex min-w-0 items-stretch gap-3">
                <input
                  checked={checked}
                  className="sr-only"
                  name="export-row-mode"
                  onChange={() => onValueChange(option.value)}
                  type="radio"
                  value={option.value}
                />
                <span aria-hidden="true" className="grid min-h-11 shrink-0 place-items-center">
                  {checked ? (
                    <HiOutlineCheckCircle className="size-5 text-primary" />
                  ) : (
                    <span className="size-5 rounded-full border border-muted-foreground/40 bg-background" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex min-w-0 items-start justify-between gap-3">
                    <span className="font-medium leading-snug">{t(option.title as UiTextKey)}</span>
                    <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
                      {countText("rows", { count: rowCountByMode[option.value] })}
                    </span>
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                    {t(option.description as UiTextKey)}
                  </span>
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
