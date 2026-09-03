import type { EmployeeId, UnitId } from "./ids.js";
import type { EmployeeLiveFilterRule } from "./organization.js";

export type OrgEditorUnitId = UnitId;

export type OrgEditorLayoutMode = "leftRight" | "topDown";

export type OrgEditorCanvasViewport = {
  x: number;
  y: number;
  scale: number;
};

export type OrgEditorSelectedItem =
  | {
      type: "unit";
      unitId: OrgEditorUnitId;
    }
  | {
      type: "employee";
      unitId: OrgEditorUnitId;
      employeeId: EmployeeId;
    };

export type OrgEditorEmployeePosition = {
  employeeId: EmployeeId;
  position: string | null;
};

/** Unit persisted inside one organization View document. */
export type OrgEditorUnit = {
  id: OrgEditorUnitId;
  parentId: OrgEditorUnitId | null;
  name: string;
  order: number;
  x: number;
  y: number;
  bossEmployeeId: EmployeeId | null;
  collapsed: boolean;
  employeeIds: EmployeeId[];
  /**
   * Manual Units persist positions for assigned Employees. Live Units keep
   * only sparse explicit overrides; membership is still derived.
   */
  employeePositions: OrgEditorEmployeePosition[];
  liveFilter: EmployeeLiveFilterRule | null;
  createdAt: string;
  updatedAt: string;
};

export type StructureDocument = {
  units: OrgEditorUnit[];
  selectedItems: OrgEditorSelectedItem[];
  viewport: OrgEditorCanvasViewport;
  layoutMode: OrgEditorLayoutMode;
};

export type OrgEditorState = StructureDocument;
