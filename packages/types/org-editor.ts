import type { OrgEditorEmployee, OrgEditorEmployeeOverride } from "./employee.js";
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

/**
 * Unit persisted by a StructureDocument.
 *
 * The main document is canonical; a custom document is isolated.
 */
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
  employeeOverrides: OrgEditorEmployeeOverride[];
  employees: OrgEditorEmployee[];
  units: OrgEditorUnit[];
  selectedItems: OrgEditorSelectedItem[];
  viewport: OrgEditorCanvasViewport;
  layoutMode: OrgEditorLayoutMode;
};

export type OrgEditorState = StructureDocument;

type OrgViewBase = {
  createdAt: string;
  name: string;
  state: StructureDocument;
  updatedAt: string;
};

export type MainOrgView = OrgViewBase & {
  id: string;
  kind: "main";
};

export type CustomOrgView = OrgViewBase & {
  id: string;
  kind: "custom";
};

export type OrgView = MainOrgView | CustomOrgView;
export type OrgViewKind = OrgView["kind"];
