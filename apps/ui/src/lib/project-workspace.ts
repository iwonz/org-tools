import type {
  OrgEditorCanvasViewport,
  OrgEditorSelectedItem,
  OrgToolsState,
  UiActiveTab,
  UiTheme,
  UnitId,
} from "@org-tools/types";

import { isUuid } from "@/lib/employee-data";
import { parseOrgToolsState } from "@/lib/org-file";

export const PROJECT_NAME_MAX_LENGTH = 100;

export type ProjectSummary = {
  createdAt: string;
  id: string;
  name: string;
  stateRevision: number;
  updatedAt: string;
};

export type ProjectViewUiState = {
  selectedItems: OrgEditorSelectedItem[];
  viewId: string;
  viewport: OrgEditorCanvasViewport;
};

export type ProjectUiState = {
  activeViewId: string;
  ui: {
    activeTab: UiActiveTab;
    expandedUnitIds: UnitId[];
    selectedUnitId: UnitId | null;
    theme: UiTheme;
  };
  views: ProjectViewUiState[];
};

export type ProjectDocument = ProjectSummary & {
  state: OrgToolsState;
  ui: ProjectUiState;
};

export type ProjectListResponse = {
  currentProjectId: string | null;
  projects: ProjectSummary[];
};

export type ProjectApiErrorCode =
  | "corrupt_stored_state"
  | "database_unavailable"
  | "duplicate_name"
  | "invalid_input"
  | "invalid_state"
  | "not_found"
  | "revision_conflict";

export type ProjectApiError = {
  error: {
    code: ProjectApiErrorCode;
    currentRevision?: number;
    message: string;
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const hasExactKeys = (value: Record<string, unknown>, keys: readonly string[]) => {
  const actualKeys = Object.keys(value).sort();
  const expectedKeys = [...keys].sort();
  return (
    actualKeys.length === expectedKeys.length &&
    actualKeys.every((key, index) => key === expectedKeys[index])
  );
};

const themes = new Set<UiTheme>(["dark", "light", "system"]);
const activeTabs = new Set<UiActiveTab>([
  "analytics",
  "calendar",
  "employees",
  "export",
  "orgEditor",
  "units",
]);

const parseViewport = (value: unknown): OrgEditorCanvasViewport => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ["scale", "x", "y"]) ||
    typeof value.x !== "number" ||
    !Number.isFinite(value.x) ||
    typeof value.y !== "number" ||
    !Number.isFinite(value.y) ||
    typeof value.scale !== "number" ||
    !Number.isFinite(value.scale) ||
    value.scale <= 0
  ) {
    throw new Error("Project UI viewport is invalid.");
  }
  return { scale: value.scale, x: value.x, y: value.y };
};

const parseSelectedItem = (value: unknown): OrgEditorSelectedItem => {
  if (!isRecord(value) || !isUuid(value.unitId)) {
    throw new Error("Project UI selection is invalid.");
  }
  if (value.type === "unit" && hasExactKeys(value, ["type", "unitId"])) {
    return { type: "unit", unitId: value.unitId };
  }
  if (
    value.type === "employee" &&
    hasExactKeys(value, ["employeeId", "type", "unitId"]) &&
    isUuid(value.employeeId)
  ) {
    return { employeeId: value.employeeId, type: "employee", unitId: value.unitId };
  }
  throw new Error("Project UI selection is invalid.");
};

export const parseProjectUiState = (input: unknown): ProjectUiState => {
  if (
    !isRecord(input) ||
    !hasExactKeys(input, ["activeViewId", "ui", "views"]) ||
    !isUuid(input.activeViewId) ||
    !isRecord(input.ui) ||
    !hasExactKeys(input.ui, ["activeTab", "expandedUnitIds", "selectedUnitId", "theme"]) ||
    typeof input.ui.activeTab !== "string" ||
    !activeTabs.has(input.ui.activeTab as UiActiveTab) ||
    typeof input.ui.theme !== "string" ||
    !themes.has(input.ui.theme as UiTheme) ||
    !(input.ui.selectedUnitId === null || isUuid(input.ui.selectedUnitId)) ||
    !Array.isArray(input.ui.expandedUnitIds) ||
    !input.ui.expandedUnitIds.every(isUuid) ||
    !Array.isArray(input.views)
  ) {
    throw new Error("Project UI state is invalid.");
  }

  return {
    activeViewId: input.activeViewId,
    ui: {
      activeTab: input.ui.activeTab as UiActiveTab,
      expandedUnitIds: [...input.ui.expandedUnitIds],
      selectedUnitId: input.ui.selectedUnitId,
      theme: input.ui.theme as UiTheme,
    },
    views: input.views.map((view) => {
      if (
        !isRecord(view) ||
        !hasExactKeys(view, ["selectedItems", "viewId", "viewport"]) ||
        !isUuid(view.viewId) ||
        !Array.isArray(view.selectedItems)
      ) {
        throw new Error("Project View UI state is invalid.");
      }
      return {
        selectedItems: view.selectedItems.map(parseSelectedItem),
        viewId: view.viewId,
        viewport: parseViewport(view.viewport),
      };
    }),
  };
};

export const createProjectUiState = (state: OrgToolsState): ProjectUiState => ({
  activeViewId: state.activeViewId,
  ui: {
    activeTab: state.ui.activeTab,
    expandedUnitIds: [...state.ui.expandedUnitIds],
    selectedUnitId: state.ui.selectedUnitId,
    theme: state.ui.theme,
  },
  views: state.views.map((view) => ({
    selectedItems: view.state.selectedItems.map((item) => ({ ...item })),
    viewId: view.id,
    viewport: { ...view.state.viewport },
  })),
});

export const sanitizeProjectUiState = (
  input: ProjectUiState,
  state: OrgToolsState,
): ProjectUiState => {
  const viewById = new Map(state.views.map((view) => [view.id, view]));
  const mainView = state.views.find((view) => view.kind === "main") ?? state.views[0];
  if (!mainView) throw new Error("Project state does not contain a View.");
  const mainUnitIds = new Set(mainView.state.units.map((unit) => unit.id));
  const workspaceEmployeeIds = new Set(state.employees.map((employee) => employee.id));
  const inputViewUi = new Map(input.views.map((view) => [view.viewId, view]));

  return {
    activeViewId: viewById.has(input.activeViewId) ? input.activeViewId : state.activeViewId,
    ui: {
      activeTab: input.ui.activeTab,
      expandedUnitIds: input.ui.expandedUnitIds.filter((unitId) => mainUnitIds.has(unitId)),
      selectedUnitId:
        input.ui.selectedUnitId !== null && mainUnitIds.has(input.ui.selectedUnitId)
          ? input.ui.selectedUnitId
          : null,
      theme: input.ui.theme,
    },
    views: state.views.map((view) => {
      const stored = inputViewUi.get(view.id);
      const unitIds = new Set(view.state.units.map((unit) => unit.id));
      const localEmployeeIds = new Set(view.state.employees.map((employee) => employee.id));
      return {
        selectedItems: (stored?.selectedItems ?? view.state.selectedItems).filter((item) => {
          if (!unitIds.has(item.unitId)) return false;
          return (
            item.type === "unit" ||
            workspaceEmployeeIds.has(item.employeeId) ||
            localEmployeeIds.has(item.employeeId)
          );
        }),
        viewId: view.id,
        viewport: { ...(stored?.viewport ?? view.state.viewport) },
      };
    }),
  };
};

export const applyProjectUiState = (
  stateInput: OrgToolsState,
  uiInput: ProjectUiState,
): OrgToolsState => {
  const state = parseOrgToolsState(structuredClone(stateInput));
  const ui = sanitizeProjectUiState(parseProjectUiState(uiInput), state);
  const viewUiById = new Map(ui.views.map((view) => [view.viewId, view]));

  return parseOrgToolsState({
    ...state,
    activeViewId: ui.activeViewId,
    ui: { ...ui.ui },
    views: state.views.map((view) => {
      const viewUi = viewUiById.get(view.id);
      return viewUi
        ? {
            ...view,
            state: {
              ...view.state,
              selectedItems: viewUi.selectedItems.map((item) => ({ ...item })),
              viewport: { ...viewUi.viewport },
            },
          }
        : view;
    }),
  });
};
