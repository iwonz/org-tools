import type {
  CustomEmployeeFieldDefinition,
  EmployeeGender,
  EmployeeTagDefinition,
} from "./employee.js";
import type { EmployeeFieldId, EmployeeId, TagId, UnitId, ViewId } from "./ids.js";
import type {
  OrgEditorCanvasViewport,
  OrgEditorLayoutMode,
  OrgEditorSelectedItem,
  OrgEditorUnit,
} from "./org-editor.js";
import type { EmployeeCustomFieldFilter, OrganizationEmployee } from "./organization.js";

export type AppLocale = "ar" | "en" | "es" | "fr" | "ru" | "zh";
export type UiTheme = "light" | "dark" | "system";
export type UiActiveTab = "units" | "employees" | "orgEditor" | "export" | "analytics" | "calendar";

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
  rowMode: "allUnits" | "firstUnit";
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
  analytics: {
    filters: OrgToolsEmployeeFilters;
    query: string;
  };
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
    employeeFieldDefinitions: CustomEmployeeFieldDefinition[];
    employees: OrganizationEmployee[];
    tags: EmployeeTagDefinition[];
    views: OrgToolsViewDocument[];
  };
  ui: OrgToolsUiState;
};
