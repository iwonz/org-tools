import type { UnitId } from "./ids.js";
import type { OrgView } from "./org-editor.js";
import type { WorkspaceEmployee } from "./workspace.js";

export type UiTheme = "light" | "dark" | "system";
export type UiActiveTab = "units" | "employees" | "orgEditor" | "export" | "analytics" | "calendar";

export type OrgToolsStateContent = "teams" | "employees" | "teamsEmployees" | "workspace";

export type OrgToolsState = {
  kind: "org-tools-state";
  content: OrgToolsStateContent;
  activeViewId: string;
  employees: WorkspaceEmployee[];
  views: OrgView[];
  ui: {
    theme: UiTheme;
    activeTab: UiActiveTab;
    selectedUnitId: UnitId | null;
    expandedUnitIds: UnitId[];
  };
};
