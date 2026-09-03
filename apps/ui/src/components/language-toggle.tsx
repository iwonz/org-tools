"use client";

import { useState } from "react";
import { HiMiniCheck, HiOutlineLanguage } from "react-icons/hi2";

import { useAppLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { APP_LOCALE_CONFIG, type AppLocale } from "@/i18n/locale";
import { type UiTextKey, useUiText } from "@/i18n/use-ui-text";
import { cn } from "@/lib/utils";

const LANGUAGE_OPTIONS: Array<{ labelKey: UiTextKey; value: AppLocale }> = [
  { labelKey: "English", value: "en" },
  { labelKey: "Chinese", value: "zh" },
  { labelKey: "Russian", value: "ru" },
  { labelKey: "Spanish", value: "es" },
  { labelKey: "French", value: "fr" },
  { labelKey: "Arabic", value: "ar" },
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
  const [open, setOpen] = useState(false);
  const activeOption = LANGUAGE_OPTIONS.find((option) => option.value === locale);
  const activeLabel = t(activeOption?.labelKey ?? "English");

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button
          aria-label={`${t("Language")}: ${activeLabel}`}
          className={cn("size-9 rounded-md text-muted-foreground", triggerClassName)}
          data-demo-id="language-toggle"
          size="icon"
          title={`${t("Language")}: ${activeLabel}`}
          type="button"
          variant="ghost"
        >
          <HiOutlineLanguage className="!size-5 shrink-0" />
          {labelClassName && (
            <span className={labelClassName} data-sidebar-label="">
              {t("Language")}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md" data-demo-id="language-dialog">
        <DialogHeader>
          <DialogTitle>{t("Language")}</DialogTitle>
          <DialogDescription>{t("Choose interface language")}</DialogDescription>
        </DialogHeader>
        <DialogBody className="grid gap-1">
          {LANGUAGE_OPTIONS.map((option) => {
            const selected = option.value === locale;
            const localizedName = t(option.labelKey);
            const selfName = APP_LOCALE_CONFIG[option.value].selfName;
            return (
              <label
                className={cn(
                  "flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent/65",
                  selected && "bg-accent/55",
                )}
                key={option.value}
              >
                <input
                  checked={selected}
                  className="sr-only"
                  name="org-tools-language"
                  onChange={() => {
                    setLocale(option.value);
                    setOpen(false);
                  }}
                  type="radio"
                  value={option.value}
                />
                <span className="min-w-0 flex-1">
                  <span className="font-medium">{localizedName}</span>
                  {localizedName !== selfName && (
                    <span className="ms-2 text-muted-foreground">{selfName}</span>
                  )}
                </span>
                {selected && <HiMiniCheck className="size-4 shrink-0 text-signal" />}
              </label>
            );
          })}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
