"use client";

import type { OrgEditorViewSettings } from "@org-tools/types";
import { useId, useState } from "react";
import { HiOutlineCog6Tooth } from "react-icons/hi2";
import { TagColorPicker } from "@/components/tag-color-picker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useUiText } from "@/i18n/use-ui-text";
import { cn } from "@/lib/utils";

export function ViewSettingsDialog({
  settings,
  onChange,
}: {
  settings: OrgEditorViewSettings;
  onChange: (patch: Partial<OrgEditorViewSettings>) => void;
}) {
  const t = useUiText();
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          aria-label={t("View settings")}
          data-demo-id="org-editor-view-settings"
          size="icon"
          variant="ghost"
          type="button"
        >
          <HiOutlineCog6Tooth />
        </Button>
      </DialogTrigger>
      <DialogContent data-demo-id="view-settings-dialog">
        <DialogHeader>
          <DialogTitle>{t("View settings")}</DialogTitle>
        </DialogHeader>
        <DialogBody className="grid gap-6">
          <section aria-labelledby={`${id}-display`} className="grid gap-4">
            <h3 className="text-sm font-semibold" id={`${id}-display`}>
              {t("Unit display")}
            </h3>
            {(
              [
                ["groupByTag", "Group by tag", "view-group-by-tag-switch"],
                ["showTagCloud", "Show Tag cloud", "view-show-tag-cloud-switch"],
              ] as const
            ).map(([key, label, demoId]) => (
              <div className="flex items-center justify-between gap-4" key={key}>
                <label className="cursor-pointer text-sm" htmlFor={`${id}-${key}`}>
                  {t(label)}
                </label>
                <button
                  aria-checked={settings[key]}
                  aria-label={t(label)}
                  className={cn(
                    "inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    settings[key] ? "bg-signal" : "bg-muted-foreground/35",
                  )}
                  data-demo-id={demoId}
                  id={`${id}-${key}`}
                  onClick={() => onChange({ [key]: !settings[key] })}
                  role="switch"
                  type="button"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "size-5 rounded-full bg-background shadow-sm transition-transform",
                      settings[key] && "translate-x-5 rtl:-translate-x-5",
                    )}
                  />
                </button>
              </div>
            ))}
          </section>
          <section aria-labelledby={`${id}-distribution`} className="grid gap-4 border-t pt-5">
            <h3 className="text-sm font-semibold" id={`${id}-distribution`}>
              {t("Distribution mode")}
            </h3>
            {(
              [
                ["distributedColor", "Distributed"],
                ["undistributedColor", "Not distributed"],
              ] as const
            ).map(([key, label]) => (
              <div
                className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-4"
                data-demo-id={`view-${key}`}
                key={key}
              >
                <span className="text-sm">{t(label)}</span>
                <TagColorPicker
                  allowNoColor={false}
                  label={t(label)}
                  value={settings[key]}
                  onChange={(color) => {
                    if (color !== null) onChange({ [key]: color });
                  }}
                />
              </div>
            ))}
          </section>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
