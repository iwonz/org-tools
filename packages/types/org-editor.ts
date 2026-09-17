import type { EmployeeTagAssignment, EmployeeTagColor } from "./employee.js";
import type {
  EmployeeId,
  OrgEditorCanvasElementId,
  OrgEditorOpenPositionId,
  UnitId,
} from "./ids.js";
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
    }
  | {
      openPositionId: OrgEditorOpenPositionId;
      type: "openPosition";
      unitId: OrgEditorUnitId;
    }
  | {
      elementId: OrgEditorCanvasElementId;
      type: "element";
    };

export type OrgEditorCanvasElementLayer = "aboveUnits" | "behindUnits";
export type OrgEditorHorizontalAlign = "center" | "left" | "right";
export type OrgEditorVerticalAlign = "bottom" | "middle" | "top";
export type OrgEditorFontWeight = 400 | 500 | 700;
export type OrgEditorTextFillMode = "block" | "lines" | "none";

export type OrgEditorRectAnchorId =
  | "bottomCenter"
  | "bottomLeft"
  | "bottomRight"
  | "center"
  | "leftCenter"
  | "rightCenter"
  | "topCenter"
  | "topLeft"
  | "topRight";
export type OrgEditorEmployeeAnchorId = "leftCenter" | "rightCenter";
export type OrgEditorArrowAnchorId = "end" | "middle" | "start";

export type OrgEditorAnchorOwner =
  | { type: "unit"; unitId: OrgEditorUnitId }
  | { employeeId: EmployeeId; type: "employee"; unitId: OrgEditorUnitId }
  | {
      openPositionId: OrgEditorOpenPositionId;
      type: "openPosition";
      unitId: OrgEditorUnitId;
    }
  | { elementId: OrgEditorCanvasElementId; type: "element" };

export type OrgEditorAnchorRef = {
  anchorId: OrgEditorRectAnchorId | OrgEditorEmployeeAnchorId | OrgEditorArrowAnchorId;
  owner: OrgEditorAnchorOwner;
};

export type OrgEditorCanvasPoint = { x: number; y: number };

export type OrgEditorAttachment = {
  offset: OrgEditorCanvasPoint;
  sourceAnchorId: OrgEditorRectAnchorId;
  target: OrgEditorAnchorRef;
};

export type OrgEditorArrowEndpointAttachment = {
  offset: OrgEditorCanvasPoint;
  target: OrgEditorAnchorRef;
};

export type OrgEditorTypography = {
  color: EmployeeTagColor;
  fontFamily: string;
  fontSize: number;
  fontWeight: OrgEditorFontWeight;
  horizontalAlign: OrgEditorHorizontalAlign;
  verticalAlign: OrgEditorVerticalAlign;
};

export type OrgEditorInlineTypography = Pick<
  OrgEditorTypography,
  "color" | "fontFamily" | "fontSize" | "fontWeight"
>;

export type OrgEditorTextFormatRun = {
  end: number;
  start: number;
  typography: OrgEditorInlineTypography;
};

type OrgEditorRectElementBase = {
  attachment: OrgEditorAttachment | null;
  height: number;
  id: OrgEditorCanvasElementId;
  layer: OrgEditorCanvasElementLayer;
  rotation: number;
  width: number;
  x: number;
  y: number;
};

export type OrgEditorTextElement = OrgEditorRectElementBase & {
  autoWidth: boolean;
  fillColor: EmployeeTagColor;
  fillMode: OrgEditorTextFillMode;
  formatRuns: OrgEditorTextFormatRun[];
  text: string;
  typography: OrgEditorTypography;
  type: "text";
};

export type OrgEditorStickerElement = OrgEditorRectElementBase & {
  backgroundColor: EmployeeTagColor;
  formatRuns: OrgEditorTextFormatRun[];
  text: string;
  typography: OrgEditorTypography;
  type: "sticker";
};

export type OrgEditorImageElement = OrgEditorRectElementBase & {
  dataUrl: string;
  intrinsicHeight: number;
  intrinsicWidth: number;
  lockAspectRatio: boolean;
  type: "image";
};

export type OrgEditorArrowEndpoint = {
  attachment: OrgEditorArrowEndpointAttachment | null;
  x: number;
  y: number;
};

export type OrgEditorArrowElement = {
  dash: "dashed" | "solid";
  end: OrgEditorArrowEndpoint;
  endControl: OrgEditorCanvasPoint;
  endMarker: "arrow" | "none";
  id: OrgEditorCanvasElementId;
  layer: OrgEditorCanvasElementLayer;
  start: OrgEditorArrowEndpoint;
  startControl: OrgEditorCanvasPoint;
  startMarker: "arrow" | "none";
  strokeColor: EmployeeTagColor;
  strokeWidth: number;
  type: "arrow";
};

export type OrgEditorCanvasElement =
  | OrgEditorArrowElement
  | OrgEditorImageElement
  | OrgEditorStickerElement
  | OrgEditorTextElement;

export type OrgEditorEmployeePosition = {
  employeeId: EmployeeId;
  position: string | null;
};

export type OrgEditorOpenPosition = {
  backgroundColor: EmployeeTagColor | null;
  id: OrgEditorOpenPositionId;
  tags: EmployeeTagAssignment[];
  title: string;
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
  noteMarkdown: string;
  openPositions: OrgEditorOpenPosition[];
  createdAt: string;
  updatedAt: string;
};

export type OrgEditorViewSettings = {
  groupByTag: boolean;
  showTagCloud: boolean;
  distributedColor: EmployeeTagColor;
  undistributedColor: EmployeeTagColor;
};

export type StructureDocument = {
  canvasElements: OrgEditorCanvasElement[];
  settings: OrgEditorViewSettings;
  distributionModeUnitIds: OrgEditorUnitId[];
  units: OrgEditorUnit[];
  selectedItems: OrgEditorSelectedItem[];
  viewport: OrgEditorCanvasViewport;
  layoutMode: OrgEditorLayoutMode;
};

export type OrgEditorState = StructureDocument;
