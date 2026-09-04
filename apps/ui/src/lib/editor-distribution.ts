import type {
  Employee,
  EmployeeId,
  OrgEditorSelectedItem,
  OrgEditorUnit,
  OrgEditorUnitId,
} from "@org-tools/types";

import {
  getOrgEditorEmployeeBounds,
  getOrgEditorOrderedEmployeeIds,
  getOrgEditorUnitBounds,
  getOrgEditorVisibleEmployeeIds,
} from "@/lib/org-editor";

export type EditorDistributionRect = {
  height: number;
  width: number;
  x: number;
  y: number;
};

export type EditorDistributionPlacement = {
  bounds: EditorDistributionRect;
  hiddenByCollapse: boolean;
};

export type EditorDistributionConnection = {
  end: { x: number; y: number };
  path: string;
  showEndpointMarker: boolean;
  start: { x: number; y: number };
};

export type EditorDistributionBulkState = "checked" | "mixed" | "unchecked";

export type EditorPlacementMapNode = EditorDistributionRect & {
  unitId: OrgEditorUnitId;
};

export type EditorPlacementMapLayout = {
  bounds: EditorDistributionRect;
  employee: EditorDistributionRect;
  units: EditorPlacementMapNode[];
};

const PLACEMENT_EMPLOYEE_WIDTH = 224;
const PLACEMENT_EMPLOYEE_HEIGHT = 136;
const PLACEMENT_UNIT_WIDTH = 184;
const PLACEMENT_UNIT_HEIGHT = 68;
const PLACEMENT_RING_START_RADIUS = 208;
const PLACEMENT_RING_GAP = 232;
const PLACEMENT_NODE_GAP = 24;

export const getEditorDistributionBulkState = (
  enabledUnitIds: ReadonlySet<OrgEditorUnitId>,
  selectedUnitIds: readonly OrgEditorUnitId[],
): EditorDistributionBulkState => {
  if (selectedUnitIds.length === 0) return "unchecked";
  const enabledCount = selectedUnitIds.reduce(
    (count, unitId) => count + Number(enabledUnitIds.has(unitId)),
    0,
  );
  if (enabledCount === 0) return "unchecked";
  if (enabledCount === selectedUnitIds.length) return "checked";
  return "mixed";
};

export const applyEditorDistributionBulkToggle = (
  enabledUnitIds: readonly OrgEditorUnitId[],
  selectedUnitIds: readonly OrgEditorUnitId[],
) => {
  const selectedIdSet = new Set(selectedUnitIds);
  const currentIdSet = new Set(enabledUnitIds);
  const state = getEditorDistributionBulkState(currentIdSet, selectedUnitIds);

  if (state === "checked") {
    return enabledUnitIds.filter((unitId) => !selectedIdSet.has(unitId));
  }

  for (const unitId of selectedUnitIds) currentIdSet.add(unitId);
  return [...currentIdSet];
};

export const createEditorPlacementMapLayout = (
  unitIds: readonly OrgEditorUnitId[],
): EditorPlacementMapLayout => {
  const employee = {
    height: PLACEMENT_EMPLOYEE_HEIGHT,
    width: PLACEMENT_EMPLOYEE_WIDTH,
    x: -PLACEMENT_EMPLOYEE_WIDTH / 2,
    y: -PLACEMENT_EMPLOYEE_HEIGHT / 2,
  };
  const units: EditorPlacementMapNode[] = [];
  let unitIndex = 0;
  let ringIndex = 0;

  while (unitIndex < unitIds.length) {
    const radius = PLACEMENT_RING_START_RADIUS + ringIndex * PLACEMENT_RING_GAP;
    const circumference = Math.PI * 2 * radius;
    const capacity = Math.max(
      4,
      Math.floor(circumference / (PLACEMENT_UNIT_WIDTH + PLACEMENT_NODE_GAP)),
    );
    const ringCount = Math.min(capacity, unitIds.length - unitIndex);

    for (let indexOnRing = 0; indexOnRing < ringCount; indexOnRing += 1) {
      const unitId = unitIds[unitIndex + indexOnRing];
      if (!unitId) continue;
      const angle = -Math.PI / 2 + (indexOnRing * Math.PI * 2) / ringCount;
      units.push({
        height: PLACEMENT_UNIT_HEIGHT,
        unitId,
        width: PLACEMENT_UNIT_WIDTH,
        x: Math.cos(angle) * radius - PLACEMENT_UNIT_WIDTH / 2,
        y: Math.sin(angle) * radius - PLACEMENT_UNIT_HEIGHT / 2,
      });
    }

    unitIndex += ringCount;
    ringIndex += 1;
  }

  const rectangles = [employee, ...units];
  const minX = Math.min(...rectangles.map((rect) => rect.x));
  const minY = Math.min(...rectangles.map((rect) => rect.y));
  const maxX = Math.max(...rectangles.map((rect) => rect.x + rect.width));
  const maxY = Math.max(...rectangles.map((rect) => rect.y + rect.height));

  return {
    bounds: { height: maxY - minY, width: maxX - minX, x: minX, y: minY },
    employee,
    units,
  };
};

export const getEditorPlacementMapFitViewport = ({
  bounds,
  height,
  padding = 40,
  width,
}: {
  bounds: EditorDistributionRect;
  height: number;
  padding?: number;
  width: number;
}) => {
  const availableWidth = Math.max(1, width - padding * 2);
  const availableHeight = Math.max(1, height - padding * 2);
  const scale = Math.min(
    1.4,
    Math.max(0.2, Math.min(availableWidth / bounds.width, availableHeight / bounds.height)),
  );
  return {
    scale,
    x: width / 2 - (bounds.x + bounds.width / 2) * scale,
    y: height / 2 - (bounds.y + bounds.height / 2) * scale,
  };
};

export const buildEditorEmployeeUnitIndex = (units: readonly OrgEditorUnit[]) => {
  const unitIdsByEmployeeId = new Map<EmployeeId, OrgEditorUnitId[]>();

  for (const unit of units) {
    for (const employeeId of new Set(unit.employeeIds)) {
      const currentUnitIds = unitIdsByEmployeeId.get(employeeId);
      if (currentUnitIds) currentUnitIds.push(unit.id);
      else unitIdsByEmployeeId.set(employeeId, [unit.id]);
    }
  }

  return unitIdsByEmployeeId;
};

export const getEditorEmployeeOtherUnitIds = (
  unitIdsByEmployeeId: ReadonlyMap<EmployeeId, readonly OrgEditorUnitId[]>,
  employeeId: EmployeeId,
  sourceUnitId: OrgEditorUnitId,
) => (unitIdsByEmployeeId.get(employeeId) ?? []).filter((unitId) => unitId !== sourceUnitId);

export const getEditorEmployeeOtherUnitCount = (
  unitIdsByEmployeeId: ReadonlyMap<EmployeeId, readonly OrgEditorUnitId[]>,
  employeeId: EmployeeId,
) => Math.max(0, (unitIdsByEmployeeId.get(employeeId)?.length ?? 1) - 1);

export const getEditorDistributionSelection = (
  selectedItems: readonly OrgEditorSelectedItem[],
  enabledUnitIds: ReadonlySet<OrgEditorUnitId>,
) => {
  if (selectedItems.length !== 1) return null;
  const item = selectedItems[0];
  return item?.type === "employee" && enabledUnitIds.has(item.unitId) ? item : null;
};

export const getEditorDistributionPlacement = ({
  employeeById,
  employeeId,
  unit,
}: {
  employeeById: ReadonlyMap<EmployeeId, Employee>;
  employeeId: EmployeeId;
  unit: OrgEditorUnit;
}): EditorDistributionPlacement => {
  const visibleEmployeeIds = getOrgEditorVisibleEmployeeIds(unit, employeeById);
  const visibleIndex = visibleEmployeeIds.indexOf(employeeId);
  if (visibleIndex >= 0) {
    return {
      bounds: getOrgEditorEmployeeBounds(unit, visibleIndex),
      hiddenByCollapse: false,
    };
  }

  const isDirectMember = getOrgEditorOrderedEmployeeIds(unit, employeeById).includes(employeeId);
  return {
    bounds: getOrgEditorUnitBounds(unit),
    hiddenByCollapse: unit.collapsed && isDirectMember,
  };
};

const rectCenter = (rect: EditorDistributionRect) => ({
  x: rect.x + rect.width / 2,
  y: rect.y + rect.height / 2,
});

export const createEditorDistributionConnection = ({
  source,
  target,
  targetHiddenByCollapse,
}: {
  source: EditorDistributionRect;
  target: EditorDistributionRect;
  targetHiddenByCollapse: boolean;
}): EditorDistributionConnection => {
  const sourceCenter = rectCenter(source);
  const targetCenter = rectCenter(target);
  const horizontal =
    Math.abs(targetCenter.x - sourceCenter.x) >= Math.abs(targetCenter.y - sourceCenter.y);
  let start: { x: number; y: number };
  let end: { x: number; y: number };
  let path: string;

  if (horizontal) {
    const targetIsAfter = targetCenter.x >= sourceCenter.x;
    start = {
      x: targetIsAfter ? source.x + source.width : source.x,
      y: sourceCenter.y,
    };
    end = {
      x: targetIsAfter ? target.x : target.x + target.width,
      y: targetCenter.y,
    };
    const middleX = start.x + (end.x - start.x) / 2;
    path = `M ${start.x} ${start.y} C ${middleX} ${start.y}, ${middleX} ${end.y}, ${end.x} ${end.y}`;
  } else {
    const targetIsAfter = targetCenter.y >= sourceCenter.y;
    start = {
      x: sourceCenter.x,
      y: targetIsAfter ? source.y + source.height : source.y,
    };
    end = {
      x: targetCenter.x,
      y: targetIsAfter ? target.y : target.y + target.height,
    };
    const middleY = start.y + (end.y - start.y) / 2;
    path = `M ${start.x} ${start.y} C ${start.x} ${middleY}, ${end.x} ${middleY}, ${end.x} ${end.y}`;
  }

  return { end, path, showEndpointMarker: targetHiddenByCollapse, start };
};

export const editorDistributionConnectionIntersectsRect = (
  connection: Pick<EditorDistributionConnection, "end" | "start">,
  rect: EditorDistributionRect,
) => {
  const minX = Math.min(connection.start.x, connection.end.x);
  const maxX = Math.max(connection.start.x, connection.end.x);
  const minY = Math.min(connection.start.y, connection.end.y);
  const maxY = Math.max(connection.start.y, connection.end.y);
  return !(
    maxX < rect.x ||
    minX > rect.x + rect.width ||
    maxY < rect.y ||
    minY > rect.y + rect.height
  );
};
