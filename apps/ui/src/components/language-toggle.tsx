"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { HiMiniCheck } from "react-icons/hi2";

import { useAppLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import type { AppLocale } from "@/i18n/locale";
import { useUiText } from "@/i18n/use-ui-text";
import enMessages from "../../messages/en.json";
import ruMessages from "../../messages/ru.json";

const LANGUAGE_OPTIONS: Array<{ flag: string; label: string; value: AppLocale }> = [
  { flag: "🇷🇺", label: ruMessages.Ui.Russian, value: "ru" },
  { flag: "🇬🇧", label: enMessages.Ui.English, value: "en" },
];

export function LanguageToggle() {
  const { locale, setLocale } = useAppLocale();
  const t = useUiText();
  const activeOption = LANGUAGE_OPTIONS.find((option) => option.value === locale);
  const activeLabel = activeOption?.label ?? enMessages.Ui.English;

  return (
    <SelectPrimitive.Root onValueChange={(value) => setLocale(value as AppLocale)} value={locale}>
      <SelectPrimitive.Trigger asChild data-demo-id="language-toggle">
        <Button
          aria-label={`${t("Language")}: ${activeLabel}`}
          className="h-9 gap-2 rounded-sm px-2.5 text-muted-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
          title={`${t("Language")}: ${activeLabel}`}
          type="button"
          variant="ghost"
        >
          <span aria-hidden="true" className="text-base leading-none">
            {activeOption?.flag ?? "🇬🇧"}
          </span>
          <span className="text-sm">{activeLabel}</span>
        </Button>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          align="end"
          className="relative z-50 min-w-40 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
          data-demo-id="language-menu"
          position="popper"
          sideOffset={6}
        >
          <SelectPrimitive.Viewport>
            {LANGUAGE_OPTIONS.map((option) => (
              <SelectPrimitive.Item
                className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[state=checked]:text-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                key={option.value}
                value={option.value}
              >
                <span aria-hidden="true" className="text-base leading-none">
                  {option.flag}
                </span>
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="ml-auto text-foreground">
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
