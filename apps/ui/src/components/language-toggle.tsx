"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { HiMiniCheck } from "react-icons/hi2";

import { useAppLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import type { AppLocale } from "@/i18n/locale";
import { useUiText } from "@/i18n/use-ui-text";
import { cn } from "@/lib/utils";
import enMessages from "../../messages/en.json";
import ruMessages from "../../messages/ru.json";

const LANGUAGE_OPTIONS: Array<{ flag: string; label: string; value: AppLocale }> = [
  { flag: "🇷🇺", label: ruMessages.Ui.Russian, value: "ru" },
  { flag: "🇬🇧", label: enMessages.Ui.English, value: "en" },
];

export function LanguageToggle({
  labelClassName,
  triggerClassName,
}: {
  labelClassName?: string;
  triggerClassName?: string;
}) {
  const { locale, setLocale } = useAppLocale();
  const t = useUiText();
  const activeOption = LANGUAGE_OPTIONS.find((option) => option.value === locale);
  const activeLabel = activeOption?.label ?? enMessages.Ui.English;

  return (
    <SelectPrimitive.Root onValueChange={(value) => setLocale(value as AppLocale)} value={locale}>
      <SelectPrimitive.Trigger asChild data-demo-id="language-toggle">
        <Button
          aria-label={`${t("Language")}: ${activeLabel}`}
          className={cn(
            "size-9 rounded-md text-muted-foreground data-[state=open]:bg-accent-strong/70 data-[state=open]:text-accent-foreground",
            triggerClassName,
          )}
          size="icon"
          title={`${t("Language")}: ${activeLabel}`}
          type="button"
          variant="ghost"
        >
          <span
            aria-hidden="true"
            className="flex size-5 shrink-0 items-center justify-center text-base leading-none"
          >
            {activeOption?.flag ?? "🇬🇧"}
          </span>
          {labelClassName && (
            <span className={labelClassName} data-sidebar-label="">
              {t("Language")}
            </span>
          )}
        </Button>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          align="end"
          className="relative z-50 min-w-40 overflow-hidden rounded-lg border border-border/80 bg-popover p-1 text-popover-foreground shadow-[0_10px_28px_-22px_rgb(0_0_0/0.45)]"
          data-demo-id="language-menu"
          position="popper"
          side="right"
          sideOffset={10}
        >
          <SelectPrimitive.Viewport>
            {LANGUAGE_OPTIONS.map((option) => (
              <SelectPrimitive.Item
                className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent/75 hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[state=checked]:bg-accent/55 data-[state=checked]:text-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                key={option.value}
                value={option.value}
              >
                <span aria-hidden="true" className="text-base leading-none">
                  {option.flag}
                </span>
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="ml-auto text-signal">
                  <HiMiniCheck className="size-4" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
