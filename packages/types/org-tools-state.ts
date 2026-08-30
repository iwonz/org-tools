import type { UnitId } from "./ids.js";
import type { OrgView } from "./org-editor.js";
import type { WorkspaceEmployee } from "./workspace.js";

export type UiTheme = "light" | "dark" | "system";
export type UiActiveTab = "units" | "employees" | "orgEditor" | "export" | "analytics" | "calendar";

export type OrgToolsState = {
  kind: "org-tools-state";
  content: "workspace";
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
