import type { OrgEditorUnit } from "@org-tools/types";
import { describe, expect, test } from "vitest";

import {
  buildOrgEditorUnitEmployeeSummaryById,
  findOrgEditorEmployeeRowIndex,
  getOrgEditorEmployeeBounds,
  getOrgEditorEmployeeRowHeightForTagLabels,
  getOrgEditorEmployeeRowLayout,
  getOrgEditorUnitHeight,
  type OrgEditorUnitEmployeeSummary,
  setOrgEditorUnitEmployeeRowHeights,
} from "@/lib/org-editor";

const createUnit = (unit: Partial<OrgEditorUnit> & Pick<OrgEditorUnit, "id">): OrgEditorUnit => ({
  bossEmployeeId: null,
  collapsed: false,
  createdAt: "2026-07-31T00:00:00.000Z",
  employeeIds: [],
  employeePositions: [],
  liveFilter: null,
  name: unit.id,
  order: 0,
  parentId: null,
  updatedAt: "2026-07-31T00:00:00.000Z",
  x: 0,
  y: 0,
  ...unit,
});

const getSummary = (
  summaries: ReadonlyMap<string, OrgEditorUnitEmployeeSummary>,
  unitId: string,
) => {
  const summary = summaries.get(unitId);
  if (!summary) throw new Error(`Summary for ${unitId} was not created.`);
  return summary;
};

describe("Org Editor Employee summaries", () => {
  test("keeps semantic direct and total counts for localized presentation", () => {
    const summaries = buildOrgEditorUnitEmployeeSummaryById([
      createUnit({ employeeIds: ["employee-1", "employee-2"], id: "root" }),
      createUnit({ employeeIds: ["employee-3"], id: "leaf", parentId: "root" }),
    ]);

    expect(getSummary(summaries, "root")).toEqual({
      directCount: 2,
      hasChildUnits: true,
      totalCount: 3,
    });
    expect(getSummary(summaries, "leaf")).toEqual({
      directCount: 1,
      hasChildUnits: false,
      totalCount: 1,
    });
  });

  test("deduplicates descendants against ancestors while retaining a Unit boss", () => {
    const summaries = buildOrgEditorUnitEmployeeSummaryById([
      createUnit({ employeeIds: ["employee-1"], id: "root" }),
      createUnit({
        bossEmployeeId: "employee-1",
        employeeIds: ["employee-1", "employee-2"],
        id: "child",
        parentId: "root",
      }),
      createUnit({
        employeeIds: ["employee-2", "employee-3"],
        id: "grandchild",
        parentId: "child",
      }),
    ]);

    expect(summaries.get("root")).toMatchObject({ directCount: 1, totalCount: 3 });
    expect(summaries.get("child")).toMatchObject({ directCount: 2, totalCount: 3 });
  });
});

describe("Org Editor variable Employee geometry", () => {
  test("packs every tag and derives prefix offsets for bounds and virtualization", () => {
    const unit = createUnit({
      employeeIds: ["employee-1", "employee-2"],
      id: "variable-height",
    });
    const firstHeight = getOrgEditorEmployeeRowHeightForTagLabels(
      ["Alpha", "Last day · Sep 1, 2026", "Remote", "Mentor"],
      90,
    );
    setOrgEditorUnitEmployeeRowHeights(
      unit.id,
      new Map([
        ["employee-1", firstHeight],
        ["employee-2", 48],
      ]),
      unit.employeeIds,
    );

    const layout = getOrgEditorEmployeeRowLayout(unit);
    expect(firstHeight).toBeGreaterThan(48);
    expect(layout.offsets).toEqual([0, firstHeight]);
    expect(layout.totalHeight).toBe(firstHeight + 48);
    expect(findOrgEditorEmployeeRowIndex(layout, firstHeight + 1)).toBe(1);
    expect(getOrgEditorEmployeeBounds(unit, 1).y).toBe(unit.y + 72 + 8 + firstHeight);
    expect(getOrgEditorUnitHeight(unit)).toBeGreaterThan(120);
  });

  test("indexes variable rows for a maintained large View without scanning at lookup time", () => {
    const employeeIds = Array.from({ length: 20_000 }, (_, index) => `employee-${index}`);
    const unit = createUnit({ employeeIds, id: "large-variable-height" });
    const heights = new Map(employeeIds.map((id, index) => [id, index % 5 === 0 ? 76 : 48]));
    setOrgEditorUnitEmployeeRowHeights(unit.id, heights, employeeIds);

    const layout = getOrgEditorEmployeeRowLayout(unit);
    expect(layout.heights).toHaveLength(20_000);
    expect(layout.offsets.at(-1)).toBe(layout.totalHeight - 48);
    expect(findOrgEditorEmployeeRowIndex(layout, layout.totalHeight - 1)).toBe(19_999);
    expect(getOrgEditorUnitHeight(unit)).toBeGreaterThan(layout.totalHeight);
  });
});
