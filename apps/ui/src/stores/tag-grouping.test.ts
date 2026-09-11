import type { EditableEmployeeFields } from "@org-tools/types";
import { describe, expect, test } from "vitest";
import {
  buildEditorEmployeeUnitIndex,
  buildEditorOrdinaryEmployeeUnitIndex,
} from "@/lib/editor-distribution";
import { getExportEmployeeFieldValue } from "@/lib/export-format";
import { createEmptyEmployeeLiveFilterRule } from "@/lib/live-unit-filter";
import {
  buildOrgEditorUnitEmployeeSummaryById,
  buildOrgEditorUnitTagSummary,
  getOrgEditorOrderedEmployeeIds,
  getOrgEditorUnitHeight,
  getOrgEditorVisibleEmployeeIds,
} from "@/lib/org-editor";
import { getOrgEditorExportEmployeeTags } from "@/lib/org-editor-export";
import { parseOrgToolsState } from "@/lib/org-file";
import { OrgStore } from "@/stores/org-store";

const required = <T>(value: T | null | undefined): T => {
  if (value === null || value === undefined) throw new Error("Missing synthetic test value");
  return value;
};

const setup = () => {
  const store = new OrgStore();
  const zulu = "00000000-0000-4000-8000-000000000011";
  const alpha = "00000000-0000-4000-8000-000000000012";
  store.saveTagDefinition({ id: zulu, label: "Zulu", color: "blue" });
  store.saveTagDefinition({ id: alpha, label: "Alpha", color: "green" });
  const unitId = store.createUnit({
    name: "Team",
    membershipMode: "manual",
    assignments: [],
    bossEmployeeId: null,
  });
  const add = (name: string, labels: string[], isBoss = false) => {
    const fields: EditableEmployeeFields = {
      firstName: name,
      lastName: "Example",
      email: `${name.toLowerCase()}@example.test`,
      gender: "unspecified",
      birthday: null,
      avatarBase64Url: null,
      phone: null,
      profileUrl: null,
      username: null,
      tags: labels.map((label) => ({ label, date: "2026-09-10" })),
    };
    return store.createEmployee(fields, [{ unitId, isBoss, position: null }]);
  };
  const boss = add("Zane", ["Alpha"], true);
  const both = add("Blair", ["Alpha", "Zulu"]);
  const later = add("Alex", ["Alpha"]);
  const first = add("Casey", ["Zulu"]);
  const untagged = add("Aaron", []);
  const ordered = () =>
    getOrgEditorOrderedEmployeeIds(
      required(store.mainOrgEditor.units[0]),
      required(store.units).indexes.employeesById,
      store.mainOrgEditor.settings.groupByTag,
    );
  return { store, unitId, zulu, alpha, boss, both, later, first, untagged, ordered };
};

describe("Catalog order and Unit grouping", () => {
  test("breaks identical names by stable ID in either grouping mode", () => {
    const { store, both } = setup();
    const employee = required(required(store.units).indexes.employeesById.get(both));
    const firstId = "00000000-0000-4000-8000-000000000021";
    const secondId = "00000000-0000-4000-8000-000000000022";
    const employees = new Map([
      [firstId, { ...employee, id: firstId }],
      [secondId, { ...employee, id: secondId }],
    ]);
    for (const groupByTag of [true, false]) {
      expect(
        getOrgEditorOrderedEmployeeIds(
          {
            ...required(store.mainOrgEditor.units[0]),
            bossEmployeeId: null,
            employeeIds: [secondId, firstId],
          },
          employees,
          groupByTag,
        ),
      ).toEqual([firstId, secondId]);
    }
  });

  test("groups once by earliest Tag, keeps boss first, and uses one undoable setting", () => {
    const { store, boss, both, later, first, untagged, ordered } = setup();
    const persistedAssignments = structuredClone(
      store.organizationEmployees.map((employee) => employee.tags),
    );
    expect(store.mainOrgEditor.settings.groupByTag).toBe(true);
    expect(ordered()).toEqual([boss, both, first, later, untagged]);
    const sequence = store.organizationChangeSequence;
    store.mainOrgEditor.setViewSettings({ groupByTag: false });
    expect(store.organizationChangeSequence).toBe(sequence + 1);
    expect(ordered()).toEqual([boss, untagged, later, both, first]);
    store.mainOrgEditor.setViewSettings({ groupByTag: false });
    expect(store.organizationChangeSequence).toBe(sequence + 1);
    store.mainOrgEditor.undo();
    expect(ordered()).toEqual([boss, both, first, later, untagged]);
    store.mainOrgEditor.redo();
    expect(ordered()).toEqual([boss, untagged, later, both, first]);
    expect(store.organizationEmployees.map((employee) => employee.tags)).toEqual(
      persistedAssignments,
    );
    expect(
      getOrgEditorVisibleEmployeeIds(
        { ...required(store.mainOrgEditor.units[0]), collapsed: true },
        required(store.units).indexes.employeesById,
        store.mainOrgEditor.settings.groupByTag,
      ),
    ).toEqual([boss]);
  });

  test("reorders every derived View and output without rewriting Employee assignments", () => {
    const { store, unitId, zulu, alpha, boss, both, later, first, untagged, ordered } = setup();
    const persisted = store.organizationEmployees;
    const copiedViewId = store.createOrgView("Scenario", {
      type: "copy",
      viewId: required(store.systemOrgViewId),
    });
    const sequence = store.organizationChangeSequence;
    store.moveTag(alpha, zulu, "before");
    expect(store.organizationChangeSequence).toBe(sequence + 1);
    store.moveTag(alpha, zulu, "before");
    expect(store.organizationChangeSequence).toBe(sequence + 1);
    expect(store.organizationEmployees).toBe(persisted);
    expect(ordered()).toEqual([boss, later, both, first, untagged]);
    expect(store.activeOrgViewId).toBe(copiedViewId);
    expect(
      getOrgEditorOrderedEmployeeIds(
        required(store.orgEditor.units[0]),
        required(store.editorUnits).indexes.employeesById,
        store.orgEditor.settings.groupByTag,
      ),
    ).toEqual(ordered());
    const employee = required(required(store.units).indexes.employeesById.get(both));
    expect(employee.tags.map((tag) => tag.tagId)).toEqual([alpha, zulu]);
    expect(getExportEmployeeFieldValue(employee, "tags")).toEqual(["Alpha", "Zulu"]);
    expect(
      getOrgEditorExportEmployeeTags(employee, "en").map((tag) => tag.label.split(" · ")[0]),
    ).toEqual(["Alpha", "Zulu"]);
    expect(required(store.units).indexes.tagOptions).toEqual(["Alpha", "Zulu"]);
    expect(required(store.units).indexes.datedTagGroups.map((tag) => tag.tagId)).toEqual([
      alpha,
      zulu,
    ]);
    expect(
      buildOrgEditorUnitTagSummary(
        required(store.mainOrgEditor.units.find((unit) => unit.id === unitId)),
        required(store.units).indexes.employeesById,
        [alpha, zulu],
      ).map((tag) => [tag.tagId, tag.count]),
    ).toEqual([
      [alpha, 3],
      [zulu, 2],
    ]);
    const restored = new OrgStore();
    restored.loadOrgToolsState(store.createOrgToolsState(), null, null);
    expect(restored.createOrgToolsState()).toEqual(store.createOrgToolsState());
    expect(restored.tagDefinitions.map((tag) => tag.id)).toEqual([alpha, zulu]);
  });

  test("groups resolved Live membership and re-evaluates the earliest Tag after deletion", () => {
    const { store, unitId, zulu, boss, both, later, first, untagged } = setup();
    const liveId = store.mainOrgEditor.addUnit({
      name: "Live",
      x: 480,
      y: 0,
      liveFilter: { ...createEmptyEmployeeLiveFilterRule(), selectedUnitIds: [unitId] },
    });
    const live = () => ({
      ...required(store.mainOrgEditor.units.find((unit) => unit.id === liveId)),
      employeeIds: required(store.mainOrgEditor.resolvedLiveEmployeeIdsByUnitId.get(liveId)),
    });
    expect(
      getOrgEditorOrderedEmployeeIds(
        live(),
        required(store.units).indexes.employeesById,
        store.mainOrgEditor.settings.groupByTag,
      ),
    ).toEqual([both, first, later, boss, untagged]);
    store.deleteTagDefinition(zulu);
    expect(
      getOrgEditorOrderedEmployeeIds(
        live(),
        required(store.units).indexes.employeesById,
        store.mainOrgEditor.settings.groupByTag,
      ),
    ).toEqual([later, both, boss, untagged, first]);
  });

  test("shares exact Live subtree counts with hierarchy selectors and isolates View placements", () => {
    const { store, unitId, boss } = setup();
    const editor = store.mainOrgEditor;
    const liveId = editor.addUnit({
      name: "Live child",
      parentId: unitId,
      x: 0,
      y: 400,
      liveFilter: { ...createEmptyEmployeeLiveFilterRule(), selectedUnitIds: [unitId] },
    });
    const materialized = () =>
      editor.units.map((unit) => ({
        ...unit,
        employeeIds: unit.liveFilter
          ? (editor.resolvedLiveEmployeeIdsByUnitId.get(unit.id) ?? [])
          : unit.employeeIds,
      }));
    const derived = required(store.units);
    const summaries = buildOrgEditorUnitEmployeeSummaryById(materialized());
    for (const unit of editor.units) {
      expect(summaries.get(unit.id)?.totalCount).toBe(
        derived.indexes.unitsById.get(unit.id)?.deepEmployeeIds.length,
      );
    }
    expect(summaries.get(liveId)?.totalCount).toBe(5);
    const complete = buildEditorEmployeeUnitIndex(materialized());
    expect(complete.get(boss)).toEqual([unitId, liveId]);
    editor.toggleUnitDistributionMode(liveId);
    expect(store.units).toBe(derived);
    expect(
      buildEditorOrdinaryEmployeeUnitIndex(complete, new Set(editor.distributionModeUnitIds)).get(
        boss,
      ),
    ).toEqual([unitId]);
    editor.setViewSettings({ groupByTag: false });
    editor.setUnitsCollapsed([unitId, liveId], true);
    expect(buildOrgEditorUnitEmployeeSummaryById(materialized())).toEqual(summaries);
    store.createOrgView("Empty scenario", { type: "blank" });
    expect(buildEditorEmployeeUnitIndex(store.orgEditor.units).size).toBe(0);
    expect(buildEditorEmployeeUnitIndex(materialized()).get(boss)).toEqual([unitId, liveId]);
  });

  test("rejects missing, extra, invalid, and obsolete settings atomically", () => {
    const { store } = setup();
    const original = store.createOrgToolsState();
    const invalidSettings: unknown[] = [
      undefined,
      null,
      {},
      { ...original.organization.views[0]?.structure.settings, extra: true },
    ];
    for (const key of ["groupByTag", "showTagCloud", "distributedColor", "undistributedColor"]) {
      const invalidValues = key.endsWith("Color")
        ? [undefined, null, true, "#ABCDEF", "#abc", "purple", "url(example.test)"]
        : [undefined, null, "true", 1];
      for (const value of invalidValues)
        invalidSettings.push({
          ...original.organization.views[0]?.structure.settings,
          [key]: value,
        });
    }
    for (const settings of invalidSettings) {
      const candidate = structuredClone(original);
      const structure = required(candidate.organization.views[0]).structure;
      Reflect.set(structure, "settings", settings);
      expect(() => parseOrgToolsState(candidate)).toThrow();
      expect(() => store.loadOrgToolsState(candidate, null, null)).toThrow();
      expect(store.createOrgToolsState()).toEqual(original);
    }
    const obsolete = structuredClone(original);
    Reflect.set(required(obsolete.organization.views[0]?.structure.units[0]), "groupByTag", true);
    expect(() => parseOrgToolsState(obsolete)).toThrow();
  });

  test("settings are isolated, undoable, copied, and persisted with hidden footer geometry", () => {
    const { store } = setup();
    const system = store.mainOrgEditor;
    const unit = required(system.units[0]);
    const fullHeight = getOrgEditorUnitHeight(unit);
    const sequence = store.organizationChangeSequence;
    system.setViewSettings({ showTagCloud: false });
    expect(store.organizationChangeSequence).toBe(sequence + 1);
    expect(getOrgEditorUnitHeight(unit)).toBeLessThan(fullHeight);
    system.undo();
    expect(getOrgEditorUnitHeight(unit)).toBe(fullHeight);
    system.redo();
    const settings = {
      groupByTag: false,
      showTagCloud: false,
      distributedColor: "#12345680" as const,
      undistributedColor: "rose" as const,
    };
    system.setViewSettings(settings);
    const copyId = store.createOrgView("Settings copy", {
      type: "copy",
      viewId: store.systemOrgViewId,
    });
    expect(store.orgEditor.settings).toEqual(settings);
    store.orgEditor.setViewSettings({ distributedColor: "blue" });
    expect(system.settings).toEqual(settings);
    store.orgEditor.undo();
    expect(store.orgEditor.settings).toEqual(settings);
    const persisted = store.createOrgToolsState();
    expect(parseOrgToolsState(persisted)).toEqual(persisted);
    const restored = new OrgStore();
    restored.loadOrgToolsState(persisted, null, null);
    expect(restored.activeOrgViewId).toBe(copyId);
    expect(restored.orgEditor.settings).toEqual(settings);
    expect(restored.createOrgToolsState()).toEqual(persisted);
    store.createOrgView("Blank settings", { type: "blank" });
    expect(store.orgEditor.settings).toEqual({
      groupByTag: true,
      showTagCloud: true,
      distributedColor: "green",
      undistributedColor: "amber",
    });
  });
});
