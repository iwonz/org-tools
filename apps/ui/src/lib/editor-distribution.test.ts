import { describe, expect, test } from "vitest";

import {
  applyEditorDistributionBulkToggle,
  buildEditorEmployeeUnitIndex,
  buildEditorOrdinaryEmployeeUnitIndex,
  createEditorDistributionConnection,
  createEditorPlacementMapLayout,
  getEditorDistributionBulkState,
  getEditorDistributionPlacement,
  getEditorDistributionSelection,
  getEditorEmployeeOtherUnitIds,
  getEditorPlacementMapFitViewport,
} from "@/lib/editor-distribution";
import { createOrgEditorUnitFromScratch } from "@/lib/org-editor";

describe("Editor distribution membership", () => {
  test("applies checked, unchecked, and mixed Unit selections as one set operation", () => {
    expect(getEditorDistributionBulkState(new Set(), ["one", "two"])).toBe("unchecked");
    expect(getEditorDistributionBulkState(new Set(["one"]), ["one", "two"])).toBe("mixed");
    expect(getEditorDistributionBulkState(new Set(["one", "two"]), ["one", "two"])).toBe("checked");
    expect(applyEditorDistributionBulkToggle(["one"], ["one", "two"])).toEqual(["one", "two"]);
    expect(applyEditorDistributionBulkToggle(["one", "two", "three"], ["one", "two"])).toEqual([
      "three",
    ]);
  });

  test("indexes direct materialized memberships without hierarchy inheritance", () => {
    const root = createOrgEditorUnitFromScratch({
      employeeIds: ["employee-shared", "employee-root"],
      name: "Root",
      x: 0,
      y: 0,
    });
    const child = createOrgEditorUnitFromScratch({
      employeeIds: ["employee-shared"],
      name: "Child",
      parentId: root.id,
      x: 400,
      y: 0,
    });
    const index = buildEditorEmployeeUnitIndex([root, child]);

    expect(getEditorEmployeeOtherUnitIds(index, "employee-shared", root.id)).toEqual([child.id]);
    expect(getEditorEmployeeOtherUnitIds(index, "employee-root", root.id)).toEqual([]);
  });

  test("excludes multiple reference Units without changing full membership or inheriting parents", () => {
    const complete = new Map([
      ["shared", ["reference", "reference-live", "ordinary", "ordinary-live"]],
      ["one-placement", ["reference", "ordinary"]],
      ["reference-only", ["reference", "reference-live"]],
    ]);
    const ordinary = buildEditorOrdinaryEmployeeUnitIndex(
      complete,
      new Set(["reference", "reference-live"]),
    );
    expect(ordinary.get("shared")).toEqual(["ordinary", "ordinary-live"]);
    expect(ordinary.get("one-placement")).toEqual(["ordinary"]);
    expect(ordinary.has("reference-only")).toBe(false);
    expect(complete.get("shared")).toHaveLength(4);
    expect(
      buildEditorOrdinaryEmployeeUnitIndex(complete, new Set(["reference", "ordinary"])).get(
        "shared",
      ),
    ).toEqual(["reference-live", "ordinary-live"]);
    expect(buildEditorOrdinaryEmployeeUnitIndex(new Map(), new Set()).size).toBe(0);
  });

  test("derives ordinary membership at the maintained scale", () => {
    const units = Array.from({ length: 4_000 }, (_, index) =>
      createOrgEditorUnitFromScratch({
        employeeIds: Array.from({ length: 5 }, (_, offset) => `employee-${index * 5 + offset}`),
        name: `Unit ${index}`,
        x: 0,
        y: 0,
      }),
    );
    const complete = buildEditorEmployeeUnitIndex(units);
    const enabled = new Set(units.filter((_, index) => index % 2 === 0).map((unit) => unit.id));
    const ordinary = buildEditorOrdinaryEmployeeUnitIndex(complete, enabled);
    expect(complete.size).toBe(20_000);
    expect(ordinary.size).toBe(10_000);
    for (const ids of ordinary.values()) expect(ids.every((id) => !enabled.has(id))).toBe(true);
  });

  test("routes between opposing horizontal and vertical edges", () => {
    const horizontal = createEditorDistributionConnection({
      source: { height: 40, width: 100, x: 0, y: 0 },
      target: { height: 40, width: 100, x: 300, y: 100 },
      targetHiddenByCollapse: true,
    });
    expect(horizontal.start).toEqual({ x: 100, y: 20 });
    expect(horizontal.end).toEqual({ x: 300, y: 120 });
    expect(horizontal.showEndpointMarker).toBe(true);

    const vertical = createEditorDistributionConnection({
      source: { height: 40, width: 100, x: 0, y: 0 },
      target: { height: 40, width: 100, x: 20, y: -200 },
      targetHiddenByCollapse: false,
    });
    expect(vertical.start).toEqual({ x: 50, y: 0 });
    expect(vertical.end).toEqual({ x: 70, y: -160 });
    expect(vertical.showEndpointMarker).toBe(false);
  });

  test("gates connections to one Employee occurrence in an enabled Unit", () => {
    const unitId = "unit-source";
    const item = { employeeId: "employee-one", type: "employee" as const, unitId };
    expect(getEditorDistributionSelection([item], new Set([unitId]))).toEqual(item);
    expect(getEditorDistributionSelection([item], new Set())).toBeNull();
    expect(getEditorDistributionSelection([item, item], new Set([unitId]))).toBeNull();
  });

  test("uses an exact visible row and a collapsed Unit fallback", () => {
    const employeeId = "employee-one";
    const expanded = createOrgEditorUnitFromScratch({
      employeeIds: [employeeId],
      name: "Expanded",
      x: 100,
      y: 200,
    });
    const collapsed = { ...expanded, collapsed: true, bossEmployeeId: null };
    expect(
      getEditorDistributionPlacement({ employeeById: new Map(), employeeId, unit: expanded })
        .hiddenByCollapse,
    ).toBe(false);
    expect(
      getEditorDistributionPlacement({ employeeById: new Map(), employeeId, unit: collapsed })
        .hiddenByCollapse,
    ).toBe(true);
  });

  test("lays placement Units on deterministic non-overlapping rings and fits the map", () => {
    const unitIds = Array.from({ length: 18 }, (_, index) => `unit-${index}`);
    const first = createEditorPlacementMapLayout(unitIds);
    const second = createEditorPlacementMapLayout(unitIds);
    expect(second).toEqual(first);
    expect(first.units.map((unit) => unit.unitId)).toEqual(unitIds);

    for (let index = 0; index < first.units.length; index += 1) {
      const unit = first.units[index];
      if (!unit) continue;
      for (const candidate of first.units.slice(index + 1)) {
        const overlaps = !(
          unit.x + unit.width <= candidate.x ||
          candidate.x + candidate.width <= unit.x ||
          unit.y + unit.height <= candidate.y ||
          candidate.y + candidate.height <= unit.y
        );
        expect(overlaps).toBe(false);
      }
    }

    const viewport = getEditorPlacementMapFitViewport({
      bounds: first.bounds,
      height: 480,
      width: 720,
    });
    expect(viewport.scale).toBeGreaterThanOrEqual(0.2);
    expect(viewport.scale).toBeLessThanOrEqual(1.4);
    expect(Number.isFinite(viewport.x)).toBe(true);
    expect(Number.isFinite(viewport.y)).toBe(true);
  });
});
