"use client";

import type { UiTheme } from "@org-tools/types";
import * as SelectPrimitive from "@radix-ui/react-select";
import { observer } from "mobx-react-lite";
import { useTheme } from "next-themes";
import type { ComponentType } from "react";
import { useEffect } from "react";
import {
  HiMiniCheck,
  HiOutlineComputerDesktop,
  HiOutlineMoon,
  HiOutlineSun,
} from "react-icons/hi2";

import { Button } from "@/components/ui/button";
import { type UiTextKey, useUiText } from "@/i18n/use-ui-text";
import { normalizeUiTheme } from "@/lib/theme";
import { useOrgStore } from "@/stores/org-store-context";

const THEME_OPTIONS: Array<{
  value: UiTheme;
  labelKey: UiTextKey;
  icon: ComponentType<{ className?: string }>;
}> = [
  { value: "light", labelKey: "Light", icon: HiOutlineSun },
  { value: "dark", labelKey: "Dark", icon: HiOutlineMoon },
  { value: "system", labelKey: "System", icon: HiOutlineComputerDesktop },
];

export const ThemeToggle = observer(() => {
  const store = useOrgStore();
  const t = useUiText();
  const { setTheme, theme } = useTheme();
  const selectedTheme = normalizeUiTheme(theme);

  useEffect(() => {
    if (store.theme !== selectedTheme) {
      store.setTheme(selectedTheme);
    }
  }, [selectedTheme, store]);

  const handleThemeChange = (theme: UiTheme) => {
    store.setTheme(theme);
    setTheme(theme);
  };

  const activeOption =
    THEME_OPTIONS.find((option) => option.value === selectedTheme) ??
    THEME_OPTIONS.find((option) => option.value === "system");
  const ActiveIcon = activeOption?.icon ?? HiOutlineComputerDesktop;
  const activeLabel = t(activeOption?.labelKey ?? "System");

  return (
    <SelectPrimitive.Root
      onValueChange={(value) => handleThemeChange(normalizeUiTheme(value))}
      value={selectedTheme}
    >
      <SelectPrimitive.Trigger asChild data-demo-id="theme-toggle">
        <Button
          aria-label={activeLabel}
          className="size-9 rounded-sm text-muted-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
          size="icon"
          title={`${t("Theme")}: ${activeLabel}`}
          type="button"
          variant="ghost"
        >
          <ActiveIcon className="size-4" />
        </Button>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          align="end"
          className="relative z-50 min-w-40 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
          data-demo-id="theme-menu"
          position="popper"
          sideOffset={6}
        >
          <SelectPrimitive.Viewport>
            {THEME_OPTIONS.map((option) => {
              const Icon = option.icon;

              return (
                <SelectPrimitive.Item
                  className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[state=checked]:text-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                  key={option.value}
                  value={option.value}
                >
                  <Icon className="size-4 text-muted-foreground" />
                  <SelectPrimitive.ItemText>{t(option.labelKey)}</SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="ml-auto text-foreground">
                    <HiMiniCheck className="size-4" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              );
            })}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
});
