import type {
  Employee,
  EmployeeId,
  OrgEditorCanvasViewport,
  OrgEditorEmployeePosition,
  OrgEditorLayoutMode,
  OrgEditorSelectedItem,
  OrgEditorState,
  OrgEditorUnit,
  OrgEditorUnitId,
  Unit,
} from "@org-tools/types";
import { createUuid } from "@/lib/employee-data";

export const ORG_EDITOR_UNIT_MIN_WIDTH = 280;
export const ORG_EDITOR_UNIT_HEADER_HEIGHT = 72;
export const ORG_EDITOR_UNIT_BORDER_WIDTH = 1;
export const ORG_EDITOR_UNIT_BORDER_RADIUS = 8;
export const ORG_EDITOR_EMPLOYEE_ROW_HEIGHT = 48;
export const ORG_EDITOR_EMPLOYEE_AVATAR_SIZE = 20;
export const ORG_EDITOR_EMPLOYEE_CONTENT_GAP = 8;
export const ORG_EDITOR_EMPLOYEE_CONTENT_RIGHT_PADDING = 4;
export const ORG_EDITOR_EMPLOYEE_NAME_FONT_SIZE = 12;
export const ORG_EDITOR_EMPLOYEE_NAME_LINE_HEIGHT = 16;
export const ORG_EDITOR_EMPLOYEE_ROW_HORIZONTAL_PADDING = 8;
export const ORG_EDITOR_EMPLOYEE_TAG_STYLE = {
  fontSize: 9,
  gap: 2,
  height: 12,
  horizontalPadding: 6,
  radius: 6,
  widthPerCharacter: 5.2,
} as const;
export const ORG_EDITOR_EMPLOYEE_TAG_ROW_HEIGHT =
  ORG_EDITOR_EMPLOYEE_TAG_STYLE.height + ORG_EDITOR_EMPLOYEE_TAG_STYLE.gap;
export const ORG_EDITOR_EMPLOYEE_TAG_GAP = ORG_EDITOR_EMPLOYEE_TAG_STYLE.gap;
export const ORG_EDITOR_UNIT_HORIZONTAL_GAP = 40;
export const ORG_EDITOR_UNIT_CONTENT_PADDING = 8;
export const ORG_EDITOR_UNIT_EMPLOYEE_LIST_TOP_PADDING = ORG_EDITOR_UNIT_CONTENT_PADDING;
export const ORG_EDITOR_UNIT_EMPLOYEE_LIST_HORIZONTAL_PADDING = ORG_EDITOR_UNIT_CONTENT_PADDING;
export const ORG_EDITOR_UNIT_VERTICAL_PADDING = 16;
export const ORG_EDITOR_UNIT_VERTICAL_GAP = 40;
export const ORG_EDITOR_UNIT_LAYER_GAP = 64;
export const ORG_EDITOR_UNIT_ROOT_GAP = 64;
export const ORG_EDITOR_UNIT_MIN_HEIGHT = 120;
export const ORG_EDITOR_UNIT_COLLAPSED_HEIGHT = ORG_EDITOR_UNIT_HEADER_HEIGHT;
export const ORG_EDITOR_DEFAULT_LAYOUT_MODE: OrgEditorLayoutMode = "topDown";
export const ORG_EDITOR_GRID_SIZE = 24;
export const ORG_EDITOR_GRID_MIN_SCREEN_SIZE = 24;
export const ORG_EDITOR_CANVAS_DEFAULT_VIEWPORT: OrgEditorCanvasViewport = {
  scale: 1,
  x: 0,
  y: 0,
};

export type OrgEditorUnitTreeNode = {
  children: OrgEditorUnitTreeNode[];
  unit: OrgEditorUnit;
};

export type OrgEditorSourceIndex = {
  employeesById: ReadonlyMap<EmployeeId, Employee>;
};

export type OrgEditorUnitEmployeeSummary = {
  directCount: number;
  hasChildUnits: boolean;
  totalCount: number;
};

export const snapOrgEditorCoordinate = (value: number) =>
  Math.round(value / ORG_EDITOR_GRID_SIZE) * ORG_EDITOR_GRID_SIZE;

export const snapOrgEditorPoint = <Point extends { x: number; y: number }>(
  point: Point,
): Point => ({
  ...point,
  x: snapOrgEditorCoordinate(point.x),
  y: snapOrgEditorCoordinate(point.y),
});

export const snapOrgEditorUnits = (units: OrgEditorUnit[]) =>
  units.map((unit) => snapOrgEditorPoint(unit));

export const getAdaptiveOrgEditorGridSize = (scale: number) => {
  const normalizedScale = Number.isFinite(scale) && scale > 0 ? scale : 1;
  const minimumMultiplier =
    ORG_EDITOR_GRID_MIN_SCREEN_SIZE / (ORG_EDITOR_GRID_SIZE * normalizedScale);
  const multiplier = 2 ** Math.max(0, Math.ceil(Math.log2(minimumMultiplier)));

  return ORG_EDITOR_GRID_SIZE * multiplier;
};

export const createOrgEditorUnitId = () => createUuid();

export const createOrgEditorEmployeeId = () => createUuid();

const employeeRowLayoutSourceByUnitId = new Map<
  OrgEditorUnitId,
  { heightByEmployeeId: ReadonlyMap<EmployeeId, number>; orderedEmployeeIds: readonly EmployeeId[] }
>();

export const packOrgEditorTagLabels = (
  labels: readonly string[],
  availableWidth: number,
): number => {
  if (labels.length === 0) return 0;
  let rows = 1;
  let usedWidth = 0;
  for (const label of labels) {
    const chipWidth = getOrgEditorTagChipWidth(label, availableWidth);
    const nextWidth =
      usedWidth === 0 ? chipWidth : usedWidth + ORG_EDITOR_EMPLOYEE_TAG_GAP + chipWidth;
    if (usedWidth > 0 && nextWidth > availableWidth) {
      rows += 1;
      usedWidth = chipWidth;
    } else {
      usedWidth = nextWidth;
    }
  }
  return rows;
};

export const getOrgEditorTagChipWidth = (label: string, availableWidth: number) =>
  Math.min(
    availableWidth,
    Math.max(
      24,
      ORG_EDITOR_EMPLOYEE_TAG_STYLE.horizontalPadding * 2 +
        label.length * ORG_EDITOR_EMPLOYEE_TAG_STYLE.widthPerCharacter,
    ),
  );

export const getOrgEditorEmployeeRowHeightForTagLabels = (
  labels: readonly string[],
  availableWidth: number,
) =>
  ORG_EDITOR_EMPLOYEE_ROW_HEIGHT +
  Math.max(0, packOrgEditorTagLabels(labels, availableWidth) - 1) *
    ORG_EDITOR_EMPLOYEE_TAG_ROW_HEIGHT;

export const getOrgEditorEmployeeTextMaxWidth = (unitWidth: number) =>
  Math.max(
    0,
    unitWidth -
      ORG_EDITOR_UNIT_BORDER_WIDTH * 2 -
      ORG_EDITOR_UNIT_EMPLOYEE_LIST_HORIZONTAL_PADDING * 2 -
      ORG_EDITOR_EMPLOYEE_ROW_HORIZONTAL_PADDING * 2 -
      ORG_EDITOR_EMPLOYEE_AVATAR_SIZE -
      ORG_EDITOR_EMPLOYEE_CONTENT_GAP -
      ORG_EDITOR_EMPLOYEE_CONTENT_RIGHT_PADDING,
  );

export const getOrgEditorEmployeeVisualGeometry = ({
  employeeRowHeight,
  employeeRowOffset,
  tagBlockHeight,
  tagRowCount,
  unitWidth,
  unitX,
  unitY,
}: {
  employeeRowHeight: number;
  employeeRowOffset: number;
  tagBlockHeight?: number;
  tagRowCount: number;
  unitWidth: number;
  unitX: number;
  unitY: number;
}) => {
  const rowTop =
    unitY +
    ORG_EDITOR_UNIT_BORDER_WIDTH +
    ORG_EDITOR_UNIT_HEADER_HEIGHT +
    ORG_EDITOR_UNIT_EMPLOYEE_LIST_TOP_PADDING +
    employeeRowOffset;
  const avatarX =
    unitX +
    ORG_EDITOR_UNIT_BORDER_WIDTH +
    ORG_EDITOR_UNIT_EMPLOYEE_LIST_HORIZONTAL_PADDING +
    ORG_EDITOR_EMPLOYEE_ROW_HORIZONTAL_PADDING +
    ORG_EDITOR_EMPLOYEE_AVATAR_SIZE / 2;
  const textX =
    unitX +
    ORG_EDITOR_UNIT_BORDER_WIDTH +
    ORG_EDITOR_UNIT_EMPLOYEE_LIST_HORIZONTAL_PADDING +
    ORG_EDITOR_EMPLOYEE_ROW_HORIZONTAL_PADDING +
    ORG_EDITOR_EMPLOYEE_AVATAR_SIZE +
    ORG_EDITOR_EMPLOYEE_CONTENT_GAP;
  const resolvedTagBlockHeight =
    tagBlockHeight ??
    (tagRowCount === 0
      ? 0
      : tagRowCount * ORG_EDITOR_EMPLOYEE_TAG_STYLE.height +
        (tagRowCount - 1) * ORG_EDITOR_EMPLOYEE_TAG_STYLE.gap);
  const contentHeight =
    ORG_EDITOR_EMPLOYEE_NAME_LINE_HEIGHT +
    (resolvedTagBlockHeight === 0 ? 0 : 2 + resolvedTagBlockHeight);
  const contentTop = rowTop + (employeeRowHeight - contentHeight) / 2;

  return {
    avatarX,
    avatarY: rowTop + employeeRowHeight / 2,
    rowTop,
    tagY: contentTop + ORG_EDITOR_EMPLOYEE_NAME_LINE_HEIGHT + 2,
    textBaselineY:
      contentTop +
      (ORG_EDITOR_EMPLOYEE_NAME_LINE_HEIGHT + ORG_EDITOR_EMPLOYEE_NAME_FONT_SIZE) / 2 -
      1,
    textMaxWidth: getOrgEditorEmployeeTextMaxWidth(unitWidth),
    textX,
  };
};

export const setOrgEditorUnitEmployeeRowHeights = (
  unitId: OrgEditorUnitId,
  heights: ReadonlyMap<EmployeeId, number>,
  orderedEmployeeIds: readonly EmployeeId[],
): void => {
  employeeRowLayoutSourceByUnitId.set(unitId, {
    heightByEmployeeId: new Map(heights),
    orderedEmployeeIds: [...orderedEmployeeIds],
  });
};

export type OrgEditorEmployeeRowLayout = {
  heights: number[];
  offsets: number[];
  totalHeight: number;
};

export const getOrgEditorEmployeeRowLayout = (
  unit: Pick<OrgEditorUnit, "bossEmployeeId" | "collapsed" | "employeeIds" | "id">,
): OrgEditorEmployeeRowLayout => {
  const source = employeeRowLayoutSourceByUnitId.get(unit.id);
  const orderedEmployeeIds = source?.orderedEmployeeIds ?? unit.employeeIds;
  const visibleEmployeeIds = unit.collapsed
    ? unit.bossEmployeeId && orderedEmployeeIds.includes(unit.bossEmployeeId)
      ? [unit.bossEmployeeId]
      : []
    : orderedEmployeeIds;
  const heightByEmployeeId = source?.heightByEmployeeId;
  const heights = visibleEmployeeIds.map(
    (employeeId) => heightByEmployeeId?.get(employeeId) ?? ORG_EDITOR_EMPLOYEE_ROW_HEIGHT,
  );
  const offsets: number[] = [];
  let totalHeight = 0;
  for (const height of heights) {
    offsets.push(totalHeight);
    totalHeight += height;
  }
  return { heights, offsets, totalHeight };
};

export const findOrgEditorEmployeeRowIndex = (
  layout: OrgEditorEmployeeRowLayout,
  offset: number,
): number => {
  let low = 0;
  let high = layout.offsets.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    const rowEnd = (layout.offsets[middle] ?? 0) + (layout.heights[middle] ?? 0);
    if (rowEnd < offset) low = middle + 1;
    else high = middle;
  }
  return low;
};

export const createDefaultOrgEditorState = (): OrgEditorState => {
  return {
    employeeOverrides: [],
    employees: [],
    layoutMode: ORG_EDITOR_DEFAULT_LAYOUT_MODE,
    selectedItems: [],
    units: [],
    viewport: ORG_EDITOR_CANVAS_DEFAULT_VIEWPORT,
  };
};

export const createOrgEditorSelectedItemKey = (item: OrgEditorSelectedItem) =>
  item.type === "unit" ? `unit:${item.unitId}` : `employee:${item.unitId}:${item.employeeId}`;

export const getOrgEditorUnitWidth = (unit: Pick<OrgEditorUnit, "name">) =>
  Math.max(ORG_EDITOR_UNIT_MIN_WIDTH, 124 + getOrgEditorUnitDisplayName(unit).length * 9);

export const getOrgEditorUnitVisibleEmployeeCount = (
  unit: Pick<OrgEditorUnit, "bossEmployeeId" | "collapsed" | "employeeIds">,
) => {
  if (!unit.collapsed) return Math.max(1, unit.employeeIds.length);

  return unit.bossEmployeeId !== null && unit.employeeIds.includes(unit.bossEmployeeId) ? 1 : 0;
};

export const getOrgEditorUnitHeightForEmployeeRows = ({
  collapsed,
  employeeRowHeights,
}: {
  collapsed: boolean;
  employeeRowHeights: readonly number[];
}) => {
  if (collapsed && employeeRowHeights.length === 0) return ORG_EDITOR_UNIT_COLLAPSED_HEIGHT;

  return Math.max(
    collapsed ? ORG_EDITOR_UNIT_COLLAPSED_HEIGHT : ORG_EDITOR_UNIT_MIN_HEIGHT,
    ORG_EDITOR_UNIT_HEADER_HEIGHT +
      ORG_EDITOR_UNIT_VERTICAL_PADDING +
      employeeRowHeights.reduce((sum, height) => sum + height, 0),
  );
};

export const getOrgEditorUnitHeight = (
  unit: Pick<OrgEditorUnit, "bossEmployeeId" | "collapsed" | "employeeIds" | "id">,
) => {
  const rowLayout = getOrgEditorEmployeeRowLayout(unit);
  return getOrgEditorUnitHeightForEmployeeRows({
    collapsed: unit.collapsed,
    employeeRowHeights: rowLayout.heights,
  });
};

export const getOrgEditorUnitDisplayName = (unit: Pick<OrgEditorUnit, "name">) =>
  unit.name.trim() || "Untitled";

export const getOrgEditorUnitBounds = (unit: OrgEditorUnit) => ({
  height: getOrgEditorUnitHeight(unit),
  width: getOrgEditorUnitWidth(unit),
  x: unit.x,
  y: unit.y,
});

export const getOrgEditorEmployeeBounds = (unit: OrgEditorUnit, employeeIndex: number) => ({
  height:
    (getOrgEditorEmployeeRowLayout(unit).heights[employeeIndex] ?? ORG_EDITOR_EMPLOYEE_ROW_HEIGHT) -
    6,
  width: getOrgEditorUnitWidth(unit) - 28,
  x: unit.x + 14,
  y:
    unit.y +
    ORG_EDITOR_UNIT_HEADER_HEIGHT +
    ORG_EDITOR_UNIT_EMPLOYEE_LIST_TOP_PADDING +
    (getOrgEditorEmployeeRowLayout(unit).offsets[employeeIndex] ??
      employeeIndex * ORG_EDITOR_EMPLOYEE_ROW_HEIGHT),
});

type MeasuredOrgEditorLayoutTree = {
  placements: Array<{
    center: number;
    depth: number;
    unit: OrgEditorUnit;
  }>;
  rootCenter: number;
  span: number;
};

export const layoutOrgEditorUnits = (
  units: OrgEditorUnit[],
  layoutMode: OrgEditorLayoutMode,
  origin?: { x: number; y: number },
) => {
  if (units.length === 0) return [];

  const unitBounds = units.map(getOrgEditorUnitBounds);
  const layoutOrigin = origin ?? {
    x: Math.min(...unitBounds.map((bounds) => bounds.x)),
    y: Math.min(...unitBounds.map((bounds) => bounds.y)),
  };
  const roots = buildOrgEditorUnitTree(units);
  const placements = new Map<OrgEditorUnitId, { center: number; depth: number }>();
  const maxHeightByDepth = new Map<number, number>();
  const maxWidthByDepth = new Map<number, number>();
  const breadthGap =
    layoutMode === "leftRight" ? ORG_EDITOR_UNIT_VERTICAL_GAP : ORG_EDITOR_UNIT_HORIZONTAL_GAP;

  const measureNode = (node: OrgEditorUnitTreeNode, depth: number): MeasuredOrgEditorLayoutTree => {
    const nodeHeight = getOrgEditorUnitHeight(node.unit);
    const nodeWidth = getOrgEditorUnitWidth(node.unit);
    const nodeBreadth = layoutMode === "leftRight" ? nodeHeight : nodeWidth;
    maxHeightByDepth.set(depth, Math.max(maxHeightByDepth.get(depth) ?? 0, nodeHeight));
    maxWidthByDepth.set(depth, Math.max(maxWidthByDepth.get(depth) ?? 0, nodeWidth));

    if (node.children.length === 0) {
      const rootCenter = nodeBreadth / 2;

      return {
        placements: [{ center: rootCenter, depth, unit: node.unit }],
        rootCenter,
        span: nodeBreadth,
      };
    }

    const measuredChildren = node.children.map((childNode) => measureNode(childNode, depth + 1));
    const childrenSpan =
      measuredChildren.reduce((span, measuredChild) => span + measuredChild.span, 0) +
      breadthGap * Math.max(0, measuredChildren.length - 1);
    let span = Math.max(nodeBreadth, childrenSpan);
    let childCursor = (span - childrenSpan) / 2;
    const childRootCenters: number[] = [];
    const placements: MeasuredOrgEditorLayoutTree["placements"] = [];

    for (const measuredChild of measuredChildren) {
      childRootCenters.push(measuredChild.rootCenter + childCursor);
      placements.push(
        ...measuredChild.placements.map((placement) => ({
          ...placement,
          center: placement.center + childCursor,
        })),
      );
      childCursor += measuredChild.span + breadthGap;
    }

    let rootCenter = (Math.min(...childRootCenters) + Math.max(...childRootCenters)) / 2;
    const rootLeft = rootCenter - nodeBreadth / 2;
    let rootRight = rootCenter + nodeBreadth / 2;

    if (rootLeft < 0) {
      const offset = -rootLeft;

      rootCenter += offset;
      rootRight += offset;
      span += offset;
      for (const placement of placements) {
        placement.center += offset;
      }
    }

    if (rootRight > span) {
      span = rootRight;
    }

    placements.push({ center: rootCenter, depth, unit: node.unit });

    return { placements, rootCenter, span };
  };

  let rootCursor = 0;
  for (const rootNode of roots) {
    const measuredRoot = measureNode(rootNode, 0);

    for (const placement of measuredRoot.placements) {
      placements.set(placement.unit.id, {
        center: placement.center + rootCursor,
        depth: placement.depth,
      });
    }

    rootCursor += measuredRoot.span + ORG_EDITOR_UNIT_ROOT_GAP;
  }

  const depthOffsets = new Map<number, number>();
  let currentDepthOffset = 0;
  const maxDepth = Math.max(...[...placements.values()].map((placement) => placement.depth));

  for (let depth = 0; depth <= maxDepth; depth += 1) {
    depthOffsets.set(depth, currentDepthOffset);
    currentDepthOffset +=
      (layoutMode === "leftRight"
        ? (maxWidthByDepth.get(depth) ?? ORG_EDITOR_UNIT_MIN_WIDTH)
        : (maxHeightByDepth.get(depth) ?? ORG_EDITOR_UNIT_MIN_HEIGHT)) + ORG_EDITOR_UNIT_LAYER_GAP;
  }

  const now = new Date().toISOString();

  return units.map((unit) => {
    const placement = placements.get(unit.id);
    if (!placement) return unit;

    if (layoutMode === "leftRight") {
      return snapOrgEditorPoint({
        ...unit,
        updatedAt: now,
        x: layoutOrigin.x + (depthOffsets.get(placement.depth) ?? 0),
        y: layoutOrigin.y + placement.center - getOrgEditorUnitHeight(unit) / 2,
      });
    }

    return snapOrgEditorPoint({
      ...unit,
      updatedAt: now,
      x: layoutOrigin.x + placement.center - getOrgEditorUnitWidth(unit) / 2,
      y: layoutOrigin.y + (depthOffsets.get(placement.depth) ?? 0),
    });
  });
};

export const isPointInsideRect = (
  point: { x: number; y: number },
  rect: { height: number; width: number; x: number; y: number },
) =>
  point.x >= rect.x &&
  point.x <= rect.x + rect.width &&
  point.y >= rect.y &&
  point.y <= rect.y + rect.height;

export const doRectsIntersect = (
  firstRect: { height: number; width: number; x: number; y: number },
  secondRect: { height: number; width: number; x: number; y: number },
) =>
  firstRect.x < secondRect.x + secondRect.width &&
  firstRect.x + firstRect.width > secondRect.x &&
  firstRect.y < secondRect.y + secondRect.height &&
  firstRect.y + firstRect.height > secondRect.y;

export const buildOrgEditorUnitTree = (units: OrgEditorUnit[]): OrgEditorUnitTreeNode[] => {
  const childrenByParentId = new Map<OrgEditorUnitId | null, OrgEditorUnit[]>();

  for (const unit of units) {
    const currentChildren = childrenByParentId.get(unit.parentId) ?? [];

    currentChildren.push(unit);
    childrenByParentId.set(unit.parentId, currentChildren);
  }

  for (const children of childrenByParentId.values()) {
    children.sort((firstUnit, secondUnit) => {
      const orderComparison = firstUnit.order - secondUnit.order;

      return orderComparison !== 0
        ? orderComparison
        : String(firstUnit.id).localeCompare(String(secondUnit.id));
    });
  }

  const buildNode = (
    unit: OrgEditorUnit,
    visitedUnitIds: Set<OrgEditorUnitId>,
  ): OrgEditorUnitTreeNode => {
    if (visitedUnitIds.has(unit.id)) {
      return { children: [], unit } satisfies OrgEditorUnitTreeNode;
    }

    const nextVisitedUnitIds = new Set(visitedUnitIds);
    nextVisitedUnitIds.add(unit.id);

    return {
      children: (childrenByParentId.get(unit.id) ?? []).map((childUnit) =>
        buildNode(childUnit, nextVisitedUnitIds),
      ),
      unit,
    } satisfies OrgEditorUnitTreeNode;
  };

  return (childrenByParentId.get(null) ?? []).map((unit) => buildNode(unit, new Set()));
};

export const buildOrgEditorUnitEmployeeSummaryById = (units: OrgEditorUnit[]) => {
  const unitById = new Map(units.map((unit) => [unit.id, unit] as const));
  const childrenByParentId = new Map<OrgEditorUnitId | null, OrgEditorUnit[]>();
  const summaryByUnitId = new Map<OrgEditorUnitId, OrgEditorUnitEmployeeSummary>();

  for (const unit of units) {
    const parentId = unit.parentId && unitById.has(unit.parentId) ? unit.parentId : null;
    const siblings = childrenByParentId.get(parentId) ?? [];

    siblings.push(unit);
    childrenByParentId.set(parentId, siblings);
  }

  const collectUnitSummary = (
    unit: OrgEditorUnit,
    ancestorEmployeeIds: ReadonlySet<EmployeeId>,
    visitedUnitIds: ReadonlySet<OrgEditorUnitId>,
  ) => {
    if (visitedUnitIds.has(unit.id)) {
      return new Set<EmployeeId>();
    }

    const nextVisitedUnitIds = new Set(visitedUnitIds);
    nextVisitedUnitIds.add(unit.id);

    const ownUniqueEmployeeIds = new Set<EmployeeId>();
    for (const employeeId of unit.employeeIds) {
      if (employeeId === unit.bossEmployeeId || !ancestorEmployeeIds.has(employeeId)) {
        ownUniqueEmployeeIds.add(employeeId);
      }
    }

    const descendantAncestorEmployeeIds = new Set([...ancestorEmployeeIds, ...unit.employeeIds]);
    const totalEmployeeIds = new Set(ownUniqueEmployeeIds);
    const childUnits = childrenByParentId.get(unit.id) ?? [];

    for (const childUnit of childUnits) {
      for (const employeeId of collectUnitSummary(
        childUnit,
        descendantAncestorEmployeeIds,
        nextVisitedUnitIds,
      )) {
        totalEmployeeIds.add(employeeId);
      }
    }

    summaryByUnitId.set(unit.id, {
      directCount: unit.employeeIds.length,
      hasChildUnits: childUnits.length > 0,
      totalCount: totalEmployeeIds.size,
    });

    return totalEmployeeIds;
  };

  for (const rootUnit of childrenByParentId.get(null) ?? []) {
    collectUnitSummary(rootUnit, new Set(), new Set());
  }

  for (const unit of units) {
    if (!summaryByUnitId.has(unit.id)) {
      summaryByUnitId.set(unit.id, {
        directCount: unit.employeeIds.length,
        hasChildUnits: false,
        totalCount: unit.employeeIds.length,
      });
    }
  }

  return summaryByUnitId;
};

export const getOrgEditorUnitDescendantIds = (units: OrgEditorUnit[], unitId: OrgEditorUnitId) => {
  const childrenByParentId = new Map<OrgEditorUnitId | null, OrgEditorUnit[]>();

  for (const unit of units) {
    const currentChildren = childrenByParentId.get(unit.parentId) ?? [];

    currentChildren.push(unit);
    childrenByParentId.set(unit.parentId, currentChildren);
  }

  const descendantIds: OrgEditorUnitId[] = [];
  const stack = [unitId];
  const visitedUnitIds = new Set<OrgEditorUnitId>();

  while (stack.length > 0) {
    const currentUnitId = stack.pop();

    if (!currentUnitId || visitedUnitIds.has(currentUnitId)) continue;

    visitedUnitIds.add(currentUnitId);
    descendantIds.push(currentUnitId);

    for (const childUnit of childrenByParentId.get(currentUnitId) ?? []) {
      stack.push(childUnit.id);
    }
  }

  return descendantIds;
};

export const sortOrgEditorEmployeeIds = ({
  bossEmployeeId,
  employeeById,
  employeeIds,
}: {
  bossEmployeeId: EmployeeId | null;
  employeeById: ReadonlyMap<EmployeeId, Employee>;
  employeeIds: EmployeeId[];
}) =>
  [...employeeIds].sort((firstEmployeeId, secondEmployeeId) => {
    if (firstEmployeeId === bossEmployeeId) return -1;
    if (secondEmployeeId === bossEmployeeId) return 1;

    const firstEmployee = employeeById.get(firstEmployeeId);
    const secondEmployee = employeeById.get(secondEmployeeId);
    const nameCompare = (firstEmployee?.fullName ?? "").localeCompare(
      secondEmployee?.fullName ?? "",
      "en-US",
      { numeric: true, sensitivity: "base" },
    );

    return (
      nameCompare ||
      String(firstEmployeeId).localeCompare(String(secondEmployeeId), "en-US", {
        numeric: true,
        sensitivity: "base",
      })
    );
  });

export const getOrgEditorOrderedEmployeeIds = (
  unit: OrgEditorUnit,
  employeeById: ReadonlyMap<EmployeeId, Employee>,
) =>
  sortOrgEditorEmployeeIds({
    bossEmployeeId: unit.bossEmployeeId,
    employeeById,
    employeeIds: unit.employeeIds,
  });

export const getOrgEditorEmployeePosition = (
  unit: Pick<OrgEditorUnit, "employeePositions">,
  employeeId: EmployeeId,
) =>
  unit.employeePositions.find((employeePosition) => employeePosition.employeeId === employeeId)
    ?.position ?? null;

export const getOrgEditorVisibleEmployeeIds = (
  unit: OrgEditorUnit,
  employeeById: ReadonlyMap<EmployeeId, Employee>,
) => {
  const orderedEmployeeIds = getOrgEditorOrderedEmployeeIds(unit, employeeById);

  if (!unit.collapsed) return orderedEmployeeIds;

  return orderedEmployeeIds.filter((employeeId) => employeeId === unit.bossEmployeeId).slice(0, 1);
};

export const createOrgEditorUnitFromScratch = ({
  bossEmployeeId = null,
  collapsed = false,
  employeeIds = [],
  employeePositions = [],
  id = createOrgEditorUnitId(),
  liveFilter = null,
  name,
  order = 0,
  parentId = null,
  x,
  y,
}: {
  bossEmployeeId?: EmployeeId | null;
  collapsed?: boolean;
  employeeIds?: EmployeeId[];
  employeePositions?: OrgEditorEmployeePosition[];
  id?: OrgEditorUnitId;
  liveFilter?: OrgEditorUnit["liveFilter"];
  name: string;
  order?: number;
  parentId?: OrgEditorUnitId | null;
  x: number;
  y: number;
}): OrgEditorUnit => {
  const now = new Date().toISOString();
  const uniqueEmployeeIds = liveFilter === null ? [...new Set(employeeIds)] : [];
  const employeeIdSet = new Set(uniqueEmployeeIds);
  const employeePositionByEmployeeId = new Map<EmployeeId, OrgEditorEmployeePosition>();

  for (const employeePosition of employeePositions) {
    const position = employeePosition.position?.trim() || null;

    if (liveFilter === null && (!employeeIdSet.has(employeePosition.employeeId) || !position)) {
      continue;
    }
    employeePositionByEmployeeId.set(employeePosition.employeeId, {
      employeeId: employeePosition.employeeId,
      position,
    });
  }

  return {
    bossEmployeeId,
    collapsed,
    createdAt: now,
    employeeIds: uniqueEmployeeIds,
    employeePositions: [...employeePositionByEmployeeId.values()],
    id,
    liveFilter,
    name,
    order,
    parentId,
    updatedAt: now,
    x,
    y,
  };
};

export const createOrgEditorUnitsFromOrgUnit = ({
  employeesById,
  layoutMode = ORG_EDITOR_DEFAULT_LAYOUT_MODE,
  origin,
  rootUnit,
}: {
  employeesById?: ReadonlyMap<EmployeeId, Employee>;
  layoutMode?: OrgEditorLayoutMode;
  origin: { x: number; y: number };
  rootUnit: Unit;
}) => {
  const units: OrgEditorUnit[] = [];
  let rowIndex = 0;

  const visitUnit = (unit: Unit, depth: number, parentId: OrgEditorUnitId | null) => {
    const bossEmployeeId =
      unit.directEmployeeIds.find((employeeId) =>
        employeesById
          ?.get(employeeId)
          ?.unitPositions.some(
            (unitPosition) => unitPosition.unitId === unit.id && unitPosition.isBoss,
          ),
      ) ?? null;
    const editorUnit = createOrgEditorUnitFromScratch({
      bossEmployeeId,
      employeeIds: unit.directEmployeeIds,
      employeePositions: unit.directEmployeeIds.flatMap((employeeId) => {
        const position =
          employeesById
            ?.get(employeeId)
            ?.unitPositions.find((unitPosition) => unitPosition.unitId === unit.id)?.position ??
          null;

        return position ? [{ employeeId, position }] : [];
      }),
      name: unit.name,
      order: unit.order,
      parentId,
      x: origin.x + depth * 360,
      y: origin.y + rowIndex * 190,
    });

    rowIndex += 1;
    units.push(editorUnit);

    for (const childUnit of unit.children) {
      visitUnit(childUnit, depth + 1, editorUnit.id);
    }
  };

  visitUnit(rootUnit, 0, null);

  return layoutOrgEditorUnits(units, layoutMode, origin);
};
