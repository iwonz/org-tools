import { describe, expect, test } from "vitest";
import { createEmptyEmployeeLiveFilterRule } from "@/lib/live-unit-filter";
import {
  createDefaultOrgEditorState,
  createOrgEditorUnitFromScratch,
  ORG_EDITOR_GRID_SIZE,
} from "@/lib/org-editor";
import { OrgEditorStore } from "@/stores/org-editor-store";

const expectUnitsOnGrid = (store: OrgEditorStore) => {
  for (const unit of store.units) {
    expect(Math.abs(unit.x % ORG_EDITOR_GRID_SIZE)).toBe(0);
    expect(Math.abs(unit.y % ORG_EDITOR_GRID_SIZE)).toBe(0);
  }
};

describe("OrgEditorStore grid geometry", () => {
  test("preserves legacy coordinates on load until an explicit move affects a Unit", () => {
    const store = new OrgEditorStore();
    const state = createDefaultOrgEditorState();
    const legacyUnit = createOrgEditorUnitFromScratch({ name: "Legacy", x: 13, y: 37 });
    const stationaryUnit = createOrgEditorUnitFromScratch({ name: "Stationary", x: 997, y: 1003 });

    store.loadState({ ...state, units: [legacyUnit, stationaryUnit] });
    expect(store.units.map(({ x, y }) => ({ x, y }))).toEqual([
      { x: 13, y: 37 },
      { x: 997, y: 1003 },
    ]);

    store.moveUnitsFromPositions([{ unitId: legacyUnit.id, x: 13, y: 37 }], { x: 19, y: 20 });
    expect(store.units.find((unit) => unit.id === legacyUnit.id)).toMatchObject({ x: 24, y: 48 });
    expect(store.units.find((unit) => unit.id === stationaryUnit.id)).toMatchObject({
      x: 997,
      y: 1003,
    });
  });

  test("snaps add, overlap avoidance, relayout, arrangement, and paste operations", () => {
    const store = new OrgEditorStore();
    const rootId = store.addUnit({ name: "Root", x: 13, y: 37 });
    store.addUnit({ name: "Overlapping root", x: 13, y: 37 });
    store.addUnit({ name: "Child", parentId: rootId, x: 317, y: 211 });
    store.addUnits([createOrgEditorUnitFromScratch({ name: "Imported", x: 503, y: 619 })]);
    expectUnitsOnGrid(store);

    store.applyLayout("leftRight");
    expectUnitsOnGrid(store);

    store.setUnitsCollapsed([rootId], true, { includeDescendants: true });
    expectUnitsOnGrid(store);

    store.setSelectedItems([{ type: "unit", unitId: rootId }]);
    store.copySelected();
    store.pasteAt({ x: 333, y: 377 });
    expectUnitsOnGrid(store);
  });

  test("arranges only the selected induced hierarchy in one command", () => {
    let documentChanges = 0;
    const store = new OrgEditorStore(() => {
      documentChanges += 1;
    });
    const state = createDefaultOrgEditorState();
    const root = createOrgEditorUnitFromScratch({ name: "Root", x: 96, y: 96 });
    const child = createOrgEditorUnitFromScratch({
      name: "Child",
      parentId: root.id,
      x: 624,
      y: 456,
    });
    const unselectedChild = createOrgEditorUnitFromScratch({
      name: "Unselected child",
      parentId: child.id,
      x: 1_200,
      y: 744,
    });
    const outside = createOrgEditorUnitFromScratch({ name: "Outside", x: 2_400, y: 1_200 });
    store.loadState({ ...state, units: [root, child, unselectedChild, outside] });
    store.setSelectedItems([
      { type: "unit", unitId: root.id },
      { type: "unit", unitId: child.id },
    ]);
    const beforeSelected = store.units
      .filter((unit) => unit.id === root.id || unit.id === child.id)
      .map(({ id, x, y }) => ({ id, x, y }));
    const beforeUnselected = store.units
      .filter((unit) => unit.id === unselectedChild.id || unit.id === outside.id)
      .map(({ id, x, y }) => ({ id, x, y }));
    documentChanges = 0;

    store.applyLayoutToUnits([root.id, child.id]);

    expect(documentChanges).toBe(1);
    expect(store.selectedUnitIds).toEqual(new Set([root.id, child.id]));
    expect(
      store.units
        .filter((unit) => unit.id === unselectedChild.id || unit.id === outside.id)
        .map(({ id, x, y }) => ({ id, x, y })),
    ).toEqual(beforeUnselected);
    expect(
      store.units
        .filter((unit) => unit.id === root.id || unit.id === child.id)
        .map(({ id, x, y }) => ({ id, x, y })),
    ).not.toEqual(beforeSelected);
    expectUnitsOnGrid(store);

    store.undo();
    expect(
      store.units
        .filter((unit) => unit.id === root.id || unit.id === child.id)
        .map(({ id, x, y }) => ({ id, x, y })),
    ).toEqual(beforeSelected);
    expect(store.selectedUnitIds).toEqual(new Set([root.id, child.id]));
  });
});

describe("OrgEditorStore deletion", () => {
  test("deletes overlapping ancestor selections once and materializes surviving Live dependencies", () => {
    const store = new OrgEditorStore();
    const employeeId = "employee-visible";
    const rootId = store.addUnit({ employeeIds: [employeeId], name: "Root", x: 0, y: 0 });
    const childId = store.addUnit({ name: "Child", parentId: rootId, x: 0, y: 240 });
    const otherId = store.addUnit({ name: "Other", x: 720, y: 0 });
    const liveId = store.addUnit({
      liveFilter: {
        ...createEmptyEmployeeLiveFilterRule(),
        selectedUnitIds: [rootId],
      },
      name: "Dependent Live",
      x: 1080,
      y: 0,
    });
    store.synchronizeLiveResolution(new Map([[liveId, [employeeId]]]));
    store.setSelectedItems([
      { type: "unit", unitId: rootId },
      { type: "unit", unitId: childId },
      { type: "unit", unitId: otherId },
    ]);

    store.deleteSelected();

    expect(store.units).toHaveLength(1);
    expect(store.units[0]).toMatchObject({
      employeeIds: [employeeId],
      id: liveId,
      liveFilter: null,
    });
    expect(store.selectedItems).toEqual([]);

    store.undo();
    expect(new Set(store.units.map((unit) => unit.id))).toEqual(
      new Set([rootId, childId, otherId, liveId]),
    );
  });
});
