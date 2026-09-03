import { describe, expect, test } from "vitest";

import { createUuid } from "@/lib/employee-data";
import { createEmptyEmployeeLiveFilterRule } from "@/lib/live-unit-filter";
import { createBlankOrgToolsState } from "@/lib/org-file";
import { OrgViewsStore } from "@/stores/org-views-store";

const createViewsStore = () => {
  const state = createBlankOrgToolsState("light", "en");
  const store = new OrgViewsStore(() => undefined);
  store.load(state.organization.views, state.ui.editor.views, state.ui.editor.activeViewId);
  return store;
};

describe("OrgViewsStore shared clipboard", () => {
  test("pastes a copied hierarchy into another View with new IDs and target-only history", () => {
    const views = createViewsStore();
    const source = views.systemEditor;
    expect(source).not.toBeNull();
    if (!source) return;
    const employeeId = createUuid();
    const rootId = source.addUnit({ employeeIds: [employeeId], name: "Root", x: 0, y: 0 });
    source.setUnitNoteMarkdown(rootId, "# Source note");
    const childId = source.addUnit({
      liveFilter: { ...createEmptyEmployeeLiveFilterRule(), selectedUnitIds: [rootId] },
      name: "Live child",
      parentId: rootId,
      x: 0,
      y: 240,
    });
    source.synchronizeLiveResolution(new Map([[childId, [employeeId]]]));
    source.setSelectedItems([{ type: "unit", unitId: rootId }]);
    source.copySelected();

    const targetViewId = views.createView("Scenario", { type: "blank" });
    const target = views.editorByViewId.get(targetViewId);
    expect(target).toBeDefined();
    if (!target) return;
    target.pasteAt({ x: 480, y: 360 });

    expect(target.units).toHaveLength(2);
    expect(target.units.map((unit) => unit.id)).not.toContain(rootId);
    expect(target.units.map((unit) => unit.id)).not.toContain(childId);
    const pastedRoot = target.units.find((unit) => unit.parentId === null);
    const pastedChild = target.units.find((unit) => unit.parentId !== null);
    expect(pastedRoot?.employeeIds).toEqual([employeeId]);
    expect(pastedRoot?.noteMarkdown).toBe("# Source note");
    expect(pastedChild?.parentId).toBe(pastedRoot?.id);
    expect(pastedChild?.liveFilter?.selectedUnitIds).toEqual([pastedRoot?.id]);
    expect(target.canUndo).toBe(true);

    target.undo();
    expect(target.units).toEqual([]);
    expect(source.units).toHaveLength(2);
  });

  test("materializes an external Live dependency when pasting across Views", () => {
    const views = createViewsStore();
    const source = views.systemEditor;
    expect(source).not.toBeNull();
    if (!source) return;
    const employeeId = createUuid();
    const dependencyId = source.addUnit({
      employeeIds: [employeeId],
      name: "Dependency",
      x: 0,
      y: 0,
    });
    const liveId = source.addUnit({
      liveFilter: {
        ...createEmptyEmployeeLiveFilterRule(),
        selectedUnitIds: [dependencyId],
      },
      name: "External Live",
      x: 360,
      y: 0,
    });
    source.synchronizeLiveResolution(new Map([[liveId, [employeeId]]]));
    source.setSelectedItems([{ type: "unit", unitId: liveId }]);
    source.copySelected();

    const targetViewId = views.createView("Alternative", { type: "blank" });
    const target = views.editorByViewId.get(targetViewId);
    target?.pasteAt({ x: 240, y: 240 });

    expect(target?.units).toHaveLength(1);
    expect(target?.units[0]).toMatchObject({
      employeeIds: [employeeId],
      liveFilter: null,
      name: "External Live",
    });
  });

  test("clears the transient clipboard only when the complete state is loaded", () => {
    const views = createViewsStore();
    const source = views.systemEditor;
    expect(source).not.toBeNull();
    if (!source) return;
    const unitId = source.addUnit({ name: "Copied", x: 0, y: 0 });
    source.setSelectedItems([{ type: "unit", unitId }]);
    source.copySelected();
    expect(views.clipboard).not.toBeNull();

    const state = createBlankOrgToolsState("light", "en");
    views.load(state.organization.views, state.ui.editor.views, state.ui.editor.activeViewId);
    expect(views.clipboard).toBeNull();
  });

  test("copies Unit notes into an isolated View without sharing later edits", () => {
    const views = createViewsStore();
    const source = views.systemEditor;
    expect(source).not.toBeNull();
    if (!source) return;
    const unitId = source.addUnit({ name: "Platform", x: 0, y: 0 });
    source.setUnitNoteMarkdown(unitId, "Initial context");

    const targetViewId = views.createView("Plan", {
      type: "copy",
      viewId: views.systemView?.id ?? "",
    });
    const target = views.editorByViewId.get(targetViewId);
    const copiedUnit = target?.units[0];
    expect(copiedUnit?.id).not.toBe(unitId);
    expect(copiedUnit?.noteMarkdown).toBe("Initial context");

    if (!copiedUnit) return;
    target?.setUnitNoteMarkdown(copiedUnit.id, "Plan-only context");
    expect(source.units[0]?.noteMarkdown).toBe("Initial context");
    expect(target?.units[0]?.noteMarkdown).toBe("Plan-only context");
  });
});
