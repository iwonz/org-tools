import type { Employee, EmployeeUnitPosition, OrgEditorUnit } from "@org-tools/types";
import { describe, expect, test } from "vitest";
import type { EmployeeDisplayPosition } from "@/lib/employee-display";
import { createOrgUnitContext } from "@/lib/employee-unit-contexts";
import {
  getOrgEditorEmployeeRowSurfaceBounds,
  getOrgEditorEmployeeTextMaxWidth,
  getOrgEditorUnitBounds,
  getOrgEditorUnitHeightForEmployeeRows,
  ORG_EDITOR_EMPLOYEE_ROW_BORDER_RADIUS,
  ORG_EDITOR_EMPLOYEE_ROW_GAP,
  ORG_EDITOR_EMPLOYEE_ROW_HEIGHT,
  ORG_EDITOR_EMPLOYEE_TAG_STYLE,
  ORG_EDITOR_UNIT_BORDER_RADIUS,
  ORG_EDITOR_UNIT_HEADER_HEIGHT,
} from "@/lib/org-editor";
import { createOrgEditorStickerElement, createOrgEditorTextElement } from "@/lib/org-editor-canvas";
import {
  buildOrgEditorExportRows,
  createDefaultOrgEditorImageExportSettings,
  createOrgEditorExportEmployeePositionLayout,
  createOrgEditorExportEmployeeTagLayout,
  createOrgEditorExportFileBaseName,
  createOrgEditorImageRenderPlan,
  getEmployeeCanvasAvatarUrl,
  getOrgEditorExportConnectionPath,
  getOrgEditorExportEmployeeGeometry,
  getOrgEditorExportEmployeeRowFillStyle,
  getOrgEditorExportEmployeeRowHeight,
  getOrgEditorExportEmployeeRowHeightForTagLayout,
  getOrgEditorExportEmployeeTagChipWidth,
  getOrgEditorExportEmployeeTagLabels,
  getOrgEditorExportEmployeeTagRowCount,
  getOrgEditorExportEmployeeTags,
  getOrgEditorExportFontRequests,
  getOrgEditorExportOpenPositionRowBackground,
  getOrgEditorExportOpenPositionRowOutline,
  getOrgEditorImageSolidBackgroundColor,
  ORG_EDITOR_EXPORT_DENSITY,
  ORG_EDITOR_EXPORT_EMPLOYEE_TAG_STYLE,
  ORG_EDITOR_EXPORT_FONT_FAMILY,
  ORG_EDITOR_EXPORT_GRADIENTS,
  ORG_EDITOR_EXPORT_OPEN_POSITION_OUTLINE_STYLE,
} from "@/lib/org-editor-export";
import { getTagColorCanvasStyle } from "@/lib/tag-color";

const employee: Employee = {
  avatarBase64Url: "data:image/webp;base64,aGVsbG8=",
  birthday: null,
  customFieldValues: {},
  email: "avery@example.test",
  firstName: "Avery",
  fullName: "Avery Stone",
  gender: "unspecified",
  id: "00000000-0000-4000-8000-000000000011",
  lastName: "Stone",
  phone: "+1 555-0111",
  profileUrl: null,
  tags: [],
  tagPriority: null,
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
  noteMarkdown: "",
  openPositions: [],
  order: 0,
  parentId: null,
  updatedAt: "2026-01-01T00:00:00.000Z",
  x: 0,
  y: 0,
};

describe("Org Editor image export", () => {
  test("wraps compound Employee assignments into content-sized decorated fragments", () => {
    const createPosition = (
      unitId: string,
      unitName: string,
      label: string,
    ): EmployeeDisplayPosition => {
      const unitPosition = {
        isBoss: false,
        parentId: null,
        position: label,
        unitId,
        unitName,
        unitPath: { fullName: unitName, ids: [unitId], names: [unitName] },
      } as EmployeeUnitPosition;
      return { label, unitContext: createOrgUnitContext(unitPosition) };
    };
    const positions = [
      createPosition("00000000-0000-4000-8000-000000000021", "Product", "Lead"),
      createPosition("00000000-0000-4000-8000-000000000022", "Research and Development", "Advisor"),
    ];
    const layout = createOrgEditorExportEmployeePositionLayout(positions, 96);

    expect(layout.rowCount).toBeGreaterThan(2);
    expect(
      positions.map((_, itemIndex) =>
        layout.chips
          .filter((chip) => chip.itemIndex === itemIndex)
          .flatMap((chip) => chip.lines)
          .join(" ")
          .replace(/\s+/gu, " "),
      ),
    ).toEqual(["Lead · Product", "Advisor · Research and Development"]);
    expect(layout.chips.every((chip) => chip.lines.length === 1 && chip.width <= 96)).toBe(true);
    expect(layout.chips.every((chip) => chip.height === ORG_EDITOR_EMPLOYEE_TAG_STYLE.height)).toBe(
      true,
    );
  });

  test("uses only a validated embedded avatar", () => {
    expect(getEmployeeCanvasAvatarUrl(employee)).toBe(employee.avatarBase64Url);
    expect(
      getEmployeeCanvasAvatarUrl({ ...employee, avatarBase64Url: "blob:untrusted-avatar" }),
    ).toBeNull();
    expect(getEmployeeCanvasAvatarUrl(undefined)).toBeNull();
  });

  test("uses English defaults and filesystem-safe Unit names", () => {
    expect(createDefaultOrgEditorImageExportSettings()).toEqual({
      background: { type: "transparent" },
      employeeFormat: expect.any(String),
      employeeLineGap: 4,
      padding: 20,
      unitBorderRadius: ORG_EDITOR_UNIT_BORDER_RADIUS,
    });
    expect(ORG_EDITOR_EXPORT_DENSITY).toBe(3);
    expect(ORG_EDITOR_EXPORT_FONT_FAMILY).toBe("system-ui");
    expect(createDefaultOrgEditorImageExportSettings("{email}", 8)).toMatchObject({
      employeeFormat: "{email}",
      employeeLineGap: 8,
    });
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

  test("keeps the dashed open-position outline inside complete shared row bounds", () => {
    const defaultSurface = getOrgEditorEmployeeRowSurfaceBounds({
      employeeRowHeight: ORG_EDITOR_EMPLOYEE_ROW_HEIGHT,
      employeeRowOffset: 0,
      unit,
    });
    const defaultOutline = getOrgEditorExportOpenPositionRowOutline({
      employeeRowHeight: ORG_EDITOR_EMPLOYEE_ROW_HEIGHT,
      employeeRowOffset: 0,
      unit,
    });
    const taggedHeight =
      ORG_EDITOR_EMPLOYEE_ROW_HEIGHT +
      ORG_EDITOR_EMPLOYEE_TAG_STYLE.height * 2 +
      ORG_EDITOR_EMPLOYEE_TAG_STYLE.gap;
    const taggedOutline = getOrgEditorExportOpenPositionRowOutline({
      employeeRowHeight: taggedHeight,
      employeeRowOffset: ORG_EDITOR_EMPLOYEE_ROW_HEIGHT + ORG_EDITOR_EMPLOYEE_ROW_GAP,
      unit,
    });

    expect(ORG_EDITOR_EXPORT_OPEN_POSITION_OUTLINE_STYLE).toEqual({
      dash: [4, 3],
      lineWidth: 1,
      strokeStyle: "rgba(71, 85, 105, 0.5)",
    });
    expect(defaultOutline).toMatchObject({
      bounds: {
        height: defaultSurface.height - 1,
        width: defaultSurface.width - 1,
        x: defaultSurface.x + 0.5,
        y: defaultSurface.y + 0.5,
      },
      radius: ORG_EDITOR_EMPLOYEE_ROW_BORDER_RADIUS - 0.5,
    });
    expect(taggedOutline.bounds.height).toBe(taggedHeight - 1);
    expect(taggedOutline.bounds.width).toBe(defaultOutline.bounds.width);
    expect(taggedOutline.bounds.y).toBe(
      defaultOutline.bounds.y + ORG_EDITOR_EMPLOYEE_ROW_HEIGHT + ORG_EDITOR_EMPLOYEE_ROW_GAP,
    );
  });

  test("resolves optional open-position backgrounds through the shared tonal palette", () => {
    expect(getOrgEditorExportOpenPositionRowBackground(null)).toBeNull();
    expect(getOrgEditorExportOpenPositionRowBackground("blue")).toEqual(
      getTagColorCanvasStyle("blue"),
    );
    expect(getOrgEditorExportOpenPositionRowBackground("#7c3aed80")).toEqual(
      getTagColorCanvasStyle("#7c3aed80"),
    );
    expect(getOrgEditorExportOpenPositionRowBackground("#7c3aed66")).toEqual({
      fillStyle: "#7c3aed66",
      textStyle: expect.stringMatching(/^#[0-9a-f]{6}$/u),
    });
  });

  test("resolves preset, custom, and alpha image backgrounds through the shared palette", () => {
    expect(getOrgEditorImageSolidBackgroundColor("blue")).toMatch(/^#[0-9a-f]{6}$/u);
    expect(getOrgEditorImageSolidBackgroundColor("#7c3aed")).toBe("#7c3aed");
    expect(getOrgEditorImageSolidBackgroundColor("#7c3aed66")).toBe("#7c3aed66");
  });

  test("waits for every base and inline Text and Sticker font used by PNG", () => {
    const text = {
      ...createOrgEditorTextElement({ x: 0, y: 0 }),
      formatRuns: [
        {
          end: 2,
          start: 0,
          typography: {
            color: "blue" as const,
            fontFamily: "Lobster",
            fontSize: 31,
            fontWeight: 700 as const,
          },
        },
      ],
      text: "Hi",
      typography: {
        ...createOrgEditorTextElement({ x: 0, y: 0 }).typography,
        fontFamily: "Bebas Neue",
        fontSize: 24,
      },
    };
    const sticker = {
      ...createOrgEditorStickerElement({ x: 0, y: 0 }),
      formatRuns: [
        {
          end: 2,
          start: 0,
          typography: {
            color: "rose" as const,
            fontFamily: "Georgia",
            fontSize: 27,
            fontWeight: 400 as const,
          },
        },
      ],
      text: "Hi",
    };
    const requests = getOrgEditorExportFontRequests({
      canvasElements: [text, sticker],
    });
    expect(requests).toContain('400 24px "Bebas Neue", Impact, sans-serif');
    expect(requests).toContain("700 31px Lobster, Georgia, serif");
    expect(requests).toContain('400 27px Georgia, "Times New Roman", serif');
    expect(requests.some((request) => request.includes("system-ui"))).toBe(true);
    expect(
      requests.some(
        (request) => request.startsWith("italic 600 12px") && request.includes("system-ui"),
      ),
    ).toBe(true);
  });

  test("localizes every dated tag and expands PNG rows with universal Tag geometry", () => {
    const taggedEmployee: Employee = {
      ...employee,
      tags: [
        { color: "blue", date: null, label: "Alpha" },
        { color: "#7c3aed80", date: "2026-09-01", label: "Last day" },
        { color: null, date: null, label: "Remote" },
        { date: null, label: "Mentor" },
      ],
    };
    const english = getOrgEditorExportEmployeeTagLabels(taggedEmployee, "en");
    const russian = getOrgEditorExportEmployeeTagLabels(taggedEmployee, "ru");
    expect(english).toHaveLength(4);
    expect(english).toContain("Last day · Sep 1, 2026");
    expect(russian).not.toEqual(english);
    expect(getOrgEditorExportEmployeeTags(taggedEmployee, "en")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ color: "blue", label: "Alpha" }),
        expect.objectContaining({
          color: "#7c3aed80",
          label: "Last day",
          suffix: " · Sep 1, 2026",
        }),
      ]),
    );
    expect(getOrgEditorExportEmployeeTagChipWidth("Alpha", 90)).toBeGreaterThan(40);
    expect(getOrgEditorExportEmployeeTagChipWidth("Mentor", 90)).toBeGreaterThan(
      getOrgEditorExportEmployeeTagChipWidth("Alpha", 90),
    );
    expect(getOrgEditorExportEmployeeTagRowCount(english, 90)).toBe(5);
    expect(getOrgEditorExportEmployeeRowHeight(taggedEmployee, "en", 90)).toBeGreaterThan(76);
  });

  test("wraps one oversized tag in full and grows following geometry", () => {
    const label = "StrategicCustomerExperienceOperationsEnablement";
    const measureText = (text: string) => [...text].length * 6;
    const layout = createOrgEditorExportEmployeeTagLayout([label, "Remote"], 72, measureText);
    const longChips = layout.chips.filter((chip) => chip.itemIndex === 0);
    const followingChip = layout.chips.find((chip) => chip.itemIndex === 1);
    if (!followingChip) throw new Error("Expected both logical tags.");

    expect(longChips.length).toBeGreaterThan(1);
    expect(longChips.flatMap((chip) => chip.lines).join("")).toBe(label);
    expect(longChips.every((chip) => chip.lines.every((line) => measureText(line) <= 60))).toBe(
      true,
    );
    expect(longChips.every((chip) => chip.lines.every((line) => !line.includes("...")))).toBe(true);
    expect(longChips.at(-1)?.width).toBeLessThan(72);
    expect(
      longChips.every((chip) => chip.height === ORG_EDITOR_EXPORT_EMPLOYEE_TAG_STYLE.height),
    ).toBe(true);
    expect(followingChip.y).toBeGreaterThanOrEqual(longChips.at(-1)?.y ?? 0);
    expect(layout.rowCount).toBeGreaterThan(2);
    expect(getOrgEditorExportEmployeeRowHeightForTagLayout(layout)).toBe(
      48 + layout.height - ORG_EDITOR_EXPORT_EMPLOYEE_TAG_STYLE.height,
    );
  });

  test("keeps every Tag color in the measured PNG chip layout", () => {
    const layout = createOrgEditorExportEmployeeTagLayout(
      [
        { color: "teal", label: "Platform" },
        { color: "#7c3aed80", label: "Mentor" },
        { color: null, label: "Remote" },
      ],
      180,
    );

    expect(
      [0, 1, 2].map(
        (itemIndex) => layout.chips.find((chip) => chip.itemIndex === itemIndex)?.color,
      ),
    ).toEqual(["teal", "#7c3aed80", null]);
  });

  test("preserves the neutral bordered treatment for position chips", () => {
    const layout = createOrgEditorExportEmployeeTagLayout(
      [{ bordered: true, color: null, label: "Product Lead" }],
      120,
    );

    expect(layout.chips[0]).toMatchObject({
      bordered: true,
      color: null,
      lines: ["Product Lead"],
    });
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
    ).toBe(216);
    expect(getOrgEditorUnitBounds({ ...unit, noteMarkdown: "# Private note" })).toEqual(
      getOrgEditorUnitBounds(unit),
    );
    expect(
      getOrgEditorEmployeeRowSurfaceBounds({
        employeeRowHeight: 76,
        employeeRowOffset: 0,
        unit,
      }),
    ).toEqual({
      height: 76,
      width: getOrgEditorUnitBounds(unit).width - 18,
      x: 9,
      y: 81,
    });
    expect(ORG_EDITOR_EMPLOYEE_ROW_BORDER_RADIUS).toBe(6);
  });

  test("maps shared distribution presentation to View light tonal fills", () => {
    const settings = {
      distributedColor: "green" as const,
      undistributedColor: "#7c3aed80" as const,
    };
    expect(getOrgEditorExportEmployeeRowFillStyle(null, settings)).toBeNull();
    expect(
      getOrgEditorExportEmployeeRowFillStyle({ otherUnitCount: 1, status: "assigned" }, settings),
    ).toBe(getTagColorCanvasStyle(settings.distributedColor).fillStyle);
    expect(
      getOrgEditorExportEmployeeRowFillStyle({ otherUnitCount: 0, status: "sourceOnly" }, settings),
    ).toBe(getTagColorCanvasStyle(settings.undistributedColor).fillStyle);
    expect(
      getOrgEditorExportEmployeeRowFillStyle(
        { otherUnitCount: 0, status: "sourceOnly" },
        { ...settings, undistributedColor: "#7c3aed66" },
      ),
    ).toBe("#7c3aed66");
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
        parentUnitHeight: 216,
        unit: child,
        unitHeight: 136,
      }),
    ).toBe("M 188 216 C 188 258, 540 258, 540 300");
  });

  test("reports exact density and clamps by both pixel area and canvas side", () => {
    expect(
      ([1, 2, 3] as const).map((requestedDensity) =>
        createOrgEditorImageRenderPlan({
          logicalHeight: 500,
          logicalWidth: 1_000,
          requestedDensity,
        }),
      ),
    ).toEqual([
      expect.objectContaining({ effectiveDensity: 1, pixelHeight: 500, pixelWidth: 1_000 }),
      expect.objectContaining({ effectiveDensity: 2, pixelHeight: 1_000, pixelWidth: 2_000 }),
      expect.objectContaining({ effectiveDensity: 3, pixelHeight: 1_500, pixelWidth: 3_000 }),
    ]);

    const areaClamped = createOrgEditorImageRenderPlan({
      logicalHeight: 2_000,
      logicalWidth: 4_000,
      maxCanvasPixels: 8_000_000,
      requestedDensity: 3,
    });
    expect(areaClamped.clamped).toBe(true);
    expect(areaClamped.pixelHeight * areaClamped.pixelWidth).toBeLessThanOrEqual(8_000_000);

    const sideClamped = createOrgEditorImageRenderPlan({
      logicalHeight: 100,
      logicalWidth: 20_000,
      maxCanvasPixels: 100_000_000,
      maxCanvasSide: 16_384,
      requestedDensity: 1,
    });
    expect(sideClamped.clamped).toBe(true);
    expect(sideClamped.pixelWidth).toBe(16_384);
  });
});

describe("Org Editor structured export scope", () => {
  test("limits Employees and Unit assignments to the selected Unit or subtree", () => {
    const root: OrgEditorUnit = {
      ...unit,
      employeeIds: [employee.id],
      noteMarkdown: "# Private note",
      openPositions: [
        {
          backgroundColor: "teal",
          id: "00000000-0000-4000-8000-000000000014",
          tags: [{ date: "2026-10-01", tagId: "tag-role" }],
          title: "Platform Engineer",
        },
      ],
    };
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
      scope: "unit",
      sourceIndex,
      units: [root, child],
    });
    const subtreeRows = buildOrgEditorExportRows({
      rootUnit: root,
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
    expect(JSON.stringify(subtreeRows)).not.toContain("Private note");
    expect(JSON.stringify(subtreeRows)).not.toContain("Platform Engineer");
  });
});
