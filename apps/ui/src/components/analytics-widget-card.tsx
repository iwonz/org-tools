"use client";

import type {
  AnalyticsFilter,
  AnalyticsFilterScalar,
  AnalyticsFilterValue,
  AnalyticsWidget,
  EmployeeId,
  UiOrgStructure,
} from "@org-tools/types";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useLocale } from "next-intl";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { HiOutlineArrowDownTray, HiOutlineChartBar } from "react-icons/hi2";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { useUiText } from "@/i18n/use-ui-text";
import {
  type AnalyticsAppliedFilter,
  type AnalyticsQueryResult,
  type AnalyticsResultRow,
  buildAnalyticsRows,
} from "@/lib/analytics-query";
import type { AnalyticsWorkerClient } from "@/lib/analytics-worker-client";
import { cn } from "@/lib/utils";

const PALETTES = {
  aurora: ["#2563eb", "#8b5cf6", "#06b6d4", "#22c55e", "#f59e0b", "#f43f5e"],
  categorical: ["#2563eb", "#f97316", "#16a34a", "#9333ea", "#dc2626", "#0891b2"],
  cool: ["#0ea5e9", "#2563eb", "#4f46e5", "#7c3aed", "#0891b2", "#14b8a6"],
  warm: ["#ef4444", "#f97316", "#f59e0b", "#eab308", "#ec4899", "#a855f7"],
} as const;

const heightClass = { L: "h-[420px]", M: "h-[320px]", S: "h-[220px]" } as const;

const useVisible = (rootMargin = "160px") => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setVisible(true);
      },
      { rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);
  return { ref, visible };
};

const rowLabel = (row: AnalyticsResultRow) =>
  row.dimensions.map((dimension) => dimension.label || "—").join(" · ") || "Total";

const formatValue = (
  value: number | null | undefined,
  format: AnalyticsWidget["presentation"]["numberFormat"],
  locale: string,
) => {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
    notation: format === "compact" ? "compact" : "standard",
    style: format === "percent" ? "percent" : "decimal",
  }).format(format === "percent" ? value / 100 : value);
};

function AnalyticsVirtualTable({
  onDrilldown,
  result,
  widget,
}: {
  onDrilldown: (employeeIds: EmployeeId[]) => void;
  result: AnalyticsQueryResult;
  widget: AnalyticsWidget;
}) {
  const locale = useLocale();
  const t = useUiText();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [sort, setSort] = useState<{ direction: "asc" | "desc"; key: string } | null>(
    widget.query.sort,
  );
  useEffect(() => setSort(widget.query.sort), [widget.query.sort]);
  const sortedResultRows = useMemo(() => {
    if (!sort) return result.rows;
    const next = [...result.rows];
    next.sort((first, second) => {
      const firstValue =
        first.measures[sort.key] ??
        first.dimensions.find((cell) => cell.key === sort.key)?.value ??
        "";
      const secondValue =
        second.measures[sort.key] ??
        second.dimensions.find((cell) => cell.key === sort.key)?.value ??
        "";
      const comparison =
        typeof firstValue === "number" && typeof secondValue === "number"
          ? firstValue - secondValue
          : String(firstValue).localeCompare(String(secondValue), locale, {
              numeric: true,
              sensitivity: "base",
            });
      return sort.direction === "asc" ? comparison : -comparison;
    });
    return next;
  }, [locale, result.rows, sort]);
  const virtualizer = useVirtualizer({
    count: sortedResultRows.length,
    estimateSize: () => 38,
    getScrollElement: () => scrollRef.current,
    overscan: 4,
  });
  const rows = virtualizer.getVirtualItems();
  return (
    <div className="min-h-0 flex-1 overflow-auto" data-analytics-table-scroll ref={scrollRef}>
      <table className="w-full border-collapse text-xs">
        <thead className="sticky top-0 z-10 bg-card">
          <tr>
            {result.columns.map((column) => (
              <th
                aria-sort={
                  sort?.key === column.id
                    ? sort.direction === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                }
                className="border-b px-3 py-2 text-start font-medium"
                key={column.id}
              >
                <button
                  className="inline-flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() =>
                    setSort((current) =>
                      current?.key === column.id
                        ? {
                            direction: current.direction === "asc" ? "desc" : "asc",
                            key: column.id,
                          }
                        : { direction: "asc", key: column.id },
                    )
                  }
                  type="button"
                >
                  {column.label}
                  {sort?.key === column.id ? (sort.direction === "asc" ? "↑" : "↓") : null}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows[0]?.start ? (
            <tr>
              <td colSpan={result.columns.length} style={{ height: rows[0].start }} />
            </tr>
          ) : null}
          {rows.map((virtualRow) => {
            const row = sortedResultRows[virtualRow.index];
            if (!row) return null;
            return (
              <tr
                className={cn(
                  "cursor-pointer border-b transition-colors hover:bg-accent/45 focus-within:bg-accent/45",
                  row.kind === "subtotal" && "bg-muted/40 font-medium",
                )}
                data-index={virtualRow.index}
                key={row.id}
                onClick={() => onDrilldown(row.employeeIds)}
                ref={virtualizer.measureElement}
              >
                {result.columns.map((column, columnIndex) => {
                  const dimension = row.dimensions.find((cell) => cell.key === column.id);
                  return column.kind === "dimension" ? (
                    <td className="px-3 py-2" key={column.id}>
                      {dimension?.label || "—"}
                      {row.kind === "subtotal" &&
                      columnIndex === Math.max(0, row.dimensions.length - 1)
                        ? ` · ${t("Subtotal")}`
                        : null}
                    </td>
                  ) : (
                    <td className="px-3 py-2 text-end tabular-nums" key={column.id}>
                      {formatValue(
                        row.measures[column.id],
                        widget.presentation.numberFormat,
                        locale,
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
          {rows.length > 0 && virtualizer.getTotalSize() > (rows.at(-1)?.end ?? 0) ? (
            <tr>
              <td
                colSpan={result.columns.length}
                style={{ height: virtualizer.getTotalSize() - (rows.at(-1)?.end ?? 0) }}
              />
            </tr>
          ) : null}
        </tbody>
        {result.columns.some((column) => column.kind === "dimension") &&
          ((widget.type === "table" && widget.showTotals) ||
            (widget.type === "pivot" && widget.showGrandTotal)) && (
            <tfoot className="sticky bottom-0 bg-card font-medium">
              <tr>
                <td
                  className="border-t px-3 py-2"
                  colSpan={Math.max(
                    1,
                    result.columns.filter((column) => column.kind === "dimension").length,
                  )}
                >
                  {t("Grand total")}
                </td>
                {result.columns
                  .filter((column) => column.kind === "measure")
                  .map((column) => (
                    <td className="border-t px-3 py-2 text-end tabular-nums" key={column.id}>
                      {formatValue(
                        result.totals[column.id],
                        widget.presentation.numberFormat,
                        locale,
                      )}
                    </td>
                  ))}
              </tr>
            </tfoot>
          )}
      </table>
    </div>
  );
}

function AnalyticsChart({
  onDrilldown,
  result,
  widget,
}: {
  onDrilldown: (employeeIds: EmployeeId[]) => void;
  result: AnalyticsQueryResult;
  widget: AnalyticsWidget;
}) {
  const measure = widget.query.measures[0];
  const palette = PALETTES[widget.presentation.palette.name];
  if (!measure) return null;
  const data = result.rows.map((row, index) => ({
    employeeIds: row.employeeIds,
    fill:
      widget.presentation.palette.overrides[rowLabel(row)] ??
      palette[index % palette.length] ??
      "#2563eb",
    label: rowLabel(row),
    ...Object.fromEntries(
      widget.query.measures.map((item) => [item.id, row.measures[item.id] ?? 0]),
    ),
    value: row.measures[measure.id] ?? 0,
  }));
  const drill = (entry: unknown) => {
    const payload = entry as {
      activePayload?: { payload?: { employeeIds?: EmployeeId[] } }[];
      employeeIds?: EmployeeId[];
      payload?: { employeeIds?: EmployeeId[] };
    };
    const employeeIds =
      payload.employeeIds ??
      payload.payload?.employeeIds ??
      payload.activePayload?.[0]?.payload?.employeeIds;
    if (employeeIds) onDrilldown(employeeIds);
  };
  const common = {
    accessibilityLayer: true,
    data,
    margin: { bottom: 12, left: 0, right: 12, top: 12 },
  };
  if (widget.type === "bar") {
    return (
      <ResponsiveContainer height="100%" width="100%">
        <BarChart
          {...common}
          layout={widget.orientation === "horizontal" ? "vertical" : "horizontal"}
          onClick={drill}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          {widget.orientation === "horizontal" ? (
            <YAxis dataKey="label" type="category" width={92} />
          ) : (
            <XAxis dataKey="label" />
          )}
          {widget.orientation === "horizontal" ? <XAxis type="number" /> : <YAxis />}
          <Tooltip />
          {widget.presentation.showLegend && <Legend />}
          {widget.query.measures.map((item, index) => (
            <Bar
              dataKey={item.id}
              fill={
                widget.presentation.palette.overrides[item.id] ??
                palette[index % palette.length] ??
                "#2563eb"
              }
              key={item.id}
              name={item.operation}
              radius={[5, 5, 0, 0]}
              {...(widget.stacked ? { stackId: "analytics" } : {})}
            >
              {widget.query.measures.length === 1
                ? data.map((entry) => <Cell fill={entry.fill} key={entry.label} />)
                : null}
              {widget.presentation.showLabels ? (
                <LabelList dataKey={item.id} position="top" />
              ) : null}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }
  if (widget.type === "line") {
    const Chart = widget.variant === "area" ? AreaChart : LineChart;
    return (
      <ResponsiveContainer height="100%" width="100%">
        <Chart {...common} onClick={drill}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip />
          {widget.presentation.showLegend && <Legend />}
          {widget.query.measures.map((item, index) => {
            const color =
              widget.presentation.palette.overrides[item.id] ??
              palette[index % palette.length] ??
              "#2563eb";
            return widget.variant === "area" ? (
              <Area
                dataKey={item.id}
                fill={color}
                fillOpacity={0.18}
                key={item.id}
                name={item.operation}
                stroke={color}
                type="monotone"
              >
                {widget.presentation.showLabels ? (
                  <LabelList dataKey={item.id} position="top" />
                ) : null}
              </Area>
            ) : (
              <Line
                dataKey={item.id}
                dot={{ r: 3 }}
                key={item.id}
                name={item.operation}
                stroke={color}
                strokeWidth={2}
                type="monotone"
              >
                {widget.presentation.showLabels ? (
                  <LabelList dataKey={item.id} position="top" />
                ) : null}
              </Line>
            );
          })}
        </Chart>
      </ResponsiveContainer>
    );
  }
  if (widget.type === "pie") {
    return (
      <ResponsiveContainer height="100%" width="100%">
        <PieChart accessibilityLayer>
          <Tooltip />
          {widget.presentation.showLegend && <Legend />}
          <Pie
            data={data}
            dataKey="value"
            innerRadius={widget.variant === "donut" ? "52%" : 0}
            label={widget.presentation.showLabels}
            nameKey="label"
            onClick={drill}
            outerRadius="80%"
          >
            {data.map((entry) => (
              <Cell fill={entry.fill} key={entry.label} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    );
  }
  if (widget.type === "gauge") {
    const value = Number(data[0]?.value ?? 0);
    const normalized = Math.max(
      0,
      Math.min(100, ((value - widget.minimum) / (widget.maximum - widget.minimum)) * 100),
    );
    return (
      <div className="relative h-full min-h-40">
        <ResponsiveContainer height="100%" width="100%">
          <RadialBarChart
            accessibilityLayer
            data={[{ fill: palette[0] ?? "#2563eb", value: normalized }]}
            endAngle={0}
            innerRadius="72%"
            outerRadius="100%"
            startAngle={180}
          >
            <PolarAngleAxis angleAxisId={0} domain={[0, 100]} tick={false} type="number" />
            <RadialBar background dataKey="value" cornerRadius={8} />
          </RadialBarChart>
        </ResponsiveContainer>
        <button
          className="absolute inset-x-0 bottom-8 mx-auto w-fit rounded px-2 text-3xl font-semibold tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => onDrilldown(data[0]?.employeeIds ?? [])}
          type="button"
        >
          {value}
        </button>
      </div>
    );
  }
  return null;
}

export function AnalyticsFilterControl({
  client,
  onChange,
  revisionKey,
  structure,
  value,
  filter,
}: {
  client: AnalyticsWorkerClient;
  onChange: (value: AnalyticsFilterValue) => void;
  revisionKey: string;
  structure: UiOrgStructure;
  value: AnalyticsFilterValue;
  filter: AnalyticsFilter;
}) {
  const t = useUiText();
  const [options, setOptions] = useState<AnalyticsFilterScalar[] | null>(null);
  const loadOptions = () => {
    if (options || filter.control === "search") return;
    const dataset = filter.field.startsWith("assignment.")
      ? ({ kind: "assignments" } as const)
      : filter.field.startsWith("tag.")
        ? ({ kind: "tags" } as const)
        : filter.field.startsWith("composite:")
          ? ({ fieldId: filter.field.split(":")[1] ?? "", kind: "composite" } as const)
          : ({ kind: "employees" } as const);
    const rows = buildAnalyticsRows(structure, { dataset });
    void client
      .options(`${revisionKey}:options:${filter.id}:${filter.field}`, filter.field, rows)
      .then(setOptions)
      .catch(() => setOptions(null));
  };
  if (filter.control === "search") {
    return (
      <input
        className="h-10 w-full rounded-md border bg-background px-3 text-sm"
        onChange={(event) => onChange({ ...value, search: event.target.value })}
        placeholder={t("Search")}
        value={value.search}
      />
    );
  }
  if (filter.control === "dateRange") {
    return (
      <div className="grid grid-cols-2 gap-2">
        <input
          className="h-10 rounded-md border bg-background px-3 text-sm"
          onChange={(event) => onChange({ ...value, from: event.target.value || null })}
          type="date"
          value={typeof value.from === "string" ? value.from : ""}
        />
        <input
          className="h-10 rounded-md border bg-background px-3 text-sm"
          onChange={(event) => onChange({ ...value, to: event.target.value || null })}
          type="date"
          value={typeof value.to === "string" ? value.to : ""}
        />
      </div>
    );
  }
  return (
    <select
      className="min-h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
      multiple={filter.control === "multiSelect"}
      onFocus={loadOptions}
      onMouseDown={loadOptions}
      onChange={(event) =>
        onChange({
          ...value,
          values: [...event.currentTarget.selectedOptions].map(
            (option) => JSON.parse(option.value) as AnalyticsFilterScalar,
          ),
        })
      }
      value={value.values.map((item) => JSON.stringify(item))}
    >
      {options === null ? (
        <option disabled>{t("Select")}</option>
      ) : (
        options.map((option) => (
          <option key={`${typeof option}:${String(option)}`} value={JSON.stringify(option)}>
            {String(option)}
          </option>
        ))
      )}
    </select>
  );
}

export function AnalyticsWidgetCard({
  activeFilters,
  client,
  editChrome,
  onDrilldown,
  onExport,
  revisionKey,
  structure,
  widget,
}: {
  activeFilters: AnalyticsAppliedFilter[];
  client: AnalyticsWorkerClient;
  editChrome?: ReactNode;
  onDrilldown: (employeeIds: EmployeeId[], widgetId: string) => void;
  onExport: () => void;
  revisionKey: string;
  structure: UiOrgStructure | null;
  widget: AnalyticsWidget;
}) {
  const t = useUiText();
  const locale = useLocale();
  const { ref, visible } = useVisible();
  const [result, setResult] = useState<AnalyticsQueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const queryKey = useMemo(
    () => `${revisionKey}:${JSON.stringify(widget)}:${JSON.stringify(activeFilters)}`,
    [activeFilters, revisionKey, widget],
  );
  useEffect(() => {
    if (!visible || !structure) return;
    let current = true;
    setResult(null);
    setError(null);
    const rows = buildAnalyticsRows(structure, widget);
    void client.query(queryKey, widget, rows, activeFilters).then(
      (next) => {
        if (current) setResult(next);
      },
      (reason) => {
        if (current && (reason as { name?: string }).name !== "AbortError")
          setError(reason instanceof Error ? reason.message : String(reason));
      },
    );
    return () => {
      current = false;
    };
  }, [activeFilters, client, queryKey, structure, visible, widget]);
  const firstMeasure = widget.query.measures[0];
  return (
    <article
      className={cn(
        "flex min-w-0 flex-col overflow-hidden rounded-xl border bg-card",
        heightClass[widget.height],
      )}
      data-analytics-widget-id={widget.id}
      data-demo-id={`analytics-widget-${widget.type}`}
      ref={ref}
    >
      <header className="flex items-start gap-3 border-b px-4 py-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium">{widget.title}</h3>
          {widget.presentation.showDescription && widget.description ? (
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
              {widget.description}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1" data-export-exclude>
          {editChrome}
          <Button
            aria-label={t("Export PNG")}
            onClick={onExport}
            size="icon"
            title={t("Export PNG")}
            type="button"
            variant="ghost"
          >
            <HiOutlineArrowDownTray />
          </Button>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col p-4" data-analytics-widget-body>
        {!visible || !result ? (
          <div className="grid min-h-32 flex-1 place-items-center text-sm text-muted-foreground">
            {error ?? t("Loading data")}
          </div>
        ) : result.rows.length === 0 ? (
          <div className="grid min-h-32 flex-1 place-items-center text-sm text-muted-foreground">
            <HiOutlineChartBar className="mb-2 size-8" />
            {t("No data")}
          </div>
        ) : widget.type === "kpi" ? (
          <button
            className="grid flex-1 place-items-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => onDrilldown(result.rows[0]?.employeeIds ?? [], widget.id)}
            type="button"
          >
            <span className="text-4xl font-semibold tabular-nums">
              {formatValue(
                firstMeasure ? result.rows[0]?.measures[firstMeasure.id] : null,
                widget.presentation.numberFormat,
                locale,
              )}
            </span>
          </button>
        ) : widget.type === "table" || widget.type === "pivot" ? (
          <>
            <AnalyticsVirtualTable
              onDrilldown={(ids) => onDrilldown(ids, widget.id)}
              result={result}
              widget={widget}
            />
            {result.truncated ? (
              <p className="mt-2 text-xs text-amber-700">{t("Truncated result")}</p>
            ) : null}
          </>
        ) : (
          <div className="min-h-40 flex-1">
            <AnalyticsChart
              onDrilldown={(ids) => onDrilldown(ids, widget.id)}
              result={result}
              widget={widget}
            />
          </div>
        )}
      </div>
    </article>
  );
}
