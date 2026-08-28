"use client";

import type { OrgToolsState } from "@org-tools/types";
import { useEffect, useMemo, useState } from "react";
import { HiOutlineBuildingOffice2, HiOutlineDocumentText, HiOutlineUsers } from "react-icons/hi2";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { describeError, type UiMessageDescriptor } from "@/i18n/messages";
import { type UiTextKey, useCountText, useMessageText, useUiText } from "@/i18n/use-ui-text";
import { downloadJson } from "@/lib/org-file";
import {
  createStructuredSave,
  STRUCTURED_SAVE_FILE_NAMES,
  type StructuredSaveKind,
} from "@/lib/structured-save";
import { cn } from "@/lib/utils";

type SaveChoice = StructuredSaveKind;

type SaveChoiceDefinition = {
  description: UiTextKey;
  icon: React.ReactNode;
  title: UiTextKey;
  value: SaveChoice;
};

const SAVE_CHOICES: SaveChoiceDefinition[] = [
  {
    description: "Main hierarchy and Live rules without Employee assignments.",
    icon: <HiOutlineBuildingOffice2 className="size-5" />,
    title: "Teams",
    value: "teams",
  },
  {
    description: "All Employees without Teams.",
    icon: <HiOutlineUsers className="size-5" />,
    title: "Employees",
    value: "employees",
  },
  {
    description: "Main Teams, Employees, assignments, and Live roles.",
    icon: <HiOutlineUsers className="size-5" />,
    title: "Teams + Employees",
    value: "teamsEmployees",
  },
  {
    description: "Every View, layout, viewport, and UI state.",
    icon: <HiOutlineDocumentText className="size-5" />,
    title: "Full workspace",
    value: "workspace",
  },
];

export function SaveDialog({
  onDownloaded,
  onOpenChange,
  open,
  state,
}: {
  onDownloaded: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  state: OrgToolsState | null;
}) {
  const t = useUiText();
  const countText = useCountText();
  const messageText = useMessageText();
  const [choice, setChoice] = useState<SaveChoice>("workspace");
  const [error, setError] = useState<UiMessageDescriptor | null>(null);
  const main = state?.views.find((view) => view.kind === "main") ?? null;
  const employeeCount = state?.employees.length ?? 0;
  const teamCount = main?.state.units.length ?? 0;
  const disabledChoices = useMemo(
    () =>
      new Set<SaveChoice>([
        ...(teamCount === 0 ? (["teams"] as const) : []),
        ...(employeeCount === 0 ? (["employees"] as const) : []),
        ...(teamCount === 0 || employeeCount === 0 ? (["teamsEmployees"] as const) : []),
      ]),
    [employeeCount, teamCount],
  );

  useEffect(() => {
    if (!open) return;
    setChoice("workspace");
    setError(null);
  }, [open]);

  const save = () => {
    if (!state || disabledChoices.has(choice)) return;
    setError(null);
    try {
      downloadJson(createStructuredSave(state, choice), STRUCTURED_SAVE_FILE_NAMES[choice]);
      onOpenChange(false);
      onDownloaded();
    } catch (saveError) {
      setError(describeError(saveError));
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-2xl" data-demo-id="save-dialog">
        <DialogHeader>
          <DialogTitle>{t("Export workspace")}</DialogTitle>
          <DialogDescription>{t("Choose a local JSON document to download.")}</DialogDescription>
        </DialogHeader>
        <DialogBody className="grid gap-3">
          <div aria-label={t("Export content")} className="grid gap-2" role="radiogroup">
            {SAVE_CHOICES.map((definition) => {
              const disabled = disabledChoices.has(definition.value);
              const selected = choice === definition.value;
              const summary =
                definition.value === "teams"
                  ? countText("units", { count: teamCount })
                  : definition.value === "employees"
                    ? countText("employees", { count: employeeCount })
                    : `${countText("units", { count: teamCount })} · ${countText("employees", { count: employeeCount })}`;
              return (
                <label
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-md bg-muted/35 p-3 transition-colors duration-150 hover:bg-accent/65 active:bg-accent-strong/70",
                    selected && "bg-accent-strong/65",
                    disabled && "cursor-not-allowed opacity-50",
                  )}
                  key={definition.value}
                >
                  <input
                    checked={selected}
                    className="mt-1 size-4 accent-signal"
                    disabled={disabled}
                    name="save-format"
                    onChange={() => setChoice(definition.value)}
                    type="radio"
                    value={definition.value}
                  />
                  <span className="mt-0.5 text-muted-foreground">{definition.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-sm font-medium">{t(definition.title)}</span>
                      <span className="text-xs text-muted-foreground">{summary}</span>
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {t(definition.description)}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
          {error && (
            <div className="text-sm text-destructive" role="alert">
              {messageText(error)}
            </div>
          )}
        </DialogBody>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
            {t("Cancel")}
          </Button>
          <Button disabled={!state || disabledChoices.has(choice)} onClick={save} type="button">
            {t("Download")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
