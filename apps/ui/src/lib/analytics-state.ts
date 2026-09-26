import type {
  AnalyticsConfiguration,
  AnalyticsDataset,
  AnalyticsDimension,
  AnalyticsFilter,
  AnalyticsFilterScalar,
  AnalyticsFilterValue,
  AnalyticsMeasure,
  AnalyticsPredicate,
  AnalyticsQuery,
  AnalyticsTab,
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
  filters: 32,
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
const COLOR_PATTERN = /^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/iu;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const hasExactKeys = (value: Record<string, unknown>, keys: readonly string[]) => {
  const actualKeys = Object.keys(value);
  return actualKeys.length === keys.length && keys.every((key) => actualKeys.includes(key));
};

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
  "tabId",
  "title",
  "type",
  "viewId",
  "width",
] as const;

const normalizeWidget = (value: unknown): AnalyticsWidget | null => {
  if (!isRecord(value) || typeof value.type !== "string") return null;
  const extraKeysByType: Record<string, string[]> = {
    bar: ["orientation", "stacked"],
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
    !(value.tabId === null || isUuid(value.tabId)) ||
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
    tabId: value.tabId,
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
  return null;
};

const normalizeTab = (value: unknown): AnalyticsTab | null => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ["id", "name"]) ||
    !isUuid(value.id) ||
    !isBoundedText(value.name, 100, false)
  )
    return null;
  return { id: value.id, name: value.name };
};

const normalizeFilter = (value: unknown): AnalyticsFilter | null => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "control",
      "defaultValue",
      "field",
      "id",
      "name",
      "targetWidgetIds",
      "viewId",
    ]) ||
    !["dateRange", "multiSelect", "search", "select"].includes(value.control as string) ||
    !isBoundedText(value.field, 300, false) ||
    !isUuid(value.id) ||
    !isBoundedText(value.name, 100, false) ||
    !isUuid(value.viewId) ||
    !(
      value.targetWidgetIds === null ||
      (Array.isArray(value.targetWidgetIds) &&
        value.targetWidgetIds.length <= ANALYTICS_LIMITS.tabs * ANALYTICS_LIMITS.widgets &&
        value.targetWidgetIds.every(isUuid))
    )
  )
    return null;
  const defaultValue = normalizeAnalyticsFilterValue(value.defaultValue);
  if (!defaultValue) return null;
  return {
    control: value.control as AnalyticsFilter["control"],
    defaultValue,
    field: value.field,
    id: value.id,
    name: value.name,
    targetWidgetIds: value.targetWidgetIds === null ? null : [...value.targetWidgetIds],
    viewId: value.viewId,
  };
};

export const normalizeAnalyticsConfiguration = (value: unknown): AnalyticsConfiguration | null => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ["filters", "tabs", "widgets"]) ||
    !Array.isArray(value.filters) ||
    value.filters.length > ANALYTICS_LIMITS.filters ||
    !Array.isArray(value.tabs) ||
    value.tabs.length > ANALYTICS_LIMITS.tabs ||
    !Array.isArray(value.widgets) ||
    value.widgets.length > ANALYTICS_LIMITS.tabs * ANALYTICS_LIMITS.widgets
  )
    return null;
  const filters = value.filters.map(normalizeFilter);
  const tabs = value.tabs.map(normalizeTab);
  const widgets = value.widgets.map(normalizeWidget);
  if (
    filters.some((filter) => !filter) ||
    tabs.some((tab) => !tab) ||
    widgets.some((widget) => !widget)
  )
    return null;
  return {
    filters: filters as AnalyticsFilter[],
    tabs: tabs as AnalyticsTab[],
    widgets: widgets as AnalyticsWidget[],
  };
};

export const normalizeAnalyticsUiState = (
  value: unknown,
  normalizeFilters: (value: unknown) => OrgToolsEmployeeFilters | null,
): OrgToolsAnalyticsUiState | null => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ["activeTabId", "drilldown", "filterValuesByFilterId"]) ||
    !(value.activeTabId === null || isUuid(value.activeTabId)) ||
    !isRecord(value.filterValuesByFilterId) ||
    Object.keys(value.filterValuesByFilterId).length > ANALYTICS_LIMITS.filters ||
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
    Object.entries(value.filterValuesByFilterId).map(([filterId, filterValue]) => [
      filterId,
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
    activeTabId: value.activeTabId,
    drilldown: {
      employeeIds: [...value.drilldown.employeeIds],
      filters,
      query: value.drilldown.query,
      sourceWidgetId: value.drilldown.sourceWidgetId,
    },
    filterValuesByFilterId: filterValues as Record<string, AnalyticsFilterValue>,
  };
};

export const createEmptyAnalyticsUiState = (
  createFilters: () => OrgToolsEmployeeFilters,
): OrgToolsAnalyticsUiState => ({
  activeTabId: null,
  drilldown: { employeeIds: [], filters: createFilters(), query: "", sourceWidgetId: null },
  filterValuesByFilterId: {},
});

const collectWidgetFields = (widget: AnalyticsWidget) => [
  ...widget.query.dimensions.map((dimension) => dimension.field),
  ...widget.query.filters.map((filter) => filter.field),
  ...widget.query.measures.flatMap((measure) => (measure.field ? [measure.field] : [])),
  ...(widget.type === "pivot" ? [...widget.rowFields, ...widget.columnFields] : []),
];

const fieldReferencesCustomField = (field: string, fieldId: EmployeeFieldId) =>
  field === `custom:${fieldId}` || field.startsWith(`composite:${fieldId}:`);

export const isAnalyticsFilterCompatible = (
  filter: Pick<AnalyticsFilter, "field" | "viewId">,
  widget: AnalyticsWidget,
) => {
  if (filter.field.startsWith("assignment.")) {
    return filter.viewId === widget.viewId && widget.dataset.kind === "assignments";
  }
  if (filter.field.startsWith("tag.")) return widget.dataset.kind === "tags";
  if (filter.field.startsWith("composite:")) {
    return (
      widget.dataset.kind === "composite" && widget.dataset.fieldId === filter.field.split(":")[1]
    );
  }
  return true;
};

export const analyticsReferencesCustomField = (
  configuration: AnalyticsConfiguration,
  fieldId: EmployeeFieldId,
) =>
  configuration.filters.some((filter) => fieldReferencesCustomField(filter.field, fieldId)) ||
  configuration.widgets.some(
    (widget) =>
      (widget.dataset.kind === "composite" && widget.dataset.fieldId === fieldId) ||
      collectWidgetFields(widget).some((field) => fieldReferencesCustomField(field, fieldId)),
  );

export const analyticsReferencesView = (configuration: AnalyticsConfiguration, viewId: ViewId) =>
  configuration.filters.some((filter) => filter.viewId === viewId) ||
  configuration.widgets.some((widget) => widget.viewId === viewId);

export const reconcileAnalyticsDefinitions = (
  configuration: AnalyticsConfiguration,
): AnalyticsConfiguration => {
  const next = structuredClone(configuration);
  const validTargetIds = new Set(next.widgets.map((widget) => widget.id));
  next.filters = next.filters.map((filter) => ({
    ...filter,
    targetWidgetIds:
      filter.targetWidgetIds === null
        ? null
        : filter.targetWidgetIds.filter((id) => validTargetIds.has(id)),
  }));
  return next;
};

export const reconcileAnalyticsUi = (
  configuration: AnalyticsConfiguration,
  current: OrgToolsAnalyticsUiState,
): OrgToolsAnalyticsUiState => {
  const tabIds = new Set(configuration.tabs.map((tab) => tab.id));
  const filterIds = new Set(configuration.filters.map((filter) => filter.id));
  const widgetIds = new Set(configuration.widgets.map((widget) => widget.id));
  const activeTabId =
    current.activeTabId && tabIds.has(current.activeTabId)
      ? current.activeTabId
      : (configuration.tabs[0]?.id ?? null);
  const filterValuesByFilterId = Object.fromEntries(
    Object.entries(current.filterValuesByFilterId).filter(([filterId]) => filterIds.has(filterId)),
  );
  const sourceWidgetId = current.drilldown.sourceWidgetId;
  return {
    activeTabId,
    drilldown:
      sourceWidgetId === null || widgetIds.has(sourceWidgetId)
        ? structuredClone(current.drilldown)
        : { ...structuredClone(current.drilldown), employeeIds: [], sourceWidgetId: null },
    filterValuesByFilterId,
  };
};

export const validateAnalyticsGraph = (
  configuration: AnalyticsConfiguration,
  ui: OrgToolsAnalyticsUiState,
  views: readonly { id: ViewId }[],
  fieldDefinitions: readonly CustomEmployeeFieldDefinition[],
): void => {
  const ids = new Set<string>();
  const viewIds = new Set(views.map((view) => view.id));
  const fieldById = new Map(fieldDefinitions.map((field) => [field.id, field]));
  const tabIds = new Set(configuration.tabs.map((tab) => tab.id));
  const widgetById = new Map(configuration.widgets.map((widget) => [widget.id, widget]));
  const filterIds = new Set(configuration.filters.map((filter) => filter.id));
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

  for (const tab of configuration.tabs) assertUnique(tab.id);
  for (const filter of configuration.filters) assertUnique(filter.id);
  for (const widget of configuration.widgets) {
    assertUnique(widget.id);
    for (const measure of widget.query.measures) assertUnique(measure.id);
  }

  if (configuration.tabs.length === 0) {
    if (configuration.widgets.length > ANALYTICS_LIMITS.widgets)
      throw new Error("Analytics root widget limit exceeded.");
    if (configuration.widgets.some((widget) => widget.tabId !== null))
      throw new Error("Analytics root widgets cannot reference a tab.");
  } else {
    if (configuration.widgets.some((widget) => widget.tabId === null || !tabIds.has(widget.tabId)))
      throw new Error("Analytics widget references a missing tab.");
    for (const tabId of tabIds) {
      if (
        configuration.widgets.filter((widget) => widget.tabId === tabId).length >
        ANALYTICS_LIMITS.widgets
      )
        throw new Error("Analytics tab widget limit exceeded.");
    }
  }

  for (const widget of configuration.widgets) {
    if (!viewIds.has(widget.viewId)) throw new Error("Analytics references a missing View.");
    if (
      widget.dataset.kind === "composite" &&
      fieldById.get(widget.dataset.fieldId)?.kind !== "composite"
    )
      throw new Error("Analytics references a missing Composite field.");
    for (const field of collectWidgetFields(widget)) validateField(field);
  }

  for (const filter of configuration.filters) {
    if (!viewIds.has(filter.viewId)) throw new Error("Analytics filter references a missing View.");
    validateField(filter.field);
    if (filter.targetWidgetIds === null) continue;
    if (new Set(filter.targetWidgetIds).size !== filter.targetWidgetIds.length)
      throw new Error("Analytics filter targets must be unique.");
    for (const targetId of filter.targetWidgetIds) {
      const target = widgetById.get(targetId);
      if (!target) throw new Error("Analytics filter target is invalid.");
      if (!isAnalyticsFilterCompatible(filter, target))
        throw new Error("Analytics filter target is incompatible.");
    }
  }

  if (ui.activeTabId !== null && !tabIds.has(ui.activeTabId))
    throw new Error("Active analytics tab does not exist.");
  if (configuration.tabs.length === 0 && ui.activeTabId !== null)
    throw new Error("Tabless Analytics cannot have an active tab.");
  for (const filterId of Object.keys(ui.filterValuesByFilterId)) {
    if (!filterIds.has(filterId))
      throw new Error("Analytics filter UI references a missing filter.");
  }
  if (ui.drilldown.sourceWidgetId !== null && !widgetById.has(ui.drilldown.sourceWidgetId))
    throw new Error("Analytics drill-down references a missing widget.");
};
