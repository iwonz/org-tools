import type {
  AnalyticsDashboard,
  AnalyticsPanel,
  AnalyticsPanelTab,
  AnalyticsQuery,
  AnalyticsWidget,
  AnalyticsWidgetPresentation,
  ViewId,
} from "@org-tools/types";

import { createEmptyAnalyticsFilterValue } from "@/lib/analytics-state";
import { createUuid } from "@/lib/employee-data";

export const createDefaultAnalyticsPresentation = (): AnalyticsWidgetPresentation => ({
  numberFormat: "decimal",
  palette: { name: "categorical", overrides: {} },
  showDescription: true,
  showLabels: true,
  showLegend: true,
});

export const createDefaultAnalyticsQuery = (): AnalyticsQuery => ({
  dimensions: [],
  filters: [],
  measures: [{ field: null, id: createUuid(), operation: "countRows" }],
  sort: null,
  topN: null,
});

const baseWidget = (title: string, viewId: ViewId) => ({
  dataset: { kind: "employees" as const },
  description: "",
  height: "M" as const,
  id: createUuid(),
  presentation: createDefaultAnalyticsPresentation(),
  query: createDefaultAnalyticsQuery(),
  title,
  viewId,
  width: 1 as const,
});

export const createAnalyticsWidget = (
  type: AnalyticsWidget["type"],
  viewId: ViewId,
  title: string,
): AnalyticsWidget => {
  const base = baseWidget(title, viewId);
  if (type === "table") return { ...base, showTotals: true, type };
  if (type === "pivot")
    return {
      ...base,
      columnFields: [],
      rowFields: [],
      showGrandTotal: true,
      showSubtotals: true,
      type,
    };
  if (type === "bar") return { ...base, orientation: "vertical", stacked: false, type };
  if (type === "line") return { ...base, type, variant: "line" };
  if (type === "pie") return { ...base, type, variant: "donut" };
  if (type === "gauge") return { ...base, maximum: 100, minimum: 0, type };
  if (type === "filter")
    return {
      ...base,
      control: "multiSelect",
      defaultValue: createEmptyAnalyticsFilterValue(),
      field: "employee.fullName",
      targetWidgetIds: null,
      type,
    };
  return { ...base, type };
};

export const createAnalyticsPanelTab = (name: string): AnalyticsPanelTab => ({
  id: createUuid(),
  name,
  widgets: [],
});

export const createAnalyticsPanel = (name: string, tabName: string): AnalyticsPanel => ({
  id: createUuid(),
  name,
  tabs: [createAnalyticsPanelTab(tabName)],
  width: 3,
});

export const createAnalyticsDashboard = (name: string): AnalyticsDashboard => {
  const now = new Date().toISOString();
  return { createdAt: now, id: createUuid(), name, panels: [], updatedAt: now };
};

export const cloneAnalyticsDashboard = (
  source: AnalyticsDashboard,
  name: string,
): AnalyticsDashboard => {
  const now = new Date().toISOString();
  const widgetIdMap = new Map<string, string>();
  for (const widget of source.panels.flatMap((panel) => panel.tabs.flatMap((tab) => tab.widgets))) {
    widgetIdMap.set(widget.id, createUuid());
  }
  return {
    createdAt: now,
    id: createUuid(),
    name,
    panels: source.panels.map((panel) => ({
      ...structuredClone(panel),
      id: createUuid(),
      tabs: panel.tabs.map((tab) => ({
        ...structuredClone(tab),
        id: createUuid(),
        widgets: tab.widgets.map((widget) => {
          const measureIdMap = new Map(
            widget.query.measures.map((measure) => [measure.id, createUuid()]),
          );
          return {
            ...structuredClone(widget),
            id: widgetIdMap.get(widget.id) as string,
            query: {
              ...structuredClone(widget.query),
              measures: widget.query.measures.map((measure) => ({
                ...structuredClone(measure),
                id: measureIdMap.get(measure.id) as string,
              })),
              sort: widget.query.sort
                ? {
                    ...structuredClone(widget.query.sort),
                    key: measureIdMap.get(widget.query.sort.key) ?? widget.query.sort.key,
                  }
                : null,
            },
            ...(widget.type === "filter" && widget.targetWidgetIds !== null
              ? {
                  targetWidgetIds: widget.targetWidgetIds.flatMap((id) => {
                    const replacement = widgetIdMap.get(id);
                    return replacement ? [replacement] : [];
                  }),
                }
              : {}),
          } as AnalyticsWidget;
        }),
      })),
    })),
    updatedAt: now,
  };
};

export const moveAnalyticsItem = <T>(items: readonly T[], index: number, offset: -1 | 1): T[] => {
  const nextIndex = index + offset;
  if (nextIndex < 0 || nextIndex >= items.length) return [...items];
  const next = [...items];
  const [item] = next.splice(index, 1);
  if (item !== undefined) next.splice(nextIndex, 0, item);
  return next;
};
