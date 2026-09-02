import type { EmployeeGender } from "./employee.js";
import type { EmployeeId, UnitId } from "./ids.js";
import type {
  OrgEditorCanvasViewport,
  OrgEditorLayoutMode,
  OrgEditorSelectedItem,
  OrgEditorUnit,
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
    selectedItems: OrgEditorSelectedItem[];
    viewport: OrgEditorCanvasViewport;
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
    employees: OrganizationEmployee[];
    structure: {
      layoutMode: OrgEditorLayoutMode;
      units: OrgEditorUnit[];
    };
  };
  ui: OrgToolsUiState;
};
