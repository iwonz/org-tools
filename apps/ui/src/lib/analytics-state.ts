import type {
  AnalyticsDashboard,
  AnalyticsDataset,
  AnalyticsDimension,
  AnalyticsFilterScalar,
  AnalyticsFilterValue,
  AnalyticsMeasure,
  AnalyticsPanel,
  AnalyticsPanelTab,
  AnalyticsPredicate,
  AnalyticsQuery,
  AnalyticsWidget,
  AnalyticsWidgetPresentation,
  CustomEmployeeFieldDefinition,
  EmployeeFieldId,
  OrgToolsAnalyticsUiState,
  OrgToolsEmployeeFilters,
  ViewId,
} from "@org-tools/types";

import { isUuid } from "@/lib/employee-data";

export const ANALYTICS_LIMITS = {
  dashboards: 32,
  panels: 64,
  tabs: 16,
  widgets: 32,
  tableRows: 20_000,
  pivotCells: 10_000,
} as const;

export const ANALYTICS_BUILT_IN_FIELDS = [
  "employee.id",
  "employee.firstName",
  "employee.lastName",
  "employee.fullName",
  "employee.gender",
  "employee.username",
  "employee.profileUrl",
  "employee.email",
  "employee.phone",
  "employee.birthday",
  "employee.tags",
  "employee.tagDates",
  "assignment.unitId",
  "assignment.unitName",
  "assignment.unitFullPath",
  "assignment.position",
  "assignment.isBoss",
  "tag.id",
  "tag.label",
  "tag.date",
] as const;

const ANALYTICS_BUILT_IN_FIELD_SET = new Set<string>(ANALYTICS_BUILT_IN_FIELDS);
const UNIT_CONTEXT_FIELDS = new Set([
  "assignment.unitId",
  "assignment.unitName",
  "assignment.unitFullPath",
  "assignment.position",
  "assignment.isBoss",
]);

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const COLOR_PATTERN = /^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/iu;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const hasExactKeys = (value: Record<string, unknown>, keys: readonly string[]) => {
  const actualKeys = Object.keys(value);
  return actualKeys.length === keys.length && keys.every((key) => actualKeys.includes(key));
};

const isTimestamp = (value: unknown): value is string =>
  typeof value === "string" && Number.isFinite(Date.parse(value));

const isBoundedText = (value: unknown, maximum: number, allowEmpty = true): value is string =>
  typeof value === "string" && value.length <= maximum && (allowEmpty || value.trim().length > 0);

const isFilterScalar = (value: unknown): value is AnalyticsFilterScalar =>
  typeof value === "string" ||
  typeof value === "boolean" ||
  (typeof value === "number" && Number.isFinite(value));

export const normalizeAnalyticsFilterValue = (value: unknown): AnalyticsFilterValue | null => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ["from", "includeEmpty", "search", "to", "values"]) ||
    !(value.from === null || isFilterScalar(value.from)) ||
    typeof value.includeEmpty !== "boolean" ||
    !isBoundedText(value.search, 500) ||
    !(value.to === null || isFilterScalar(value.to)) ||
    !Array.isArray(value.values) ||
    value.values.length > 1_000 ||
    !value.values.every(isFilterScalar)
  ) {
    return null;
  }
  return {
    from: value.from,
    includeEmpty: value.includeEmpty,
    search: value.search,
    to: value.to,
    values: [...value.values],
  };
};

export const createEmptyAnalyticsFilterValue = (): AnalyticsFilterValue => ({
  from: null,
  includeEmpty: false,
  search: "",
  to: null,
  values: [],
});

const normalizeDataset = (value: unknown): AnalyticsDataset | null => {
  if (!isRecord(value) || typeof value.kind !== "string") return null;
  if (["assignments", "employees", "tags"].includes(value.kind)) {
    return hasExactKeys(value, ["kind"]) ? ({ kind: value.kind } as AnalyticsDataset) : null;
  }
  if (
    value.kind === "composite" &&
    hasExactKeys(value, ["fieldId", "kind"]) &&
    isUuid(value.fieldId)
  ) {
    return { fieldId: value.fieldId, kind: "composite" };
  }
  return null;
};

const normalizeDimension = (value: unknown): AnalyticsDimension | null => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ["dateGrouping", "field"]) ||
    !isBoundedText(value.field, 300, false) ||
    !(
      value.dateGrouping === null ||
      ["day", "week", "month", "quarter", "year"].includes(value.dateGrouping as string)
    )
  ) {
    return null;
  }
  return {
    dateGrouping: value.dateGrouping as AnalyticsDimension["dateGrouping"],
    field: value.field,
  };
};

const normalizeMeasure = (value: unknown): AnalyticsMeasure | null => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ["field", "id", "operation"]) ||
    !(value.field === null || isBoundedText(value.field, 300, false)) ||
    !isUuid(value.id) ||
    ![
      "average",
      "countDistinct",
      "countDistinctEmployees",
      "countRows",
      "max",
      "min",
      "sum",
    ].includes(value.operation as string)
  ) {
    return null;
  }
  if (value.operation === "countRows" || value.operation === "countDistinctEmployees") {
    if (value.field !== null) return null;
  } else if (value.field === null) return null;
  return {
    field: value.field,
    id: value.id,
    operation: value.operation as AnalyticsMeasure["operation"],
  };
};

const normalizePredicate = (value: unknown): AnalyticsPredicate | null => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ["field", "operator", "value", "valueTo"]) ||
    !isBoundedText(value.field, 300, false) ||
    ![
      "contains",
      "empty",
      "equals",
      "greaterThan",
      "greaterThanOrEqual",
      "in",
      "lessThan",
      "lessThanOrEqual",
      "notEmpty",
      "notEquals",
      "range",
    ].includes(value.operator as string) ||
    !(
      value.value === null ||
      isFilterScalar(value.value) ||
      (Array.isArray(value.value) &&
        value.value.length <= 1_000 &&
        value.value.every(isFilterScalar))
    ) ||
    !(value.valueTo === null || isFilterScalar(value.valueTo))
  ) {
    return null;
  }
  return {
    field: value.field,
    operator: value.operator as AnalyticsPredicate["operator"],
    value: value.value as AnalyticsPredicate["value"],
    valueTo: value.valueTo,
  };
};

const normalizeQuery = (value: unknown): AnalyticsQuery | null => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ["dimensions", "filters", "measures", "sort", "topN"]) ||
    !Array.isArray(value.dimensions) ||
    value.dimensions.length > 16 ||
    !Array.isArray(value.filters) ||
    value.filters.length > 32 ||
    !Array.isArray(value.measures) ||
    value.measures.length > 16 ||
    !(
      value.topN === null ||
      (Number.isInteger(value.topN) &&
        (value.topN as number) >= 1 &&
        (value.topN as number) <= 1_000)
    )
  ) {
    return null;
  }
  const dimensions = value.dimensions.map(normalizeDimension);
  const filters = value.filters.map(normalizePredicate);
  const measures = value.measures.map(normalizeMeasure);
  if (
    dimensions.some((item) => !item) ||
    filters.some((item) => !item) ||
    measures.some((item) => !item)
  )
    return null;
  let sort: AnalyticsQuery["sort"] = null;
  if (value.sort !== null) {
    if (
      !isRecord(value.sort) ||
      !hasExactKeys(value.sort, ["direction", "key"]) ||
      !["asc", "desc"].includes(value.sort.direction as string) ||
      !isBoundedText(value.sort.key, 300, false)
    )
      return null;
    sort = { direction: value.sort.direction as "asc" | "desc", key: value.sort.key };
  }
  return {
    dimensions: dimensions as AnalyticsDimension[],
    filters: filters as AnalyticsPredicate[],
    measures: measures as AnalyticsMeasure[],
    sort,
    topN: value.topN as number | null,
  };
};

const normalizePresentation = (value: unknown): AnalyticsWidgetPresentation | null => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "numberFormat",
      "palette",
      "showDescription",
      "showLabels",
      "showLegend",
    ]) ||
    !["compact", "decimal", "percent"].includes(value.numberFormat as string) ||
    typeof value.showDescription !== "boolean" ||
    typeof value.showLabels !== "boolean" ||
    typeof value.showLegend !== "boolean" ||
    !isRecord(value.palette) ||
    !hasExactKeys(value.palette, ["name", "overrides"]) ||
    !["aurora", "categorical", "cool", "warm"].includes(value.palette.name as string) ||
    !isRecord(value.palette.overrides) ||
    Object.keys(value.palette.overrides).length > 100 ||
    !Object.entries(value.palette.overrides).every(
      ([key, color]) => key.length <= 300 && typeof color === "string" && COLOR_PATTERN.test(color),
    )
  )
    return null;
  return {
    numberFormat: value.numberFormat as AnalyticsWidgetPresentation["numberFormat"],
    palette: {
      name: value.palette.name as AnalyticsWidgetPresentation["palette"]["name"],
      overrides: { ...value.palette.overrides } as Record<string, string>,
    },
    showDescription: value.showDescription,
    showLabels: value.showLabels,
    showLegend: value.showLegend,
  };
};

const WIDGET_BASE_KEYS = [
  "dataset",
  "description",
  "height",
  "id",
  "presentation",
  "query",
  "title",
  "type",
  "viewId",
  "width",
] as const;

const normalizeWidget = (value: unknown): AnalyticsWidget | null => {
  if (!isRecord(value) || typeof value.type !== "string") return null;
  const extraKeysByType: Record<string, string[]> = {
    bar: ["orientation", "stacked"],
    filter: ["control", "defaultValue", "field", "targetWidgetIds"],
    gauge: ["maximum", "minimum"],
    kpi: [],
    line: ["variant"],
    pie: ["variant"],
    pivot: ["columnFields", "rowFields", "showGrandTotal", "showSubtotals"],
    table: ["showTotals"],
  };
  const extraKeys = extraKeysByType[value.type];
  if (
    !extraKeys ||
    !hasExactKeys(value, [...WIDGET_BASE_KEYS, ...extraKeys]) ||
    !isUuid(value.id) ||
    !isUuid(value.viewId) ||
    !isBoundedText(value.title, 200) ||
    !isBoundedText(value.description, 1_000) ||
    ![1, 2].includes(value.width as number) ||
    !["S", "M", "L"].includes(value.height as string)
  )
    return null;
  const dataset = normalizeDataset(value.dataset);
  const query = normalizeQuery(value.query);
  const presentation = normalizePresentation(value.presentation);
  if (!dataset || !query || !presentation) return null;
  const base = {
    dataset,
    description: value.description,
    height: value.height as "L" | "M" | "S",
    id: value.id,
    presentation,
    query,
    title: value.title,
    viewId: value.viewId,
    width: value.width as 1 | 2,
  };
  if (value.type === "kpi") return { ...base, type: "kpi" };
  if (value.type === "table" && typeof value.showTotals === "boolean")
    return { ...base, showTotals: value.showTotals, type: "table" };
  if (
    value.type === "pivot" &&
    Array.isArray(value.columnFields) &&
    value.columnFields.length <= 8 &&
    value.columnFields.every((item) => isBoundedText(item, 300, false)) &&
    Array.isArray(value.rowFields) &&
    value.rowFields.length <= 8 &&
    value.rowFields.every((item) => isBoundedText(item, 300, false)) &&
    typeof value.showGrandTotal === "boolean" &&
    typeof value.showSubtotals === "boolean"
  )
    return {
      ...base,
      columnFields: [...value.columnFields],
      rowFields: [...value.rowFields],
      showGrandTotal: value.showGrandTotal,
      showSubtotals: value.showSubtotals,
      type: "pivot",
    };
  if (
    value.type === "bar" &&
    ["horizontal", "vertical"].includes(value.orientation as string) &&
    typeof value.stacked === "boolean"
  ) {
    return {
      ...base,
      orientation: value.orientation as "horizontal" | "vertical",
      stacked: value.stacked,
      type: "bar",
    };
  }
  if (value.type === "line" && ["area", "line"].includes(value.variant as string))
    return { ...base, type: "line", variant: value.variant as "area" | "line" };
  if (value.type === "pie" && ["donut", "pie"].includes(value.variant as string))
    return { ...base, type: "pie", variant: value.variant as "donut" | "pie" };
  if (
    value.type === "gauge" &&
    typeof value.minimum === "number" &&
    Number.isFinite(value.minimum) &&
    typeof value.maximum === "number" &&
    Number.isFinite(value.maximum) &&
    value.maximum > value.minimum
  ) {
    return { ...base, maximum: value.maximum, minimum: value.minimum, type: "gauge" };
  }
  if (
    value.type === "filter" &&
    ["dateRange", "multiSelect", "search", "select"].includes(value.control as string) &&
    isBoundedText(value.field, 300, false) &&
    (value.targetWidgetIds === null ||
      (Array.isArray(value.targetWidgetIds) &&
        value.targetWidgetIds.length <= 1_000 &&
        value.targetWidgetIds.every((id) => typeof id === "string" && UUID_PATTERN.test(id))))
  ) {
    const defaultValue = normalizeAnalyticsFilterValue(value.defaultValue);
    if (!defaultValue) return null;
    return {
      ...base,
      control: value.control as "dateRange" | "multiSelect" | "search" | "select",
      defaultValue,
      field: value.field,
      targetWidgetIds: value.targetWidgetIds === null ? null : [...value.targetWidgetIds],
      type: "filter",
    };
  }
  return null;
};

const normalizeTab = (value: unknown): AnalyticsPanelTab | null => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ["id", "name", "widgets"]) ||
    !isUuid(value.id) ||
    !isBoundedText(value.name, 100, false) ||
    !Array.isArray(value.widgets) ||
    value.widgets.length > ANALYTICS_LIMITS.widgets
  )
    return null;
  const widgets = value.widgets.map(normalizeWidget);
  return widgets.some((widget) => !widget)
    ? null
    : { id: value.id, name: value.name, widgets: widgets as AnalyticsWidget[] };
};

const normalizePanel = (value: unknown): AnalyticsPanel | null => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ["id", "name", "tabs", "width"]) ||
    !isUuid(value.id) ||
    !isBoundedText(value.name, 100, false) ||
    ![1, 2, 3].includes(value.width as number) ||
    !Array.isArray(value.tabs) ||
    value.tabs.length < 1 ||
    value.tabs.length > ANALYTICS_LIMITS.tabs
  )
    return null;
  const tabs = value.tabs.map(normalizeTab);
  return tabs.some((tab) => !tab)
    ? null
    : {
        id: value.id,
        name: value.name,
        tabs: tabs as AnalyticsPanelTab[],
        width: value.width as 1 | 2 | 3,
      };
};

export const normalizeAnalyticsDashboards = (value: unknown): AnalyticsDashboard[] | null => {
  if (!Array.isArray(value) || value.length > ANALYTICS_LIMITS.dashboards) return null;
  const dashboards = value.map((dashboard): AnalyticsDashboard | null => {
    if (
      !isRecord(dashboard) ||
      !hasExactKeys(dashboard, ["createdAt", "id", "name", "panels", "updatedAt"]) ||
      !isUuid(dashboard.id) ||
      !isBoundedText(dashboard.name, 100, false) ||
      !isTimestamp(dashboard.createdAt) ||
      !isTimestamp(dashboard.updatedAt) ||
      !Array.isArray(dashboard.panels) ||
      dashboard.panels.length > ANALYTICS_LIMITS.panels
    )
      return null;
    const panels = dashboard.panels.map(normalizePanel);
    return panels.some((panel) => !panel)
      ? null
      : {
          createdAt: dashboard.createdAt,
          id: dashboard.id,
          name: dashboard.name,
          panels: panels as AnalyticsPanel[],
          updatedAt: dashboard.updatedAt,
        };
  });
  return dashboards.some((dashboard) => !dashboard) ? null : (dashboards as AnalyticsDashboard[]);
};

export const normalizeAnalyticsUiState = (
  value: unknown,
  normalizeFilters: (value: unknown) => OrgToolsEmployeeFilters | null,
): OrgToolsAnalyticsUiState | null => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "activeDashboardId",
      "activeTabIdsByPanelId",
      "drilldown",
      "filterValuesByWidgetId",
    ]) ||
    !(value.activeDashboardId === null || isUuid(value.activeDashboardId)) ||
    !isRecord(value.activeTabIdsByPanelId) ||
    Object.keys(value.activeTabIdsByPanelId).length >
      ANALYTICS_LIMITS.dashboards * ANALYTICS_LIMITS.panels ||
    !Object.entries(value.activeTabIdsByPanelId).every(
      ([panelId, tabId]) => isUuid(panelId) && isUuid(tabId),
    ) ||
    !isRecord(value.filterValuesByWidgetId) ||
    Object.keys(value.filterValuesByWidgetId).length >
      ANALYTICS_LIMITS.dashboards * ANALYTICS_LIMITS.panels * ANALYTICS_LIMITS.widgets ||
    !isRecord(value.drilldown) ||
    !hasExactKeys(value.drilldown, ["employeeIds", "filters", "query", "sourceWidgetId"]) ||
    !Array.isArray(value.drilldown.employeeIds) ||
    value.drilldown.employeeIds.length > ANALYTICS_LIMITS.tableRows ||
    !value.drilldown.employeeIds.every(isUuid) ||
    !isBoundedText(value.drilldown.query, 500) ||
    !(value.drilldown.sourceWidgetId === null || isUuid(value.drilldown.sourceWidgetId))
  )
    return null;
  const filterValues = Object.fromEntries(
    Object.entries(value.filterValuesByWidgetId).map(([widgetId, filterValue]) => [
      widgetId,
      normalizeAnalyticsFilterValue(filterValue),
    ]),
  );
  if (
    !Object.keys(filterValues).every(isUuid) ||
    Object.values(filterValues).some((filterValue) => !filterValue)
  )
    return null;
  const filters = normalizeFilters(value.drilldown.filters);
  if (!filters) return null;
  return {
    activeDashboardId: value.activeDashboardId,
    activeTabIdsByPanelId: { ...value.activeTabIdsByPanelId } as Record<string, string>,
    drilldown: {
      employeeIds: [...value.drilldown.employeeIds],
      filters,
      query: value.drilldown.query,
      sourceWidgetId: value.drilldown.sourceWidgetId,
    },
    filterValuesByWidgetId: filterValues as Record<string, AnalyticsFilterValue>,
  };
};

export const createEmptyAnalyticsUiState = (
  createFilters: () => OrgToolsEmployeeFilters,
): OrgToolsAnalyticsUiState => ({
  activeDashboardId: null,
  activeTabIdsByPanelId: {},
  drilldown: { employeeIds: [], filters: createFilters(), query: "", sourceWidgetId: null },
  filterValuesByWidgetId: {},
});

const collectWidgetFields = (widget: AnalyticsWidget) => [
  ...widget.query.dimensions.map((dimension) => dimension.field),
  ...widget.query.filters.map((filter) => filter.field),
  ...widget.query.measures.flatMap((measure) => (measure.field ? [measure.field] : [])),
  ...(widget.type === "filter" ? [widget.field] : []),
  ...(widget.type === "pivot" ? [...widget.rowFields, ...widget.columnFields] : []),
];

export const analyticsReferencesCustomField = (
  dashboards: readonly AnalyticsDashboard[],
  fieldId: EmployeeFieldId,
) =>
  dashboards.some((dashboard) =>
    dashboard.panels.some((panel) =>
      panel.tabs.some((tab) =>
        tab.widgets.some(
          (widget) =>
            (widget.dataset.kind === "composite" && widget.dataset.fieldId === fieldId) ||
            collectWidgetFields(widget).some(
              (field) => field === `custom:${fieldId}` || field.startsWith(`composite:${fieldId}:`),
            ),
        ),
      ),
    ),
  );

export const analyticsReferencesView = (
  dashboards: readonly AnalyticsDashboard[],
  viewId: ViewId,
) =>
  dashboards.some((dashboard) =>
    dashboard.panels.some((panel) =>
      panel.tabs.some((tab) => tab.widgets.some((widget) => widget.viewId === viewId)),
    ),
  );

export const reconcileAnalyticsDefinitions = (
  dashboards: readonly AnalyticsDashboard[],
): AnalyticsDashboard[] =>
  structuredClone(dashboards).map((dashboard) => {
    const validTargetIds = new Set(
      dashboard.panels.flatMap((panel) =>
        panel.tabs.flatMap((tab) =>
          tab.widgets.flatMap((widget) => (widget.type === "filter" ? [] : [widget.id])),
        ),
      ),
    );
    return {
      ...dashboard,
      panels: dashboard.panels.map((panel) => ({
        ...panel,
        tabs: panel.tabs.map((tab) => ({
          ...tab,
          widgets: tab.widgets.map((widget) =>
            widget.type === "filter" && widget.targetWidgetIds !== null
              ? {
                  ...widget,
                  targetWidgetIds: widget.targetWidgetIds.filter((id) => validTargetIds.has(id)),
                }
              : widget,
          ),
        })),
      })),
    };
  });

export const reconcileAnalyticsUi = (
  dashboards: readonly AnalyticsDashboard[],
  current: OrgToolsAnalyticsUiState,
): OrgToolsAnalyticsUiState => {
  const activeDashboardId =
    current.activeDashboardId &&
    dashboards.some((dashboard) => dashboard.id === current.activeDashboardId)
      ? current.activeDashboardId
      : (dashboards[0]?.id ?? null);
  const panels = dashboards.flatMap((dashboard) => dashboard.panels);
  const activeTabIdsByPanelId = Object.fromEntries(
    panels
      .map((panel) => {
        const currentTabId = current.activeTabIdsByPanelId[panel.id];
        return [
          panel.id,
          currentTabId && panel.tabs.some((tab) => tab.id === currentTabId)
            ? currentTabId
            : (panel.tabs[0]?.id ?? ""),
        ];
      })
      .filter((entry) => entry[1] !== ""),
  );
  const widgets = dashboards.flatMap((dashboard) =>
    dashboard.panels.flatMap((panel) => panel.tabs.flatMap((tab) => tab.widgets)),
  );
  const widgetById = new Map(widgets.map((widget) => [widget.id, widget]));
  const filterValuesByWidgetId = Object.fromEntries(
    Object.entries(current.filterValuesByWidgetId).filter(
      ([widgetId]) => widgetById.get(widgetId)?.type === "filter",
    ),
  );
  const sourceWidgetId = current.drilldown.sourceWidgetId;
  return {
    activeDashboardId,
    activeTabIdsByPanelId,
    drilldown:
      sourceWidgetId === null || widgetById.has(sourceWidgetId)
        ? structuredClone(current.drilldown)
        : { ...structuredClone(current.drilldown), employeeIds: [], sourceWidgetId: null },
    filterValuesByWidgetId,
  };
};

export const validateAnalyticsGraph = (
  dashboards: readonly AnalyticsDashboard[],
  ui: OrgToolsAnalyticsUiState,
  views: readonly { id: ViewId }[],
  fieldDefinitions: readonly CustomEmployeeFieldDefinition[],
): void => {
  const ids = new Set<string>();
  const widgetById = new Map<string, AnalyticsWidget>();
  const tabById = new Map<string, AnalyticsPanelTab>();
  const panelById = new Map<string, AnalyticsPanel>();
  const dashboardIds = new Set<string>();
  const viewIds = new Set(views.map((view) => view.id));
  const fieldById = new Map(fieldDefinitions.map((field) => [field.id, field]));
  const assertUnique = (id: string) => {
    if (ids.has(id)) throw new Error("Analytics IDs must be unique.");
    ids.add(id);
  };
  const validateField = (field: string) => {
    if (ANALYTICS_BUILT_IN_FIELD_SET.has(field)) return;
    if (field.startsWith("custom:")) {
      if (!fieldById.has(field.slice(7)))
        throw new Error("Analytics references a missing custom field.");
      return;
    }
    if (field.startsWith("composite:")) {
      const [, fieldId, subfieldId, extra] = field.split(":");
      const definition = fieldId ? fieldById.get(fieldId) : null;
      if (
        extra !== undefined ||
        !subfieldId ||
        definition?.kind !== "composite" ||
        !definition.fields.some((item) => item.id === subfieldId)
      )
        throw new Error("Analytics references a missing Composite subfield.");
      return;
    }
    throw new Error("Analytics field reference is invalid.");
  };
  for (const dashboard of dashboards) {
    assertUnique(dashboard.id);
    dashboardIds.add(dashboard.id);
    for (const panel of dashboard.panels) {
      assertUnique(panel.id);
      panelById.set(panel.id, panel);
      for (const tab of panel.tabs) {
        assertUnique(tab.id);
        tabById.set(tab.id, tab);
        for (const widget of tab.widgets) {
          assertUnique(widget.id);
          for (const measure of widget.query.measures) assertUnique(measure.id);
          widgetById.set(widget.id, widget);
          if (!viewIds.has(widget.viewId)) throw new Error("Analytics references a missing View.");
          if (
            widget.dataset.kind === "composite" &&
            fieldById.get(widget.dataset.fieldId)?.kind !== "composite"
          )
            throw new Error("Analytics references a missing Composite field.");
          for (const field of collectWidgetFields(widget)) validateField(field);
        }
      }
    }
    const localWidgets = new Map(
      dashboard.panels.flatMap((panel) =>
        panel.tabs.flatMap((tab) => tab.widgets.map((widget) => [widget.id, widget] as const)),
      ),
    );
    for (const widget of localWidgets.values()) {
      if (widget.type !== "filter" || widget.targetWidgetIds === null) continue;
      if (new Set(widget.targetWidgetIds).size !== widget.targetWidgetIds.length)
        throw new Error("Analytics filter targets must be unique.");
      for (const targetId of widget.targetWidgetIds) {
        const target = localWidgets.get(targetId);
        if (!target || target.type === "filter")
          throw new Error("Analytics filter target is invalid.");
        if (UNIT_CONTEXT_FIELDS.has(widget.field) && target.viewId !== widget.viewId)
          throw new Error("Unit-context analytics filters require the same View.");
      }
    }
  }
  if (ui.activeDashboardId !== null && !dashboardIds.has(ui.activeDashboardId))
    throw new Error("Active analytics dashboard does not exist.");
  for (const [panelId, tabId] of Object.entries(ui.activeTabIdsByPanelId)) {
    const panel = panelById.get(panelId);
    if (!panel?.tabs.some((tab) => tab.id === tabId))
      throw new Error("Active analytics tab does not exist in its panel.");
  }
  for (const widgetId of Object.keys(ui.filterValuesByWidgetId)) {
    if (widgetById.get(widgetId)?.type !== "filter")
      throw new Error("Analytics filter UI references a missing filter widget.");
  }
  if (ui.drilldown.sourceWidgetId !== null && !widgetById.has(ui.drilldown.sourceWidgetId))
    throw new Error("Analytics drill-down references a missing widget.");
};
