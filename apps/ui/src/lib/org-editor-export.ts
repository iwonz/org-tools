import type {
  CustomEmployeeFieldDefinition,
  Employee,
  EmployeeId,
  EmployeeTag,
  EmployeeTagColor,
  EmployeeTagDefinition,
  OrgEditorAnchorRef,
  OrgEditorCanvasElement,
  OrgEditorLayoutMode,
  OrgEditorUnit,
  OrgEditorUnitId,
  OrgEditorViewSettings,
  TagId,
} from "@org-tools/types";
import {
  type EditorEmployeeDistributionPresentation,
  getEditorEmployeeDistributionPresentation,
} from "@/lib/editor-distribution";
import { isSafeAvatarBase64Url } from "@/lib/employee-data";
import {
  type EmployeeDisplayLine,
  type EmployeeDisplayPosition,
  type EmployeeDisplayVisualLayout,
  type EmployeeDisplayVisualLine,
  getEmployeeDisplayPositionText,
  layoutEmployeeDisplayRichLines,
  renderEmployeeDisplayRichLines,
} from "@/lib/employee-display";
import {
  createEmployeeDisplayTextMeasureEngine,
  DEFAULT_EMPLOYEE_DISPLAY_FONT_FAMILY,
  type EmployeeDisplayTextMeasure,
  employeeDisplayTextMeasureEngine,
} from "@/lib/employee-display-measure";
import { createOrgUnitContext } from "@/lib/employee-unit-contexts";
import { getEmployeeInitials } from "@/lib/employee-utils";
import {
  asExportText,
  buildEmployeeExportRows,
  type ExportRow,
  exportEmployeeFieldByKey,
  getExportEmployeeFieldValue,
} from "@/lib/export-format";
import type { OrgEditorSourceIndex } from "@/lib/org-editor";
import {
  buildOrgEditorUnitEmployeeSummaryById,
  buildOrgEditorUnitTagSummary,
  createOrgEditorUnitTagFooterLayout,
  getOrgEditorEmployeeDisplayVisualLineTops,
  getOrgEditorEmployeePosition,
  getOrgEditorEmployeeRowHeightForVisualLayout,
  getOrgEditorEmployeeRowStackLayout,
  getOrgEditorEmployeeRowSurfaceBounds,
  getOrgEditorEmployeeTextMaxWidth,
  getOrgEditorEmployeeVisualGeometry,
  getOrgEditorTagChipWidth,
  getOrgEditorUnitBounds,
  getOrgEditorUnitDescendantIds,
  getOrgEditorUnitDisplayName,
  getOrgEditorUnitHeightForEmployeeRows,
  getOrgEditorUnitTagFooterHeight,
  getOrgEditorVisibleUnitRows,
  ORG_EDITOR_EMPLOYEE_AVATAR_SIZE,
  ORG_EDITOR_EMPLOYEE_NAME_FONT_SIZE,
  ORG_EDITOR_EMPLOYEE_NAME_LINE_HEIGHT,
  ORG_EDITOR_EMPLOYEE_ROW_BORDER_RADIUS,
  ORG_EDITOR_EMPLOYEE_ROW_HEIGHT,
  ORG_EDITOR_EMPLOYEE_TAG_STYLE,
  ORG_EDITOR_UNIT_BORDER_RADIUS,
  ORG_EDITOR_UNIT_BORDER_WIDTH,
  ORG_EDITOR_UNIT_CONTENT_PADDING,
  ORG_EDITOR_UNIT_HEADER_HEIGHT,
  ORG_EDITOR_UNIT_TAG_FOOTER_CHIP_HORIZONTAL_PADDING,
  ORG_EDITOR_UNIT_TAG_FOOTER_LINE_HEIGHT,
  ORG_EDITOR_UNIT_TAG_FOOTER_PADDING,
  type OrgEditorUnitEmployeeSummary,
  type OrgEditorUnitRow,
  type OrgEditorUnitTagSummary,
  sortOrgEditorEmployeeIds,
} from "@/lib/org-editor";
import {
  getOrgEditorArrowControlPoints,
  getOrgEditorCanvasCssFontFamily,
  getOrgEditorCanvasElementFont,
  getOrgEditorCanvasElementsBounds,
  getOrgEditorCanvasFont,
  getOrgEditorCanvasImagePlaceholderPoints,
  getOrgEditorRectAnchorPoint,
  getOrgEditorRichTextLayout,
  getOrgEditorScopedCanvasElementIds,
  getOrgEditorTextFillRects,
  ORG_EDITOR_EMPLOYEE_ANCHOR_IDS,
  ORG_EDITOR_RECT_ANCHOR_IDS,
  resolveOrgEditorCanvasElements,
} from "@/lib/org-editor-canvas";
import {
  employeeTagColorToHex,
  getStickerColorStyle,
  getTagColorCanvasStyle,
} from "@/lib/tag-color";
import { layoutInlineSurfaces } from "@/lib/tag-surface";
import { renderTemplateFormat, type TemplateFieldValue } from "@/lib/template-format";
import type { ExportEmployeeFieldKey } from "@/stores/org-store";

export type OrgEditorExportScope = "subtree" | "unit";
export type OrgEditorExportTab = "image" | "json" | "template";
export type OrgEditorImageBackground =
  | { type: "transparent" }
  | { color: EmployeeTagColor; type: "solid" }
  | { gradientId: string; type: "gradient" };

const getEffectiveEmployeePosition = (employee: Employee, unit: OrgEditorUnit) => {
  const derivedPosition = employee.unitPositions.find(
    (unitPosition) => unitPosition.unitId === unit.id,
  );

  return derivedPosition
    ? derivedPosition.position
    : getOrgEditorEmployeePosition(unit, employee.id);
};

export type OrgEditorImageExportSettings = {
  background: OrgEditorImageBackground;
  employeeFormat: string;
  employeeLineGap: number;
  padding: number;
  unitBorderRadius: number;
};

export type OrgEditorExportGradient = {
  baseColor: string;
  canvasLayers: OrgEditorExportGradientLayer[];
  id: string;
  label: string;
  previewCss: string;
};

export type OrgEditorTemplateRow = {
  employee: Employee;
  isBoss: boolean;
  position: string | null;
  unitId: OrgEditorUnitId;
  unitName: string;
};

type OrgEditorImageUnitRenderData = {
  employeeDisplayLayouts: EmployeeDisplayVisualLayout[];
  employeeDistributionPresentations: Array<EditorEmployeeDistributionPresentation | null>;
  rows: OrgEditorUnitRow[];
  employeeRowHeights: number[];
  employeeRowOffsets: number[];
  employeeTagLayouts: OrgEditorExportEmployeeTagLayout[];
  footerHeight: number;
  height: number;
  tagSummaries: OrgEditorUnitTagSummary[];
  unit: OrgEditorUnit;
  width: number;
};

const ORG_EDITOR_AVATAR_RADIUS = ORG_EDITOR_EMPLOYEE_AVATAR_SIZE / 2;
const ORG_EDITOR_EXPORT_UNIT_ICON_SIZE = 32;
const ORG_EDITOR_EXPORT_UNIT_ICON_RADIUS = ORG_EDITOR_EXPORT_UNIT_ICON_SIZE / 2;
const ORG_EDITOR_EXPORT_UNIT_TITLE_GAP = 8;
const ORG_EDITOR_EXPORT_UNIT_TITLE_FONT_SIZE = 14;
const ORG_EDITOR_EXPORT_UNIT_SUMMARY_FONT_SIZE = 12;
const ORG_EDITOR_EXPORT_BOSS_BADGE_RADIUS = 7;
const ORG_EDITOR_EXPORT_EMPLOYEE_TAG_LINE_HEIGHT = ORG_EDITOR_EMPLOYEE_TAG_STYLE.lineHeight;
export const ORG_EDITOR_EXPORT_EMPLOYEE_TAG_STYLE = {
  ...ORG_EDITOR_EMPLOYEE_TAG_STYLE,
  fillStyle: "rgba(29, 29, 29, 0.1)",
  textStyle: "#1d1d1d",
} as const;
export const ORG_EDITOR_EXPORT_OPEN_POSITION_OUTLINE_STYLE = {
  dash: [4, 3] as const,
  lineWidth: 1,
  strokeStyle: "rgba(71, 85, 105, 0.5)",
} as const;
const ORG_EDITOR_EXPORT_AVATAR_LOAD_CONCURRENCY = 8;
const ORG_EDITOR_EXPORT_DEFAULT_AVATAR_LOAD_LIMIT = 700;
export const ORG_EDITOR_EXPORT_MAX_CANVAS_PIXELS = 32_000_000;
export const ORG_EDITOR_EXPORT_MAX_CANVAS_SIDE = 16_384;
export const ORG_EDITOR_EXPORT_PREVIEW_AVATAR_LOAD_LIMIT = 160;
export const ORG_EDITOR_EXPORT_PREVIEW_MAX_CANVAS_PIXELS = 8_000_000;
export const ORG_EDITOR_EXPORT_DENSITY = 3;
export const ORG_EDITOR_EXPORT_FONT_FAMILY = "system-ui";
export const ORG_EDITOR_DEFAULT_EMPLOYEE_IMAGE_FORMAT = "{fullName} {isBoss ? '· Manager' : ''}";

export const getOrgEditorExportOpenPositionRowOutline = ({
  employeeRowHeight,
  employeeRowOffset,
  unit,
}: {
  employeeRowHeight: number;
  employeeRowOffset: number;
  unit: OrgEditorUnit;
}) => {
  const surfaceBounds = getOrgEditorEmployeeRowSurfaceBounds({
    employeeRowHeight,
    employeeRowOffset,
    unit,
  });
  const inset = ORG_EDITOR_EXPORT_OPEN_POSITION_OUTLINE_STYLE.lineWidth / 2;

  return {
    ...ORG_EDITOR_EXPORT_OPEN_POSITION_OUTLINE_STYLE,
    bounds: {
      height: Math.max(0, surfaceBounds.height - inset * 2),
      width: Math.max(0, surfaceBounds.width - inset * 2),
      x: surfaceBounds.x + inset,
      y: surfaceBounds.y + inset,
    },
    radius: Math.max(0, ORG_EDITOR_EMPLOYEE_ROW_BORDER_RADIUS - inset),
  };
};

export const getOrgEditorExportOpenPositionRowBackground = (
  backgroundColor: EmployeeTagColor | null,
) => (backgroundColor === null ? null : getTagColorCanvasStyle(backgroundColor));

type OrgEditorExportGradientLayer =
  | {
      from: [number, number];
      stops: Array<[number, string]>;
      to: [number, number];
      type: "linear";
    }
  | {
      center: [number, number];
      radius: number;
      stops: Array<[number, string]>;
      type: "radial";
    };

export const ORG_EDITOR_EXPORT_GRADIENTS: OrgEditorExportGradient[] = [
  {
    baseColor: "#f8fbff",
    canvasLayers: [
      {
        center: [0.1, 0.08],
        radius: 0.7,
        stops: [
          [0, "#dbeafe"],
          [1, "rgba(219,234,254,0)"],
        ],
        type: "radial",
      },
      {
        center: [0.92, 0.2],
        radius: 0.65,
        stops: [
          [0, "#bae6fd"],
          [1, "rgba(186,230,253,0)"],
        ],
        type: "radial",
      },
      {
        from: [0, 1],
        stops: [
          [0, "rgba(255,255,255,0)"],
          [1, "#eff6ff"],
        ],
        to: [1, 0],
        type: "linear",
      },
    ],
    id: "sky-air",
    label: "Air",
    previewCss:
      "radial-gradient(circle at 10% 8%, #dbeafe 0, transparent 58%), radial-gradient(circle at 92% 20%, #bae6fd 0, transparent 52%), linear-gradient(135deg, transparent, #eff6ff), #f8fbff",
  },
  {
    baseColor: "#fbfefb",
    canvasLayers: [
      {
        center: [0.16, 0.12],
        radius: 0.64,
        stops: [
          [0, "#bbf7d0"],
          [1, "rgba(187,247,208,0)"],
        ],
        type: "radial",
      },
      {
        center: [0.9, 0.82],
        radius: 0.72,
        stops: [
          [0, "#ccfbf1"],
          [1, "rgba(204,251,241,0)"],
        ],
        type: "radial",
      },
      {
        from: [0, 0],
        stops: [
          [0, "rgba(255,255,255,0.2)"],
          [1, "#ecfdf5"],
        ],
        to: [1, 1],
        type: "linear",
      },
    ],
    id: "mint-air",
    label: "Mint",
    previewCss:
      "radial-gradient(circle at 16% 12%, #bbf7d0 0, transparent 56%), radial-gradient(circle at 90% 82%, #ccfbf1 0, transparent 58%), linear-gradient(135deg, rgba(255,255,255,.2), #ecfdf5), #fbfefb",
  },
  {
    baseColor: "#fffafb",
    canvasLayers: [
      {
        center: [0.2, 0.18],
        radius: 0.68,
        stops: [
          [0, "#ffe4e6"],
          [1, "rgba(255,228,230,0)"],
        ],
        type: "radial",
      },
      {
        center: [0.86, 0.18],
        radius: 0.64,
        stops: [
          [0, "#fce7f3"],
          [1, "rgba(252,231,243,0)"],
        ],
        type: "radial",
      },
      {
        from: [0, 1],
        stops: [
          [0, "rgba(255,255,255,0)"],
          [1, "#fff7ed"],
        ],
        to: [1, 0],
        type: "linear",
      },
    ],
    id: "rose-air",
    label: "Rose",
    previewCss:
      "radial-gradient(circle at 20% 18%, #ffe4e6 0, transparent 58%), radial-gradient(circle at 86% 18%, #fce7f3 0, transparent 54%), linear-gradient(135deg, transparent, #fff7ed), #fffafb",
  },
  {
    baseColor: "#fffdf4",
    canvasLayers: [
      {
        center: [0.12, 0.18],
        radius: 0.62,
        stops: [
          [0, "#fde68a"],
          [1, "rgba(253,230,138,0)"],
        ],
        type: "radial",
      },
      {
        center: [0.86, 0.76],
        radius: 0.7,
        stops: [
          [0, "#fed7aa"],
          [1, "rgba(254,215,170,0)"],
        ],
        type: "radial",
      },
      {
        from: [0, 0],
        stops: [
          [0, "#fff7ed"],
          [1, "rgba(255,255,255,0)"],
        ],
        to: [1, 1],
        type: "linear",
      },
    ],
    id: "amber-air",
    label: "Amber",
    previewCss:
      "radial-gradient(circle at 12% 18%, #fde68a 0, transparent 54%), radial-gradient(circle at 86% 76%, #fed7aa 0, transparent 58%), linear-gradient(135deg, #fff7ed, transparent), #fffdf4",
  },
  {
    baseColor: "#fbfbff",
    canvasLayers: [
      {
        center: [0.16, 0.2],
        radius: 0.68,
        stops: [
          [0, "#ddd6fe"],
          [1, "rgba(221,214,254,0)"],
        ],
        type: "radial",
      },
      {
        center: [0.88, 0.18],
        radius: 0.62,
        stops: [
          [0, "#bfdbfe"],
          [1, "rgba(191,219,254,0)"],
        ],
        type: "radial",
      },
      {
        center: [0.76, 0.9],
        radius: 0.6,
        stops: [
          [0, "#e0e7ff"],
          [1, "rgba(224,231,255,0)"],
        ],
        type: "radial",
      },
    ],
    id: "violet-air",
    label: "Lavender",
    previewCss:
      "radial-gradient(circle at 16% 20%, #ddd6fe 0, transparent 58%), radial-gradient(circle at 88% 18%, #bfdbfe 0, transparent 52%), radial-gradient(circle at 76% 90%, #e0e7ff 0, transparent 52%), #fbfbff",
  },
  {
    baseColor: "#f8fafc",
    canvasLayers: [
      {
        center: [0.18, 0.16],
        radius: 0.64,
        stops: [
          [0, "#cbd5e1"],
          [1, "rgba(203,213,225,0)"],
        ],
        type: "radial",
      },
      {
        center: [0.9, 0.78],
        radius: 0.68,
        stops: [
          [0, "#e2e8f0"],
          [1, "rgba(226,232,240,0)"],
        ],
        type: "radial",
      },
      {
        from: [0, 1],
        stops: [
          [0, "rgba(255,255,255,0)"],
          [1, "#f1f5f9"],
        ],
        to: [1, 0],
        type: "linear",
      },
    ],
    id: "graphite-air",
    label: "Graphite",
    previewCss:
      "radial-gradient(circle at 18% 16%, #cbd5e1 0, transparent 54%), radial-gradient(circle at 90% 78%, #e2e8f0 0, transparent 56%), linear-gradient(135deg, transparent, #f1f5f9), #f8fafc",
  },
  {
    baseColor: "#fbfffd",
    canvasLayers: [
      {
        center: [0.12, 0.14],
        radius: 0.64,
        stops: [
          [0, "#bae6fd"],
          [1, "rgba(186,230,253,0)"],
        ],
        type: "radial",
      },
      {
        center: [0.9, 0.24],
        radius: 0.6,
        stops: [
          [0, "#fecdd3"],
          [1, "rgba(254,205,211,0)"],
        ],
        type: "radial",
      },
      {
        center: [0.6, 0.92],
        radius: 0.7,
        stops: [
          [0, "#bbf7d0"],
          [1, "rgba(187,247,208,0)"],
        ],
        type: "radial",
      },
    ],
    id: "aurora-air",
    label: "Aurora",
    previewCss:
      "radial-gradient(circle at 12% 14%, #bae6fd 0, transparent 54%), radial-gradient(circle at 90% 24%, #fecdd3 0, transparent 50%), radial-gradient(circle at 60% 92%, #bbf7d0 0, transparent 58%), #fbfffd",
  },
];

export const orgEditorTemplateUnitFields: Array<{
  key: "isBoss" | "position" | "unitName";
  label: string;
}> = [
  { key: "unitName", label: "unitName" },
  { key: "position", label: "position" },
  { key: "isBoss", label: "isBoss" },
];

export const createDefaultOrgEditorImageExportSettings = (
  employeeFormat = ORG_EDITOR_DEFAULT_EMPLOYEE_IMAGE_FORMAT,
  employeeLineGap = 4,
): OrgEditorImageExportSettings => ({
  background: { type: "transparent" },
  employeeFormat,
  employeeLineGap,
  padding: 20,
  unitBorderRadius: ORG_EDITOR_UNIT_BORDER_RADIUS,
});

export type OrgEditorImageRenderPlan = {
  clamped: boolean;
  effectiveDensity: number;
  logicalHeight: number;
  logicalWidth: number;
  pixelHeight: number;
  pixelWidth: number;
  requestedDensity: number;
};

export const createOrgEditorImageRenderPlan = ({
  logicalHeight,
  logicalWidth,
  maxCanvasPixels = ORG_EDITOR_EXPORT_MAX_CANVAS_PIXELS,
  maxCanvasSide = ORG_EDITOR_EXPORT_MAX_CANVAS_SIDE,
  requestedDensity,
}: {
  logicalHeight: number;
  logicalWidth: number;
  maxCanvasPixels?: number;
  maxCanvasSide?: number;
  requestedDensity: number;
}): OrgEditorImageRenderPlan => {
  const safeWidth = Math.max(1, Math.ceil(logicalWidth));
  const safeHeight = Math.max(1, Math.ceil(logicalHeight));
  const pixelScale = Math.sqrt(Math.max(1, maxCanvasPixels) / Math.max(1, safeWidth * safeHeight));
  const sideScale = Math.min(
    Math.max(1, maxCanvasSide) / safeWidth,
    Math.max(1, maxCanvasSide) / safeHeight,
  );
  const effectiveDensity = Math.max(0.05, Math.min(requestedDensity, pixelScale, sideScale));
  return {
    clamped: effectiveDensity + 1e-9 < requestedDensity,
    effectiveDensity,
    logicalHeight: safeHeight,
    logicalWidth: safeWidth,
    pixelHeight: Math.max(1, Math.floor(safeHeight * effectiveDensity)),
    pixelWidth: Math.max(1, Math.floor(safeWidth * effectiveDensity)),
    requestedDensity,
  };
};

export const createOrgEditorExportFileBaseName = (unit: OrgEditorUnit) => {
  const normalizedName = getOrgEditorUnitDisplayName(unit)
    .trim()
    .replace(/[^\p{L}\p{N}_-]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return normalizedName || "org-editor-unit";
};

export const getOrgEditorExportUnits = ({
  rootUnit,
  scope,
  units,
}: {
  rootUnit: OrgEditorUnit;
  scope: OrgEditorExportScope;
  units: OrgEditorUnit[];
}) => {
  const unitById = new Map(units.map((unit) => [unit.id, unit] as const));
  const actualRootUnit = unitById.get(rootUnit.id) ?? rootUnit;

  if (scope === "unit") return [actualRootUnit];

  const unitIds = new Set(getOrgEditorUnitDescendantIds(units, actualRootUnit.id));

  return units.filter((unit) => unitIds.has(unit.id));
};

export const getEmployeeCanvasAvatarUrl = (employee: Employee | undefined) =>
  isSafeAvatarBase64Url(employee?.avatarBase64Url) ? employee.avatarBase64Url : null;

const loadCanvasImage = (url: string) =>
  new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();

    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });

const loadCanvasImages = async (urls: string[], concurrency: number) => {
  const imageByUrl = new Map<string, HTMLImageElement | null>();
  let nextUrlIndex = 0;

  const loadNextImage = async () => {
    while (nextUrlIndex < urls.length) {
      const url = urls[nextUrlIndex];
      nextUrlIndex += 1;

      if (!url) continue;

      imageByUrl.set(url, await loadCanvasImage(url));
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(Math.max(1, concurrency), urls.length) }, loadNextImage),
  );

  return imageByUrl;
};

const drawRoundedRect = (
  context: CanvasRenderingContext2D,
  rect: { height: number; width: number; x: number; y: number },
  radius: number,
) => {
  const safeRadius = Math.min(radius, rect.width / 2, rect.height / 2);
  const right = rect.x + rect.width;
  const bottom = rect.y + rect.height;

  context.beginPath();
  context.moveTo(rect.x + safeRadius, rect.y);
  context.lineTo(right - safeRadius, rect.y);
  context.quadraticCurveTo(right, rect.y, right, rect.y + safeRadius);
  context.lineTo(right, bottom - safeRadius);
  context.quadraticCurveTo(right, bottom, right - safeRadius, bottom);
  context.lineTo(rect.x + safeRadius, bottom);
  context.quadraticCurveTo(rect.x, bottom, rect.x, bottom - safeRadius);
  context.lineTo(rect.x, rect.y + safeRadius);
  context.quadraticCurveTo(rect.x, rect.y, rect.x + safeRadius, rect.y);
  context.closePath();
};

const drawOrgEditorArrowMarker = (
  context: CanvasRenderingContext2D,
  point: { x: number; y: number },
  toward: { x: number; y: number },
  color: string,
  strokeWidth: number,
) => {
  const angle = Math.atan2(point.y - toward.y, point.x - toward.x);
  const size = Math.max(8, strokeWidth * 4);
  context.save();
  context.translate(point.x, point.y);
  context.rotate(angle);
  context.beginPath();
  context.moveTo(0, 0);
  context.lineTo(-size, size * 0.45);
  context.lineTo(-size, -size * 0.45);
  context.closePath();
  context.fillStyle = color;
  context.fill();
  context.restore();
};

const paintOrgEditorCanvasElement = ({
  context,
  element,
  imageByUrl,
}: {
  context: CanvasRenderingContext2D;
  element: OrgEditorCanvasElement;
  imageByUrl: ReadonlyMap<string, HTMLImageElement | null>;
}) => {
  if (element.type === "arrow") {
    const { control1, control2 } = getOrgEditorArrowControlPoints(element);
    const color = employeeTagColorToHex(element.strokeColor);
    context.save();
    context.beginPath();
    context.moveTo(element.start.x, element.start.y);
    context.bezierCurveTo(
      control1.x,
      control1.y,
      control2.x,
      control2.y,
      element.end.x,
      element.end.y,
    );
    context.strokeStyle = color;
    context.lineWidth = element.strokeWidth;
    context.setLineDash(element.dash === "dashed" ? [8, 6] : []);
    context.stroke();
    context.setLineDash([]);
    if (element.startMarker === "arrow") {
      drawOrgEditorArrowMarker(context, element.start, control1, color, element.strokeWidth);
    }
    if (element.endMarker === "arrow") {
      drawOrgEditorArrowMarker(context, element.end, control2, color, element.strokeWidth);
    }
    context.restore();
    return;
  }

  context.save();
  context.translate(element.x + element.width / 2, element.y + element.height / 2);
  context.rotate((element.rotation * Math.PI) / 180);
  context.translate(-element.width / 2, -element.height / 2);
  if (element.type === "sticker") {
    const stickerColors = getStickerColorStyle(element.backgroundColor);
    drawRoundedRect(context, { height: element.height, width: element.width, x: 0, y: 0 }, 4);
    context.fillStyle = stickerColors.fillStyle;
    context.fill();
    drawRoundedRect(
      context,
      {
        height: Math.max(0, element.height - 1),
        width: Math.max(0, element.width - 1),
        x: 0.5,
        y: 0.5,
      },
      4,
    );
    context.lineWidth = 1;
    context.strokeStyle = stickerColors.borderStyle;
    context.stroke();
  }
  if (element.type === "image") {
    const image = imageByUrl.get(element.dataUrl) ?? null;
    if (image) {
      const scale = Math.min(element.width / image.width, element.height / image.height);
      const width = image.width * scale;
      const height = image.height * scale;
      context.drawImage(
        image,
        (element.width - width) / 2,
        (element.height - height) / 2,
        width,
        height,
      );
    } else {
      context.fillStyle = "#e2e8f0";
      context.fillRect(0, 0, element.width, element.height);
      context.strokeStyle = "#94a3b8";
      context.lineWidth = 2;
      const [firstPoint, ...remainingPoints] = getOrgEditorCanvasImagePlaceholderPoints(
        element.width,
        element.height,
      );
      context.beginPath();
      if (firstPoint) context.moveTo(firstPoint.x, firstPoint.y);
      for (const point of remainingPoints) context.lineTo(point.x, point.y);
      context.stroke();
    }
    context.restore();
    return;
  }

  if (element.type === "text" || element.type === "sticker") {
    const layout = getOrgEditorRichTextLayout({
      autoWidth: element.type === "text" && element.autoWidth,
      formatRuns: element.formatRuns,
      height: element.height,
      measure: (value, fragmentTypography) => {
        context.font = getOrgEditorCanvasElementFont(fragmentTypography);
        return context.measureText(value).width;
      },
      mode: element.type,
      text: element.text,
      typography: element.typography,
      width: element.width,
    });
    if (element.type === "text") {
      for (const rect of getOrgEditorTextFillRects(element, layout)) {
        drawRoundedRect(context, rect, rect.radius);
        context.fillStyle = employeeTagColorToHex(element.fillColor);
        context.fill();
      }
    }
    context.textAlign = "start";
    context.textBaseline = "top";
    for (const line of layout.lines) {
      for (const fragment of line.fragments) {
        context.font = getOrgEditorCanvasElementFont(fragment.typography);
        context.fillStyle = employeeTagColorToHex(fragment.typography.color);
        context.fillText(fragment.text, fragment.x, fragment.y);
      }
    }
    context.restore();
    return;
  }

  context.restore();
};

const drawTrimmedText = (
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
) => {
  if (context.measureText(text).width <= maxWidth) {
    context.fillText(text, x, y);
    return;
  }

  let nextText = text;
  while (nextText.length > 0 && context.measureText(`${nextText}...`).width > maxWidth) {
    nextText = nextText.slice(0, -1);
  }

  context.fillText(nextText ? `${nextText}...` : "...", x, y);
};

const drawOrgEditorEmployeeRichLine = ({
  baseline,
  context,
  fontFamily,
  line,
  x,
}: {
  baseline: number;
  context: CanvasRenderingContext2D;
  fontFamily: string;
  line: EmployeeDisplayLine;
  x: number;
}) => {
  let cursorX = x;
  for (const node of line.nodes) {
    if (node.type === "text") {
      const weight = node.marks.bold ? 600 : 400;
      const fontSize = ORG_EDITOR_EMPLOYEE_NAME_FONT_SIZE * (node.marks.code ? 0.9 : 1);
      const textFontFamily = node.marks.code
        ? "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
        : getOrgEditorCanvasCssFontFamily(fontFamily);
      context.font = `${node.marks.italic ? "italic " : ""}${weight} ${fontSize}px ${textFontFamily}`;
      const text = node.text;
      const width = context.measureText(text).width;
      if (node.marks.code && width > 0) {
        context.fillStyle = "rgba(15, 23, 42, 0.08)";
        drawRoundedRect(
          context,
          { height: 14, width: width + 4, x: cursorX - 2, y: baseline - 11 },
          2,
        );
        context.fill();
      }
      context.fillStyle = node.href ? "#2563eb" : "#0f172a";
      context.fillText(text, cursorX, baseline);
      if ((node.href || node.marks.strike) && width > 0) {
        context.beginPath();
        context.strokeStyle = node.href ? "#2563eb" : "#0f172a";
        context.lineWidth = 1;
        const lineY = node.marks.strike ? baseline - 4 : baseline + 1;
        context.moveTo(cursorX, lineY);
        context.lineTo(cursorX + width, lineY);
        context.stroke();
      }
      cursorX += width;
    }
  }
};

const drawOrgEditorEmployeeVisualLine = ({
  baseline,
  context,
  fontFamily,
  line,
  lineTop,
  x,
}: {
  baseline: number;
  context: CanvasRenderingContext2D;
  fontFamily: string;
  line: EmployeeDisplayVisualLine;
  lineTop: number;
  x: number;
}) => {
  for (const fragment of line.fragments) {
    const fragmentX = x + fragment.x;
    if (fragment.type === "text") {
      const codeInset = fragment.node.marks.code ? 2 : 0;
      drawOrgEditorEmployeeRichLine({
        baseline,
        context,
        fontFamily,
        line: {
          nodes: [{ ...fragment.node, text: fragment.text }],
          text: fragment.text,
        },
        x: fragmentX + codeInset,
      });
      continue;
    }
    const chip = {
      bordered: fragment.type === "position",
      color: fragment.type === "tag" ? (fragment.tag.color ?? null) : null,
      continued: fragment.start > 0,
      end: fragment.end,
      height: fragment.height,
      itemIndex: 0,
      lines: [fragment.text],
      start: fragment.start,
      width: fragment.width,
      x: 0,
      y: 0,
    } satisfies OrgEditorExportEmployeeTagChipLayout;
    const layout = { chips: [chip], height: chip.height, rowCount: 1 };
    if (fragment.type === "tag") {
      drawOrgEditorEmployeeTags({
        context,
        fontFamily,
        layout,
        x: fragmentX,
        y: lineTop,
      });
    } else {
      drawOrgEditorEmployeePositions({
        context,
        fontFamily,
        layout,
        positions: [fragment.position],
        x: fragmentX,
        y: lineTop,
      });
    }
  }
};

const getOrgEditorExportUnitHeight = (
  unit: OrgEditorUnit,
  employeeById: ReadonlyMap<EmployeeId, Employee>,
) =>
  getOrgEditorUnitHeightForEmployeeRows({
    collapsed: unit.collapsed,
    employeeRowHeights: getOrgEditorVisibleUnitRows(unit, employeeById, false).map(
      () => ORG_EDITOR_EMPLOYEE_ROW_HEIGHT,
    ),
  });

export const getOrgEditorExportEmployeeGeometry = (
  unit: OrgEditorUnit,
  employeeRowOffset: number,
  employeeRowHeight = ORG_EDITOR_EMPLOYEE_ROW_HEIGHT,
  tagBlockHeight = 0,
) =>
  getOrgEditorEmployeeVisualGeometry({
    employeeRowHeight,
    employeeRowOffset,
    tagBlockHeight,
    tagRowCount: 0,
    unitWidth: getOrgEditorUnitBounds(unit).width,
    unitX: unit.x,
    unitY: unit.y,
  });

const createPngBlobFromCanvas = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }

      reject(new Error("Could not prepare the PNG image."));
    }, "image/png");
  });

const getCanvasFont = getOrgEditorCanvasFont;
const getEmployeeCanvasFont = (fontFamily: string, weight: number, size: number) =>
  `${weight} ${size}px ${getOrgEditorCanvasCssFontFamily(fontFamily)}`;

const drawOrgEditorUnitIcon = (
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
) => {
  context.save();
  context.beginPath();
  context.arc(centerX, centerY, ORG_EDITOR_EXPORT_UNIT_ICON_RADIUS, 0, Math.PI * 2);
  context.fillStyle = "#ffffff";
  context.fill();
  context.strokeStyle = "#d7dde8";
  context.lineWidth = 1;
  context.stroke();

  context.beginPath();
  context.rect(centerX - 6, centerY - 7, 8, 14);
  context.rect(centerX + 2, centerY - 3, 5, 10);
  context.moveTo(centerX - 8, centerY + 7);
  context.lineTo(centerX + 8, centerY + 7);
  context.moveTo(centerX - 3.5, centerY - 4);
  context.lineTo(centerX - 3.5, centerY - 2);
  context.moveTo(centerX - 0.5, centerY - 4);
  context.lineTo(centerX - 0.5, centerY - 2);
  context.moveTo(centerX - 3.5, centerY);
  context.lineTo(centerX - 3.5, centerY + 2);
  context.moveTo(centerX - 0.5, centerY);
  context.lineTo(centerX - 0.5, centerY + 2);
  context.strokeStyle = "#64748b";
  context.lineWidth = 1.25;
  context.stroke();
  context.restore();
};

const drawOrgEditorBossBadge = (
  context: CanvasRenderingContext2D,
  avatarX: number,
  avatarY: number,
) => {
  const centerY = avatarY + ORG_EDITOR_AVATAR_RADIUS;

  context.beginPath();
  context.arc(avatarX, centerY, ORG_EDITOR_EXPORT_BOSS_BADGE_RADIUS + 1, 0, Math.PI * 2);
  context.fillStyle = "#ffffff";
  context.fill();
  context.beginPath();
  context.arc(avatarX, centerY, ORG_EDITOR_EXPORT_BOSS_BADGE_RADIUS, 0, Math.PI * 2);
  context.fillStyle = "#2787f5";
  context.fill();

  context.fillStyle = "#ffffff";
  context.beginPath();
  context.arc(avatarX - 2.25, centerY - 1.5, 1.4, 0, Math.PI * 2);
  context.arc(avatarX + 2.25, centerY - 1.5, 1.4, 0, Math.PI * 2);
  context.fill();
  drawRoundedRect(context, { height: 3, width: 9, x: avatarX - 4.5, y: centerY + 0.5 }, 1.5);
  context.fill();
};

export const getOrgEditorExportEmployeeTagLabels = (employee: Employee, locale: string) => {
  return getOrgEditorExportTagLabels(employee.tags, locale);
};

const getOrgEditorExportTagLabels = (tags: readonly EmployeeTag[], locale: string) => {
  const formatter = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  });
  return tags.map((tag) =>
    tag.date ? `${tag.label} · ${formatter.format(new Date(`${tag.date}T00:00:00Z`))}` : tag.label,
  );
};

export type OrgEditorExportEmployeeTag = {
  bordered?: boolean;
  color: EmployeeTagColor | null;
  label: string;
  suffix?: string;
};

export const getOrgEditorExportEmployeeTags = (
  employee: Employee,
  locale: string,
): OrgEditorExportEmployeeTag[] => {
  const labels = getOrgEditorExportEmployeeTagLabels(employee, locale);
  return employee.tags.map((tag, index) => ({
    color: tag.color ?? null,
    label: tag.label,
    ...(tag.date ? { suffix: (labels[index] ?? tag.label).slice(tag.label.length) } : {}),
  }));
};

const getOrgEditorExportTags = (
  tags: readonly EmployeeTag[],
  locale: string,
): OrgEditorExportEmployeeTag[] => {
  const labels = getOrgEditorExportTagLabels(tags, locale);
  return tags.map((tag, index) => ({
    color: tag.color ?? null,
    label: tag.label,
    ...(tag.date ? { suffix: (labels[index] ?? tag.label).slice(tag.label.length) } : {}),
  }));
};

export const getOrgEditorExportEmployeeTagChipWidth = (label: string, maxWidth: number) =>
  getOrgEditorTagChipWidth(label, maxWidth);

export type OrgEditorExportEmployeeTagChipLayout = {
  bordered: boolean;
  color: EmployeeTagColor | null;
  continued: boolean;
  end: number;
  height: number;
  itemIndex: number;
  lines: string[];
  start: number;
  width: number;
  x: number;
  y: number;
};

export type OrgEditorExportEmployeeTagLayout = {
  chips: OrgEditorExportEmployeeTagChipLayout[];
  height: number;
  rowCount: number;
};

type MeasureOrgEditorExportText = (text: string) => number;

const estimateOrgEditorExportText: MeasureOrgEditorExportText = (text) =>
  employeeDisplayTextMeasureEngine.measure(text, {
    fontFamily: DEFAULT_EMPLOYEE_DISPLAY_FONT_FAMILY,
    fontSize: ORG_EDITOR_EMPLOYEE_TAG_STYLE.fontSize,
    fontWeight: 400,
  });

export const createOrgEditorExportEmployeeTagLayout = (
  tags: readonly (OrgEditorExportEmployeeTag | string)[],
  maxWidth: number,
  measureText: MeasureOrgEditorExportText = estimateOrgEditorExportText,
  wrapLongLabels = true,
): OrgEditorExportEmployeeTagLayout => {
  if (tags.length === 0 || maxWidth <= 0) return { chips: [], height: 0, rowCount: 0 };

  const normalized = tags.map((tag) =>
    typeof tag === "string" ? { bordered: false, color: null, label: tag, suffix: "" } : tag,
  );
  const layout = layoutInlineSurfaces({
    availableWidth: Math.max(1, maxWidth),
    measureText,
    suffixes: normalized.map((tag) => tag.suffix ?? ""),
    texts: normalized.map((tag) => tag.label),
  });
  const chips = layout.fragments.map((fragment) => {
    const tag = normalized[fragment.itemIndex];
    return {
      bordered: Boolean(tag?.bordered),
      color: tag?.color ?? null,
      continued: fragment.continued,
      end: fragment.end,
      height: fragment.height,
      itemIndex: fragment.itemIndex,
      lines: [fragment.text],
      start: fragment.start,
      width: fragment.width,
      x: fragment.x,
      y: fragment.y,
    };
  });
  void wrapLongLabels;
  return { chips, height: layout.height, rowCount: layout.rowCount };
};

export const createOrgEditorExportEmployeePositionLayout = (
  positions: readonly EmployeeDisplayPosition[],
  maxWidth: number,
  measureText: MeasureOrgEditorExportText = estimateOrgEditorExportText,
) =>
  createOrgEditorExportEmployeeTagLayout(
    positions.map(getEmployeeDisplayPositionText),
    maxWidth,
    measureText,
    false,
  );

export const getOrgEditorExportEmployeeTagRowCount = (
  labels: readonly (OrgEditorExportEmployeeTag | string)[],
  maxWidth: number,
) => createOrgEditorExportEmployeeTagLayout(labels, maxWidth).rowCount;

export const getOrgEditorExportEmployeeRowHeightForTagLayout = (
  layout: OrgEditorExportEmployeeTagLayout,
) =>
  ORG_EDITOR_EMPLOYEE_ROW_HEIGHT +
  Math.max(0, layout.height - ORG_EDITOR_EXPORT_EMPLOYEE_TAG_STYLE.height);

export const getOrgEditorExportEmployeeRowHeight = (
  employee: Employee,
  locale: string,
  maxWidth: number,
) =>
  getOrgEditorExportEmployeeRowHeightForTagLayout(
    createOrgEditorExportEmployeeTagLayout(
      getOrgEditorExportEmployeeTags(employee, locale),
      maxWidth,
    ),
  );

export const getOrgEditorExportEmployeeRowFillStyle = (
  presentation: EditorEmployeeDistributionPresentation | null,
  viewSettings: Pick<OrgEditorViewSettings, "distributedColor" | "undistributedColor">,
) => {
  if (!presentation) return null;
  const color =
    presentation.status === "assigned"
      ? viewSettings.distributedColor
      : viewSettings.undistributedColor;
  return getTagColorCanvasStyle(color).fillStyle;
};

const drawOrgEditorEmployeeTags = ({
  context,
  fontFamily,
  layout,
  x,
  y,
}: {
  context: CanvasRenderingContext2D;
  fontFamily: string;
  layout: OrgEditorExportEmployeeTagLayout;
  x: number;
  y: number;
}) => {
  if (layout.chips.length === 0) return;

  context.font = getCanvasFont(fontFamily, 400, ORG_EDITOR_EXPORT_EMPLOYEE_TAG_STYLE.fontSize);
  context.textAlign = "start";
  context.textBaseline = "middle";
  for (const chip of layout.chips) {
    const chipX = x + chip.x;
    const chipY = y + chip.y;
    drawRoundedRect(
      context,
      {
        height: chip.height,
        width: chip.width,
        x: chipX,
        y: chipY,
      },
      ORG_EDITOR_EXPORT_EMPLOYEE_TAG_STYLE.radius,
    );
    const colorStyle = chip.bordered
      ? { fillStyle: "#f1f5f9", textStyle: "#0f172a" }
      : getTagColorCanvasStyle(chip.color);
    context.fillStyle = colorStyle.fillStyle;
    context.fill();
    if (chip.bordered) {
      context.strokeStyle = "#d7dde8";
      context.lineWidth = 1;
      context.stroke();
    }
    context.fillStyle = colorStyle.textStyle;
    const textBlockHeight = chip.lines.length * ORG_EDITOR_EXPORT_EMPLOYEE_TAG_LINE_HEIGHT;
    const firstLineY =
      chipY +
      (chip.height - textBlockHeight) / 2 +
      ORG_EDITOR_EXPORT_EMPLOYEE_TAG_LINE_HEIGHT / 2 +
      0.5;
    for (const [lineIndex, line] of chip.lines.entries()) {
      context.fillText(
        line,
        chipX + ORG_EDITOR_EXPORT_EMPLOYEE_TAG_STYLE.horizontalPadding,
        firstLineY + lineIndex * ORG_EDITOR_EXPORT_EMPLOYEE_TAG_LINE_HEIGHT,
      );
    }
  }
};

const drawOrgEditorEmployeePositions = ({
  context,
  fontFamily,
  layout,
  positions,
  x,
  y,
}: {
  context: CanvasRenderingContext2D;
  fontFamily: string;
  layout: OrgEditorExportEmployeeTagLayout;
  positions: readonly EmployeeDisplayPosition[];
  x: number;
  y: number;
}) => {
  context.textAlign = "start";
  context.textBaseline = "middle";
  for (const chip of layout.chips) {
    const position = positions[chip.itemIndex];
    if (!position) continue;
    const chipX = x + chip.x;
    const chipY = y + chip.y;
    drawRoundedRect(
      context,
      { height: chip.height, width: chip.width, x: chipX, y: chipY },
      ORG_EDITOR_EXPORT_EMPLOYEE_TAG_STYLE.radius,
    );
    context.fillStyle = "#f1f5f9";
    context.fill();
    context.strokeStyle = "#d7dde8";
    context.lineWidth = 1;
    context.stroke();

    let textX = chipX + ORG_EDITOR_EXPORT_EMPLOYEE_TAG_STYLE.horizontalPadding;
    const textY = chipY + chip.height / 2 + 0.5;
    const separator = " · ";
    const source = getEmployeeDisplayPositionText(position);
    const positionEnd = position.label.length;
    const separatorEnd = positionEnd + separator.length;
    const ranges = [
      { end: positionEnd, start: 0, textStyle: "#0f172a", weight: 500 },
      { end: separatorEnd, start: positionEnd, textStyle: "#64748b", weight: 400 },
      { end: source.length, start: separatorEnd, textStyle: "#64748b", weight: 400 },
    ];
    for (const range of ranges) {
      const start = Math.max(chip.start, range.start);
      const end = Math.min(chip.end, range.end);
      if (start >= end) continue;
      const text = source.slice(start, end);
      context.font = getEmployeeCanvasFont(
        fontFamily,
        range.weight,
        ORG_EDITOR_EXPORT_EMPLOYEE_TAG_STYLE.fontSize,
      );
      context.fillStyle = range.textStyle;
      context.fillText(text, textX, textY);
      textX += context.measureText(text).width;
    }
  }
};

export const getOrgEditorExportFontRequests = ({
  canvasElements = [],
}: {
  canvasElements?: readonly OrgEditorCanvasElement[];
}) => {
  const fontFamily = ORG_EDITOR_EXPORT_FONT_FAMILY;
  const fontRequests = new Set<string>([
    getEmployeeCanvasFont(fontFamily, 400, ORG_EDITOR_EXPORT_EMPLOYEE_TAG_STYLE.fontSize),
    getEmployeeCanvasFont(fontFamily, 500, ORG_EDITOR_EXPORT_EMPLOYEE_TAG_STYLE.fontSize),
    getEmployeeCanvasFont(fontFamily, 400, ORG_EDITOR_EMPLOYEE_NAME_FONT_SIZE),
    `italic ${getEmployeeCanvasFont(fontFamily, 400, ORG_EDITOR_EMPLOYEE_NAME_FONT_SIZE)}`,
    getEmployeeCanvasFont(fontFamily, 600, ORG_EDITOR_EMPLOYEE_NAME_FONT_SIZE),
    `italic ${getEmployeeCanvasFont(fontFamily, 600, ORG_EDITOR_EMPLOYEE_NAME_FONT_SIZE)}`,
    getCanvasFont(fontFamily, 500, ORG_EDITOR_EXPORT_UNIT_TITLE_FONT_SIZE),
    getCanvasFont(fontFamily, 700, 8),
  ]);
  for (const element of canvasElements) {
    if (element.type === "image" || element.type === "arrow") continue;
    fontRequests.add(getOrgEditorCanvasElementFont(element.typography));
    for (const run of element.formatRuns) {
      fontRequests.add(getOrgEditorCanvasElementFont(run.typography));
    }
  }

  return [...fontRequests].sort();
};

const waitForCanvasFont = async (options: Parameters<typeof getOrgEditorExportFontRequests>[0]) => {
  if (typeof document === "undefined" || !document.fonts) return;

  await Promise.all(
    getOrgEditorExportFontRequests(options).map((fontRequest) => document.fonts.load(fontRequest)),
  );
};

export const getOrgEditorExportConnectionPath = ({
  employeeById,
  layoutMode,
  parentUnit,
  parentUnitHeight,
  unit,
  unitHeight,
}: {
  employeeById: ReadonlyMap<EmployeeId, Employee>;
  layoutMode: OrgEditorLayoutMode;
  parentUnit: OrgEditorUnit;
  parentUnitHeight?: number;
  unit: OrgEditorUnit;
  unitHeight?: number;
}) => {
  const parentHeight = parentUnitHeight ?? getOrgEditorExportUnitHeight(parentUnit, employeeById);
  const resolvedUnitHeight = unitHeight ?? getOrgEditorExportUnitHeight(unit, employeeById);

  if (layoutMode === "topDown") {
    const parentX = parentUnit.x + getOrgEditorUnitBounds(parentUnit).width / 2;
    const parentY = parentUnit.y + parentHeight;
    const unitX = unit.x + getOrgEditorUnitBounds(unit).width / 2;
    const unitY = unit.y;
    const middleY = parentY + (unitY - parentY) / 2;

    return `M ${parentX} ${parentY} C ${parentX} ${middleY}, ${unitX} ${middleY}, ${unitX} ${unitY}`;
  }

  const parentX = parentUnit.x + getOrgEditorUnitBounds(parentUnit).width;
  const parentY = parentUnit.y + parentHeight / 2;
  const unitX = unit.x;
  const unitY = unit.y + resolvedUnitHeight / 2;
  const middleX = parentX + (unitX - parentX) / 2;

  return `M ${parentX} ${parentY} C ${middleX} ${parentY}, ${middleX} ${unitY}, ${unitX} ${unitY}`;
};

const paintImageBackground = (
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  background: OrgEditorImageBackground,
) => {
  if (background.type === "transparent") return;

  if (background.type === "solid") {
    context.fillStyle = getOrgEditorImageSolidBackgroundColor(background.color);
    context.fillRect(0, 0, width, height);
    return;
  }

  const gradientOption = ORG_EDITOR_EXPORT_GRADIENTS.find(
    (gradient) => gradient.id === background.gradientId,
  );
  if (!gradientOption) return;

  context.fillStyle = gradientOption.baseColor;
  context.fillRect(0, 0, width, height);

  for (const layer of gradientOption.canvasLayers) {
    const gradient =
      layer.type === "linear"
        ? context.createLinearGradient(
            layer.from[0] * width,
            layer.from[1] * height,
            layer.to[0] * width,
            layer.to[1] * height,
          )
        : context.createRadialGradient(
            layer.center[0] * width,
            layer.center[1] * height,
            0,
            layer.center[0] * width,
            layer.center[1] * height,
            layer.radius * Math.max(width, height),
          );

    for (const [offset, color] of layer.stops) {
      gradient.addColorStop(offset, color);
    }

    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
  }
};

export const getOrgEditorImageSolidBackgroundColor = (color: EmployeeTagColor) =>
  employeeTagColorToHex(color);

const createOrgEditorTemplateFieldResolver =
  ({
    employee,
    isBoss,
    position,
    unitName,
  }: {
    employee: Employee | undefined;
    isBoss: boolean;
    position: string | null;
    unitName: string;
  }) =>
  (fieldName: string): TemplateFieldValue => {
    if (exportEmployeeFieldByKey.has(fieldName as ExportEmployeeFieldKey)) {
      if (!employee) return { known: false };

      return {
        known: true,
        value: getExportEmployeeFieldValue(employee, fieldName as ExportEmployeeFieldKey),
      };
    }

    if (fieldName === "unitName") return { known: true, value: unitName };
    if (fieldName === "position") return { known: true, value: position ?? "" };
    if (fieldName === "isBoss") return { known: true, value: isBoss };

    return { known: false };
  };

const renderOrgEditorTemplate = ({
  employee,
  format,
  isBoss,
  position,
  unitName,
}: {
  employee: Employee | undefined;
  format: string;
  isBoss: boolean;
  position: string | null;
  unitName: string;
}) =>
  renderTemplateFormat({
    formatValue: (value, fieldName) => (fieldName === "isBoss" ? "" : asExportText(value)),
    resolveField: createOrgEditorTemplateFieldResolver({
      employee,
      isBoss,
      position,
      unitName,
    }),
    template: format,
  });

export const createOrgEditorImageExportResult = async ({
  canvasElements = [],
  customEmployeeFieldDefinitions = [],
  distributionEnabledUnitIds,
  distributionUnitIdsByEmployeeId,
  viewSettings,
  avatarLoadLimit = ORG_EDITOR_EXPORT_DEFAULT_AVATAR_LOAD_LIMIT,
  employeeById,
  formatUnitSummary,
  layoutMode,
  locale,
  maxCanvasPixels = ORG_EDITOR_EXPORT_MAX_CANVAS_PIXELS,
  positionNotSpecifiedLabel = "Position not specified",
  rootUnit,
  scope,
  settings,
  tagDefinitions = [],
  tagOrder = [],
  units,
}: {
  canvasElements?: readonly OrgEditorCanvasElement[];
  customEmployeeFieldDefinitions?: readonly CustomEmployeeFieldDefinition[];
  distributionEnabledUnitIds: ReadonlySet<OrgEditorUnitId>;
  distributionUnitIdsByEmployeeId: ReadonlyMap<EmployeeId, readonly OrgEditorUnitId[]>;
  viewSettings: OrgEditorViewSettings;
  avatarLoadLimit?: number;
  employeeById: ReadonlyMap<EmployeeId, Employee>;
  formatUnitSummary: (summary: OrgEditorUnitEmployeeSummary) => string;
  layoutMode: OrgEditorLayoutMode;
  locale: string;
  maxCanvasPixels?: number;
  positionNotSpecifiedLabel?: string;
  rootUnit: OrgEditorUnit | null;
  scope: OrgEditorExportScope | "view";
  settings: OrgEditorImageExportSettings;
  tagDefinitions?: readonly EmployeeTagDefinition[];
  tagOrder?: readonly TagId[];
  units: OrgEditorUnit[];
}) => {
  await waitForCanvasFont({ canvasElements });

  const measureCanvas = document.createElement("canvas");
  const measureContext = measureCanvas.getContext("2d");
  if (!measureContext) {
    throw new Error("Canvas is not available in this browser.");
  }
  measureContext.font = getCanvasFont(
    ORG_EDITOR_EXPORT_FONT_FAMILY,
    400,
    ORG_EDITOR_EXPORT_EMPLOYEE_TAG_STYLE.fontSize,
  );
  const imageFontFamily = getOrgEditorCanvasCssFontFamily(ORG_EDITOR_EXPORT_FONT_FAMILY);
  const measureEmployeeText: EmployeeDisplayTextMeasure = createEmployeeDisplayTextMeasureEngine({
    createContext: () => measureContext,
  }).measure;
  const measureTagText = (value: string) =>
    measureEmployeeText(value, {
      fontFamily: imageFontFamily,
      fontSize: ORG_EDITOR_EXPORT_EMPLOYEE_TAG_STYLE.fontSize,
      fontWeight: 400,
    });
  const imageUnits =
    scope === "view" ? units : rootUnit ? getOrgEditorExportUnits({ rootUnit, scope, units }) : [];
  const employeeSummaryByUnitId = buildOrgEditorUnitEmployeeSummaryById(units);
  const tagDefinitionById = new Map(tagDefinitions.map((tag) => [tag.id, tag] as const));
  const imageUnitRenderData = imageUnits.map((unit) => {
    const rows = getOrgEditorVisibleUnitRows(unit, employeeById, viewSettings.groupByTag, tagOrder);
    const employeeDistributionPresentations = rows.map((row) =>
      row.type === "employee"
        ? getEditorEmployeeDistributionPresentation({
            distributionEnabledUnitIds,
            employeeId: row.employeeId,
            sourceUnitId: unit.id,
            unitIdsByEmployeeId: distributionUnitIdsByEmployeeId,
          })
        : null,
    );
    const width = getOrgEditorUnitBounds(unit).width;
    const availableTagWidth = getOrgEditorEmployeeTextMaxWidth(width);
    const employeeDisplayLines = rows.map((row) => {
      if (row.type !== "employee") return [];
      const employee = employeeById.get(row.employeeId);
      if (!employee) return [];
      const unitPosition = employee.unitPositions.find((position) => position.unitId === unit.id);
      return renderEmployeeDisplayRichLines({
        customEmployeeFieldDefinitions,
        employee,
        format: settings.employeeFormat,
        positionNotSpecifiedLabel,
        unitContexts: unitPosition ? [createOrgUnitContext(unitPosition)] : [],
      });
    });
    const employeeDisplayLayouts = employeeDisplayLines.map((lines) =>
      layoutEmployeeDisplayRichLines(lines, {
        availableWidth: availableTagWidth,
        direction: locale === "ar" ? "rtl" : "ltr",
        font: imageFontFamily,
        formatTag: (tag) => getOrgEditorExportTagLabels([tag], locale)[0] ?? tag.label,
        lineGap: settings.employeeLineGap,
        locale,
        measureText: measureEmployeeText,
        textMode: "editor",
      }),
    );
    const employeeTagLayouts = rows.map((row) => {
      const tags =
        row.type === "employee"
          ? []
          : row.openPosition.tags.flatMap((assignment) => {
              const definition = tagDefinitionById.get(assignment.tagId);
              return definition
                ? [{ ...definition, date: assignment.date } satisfies EmployeeTag]
                : [];
            });
      return createOrgEditorExportEmployeeTagLayout(
        getOrgEditorExportTags(tags, locale),
        availableTagWidth,
        measureTagText,
      );
    });
    const employeeRowHeights = rows.map((row, index) =>
      row.type === "employee"
        ? getOrgEditorEmployeeRowHeightForVisualLayout(employeeDisplayLayouts[index]?.height ?? 0)
        : getOrgEditorExportEmployeeRowHeightForTagLayout(
            employeeTagLayouts[index] ?? { chips: [], height: 0, rowCount: 0 },
          ),
    );
    const { offsets: employeeRowOffsets } = getOrgEditorEmployeeRowStackLayout(employeeRowHeights);

    const tagSummaries = viewSettings.showTagCloud
      ? buildOrgEditorUnitTagSummary(unit, employeeById, tagOrder)
      : [];
    const footerHeight = unit.collapsed
      ? 0
      : getOrgEditorUnitTagFooterHeight(tagSummaries, width - 16, measureTagText);
    return {
      employeeDisplayLayouts,
      employeeDistributionPresentations,
      employeeRowHeights,
      employeeRowOffsets,
      employeeTagLayouts,
      footerHeight,
      height:
        getOrgEditorUnitHeightForEmployeeRows({
          collapsed: unit.collapsed,
          employeeRowHeights,
        }) + footerHeight,
      rows,
      tagSummaries,
      unit,
      width,
    } satisfies OrgEditorImageUnitRenderData;
  });
  const imageUnitRenderDataById = new Map(
    imageUnitRenderData.map((data) => [data.unit.id, data] as const),
  );
  const scopedElementIds =
    scope === "view"
      ? new Set(canvasElements.map((element) => element.id))
      : getOrgEditorScopedCanvasElementIds({
          elements: canvasElements,
          ownerKeys: new Set(
            imageUnitRenderData.flatMap(({ rows, unit }) => [
              `unit:${unit.id}`,
              ...rows.map((row) =>
                row.type === "employee"
                  ? `employee:${unit.id}:${row.employeeId}`
                  : `openPosition:${unit.id}:${row.openPosition.id}`,
              ),
            ]),
          ),
        });
  const sceneCanvasElements = canvasElements.filter((element) => scopedElementIds.has(element.id));
  const resolvedCanvasElementById = resolveOrgEditorCanvasElements({
    elements: sceneCanvasElements,
    resolveExternalAnchor: (ref: OrgEditorAnchorRef) => {
      if (ref.owner.type === "element") return null;
      const unitData = imageUnitRenderDataById.get(ref.owner.unitId);
      if (!unitData) return null;
      const bounds = {
        height: unitData.height,
        rotation: 0,
        width: unitData.width,
        x: unitData.unit.x,
        y: unitData.unit.y,
      };
      if (ref.owner.type === "unit") {
        if (!ORG_EDITOR_RECT_ANCHOR_IDS.includes(ref.anchorId as never)) return null;
        return getOrgEditorRectAnchorPoint(bounds, ref.anchorId as never);
      }
      if (!ORG_EDITOR_EMPLOYEE_ANCHOR_IDS.includes(ref.anchorId as never)) return null;
      const owner = ref.owner;
      const employeeIndex = unitData.rows.findIndex((row) =>
        owner.type === "employee"
          ? row.type === "employee" && row.employeeId === owner.employeeId
          : row.type === "openPosition" && row.openPosition.id === owner.openPositionId,
      );
      if (employeeIndex < 0) return null;
      if (unitData.unit.collapsed) {
        return {
          x: ref.anchorId === "leftCenter" ? bounds.x : bounds.x + bounds.width,
          y: bounds.y + bounds.height / 2,
        };
      }
      const rowBounds = getOrgEditorEmployeeRowSurfaceBounds({
        employeeRowHeight:
          unitData.employeeRowHeights[employeeIndex] ?? ORG_EDITOR_EMPLOYEE_ROW_HEIGHT,
        employeeRowOffset: unitData.employeeRowOffsets[employeeIndex] ?? 0,
        unit: unitData.unit,
      });
      return {
        x: ref.anchorId === "leftCenter" ? rowBounds.x : rowBounds.x + rowBounds.width,
        y: rowBounds.y + rowBounds.height / 2,
      };
    },
  });
  const resolvedCanvasElements = sceneCanvasElements.flatMap((element) => {
    const resolved = resolvedCanvasElementById.get(element.id);
    return resolved ? [resolved.element] : [];
  });
  const unitBounds = imageUnitRenderData.map(({ height, unit, width }) => ({
    height,
    width,
    x: unit.x,
    y: unit.y,
  }));

  const elementBounds = getOrgEditorCanvasElementsBounds(resolvedCanvasElements);
  const contentBounds = [...unitBounds, ...(elementBounds ? [elementBounds] : [])];
  if (contentBounds.length === 0) throw new Error("The View has no content to export as an image.");

  const padding = Math.min(Math.max(settings.padding, 0), 100);
  const unitBorderRadius = Math.min(Math.max(settings.unitBorderRadius, 0), 100);
  const minX = Math.min(...contentBounds.map((bounds) => bounds.x));
  const minY = Math.min(...contentBounds.map((bounds) => bounds.y));
  const maxX = Math.max(...contentBounds.map((bounds) => bounds.x + bounds.width));
  const maxY = Math.max(...contentBounds.map((bounds) => bounds.y + bounds.height));
  const contentWidth = maxX - minX;
  const contentHeight = maxY - minY;
  const imageWidth = Math.ceil(contentWidth + padding * 2);
  const imageHeight = Math.ceil(contentHeight + padding * 2);
  const plan = createOrgEditorImageRenderPlan({
    logicalHeight: imageHeight,
    logicalWidth: imageWidth,
    maxCanvasPixels,
    requestedDensity: ORG_EDITOR_EXPORT_DENSITY,
  });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const avatarUrls = new Set<string>();
  const avatarUrlByEmployeeKey = new Map<string, string>();
  const safeAvatarLoadLimit = Math.max(0, avatarLoadLimit);

  if (!context) {
    throw new Error("Canvas is not available in this browser.");
  }

  for (const { rows, unit } of imageUnitRenderData) {
    for (const row of rows) {
      if (row.type !== "employee") continue;
      const employeeId = row.employeeId;
      const avatarUrl = getEmployeeCanvasAvatarUrl(employeeById.get(employeeId));

      if (!avatarUrl) continue;

      if (avatarUrls.has(avatarUrl) || avatarUrls.size < safeAvatarLoadLimit) {
        avatarUrls.add(avatarUrl);
        avatarUrlByEmployeeKey.set(`${unit.id}:${employeeId}`, avatarUrl);
      }
    }
  }

  const avatarImageByUrl = await loadCanvasImages(
    [...avatarUrls],
    ORG_EDITOR_EXPORT_AVATAR_LOAD_CONCURRENCY,
  );
  const canvasImageByUrl = await loadCanvasImages(
    resolvedCanvasElements.flatMap((element) =>
      element.type === "image" ? [element.dataUrl] : [],
    ),
    ORG_EDITOR_EXPORT_AVATAR_LOAD_CONCURRENCY,
  );

  canvas.width = plan.pixelWidth;
  canvas.height = plan.pixelHeight;
  context.scale(plan.effectiveDensity, plan.effectiveDensity);
  context.lineCap = "round";
  context.lineJoin = "round";

  paintImageBackground(context, imageWidth, imageHeight, settings.background);

  context.save();
  context.translate(padding - minX, padding - minY);

  for (const { height, unit } of imageUnitRenderData) {
    if (scope === "unit" || !unit.parentId) continue;

    const parentUnitData = imageUnitRenderDataById.get(unit.parentId);
    if (!parentUnitData) continue;

    const connectionPath = new Path2D(
      getOrgEditorExportConnectionPath({
        employeeById,
        layoutMode,
        parentUnit: parentUnitData.unit,
        parentUnitHeight: parentUnitData.height,
        unit,
        unitHeight: height,
      }),
    );

    context.strokeStyle = "#cbd5e1";
    context.lineWidth = 2;
    context.stroke(connectionPath);
  }

  for (const element of resolvedCanvasElements) {
    if (element.layer !== "behindUnits") continue;
    paintOrgEditorCanvasElement({ context, element, imageByUrl: canvasImageByUrl });
  }

  for (const {
    employeeDisplayLayouts,
    employeeDistributionPresentations,
    employeeRowHeights,
    employeeRowOffsets,
    employeeTagLayouts,
    footerHeight,
    height,
    rows,
    tagSummaries,
    unit,
    width,
  } of imageUnitRenderData) {
    drawRoundedRect(context, { height, width, x: unit.x, y: unit.y }, unitBorderRadius);
    context.fillStyle = "#ffffff";
    context.fill();
    context.strokeStyle = "#d7dde8";
    context.lineWidth = 1;
    context.stroke();

    const unitIconX =
      unit.x +
      ORG_EDITOR_UNIT_BORDER_WIDTH +
      ORG_EDITOR_UNIT_CONTENT_PADDING +
      ORG_EDITOR_EXPORT_UNIT_ICON_RADIUS;
    const unitIconY =
      unit.y +
      ORG_EDITOR_UNIT_BORDER_WIDTH +
      ORG_EDITOR_UNIT_CONTENT_PADDING +
      ORG_EDITOR_EXPORT_UNIT_ICON_RADIUS;
    drawOrgEditorUnitIcon(context, unitIconX, unitIconY);

    context.textAlign = "start";
    context.textBaseline = "middle";
    context.fillStyle = "#0f172a";
    context.font = getCanvasFont(
      ORG_EDITOR_EXPORT_FONT_FAMILY,
      500,
      ORG_EDITOR_EXPORT_UNIT_TITLE_FONT_SIZE,
    );
    const unitTitleX =
      unit.x +
      ORG_EDITOR_UNIT_BORDER_WIDTH +
      ORG_EDITOR_UNIT_CONTENT_PADDING +
      ORG_EDITOR_EXPORT_UNIT_ICON_SIZE +
      ORG_EDITOR_EXPORT_UNIT_TITLE_GAP;
    drawTrimmedText(
      context,
      getOrgEditorUnitDisplayName(unit),
      unitTitleX,
      unitIconY + 0.5,
      unit.x + width - ORG_EDITOR_UNIT_BORDER_WIDTH - ORG_EDITOR_UNIT_CONTENT_PADDING - unitTitleX,
    );

    const summaryMaxWidth =
      width - ORG_EDITOR_UNIT_BORDER_WIDTH * 2 - ORG_EDITOR_UNIT_CONTENT_PADDING * 2;
    const summary =
      employeeSummaryByUnitId.get(unit.id) ??
      ({
        directCount: unit.employeeIds.length,
        hasChildUnits: false,
        totalCount: unit.employeeIds.length,
      } satisfies OrgEditorUnitEmployeeSummary);
    context.textAlign = "start";
    context.textBaseline = "middle";
    context.fillStyle = "#64748b";
    context.font = getCanvasFont(
      ORG_EDITOR_EXPORT_FONT_FAMILY,
      400,
      ORG_EDITOR_EXPORT_UNIT_SUMMARY_FONT_SIZE,
    );
    drawTrimmedText(
      context,
      formatUnitSummary(summary),
      unit.x + ORG_EDITOR_UNIT_BORDER_WIDTH + ORG_EDITOR_UNIT_CONTENT_PADDING,
      unit.y +
        ORG_EDITOR_UNIT_BORDER_WIDTH +
        ORG_EDITOR_UNIT_HEADER_HEIGHT -
        ORG_EDITOR_UNIT_CONTENT_PADDING -
        8 +
        0.5,
      summaryMaxWidth,
    );

    for (const [employeeIndex, row] of rows.entries()) {
      const employee = row.type === "employee" ? employeeById.get(row.employeeId) : undefined;
      const openPosition = row.type === "openPosition" ? row.openPosition : null;
      const employeeGeometry = getOrgEditorExportEmployeeGeometry(
        unit,
        employeeRowOffsets[employeeIndex] ?? 0,
        employeeRowHeights[employeeIndex] ?? ORG_EDITOR_EMPLOYEE_ROW_HEIGHT,
        employeeTagLayouts[employeeIndex]?.height ?? 0,
      );
      const { avatarX, avatarY } = employeeGeometry;
      const isBoss = row.type === "employee" && unit.bossEmployeeId === row.employeeId;
      const avatarUrl =
        row.type === "employee"
          ? avatarUrlByEmployeeKey.get(`${unit.id}:${row.employeeId}`)
          : undefined;
      const avatarImage = avatarUrl ? (avatarImageByUrl.get(avatarUrl) ?? null) : null;

      const distributionPresentation = employeeDistributionPresentations[employeeIndex] ?? null;
      const distributionFillStyle = getOrgEditorExportEmployeeRowFillStyle(
        distributionPresentation,
        viewSettings,
      );
      const rowSurfaceBounds = getOrgEditorEmployeeRowSurfaceBounds({
        employeeRowHeight: employeeRowHeights[employeeIndex] ?? ORG_EDITOR_EMPLOYEE_ROW_HEIGHT,
        employeeRowOffset: employeeRowOffsets[employeeIndex] ?? 0,
        unit,
      });
      if (distributionFillStyle) {
        drawRoundedRect(context, rowSurfaceBounds, ORG_EDITOR_EMPLOYEE_ROW_BORDER_RADIUS);
        context.fillStyle = distributionFillStyle;
        context.fill();
      }

      const openPositionBackground = openPosition
        ? getOrgEditorExportOpenPositionRowBackground(openPosition.backgroundColor)
        : null;
      if (openPositionBackground) {
        drawRoundedRect(context, rowSurfaceBounds, ORG_EDITOR_EMPLOYEE_ROW_BORDER_RADIUS);
        context.fillStyle = openPositionBackground.fillStyle;
        context.fill();
      }

      if (openPosition) {
        const outline = getOrgEditorExportOpenPositionRowOutline({
          employeeRowHeight: employeeRowHeights[employeeIndex] ?? ORG_EDITOR_EMPLOYEE_ROW_HEIGHT,
          employeeRowOffset: employeeRowOffsets[employeeIndex] ?? 0,
          unit,
        });
        context.save();
        drawRoundedRect(context, outline.bounds, outline.radius);
        context.strokeStyle = outline.strokeStyle;
        context.lineWidth = outline.lineWidth;
        context.setLineDash([...outline.dash]);
        context.stroke();
        context.restore();
      }

      if (isBoss) {
        context.beginPath();
        context.arc(avatarX, avatarY, ORG_EDITOR_AVATAR_RADIUS + 3, 0, Math.PI * 2);
        context.strokeStyle = "#2787f5";
        context.lineWidth = 2;
        context.stroke();
      }

      context.save();
      context.beginPath();
      context.arc(avatarX, avatarY, ORG_EDITOR_AVATAR_RADIUS, 0, Math.PI * 2);
      context.clip();
      if (avatarImage && row.type === "employee") {
        context.drawImage(
          avatarImage,
          avatarX - ORG_EDITOR_AVATAR_RADIUS,
          avatarY - ORG_EDITOR_AVATAR_RADIUS,
          ORG_EDITOR_EMPLOYEE_AVATAR_SIZE,
          ORG_EDITOR_EMPLOYEE_AVATAR_SIZE,
        );
      } else {
        context.fillStyle = "#e2e8f0";
        context.fill();
        context.fillStyle = "#475569";
        context.font = getCanvasFont(ORG_EDITOR_EXPORT_FONT_FAMILY, 700, 8);
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(
          openPosition ? "+" : employee ? getEmployeeInitials(employee) : "?",
          avatarX,
          avatarY + 0.5,
        );
      }
      context.restore();

      context.beginPath();
      context.arc(avatarX, avatarY, ORG_EDITOR_AVATAR_RADIUS, 0, Math.PI * 2);
      context.strokeStyle = "rgba(15, 23, 42, 0.2)";
      context.lineWidth = 1;
      context.setLineDash(openPosition ? [2, 2] : []);
      context.stroke();
      context.setLineDash([]);
      if (isBoss) drawOrgEditorBossBadge(context, avatarX, avatarY);

      context.textAlign = "start";
      context.textBaseline = "alphabetic";
      context.fillStyle = openPositionBackground?.textStyle ?? "#0f172a";
      if (row.type === "employee") {
        const layout = employeeDisplayLayouts[employeeIndex] ?? {
          blocks: [],
          direction: "ltr",
          height: 0,
          lines: [],
          textMode: "editor",
        };
        const lineTops = getOrgEditorEmployeeDisplayVisualLineTops({
          employeeRowHeight: employeeRowHeights[employeeIndex] ?? ORG_EDITOR_EMPLOYEE_ROW_HEIGHT,
          employeeRowOffset: employeeRowOffsets[employeeIndex] ?? 0,
          layout,
          unitY: unit.y,
        });
        for (const [visualLineIndex, line] of layout.lines.entries()) {
          const lineTop = lineTops[visualLineIndex] ?? employeeGeometry.textBaselineY - 13;
          drawOrgEditorEmployeeVisualLine({
            baseline:
              lineTop +
              (ORG_EDITOR_EMPLOYEE_NAME_LINE_HEIGHT + ORG_EDITOR_EMPLOYEE_NAME_FONT_SIZE) / 2 -
              1,
            context,
            fontFamily: ORG_EDITOR_EXPORT_FONT_FAMILY,
            line,
            lineTop,
            x: employeeGeometry.textX,
          });
        }
      } else if (openPosition) {
        context.font = getCanvasFont(
          ORG_EDITOR_EXPORT_FONT_FAMILY,
          400,
          ORG_EDITOR_EMPLOYEE_NAME_FONT_SIZE,
        );
        drawTrimmedText(
          context,
          openPosition.title,
          employeeGeometry.textX,
          employeeGeometry.textBaselineY,
          employeeGeometry.textMaxWidth,
        );
        drawOrgEditorEmployeeTags({
          context,
          fontFamily: ORG_EDITOR_EXPORT_FONT_FAMILY,
          layout: employeeTagLayouts[employeeIndex] ?? { chips: [], height: 0, rowCount: 0 },
          x: employeeGeometry.textX,
          y: employeeGeometry.tagY,
        });
      }
    }

    if (footerHeight > 0 && tagSummaries.length > 0) {
      const footerY = unit.y + height - footerHeight;
      context.fillStyle = "#f1f5f9";
      context.fillRect(unit.x + 1, footerY, width - 2, footerHeight - 1);
      context.font = getCanvasFont(
        ORG_EDITOR_EXPORT_FONT_FAMILY,
        400,
        ORG_EDITOR_EXPORT_EMPLOYEE_TAG_STYLE.fontSize,
      );
      context.textAlign = "start";
      context.textBaseline = "middle";
      const availableWidth = width - ORG_EDITOR_UNIT_TAG_FOOTER_PADDING * 2;
      const footerLayout = createOrgEditorUnitTagFooterLayout(
        tagSummaries,
        availableWidth,
        measureTagText,
      );
      for (const chip of footerLayout.chips) {
        const chipX = unit.x + chip.x;
        const chipY = footerY + chip.y;
        drawRoundedRect(
          context,
          {
            height: chip.height,
            width: chip.width,
            x: chipX,
            y: chipY,
          },
          ORG_EDITOR_EXPORT_EMPLOYEE_TAG_STYLE.radius,
        );
        const colorStyle = getTagColorCanvasStyle(chip.color);
        context.fillStyle = colorStyle.fillStyle;
        context.fill();
        context.fillStyle = colorStyle.textStyle;
        const firstLineCenterY =
          chipY +
          (chip.height - chip.lines.length * ORG_EDITOR_UNIT_TAG_FOOTER_LINE_HEIGHT) / 2 +
          ORG_EDITOR_UNIT_TAG_FOOTER_LINE_HEIGHT / 2;
        chip.lines.forEach((line, lineIndex) => {
          const textX = chipX + ORG_EDITOR_UNIT_TAG_FOOTER_CHIP_HORIZONTAL_PADDING;
          const textY = firstLineCenterY + lineIndex * ORG_EDITOR_UNIT_TAG_FOOTER_LINE_HEIGHT;
          if (line.label) context.fillText(line.label, textX, textY);
          if (line.suffix) {
            const suffixX = textX + (line.label ? context.measureText(line.label).width : 0);
            context.save();
            context.globalAlpha *= 0.7;
            context.fillText(line.suffix, suffixX, textY);
            context.restore();
          }
        });
      }
    }
  }

  for (const element of resolvedCanvasElements) {
    if (element.layer !== "aboveUnits") continue;
    paintOrgEditorCanvasElement({ context, element, imageByUrl: canvasImageByUrl });
  }

  context.restore();

  return { blob: await createPngBlobFromCanvas(canvas), plan };
};

export const createOrgEditorUnitImageBlob = async (
  options: Omit<Parameters<typeof createOrgEditorImageExportResult>[0], "rootUnit" | "scope"> & {
    rootUnit: OrgEditorUnit;
    scope: OrgEditorExportScope;
  },
) => (await createOrgEditorImageExportResult(options)).blob;

export const createOrgEditorViewImageBlob = async (
  options: Omit<Parameters<typeof createOrgEditorImageExportResult>[0], "rootUnit" | "scope">,
) =>
  (
    await createOrgEditorImageExportResult({
      ...options,
      rootUnit: null,
      scope: "view",
    })
  ).blob;

const getOrgEditorTemplateUnits = ({
  rootUnit,
  scope,
  units,
}: {
  rootUnit: OrgEditorUnit;
  scope: OrgEditorExportScope;
  units: OrgEditorUnit[];
}) => {
  const exportUnitIds = new Set(
    getOrgEditorExportUnits({ rootUnit, scope, units }).map((unit) => unit.id),
  );
  const childrenByParentId = new Map<OrgEditorUnitId | null, OrgEditorUnit[]>();

  for (const unit of units) {
    if (!exportUnitIds.has(unit.id)) continue;

    const siblings = childrenByParentId.get(unit.parentId) ?? [];
    siblings.push(unit);
    childrenByParentId.set(unit.parentId, siblings);
  }

  for (const siblings of childrenByParentId.values()) {
    siblings.sort(
      (firstUnit, secondUnit) => firstUnit.y - secondUnit.y || firstUnit.x - secondUnit.x,
    );
  }

  const orderedUnits: OrgEditorUnit[] = [];
  const visit = (unit: OrgEditorUnit) => {
    orderedUnits.push(unit);
    for (const childUnit of childrenByParentId.get(unit.id) ?? []) {
      visit(childUnit);
    }
  };

  visit(rootUnit);

  return orderedUnits.filter((unit) => exportUnitIds.has(unit.id));
};

const getOrgEditorTemplateEmployeeIds = (unit: OrgEditorUnit, sourceIndex: OrgEditorSourceIndex) =>
  sortOrgEditorEmployeeIds({
    bossEmployeeId: unit.bossEmployeeId,
    employeeById: sourceIndex.employeesById,
    employeeIds: unit.employeeIds,
  });

export const buildOrgEditorTemplateRows = ({
  rootUnit,
  scope,
  sourceIndex,
  units,
}: {
  rootUnit: OrgEditorUnit;
  scope: OrgEditorExportScope;
  sourceIndex: OrgEditorSourceIndex;
  units: OrgEditorUnit[];
}) => {
  const rows: OrgEditorTemplateRow[] = [];

  for (const unit of getOrgEditorTemplateUnits({ rootUnit, scope, units })) {
    for (const employeeId of getOrgEditorTemplateEmployeeIds(unit, sourceIndex)) {
      const employee = sourceIndex.employeesById.get(employeeId);
      if (!employee) continue;

      rows.push({
        employee,
        isBoss: employeeId === unit.bossEmployeeId,
        position: getEffectiveEmployeePosition(employee, unit),
        unitId: unit.id,
        unitName: getOrgEditorUnitDisplayName(unit),
      });
    }
  }

  return rows;
};

const getOrgEditorUnitPath = (
  unit: OrgEditorUnit,
  unitById: ReadonlyMap<OrgEditorUnitId, OrgEditorUnit>,
) => {
  const ids: OrgEditorUnitId[] = [];
  const names: string[] = [];
  const visited = new Set<OrgEditorUnitId>();
  let current: OrgEditorUnit | undefined = unit;
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    ids.unshift(current.id);
    names.unshift(getOrgEditorUnitDisplayName(current));
    current = current.parentId ? unitById.get(current.parentId) : undefined;
  }
  return { fullName: names.join(" / "), ids, names };
};

export const buildOrgEditorExportRows = ({
  rootUnit,
  scope,
  sourceIndex,
  units,
}: {
  rootUnit: OrgEditorUnit;
  scope: OrgEditorExportScope;
  sourceIndex: OrgEditorSourceIndex;
  units: OrgEditorUnit[];
}): ExportRow[] => {
  const unitById = new Map(units.map((currentUnit) => [currentUnit.id, currentUnit] as const));
  const exportUnits = getOrgEditorTemplateUnits({ rootUnit, scope, units });
  const contextsByEmployeeId = new Map<EmployeeId, ExportRow["unitContext"][]>();

  for (const currentUnit of exportUnits) {
    const unitPath = getOrgEditorUnitPath(currentUnit, unitById);
    for (const employeeId of getOrgEditorTemplateEmployeeIds(currentUnit, sourceIndex)) {
      const employee = sourceIndex.employeesById.get(employeeId);
      if (!employee) continue;
      const contexts = contextsByEmployeeId.get(employeeId) ?? [];
      const position = getEffectiveEmployeePosition(employee, currentUnit);
      contexts.push({
        id: `org:${currentUnit.id}`,
        isBoss: employeeId === currentUnit.bossEmployeeId,
        position,
        type: "org",
        unitFullPath: unitPath.fullName,
        unitId: currentUnit.id,
        unitName: getOrgEditorUnitDisplayName(currentUnit),
        unitPosition: {
          isBoss: employeeId === currentUnit.bossEmployeeId,
          parentId: currentUnit.parentId,
          position,
          unitId: currentUnit.id,
          unitName: getOrgEditorUnitDisplayName(currentUnit),
          unitPath,
        },
      });
      contextsByEmployeeId.set(employeeId, contexts);
    }
  }

  const rows: ExportRow[] = [];
  for (const [employeeId, contexts] of contextsByEmployeeId) {
    const employee = sourceIndex.employeesById.get(employeeId);
    if (!employee) continue;
    rows.push(
      ...buildEmployeeExportRows({
        employee,
        isDirectlySelected: true,
        unitContexts: contexts.filter((context) => context !== null),
      }),
    );
  }
  return rows;
};

export const createOrgEditorTemplateText = ({
  rows,
  templateFormat,
}: {
  rows: OrgEditorTemplateRow[];
  templateFormat: string;
}) =>
  rows
    .map((row) =>
      renderOrgEditorTemplate({
        employee: row.employee,
        format: templateFormat,
        isBoss: row.isBoss,
        position: row.position,
        unitName: row.unitName,
      }),
    )
    .join("");
