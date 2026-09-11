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
            groupByTag,
          },
          employees,
        ),
      ).toEqual([firstId, secondId]);
    }
  });

  test("groups once by earliest Tag, keeps boss first, and uses one undoable setting", () => {
    const { store, unitId, boss, both, later, first, untagged, ordered } = setup();
    const persistedAssignments = structuredClone(
      store.organizationEmployees.map((employee) => employee.tags),
    );
    expect(store.mainOrgEditor.units[0]?.groupByTag).toBe(true);
    expect(ordered()).toEqual([boss, both, first, later, untagged]);
    const sequence = store.organizationChangeSequence;
    store.mainOrgEditor.setUnitGroupByTag(unitId, false);
    expect(store.organizationChangeSequence).toBe(sequence + 1);
    expect(ordered()).toEqual([boss, untagged, later, both, first]);
    store.mainOrgEditor.setUnitGroupByTag(unitId, false);
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
      getOrgEditorOrderedEmployeeIds(live(), required(store.units).indexes.employeesById),
    ).toEqual([both, first, later, boss, untagged]);
    store.deleteTagDefinition(zulu);
    expect(
      getOrgEditorOrderedEmployeeIds(live(), required(store.units).indexes.employeesById),
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
    editor.setUnitGroupByTag(liveId, false);
    editor.setUnitsCollapsed([unitId, liveId], true);
    expect(buildOrgEditorUnitEmployeeSummaryById(materialized())).toEqual(summaries);
    store.createOrgView("Empty scenario", { type: "blank" });
    expect(buildEditorEmployeeUnitIndex(store.orgEditor.units).size).toBe(0);
    expect(buildEditorEmployeeUnitIndex(materialized()).get(boss)).toEqual([unitId, liveId]);
  });

  test("requires boolean grouping in every Unit and leaves invalid loads atomic", () => {
    const { store } = setup();
    const original = store.createOrgToolsState();
    for (const invalid of [undefined, null, "true", 1]) {
      const candidate = structuredClone(original);
      const unit = required(required(candidate.organization.views[0]).structure.units[0]);
      if (invalid === undefined) Reflect.deleteProperty(unit, "groupByTag");
      else Reflect.set(unit, "groupByTag", invalid);
      expect(() => parseOrgToolsState(candidate)).toThrow();
      expect(() => store.loadOrgToolsState(candidate, null, null)).toThrow();
      expect(store.createOrgToolsState()).toEqual(original);
    }
  });
});
