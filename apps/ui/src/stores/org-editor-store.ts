import type {
  EmployeeId,
  EmployeeLiveFilterRule,
  OrgEditorCanvasViewport,
  OrgEditorEmployeePosition,
  OrgEditorLayoutMode,
  OrgEditorSelectedItem,
  OrgEditorState,
  OrgEditorUnit,
  OrgEditorUnitId,
  ViewId,
} from "@org-tools/types";
import { makeAutoObservable, observable } from "mobx";

import {
  cloneEmployeeLiveFilterRule,
  validateEmployeeLiveFilterRule,
} from "@/lib/live-unit-filter";
import { normalizeLivePositionOverrides } from "@/lib/live-unit-position";
import {
  createDefaultOrgEditorState,
  createOrgEditorSelectedItemKey,
  createOrgEditorUnitFromScratch,
  getOrgEditorUnitBounds,
  getOrgEditorUnitDescendantIds,
  getOrgEditorUnitHeight,
  getOrgEditorUnitWidth,
  layoutOrgEditorUnits,
  normalizeOrgEditorUnitNoteMarkdown,
  ORG_EDITOR_GRID_SIZE,
  ORG_EDITOR_UNIT_HORIZONTAL_GAP,
  snapOrgEditorPoint,
  snapOrgEditorUnits,
} from "@/lib/org-editor";

type SelectionMode = "add" | "replace" | "toggle";

export type OrgEditorClipboard = {
  employeeIds: EmployeeId[];
  resolvedEmployeeIdsByUnitId: Map<OrgEditorUnitId, EmployeeId[]>;
  sourceViewId: ViewId | null;
  units: OrgEditorUnit[];
};

export type OrgEditorClipboardController = {
  get: () => OrgEditorClipboard | null;
  set: (clipboard: OrgEditorClipboard | null) => void;
};

export type OrgEditorHistorySnapshot = {
  layoutMode: OrgEditorLayoutMode;
  units: OrgEditorUnit[];
};

export type OrgEditorEmployeeAssignment = {
  isBoss: boolean;
  position: string | null;
  unitId: OrgEditorUnitId;
};

export type OrgEditorUnitMemberAssignment = {
  employeeId: EmployeeId;
  position: string | null;
};

export type OrgEditorUnitConfiguration =
  | {
      assignments: OrgEditorUnitMemberAssignment[];
      bossEmployeeId: EmployeeId | null;
      membershipMode: "manual";
      name: string;
    }
  | {
      bossEmployeeId: EmployeeId | null;
      liveFilter: EmployeeLiveFilterRule;
      membershipMode: "live";
      name: string;
      positionOverrides: OrgEditorEmployeePosition[];
    };

type OrgEditorSnapshotCommand = {
  after: OrgEditorHistorySnapshot;
  before: OrgEditorHistorySnapshot;
  label: string;
  mergeKey?: string;
  type: "snapshot";
};

type OrgEditorExternalCommand = {
  label: string;
  redo: () => void;
  type: "external";
  undo: () => void;
};

type OrgEditorCommand = OrgEditorExternalCommand | OrgEditorSnapshotCommand;

type OrgEditorUnitPosition = {
  unitId: OrgEditorUnitId;
  x: number;
  y: number;
};

type UnitBounds = {
  bottom: number;
  height: number;
  right: number;
  width: number;
  x: number;
  y: number;
};

const MIN_UNIT_SPACING = 30;
const ORG_EDITOR_HISTORY_LIMIT = 100;

const normalizeUnitConfiguration = (
  configuration: OrgEditorUnitConfiguration,
): OrgEditorUnitConfiguration => {
  const name = configuration.name.trim();

  if (!name) throw new LocalizedError(uiMessage("Enter a Unit name."));

  if (configuration.membershipMode === "live") {
    return {
      bossEmployeeId: configuration.bossEmployeeId,
      liveFilter: cloneEmployeeLiveFilterRule(configuration.liveFilter),
      membershipMode: "live",
      name,
      positionOverrides: normalizeLivePositionOverrides(configuration.positionOverrides),
    };
  }

  const assignmentByEmployeeId = new Map<EmployeeId, OrgEditorUnitMemberAssignment>();

  for (const assignment of configuration.assignments) {
    assignmentByEmployeeId.set(assignment.employeeId, {
      employeeId: assignment.employeeId,
      position: assignment.position?.trim() || null,
    });
  }

  const assignments = [...assignmentByEmployeeId.values()];
  const employeeIdSet = new Set(assignments.map((assignment) => assignment.employeeId));

  return {
    assignments,
    bossEmployeeId:
      configuration.bossEmployeeId !== null && employeeIdSet.has(configuration.bossEmployeeId)
        ? configuration.bossEmployeeId
        : null,
    membershipMode: "manual",
    name,
  };
};

const cloneUnit = (unit: OrgEditorUnit): OrgEditorUnit => ({
  ...unit,
  collapsed: unit.collapsed ?? false,
  employeeIds: !unit.liveFilter ? [...unit.employeeIds] : [],
  employeePositions: (unit.employeePositions ?? []).map((employeePosition) => ({
    ...employeePosition,
  })),
  liveFilter: unit.liveFilter ? cloneEmployeeLiveFilterRule(unit.liveFilter) : null,
  order: Number.isFinite(unit.order) ? unit.order : 0,
});

const cloneSelectedItem = (item: OrgEditorSelectedItem): OrgEditorSelectedItem => ({ ...item });

const cloneViewport = (viewport: OrgEditorCanvasViewport): OrgEditorCanvasViewport => ({
  ...viewport,
});

const cloneHistorySnapshot = (snapshot: OrgEditorHistorySnapshot): OrgEditorHistorySnapshot => ({
  layoutMode: snapshot.layoutMode,
  units: snapshot.units.map(cloneUnit),
});

const ensureStateHasCanvasShape = (state: OrgEditorState): OrgEditorState => {
  const fallbackState = createDefaultOrgEditorState();

  return {
    distributionModeUnitIds: Array.isArray(state.distributionModeUnitIds)
      ? [...new Set(state.distributionModeUnitIds)]
      : fallbackState.distributionModeUnitIds,
    selectedItems: Array.isArray(state.selectedItems)
      ? state.selectedItems.map(cloneSelectedItem)
      : fallbackState.selectedItems,
    units: Array.isArray(state.units) ? state.units.map(cloneUnit) : fallbackState.units,
    viewport: state.viewport ? cloneViewport(state.viewport) : fallbackState.viewport,
    layoutMode: state.layoutMode ?? fallbackState.layoutMode,
  };
};

const createUnitIdMap = (units: OrgEditorUnit[]) =>
  new Map(units.map((unit) => [unit.id, unit] as const));

const getRootUnitId = (units: OrgEditorUnit[], unitId: OrgEditorUnitId) => {
  const unitById = createUnitIdMap(units);
  let currentUnit = unitById.get(unitId);
  const visitedUnitIds = new Set<OrgEditorUnitId>();

  while (currentUnit) {
    if (!currentUnit.parentId || visitedUnitIds.has(currentUnit.parentId)) {
      return currentUnit.id;
    }

    visitedUnitIds.add(currentUnit.id);
    const parentUnit = unitById.get(currentUnit.parentId);

    if (!parentUnit) {
      return currentUnit.id;
    }

    currentUnit = parentUnit;
  }

  return null;
};

const getRootUnitIdsForUnitIds = (units: OrgEditorUnit[], unitIds: Iterable<OrgEditorUnitId>) => {
  const rootUnitIds = new Set<OrgEditorUnitId>();

  for (const unitId of unitIds) {
    const rootUnitId = getRootUnitId(units, unitId);

    if (rootUnitId) {
      rootUnitIds.add(rootUnitId);
    }
  }

  return [...rootUnitIds];
};

const filterSelectedItemsForUnits = (
  selectedItems: OrgEditorSelectedItem[],
  units: OrgEditorUnit[],
) => {
  const unitById = new Map(units.map((unit) => [unit.id, unit]));

  return selectedItems.filter((item) => {
    const unit = unitById.get(item.unitId);
    if (!unit) return false;
    if (item.type === "unit") return true;

    return unit.liveFilter !== null || unit.employeeIds.includes(item.employeeId);
  });
};

const getSelectionUnitIds = (selectedItems: OrgEditorSelectedItem[]) =>
  new Set(
    selectedItems.flatMap((item) => {
      if (item.type === "unit") return [item.unitId];

      return [];
    }),
  );

const getBoundsForUnit = (unit: OrgEditorUnit): UnitBounds => {
  const bounds = getOrgEditorUnitBounds(unit);

  return {
    ...bounds,
    bottom: bounds.y + bounds.height,
    right: bounds.x + bounds.width,
  };
};

const getGroupBounds = (units: OrgEditorUnit[]): UnitBounds | null => {
  if (units.length === 0) return null;

  const unitBounds = units.map(getBoundsForUnit);
  const x = Math.min(...unitBounds.map((bounds) => bounds.x));
  const y = Math.min(...unitBounds.map((bounds) => bounds.y));
  const right = Math.max(...unitBounds.map((bounds) => bounds.right));
  const bottom = Math.max(...unitBounds.map((bounds) => bounds.bottom));
  const width = right - x;
  const height = bottom - y;

  return {
    bottom,
    height,
    right,
    width,
    x,
    y,
  };
};

const doUnitBoundsOverlap = (firstBounds: UnitBounds, secondBounds: UnitBounds) =>
  firstBounds.x < secondBounds.right + MIN_UNIT_SPACING &&
  firstBounds.right + MIN_UNIT_SPACING > secondBounds.x &&
  firstBounds.y < secondBounds.bottom + MIN_UNIT_SPACING &&
  firstBounds.bottom + MIN_UNIT_SPACING > secondBounds.y;

const shiftUnits = (units: OrgEditorUnit[], offset: { x: number; y: number }) =>
  units.map((unit) => ({
    ...unit,
    x: unit.x + offset.x,
    y: unit.y + offset.y,
  }));

const snapOffsetAwayFromZero = (value: number) =>
  (value < 0 ? Math.floor(value / ORG_EDITOR_GRID_SIZE) : Math.ceil(value / ORG_EDITOR_GRID_SIZE)) *
  ORG_EDITOR_GRID_SIZE;

const layoutRootSubtreeKeepingRootPosition = ({
  layoutMode,
  rootId,
  units,
}: {
  layoutMode: OrgEditorLayoutMode;
  rootId: OrgEditorUnitId;
  units: OrgEditorUnit[];
}) => {
  const rootUnit = units.find((unit) => unit.id === rootId);

  if (!rootUnit) return units;

  const layoutUnits = layoutOrgEditorUnits(units, layoutMode, { x: 0, y: 0 });
  const layoutRootUnit = layoutUnits.find((unit) => unit.id === rootId);

  if (!layoutRootUnit) return units;

  return shiftUnits(layoutUnits, {
    x: rootUnit.x - layoutRootUnit.x,
    y: rootUnit.y - layoutRootUnit.y,
  });
};

const avoidUnitOverlaps = ({
  movingUnits,
  staticUnits,
}: {
  movingUnits: OrgEditorUnit[];
  staticUnits: OrgEditorUnit[];
}) => {
  let nextMovingUnits = snapOrgEditorUnits(movingUnits);

  for (let iteration = 0; iteration < 80; iteration += 1) {
    const movingBounds = getGroupBounds(nextMovingUnits);
    if (!movingBounds) return nextMovingUnits;

    const overlappingStaticBounds = staticUnits
      .map(getBoundsForUnit)
      .find((staticBounds) => doUnitBoundsOverlap(movingBounds, staticBounds));

    if (!overlappingStaticBounds) return nextMovingUnits;

    const candidateOffsets = [
      {
        x: overlappingStaticBounds.x - movingBounds.right - MIN_UNIT_SPACING,
        y: 0,
      },
      {
        x: overlappingStaticBounds.right + MIN_UNIT_SPACING - movingBounds.x,
        y: 0,
      },
      {
        x: 0,
        y: overlappingStaticBounds.y - movingBounds.bottom - MIN_UNIT_SPACING,
      },
      {
        x: 0,
        y: overlappingStaticBounds.bottom + MIN_UNIT_SPACING - movingBounds.y,
      },
    ].sort((firstOffset, secondOffset) => {
      const firstDistance = Math.abs(firstOffset.x) + Math.abs(firstOffset.y);
      const secondDistance = Math.abs(secondOffset.x) + Math.abs(secondOffset.y);

      return firstDistance - secondDistance;
    });

    const candidateOffset = candidateOffsets[0] ?? { x: 0, y: 0 };
    nextMovingUnits = shiftUnits(nextMovingUnits, {
      x: snapOffsetAwayFromZero(candidateOffset.x),
      y: snapOffsetAwayFromZero(candidateOffset.y),
    });
  }

  return nextMovingUnits;
};

const areEmployeeIdsEqual = (firstIds: EmployeeId[], secondIds: EmployeeId[]) => {
  if (firstIds.length !== secondIds.length) return false;

  return firstIds.every((employeeId, index) => employeeId === secondIds[index]);
};

const areEmployeePositionsEqual = (
  firstPositions: OrgEditorEmployeePosition[],
  secondPositions: OrgEditorEmployeePosition[],
) => {
  if (firstPositions.length !== secondPositions.length) return false;

  return firstPositions.every((firstPosition, index) => {
    const secondPosition = secondPositions[index];

    return (
      secondPosition !== undefined &&
      firstPosition.employeeId === secondPosition.employeeId &&
      firstPosition.position === secondPosition.position
    );
  });
};

const areUnitsEqual = (firstUnits: OrgEditorUnit[], secondUnits: OrgEditorUnit[]) => {
  if (firstUnits.length !== secondUnits.length) return false;

  return firstUnits.every((firstUnit, index) => {
    const secondUnit = secondUnits[index];
    if (!secondUnit) return false;

    return (
      firstUnit.id === secondUnit.id &&
      firstUnit.parentId === secondUnit.parentId &&
      firstUnit.name === secondUnit.name &&
      firstUnit.noteMarkdown === secondUnit.noteMarkdown &&
      firstUnit.order === secondUnit.order &&
      firstUnit.x === secondUnit.x &&
      firstUnit.y === secondUnit.y &&
      firstUnit.bossEmployeeId === secondUnit.bossEmployeeId &&
      firstUnit.collapsed === secondUnit.collapsed &&
      firstUnit.createdAt === secondUnit.createdAt &&
      firstUnit.updatedAt === secondUnit.updatedAt &&
      JSON.stringify(firstUnit.liveFilter) === JSON.stringify(secondUnit.liveFilter) &&
      areEmployeeIdsEqual(firstUnit.employeeIds, secondUnit.employeeIds) &&
      areEmployeePositionsEqual(firstUnit.employeePositions, secondUnit.employeePositions)
    );
  });
};

const areHistorySnapshotsEqual = (
  firstSnapshot: OrgEditorHistorySnapshot,
  secondSnapshot: OrgEditorHistorySnapshot,
) =>
  firstSnapshot.layoutMode === secondSnapshot.layoutMode &&
  areUnitsEqual(firstSnapshot.units, secondSnapshot.units);

export class OrgEditorStore {
  units: OrgEditorUnit[] = [];
  distributionModeUnitIds: OrgEditorUnitId[] = [];
  selectedItems: OrgEditorSelectedItem[] = [];
  viewport: OrgEditorCanvasViewport = createDefaultOrgEditorState().viewport;
  layoutMode: OrgEditorLayoutMode = createDefaultOrgEditorState().layoutMode;
  localClipboard: OrgEditorClipboard | null = null;
  undoStack: OrgEditorCommand[] = [];
  redoStack: OrgEditorCommand[] = [];
  resolvedLiveEmployeeIdsByUnitId = new Map<OrgEditorUnitId, EmployeeId[]>();
  commandDepth = 0;
  readonly onDocumentChange: (() => void) | undefined;
  readonly clipboardController: OrgEditorClipboardController | undefined;
  readonly viewId: ViewId | null;

  constructor(
    onDocumentChange?: () => void,
    clipboardController?: OrgEditorClipboardController,
    viewId: ViewId | null = null,
  ) {
    this.loadState(createDefaultOrgEditorState());
    this.onDocumentChange = onDocumentChange;
    this.clipboardController = clipboardController;
    this.viewId = viewId;
    makeAutoObservable(
      this,
      {
        clipboardController: false,
        commandDepth: false,
        distributionModeUnitIds: observable.shallow,
        localClipboard: observable.ref,
        onDocumentChange: false,
        redoStack: observable.shallow,
        resolvedLiveEmployeeIdsByUnitId: observable.shallow,
        selectedItems: observable.shallow,
        undoStack: observable.shallow,
        units: observable.shallow,
        viewport: observable.ref,
        viewId: false,
      },
      { autoBind: true },
    );
  }

  get selectedUnitIds() {
    return getSelectionUnitIds(this.selectedItems);
  }

  get clipboard() {
    return this.clipboardController?.get() ?? this.localClipboard;
  }

  private setClipboard(clipboard: OrgEditorClipboard | null): void {
    if (this.clipboardController) {
      this.clipboardController.set(clipboard);
    } else {
      this.localClipboard = clipboard;
    }
  }

  get firstSelectedUnit() {
    const firstSelectedUnitId = this.selectedItems.find((item) => item.type === "unit")?.unitId;

    if (!firstSelectedUnitId) return null;

    return this.units.find((unit) => unit.id === firstSelectedUnitId) ?? null;
  }

  get canPaste() {
    return Boolean(
      this.clipboard && (this.clipboard.units.length > 0 || this.clipboard.employeeIds.length > 0),
    );
  }

  get hasClipboardUnits() {
    return Boolean(this.clipboard && this.clipboard.units.length > 0);
  }

  get hasClipboardEmployees() {
    return Boolean(this.clipboard && this.clipboard.employeeIds.length > 0);
  }

  get canUndo() {
    return this.undoStack.length > 0;
  }

  get canRedo() {
    return this.redoStack.length > 0;
  }

  getUnitEmployeeIds(unitId: OrgEditorUnitId): EmployeeId[] {
    const unit = this.units.find((candidate) => candidate.id === unitId);
    if (!unit) return [];

    return unit.liveFilter === null
      ? unit.employeeIds
      : (this.resolvedLiveEmployeeIdsByUnitId.get(unitId) ?? []);
  }

  synchronizeLiveResolution(employeeIdsByUnitId: ReadonlyMap<OrgEditorUnitId, EmployeeId[]>): void {
    this.resolvedLiveEmployeeIdsByUnitId = new Map(
      [...employeeIdsByUnitId].map(([unitId, employeeIds]) => [unitId, [...employeeIds]]),
    );
    const now = new Date().toISOString();
    this.units = this.units.map((unit) => {
      if (
        unit.liveFilter === null ||
        unit.bossEmployeeId === null ||
        (employeeIdsByUnitId.get(unit.id) ?? []).includes(unit.bossEmployeeId)
      ) {
        return unit;
      }

      return { ...unit, bossEmployeeId: null, updatedAt: now };
    });
  }

  createState(): OrgEditorState {
    return {
      distributionModeUnitIds: [...this.distributionModeUnitIds],
      selectedItems: this.selectedItems.map(cloneSelectedItem),
      units: this.units.map(cloneUnit),
      viewport: cloneViewport(this.viewport),
      layoutMode: this.layoutMode,
    };
  }

  loadState(state: OrgEditorState): void {
    const nextState = ensureStateHasCanvasShape(state);

    this.units = nextState.units;
    this.distributionModeUnitIds = nextState.distributionModeUnitIds.filter((unitId) =>
      nextState.units.some((unit) => unit.id === unitId),
    );
    this.viewport = nextState.viewport;
    this.layoutMode = nextState.layoutMode;
    this.selectedItems = filterSelectedItemsForUnits(nextState.selectedItems, nextState.units);
    this.resolvedLiveEmployeeIdsByUnitId = new Map();
    this.clearHistory();
    this.onDocumentChange?.();
  }

  reset(): void {
    this.loadState(createDefaultOrgEditorState());
    this.setClipboard(null);
  }

  createCommandSnapshot(): OrgEditorHistorySnapshot {
    return {
      layoutMode: this.layoutMode,
      units: this.units.map(cloneUnit),
    };
  }

  commitCommandFromSnapshot(
    before: OrgEditorHistorySnapshot,
    label: string,
    options: { mergeKey?: string } = {},
  ): void {
    const after = this.createCommandSnapshot();

    if (areHistorySnapshotsEqual(before, after)) return;

    this.pushCommand({
      after,
      before: cloneHistorySnapshot(before),
      label,
      type: "snapshot",
      ...(options.mergeKey ? { mergeKey: options.mergeKey } : {}),
    });
  }

  commitExternalCommand(label: string, command: { redo: () => void; undo: () => void }): void {
    this.pushCommand({
      label,
      redo: command.redo,
      type: "external",
      undo: command.undo,
    });
    this.onDocumentChange?.();
  }

  undo(): void {
    const command = this.undoStack.at(-1);

    if (!command) return;

    this.undoStack = this.undoStack.slice(0, -1);
    if (command.type === "snapshot") {
      this.applyHistorySnapshot(command.before);
    } else {
      command.undo();
    }
    this.redoStack = [...this.redoStack, command];
    this.onDocumentChange?.();
  }

  redo(): void {
    const command = this.redoStack.at(-1);

    if (!command) return;

    this.redoStack = this.redoStack.slice(0, -1);
    if (command.type === "snapshot") {
      this.applyHistorySnapshot(command.after);
    } else {
      command.redo();
    }
    this.undoStack = [...this.undoStack, command];
    this.onDocumentChange?.();
  }

  clearHistory(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  private pushCommand(command: OrgEditorCommand): void {
    const previousCommand = this.undoStack.at(-1);

    if (
      command.type === "snapshot" &&
      previousCommand?.type === "snapshot" &&
      command.mergeKey &&
      previousCommand.mergeKey === command.mergeKey
    ) {
      this.undoStack = [
        ...this.undoStack.slice(0, -1),
        {
          ...previousCommand,
          after: cloneHistorySnapshot(command.after),
          label: command.label,
        },
      ];
    } else {
      this.undoStack = [...this.undoStack, command].slice(-ORG_EDITOR_HISTORY_LIMIT);
    }

    this.redoStack = [];
  }

  private applyHistorySnapshot(snapshot: OrgEditorHistorySnapshot): void {
    this.units = snapshot.units.map(cloneUnit);
    this.layoutMode = snapshot.layoutMode;
    this.selectedItems = filterSelectedItemsForUnits(this.selectedItems, this.units);
    this.pruneDistributionModeUnitIds();
  }

  private pruneDistributionModeUnitIds(): void {
    const unitIds = new Set(this.units.map((unit) => unit.id));
    this.distributionModeUnitIds = this.distributionModeUnitIds.filter((unitId) =>
      unitIds.has(unitId),
    );
  }

  private realignRootSubtrees(rootIds: Iterable<OrgEditorUnitId | null>): void {
    const nextRootIds = [
      ...new Set([...rootIds].filter((rootId): rootId is OrgEditorUnitId => rootId !== null)),
    ];

    for (const rootId of nextRootIds) {
      if (!this.units.some((unit) => unit.id === rootId)) continue;

      const movingUnitIds = new Set(getOrgEditorUnitDescendantIds(this.units, rootId));
      const movingUnits = this.units.filter((unit) => movingUnitIds.has(unit.id));
      const staticUnits = this.units.filter((unit) => !movingUnitIds.has(unit.id));
      const layoutUnits = layoutRootSubtreeKeepingRootPosition({
        layoutMode: this.layoutMode,
        rootId,
        units: movingUnits,
      });
      const positionedUnits = avoidUnitOverlaps({
        movingUnits: layoutUnits,
        staticUnits,
      });
      const positionedUnitById = new Map(positionedUnits.map((unit) => [unit.id, unit] as const));

      this.units = this.units.map((unit) => positionedUnitById.get(unit.id) ?? unit);
    }
  }

  private runCommand<T>(label: string, mutate: () => T, options: { mergeKey?: string } = {}): T {
    if (this.commandDepth > 0) {
      return mutate();
    }

    const before = this.createCommandSnapshot();
    this.commandDepth += 1;
    let completed = false;

    try {
      const result = mutate();
      completed = true;
      return result;
    } finally {
      this.commandDepth -= 1;
      if (completed) {
        this.commitCommandFromSnapshot(before, label, options);
        this.onDocumentChange?.();
      }
    }
  }

  setViewport(viewport: OrgEditorCanvasViewport): void {
    this.viewport = viewport;
  }

  resetViewport(): void {
    this.viewport = createDefaultOrgEditorState().viewport;
  }

  setLayoutMode(layoutMode: OrgEditorLayoutMode): void {
    this.runCommand("Change layout direction", () => {
      this.layoutMode = layoutMode;
    });
  }

  applyLayout(layoutMode: OrgEditorLayoutMode = this.layoutMode): void {
    this.runCommand("Align Units", () => {
      this.layoutMode = layoutMode;
      this.units = avoidUnitOverlaps({
        movingUnits: layoutOrgEditorUnits(this.units, layoutMode),
        staticUnits: [],
      });
    });
  }

  applyLayoutToUnits(
    unitIds: Iterable<OrgEditorUnitId>,
    layoutMode: OrgEditorLayoutMode = this.layoutMode,
  ): void {
    const selectedUnitIds = new Set(unitIds);
    if (selectedUnitIds.size < 2) {
      this.applyLayout(layoutMode);
      return;
    }

    this.runCommand("Align selected Units", () => {
      const selectedUnits = this.units.filter((unit) => selectedUnitIds.has(unit.id));
      const selectedBounds = getGroupBounds(selectedUnits);
      if (!selectedBounds || selectedUnits.length < 2) return;

      const inducedUnits = selectedUnits.map((unit) => ({
        ...unit,
        parentId:
          unit.parentId !== null && selectedUnitIds.has(unit.parentId) ? unit.parentId : null,
      }));
      const laidOutUnits = layoutOrgEditorUnits(inducedUnits, layoutMode, { x: 0, y: 0 });
      const layoutBounds = getGroupBounds(laidOutUnits);
      if (!layoutBounds) return;

      const centeredUnits = shiftUnits(laidOutUnits, {
        x: selectedBounds.x + selectedBounds.width / 2 - (layoutBounds.x + layoutBounds.width / 2),
        y:
          selectedBounds.y + selectedBounds.height / 2 - (layoutBounds.y + layoutBounds.height / 2),
      });
      const positionedUnits = avoidUnitOverlaps({
        movingUnits: centeredUnits,
        staticUnits: this.units.filter((unit) => !selectedUnitIds.has(unit.id)),
      });
      const positionByUnitId = new Map(
        positionedUnits.map((unit) => [unit.id, { x: unit.x, y: unit.y }] as const),
      );
      const now = new Date().toISOString();

      this.layoutMode = layoutMode;
      this.units = this.units.map((unit) => {
        const position = positionByUnitId.get(unit.id);
        return position ? { ...unit, ...position, updatedAt: now } : unit;
      });
    });
  }

  clearSelection(): void {
    this.selectedItems = [];
  }

  setSelectedItems(items: OrgEditorSelectedItem[]): void {
    const nextItemsByKey = new Map<string, OrgEditorSelectedItem>();

    for (const item of items) {
      nextItemsByKey.set(createOrgEditorSelectedItemKey(item), cloneSelectedItem(item));
    }

    this.selectedItems = [...nextItemsByKey.values()];
  }

  setDistributionModeUnitIds(unitIds: readonly OrgEditorUnitId[]): void {
    const existingUnitIds = new Set(this.units.map((unit) => unit.id));
    this.distributionModeUnitIds = [
      ...new Set(unitIds.filter((unitId) => existingUnitIds.has(unitId))),
    ];
  }

  toggleUnitDistributionMode(unitId: OrgEditorUnitId): void {
    if (!this.units.some((unit) => unit.id === unitId)) return;
    this.distributionModeUnitIds = this.distributionModeUnitIds.includes(unitId)
      ? this.distributionModeUnitIds.filter((currentUnitId) => currentUnitId !== unitId)
      : [...this.distributionModeUnitIds, unitId];
  }

  selectAllUnits(): void {
    this.selectedItems = this.units.map((unit) => ({ type: "unit", unitId: unit.id }));
  }

  selectItem(item: OrgEditorSelectedItem, mode: SelectionMode = "replace"): void {
    const itemKey = createOrgEditorSelectedItemKey(item);

    if (mode === "replace") {
      this.selectedItems = [cloneSelectedItem(item)];
      return;
    }

    const existingItems = this.selectedItems.filter(
      (currentItem) => createOrgEditorSelectedItemKey(currentItem) !== itemKey,
    );
    const hasItem = existingItems.length !== this.selectedItems.length;

    if (mode === "toggle" && hasItem) {
      this.selectedItems = existingItems;
      return;
    }

    this.selectedItems = [...existingItems, cloneSelectedItem(item)];
  }

  addUnit({
    bossEmployeeId = null,
    collapsed = false,
    employeeIds = [],
    employeePositions = [],
    id,
    liveFilter = null,
    name,
    order,
    parentId = null,
    x,
    y,
  }: {
    bossEmployeeId?: EmployeeId | null;
    collapsed?: boolean;
    employeeIds?: EmployeeId[];
    employeePositions?: OrgEditorEmployeePosition[];
    id?: OrgEditorUnitId;
    liveFilter?: EmployeeLiveFilterRule | null;
    name: string;
    order?: number;
    parentId?: OrgEditorUnitId | null;
    x: number;
    y: number;
  }): OrgEditorUnitId {
    return this.runCommand("Add Unit", () => {
      const snappedPoint = snapOrgEditorPoint({ x, y });
      const unit = createOrgEditorUnitFromScratch({
        bossEmployeeId,
        collapsed,
        employeeIds,
        employeePositions,
        ...(id === undefined ? {} : { id }),
        liveFilter,
        name,
        order:
          order ??
          this.units.reduce(
            (nextOrder, currentUnit) =>
              currentUnit.parentId === parentId
                ? Math.max(nextOrder, currentUnit.order + 1)
                : nextOrder,
            0,
          ),
        parentId,
        x: snappedPoint.x,
        y: snappedPoint.y,
      });
      if (unit.liveFilter) {
        validateEmployeeLiveFilterRule({
          rule: unit.liveFilter,
          unitId: unit.id,
          units: this.units,
        });
      }
      const positionedUnit =
        parentId === null
          ? avoidUnitOverlaps({
              movingUnits: [unit],
              staticUnits: this.units,
            })[0]
          : unit;

      this.units = [...this.units, positionedUnit ?? unit];
      if (parentId !== null) {
        this.realignRootSubtrees(getRootUnitIdsForUnitIds(this.units, [parentId]));
      }
      this.selectedItems = [{ type: "unit", unitId: (positionedUnit ?? unit).id }];

      return (positionedUnit ?? unit).id;
    });
  }

  addConfiguredUnit({
    configuration,
    parentId = null,
    x,
    y,
  }: {
    configuration: OrgEditorUnitConfiguration;
    parentId?: OrgEditorUnitId | null;
    x: number;
    y: number;
  }): OrgEditorUnitId {
    const normalizedConfiguration = normalizeUnitConfiguration(configuration);

    return this.addUnit({
      bossEmployeeId: normalizedConfiguration.bossEmployeeId,
      employeeIds:
        normalizedConfiguration.membershipMode === "manual"
          ? normalizedConfiguration.assignments.map((assignment) => assignment.employeeId)
          : [],
      employeePositions:
        normalizedConfiguration.membershipMode === "manual"
          ? normalizedConfiguration.assignments
              .filter((assignment) => assignment.position !== null)
              .map((assignment) => ({
                employeeId: assignment.employeeId,
                position: assignment.position,
              }))
          : normalizedConfiguration.positionOverrides,
      liveFilter:
        normalizedConfiguration.membershipMode === "live"
          ? normalizedConfiguration.liveFilter
          : null,
      name: normalizedConfiguration.name,
      parentId,
      x,
      y,
    });
  }

  addUnits(units: OrgEditorUnit[], selectUnitIds: OrgEditorUnitId[] = []): OrgEditorUnit[] {
    if (units.length === 0) return [];

    return this.runCommand("Add Units", () => {
      const positionedUnits = avoidUnitOverlaps({
        movingUnits: units.map(cloneUnit),
        staticUnits: this.units,
      });

      this.units = [...this.units, ...positionedUnits];
      this.selectedItems = selectUnitIds.map((unitId) => ({ type: "unit", unitId }));

      return positionedUnits;
    });
  }

  configureUnit(unitId: OrgEditorUnitId, configuration: OrgEditorUnitConfiguration): void {
    const normalizedConfiguration = normalizeUnitConfiguration(configuration);
    const currentUnit = this.units.find((unit) => unit.id === unitId);

    if (!currentUnit) throw new LocalizedError(uiMessage("Unit not found."));
    if (normalizedConfiguration.membershipMode === "live") {
      validateEmployeeLiveFilterRule({
        rule: normalizedConfiguration.liveFilter,
        unitId,
        units: this.units,
      });
    }

    this.runCommand("Edit Unit", () => {
      const now = new Date().toISOString();
      const employeeIds =
        normalizedConfiguration.membershipMode === "manual"
          ? normalizedConfiguration.assignments.map((assignment) => assignment.employeeId)
          : [];
      const employeePositions =
        normalizedConfiguration.membershipMode === "manual"
          ? normalizedConfiguration.assignments
              .filter((assignment) => assignment.position !== null)
              .map((assignment) => ({
                employeeId: assignment.employeeId,
                position: assignment.position,
              }))
          : normalizedConfiguration.positionOverrides;

      this.units = this.units.map((unit) =>
        unit.id === unitId
          ? {
              ...unit,
              bossEmployeeId: normalizedConfiguration.bossEmployeeId,
              employeeIds,
              employeePositions,
              liveFilter:
                normalizedConfiguration.membershipMode === "live"
                  ? cloneEmployeeLiveFilterRule(normalizedConfiguration.liveFilter)
                  : null,
              name: normalizedConfiguration.name,
              updatedAt: now,
            }
          : unit,
      );
      this.realignRootSubtrees(getRootUnitIdsForUnitIds(this.units, [unitId]));
    });
  }

  setUnitNoteMarkdown(unitId: OrgEditorUnitId, source: string): void {
    const noteMarkdown = normalizeOrgEditorUnitNoteMarkdown(source);
    if (noteMarkdown === null) {
      throw new LocalizedError(uiMessage("Unit notes can contain at most 64 KiB."));
    }
    const currentUnit = this.units.find((unit) => unit.id === unitId);
    if (!currentUnit) throw new LocalizedError(uiMessage("Unit not found."));
    if (currentUnit.noteMarkdown === noteMarkdown) return;

    this.runCommand("Edit Unit note", () => {
      const updatedAt = new Date().toISOString();
      this.units = this.units.map((unit) =>
        unit.id === unitId ? { ...unit, noteMarkdown, updatedAt } : unit,
      );
    });
  }

  moveUnits(unitIds: Iterable<OrgEditorUnitId>, delta: { x: number; y: number }): void {
    this.runCommand("Move Units", () => {
      const movableUnitIds = new Set(unitIds);

      if (movableUnitIds.size === 0) return;

      this.units = this.units.map((unit) => {
        if (!movableUnitIds.has(unit.id)) return unit;

        return snapOrgEditorPoint({
          ...unit,
          updatedAt: new Date().toISOString(),
          x: unit.x + delta.x,
          y: unit.y + delta.y,
        });
      });
    });
  }

  moveSelectedUnits(delta: { x: number; y: number }): void {
    this.moveUnits(this.selectedUnitIds, delta);
  }

  moveUnitsFromPositions(
    positions: OrgEditorUnitPosition[],
    delta: { x: number; y: number },
  ): void {
    const positionByUnitId = new Map(positions.map((position) => [position.unitId, position]));

    if (positionByUnitId.size === 0) return;

    const movingUnitIds = new Set(positionByUnitId.keys());
    const candidateUnits = this.units.map((unit) => {
      const startPosition = positionByUnitId.get(unit.id);

      if (!startPosition) return unit;

      return {
        ...unit,
        x: startPosition.x + delta.x,
        y: startPosition.y + delta.y,
      };
    });
    const movedUnits = candidateUnits
      .filter((unit) => movingUnitIds.has(unit.id))
      .map(snapOrgEditorPoint);
    const staticUnits = candidateUnits.filter((unit) => !movingUnitIds.has(unit.id));
    const positionedMovedUnits = avoidUnitOverlaps({
      movingUnits: movedUnits,
      staticUnits,
    });
    const positionedMovedUnitById = new Map(
      positionedMovedUnits.map((unit) => [unit.id, unit] as const),
    );
    const now = new Date().toISOString();

    this.units = candidateUnits.map((unit) =>
      movingUnitIds.has(unit.id)
        ? {
            ...(positionedMovedUnitById.get(unit.id) ?? unit),
            updatedAt: now,
          }
        : unit,
    );
  }

  setUnitsCollapsed(
    unitIds: Iterable<OrgEditorUnitId>,
    collapsed: boolean,
    options: { includeDescendants?: boolean } = {},
  ): void {
    this.runCommand(collapsed ? "Collapse Units" : "Expand Units", () => {
      const targetUnitIds = new Set<OrgEditorUnitId>();

      for (const unitId of unitIds) {
        targetUnitIds.add(unitId);

        if (options.includeDescendants) {
          for (const descendantUnitId of getOrgEditorUnitDescendantIds(this.units, unitId)) {
            targetUnitIds.add(descendantUnitId);
          }
        }
      }

      if (targetUnitIds.size === 0) return;

      const changedUnitIds = this.units
        .filter((unit) => targetUnitIds.has(unit.id) && unit.collapsed !== collapsed)
        .map((unit) => unit.id);

      if (changedUnitIds.length === 0) return;

      const changedUnitIdSet = new Set(changedUnitIds);
      const now = new Date().toISOString();

      this.units = this.units.map((unit) =>
        changedUnitIdSet.has(unit.id)
          ? {
              ...unit,
              collapsed,
              updatedAt: now,
            }
          : unit,
      );
      this.realignRootSubtrees(getRootUnitIdsForUnitIds(this.units, changedUnitIds));
    });
  }

  setUnitParent(unitId: OrgEditorUnitId, parentId: OrgEditorUnitId | null): void {
    this.runCommand("Change Unit parent", () => {
      const unit = this.units.find((candidateUnit) => candidateUnit.id === unitId);

      if (!unit || unit.parentId === parentId || unitId === parentId) return;
      if (parentId && !this.units.some((candidateUnit) => candidateUnit.id === parentId)) return;

      if (parentId) {
        const descendantUnitIds = new Set(getOrgEditorUnitDescendantIds(this.units, unitId));

        if (descendantUnitIds.has(parentId)) return;
      }

      const now = new Date().toISOString();
      const previousRootUnitId = getRootUnitId(this.units, unitId);
      const nextOrder = this.units.reduce(
        (order, candidateUnit) =>
          candidateUnit.id !== unitId && candidateUnit.parentId === parentId
            ? Math.max(order, candidateUnit.order + 1)
            : order,
        0,
      );

      this.units = this.units.map((candidateUnit) =>
        candidateUnit.id === unitId
          ? {
              ...candidateUnit,
              order: nextOrder,
              parentId,
              updatedAt: now,
            }
          : candidateUnit,
      );
      const nextRootUnitId = getRootUnitId(this.units, unitId);

      this.realignRootSubtrees([nextRootUnitId, previousRootUnitId]);
      this.selectedItems = [{ type: "unit", unitId }];
    });
  }

  addEmployeesToUnit(unitId: OrgEditorUnitId, employeeIds: Iterable<EmployeeId>): void {
    this.runCommand("Add Employees", () => {
      if (this.units.find((unit) => unit.id === unitId)?.liveFilter !== null) return;
      const nextEmployeeIds = [...employeeIds];

      if (nextEmployeeIds.length === 0) return;

      let changed = false;
      this.units = this.units.map((unit) => {
        if (unit.id !== unitId) return unit;

        const nextUnitEmployeeIds = [...new Set([...unit.employeeIds, ...nextEmployeeIds])];
        const unitChanged =
          unit.collapsed || nextUnitEmployeeIds.length !== unit.employeeIds.length;

        if (!unitChanged) return unit;

        changed = true;

        return {
          ...unit,
          collapsed: false,
          employeeIds: nextUnitEmployeeIds,
          updatedAt: new Date().toISOString(),
        };
      });
      if (changed) {
        this.realignRootSubtrees(getRootUnitIdsForUnitIds(this.units, [unitId]));
      }
    });
  }

  setEmployeeAssignments(employeeId: EmployeeId, assignments: OrgEditorEmployeeAssignment[]): void {
    this.runCommand("Update Employee assignments", () => {
      this.applyEmployeeAssignments(employeeId, assignments);
    });
  }

  purgeEmployeeReferences(employeeId: EmployeeId): void {
    this.runCommand("Remove Employee assignments", () => {
      const affectedUnitIds: OrgEditorUnitId[] = [];
      const now = new Date().toISOString();

      this.units = this.units.map((unit) => {
        const hasReference =
          unit.employeeIds.includes(employeeId) ||
          unit.bossEmployeeId === employeeId ||
          unit.employeePositions.some((position) => position.employeeId === employeeId);
        if (!hasReference) return unit;

        affectedUnitIds.push(unit.id);
        return {
          ...unit,
          bossEmployeeId: unit.bossEmployeeId === employeeId ? null : unit.bossEmployeeId,
          employeeIds: unit.employeeIds.filter(
            (currentEmployeeId) => currentEmployeeId !== employeeId,
          ),
          employeePositions: unit.employeePositions.filter(
            (position) => position.employeeId !== employeeId,
          ),
          updatedAt: now,
        };
      });
      this.selectedItems = this.selectedItems.filter(
        (item) => item.type !== "employee" || item.employeeId !== employeeId,
      );
      this.realignRootSubtrees(getRootUnitIdsForUnitIds(this.units, affectedUnitIds));
    });
  }

  rekeyEmployeeReferences(
    previousEmployeeId: EmployeeId,
    nextEmployeeId: EmployeeId,
    notify = true,
  ): void {
    if (previousEmployeeId === nextEmployeeId) return;
    const replace = (employeeId: EmployeeId) =>
      employeeId === previousEmployeeId ? nextEmployeeId : employeeId;
    this.units = this.units.map((unit) => ({
      ...unit,
      bossEmployeeId:
        unit.bossEmployeeId === previousEmployeeId ? nextEmployeeId : unit.bossEmployeeId,
      employeeIds: unit.employeeIds.map(replace),
      employeePositions: unit.employeePositions.map((position) => ({
        ...position,
        employeeId: replace(position.employeeId),
      })),
    }));
    this.selectedItems = this.selectedItems.map((item) =>
      item.type === "employee" && item.employeeId === previousEmployeeId
        ? { ...item, employeeId: nextEmployeeId }
        : item,
    );
    if (this.clipboard) {
      this.setClipboard({
        ...this.clipboard,
        employeeIds: this.clipboard.employeeIds.map(replace),
        resolvedEmployeeIdsByUnitId: new Map(
          [...this.clipboard.resolvedEmployeeIdsByUnitId].map(([unitId, employeeIds]) => [
            unitId,
            employeeIds.map(replace),
          ]),
        ),
        units: this.clipboard.units.map((unit) => ({
          ...unit,
          bossEmployeeId:
            unit.bossEmployeeId === previousEmployeeId ? nextEmployeeId : unit.bossEmployeeId,
          employeeIds: unit.employeeIds.map(replace),
          employeePositions: unit.employeePositions.map((position) => ({
            ...position,
            employeeId: replace(position.employeeId),
          })),
        })),
      });
    }
    if (notify) this.onDocumentChange?.();
  }

  private applyEmployeeAssignments(
    employeeId: EmployeeId,
    assignments: OrgEditorEmployeeAssignment[],
  ): void {
    const assignmentByUnitId = new Map(
      assignments.map((assignment) => [assignment.unitId, assignment]),
    );
    const affectedUnitIds: OrgEditorUnitId[] = [];
    const now = new Date().toISOString();

    this.units = this.units.map((unit) => {
      if (unit.liveFilter !== null) return unit;
      const assignment = assignmentByUnitId.get(unit.id);
      const hasEmployee = unit.employeeIds.includes(employeeId);
      const isBoss = unit.bossEmployeeId === employeeId;
      const currentPosition =
        unit.employeePositions.find(
          (employeePosition) => employeePosition.employeeId === employeeId,
        )?.position ?? null;

      if (!assignment) {
        if (!hasEmployee && !isBoss && currentPosition === null) return unit;

        affectedUnitIds.push(unit.id);
        return {
          ...unit,
          bossEmployeeId: isBoss ? null : unit.bossEmployeeId,
          employeeIds: unit.employeeIds.filter(
            (currentEmployeeId) => currentEmployeeId !== employeeId,
          ),
          employeePositions: unit.employeePositions.filter(
            (employeePosition) => employeePosition.employeeId !== employeeId,
          ),
          updatedAt: now,
        };
      }

      const nextBossEmployeeId = assignment.isBoss
        ? employeeId
        : isBoss
          ? null
          : unit.bossEmployeeId;
      const nextEmployeeIds = hasEmployee ? unit.employeeIds : [...unit.employeeIds, employeeId];
      const nextPosition = assignment.position?.trim() || null;
      const nextEmployeePositions = [
        ...unit.employeePositions.filter(
          (employeePosition) => employeePosition.employeeId !== employeeId,
        ),
        ...(nextPosition ? [{ employeeId, position: nextPosition }] : []),
      ];

      if (
        hasEmployee &&
        nextBossEmployeeId === unit.bossEmployeeId &&
        currentPosition === nextPosition &&
        unit.collapsed === false
      ) {
        return unit;
      }

      affectedUnitIds.push(unit.id);
      return {
        ...unit,
        bossEmployeeId: nextBossEmployeeId,
        collapsed: false,
        employeeIds: nextEmployeeIds,
        employeePositions: nextEmployeePositions,
        updatedAt: now,
      };
    });

    this.realignRootSubtrees(getRootUnitIdsForUnitIds(this.units, affectedUnitIds));
  }

  setUnitBoss(unitId: OrgEditorUnitId, employeeId: EmployeeId | null): void {
    this.runCommand(employeeId === null ? "Remove boss" : "Assign boss", () => {
      this.units = this.units.map((unit) => {
        if (unit.id !== unitId) return unit;
        if (
          unit.liveFilter !== null &&
          employeeId !== null &&
          !(this.resolvedLiveEmployeeIdsByUnitId.get(unitId) ?? []).includes(employeeId)
        ) {
          return unit;
        }

        return {
          ...unit,
          bossEmployeeId: employeeId,
          employeeIds:
            employeeId === null || unit.liveFilter !== null
              ? unit.employeeIds
              : [...new Set([...unit.employeeIds, employeeId])],
          updatedAt: new Date().toISOString(),
        };
      });
    });
  }

  moveEmployeesToUnit(items: OrgEditorSelectedItem[], targetUnitId: OrgEditorUnitId): void {
    const targetUnit = this.units.find((unit) => unit.id === targetUnitId);
    const employeeItems = items.filter(
      (item): item is Extract<OrgEditorSelectedItem, { type: "employee" }> =>
        item.type === "employee",
    );
    if (
      targetUnit?.liveFilter !== null ||
      employeeItems.some(
        (item) => this.units.find((unit) => unit.id === item.unitId)?.liveFilter !== null,
      )
    ) {
      return;
    }

    this.runCommand("Move Employees", () => {
      const employeesBySourceUnitId = new Map<OrgEditorUnitId, Set<EmployeeId>>();

      for (const item of items) {
        if (item.type !== "employee") continue;
        if (item.unitId === targetUnitId) continue;
        if (this.units.find((unit) => unit.id === item.unitId)?.liveFilter !== null) continue;

        const employeeIds = employeesBySourceUnitId.get(item.unitId) ?? new Set<EmployeeId>();

        employeeIds.add(item.employeeId);
        employeesBySourceUnitId.set(item.unitId, employeeIds);
      }

      if (employeesBySourceUnitId.size === 0) return;

      const targetEmployeeIds = new Set<EmployeeId>();
      const movedPositionByEmployeeId = new Map<EmployeeId, OrgEditorEmployeePosition>();
      const movedBossEmployeeIds = new Set<EmployeeId>();
      for (const employeeIds of employeesBySourceUnitId.values()) {
        for (const employeeId of employeeIds) {
          targetEmployeeIds.add(employeeId);
        }
      }
      for (const [sourceUnitId, employeeIds] of employeesBySourceUnitId) {
        const sourceUnit = this.units.find((unit) => unit.id === sourceUnitId);

        if (
          sourceUnit?.bossEmployeeId !== null &&
          sourceUnit?.bossEmployeeId !== undefined &&
          employeeIds.has(sourceUnit.bossEmployeeId)
        ) {
          movedBossEmployeeIds.add(sourceUnit.bossEmployeeId);
        }
        for (const employeePosition of sourceUnit?.employeePositions ?? []) {
          if (
            employeeIds.has(employeePosition.employeeId) &&
            !movedPositionByEmployeeId.has(employeePosition.employeeId)
          ) {
            movedPositionByEmployeeId.set(employeePosition.employeeId, employeePosition);
          }
        }
      }

      this.units = this.units.map((unit) => {
        const removableEmployeeIds = employeesBySourceUnitId.get(unit.id);

        if (unit.id === targetUnitId) {
          const existingPositionEmployeeIds = new Set(
            unit.employeePositions.map((employeePosition) => employeePosition.employeeId),
          );
          const transferableBossEmployeeId =
            unit.bossEmployeeId === null
              ? ([...targetEmployeeIds].find((employeeId) =>
                  movedBossEmployeeIds.has(employeeId),
                ) ?? null)
              : null;

          return {
            ...unit,
            bossEmployeeId: unit.bossEmployeeId ?? transferableBossEmployeeId,
            collapsed: false,
            employeeIds: [...new Set([...unit.employeeIds, ...targetEmployeeIds])],
            employeePositions: [
              ...unit.employeePositions,
              ...[...movedPositionByEmployeeId.values()].filter(
                (employeePosition) => !existingPositionEmployeeIds.has(employeePosition.employeeId),
              ),
            ],
            updatedAt: new Date().toISOString(),
          };
        }

        if (!removableEmployeeIds) return unit;

        return {
          ...unit,
          bossEmployeeId:
            unit.bossEmployeeId !== null && removableEmployeeIds.has(unit.bossEmployeeId)
              ? null
              : unit.bossEmployeeId,
          employeeIds: unit.employeeIds.filter(
            (employeeId) => !removableEmployeeIds.has(employeeId),
          ),
          employeePositions: unit.employeePositions.filter(
            (employeePosition) => !removableEmployeeIds.has(employeePosition.employeeId),
          ),
          updatedAt: new Date().toISOString(),
        };
      });
      this.selectedItems = [...targetEmployeeIds].map((employeeId) => ({
        employeeId,
        type: "employee",
        unitId: targetUnitId,
      }));
      this.realignRootSubtrees(
        getRootUnitIdsForUnitIds(this.units, [targetUnitId, ...employeesBySourceUnitId.keys()]),
      );
    });
  }

  deleteSelected(): void {
    this.runCommand("Delete selection", () => {
      const selectedUnitIds = this.selectedUnitIds;
      const deletedUnitIds = new Set<OrgEditorUnitId>();
      const resolvedEmployeeIdsByUnitId = new Map(
        this.units.map((unit) => [unit.id, [...this.getUnitEmployeeIds(unit.id)]] as const),
      );

      for (const unitId of selectedUnitIds) {
        for (const deletedUnitId of getOrgEditorUnitDescendantIds(this.units, unitId)) {
          deletedUnitIds.add(deletedUnitId);
        }
      }

      const affectedRootUnitIds = new Set<OrgEditorUnitId>();
      for (const unitId of selectedUnitIds) {
        const unit = this.units.find((candidateUnit) => candidateUnit.id === unitId);
        if (!unit?.parentId || deletedUnitIds.has(unit.parentId)) continue;

        const rootUnitId = getRootUnitId(this.units, unit.parentId);
        if (rootUnitId) affectedRootUnitIds.add(rootUnitId);
      }

      const removableEmployeesByUnitId = new Map<OrgEditorUnitId, Set<EmployeeId>>();
      for (const item of this.selectedItems) {
        if (item.type !== "employee" || deletedUnitIds.has(item.unitId)) continue;
        if (this.units.find((unit) => unit.id === item.unitId)?.liveFilter !== null) continue;

        const employeeIds = removableEmployeesByUnitId.get(item.unitId) ?? new Set<EmployeeId>();
        employeeIds.add(item.employeeId);
        removableEmployeesByUnitId.set(item.unitId, employeeIds);

        const rootUnitId = getRootUnitId(this.units, item.unitId);
        if (rootUnitId) affectedRootUnitIds.add(rootUnitId);
      }

      const now = new Date().toISOString();
      this.units = this.units
        .filter((unit) => !deletedUnitIds.has(unit.id))
        .map((unit) => {
          const removableEmployeeIds = removableEmployeesByUnitId.get(unit.id);
          const materializeLiveUnit = Boolean(
            unit.liveFilter?.selectedUnitIds.some((unitId) => deletedUnitIds.has(unitId)),
          );
          const materializedEmployeeIds = materializeLiveUnit
            ? (resolvedEmployeeIdsByUnitId.get(unit.id) ?? [])
            : unit.employeeIds;

          if (!removableEmployeeIds && !materializeLiveUnit) return unit;

          return {
            ...unit,
            bossEmployeeId:
              unit.bossEmployeeId !== null &&
              (removableEmployeeIds?.has(unit.bossEmployeeId) ||
                (materializeLiveUnit && !materializedEmployeeIds.includes(unit.bossEmployeeId)))
                ? null
                : unit.bossEmployeeId,
            employeeIds: materializedEmployeeIds.filter(
              (employeeId) => !removableEmployeeIds?.has(employeeId),
            ),
            employeePositions: unit.employeePositions.filter(
              (employeePosition) =>
                materializedEmployeeIds.includes(employeePosition.employeeId) &&
                !removableEmployeeIds?.has(employeePosition.employeeId),
            ),
            liveFilter: materializeLiveUnit ? null : unit.liveFilter,
            updatedAt: now,
          };
        });
      this.realignRootSubtrees(affectedRootUnitIds);
      this.selectedItems = [];
      this.pruneDistributionModeUnitIds();
    });
  }

  copySelected(): void {
    const selectedUnitIds = this.selectedUnitIds;
    const copiedUnitIds = new Set<OrgEditorUnitId>();
    const unitsById = createUnitIdMap(this.units);

    for (const unitId of selectedUnitIds) {
      for (const copiedUnitId of getOrgEditorUnitDescendantIds(this.units, unitId)) {
        copiedUnitIds.add(copiedUnitId);
      }
    }

    const selectedEmployeeIds = new Set<EmployeeId>();
    for (const item of this.selectedItems) {
      if (
        item.type === "employee" &&
        !copiedUnitIds.has(item.unitId) &&
        this.units.find((unit) => unit.id === item.unitId)?.liveFilter === null
      ) {
        selectedEmployeeIds.add(item.employeeId);
      }
    }

    this.setClipboard({
      employeeIds: [...selectedEmployeeIds],
      resolvedEmployeeIdsByUnitId: new Map(
        [...copiedUnitIds].map((unitId) => [unitId, [...this.getUnitEmployeeIds(unitId)]]),
      ),
      sourceViewId: this.viewId,
      units: [...copiedUnitIds]
        .map((unitId) => unitsById.get(unitId))
        .filter((unit): unit is OrgEditorUnit => Boolean(unit))
        .map(cloneUnit),
    });
  }

  pasteAt(point: { x: number; y: number }): void {
    if (!this.clipboard) return;

    this.runCommand("Paste", () => {
      if (!this.clipboard) return;

      const pastedUnits: OrgEditorUnit[] = [];
      const unitIdMap = new Map<OrgEditorUnitId, OrgEditorUnitId>();
      const isCrossViewPaste =
        this.clipboard.sourceViewId !== null && this.clipboard.sourceViewId !== this.viewId;
      const unitBounds = this.clipboard.units.map(getOrgEditorUnitBounds);
      const copiedBounds =
        unitBounds.length > 0
          ? {
              maxX: Math.max(...unitBounds.map((bounds) => bounds.x + bounds.width)),
              maxY: Math.max(...unitBounds.map((bounds) => bounds.y + bounds.height)),
              minX: Math.min(...unitBounds.map((bounds) => bounds.x)),
              minY: Math.min(...unitBounds.map((bounds) => bounds.y)),
            }
          : null;
      const offset = copiedBounds
        ? {
            x: point.x - (copiedBounds.minX + (copiedBounds.maxX - copiedBounds.minX) / 2),
            y: point.y - (copiedBounds.minY + (copiedBounds.maxY - copiedBounds.minY) / 2),
          }
        : { x: 0, y: 0 };

      for (const unit of this.clipboard.units) {
        unitIdMap.set(unit.id, createOrgEditorUnitFromScratch({ name: unit.name, x: 0, y: 0 }).id);
      }

      for (const unit of this.clipboard.units) {
        const nextUnitId = unitIdMap.get(unit.id);
        if (!nextUnitId) continue;
        const nextParentId = unit.parentId ? (unitIdMap.get(unit.parentId) ?? null) : null;
        const hasExternalLiveDependency = Boolean(
          isCrossViewPaste &&
            unit.liveFilter?.selectedUnitIds.some((unitId) => !unitIdMap.has(unitId)),
        );
        const materializedEmployeeIds = hasExternalLiveDependency
          ? [...(this.clipboard.resolvedEmployeeIdsByUnitId.get(unit.id) ?? [])]
          : unit.employeeIds;

        pastedUnits.push({
          ...cloneUnit(unit),
          createdAt: new Date().toISOString(),
          id: nextUnitId,
          order:
            nextParentId === null
              ? this.units.reduce(
                  (nextOrder, currentUnit) =>
                    currentUnit.parentId === null
                      ? Math.max(nextOrder, currentUnit.order + 1)
                      : nextOrder,
                  0,
                ) + pastedUnits.filter((candidate) => candidate.parentId === null).length
              : unit.order,
          bossEmployeeId: hasExternalLiveDependency
            ? unit.bossEmployeeId !== null && materializedEmployeeIds.includes(unit.bossEmployeeId)
              ? unit.bossEmployeeId
              : null
            : unit.bossEmployeeId,
          employeeIds: materializedEmployeeIds,
          employeePositions: hasExternalLiveDependency
            ? unit.employeePositions.filter((position) =>
                materializedEmployeeIds.includes(position.employeeId),
              )
            : unit.employeePositions.map((position) => ({ ...position })),
          liveFilter:
            unit.liveFilter && !hasExternalLiveDependency
              ? {
                  ...cloneEmployeeLiveFilterRule(unit.liveFilter),
                  selectedUnitIds: unit.liveFilter.selectedUnitIds.map(
                    (unitId) => unitIdMap.get(unitId) ?? unitId,
                  ),
                }
              : null,
          parentId: nextParentId,
          updatedAt: new Date().toISOString(),
          x: unit.x + offset.x,
          y: unit.y + offset.y,
        });
      }

      if (this.clipboard.employeeIds.length > 0) {
        const employeeUnitName = "Copied Employees";
        const employeeUnitWidth = getOrgEditorUnitWidth({ name: employeeUnitName });
        const employeeUnit = createOrgEditorUnitFromScratch({
          employeeIds: this.clipboard.employeeIds,
          name: employeeUnitName,
          x:
            pastedUnits.length === 0
              ? point.x - employeeUnitWidth / 2
              : point.x +
                ((copiedBounds ? copiedBounds.maxX - copiedBounds.minX : employeeUnitWidth) / 2 +
                  ORG_EDITOR_UNIT_HORIZONTAL_GAP),
          y: point.y,
        });
        employeeUnit.y = point.y - getOrgEditorUnitHeight(employeeUnit) / 2;

        pastedUnits.push(employeeUnit);
      }

      const positionedPastedUnits = avoidUnitOverlaps({
        movingUnits: pastedUnits,
        staticUnits: this.units,
      });

      this.units = [...this.units, ...positionedPastedUnits];
      this.selectedItems = positionedPastedUnits.map((unit) => ({ type: "unit", unitId: unit.id }));
    });
  }
}

import { LocalizedError, uiMessage } from "@/i18n/messages";
