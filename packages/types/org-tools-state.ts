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
export type OrgToolsDownloadUnitFieldKey =
  | "unitId"
  | "unitName"
  | "unitFullPath"
  | "position"
  | "isBoss";
export type OrgToolsDownloadTagFieldKey = "date" | "label";

export type OrgToolsDownloadState = {
  employeeFieldOrder: OrgToolsDownloadEmployeeFieldKey[];
  employeeFilters: OrgToolsEmployeeFilters;
  employeeQuery: string;
  excludedEmployeeIds: EmployeeId[];
  excludedJsonTagKeys: string[];
  excludedJsonUnitIds: UnitId[];
  jsonFieldNames: {
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
  jsonTagFieldOrder: OrgToolsDownloadTagFieldKey[];
  jsonUnitFieldOrder: OrgToolsDownloadUnitFieldKey[];
  rowMode: "allUnits" | "firstUnit";
  selectedEmployeeFieldKeys: OrgToolsDownloadEmployeeFieldKey[];
  selectedFilters: OrgToolsEmployeeFilters;
  selectedJsonTagFieldKeys: OrgToolsDownloadTagFieldKey[];
  selectedJsonUnitFieldKeys: OrgToolsDownloadUnitFieldKey[];
  selectedQuery: string;
  selections: OrgToolsDownloadSelection[];
  tabMode: "json" | "template";
  templateFormat: string;
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
