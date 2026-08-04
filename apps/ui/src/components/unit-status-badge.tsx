"use client";

import { useUiText } from "@/i18n/use-ui-text";
import { cn } from "@/lib/utils";

type UnitStatusBadgeProps = {
  className?: string;
  membershipMode: "live" | "manual";
};

export function UnitStatusBadge({ className, membershipMode }: UnitStatusBadgeProps) {
  const t = useUiText();
  if (membershipMode !== "live") return null;

  return (
    <span
      className={cn(
        "shrink-0 rounded-md bg-primary/12 px-1.5 py-0.5 text-[10px] font-medium leading-none text-primary",
        className,
      )}
      data-demo-id="unit-status-badge"
    >
      {t("Live")}
    </span>
  );
}
