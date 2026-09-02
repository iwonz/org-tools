import type { Employee, OrgEditorUnit } from "@org-tools/types";
import { describe, expect, test } from "vitest";
import {
  getOrgEditorEmployeeTextMaxWidth,
  getOrgEditorUnitBounds,
  getOrgEditorUnitHeightForEmployeeRows,
  ORG_EDITOR_EMPLOYEE_TAG_STYLE,
  ORG_EDITOR_UNIT_BORDER_RADIUS,
  ORG_EDITOR_UNIT_HEADER_HEIGHT,
} from "@/lib/org-editor";
import {
  buildOrgEditorExportRows,
  createDefaultOrgEditorImageExportSettings,
  createOrgEditorExportEmployeeTagLayout,
  createOrgEditorExportFileBaseName,
  getEmployeeCanvasAvatarUrl,
  getOrgEditorExportConnectionPath,
  getOrgEditorExportEmployeeGeometry,
  getOrgEditorExportEmployeeRowHeight,
  getOrgEditorExportEmployeeRowHeightForTagLayout,
  getOrgEditorExportEmployeeTagChipWidth,
  getOrgEditorExportEmployeeTagLabels,
  getOrgEditorExportEmployeeTagRowCount,
  ORG_EDITOR_EXPORT_EMPLOYEE_TAG_STYLE,
  ORG_EDITOR_EXPORT_GRADIENTS,
} from "@/lib/org-editor-export";

const employee: Employee = {
  avatarBase64Url: "data:image/webp;base64,aGVsbG8=",
  birthday: null,
  email: "avery@example.test",
  firstName: "Avery",
  fullName: "Avery Stone",
  gender: "unspecified",
  id: "00000000-0000-4000-8000-000000000011",
  lastName: "Stone",
  phone: "+1 555-0111",
  profileUrl: null,
  tags: [],
  unitIds: [],
  unitPositions: [],
  username: "avery",
};

const unit: OrgEditorUnit = {
  bossEmployeeId: null,
  collapsed: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  employeeIds: [],
  employeePositions: [],
  id: "00000000-0000-4000-8000-000000000012",
  liveFilter: null,
  name: "Research & Development / Lab",
  order: 0,
  parentId: null,
  updatedAt: "2026-01-01T00:00:00.000Z",
  x: 0,
  y: 0,
};

describe("Org Editor image export", () => {
  test("uses only a validated embedded avatar", () => {
    expect(getEmployeeCanvasAvatarUrl(employee)).toBe(employee.avatarBase64Url);
    expect(
      getEmployeeCanvasAvatarUrl({ ...employee, avatarBase64Url: "blob:untrusted-avatar" }),
    ).toBeNull();
    expect(getEmployeeCanvasAvatarUrl(undefined)).toBeNull();
  });

  test("uses English defaults and filesystem-safe Unit names", () => {
    expect(createDefaultOrgEditorImageExportSettings()).toMatchObject({
      imageBossLabel: "Manager",
      unitBorderRadius: ORG_EDITOR_UNIT_BORDER_RADIUS,
    });
    expect(createDefaultOrgEditorImageExportSettings("Localized manager").imageBossLabel).toBe(
      "Localized manager",
    );
    expect(ORG_EDITOR_EXPORT_GRADIENTS.map(({ label }) => label)).toEqual([
      "Air",
      "Mint",
      "Rose",
      "Amber",
      "Lavender",
      "Graphite",
      "Aurora",
    ]);
    expect(createOrgEditorExportFileBaseName(unit)).toBe("Research-Development-Lab");
  });

  test("localizes every dated tag and expands PNG rows with compact export geometry", () => {
    const taggedEmployee = {
      ...employee,
      tags: [
        { date: null, label: "Alpha" },
        { date: "2026-09-01", label: "Last day" },
        { date: null, label: "Remote" },
        { date: null, label: "Mentor" },
      ],
    };
    const english = getOrgEditorExportEmployeeTagLabels(taggedEmployee, "en");
    const russian = getOrgEditorExportEmployeeTagLabels(taggedEmployee, "ru");
    expect(english).toHaveLength(4);
    expect(english).toContain("Last day · Sep 1, 2026");
    expect(russian).not.toEqual(english);
    expect(getOrgEditorExportEmployeeTagChipWidth("Alpha", 90)).toBe(38);
    expect(getOrgEditorExportEmployeeTagChipWidth("Mentor", 90)).toBeCloseTo(43.2);
    expect(getOrgEditorExportEmployeeTagRowCount(english, 90)).toBe(3);
    expect(getOrgEditorExportEmployeeRowHeight(taggedEmployee, "en", 90)).toBeGreaterThan(76);
  });

  test("wraps one oversized tag in full and grows following geometry", () => {
    const label = "StrategicCustomerExperienceOperationsEnablement";
    const measureText = (text: string) => [...text].length * 6;
    const layout = createOrgEditorExportEmployeeTagLayout([label, "Remote"], 72, measureText);
    const longChip = layout.chips[0];
    const followingChip = layout.chips[1];
    if (!longChip || !followingChip) throw new Error("Expected both tag chips.");

    expect(longChip.lines.length).toBeGreaterThan(1);
    expect(longChip.lines.join("")).toBe(label);
    expect(longChip.lines.every((line) => measureText(line) <= 60)).toBe(true);
    expect(longChip.lines.every((line) => !line.includes("..."))).toBe(true);
    expect(longChip.width).toBe(72);
    expect(longChip.height).toBeGreaterThan(ORG_EDITOR_EXPORT_EMPLOYEE_TAG_STYLE.height);
    expect(followingChip.y).toBeGreaterThanOrEqual(longChip.height + 2);
    expect(layout.rowCount).toBe(2);
    expect(getOrgEditorExportEmployeeRowHeightForTagLayout(layout)).toBe(
      48 + layout.height - ORG_EDITOR_EXPORT_EMPLOYEE_TAG_STYLE.height,
    );
  });

  test("shares compact tag and Employee-row geometry with the live canvas", () => {
    expect(ORG_EDITOR_EXPORT_EMPLOYEE_TAG_STYLE).toEqual({
      ...ORG_EDITOR_EMPLOYEE_TAG_STYLE,
      fillStyle: "rgba(29, 29, 29, 0.1)",
      textStyle: "#1d1d1d",
    });
    expect(ORG_EDITOR_EXPORT_EMPLOYEE_TAG_STYLE.fillStyle).not.toContain("39, 135, 245");
    expect(ORG_EDITOR_EXPORT_EMPLOYEE_TAG_STYLE.textStyle).not.toBe("#2787f5");

    const unitWidth = getOrgEditorUnitBounds(unit).width;
    expect(getOrgEditorEmployeeTextMaxWidth(unitWidth)).toBe(310);
    expect(getOrgEditorExportEmployeeGeometry(unit, 0, 76, 40)).toEqual({
      avatarX: 27,
      avatarY: 119,
      rowTop: ORG_EDITOR_UNIT_HEADER_HEIGHT + 9,
      tagY: 108,
      textBaselineY: 103,
      textMaxWidth: 310,
      textX: 45,
    });
    expect(
      getOrgEditorUnitHeightForEmployeeRows({
        collapsed: false,
        employeeRowHeights: [76, 48],
      }),
    ).toBe(212);
  });

  test("anchors hierarchy connections to rendered card heights", () => {
    const child = {
      ...unit,
      id: "00000000-0000-4000-8000-000000000013",
      name: "Child",
      parentId: unit.id,
      x: 400,
      y: 300,
    };

    expect(
      getOrgEditorExportConnectionPath({
        employeeById: new Map(),
        layoutMode: "topDown",
        parentUnit: unit,
        parentUnitHeight: 212,
        unit: child,
        unitHeight: 136,
      }),
    ).toBe("M 188 212 C 188 256, 540 256, 540 300");
  });
});

describe("Org Editor structured export scope", () => {
  test("limits Employees and Unit assignments to the selected Unit or subtree", () => {
    const root = { ...unit, employeeIds: [employee.id] };
    const child: OrgEditorUnit = {
      ...unit,
      employeeIds: [employee.id],
      id: "00000000-0000-4000-8000-000000000013",
      name: "Child",
      parentId: root.id,
      x: 360,
      y: 240,
    };
    const sourceIndex = { employeesById: new Map([[employee.id, employee]]) };

    const unitRows = buildOrgEditorExportRows({
      rootUnit: root,
      rowMode: "allUnits",
      scope: "unit",
      sourceIndex,
      units: [root, child],
    });
    const subtreeRows = buildOrgEditorExportRows({
      rootUnit: root,
      rowMode: "allUnits",
      scope: "subtree",
      sourceIndex,
      units: [root, child],
    });
    expect(unitRows.map((row) => row.unitContext?.unitName)).toEqual([root.name]);
    expect(subtreeRows.map((row) => row.unitContext?.unitName)).toEqual([root.name, child.name]);
    expect(subtreeRows[1]?.unitContext?.unitPosition.unitPath.names).toEqual([
      root.name,
      child.name,
    ]);
  });
});
