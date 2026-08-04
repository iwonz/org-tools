import type { OrgEditorUnit, OrgToolsState, OrgToolsStateContent } from "@org-tools/types";

import { createDefaultOrgEditorState } from "@/lib/org-editor";
import { parseOrgToolsState } from "@/lib/org-file";

export type StructuredSaveKind = OrgToolsStateContent;

export const STRUCTURED_SAVE_FILE_NAMES = {
  employees: "org-tools-employees.json",
  teams: "org-tools-teams.json",
  teamsEmployees: "org-tools-teams-employees.json",
  workspace: "org-tools-state.json",
} as const satisfies Record<StructuredSaveKind, string>;

const cloneUnitForTeams = (unit: OrgEditorUnit): OrgEditorUnit => ({
  ...unit,
  bossEmployeeId: null,
  employeeIds: [],
  employeePositions: [],
  liveFilter: unit.liveFilter
    ? {
        ...unit.liveFilter,
        birthday: unit.liveFilter.birthday ? { ...unit.liveFilter.birthday } : null,
        selectedPositions: [...unit.liveFilter.selectedPositions],
        selectedTags: [...unit.liveFilter.selectedTags],
        selectedUnitIds: [...unit.liveFilter.selectedUnitIds],
      }
    : null,
});

const canonicalUi = {
  activeTab: "orgEditor" as const,
  expandedUnitIds: [],
  selectedUnitId: null,
  theme: "system" as const,
};

export const createStructuredSave = (
  source: OrgToolsState,
  content: StructuredSaveKind,
): OrgToolsState => {
  const state = parseOrgToolsState(structuredClone(source));
  if (content === "workspace") {
    return parseOrgToolsState({ ...state, content: "workspace" });
  }

  const main = state.views.find((view) => view.kind === "main");
  if (!main) throw new Error("The Main View is unavailable.");
  const emptyEditor = createDefaultOrgEditorState();
  const partialMain = {
    ...main,
    state:
      content === "employees"
        ? emptyEditor
        : {
            ...main.state,
            employeeOverrides: [],
            employees: [],
            selectedItems: [],
            units:
              content === "teams"
                ? main.state.units.map(cloneUnitForTeams)
                : main.state.units.map((unit) => ({
                    ...unit,
                    employeeIds: [...unit.employeeIds],
                    employeePositions: unit.employeePositions.map((position) => ({ ...position })),
                    liveFilter: unit.liveFilter
                      ? {
                          ...unit.liveFilter,
                          birthday: unit.liveFilter.birthday
                            ? { ...unit.liveFilter.birthday }
                            : null,
                          selectedPositions: [...unit.liveFilter.selectedPositions],
                          selectedTags: [...unit.liveFilter.selectedTags],
                          selectedUnitIds: [...unit.liveFilter.selectedUnitIds],
                        }
                      : null,
                  })),
          },
  };

  return parseOrgToolsState({
    activeViewId: partialMain.id,
    content,
    employees: content === "teams" ? [] : state.employees,
    kind: "org-tools-state",
    ui: canonicalUi,
    views: [partialMain],
  });
};
