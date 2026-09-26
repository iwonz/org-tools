"use client";

import type {
  AnalyticsDataset,
  AnalyticsMeasure,
  AnalyticsPredicate,
  AnalyticsWidget,
  CustomEmployeeFieldDefinition,
} from "@org-tools/types";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { HiOutlinePlus, HiOutlineTrash } from "react-icons/hi2";

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
import { Textarea } from "@/components/ui/textarea";
import { isUiTextKey } from "@/i18n/messages";
import { useUiText } from "@/i18n/use-ui-text";
import { createAnalyticsWidget } from "@/lib/analytics-dashboard";
import { type AnalyticsField, getAnalyticsFields } from "@/lib/analytics-query";
import { createUuid } from "@/lib/employee-data";

const widgetTypes: AnalyticsWidget["type"][] = [
  "kpi",
  "table",
  "pivot",
  "bar",
  "line",
  "pie",
  "gauge",
];

const typeLabels = {
  bar: "Bar chart",
  gauge: "Gauge",
  kpi: "KPI counter",
  line: "Line or area chart",
  pie: "Pie or donut chart",
  pivot: "Pivot table",
  table: "Table widget",
} as const;

const operationLabels = {
  average: "Average",
  countDistinct: "Count distinct",
  countDistinctEmployees: "Count distinct Employees",
  countRows: "Count rows",
  max: "Maximum",
  min: "Minimum",
  sum: "Sum",
} as const;

const operatorLabels = {
  contains: "Contains",
  empty: "Is empty",
  equals: "Equals",
  greaterThan: "Greater than",
  greaterThanOrEqual: "Greater than or equal",
  in: "Is one of",
  lessThan: "Less than",
  lessThanOrEqual: "Less than or equal",
  notEmpty: "Is not empty",
  notEquals: "Does not equal",
  range: "Range",
} as const;

const SelectField = ({
  children,
  value,
  onChange,
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

const predicateText = (value: AnalyticsPredicate["value"] | AnalyticsPredicate["valueTo"]) =>
  Array.isArray(value) ? value.join(", ") : value === null ? "" : String(value);

const parsePredicateText = (
  value: string,
  fieldKind: AnalyticsField["kind"],
  multiple: boolean,
): AnalyticsPredicate["value"] => {
  const values = multiple ? value.split(",").map((item) => item.trim()) : [value];
  const parsed = values
    .filter((item) => item !== "")
    .map((item) => {
      if (fieldKind === "number") return Number(item);
      if (fieldKind === "boolean") return item === "true";
      return item;
    });
  return multiple ? parsed : (parsed[0] ?? null);
};

function PredicateValueInput({
  fieldKind,
  filter,
  onChange,
}: {
  fieldKind: AnalyticsField["kind"];
  filter: AnalyticsPredicate;
  onChange: (next: Partial<AnalyticsPredicate>) => void;
}) {
  if (filter.operator === "empty" || filter.operator === "notEmpty") {
    return <Input disabled value="" />;
  }
  if (fieldKind === "boolean" && filter.operator !== "range" && filter.operator !== "in") {
    return (
      <SelectField
        onChange={(value) => onChange({ value: value === "" ? null : value === "true" })}
        value={filter.value === null ? "" : String(filter.value)}
      >
        <option value="">—</option>
        <option value="true">true</option>
        <option value="false">false</option>
      </SelectField>
    );
  }
  const inputType = fieldKind === "date" ? "date" : fieldKind === "number" ? "number" : "text";
  return (
    <div className={filter.operator === "range" ? "grid grid-cols-2 gap-2" : undefined}>
      <Input
        onChange={(event) =>
          onChange({
            value: parsePredicateText(event.target.value, fieldKind, filter.operator === "in"),
          })
        }
        type={filter.operator === "in" ? "text" : inputType}
        value={predicateText(filter.value)}
      />
      {filter.operator === "range" ? (
        <Input
          onChange={(event) =>
            onChange({
              valueTo: parsePredicateText(
                event.target.value,
                fieldKind,
                false,
              ) as AnalyticsPredicate["valueTo"],
            })
          }
          type={inputType}
          value={predicateText(filter.valueTo)}
        />
      ) : null}
    </div>
  );
}

const convertWidgetType = (
  widget: AnalyticsWidget,
  type: AnalyticsWidget["type"],
): AnalyticsWidget => {
  if (widget.type === type) return widget;
  const converted = createAnalyticsWidget(type, widget.viewId, widget.title);
  return {
    ...converted,
    dataset: structuredClone(widget.dataset),
    description: widget.description,
    height: widget.height,
    id: widget.id,
    presentation: structuredClone(widget.presentation),
    query: structuredClone(widget.query),
    tabId: widget.tabId,
    title: widget.title,
    viewId: widget.viewId,
    width: widget.width,
  } as AnalyticsWidget;
};

export function AnalyticsWidgetEditorDialog({
  definitions,
  onOpenChange,
  onSave,
  open,
  views,
  widget,
}: {
  definitions: CustomEmployeeFieldDefinition[];
  onOpenChange: (open: boolean) => void;
  onSave: (widget: AnalyticsWidget) => void;
  open: boolean;
  views: { id: string; kind: "custom" | "system"; name: string | null }[];
  widget: AnalyticsWidget;
}) {
  const t = useUiText();
  const [draft, setDraft] = useState(() => structuredClone(widget));
  const [overrideText, setOverrideText] = useState(() =>
    Object.entries(widget.presentation.palette.overrides)
      .map(([key, color]) => `${key} = ${color}`)
      .join("\n"),
  );
  useEffect(() => {
    if (!open) return;
    setDraft(structuredClone(widget));
    setOverrideText(
      Object.entries(widget.presentation.palette.overrides)
        .map(([key, color]) => `${key} = ${color}`)
        .join("\n"),
    );
  }, [open, widget]);
  const fields = useMemo(() => getAnalyticsFields(definitions), [definitions]);
  const fieldLabel = (label: string) => (isUiTextKey(label) ? t(label) : label);
  const numericFields = fields.filter((field) => field.kind === "number");
  const compositeDefinitions = definitions.filter((definition) => definition.kind === "composite");
  const updateQuery = (next: Partial<AnalyticsWidget["query"]>) =>
    setDraft((current) => ({ ...current, query: { ...current.query, ...next } }));
  const updateMeasure = (index: number, next: Partial<AnalyticsMeasure>) =>
    updateQuery({
      measures: draft.query.measures.map((measure, currentIndex) =>
        currentIndex === index ? { ...measure, ...next } : measure,
      ),
    });
  const updateFilter = (index: number, next: Partial<AnalyticsPredicate>) =>
    updateQuery({
      filters: draft.query.filters.map((filter, currentIndex) =>
        currentIndex === index ? { ...filter, ...next } : filter,
      ),
    });
  const datasetValue =
    draft.dataset.kind === "composite" ? `composite:${draft.dataset.fieldId}` : draft.dataset.kind;
  const overrideLines = overrideText.split(/\r\n?|\n/u).filter((line) => line.trim());
  const parsedOverrides = Object.fromEntries(
    overrideLines.map((line) => {
      const separator = line.lastIndexOf("=");
      return separator > 0
        ? [line.slice(0, separator).trim(), line.slice(separator + 1).trim()]
        : ["", ""];
    }),
  );
  const overridesValid =
    overrideLines.length <= 100 &&
    Object.entries(parsedOverrides).every(
      ([key, color]) => key.length > 0 && /^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/iu.test(color),
    );
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent
        className="flex max-h-[calc(100vh-2rem)] max-w-3xl flex-col"
        data-demo-id="analytics-widget-editor"
      >
        <DialogHeader>
          <DialogTitle>{t("Widget type")}</DialogTitle>
        </DialogHeader>
        <DialogBody className="grid min-h-0 gap-5 overflow-auto">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>{t("Widget type")}</Label>
              <SelectField
                onChange={(value) =>
                  setDraft((current) =>
                    convertWidgetType(current, value as AnalyticsWidget["type"]),
                  )
                }
                value={draft.type}
              >
                {widgetTypes.map((type) => (
                  <option key={type} value={type}>
                    {t(typeLabels[type])}
                  </option>
                ))}
              </SelectField>
            </div>
            <div className="grid gap-2">
              <Label>{t("Name")}</Label>
              <Input
                onChange={(event) =>
                  setDraft((current) => ({ ...current, title: event.target.value }))
                }
                value={draft.title}
              />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label>{t("Description")}</Label>
              <Input
                onChange={(event) =>
                  setDraft((current) => ({ ...current, description: event.target.value }))
                }
                value={draft.description}
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
              <Label>{t("Dataset")}</Label>
              <SelectField
                onChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    dataset: (value.startsWith("composite:")
                      ? { fieldId: value.slice(10), kind: "composite" }
                      : { kind: value }) as AnalyticsDataset,
                  }))
                }
                value={datasetValue}
              >
                <option value="employees">{t("Employees dataset")}</option>
                <option value="assignments">{t("Assignments dataset")}</option>
                <option value="tags">{t("Tags dataset")}</option>
                {compositeDefinitions.map((definition) => (
                  <option key={definition.id} value={`composite:${definition.id}`}>
                    {t("Composite records")} · {definition.name}
                  </option>
                ))}
              </SelectField>
            </div>
            <div className="grid gap-2">
              <Label>{t("Width")}</Label>
              <SelectField
                onChange={(value) =>
                  setDraft((current) => ({ ...current, width: Number(value) as 1 | 2 }))
                }
                value={String(draft.width)}
              >
                <option value="1">{t("Half width")}</option>
                <option value="2">{t("Full width")}</option>
              </SelectField>
            </div>
            <div className="grid gap-2">
              <Label>{t("Height")}</Label>
              <SelectField
                onChange={(value) =>
                  setDraft((current) => ({ ...current, height: value as "S" | "M" | "L" }))
                }
                value={draft.height}
              >
                <option value="S">{t("Small")}</option>
                <option value="M">{t("Medium")}</option>
                <option value="L">{t("Large")}</option>
              </SelectField>
            </div>
          </div>

          <section className="grid gap-3 rounded-lg border p-4">
            <Label>{t("Dimension")}</Label>
            <select
              className="min-h-32 rounded-md border bg-background p-2 text-sm"
              multiple
              onChange={(event) =>
                updateQuery({
                  dimensions: [...event.currentTarget.selectedOptions].map((option) => ({
                    dateGrouping:
                      draft.query.dimensions.find((dimension) => dimension.field === option.value)
                        ?.dateGrouping ?? null,
                    field: option.value,
                  })),
                })
              }
              value={draft.query.dimensions.map((dimension) => dimension.field)}
            >
              {fields.map((field) => (
                <option key={field.id} value={field.id}>
                  {fieldLabel(field.label)}
                </option>
              ))}
            </select>
            {draft.query.dimensions.map((dimension, index) =>
              fields.find((field) => field.id === dimension.field)?.kind === "date" ? (
                <div className="grid gap-2 sm:grid-cols-2" key={dimension.field}>
                  <span className="self-center text-sm">
                    {fieldLabel(
                      fields.find((field) => field.id === dimension.field)?.label ??
                        dimension.field,
                    )}
                  </span>
                  <SelectField
                    onChange={(dateGrouping) =>
                      updateQuery({
                        dimensions: draft.query.dimensions.map((current, currentIndex) =>
                          currentIndex === index
                            ? {
                                ...current,
                                dateGrouping: dateGrouping
                                  ? (dateGrouping as typeof current.dateGrouping)
                                  : null,
                              }
                            : current,
                        ),
                      })
                    }
                    value={dimension.dateGrouping ?? ""}
                  >
                    <option value="">{t("No grouping")}</option>
                    <option value="day">{t("Day")}</option>
                    <option value="week">{t("Week")}</option>
                    <option value="month">{t("Month")}</option>
                    <option value="quarter">{t("Quarter")}</option>
                    <option value="year">{t("Year")}</option>
                  </SelectField>
                </div>
              ) : null,
            )}
          </section>
          <section className="grid gap-3 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <Label>{t("Measure")}</Label>
              <Button
                onClick={() =>
                  updateQuery({
                    measures: [
                      ...draft.query.measures,
                      { field: null, id: createUuid(), operation: "countRows" },
                    ],
                  })
                }
                size="sm"
                type="button"
                variant="outline"
              >
                <HiOutlinePlus />
                {t("Add")}
              </Button>
            </div>
            {draft.query.measures.map((measure, index) => (
              <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]" key={measure.id}>
                <SelectField
                  onChange={(operation) =>
                    updateMeasure(index, {
                      field:
                        operation === "countRows" || operation === "countDistinctEmployees"
                          ? null
                          : (measure.field ?? fields[0]?.id ?? null),
                      operation: operation as AnalyticsMeasure["operation"],
                    })
                  }
                  value={measure.operation}
                >
                  {Object.entries(operationLabels).map(([operation, label]) => (
                    <option key={operation} value={operation}>
                      {t(label)}
                    </option>
                  ))}
                </SelectField>
                <SelectField
                  onChange={(field) => updateMeasure(index, { field: field || null })}
                  value={measure.field ?? ""}
                >
                  <option value="">—</option>
                  {(measure.operation === "sum" ||
                  measure.operation === "average" ||
                  measure.operation === "min" ||
                  measure.operation === "max"
                    ? numericFields
                    : fields
                  ).map((field) => (
                    <option key={field.id} value={field.id}>
                      {fieldLabel(field.label)}
                    </option>
                  ))}
                </SelectField>
                <Button
                  aria-label={t("Delete")}
                  onClick={() =>
                    updateQuery({
                      measures: draft.query.measures.filter(
                        (_, currentIndex) => currentIndex !== index,
                      ),
                    })
                  }
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <HiOutlineTrash />
                </Button>
              </div>
            ))}
          </section>
          <section className="grid gap-3 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <Label>{t("Filter")}</Label>
              <Button
                onClick={() =>
                  updateQuery({
                    filters: [
                      ...draft.query.filters,
                      {
                        field: fields[0]?.id ?? "employee.fullName",
                        operator: "equals",
                        value: "",
                        valueTo: null,
                      },
                    ],
                  })
                }
                size="sm"
                type="button"
                variant="outline"
              >
                <HiOutlinePlus />
                {t("Add")}
              </Button>
            </div>
            {draft.query.filters.map((filter, index) => (
              <div
                className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]"
                key={`${filter.field}:${filter.operator}:${String(filter.value)}:${String(filter.valueTo)}`}
              >
                <SelectField
                  onChange={(field) => updateFilter(index, { field })}
                  value={filter.field}
                >
                  {fields.map((field) => (
                    <option key={field.id} value={field.id}>
                      {fieldLabel(field.label)}
                    </option>
                  ))}
                </SelectField>
                <SelectField
                  onChange={(operator) =>
                    updateFilter(index, {
                      operator: operator as AnalyticsPredicate["operator"],
                    })
                  }
                  value={filter.operator}
                >
                  {(Object.keys(operatorLabels) as AnalyticsPredicate["operator"][]).map(
                    (operator) => (
                      <option key={operator} value={operator}>
                        {t(operatorLabels[operator])}
                      </option>
                    ),
                  )}
                </SelectField>
                <PredicateValueInput
                  fieldKind={fields.find((field) => field.id === filter.field)?.kind ?? "text"}
                  filter={filter}
                  onChange={(next) => updateFilter(index, next)}
                />
                <Button
                  aria-label={t("Delete")}
                  onClick={() =>
                    updateQuery({
                      filters: draft.query.filters.filter(
                        (_, currentIndex) => currentIndex !== index,
                      ),
                    })
                  }
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <HiOutlineTrash />
                </Button>
              </div>
            ))}
          </section>
          {draft.type === "bar" ? (
            <section className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>{t("Orientation")}</Label>
                <SelectField
                  onChange={(orientation) =>
                    setDraft((current) =>
                      current.type === "bar"
                        ? { ...current, orientation: orientation as "horizontal" | "vertical" }
                        : current,
                    )
                  }
                  value={draft.orientation}
                >
                  <option value="vertical">{t("Vertical")}</option>
                  <option value="horizontal">{t("Horizontal")}</option>
                </SelectField>
              </div>
              <label className="flex items-center gap-2 self-end pb-2 text-sm">
                <input
                  checked={draft.stacked}
                  onChange={(event) =>
                    setDraft((current) =>
                      current.type === "bar"
                        ? { ...current, stacked: event.target.checked }
                        : current,
                    )
                  }
                  type="checkbox"
                />
                {t("Stacking")}
              </label>
            </section>
          ) : null}
          {draft.type === "line" ? (
            <section className="grid gap-2 rounded-lg border p-4">
              <Label>{t("Type")}</Label>
              <SelectField
                onChange={(variant) =>
                  setDraft((current) =>
                    current.type === "line"
                      ? { ...current, variant: variant as "area" | "line" }
                      : current,
                  )
                }
                value={draft.variant}
              >
                <option value="line">{t("Line")}</option>
                <option value="area">{t("Area")}</option>
              </SelectField>
            </section>
          ) : null}
          {draft.type === "pie" ? (
            <section className="grid gap-2 rounded-lg border p-4">
              <Label>{t("Type")}</Label>
              <SelectField
                onChange={(variant) =>
                  setDraft((current) =>
                    current.type === "pie"
                      ? { ...current, variant: variant as "donut" | "pie" }
                      : current,
                  )
                }
                value={draft.variant}
              >
                <option value="pie">{t("Pie")}</option>
                <option value="donut">{t("Donut")}</option>
              </SelectField>
            </section>
          ) : null}
          {draft.type === "gauge" ? (
            <section className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>{t("Minimum")}</Label>
                <Input
                  onChange={(event) =>
                    setDraft((current) =>
                      current.type === "gauge"
                        ? { ...current, minimum: Number(event.target.value) }
                        : current,
                    )
                  }
                  type="number"
                  value={draft.minimum}
                />
              </div>
              <div className="grid gap-2">
                <Label>{t("Maximum")}</Label>
                <Input
                  onChange={(event) =>
                    setDraft((current) =>
                      current.type === "gauge"
                        ? { ...current, maximum: Number(event.target.value) }
                        : current,
                    )
                  }
                  type="number"
                  value={draft.maximum}
                />
              </div>
            </section>
          ) : null}
          {draft.type === "pivot" ? (
            <section className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>{t("Rows")}</Label>
                <select
                  className="min-h-28 rounded-md border bg-background p-2 text-sm"
                  multiple
                  onChange={(event) =>
                    setDraft((current) =>
                      current.type === "pivot"
                        ? {
                            ...current,
                            rowFields: [...event.currentTarget.selectedOptions].map(
                              (option) => option.value,
                            ),
                          }
                        : current,
                    )
                  }
                  value={draft.rowFields}
                >
                  {fields.map((field) => (
                    <option key={field.id} value={field.id}>
                      {fieldLabel(field.label)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label>{t("Columns")}</Label>
                <select
                  className="min-h-28 rounded-md border bg-background p-2 text-sm"
                  multiple
                  onChange={(event) =>
                    setDraft((current) =>
                      current.type === "pivot"
                        ? {
                            ...current,
                            columnFields: [...event.currentTarget.selectedOptions].map(
                              (option) => option.value,
                            ),
                          }
                        : current,
                    )
                  }
                  value={draft.columnFields}
                >
                  {fields.map((field) => (
                    <option key={field.id} value={field.id}>
                      {fieldLabel(field.label)}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  checked={draft.showSubtotals}
                  onChange={(event) =>
                    setDraft((current) =>
                      current.type === "pivot"
                        ? { ...current, showSubtotals: event.target.checked }
                        : current,
                    )
                  }
                  type="checkbox"
                />
                {t("Subtotals")}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  checked={draft.showGrandTotal}
                  onChange={(event) =>
                    setDraft((current) =>
                      current.type === "pivot"
                        ? { ...current, showGrandTotal: event.target.checked }
                        : current,
                    )
                  }
                  type="checkbox"
                />
                {t("Grand total")}
              </label>
            </section>
          ) : null}

          <section className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                checked={draft.presentation.showLegend}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    presentation: { ...current.presentation, showLegend: event.target.checked },
                  }))
                }
                type="checkbox"
              />
              {t("Legend")}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                checked={draft.presentation.showLabels}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    presentation: { ...current.presentation, showLabels: event.target.checked },
                  }))
                }
                type="checkbox"
              />
              {t("Labels")}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                checked={draft.presentation.showDescription}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    presentation: {
                      ...current.presentation,
                      showDescription: event.target.checked,
                    },
                  }))
                }
                type="checkbox"
              />
              {t("Show description")}
            </label>
            <div className="grid gap-2">
              <Label>{t("Number format")}</Label>
              <SelectField
                onChange={(numberFormat) =>
                  setDraft((current) => ({
                    ...current,
                    presentation: {
                      ...current.presentation,
                      numberFormat: numberFormat as typeof current.presentation.numberFormat,
                    },
                  }))
                }
                value={draft.presentation.numberFormat}
              >
                <option value="decimal">{t("Decimal")}</option>
                <option value="compact">{t("Compact")}</option>
                <option value="percent">{t("Percent")}</option>
              </SelectField>
            </div>
            <div className="grid gap-2">
              <Label>{t("Palette")}</Label>
              <SelectField
                onChange={(name) =>
                  setDraft((current) => ({
                    ...current,
                    presentation: {
                      ...current.presentation,
                      palette: {
                        ...current.presentation.palette,
                        name: name as typeof current.presentation.palette.name,
                      },
                    },
                  }))
                }
                value={draft.presentation.palette.name}
              >
                <option value="categorical">{t("Categorical")}</option>
                <option value="aurora">{t("Aurora")}</option>
                <option value="cool">{t("Cool")}</option>
                <option value="warm">{t("Warm")}</option>
              </SelectField>
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label>{t("Series color overrides")}</Label>
              <Textarea
                aria-invalid={!overridesValid}
                onChange={(event) => setOverrideText(event.target.value)}
                placeholder={t("One override per line: name = #rrggbb.")}
                value={overrideText}
              />
            </div>
            <div className="grid gap-2">
              <Label>{t("Top N")}</Label>
              <Input
                max={1000}
                min={1}
                onChange={(event) =>
                  updateQuery({
                    topN: event.target.value
                      ? Math.max(1, Math.min(1000, Number(event.target.value)))
                      : null,
                  })
                }
                type="number"
                value={draft.query.topN ?? ""}
              />
            </div>
            <div className="grid gap-2">
              <Label>{t("Sort")}</Label>
              <div className="grid grid-cols-2 gap-2">
                <SelectField
                  onChange={(key) =>
                    updateQuery({
                      sort: key ? { direction: draft.query.sort?.direction ?? "desc", key } : null,
                    })
                  }
                  value={draft.query.sort?.key ?? ""}
                >
                  <option value="">—</option>
                  {draft.query.dimensions.map((dimension) => (
                    <option key={dimension.field} value={dimension.field}>
                      {fieldLabel(
                        fields.find((field) => field.id === dimension.field)?.label ??
                          dimension.field,
                      )}
                    </option>
                  ))}
                  {draft.query.measures.map((measure) => (
                    <option key={measure.id} value={measure.id}>
                      {t(operationLabels[measure.operation])}
                    </option>
                  ))}
                </SelectField>
                <SelectField
                  onChange={(direction) =>
                    updateQuery({
                      sort: draft.query.sort
                        ? { ...draft.query.sort, direction: direction as "asc" | "desc" }
                        : null,
                    })
                  }
                  value={draft.query.sort?.direction ?? "desc"}
                >
                  <option value="asc">{t("Ascending")}</option>
                  <option value="desc">{t("Descending")}</option>
                </SelectField>
              </div>
            </div>
          </section>
        </DialogBody>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
            {t("Cancel")}
          </Button>
          <Button
            disabled={
              !draft.title.trim() ||
              !draft.viewId ||
              !overridesValid ||
              draft.query.measures.length === 0
            }
            onClick={() => {
              onSave({
                ...draft,
                presentation: {
                  ...draft.presentation,
                  palette: { ...draft.presentation.palette, overrides: parsedOverrides },
                },
                title: draft.title.trim(),
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
