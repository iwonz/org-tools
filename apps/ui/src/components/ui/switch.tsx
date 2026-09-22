"use client";

import type * as React from "react";

import { cn } from "@/lib/utils";

export function Switch({
  checked,
  className,
  disabled,
  onCheckedChange,
  ...props
}: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "role"> & {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <button
      aria-checked={checked}
      className={cn(
        "inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45",
        checked ? "bg-signal" : "bg-muted-foreground/35",
        className,
      )}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      role="switch"
      type="button"
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-5 rounded-full bg-background shadow-sm transition-transform",
          checked && "translate-x-5 rtl:-translate-x-5",
        )}
      />
    </button>
  );
}
