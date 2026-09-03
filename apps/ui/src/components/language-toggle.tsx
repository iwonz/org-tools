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

function LocaleFlag({ locale }: { locale: AppLocale }) {
  const common = {
    "aria-hidden": true,
    className: "size-5 shrink-0 overflow-hidden rounded-[3px] ring-1 ring-black/10",
    role: "presentation",
    viewBox: "0 0 24 16",
  } as const;

  if (locale === "en") {
    return (
      <svg {...common}>
        <title>GB</title>
        <rect fill="#21468b" height="16" width="24" />
        <path d="M0 0l24 16M24 0L0 16" stroke="#fff" strokeWidth="4" />
        <path d="M0 0l24 16M24 0L0 16" stroke="#cf142b" strokeWidth="1.7" />
        <path d="M12 0v16M0 8h24" stroke="#fff" strokeWidth="6" />
        <path d="M12 0v16M0 8h24" stroke="#cf142b" strokeWidth="3.2" />
      </svg>
    );
  }
  if (locale === "zh") {
    return (
      <svg {...common}>
        <title>CN</title>
        <rect fill="#de2910" height="16" width="24" />
        <path d="m5 2 .8 2.3h2.4L6.3 5.7 7 8 5 6.6 3 8l.7-2.3-1.9-1.4h2.4z" fill="#ffde00" />
      </svg>
    );
  }
  if (locale === "ru") {
    return (
      <svg {...common}>
        <title>RU</title>
        <rect fill="#fff" height="5.34" width="24" />
        <rect fill="#0039a6" height="5.34" width="24" y="5.33" />
        <rect fill="#d52b1e" height="5.34" width="24" y="10.66" />
      </svg>
    );
  }
  if (locale === "es") {
    return (
      <svg {...common}>
        <title>ES</title>
        <rect fill="#aa151b" height="16" width="24" />
        <rect fill="#f1bf00" height="8" width="24" y="4" />
      </svg>
    );
  }
  if (locale === "fr") {
    return (
      <svg {...common}>
        <title>FR</title>
        <rect fill="#0055a4" height="16" width="8" />
        <rect fill="#fff" height="16" width="8" x="8" />
        <rect fill="#ef4135" height="16" width="8" x="16" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <title>SA</title>
      <rect fill="#006c35" height="16" width="24" />
      <path d="M6 10.5h12M8 12h8" stroke="#fff" strokeLinecap="round" strokeWidth="1.2" />
      <circle cx="12" cy="6" fill="none" r="2.4" stroke="#fff" strokeWidth="1" />
    </svg>
  );
}

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
                <LocaleFlag locale={option.value} />
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
