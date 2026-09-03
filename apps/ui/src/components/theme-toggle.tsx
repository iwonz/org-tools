"use client";

import type { UiTheme } from "@org-tools/types";
import { observer } from "mobx-react-lite";
import { useTheme } from "next-themes";
import { useState } from "react";
import {
  HiMiniCheck,
  HiOutlineComputerDesktop,
  HiOutlineMoon,
  HiOutlineSun,
} from "react-icons/hi2";

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
import { type UiTextKey, useUiText } from "@/i18n/use-ui-text";
import { cn } from "@/lib/utils";
import { useOrgStore } from "@/stores/org-store-context";

const THEME_OPTIONS = [
  { icon: HiOutlineSun, labelKey: "Light", value: "light" },
  { icon: HiOutlineMoon, labelKey: "Dark", value: "dark" },
  { icon: HiOutlineComputerDesktop, labelKey: "System", value: "system" },
] as const satisfies ReadonlyArray<{
  icon: typeof HiOutlineSun;
  labelKey: UiTextKey;
  value: UiTheme;
}>;

export const ThemeToggle = observer(
  ({
    labelClassName,
    triggerClassName,
  }: {
    labelClassName?: string;
    triggerClassName?: string;
  }) => {
    const store = useOrgStore();
    const t = useUiText();
    const { setTheme } = useTheme();
    const [open, setOpen] = useState(false);
    const selectedTheme = store.theme;
    const activeOption =
      THEME_OPTIONS.find((option) => option.value === selectedTheme) ?? THEME_OPTIONS[2];
    const ActiveIcon = activeOption.icon;
    const activeLabel = t(activeOption.labelKey);

    const selectTheme = (theme: UiTheme) => {
      store.setTheme(theme);
      setTheme(theme);
      setOpen(false);
    };

    return (
      <Dialog onOpenChange={setOpen} open={open}>
        <DialogTrigger asChild>
          <Button
            aria-label={`${t("Theme")}: ${activeLabel}`}
            className={cn("size-9 rounded-md text-muted-foreground", triggerClassName)}
            data-demo-id="theme-toggle"
            size="icon"
            title={`${t("Theme")}: ${activeLabel}`}
            type="button"
            variant="ghost"
          >
            <ActiveIcon className="!size-5 shrink-0" />
            {labelClassName && (
              <span className={labelClassName} data-sidebar-label="">
                {t("Theme")}
              </span>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-sm" data-demo-id="theme-dialog">
          <DialogHeader>
            <DialogTitle>{t("Theme")}</DialogTitle>
            <DialogDescription>{t("Choose interface theme")}</DialogDescription>
          </DialogHeader>
          <DialogBody className="grid gap-1">
            {THEME_OPTIONS.map((option) => {
              const Icon = option.icon;
              const selected = option.value === selectedTheme;
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
                    name="org-tools-theme"
                    onChange={() => selectTheme(option.value)}
                    type="radio"
                    value={option.value}
                  />
                  <Icon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 font-medium">{t(option.labelKey)}</span>
                  {selected && <HiMiniCheck className="size-4 shrink-0 text-signal" />}
                </label>
              );
            })}
          </DialogBody>
        </DialogContent>
      </Dialog>
    );
  },
);
