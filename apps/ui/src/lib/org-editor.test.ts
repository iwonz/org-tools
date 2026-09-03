import type { Employee, OrgEditorUnit } from "@org-tools/types";
import { describe, expect, test } from "vitest";

import {
  buildOrgEditorUnitEmployeeSummaryById,
  buildOrgEditorUnitTagSummary,
  findOrgEditorEmployeeRowIndex,
  getAdaptiveOrgEditorGridSize,
  getOrgEditorEmployeeBounds,
  getOrgEditorEmployeeRowHeightForTagLabels,
  getOrgEditorEmployeeRowLayout,
  getOrgEditorEmployeeTextMaxWidth,
  getOrgEditorEmployeeVisualGeometry,
  getOrgEditorUnitHeight,
  getOrgEditorUnitHeightForEmployeeRows,
  getOrgEditorUnitTagFooterHeight,
  layoutOrgEditorUnits,
  ORG_EDITOR_EMPLOYEE_TAG_STYLE,
  ORG_EDITOR_GRID_MIN_SCREEN_SIZE,
  ORG_EDITOR_GRID_SIZE,
  type OrgEditorUnitEmployeeSummary,
  setOrgEditorUnitEmployeeRowHeights,
  setOrgEditorUnitTagFooterHeight,
  snapOrgEditorCoordinate,
} from "@/lib/org-editor";

describe("Org Editor adaptive grid", () => {
  test("uses power-of-two document steps while keeping screen spacing legible", () => {
    expect(getAdaptiveOrgEditorGridSize(2.2)).toBe(24);
    expect(getAdaptiveOrgEditorGridSize(1)).toBe(24);
    expect(getAdaptiveOrgEditorGridSize(0.5)).toBe(48);
    expect(getAdaptiveOrgEditorGridSize(0.25)).toBe(96);
    expect(getAdaptiveOrgEditorGridSize(0.1)).toBe(384);

    for (const scale of [0.1, 0.25, 0.5, 1, 2.2]) {
      const documentSize = getAdaptiveOrgEditorGridSize(scale);
      const screenSize = documentSize * scale;

      expect(documentSize % ORG_EDITOR_GRID_SIZE).toBe(0);
      expect(screenSize).toBeGreaterThanOrEqual(ORG_EDITOR_GRID_MIN_SCREEN_SIZE);
      expect(screenSize).toBeLessThanOrEqual(ORG_EDITOR_GRID_SIZE * 2.2);
    }
  });

  test("snaps negative and positive coordinates and generated hierarchy layout", () => {
    expect(snapOrgEditorCoordinate(13)).toBe(24);
    expect(snapOrgEditorCoordinate(-13)).toBe(-24);

    const layout = layoutOrgEditorUnits(
      [
        createUnit({ id: "root", x: 13, y: 37 }),
        createUnit({ id: "child-a", parentId: "root", x: 181, y: 247 }),
        createUnit({ id: "child-b", parentId: "root", x: 319, y: 403 }),
      ],
      "topDown",
    );

    for (const unit of layout) {
      expect(Math.abs(unit.x % ORG_EDITOR_GRID_SIZE)).toBe(0);
      expect(Math.abs(unit.y % ORG_EDITOR_GRID_SIZE)).toBe(0);
    }
  });
});

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
  test("keeps card content on one shared visual grid", () => {
    expect(ORG_EDITOR_EMPLOYEE_TAG_STYLE).toEqual({
      fontSize: 9,
      gap: 2,
      height: 12,
      horizontalPadding: 6,
      radius: 6,
      widthPerCharacter: 5.2,
    });
    expect(getOrgEditorEmployeeTextMaxWidth(280)).toBe(214);
    expect(
      getOrgEditorEmployeeVisualGeometry({
        employeeRowHeight: 48,
        employeeRowOffset: 0,
        tagRowCount: 1,
        unitWidth: 280,
        unitX: 24,
        unitY: 48,
      }),
    ).toEqual({
      avatarX: 51,
      avatarY: 153,
      rowTop: 129,
      tagY: 156,
      textBaselineY: 151,
      textMaxWidth: 214,
      textX: 69,
    });
    expect(
      getOrgEditorUnitHeightForEmployeeRows({ collapsed: false, employeeRowHeights: [] }),
    ).toBe(120);
    expect(getOrgEditorUnitHeightForEmployeeRows({ collapsed: true, employeeRowHeights: [] })).toBe(
      72,
    );
  });

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

describe("Org Editor Unit Tag footer", () => {
  test("counts direct Employees once and follows catalog order", () => {
    const employee = (id: string, tags: Employee["tags"]): Employee => ({ id, tags }) as Employee;
    const employees = new Map([
      [
        "employee-1",
        employee("employee-1", [
          { color: "blue", date: null, label: "Platform", tagId: "tag-platform" },
          { color: "rose", date: "2026-09-03", label: "On call", tagId: "tag-on-call" },
        ]),
      ],
      [
        "employee-2",
        employee("employee-2", [
          { color: "blue", date: null, label: "Platform", tagId: "tag-platform" },
        ]),
      ],
      [
        "descendant-only",
        employee("descendant-only", [
          { color: "green", date: null, label: "Child", tagId: "tag-child" },
        ]),
      ],
    ]);
    const unit = createUnit({
      employeeIds: ["employee-1", "employee-1", "employee-2"],
      id: "tag-footer",
    });
    const summary = buildOrgEditorUnitTagSummary(unit, employees, [
      "tag-on-call",
      "tag-platform",
      "tag-child",
    ]);

    expect(summary.map(({ count, label }) => ({ count, label }))).toEqual([
      { count: 1, label: "On call" },
      { count: 2, label: "Platform" },
    ]);
    const footerHeight = getOrgEditorUnitTagFooterHeight(summary, 120);
    const baseHeight = getOrgEditorUnitHeight(unit);
    setOrgEditorUnitTagFooterHeight(unit.id, footerHeight);
    expect(getOrgEditorUnitHeight(unit)).toBe(baseHeight + footerHeight);
    unit.collapsed = true;
    expect(getOrgEditorUnitHeight(unit)).toBe(72);
  });
});
