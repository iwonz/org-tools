import type { Employee, EmployeeUnitPosition, OrgEditorUnit } from "@org-tools/types";
import { describe, expect, test } from "vitest";
import type { EmployeeDisplayLine } from "@/lib/employee-display";
import { createOrgUnitContext } from "@/lib/employee-unit-contexts";

import {
  buildOrgEditorUnitEmployeeSummaryById,
  buildOrgEditorUnitTagSummary,
  createOrgEditorUnitTagFooterLayout,
  findOrgEditorEmployeeRowIndex,
  getAdaptiveOrgEditorGridSize,
  getOrgEditorEmployeeBounds,
  getOrgEditorEmployeeDisplayLineBaselines,
  getOrgEditorEmployeeRichVisualLineCount,
  getOrgEditorEmployeeRowHeightForDisplayLines,
  getOrgEditorEmployeeRowHeightForRichLines,
  getOrgEditorEmployeeRowHeightForTagLabels,
  getOrgEditorEmployeeRowLayout,
  getOrgEditorEmployeeRowStackLayout,
  getOrgEditorEmployeeTextMaxWidth,
  getOrgEditorEmployeeVisualGeometry,
  getOrgEditorOrderedUnitRows,
  getOrgEditorUnitHeight,
  getOrgEditorUnitHeightForEmployeeRows,
  getOrgEditorUnitTagFooterChipWidth,
  getOrgEditorUnitTagFooterHeight,
  layoutOrgEditorUnits,
  ORG_EDITOR_EMPLOYEE_ROW_GAP,
  ORG_EDITOR_EMPLOYEE_TAG_STYLE,
  ORG_EDITOR_GRID_MIN_SCREEN_SIZE,
  ORG_EDITOR_GRID_SIZE,
  ORG_EDITOR_UNIT_TAG_FOOTER_CHIP_HEIGHT,
  ORG_EDITOR_UNIT_TAG_FOOTER_CHIP_HORIZONTAL_PADDING,
  ORG_EDITOR_UNIT_TAG_FOOTER_PADDING,
  type OrgEditorUnitEmployeeSummary,
  setOrgEditorUnitEmployeeRowHeights,
  setOrgEditorUnitRowHeights,
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

describe("Org Editor Employee display geometry", () => {
  test("uses the current minimum and expands deterministically for additional lines", () => {
    expect(getOrgEditorEmployeeRowHeightForDisplayLines(0)).toBe(48);
    expect(getOrgEditorEmployeeRowHeightForDisplayLines(2)).toBe(48);
    expect(getOrgEditorEmployeeRowHeightForDisplayLines(3)).toBe(64);
    expect(getOrgEditorEmployeeRowHeightForDisplayLines(3, 4)).toBe(72);
    expect(getOrgEditorEmployeeRowHeightForDisplayLines(3, 24)).toBe(112);
    expect(
      getOrgEditorEmployeeDisplayLineBaselines({
        employeeRowHeight: 64,
        employeeRowOffset: 12,
        lineCount: 3,
        unitY: 100,
      }),
    ).toEqual([214, 230, 246]);
    expect(
      getOrgEditorEmployeeDisplayLineBaselines({
        employeeRowHeight: 72,
        employeeRowOffset: 12,
        lineCount: 3,
        lineGap: 4,
        unitY: 100,
      }),
    ).toEqual([214, 234, 254]);
    expect(
      getOrgEditorEmployeeDisplayLineBaselines({
        employeeRowHeight: 112,
        employeeRowOffset: 12,
        lineCount: 3,
        lineGap: 24,
        unitY: 100,
      }),
    ).toEqual([214, 254, 294]);
  });

  test("expands rich rows for wrapped native Tags", () => {
    const lines: EmployeeDisplayLine[] = [
      {
        nodes: [
          {
            explicitLink: false,
            fieldName: "fullName",
            href: null,
            marks: { bold: false, code: false, italic: false, strike: false },
            text: "Avery Stone",
            type: "text",
          },
        ],
        text: "Avery Stone",
      },
      {
        nodes: [
          {
            tags: [
              {
                color: "blue",
                date: null,
                label: "Design systems",
                tagId: "00000000-0000-4000-8000-000000000001",
              },
              {
                color: "teal",
                date: "2031-03-02",
                label: "Remote research",
                tagId: "00000000-0000-4000-8000-000000000002",
              },
            ],
            type: "tags",
          },
        ],
        text: "Design systems; Remote research",
      },
    ];
    expect(getOrgEditorEmployeeRichVisualLineCount(lines, 90)).toBe(3);
    expect(getOrgEditorEmployeeRowHeightForRichLines(lines, 90)).toBe(64);
    expect(
      getOrgEditorEmployeeRichVisualLineCount(lines, 120, (tag) =>
        tag.date ? `${tag.label} · 2 Mar` : tag.label,
      ),
    ).toBeGreaterThanOrEqual(3);
  });

  test("wraps compound assignments into the same content-sized visual fragments", () => {
    const createUnitContext = (value: number, unitName: string, position: string) =>
      createOrgUnitContext({
        isBoss: false,
        parentId: null,
        position,
        unitId: `00000000-0000-4000-8000-${String(value).padStart(12, "0")}`,
        unitName,
        unitPath: {
          fullName: unitName,
          ids: [`00000000-0000-4000-8000-${String(value).padStart(12, "0")}`],
          names: [unitName],
        },
      } as EmployeeUnitPosition);
    const product = createUnitContext(20, "Product", "Lead");
    const research = createUnitContext(21, "Research", "Advisor");
    const lines: EmployeeDisplayLine[] = [
      {
        nodes: [
          {
            positions: [
              { label: "Lead", unitContext: product },
              { label: "Advisor", unitContext: research },
            ],
            type: "positions",
          },
        ],
        text: "Lead · Product; Advisor · Research",
      },
    ];

    expect(getOrgEditorEmployeeRichVisualLineCount(lines, 80)).toBe(4);
    expect(getOrgEditorEmployeeRowHeightForRichLines(lines, 80)).toBe(80);
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
  noteMarkdown: "",
  openPositions: [],
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

  test.each([null, "employee-1"])(
    "counts each subtree independently with boss %s",
    (bossEmployeeId) => {
      const units = [
        createUnit({ employeeIds: ["employee-1"], id: "root" }),
        createUnit({
          bossEmployeeId,
          employeeIds: ["employee-1", "employee-2"],
          id: "child",
          parentId: "root",
        }),
        createUnit({
          employeeIds: ["employee-1", "employee-3"],
          id: "grandchild",
          parentId: "child",
        }),
        createUnit({ employeeIds: ["employee-1", "employee-1"], id: "sibling", parentId: "root" }),
        createUnit({ id: "empty" }),
      ];
      for (const collapsed of [false, true]) {
        const summaries = buildOrgEditorUnitEmployeeSummaryById(
          units.map((unit) => ({ ...unit, collapsed })),
        );
        expect(summaries.get("root")).toMatchObject({ directCount: 1, totalCount: 3 });
        expect(summaries.get("child")).toMatchObject({ directCount: 2, totalCount: 3 });
        expect(summaries.get("grandchild")).toMatchObject({ directCount: 2, totalCount: 2 });
        expect(summaries.get("sibling")).toMatchObject({ directCount: 1, totalCount: 1 });
        expect(summaries.get("empty")).toMatchObject({ directCount: 0, totalCount: 0 });
      }
    },
  );

  test("matches independent descendant unions for 20,000 Employees and 4,000 Units", () => {
    const units = Array.from({ length: 4_000 }, (_, index) =>
      createUnit({
        id: `unit-${index}`,
        parentId: index < 2 ? null : `unit-${Math.floor(index / 2) - 1}`,
        employeeIds: [
          ...Array.from({ length: 5 }, (_, offset) => `employee-${index * 5 + offset}`),
          "employee-0",
        ],
      }),
    );
    const summaries = buildOrgEditorUnitEmployeeSummaryById(units);
    const expected = new Map(units.map((unit) => [unit.id, new Set(unit.employeeIds)]));
    const byId = new Map(units.map((unit) => [unit.id, unit]));
    // Walk ancestors from each direct assignment, independently of the production subtree traversal.
    for (const unit of units) {
      let parent = unit.parentId ? byId.get(unit.parentId) : undefined;
      while (parent) {
        for (const id of unit.employeeIds) expected.get(parent.id)?.add(id);
        parent = parent.parentId ? byId.get(parent.parentId) : undefined;
      }
    }
    for (const unit of units) {
      expect(summaries.get(unit.id)?.totalCount).toBe(expected.get(unit.id)?.size);
      expect(summaries.get(unit.id)?.directCount).toBe(new Set(unit.employeeIds).size);
    }
  });
});

describe("Org Editor variable Employee geometry", () => {
  test("adds spacing only between visible rows", () => {
    expect(ORG_EDITOR_EMPLOYEE_ROW_GAP).toBe(4);
    expect(getOrgEditorEmployeeRowStackLayout([])).toEqual({ offsets: [], totalHeight: 0 });
    expect(getOrgEditorEmployeeRowStackLayout([48])).toEqual({
      offsets: [0],
      totalHeight: 48,
    });
    expect(getOrgEditorEmployeeRowStackLayout([48, 76, 48])).toEqual({
      offsets: [0, 52, 132],
      totalHeight: 180,
    });
  });

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
    expect(layout.offsets).toEqual([0, firstHeight + ORG_EDITOR_EMPLOYEE_ROW_GAP]);
    expect(layout.totalHeight).toBe(firstHeight + ORG_EDITOR_EMPLOYEE_ROW_GAP + 48);
    expect(findOrgEditorEmployeeRowIndex(layout, firstHeight + 1)).toBe(1);
    expect(getOrgEditorEmployeeBounds(unit, 1).y).toBe(
      unit.y + 72 + 8 + firstHeight + ORG_EDITOR_EMPLOYEE_ROW_GAP,
    );
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

describe("Org Editor mixed Unit rows", () => {
  test("orders Employees and open positions together while keeping the boss first", () => {
    const employee = (id: string, fullName: string, tagPriority: number | null): Employee =>
      ({ fullName, id, tagPriority }) as Employee;
    const employees = new Map([
      ["boss", employee("boss", "Zed Boss", null)],
      ["member", employee("member", "Beta Member", 1)],
    ]);
    const unit = createUnit({
      bossEmployeeId: "boss",
      employeeIds: ["member", "boss"],
      id: "mixed-rows",
      openPositions: [
        { backgroundColor: null, id: "position-b", tags: [], title: "Gamma Role" },
        {
          backgroundColor: "blue",
          id: "position-a",
          tags: [{ date: null, tagId: "tag-first" }],
          title: "Alpha Role",
        },
      ],
    });

    const rows = getOrgEditorOrderedUnitRows(unit, employees, true, ["tag-first"]);
    expect(
      rows.map((row) => (row.type === "employee" ? row.employeeId : row.openPosition.id)),
    ).toEqual(["boss", "position-a", "member", "position-b"]);
    setOrgEditorUnitRowHeights(
      unit.id,
      new Map(rows.map((row, index) => [row.key, index === 1 ? 76 : 48])),
      rows,
    );
    expect(getOrgEditorEmployeeRowLayout(unit)).toMatchObject({
      heights: [48, 76, 48, 48],
      offsets: [0, 52, 132, 184],
      totalHeight: 232,
    });

    unit.collapsed = true;
    expect(getOrgEditorEmployeeRowLayout(unit).rows).toEqual([rows[0]]);
  });

  test("does not include open positions in Employee summaries or Tag-cloud counts", () => {
    const unit = createUnit({
      employeeIds: ["employee"],
      id: "position-exclusions",
      openPositions: [
        {
          backgroundColor: null,
          id: "position",
          tags: [{ date: null, tagId: "position-tag" }],
          title: "Future role",
        },
      ],
    });
    const employee = {
      id: "employee",
      tags: [{ color: "blue", date: null, label: "Employee tag", tagId: "employee-tag" }],
    } as Employee;
    expect(buildOrgEditorUnitEmployeeSummaryById([unit]).get(unit.id)?.directCount).toBe(1);
    expect(
      buildOrgEditorUnitTagSummary(unit, new Map([[employee.id, employee]]), [
        "position-tag",
        "employee-tag",
      ]).map((tag) => tag.tagId),
    ).toEqual(["employee-tag"]);
  });
});

describe("Org Editor Unit Tag footer", () => {
  test("sizes mixed-script chips by content with equal compact insets", () => {
    const chip = (label: string, count = 1, availableWidth = 264) =>
      getOrgEditorUnitTagFooterChipWidth({ count, label }, availableWidth);

    expect(chip("TeamLead")).toBeGreaterThan(chip("Vue"));
    expect(chip("Backend")).toBeGreaterThan(chip("PHP"));
    expect(chip("Cafe\u0301")).toBe(chip("Café"));
    expect(chip("团队")).toBeGreaterThan(chip("UI"));
    expect(chip("فريق")).toBeGreaterThan(40);
    expect(chip("A very long Tag name", 12, 72)).toBeLessThanOrEqual(72);
    expect(ORG_EDITOR_UNIT_TAG_FOOTER_CHIP_HORIZONTAL_PADDING).toBe(6);

    const summaries = ["TeamLead", "Vue", "Backend", "PHP"].map((label, index) => ({
      color: null,
      count: 1,
      label,
      tagId: `tag-${index}`,
    }));
    expect(getOrgEditorUnitTagFooterHeight(summaries, 264)).toBe(
      ORG_EDITOR_UNIT_TAG_FOOTER_PADDING * 2 + ORG_EDITOR_UNIT_TAG_FOOTER_CHIP_HEIGHT,
    );
  });

  test.each([
    "A deliberately long Latin Tag name",
    "\u041e\u0447\u0435\u043d\u044c \u0434\u043b\u0438\u043d\u043d\u043e\u0435 \u043d\u0430\u0437\u0432\u0430\u043d\u0438\u0435 \u043a\u0438\u0440\u0438\u043b\u043b\u0438\u0447\u0435\u0441\u043a\u043e\u0433\u043e \u0442\u0435\u0433\u0430",
    "اسم علامة عربية طويل للغاية",
    "非常に長いチームタグ名",
    "Platform 🚀🧑🏽‍💻 reliability",
  ])("wraps the complete multilingual label without an ellipsis: %s", (label) => {
    const layout = createOrgEditorUnitTagFooterLayout(
      [{ color: "blue", count: 12, label, tagId: "tag-long" }],
      96,
    );
    const chipLayouts = layout.chips.filter((chip) => chip.tagId === "tag-long");

    expect(chipLayouts.length).toBeGreaterThan(1);
    expect(chipLayouts.every((chip) => chip.width <= 96)).toBe(true);
    expect(
      chipLayouts
        .flatMap((chip) => chip.lines)
        .map((line) => line.label)
        .join("")
        .replace(/\s+/gu, ""),
    ).toBe(label.normalize("NFC").replace(/\s+/gu, ""));
    expect(chipLayouts.flatMap((chip) => chip.lines).some((line) => line.suffix === "· 12")).toBe(
      true,
    );
    expect(chipLayouts.flatMap((chip) => chip.lines).some((line) => line.label.includes("…"))).toBe(
      false,
    );
    expect(layout.height).toBeGreaterThan(
      ORG_EDITOR_UNIT_TAG_FOOTER_PADDING * 2 + ORG_EDITOR_UNIT_TAG_FOOTER_CHIP_HEIGHT,
    );
  });

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
