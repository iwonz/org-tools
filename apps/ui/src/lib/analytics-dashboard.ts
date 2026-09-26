import type {
  AnalyticsConfiguration,
  AnalyticsFilter,
  AnalyticsQuery,
  AnalyticsTab,
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

export const createEmptyAnalyticsConfiguration = (): AnalyticsConfiguration => ({
  filters: [],
  tabs: [],
  widgets: [],
});

export const createAnalyticsWidget = (
  type: AnalyticsWidget["type"],
  viewId: ViewId,
  title: string,
  tabId: string | null = null,
): AnalyticsWidget => {
  const base = {
    dataset: { kind: "employees" as const },
    description: "",
    height: "M" as const,
    id: createUuid(),
    presentation: createDefaultAnalyticsPresentation(),
    query: createDefaultAnalyticsQuery(),
    tabId,
    title,
    viewId,
    width: 1 as const,
  };
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
  return { ...base, type };
};

export const createAnalyticsFilter = (viewId: ViewId, name: string): AnalyticsFilter => ({
  control: "multiSelect",
  defaultValue: createEmptyAnalyticsFilterValue(),
  field: "employee.fullName",
  id: createUuid(),
  name,
  targetWidgetIds: null,
  viewId,
});

export const createAnalyticsTab = (name: string): AnalyticsTab => ({ id: createUuid(), name });

export const addAnalyticsTab = (
  configuration: AnalyticsConfiguration,
  name: string,
): { configuration: AnalyticsConfiguration; tabId: string } => {
  const tab = createAnalyticsTab(name);
  const first = configuration.tabs.length === 0;
  return {
    configuration: {
      ...structuredClone(configuration),
      tabs: [...configuration.tabs.map((item) => ({ ...item })), tab],
      widgets: configuration.widgets.map((widget) => ({
        ...structuredClone(widget),
        tabId: first ? tab.id : widget.tabId,
      })),
    },
    tabId: tab.id,
  };
};

export const removeAnalyticsTab = (
  configuration: AnalyticsConfiguration,
  tabId: string,
): { configuration: AnalyticsConfiguration; activeTabId: string | null } => {
  const index = configuration.tabs.findIndex((tab) => tab.id === tabId);
  if (index < 0) return { configuration: structuredClone(configuration), activeTabId: null };
  const tabs = configuration.tabs.filter((tab) => tab.id !== tabId).map((tab) => ({ ...tab }));
  const destination = tabs[index] ?? tabs[index - 1] ?? null;
  return {
    configuration: {
      filters: configuration.filters.map((filter) => structuredClone(filter)),
      tabs,
      widgets: configuration.widgets.map((widget) => ({
        ...structuredClone(widget),
        tabId: widget.tabId === tabId ? (destination?.id ?? null) : widget.tabId,
      })),
    },
    activeTabId: destination?.id ?? null,
  };
};

export const removeAnalyticsWidget = (
  configuration: AnalyticsConfiguration,
  widgetId: string,
): AnalyticsConfiguration => ({
  filters: configuration.filters.map((filter) => ({
    ...structuredClone(filter),
    targetWidgetIds:
      filter.targetWidgetIds === null
        ? null
        : filter.targetWidgetIds.filter((targetId) => targetId !== widgetId),
  })),
  tabs: configuration.tabs.map((tab) => ({ ...tab })),
  widgets: configuration.widgets
    .filter((widget) => widget.id !== widgetId)
    .map((widget) => structuredClone(widget)),
});

export const moveAnalyticsItem = <T>(items: readonly T[], index: number, offset: -1 | 1): T[] => {
  const nextIndex = index + offset;
  if (nextIndex < 0 || nextIndex >= items.length) return [...items];
  const next = [...items];
  const [item] = next.splice(index, 1);
  if (item !== undefined) next.splice(nextIndex, 0, item);
  return next;
};

export const reorderById = <T extends { id: string }>(
  items: readonly T[],
  sourceId: string,
  targetId: string,
): T[] => {
  const sourceIndex = items.findIndex((item) => item.id === sourceId);
  const targetIndex = items.findIndex((item) => item.id === targetId);
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return [...items];
  const next = [...items];
  const [source] = next.splice(sourceIndex, 1);
  if (source) next.splice(targetIndex, 0, source);
  return next;
};
