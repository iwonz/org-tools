import { describe, expect, test } from "vitest";

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
});
