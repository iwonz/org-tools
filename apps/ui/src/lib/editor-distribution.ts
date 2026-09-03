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
