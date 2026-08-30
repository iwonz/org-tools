import type { EmployeeGender, OrgEditorEmployee, OrgEditorEmployeeOverride } from "./employee.js";
import type { EmployeeId, UnitId } from "./ids.js";
import type {
  OrgEditorCanvasViewport,
  OrgEditorLayoutMode,
  OrgEditorSelectedItem,
  OrgEditorUnit,
  OrgViewKind,
} from "./org-editor.js";
import type { OrganizationEmployee } from "./organization.js";

export type AppLocale = "en" | "ru";
export type UiTheme = "light" | "dark" | "system";
export type UiActiveTab = "units" | "employees" | "orgEditor" | "export" | "analytics" | "calendar";

export type OrgToolsEmployeeFilters = {
  birthday: { day: number; month: number } | null;
  includeWithoutTags: boolean;
  includeWithoutUnits: boolean;
  selectedGenders: EmployeeGender[];
  selectedPositions: string[];
  selectedTags: string[];
  selectedUnitIds: UnitId[];
};

export type OrgToolsViewDocument = {
  createdAt: string;
  document: {
    employeeOverrides: OrgEditorEmployeeOverride[];
    employees: OrgEditorEmployee[];
    layoutMode: OrgEditorLayoutMode;
    units: OrgEditorUnit[];
  };
  id: string;
  kind: OrgViewKind;
  name: string;
  updatedAt: string;
};

export type OrgToolsViewUiState = {
  selectedItems: OrgEditorSelectedItem[];
  viewId: string;
  viewport: OrgEditorCanvasViewport;
};

export type OrgToolsDownloadSelection =
  | { id: string; type: "unit"; unitId: UnitId }
  | { employeeId: EmployeeId; id: string; type: "employee" };

export type OrgToolsDownloadState = {
  employeeFieldOrder: string[];
  employeeFilters: OrgToolsEmployeeFilters;
  employeeQuery: string;
  excludedEmployeeIds: EmployeeId[];
  fieldNames: Record<string, string>;
  flatUnitFieldOrder: string[];
  jsonUnitFieldOrder: string[];
  rowMode: "allUnits" | "firstUnit";
  sourceViewId: string;
  selectedEmployeeFieldKeys: string[];
  selectedFilters: OrgToolsEmployeeFilters;
  selectedFlatUnitFieldKeys: string[];
  selectedJsonUnitFieldKeys: string[];
  selectedQuery: string;
  selections: OrgToolsDownloadSelection[];
  tabMode: "csv" | "json" | "template";
  templateFormat: string;
  unitFullPathSeparator: string;
  unitQuery: string;
};

export type OrgToolsUiState = {
  activeTab: UiActiveTab;
  activeViewId: string;
  analytics: {
    filters: OrgToolsEmployeeFilters;
    query: string;
  };
  calendar: {
    cloudExpanded: boolean;
    monthIndex: number;
    year: number;
  };
  download: OrgToolsDownloadState;
  editor: {
    searchOpen: boolean;
    searchQuery: string;
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
  views: OrgToolsViewUiState[];
};

export type OrgToolsState = {
  organization: {
    employees: OrganizationEmployee[];
    views: OrgToolsViewDocument[];
  };
  ui: OrgToolsUiState;
};
