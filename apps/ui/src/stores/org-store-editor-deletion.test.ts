import { describe, expect, test } from "vitest";

import { createEmptyEmployeeFiltersState } from "@/lib/org-file";
import { OrgStore } from "@/stores/org-store";

describe("OrgStore Editor deletion coordinator", () => {
  test("prunes system and Download references before exposing the final state", () => {
    const store = new OrgStore();
    const rootId = store.mainOrgEditor.addUnit({ name: "Root", x: 0, y: 0 });
    const childId = store.mainOrgEditor.addUnit({
      name: "Child",
      parentId: rootId,
      x: 0,
      y: 240,
    });
    const survivingRootId = store.mainOrgEditor.addUnit({ name: "Survivor", x: 720, y: 0 });
    const filters = { ...createEmptyEmployeeFiltersState(), selectedUnitIds: [rootId, childId] };
    store.selectUnit(childId);
    store.expandedUnitIds = [rootId, childId, survivingRootId];
    store.unitsUi = { ...store.unitsUi, employeeFilters: filters };
    store.employeesUi = { ...store.employeesUi, filters };
    store.analyticsUi = { ...store.analyticsUi, filters };
    store.downloadUi = {
      ...store.downloadUi,
      employeeFilters: filters,
      selectedFilters: filters,
    };
    store.exportSession.setExcludedJsonUnitIds([rootId, childId, survivingRootId]);
    store.addExportSelection({ id: `unit:${childId}`, type: "unit", unitId: childId });
    store.mainOrgEditor.setSelectedItems([
      { type: "unit", unitId: rootId },
      { type: "unit", unitId: childId },
    ]);

    store.deleteEditorSelection(store.systemOrgViewId);

    expect(store.mainOrgEditor.units.map((unit) => unit.id)).toEqual([survivingRootId]);
    expect(store.selectedUnitId).toBe(survivingRootId);
    expect(store.expandedUnitIds).toEqual([survivingRootId]);
    expect(store.unitsUi.employeeFilters.selectedUnitIds).toEqual([]);
    expect(store.employeesUi.filters.selectedUnitIds).toEqual([]);
    expect(store.analyticsUi.filters.selectedUnitIds).toEqual([]);
    expect(store.downloadUi.employeeFilters.selectedUnitIds).toEqual([]);
    expect(store.downloadUi.selectedFilters.selectedUnitIds).toEqual([]);
    expect(store.exportSession.excludedJsonUnitIds).toEqual([survivingRootId]);
    expect(store.exportSession.selections).toEqual([]);
    expect(() => store.createOrgToolsState()).not.toThrow();
  });
});
