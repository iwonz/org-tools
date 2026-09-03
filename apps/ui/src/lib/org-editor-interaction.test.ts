import { describe, expect, it, vi } from "vitest";

import { ORG_EDITOR_GRID_SIZE, snapOrgEditorPoint } from "@/lib/org-editor";
import {
  createLatestFrameScheduler,
  createSpatialIndex,
  getUnitPointerSelectionIntent,
} from "@/lib/org-editor-interaction";

describe("latest Editor interaction frame", () => {
  it("replaces pending samples and flushes only the latest value", () => {
    const queuedFrames: Array<() => void> = [];
    const onFrame = vi.fn();
    const scheduler = createLatestFrameScheduler<number>({
      cancelFrame: vi.fn(() => {
        queuedFrames.length = 0;
      }),
      onFrame,
      requestFrame: (callback) => {
        queuedFrames.push(callback);
        return 1;
      },
    });

    scheduler.schedule(1);
    scheduler.schedule(2);
    scheduler.schedule(3);

    expect(onFrame).not.toHaveBeenCalled();
    expect(queuedFrames).toHaveLength(1);
    queuedFrames[0]?.();
    expect(onFrame).toHaveBeenCalledTimes(1);
    expect(onFrame).toHaveBeenLastCalledWith(3);

    scheduler.schedule(4);
    scheduler.flush();
    expect(onFrame).toHaveBeenCalledTimes(2);
    expect(onFrame).toHaveBeenLastCalledWith(4);
  });

  it("cancels a pending sample without applying it", () => {
    const onFrame = vi.fn();
    const cancelFrame = vi.fn();
    const scheduler = createLatestFrameScheduler<number>({
      cancelFrame,
      onFrame,
      requestFrame: () => 7,
    });

    scheduler.schedule(1);
    scheduler.cancel();

    expect(cancelFrame).toHaveBeenCalledWith(7);
    expect(onFrame).not.toHaveBeenCalled();
  });
});

describe("Editor spatial index", () => {
  it("returns exact intersecting geometry without scanning all 4,000 Units", () => {
    const units = Array.from({ length: 4_000 }, (_, index) => ({
      height: 120,
      id: index,
      width: 280,
      x: (index % 80) * 480,
      y: Math.floor(index / 80) * 320,
    }));
    const index = createSpatialIndex(units, (unit) => unit, 512);
    const result = index.query({ height: 720, width: 1_280, x: 9_400, y: 4_700 });
    const expectedIds = units
      .filter(
        (unit) =>
          unit.x <= 10_680 &&
          unit.x + unit.width >= 9_400 &&
          unit.y <= 5_420 &&
          unit.y + unit.height >= 4_700,
      )
      .map((unit) => unit.id);

    expect(index.size).toBe(4_000);
    expect(result.items.map((unit) => unit.id)).toEqual(expectedIds);
    expect(result.candidateCount).toBeLessThan(100);
  });

  it("handles negative coordinates and rejects invalid cell sizes", () => {
    const item = { height: 48, id: "negative", width: 48, x: -600, y: -600 };
    const index = createSpatialIndex([item], (value) => value, 256);

    expect(index.query({ height: 64, width: 64, x: -620, y: -620 }).items).toEqual([item]);
    expect(() => createSpatialIndex([item], (value) => value, 0)).toThrow(
      "Spatial index cell size must be a positive finite number.",
    );
  });
});

describe("Editor interaction grid", () => {
  it("preserves 24-unit snapping at gesture commit boundaries", () => {
    expect(ORG_EDITOR_GRID_SIZE).toBe(24);
    expect(snapOrgEditorPoint({ x: 37, y: -35 })).toEqual({ x: 48, y: -24 });
  });
});

describe("Editor Unit pointer selection", () => {
  it("preserves a selected group for drag and defers ordinary click replacement", () => {
    const selectedUnitIds = new Set(["first", "second"]);

    expect(
      getUnitPointerSelectionIntent({ clickedUnitId: "first", selectedUnitIds, toggle: false }),
    ).toEqual({
      dragUnitIds: ["first", "second"],
      preserveForPotentialGroupDrag: true,
    });
    expect(
      getUnitPointerSelectionIntent({ clickedUnitId: "third", selectedUnitIds, toggle: false }),
    ).toEqual({
      dragUnitIds: ["third"],
      preserveForPotentialGroupDrag: false,
    });
  });
});
