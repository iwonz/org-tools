import type {
  CustomEmployeeFieldDefinition,
  EmployeeGender,
  EmployeeTagDefinition,
} from "./employee.js";
import type { EmployeeFieldId, EmployeeId, TagId, UnitId, ViewId } from "./ids.js";
import type {
  OrgEditorCanvasElement,
  OrgEditorCanvasViewport,
  OrgEditorLayoutMode,
  OrgEditorSelectedItem,
  OrgEditorUnit,
  OrgEditorViewSettings,
} from "./org-editor.js";
import type { EmployeeCustomFieldFilter, OrganizationEmployee } from "./organization.js";

export type AppLocale = "ar" | "en" | "es" | "fr" | "ru" | "zh";
export type UiTheme = "light" | "dark" | "system";
export type UiActiveTab = "units" | "employees" | "orgEditor" | "export" | "analytics" | "calendar";

export type EmployeeDisplayFormats = {
  editor: string;
  editorExport: string;
  employees: string;
  units: string;
};

export type EmployeeDisplayLineGaps = {
  editor: number;
  editorExport: number;
  employees: number;
  units: number;
};

export type AnalyticsDataset =
  | { kind: "assignments" }
  | { fieldId: EmployeeFieldId; kind: "composite" }
  | { kind: "employees" }
  | { kind: "tags" };

export type AnalyticsDateGrouping = "day" | "month" | "quarter" | "week" | "year";

export type AnalyticsDimension = {
  dateGrouping: AnalyticsDateGrouping | null;
  field: string;
};

export type AnalyticsMeasureOperation =
  | "average"
  | "countDistinct"
  | "countDistinctEmployees"
  | "countRows"
  | "max"
  | "min"
  | "sum";

export type AnalyticsMeasure = {
  field: string | null;
  id: string;
  operation: AnalyticsMeasureOperation;
};

export type AnalyticsFilterOperator =
  | "contains"
  | "empty"
  | "equals"
  | "greaterThan"
  | "greaterThanOrEqual"
  | "in"
  | "lessThan"
  | "lessThanOrEqual"
  | "notEmpty"
  | "notEquals"
  | "range";

export type AnalyticsFilterScalar = boolean | number | string;

export type AnalyticsPredicate = {
  field: string;
  operator: AnalyticsFilterOperator;
  value: AnalyticsFilterScalar | AnalyticsFilterScalar[] | null;
  valueTo: AnalyticsFilterScalar | null;
};

export type AnalyticsQuery = {
  dimensions: AnalyticsDimension[];
  filters: AnalyticsPredicate[];
  measures: AnalyticsMeasure[];
  sort: { direction: "asc" | "desc"; key: string } | null;
  topN: number | null;
};

export type AnalyticsPalette = {
  name: "aurora" | "categorical" | "cool" | "warm";
  overrides: Record<string, string>;
};

export type AnalyticsWidgetPresentation = {
  numberFormat: "compact" | "decimal" | "percent";
  palette: AnalyticsPalette;
  showDescription: boolean;
  showLabels: boolean;
  showLegend: boolean;
};

type AnalyticsWidgetBase = {
  dataset: AnalyticsDataset;
  description: string;
  height: "L" | "M" | "S";
  id: string;
  presentation: AnalyticsWidgetPresentation;
  query: AnalyticsQuery;
  title: string;
  viewId: ViewId;
  width: 1 | 2;
};

export type AnalyticsWidget =
  | (AnalyticsWidgetBase & { type: "kpi" })
  | (AnalyticsWidgetBase & { showTotals: boolean; type: "table" })
  | (AnalyticsWidgetBase & {
      columnFields: string[];
      rowFields: string[];
      showGrandTotal: boolean;
      showSubtotals: boolean;
      type: "pivot";
    })
  | (AnalyticsWidgetBase & {
      orientation: "horizontal" | "vertical";
      stacked: boolean;
      type: "bar";
    })
  | (AnalyticsWidgetBase & { type: "line"; variant: "area" | "line" })
  | (AnalyticsWidgetBase & { type: "pie"; variant: "donut" | "pie" })
  | (AnalyticsWidgetBase & { maximum: number; minimum: number; type: "gauge" })
  | (AnalyticsWidgetBase & {
      control: "dateRange" | "multiSelect" | "search" | "select";
      defaultValue: AnalyticsFilterValue;
      field: string;
      targetWidgetIds: string[] | null;
      type: "filter";
    });

export type AnalyticsFilterValue = {
  from: AnalyticsFilterScalar | null;
  includeEmpty: boolean;
  search: string;
  to: AnalyticsFilterScalar | null;
  values: AnalyticsFilterScalar[];
};

export type AnalyticsPanelTab = {
  id: string;
  name: string;
  widgets: AnalyticsWidget[];
};

export type AnalyticsPanel = {
  id: string;
  name: string;
  tabs: AnalyticsPanelTab[];
  width: 1 | 2 | 3;
};

export type AnalyticsDashboard = {
  createdAt: string;
  id: string;
  name: string;
  panels: AnalyticsPanel[];
  updatedAt: string;
};

export type OrgToolsAnalyticsUiState = {
  activeDashboardId: string | null;
  activeTabIdsByPanelId: Record<string, string>;
  drilldown: {
    employeeIds: EmployeeId[];
    filters: OrgToolsEmployeeFilters;
    query: string;
    sourceWidgetId: string | null;
  };
  filterValuesByWidgetId: Record<string, AnalyticsFilterValue>;
};

export type OrgToolsEmployeeFilters = {
  birthday: { day: number; month: number; year: number } | null;
  customFields: EmployeeCustomFieldFilter[];
  includeWithoutTags: boolean;
  includeWithoutUnits: boolean;
  selectedGenders: EmployeeGender[];
  selectedPositions: string[];
  selectedTags: TagId[];
  selectedUnitIds: UnitId[];
};

export type OrgToolsDownloadSelection =
  | { id: string; type: "unit"; unitId: UnitId }
  | { employeeId: EmployeeId; id: string; type: "employee" };

export type OrgToolsDownloadEmployeeFieldKey =
  | "id"
  | "firstName"
  | "lastName"
  | "fullName"
  | "gender"
  | "username"
  | "profileUrl"
  | "email"
  | "phone"
  | "avatarBase64Url"
  | "birthday";
export type OrgToolsDownloadJsonTopLevelFieldKey =
  | OrgToolsDownloadEmployeeFieldKey
  | "tags"
  | "units"
  | `custom:${string}`;
export type OrgToolsDownloadUnitFieldKey =
  | "unitId"
  | "unitName"
  | "unitFullPath"
  | "position"
  | "isBoss";
export type OrgToolsDownloadTagFieldKey = "date" | "label";

export type OrgToolsDownloadState = {
  employeeFilters: OrgToolsEmployeeFilters;
  employeeQuery: string;
  excludedEmployeeIds: EmployeeId[];
  excludedJsonTagKeys: string[];
  excludedJsonUnitIds: UnitId[];
  jsonFieldNames: {
    custom: Record<EmployeeFieldId, string>;
    employee: Record<OrgToolsDownloadEmployeeFieldKey, string>;
    tags: {
      collection: string;
      fields: Record<OrgToolsDownloadTagFieldKey, string>;
    };
    units: {
      collection: string;
      fields: Record<OrgToolsDownloadUnitFieldKey, string>;
    };
  };
  jsonTopLevelFieldOrder: OrgToolsDownloadJsonTopLevelFieldKey[];
  jsonTagFieldOrder: OrgToolsDownloadTagFieldKey[];
  jsonUnitFieldOrder: OrgToolsDownloadUnitFieldKey[];
  selectedEmployeeFieldKeys: OrgToolsDownloadEmployeeFieldKey[];
  selectedCustomEmployeeFieldIds: EmployeeFieldId[];
  selectedFilters: OrgToolsEmployeeFilters;
  selectedJsonTagFieldKeys: OrgToolsDownloadTagFieldKey[];
  selectedJsonUnitFieldKeys: OrgToolsDownloadUnitFieldKey[];
  selectedQuery: string;
  selections: OrgToolsDownloadSelection[];
  tabMode: "json" | "template";
  templateFormat: string;
  unitQuery: string;
  sourceViewId: ViewId;
};

type OrgToolsViewDocumentBase = {
  createdAt: string;
  id: ViewId;
  structure: {
    canvasElements: OrgEditorCanvasElement[];
    settings: OrgEditorViewSettings;
    layoutMode: OrgEditorLayoutMode;
    units: OrgEditorUnit[];
  };
  updatedAt: string;
};

export type OrgToolsViewDocument = OrgToolsViewDocumentBase &
  ({ kind: "custom"; name: string } | { kind: "system"; name: null });

export type OrgToolsViewUiState = {
  distributionModeUnitIds: UnitId[];
  selectedItems: OrgEditorSelectedItem[];
  viewId: ViewId;
  viewport: OrgEditorCanvasViewport;
};

export type OrgToolsUiState = {
  activeTab: UiActiveTab;
  analytics: OrgToolsAnalyticsUiState;
  calendar: {
    monthIndex: number;
    year: number;
  };
  download: OrgToolsDownloadState;
  editor: {
    activeViewId: ViewId;
    searchOpen: boolean;
    searchQuery: string;
    views: OrgToolsViewUiState[];
  };
  employees: {
    filters: OrgToolsEmployeeFilters;
    query: string;
  };
  expandedUnitIds: UnitId[];
  locale: AppLocale;
  selectedUnitId: UnitId | null;
  sidebarCollapsed: boolean;
  theme: UiTheme;
  units: {
    employeeFilters: OrgToolsEmployeeFilters;
    employeeQuery: string;
    unitQuery: string;
  };
};

export type OrgToolsState = {
  organization: {
    analyticsDashboards: AnalyticsDashboard[];
    employeeDisplayFormats: EmployeeDisplayFormats;
    employeeDisplayLineGaps: EmployeeDisplayLineGaps;
    employeeFieldDefinitions: CustomEmployeeFieldDefinition[];
    employees: OrganizationEmployee[];
    tags: EmployeeTagDefinition[];
    views: OrgToolsViewDocument[];
  };
  ui: OrgToolsUiState;
};
