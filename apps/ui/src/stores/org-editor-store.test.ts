import { describe, expect, test, vi } from "vitest";
import { createEmptyEmployeeLiveFilterRule } from "@/lib/live-unit-filter";
import {
  createDefaultOrgEditorState,
  createOrgEditorUnitFromScratch,
  getOrgEditorUnitBounds,
  ORG_EDITOR_GRID_SIZE,
  ORG_EDITOR_UNIT_NOTE_MAX_UTF8_BYTES,
} from "@/lib/org-editor";
import {
  createOrgEditorArrowElement,
  createOrgEditorImageElement,
  createOrgEditorStickerElement,
  createOrgEditorTextElement,
  getOrgEditorCanvasElementAnchorPoint,
  getOrgEditorRectAnchorPoint,
} from "@/lib/org-editor-canvas";
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

describe("OrgEditorStore canvas layers", () => {
  test("moves selected elements across the Unit plane while preserving order and attachments", () => {
    let documentChanges = 0;
    const store = new OrgEditorStore(() => {
      documentChanges += 1;
    });
    const state = createDefaultOrgEditorState();
    const arrow = createOrgEditorArrowElement({ x: 0, y: 0 }, { x: 100, y: 100 });
    const image = {
      ...createOrgEditorImageElement({
        dataUrl:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2R2sAAAAASUVORK5CYII=",
        intrinsicHeight: 1,
        intrinsicWidth: 1,
        point: { x: 100, y: 100 },
      }),
      layer: "behindUnits" as const,
    };
    const text = createOrgEditorTextElement({ x: 200, y: 200 });
    const sticker = {
      ...createOrgEditorStickerElement({ x: 300, y: 300 }),
      attachment: {
        offset: { x: 12, y: -8 },
        sourceAnchorId: "center" as const,
        target: {
          anchorId: "rightCenter" as const,
          owner: { elementId: text.id, type: "element" as const },
        },
      },
    };
    store.loadState({ ...state, canvasElements: [arrow, image, text, sticker] });
    store.clearHistory();
    documentChanges = 0;

    store.reorderCanvasElements([image.id, sticker.id], "front");

    expect(store.canvasElements.map(({ id }) => id)).toEqual([
      arrow.id,
      text.id,
      image.id,
      sticker.id,
    ]);
    expect(store.canvasElements.slice(-2).map(({ layer }) => layer)).toEqual([
      "aboveUnits",
      "aboveUnits",
    ]);
    expect(store.canvasElements[3]).toMatchObject({ attachment: sticker.attachment });
    expect(documentChanges).toBe(1);

    store.undo();
    expect(store.canvasElements).toEqual([arrow, image, text, sticker]);
    store.redo();
    expect(store.canvasElements.map(({ id }) => id)).toEqual([
      arrow.id,
      text.id,
      image.id,
      sticker.id,
    ]);

    store.reorderCanvasElements([image.id, sticker.id], "back");
    expect(store.canvasElements.map(({ id }) => id)).toEqual([
      image.id,
      sticker.id,
      arrow.id,
      text.id,
    ]);
    expect(store.canvasElements.slice(0, 2).map(({ layer }) => layer)).toEqual([
      "behindUnits",
      "behindUnits",
    ]);
    expect(store.canvasElements[1]).toMatchObject({ attachment: sticker.attachment });
  });

  test("applies global Front and Back to every canvas element kind", () => {
    const elements = [
      createOrgEditorTextElement({ x: 0, y: 0 }),
      createOrgEditorStickerElement({ x: 100, y: 0 }),
      createOrgEditorImageElement({
        dataUrl:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2R2sAAAAASUVORK5CYII=",
        intrinsicHeight: 1,
        intrinsicWidth: 1,
        point: { x: 200, y: 0 },
      }),
      createOrgEditorArrowElement({ x: 0, y: 100 }, { x: 200, y: 100 }),
    ];
    for (const element of elements) {
      const store = new OrgEditorStore();
      store.loadState({ ...createDefaultOrgEditorState(), canvasElements: elements });
      store.reorderCanvasElements([element.id], "front");
      expect(store.canvasElements.at(-1)).toMatchObject({
        id: element.id,
        layer: "aboveUnits",
      });
      store.reorderCanvasElements([element.id], "back");
      expect(store.canvasElements[0]).toMatchObject({
        id: element.id,
        layer: "behindUnits",
      });
    }
  });

  test("keeps Sticker format runs in one undoable history command", () => {
    const store = new OrgEditorStore();
    const sticker = createOrgEditorStickerElement({ x: 100, y: 100 });
    store.loadState({ ...createDefaultOrgEditorState(), canvasElements: [sticker] });
    store.clearHistory();
    store.updateCanvasElements(
      [sticker.id],
      (element) =>
        element.type === "sticker"
          ? {
              ...element,
              formatRuns: [
                {
                  end: element.text.length,
                  start: 0,
                  typography: {
                    color: "blue",
                    fontFamily: "Georgia",
                    fontSize: 28,
                    fontWeight: 700,
                  },
                },
              ],
            }
          : element,
      "Format Sticker text",
    );
    expect(store.canvasElements[0]).toMatchObject({
      formatRuns: [{ end: 4, start: 0, typography: { fontFamily: "Georgia" } }],
    });
    store.undo();
    expect(store.canvasElements[0]).toEqual(sticker);
    store.redo();
    expect(store.canvasElements[0]).toMatchObject({
      formatRuns: [{ typography: { fontFamily: "Georgia" } }],
    });
  });
});

describe("OrgEditorStore deletion", () => {
  test("materializes an attached element at its latest Unit anchor before deletion", () => {
    const store = new OrgEditorStore();
    const unitId = store.addUnit({ name: "Target", x: 0, y: 0 });
    const sticker = {
      ...createOrgEditorStickerElement({ x: 0, y: 0 }),
      attachment: {
        offset: { x: 12, y: -8 },
        sourceAnchorId: "center" as const,
        target: {
          anchorId: "rightCenter" as const,
          owner: { type: "unit" as const, unitId },
        },
      },
    };
    store.addCanvasElement(sticker);
    store.moveUnitsFromPositions([{ unitId, x: 0, y: 0 }], { x: 240, y: 96 });
    const target = store.units.find((unit) => unit.id === unitId);
    expect(target).toBeDefined();
    if (!target) return;
    const targetPoint = getOrgEditorRectAnchorPoint(
      { ...getOrgEditorUnitBounds(target), rotation: 0 },
      "rightCenter",
    );

    store.setSelectedItems([{ type: "unit", unitId }]);
    store.deleteSelected();

    const remaining = store.canvasElements[0];
    expect(remaining?.type).toBe("sticker");
    if (remaining?.type !== "sticker") return;
    expect(remaining.attachment).toBeNull();
    expect(getOrgEditorCanvasElementAnchorPoint(remaining, "center")).toEqual({
      x: targetPoint.x + 12,
      y: targetPoint.y - 8,
    });
    store.undo();
    expect(store.units.some((unit) => unit.id === unitId)).toBe(true);
    expect(
      store.canvasElements[0]?.type === "sticker" && store.canvasElements[0].attachment,
    ).not.toBe(null);
  });

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
    store.toggleUnitDistributionMode(rootId);
    store.toggleUnitDistributionMode(childId);
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
    expect(store.distributionModeUnitIds).toEqual([]);

    store.undo();
    expect(new Set(store.units.map((unit) => unit.id))).toEqual(
      new Set([rootId, childId, otherId, liveId]),
    );
  });

  test("toggles distribution mode without structural history or document writes", () => {
    let documentChanges = 0;
    const store = new OrgEditorStore(() => {
      documentChanges += 1;
    });
    const unitId = store.addUnit({ name: "Source", x: 0, y: 0 });
    store.clearHistory();
    documentChanges = 0;

    store.toggleUnitDistributionMode(unitId);

    expect(store.distributionModeUnitIds).toEqual([unitId]);
    expect(store.canUndo).toBe(false);
    expect(documentChanges).toBe(0);
  });
});

describe("OrgEditorStore Unit notes", () => {
  test("saves a normalized note in one command and supports Undo and Redo", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-03T12:00:00.000Z"));
    let documentChanges = 0;
    const store = new OrgEditorStore(() => {
      documentChanges += 1;
    });
    const unitId = store.addUnit({ name: "Platform", x: 0, y: 0 });
    const originalUpdatedAt = store.units[0]?.updatedAt;
    vi.setSystemTime(new Date("2026-09-03T12:00:01.000Z"));
    documentChanges = 0;

    store.setUnitNoteMarkdown(unitId, "# Scope\r\n\r\n- Own the API");

    expect(documentChanges).toBe(1);
    expect(store.units[0]?.noteMarkdown).toBe("# Scope\n\n- Own the API");
    expect(store.units[0]?.updatedAt).not.toBe(originalUpdatedAt);
    expect(store.canUndo).toBe(true);

    store.undo();
    expect(store.units[0]?.noteMarkdown).toBe("");
    store.redo();
    expect(store.units[0]?.noteMarkdown).toBe("# Scope\n\n- Own the API");
    vi.useRealTimers();
  });

  test("does not mutate a Unit for an oversized note", () => {
    const store = new OrgEditorStore();
    const unitId = store.addUnit({ name: "Platform", x: 0, y: 0 });
    const before = store.createState();

    expect(() =>
      store.setUnitNoteMarkdown(unitId, "x".repeat(ORG_EDITOR_UNIT_NOTE_MAX_UTF8_BYTES + 1)),
    ).toThrow("64 KiB");
    expect(store.createState()).toEqual(before);
  });
});
