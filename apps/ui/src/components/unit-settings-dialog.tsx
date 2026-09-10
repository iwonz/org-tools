"use client";

import type { OrgEditorUnit } from "@org-tools/types";
import { useId } from "react";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUiText } from "@/i18n/use-ui-text";
import { cn } from "@/lib/utils";

export function UnitSettingsDialog({
  unit,
  onGroupByTagChange,
  onOpenChange,
  onCloseAutoFocus,
}: {
  unit: OrgEditorUnit;
  onGroupByTagChange: (enabled: boolean) => void;
  onOpenChange: (open: boolean) => void;
  onCloseAutoFocus: () => void;
}) {
  const t = useUiText();
  const labelId = useId();
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent
        data-demo-id="unit-settings-dialog"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          onCloseAutoFocus();
        }}
      >
        <DialogHeader>
          <DialogTitle>{t("Unit settings for {name}", { name: unit.name })}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="flex items-center justify-between gap-4">
            <label className="cursor-pointer text-sm" htmlFor={`${labelId}-switch`} id={labelId}>
              {t("Group by tag")}
            </label>
            <button
              aria-checked={unit.groupByTag}
              aria-labelledby={labelId}
              className={cn(
                "inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                unit.groupByTag ? "bg-signal" : "bg-muted-foreground/35",
              )}
              data-demo-id="unit-group-by-tag-switch"
              id={`${labelId}-switch`}
              onClick={() => onGroupByTagChange(!unit.groupByTag)}
              role="switch"
              type="button"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "size-5 rounded-full bg-background shadow-sm transition-transform",
                  unit.groupByTag && "translate-x-5 rtl:-translate-x-5",
                )}
              />
            </button>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
