"use client";

import type {
  AnalyticsFilter,
  AnalyticsFilterScalar,
  AnalyticsWidget,
  CustomEmployeeFieldDefinition,
} from "@org-tools/types";
import { type ReactNode, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isUiTextKey } from "@/i18n/messages";
import { useUiText } from "@/i18n/use-ui-text";
import { getAnalyticsFields } from "@/lib/analytics-query";
import { isAnalyticsFilterCompatible } from "@/lib/analytics-state";

const SelectField = ({
  children,
  onChange,
  value,
}: {
  children: ReactNode;
  onChange: (value: string) => void;
  value: string;
}) => (
  <select
    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
    onChange={(event) => onChange(event.target.value)}
    value={value}
  >
    {children}
  </select>
);

export function AnalyticsFilterEditorDialog({
  definitions,
  filter,
  onOpenChange,
  onSave,
  open,
  views,
  widgets,
}: {
  definitions: CustomEmployeeFieldDefinition[];
  filter: AnalyticsFilter;
  onOpenChange: (open: boolean) => void;
  onSave: (filter: AnalyticsFilter) => void;
  open: boolean;
  views: { id: string; kind: "custom" | "system"; name: string | null }[];
  widgets: AnalyticsWidget[];
}) {
  const t = useUiText();
  const fields = useMemo(() => getAnalyticsFields(definitions), [definitions]);
  const [draft, setDraft] = useState(() => structuredClone(filter));
  useEffect(() => {
    if (open) setDraft(structuredClone(filter));
  }, [filter, open]);
  const fieldLabel = (label: string) => (isUiTextKey(label) ? t(label) : label);
  const compatibleWidgets = widgets.filter((widget) => isAnalyticsFilterCompatible(draft, widget));
  const setDefaultScalar = (value: string) =>
    setDraft((current) => ({
      ...current,
      defaultValue:
        current.control === "search"
          ? { ...current.defaultValue, search: value }
          : {
              ...current.defaultValue,
              values: value
                ? value.split(",").map((item) => item.trim() as AnalyticsFilterScalar)
                : [],
            },
    }));
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent
        className="flex max-h-[calc(100vh-2rem)] max-w-xl flex-col"
        data-demo-id="analytics-filter-editor"
      >
        <DialogHeader>
          <DialogTitle>{t("Filter")}</DialogTitle>
        </DialogHeader>
        <DialogBody className="grid min-h-0 gap-4 overflow-auto">
          <div className="grid gap-2">
            <Label>{t("Name")}</Label>
            <Input
              maxLength={100}
              onChange={(event) =>
                setDraft((current) => ({ ...current, name: event.target.value }))
              }
              value={draft.name}
            />
          </div>
          <div className="grid gap-2">
            <Label>{t("Data source")}</Label>
            <SelectField
              onChange={(viewId) => setDraft((current) => ({ ...current, viewId }))}
              value={draft.viewId}
            >
              {views.map((view) => (
                <option key={view.id} value={view.id}>
                  {view.kind === "system" ? t("Units") : view.name}
                </option>
              ))}
            </SelectField>
          </div>
          <div className="grid gap-2">
            <Label>{t("Filter")}</Label>
            <SelectField
              onChange={(field) => setDraft((current) => ({ ...current, field }))}
              value={draft.field}
            >
              {fields.map((field) => (
                <option key={field.id} value={field.id}>
                  {fieldLabel(field.label)}
                </option>
              ))}
            </SelectField>
          </div>
          <div className="grid gap-2">
            <Label>{t("Type")}</Label>
            <SelectField
              onChange={(control) =>
                setDraft((current) => ({
                  ...current,
                  control: control as AnalyticsFilter["control"],
                }))
              }
              value={draft.control}
            >
              <option value="select">{t("Select")}</option>
              <option value="multiSelect">{t("Multi-select")}</option>
              <option value="search">{t("Search")}</option>
              <option value="dateRange">{t("Date range")}</option>
            </SelectField>
          </div>
          <div className="grid gap-2">
            <Label>{t("Default value")}</Label>
            {draft.control === "dateRange" ? (
              <div className="grid grid-cols-2 gap-2">
                <Input
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      defaultValue: {
                        ...current.defaultValue,
                        from: event.target.value || null,
                      },
                    }))
                  }
                  type="date"
                  value={typeof draft.defaultValue.from === "string" ? draft.defaultValue.from : ""}
                />
                <Input
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      defaultValue: {
                        ...current.defaultValue,
                        to: event.target.value || null,
                      },
                    }))
                  }
                  type="date"
                  value={typeof draft.defaultValue.to === "string" ? draft.defaultValue.to : ""}
                />
              </div>
            ) : (
              <Input
                onChange={(event) => setDefaultScalar(event.target.value)}
                value={
                  draft.control === "search"
                    ? draft.defaultValue.search
                    : draft.defaultValue.values.join(", ")
                }
              />
            )}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              checked={draft.defaultValue.includeEmpty}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  defaultValue: {
                    ...current.defaultValue,
                    includeEmpty: event.target.checked,
                  },
                }))
              }
              type="checkbox"
            />
            {t("Include empty values")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              checked={draft.targetWidgetIds === null}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  targetWidgetIds: event.target.checked ? null : [],
                }))
              }
              type="checkbox"
            />
            {t("All compatible widgets")}
          </label>
          {draft.targetWidgetIds !== null ? (
            <div className="grid gap-2">
              <Label>{t("Specific widgets")}</Label>
              <select
                className="min-h-32 rounded-md border bg-background p-2 text-sm"
                multiple
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    targetWidgetIds: [...event.currentTarget.selectedOptions].map(
                      (option) => option.value,
                    ),
                  }))
                }
                value={draft.targetWidgetIds}
              >
                {compatibleWidgets.map((widget) => (
                  <option key={widget.id} value={widget.id}>
                    {widget.title}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </DialogBody>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
            {t("Cancel")}
          </Button>
          <Button
            disabled={!draft.name.trim() || !draft.field}
            onClick={() => {
              onSave({
                ...draft,
                name: draft.name.trim(),
                targetWidgetIds:
                  draft.targetWidgetIds === null
                    ? null
                    : draft.targetWidgetIds.filter((id) =>
                        compatibleWidgets.some((widget) => widget.id === id),
                      ),
              });
              onOpenChange(false);
            }}
            type="button"
          >
            {t("Save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
