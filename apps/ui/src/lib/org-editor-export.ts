import type {
  Employee,
  EmployeeId,
  OrgEditorLayoutMode,
  OrgEditorUnit,
  OrgEditorUnitId,
} from "@org-tools/types";
import { isSafeAvatarBase64Url } from "@/lib/employee-data";
import { sortEmployeeTags } from "@/lib/employee-tags";
import { getEmployeeInitials } from "@/lib/employee-utils";
import {
  asExportText,
  exportEmployeeFieldByKey,
  getExportEmployeeFieldValue,
} from "@/lib/export-format";
import type { OrgEditorSourceIndex } from "@/lib/org-editor";
import {
  buildOrgEditorUnitEmployeeSummaryById,
  getOrgEditorEmployeePosition,
  getOrgEditorUnitBounds,
  getOrgEditorUnitDescendantIds,
  getOrgEditorUnitDisplayName,
  getOrgEditorVisibleEmployeeIds,
  type OrgEditorUnitEmployeeSummary,
  sortOrgEditorEmployeeIds,
} from "@/lib/org-editor";
import {
  renderTemplateFormat,
  type TemplateFieldValue,
  templateReferencesField,
} from "@/lib/template-format";
import type { ExportEmployeeFieldKey } from "@/stores/org-store";

export type OrgEditorExportScope = "subtree" | "unit";
export type OrgEditorExportTab = "image" | "template";
export type OrgEditorExportTitleAlign = "center" | "left" | "right";
export type OrgEditorImageBackground =
  | { type: "transparent" }
  | { color: string; type: "solid" }
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
  fontFamily: string;
  imageBossLabel: string;
  padding: number;
  title: string;
  titleAlign: OrgEditorExportTitleAlign;
  titleFontSize: number;
  unitBorderRadius: number;
};

export type OrgEditorExportFont = {
  family: string;
  label: string;
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
  employeeIds: EmployeeId[];
  employeeRowOffsets: number[];
  height: number;
  unit: OrgEditorUnit;
  width: number;
};

const ORG_EDITOR_AVATAR_SIZE = 20;
const ORG_EDITOR_AVATAR_RADIUS = ORG_EDITOR_AVATAR_SIZE / 2;
const ORG_EDITOR_EXPORT_HEADER_HEIGHT = 64;
const ORG_EDITOR_EXPORT_PADDING = 16;
const ORG_EDITOR_EXPORT_EMPLOYEE_ROW_HEIGHT = 48;
export const ORG_EDITOR_EXPORT_EMPLOYEE_TAG_STYLE = {
  fillStyle: "rgba(29, 29, 29, 0.1)",
  fontSize: 11,
  gap: 4,
  height: 20,
  horizontalPadding: 8,
  radius: 6,
  textStyle: "#1d1d1d",
  widthPerCharacter: 6.3,
} as const;
const DEFAULT_TITLE_FONT_SIZE = 20;
const ORG_EDITOR_EXPORT_AVATAR_LOAD_CONCURRENCY = 8;
const ORG_EDITOR_EXPORT_DEFAULT_AVATAR_LOAD_LIMIT = 700;
const ORG_EDITOR_EXPORT_DEFAULT_MAX_CANVAS_PIXELS = 32_000_000;
export const ORG_EDITOR_EXPORT_PREVIEW_AVATAR_LOAD_LIMIT = 160;
export const ORG_EDITOR_EXPORT_PREVIEW_MAX_CANVAS_PIXELS = 8_000_000;
export const ORG_EDITOR_DEFAULT_EMPLOYEE_IMAGE_FORMAT = "{fullName} {isBoss ? '· {isBoss}' : ''}";
export const ORG_EDITOR_DEFAULT_BOSS_LABEL = "Manager";

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

export const ORG_EDITOR_EXPORT_FONTS: OrgEditorExportFont[] = [
  { family: "Inter", label: "Inter" },
  { family: "Roboto", label: "Roboto" },
  { family: "Open Sans", label: "Open Sans" },
  { family: "Noto Sans", label: "Noto Sans" },
  { family: "Source Sans 3", label: "Source Sans 3" },
  { family: "IBM Plex Sans", label: "IBM Plex Sans" },
  { family: "Montserrat", label: "Montserrat" },
  { family: "Manrope", label: "Manrope" },
  { family: "Nunito Sans", label: "Nunito Sans" },
  { family: "PT Sans", label: "PT Sans" },
];

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

export const createDefaultOrgEditorImageExportSettings = (): OrgEditorImageExportSettings => ({
  background: { type: "transparent" },
  employeeFormat: ORG_EDITOR_DEFAULT_EMPLOYEE_IMAGE_FORMAT,
  fontFamily: ORG_EDITOR_EXPORT_FONTS[0]?.family ?? "Inter",
  imageBossLabel: ORG_EDITOR_DEFAULT_BOSS_LABEL,
  padding: 20,
  title: "",
  titleAlign: "left",
  titleFontSize: DEFAULT_TITLE_FONT_SIZE,
  unitBorderRadius: 5,
});

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

export const orgEditorTemplateContainsBossToken = (templateFormat: string) =>
  templateReferencesField(templateFormat, "isBoss");

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

const getOrgEditorExportUnitHeightForRows = (employeeRowHeights: readonly number[]) =>
  employeeRowHeights.length === 0
    ? ORG_EDITOR_EXPORT_HEADER_HEIGHT
    : ORG_EDITOR_EXPORT_HEADER_HEIGHT +
      ORG_EDITOR_EXPORT_PADDING +
      employeeRowHeights.reduce((sum, height) => sum + height, 0);

const getOrgEditorExportUnitHeight = (
  unit: OrgEditorUnit,
  employeeById: ReadonlyMap<EmployeeId, Employee>,
) =>
  getOrgEditorExportUnitHeightForRows(
    getOrgEditorVisibleEmployeeIds(unit, employeeById).map(
      () => ORG_EDITOR_EXPORT_EMPLOYEE_ROW_HEIGHT,
    ),
  );

export const getOrgEditorExportEmployeeGeometry = (
  unit: OrgEditorUnit,
  employeeRowOffset: number,
) => {
  const avatarX = unit.x + ORG_EDITOR_EXPORT_PADDING + ORG_EDITOR_AVATAR_RADIUS;
  const avatarY =
    unit.y +
    ORG_EDITOR_EXPORT_HEADER_HEIGHT +
    ORG_EDITOR_EXPORT_PADDING +
    ORG_EDITOR_AVATAR_RADIUS +
    employeeRowOffset;
  const textX = avatarX + ORG_EDITOR_AVATAR_RADIUS + 10;

  return {
    avatarX,
    avatarY,
    tagY: avatarY + ORG_EDITOR_AVATAR_RADIUS,
    textBaselineY: avatarY + 5,
    textMaxWidth: getOrgEditorUnitBounds(unit).width - ORG_EDITOR_EXPORT_PADDING - textX + unit.x,
    textX,
  };
};

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

const quoteFontFamily = (fontFamily: string) => `"${fontFamily.replaceAll('"', "")}"`;

const getCanvasFont = (fontFamily: string, weight: 400 | 700, size: number) =>
  `${weight} ${size}px ${quoteFontFamily(fontFamily)}, Arial, sans-serif`;

export const getOrgEditorExportEmployeeTagLabels = (employee: Employee, locale: string) => {
  const formatter = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  });
  return sortEmployeeTags(employee.tags).map((tag) =>
    tag.date ? `${tag.label} · ${formatter.format(new Date(`${tag.date}T00:00:00Z`))}` : tag.label,
  );
};

type OrgEditorExportMeasureText = (label: string) => number;

export const getOrgEditorExportEmployeeTagChipWidth = (
  label: string,
  maxWidth: number,
  measureText: OrgEditorExportMeasureText = (text) =>
    text.length * ORG_EDITOR_EXPORT_EMPLOYEE_TAG_STYLE.widthPerCharacter,
) =>
  Math.min(
    maxWidth,
    Math.max(24, ORG_EDITOR_EXPORT_EMPLOYEE_TAG_STYLE.horizontalPadding * 2 + measureText(label)),
  );

export const getOrgEditorExportEmployeeTagRowCount = (
  labels: readonly string[],
  maxWidth: number,
  measureText?: OrgEditorExportMeasureText,
) => {
  if (labels.length === 0) return 0;

  let rowCount = 1;
  let usedWidth = 0;
  for (const label of labels) {
    const chipWidth = getOrgEditorExportEmployeeTagChipWidth(label, maxWidth, measureText);
    const nextWidth =
      usedWidth === 0
        ? chipWidth
        : usedWidth + ORG_EDITOR_EXPORT_EMPLOYEE_TAG_STYLE.gap + chipWidth;
    if (usedWidth > 0 && nextWidth > maxWidth) {
      rowCount += 1;
      usedWidth = chipWidth;
    } else {
      usedWidth = nextWidth;
    }
  }

  return rowCount;
};

export const getOrgEditorExportEmployeeRowHeight = (
  employee: Employee,
  locale: string,
  maxWidth: number,
  measureText?: OrgEditorExportMeasureText,
) => {
  const rowCount = getOrgEditorExportEmployeeTagRowCount(
    getOrgEditorExportEmployeeTagLabels(employee, locale),
    maxWidth,
    measureText,
  );

  return (
    ORG_EDITOR_EXPORT_EMPLOYEE_ROW_HEIGHT +
    Math.max(0, rowCount - 1) *
      (ORG_EDITOR_EXPORT_EMPLOYEE_TAG_STYLE.height + ORG_EDITOR_EXPORT_EMPLOYEE_TAG_STYLE.gap)
  );
};

const drawOrgEditorEmployeeTags = ({
  context,
  employee,
  fontFamily,
  locale,
  maxWidth,
  x,
  y,
}: {
  context: CanvasRenderingContext2D;
  employee: Employee;
  fontFamily: string;
  locale: string;
  maxWidth: number;
  x: number;
  y: number;
}) => {
  const labels = getOrgEditorExportEmployeeTagLabels(employee, locale);
  if (labels.length === 0) return;

  context.font = getCanvasFont(fontFamily, 400, ORG_EDITOR_EXPORT_EMPLOYEE_TAG_STYLE.fontSize);
  let chipX = x;
  let chipY = y;

  context.textAlign = "start";
  context.textBaseline = "middle";
  for (const label of labels) {
    const width = getOrgEditorExportEmployeeTagChipWidth(
      label,
      maxWidth,
      (text) => context.measureText(text).width,
    );
    if (chipX > x && chipX + width > x + maxWidth) {
      chipX = x;
      chipY +=
        ORG_EDITOR_EXPORT_EMPLOYEE_TAG_STYLE.height + ORG_EDITOR_EXPORT_EMPLOYEE_TAG_STYLE.gap;
    }

    drawRoundedRect(
      context,
      {
        height: ORG_EDITOR_EXPORT_EMPLOYEE_TAG_STYLE.height,
        width,
        x: chipX,
        y: chipY,
      },
      ORG_EDITOR_EXPORT_EMPLOYEE_TAG_STYLE.radius,
    );
    context.fillStyle = ORG_EDITOR_EXPORT_EMPLOYEE_TAG_STYLE.fillStyle;
    context.fill();
    context.fillStyle = ORG_EDITOR_EXPORT_EMPLOYEE_TAG_STYLE.textStyle;
    drawTrimmedText(
      context,
      label,
      chipX + ORG_EDITOR_EXPORT_EMPLOYEE_TAG_STYLE.horizontalPadding,
      chipY + ORG_EDITOR_EXPORT_EMPLOYEE_TAG_STYLE.height / 2 + 0.5,
      Math.max(0, width - ORG_EDITOR_EXPORT_EMPLOYEE_TAG_STYLE.horizontalPadding * 2),
    );
    chipX += width + ORG_EDITOR_EXPORT_EMPLOYEE_TAG_STYLE.gap;
  }
};

const waitForCanvasFont = async ({
  fontFamily,
  titleFontSize,
}: {
  fontFamily: string;
  titleFontSize: number;
}) => {
  if (typeof document === "undefined" || !document.fonts) return;

  const fontRequests = new Set<string>([
    getCanvasFont(fontFamily, 400, ORG_EDITOR_EXPORT_EMPLOYEE_TAG_STYLE.fontSize),
    getCanvasFont(fontFamily, 400, 12),
    getCanvasFont(fontFamily, 700, 8),
    getCanvasFont(fontFamily, 700, 14),
    getCanvasFont(fontFamily, 700, titleFontSize),
  ]);

  await Promise.all([...fontRequests].map((fontRequest) => document.fonts.load(fontRequest)));
};

const getOrgEditorConnectionPath = ({
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
    context.fillStyle = background.color;
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

const createOrgEditorTemplateFieldResolver =
  ({
    bossLabel,
    employee,
    isBoss,
    position,
    unitName,
  }: {
    bossLabel: string;
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
    if (fieldName === "isBoss") return { known: true, value: isBoss ? bossLabel : "" };

    return { known: false };
  };

const renderOrgEditorTemplate = ({
  bossLabel,
  employee,
  format,
  isBoss,
  position,
  unitName,
}: {
  bossLabel: string;
  employee: Employee | undefined;
  format: string;
  isBoss: boolean;
  position: string | null;
  unitName: string;
}) =>
  renderTemplateFormat({
    formatValue: asExportText,
    resolveField: createOrgEditorTemplateFieldResolver({
      bossLabel,
      employee,
      isBoss,
      position,
      unitName,
    }),
    template: format,
  });

export const createOrgEditorUnitImageBlob = async ({
  avatarLoadLimit = ORG_EDITOR_EXPORT_DEFAULT_AVATAR_LOAD_LIMIT,
  employeeById,
  formatUnitSummary,
  layoutMode,
  locale,
  maxCanvasPixels = ORG_EDITOR_EXPORT_DEFAULT_MAX_CANVAS_PIXELS,
  rootUnit,
  scope,
  settings,
  units,
}: {
  avatarLoadLimit?: number;
  employeeById: ReadonlyMap<EmployeeId, Employee>;
  formatUnitSummary: (summary: OrgEditorUnitEmployeeSummary) => string;
  layoutMode: OrgEditorLayoutMode;
  locale: string;
  maxCanvasPixels?: number;
  rootUnit: OrgEditorUnit;
  scope: OrgEditorExportScope;
  settings: OrgEditorImageExportSettings;
  units: OrgEditorUnit[];
}) => {
  const titleFontSize = Math.min(Math.max(settings.titleFontSize, 12), 48);
  const titleLineHeight = Math.ceil(titleFontSize * 1.45);

  await waitForCanvasFont({ fontFamily: settings.fontFamily, titleFontSize });

  const measureCanvas = document.createElement("canvas");
  const measureContext = measureCanvas.getContext("2d");
  if (measureContext) {
    measureContext.font = getCanvasFont(
      settings.fontFamily,
      400,
      ORG_EDITOR_EXPORT_EMPLOYEE_TAG_STYLE.fontSize,
    );
  }
  const measureTagText = measureContext
    ? (label: string) => measureContext.measureText(label).width
    : undefined;
  const imageUnits = getOrgEditorExportUnits({ rootUnit, scope, units });
  const employeeSummaryByUnitId = buildOrgEditorUnitEmployeeSummaryById(units);
  const imageUnitRenderData = imageUnits.map((unit) => {
    const employeeIds = getOrgEditorVisibleEmployeeIds(unit, employeeById);
    const width = getOrgEditorUnitBounds(unit).width;
    const availableTagWidth = getOrgEditorExportEmployeeGeometry(unit, 0).textMaxWidth;
    const employeeRowHeights = employeeIds.map((employeeId) => {
      const employee = employeeById.get(employeeId);
      return employee
        ? getOrgEditorExportEmployeeRowHeight(employee, locale, availableTagWidth, measureTagText)
        : ORG_EDITOR_EXPORT_EMPLOYEE_ROW_HEIGHT;
    });
    const employeeRowOffsets: number[] = [];
    let rowOffset = 0;
    for (const height of employeeRowHeights) {
      employeeRowOffsets.push(rowOffset);
      rowOffset += height;
    }

    return {
      employeeIds,
      employeeRowOffsets,
      height: getOrgEditorExportUnitHeightForRows(employeeRowHeights),
      unit,
      width,
    } satisfies OrgEditorImageUnitRenderData;
  });
  const imageUnitRenderDataById = new Map(
    imageUnitRenderData.map((data) => [data.unit.id, data] as const),
  );
  const unitBounds = imageUnitRenderData.map(({ height, unit, width }) => ({
    height,
    width,
    x: unit.x,
    y: unit.y,
  }));

  if (unitBounds.length === 0) {
    throw new Error("The selected Unit has no structure to export as an image.");
  }

  const padding = Math.min(Math.max(settings.padding, 0), 100);
  const unitBorderRadius = Math.min(Math.max(settings.unitBorderRadius, 0), 100);
  const title = settings.title.trim();
  const minX = Math.min(...unitBounds.map((bounds) => bounds.x));
  const minY = Math.min(...unitBounds.map((bounds) => bounds.y));
  const maxX = Math.max(...unitBounds.map((bounds) => bounds.x + bounds.width));
  const maxY = Math.max(...unitBounds.map((bounds) => bounds.y + bounds.height));
  const contentWidth = maxX - minX;
  const contentHeight = maxY - minY;
  const titleHeight = title ? titleLineHeight : 0;
  const titleGap = title ? padding : 0;
  let titleWidth = 0;

  if (measureContext && title) {
    measureContext.font = getCanvasFont(settings.fontFamily, 700, titleFontSize);
    titleWidth = measureContext.measureText(title).width;
  }

  const imageWidth = Math.ceil(Math.max(contentWidth, titleWidth) + padding * 2);
  const imageHeight = Math.ceil(contentHeight + padding * 2 + titleHeight + titleGap);
  const requestedScale = Math.min(window.devicePixelRatio || 1, 2);
  const maxPixelRatioScale = Math.sqrt(
    Math.max(1, maxCanvasPixels) / Math.max(1, imageWidth * imageHeight),
  );
  const scale = Math.max(0.05, Math.min(requestedScale, maxPixelRatioScale));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const avatarUrls = new Set<string>();
  const avatarUrlByEmployeeKey = new Map<string, string>();
  const safeAvatarLoadLimit = Math.max(0, avatarLoadLimit);

  if (!context) {
    throw new Error("Canvas is not available in this browser.");
  }

  for (const { employeeIds, unit } of imageUnitRenderData) {
    for (const employeeId of employeeIds) {
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

  canvas.width = Math.max(1, Math.ceil(imageWidth * scale));
  canvas.height = Math.max(1, Math.ceil(imageHeight * scale));
  context.scale(scale, scale);
  context.lineCap = "round";
  context.lineJoin = "round";

  paintImageBackground(context, imageWidth, imageHeight, settings.background);

  if (title) {
    context.fillStyle = "#0f172a";
    context.font = getCanvasFont(settings.fontFamily, 700, titleFontSize);
    context.textBaseline = "alphabetic";

    const titleX =
      settings.titleAlign === "center"
        ? imageWidth / 2
        : settings.titleAlign === "right"
          ? imageWidth - padding
          : padding;
    context.textAlign = settings.titleAlign === "center" ? "center" : settings.titleAlign;
    drawTrimmedText(context, title, titleX, padding + titleFontSize, imageWidth - padding * 2);
  }

  context.save();
  context.translate(padding - minX, padding + titleHeight + titleGap - minY);

  for (const { height, unit } of imageUnitRenderData) {
    if (scope === "unit" || !unit.parentId) continue;

    const parentUnitData = imageUnitRenderDataById.get(unit.parentId);
    if (!parentUnitData) continue;

    const connectionPath = new Path2D(
      getOrgEditorConnectionPath({
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

  for (const { employeeIds, employeeRowOffsets, height, unit, width } of imageUnitRenderData) {
    drawRoundedRect(context, { height, width, x: unit.x, y: unit.y }, unitBorderRadius);
    context.fillStyle = "#ffffff";
    context.fill();
    context.strokeStyle = "#d7dde8";
    context.lineWidth = 1;
    context.stroke();

    context.beginPath();
    context.moveTo(unit.x, unit.y + ORG_EDITOR_EXPORT_HEADER_HEIGHT);
    context.lineTo(unit.x + width, unit.y + ORG_EDITOR_EXPORT_HEADER_HEIGHT);
    context.strokeStyle = "#e2e8f0";
    context.stroke();

    context.textAlign = "start";
    context.textBaseline = "alphabetic";
    context.fillStyle = "#0f172a";
    context.font = getCanvasFont(settings.fontFamily, 700, 14);
    drawTrimmedText(
      context,
      getOrgEditorUnitDisplayName(unit),
      unit.x + ORG_EDITOR_EXPORT_PADDING,
      unit.y + ORG_EDITOR_EXPORT_PADDING + 14,
      width - ORG_EDITOR_EXPORT_PADDING * 2,
    );

    context.fillStyle = "#64748b";
    context.font = getCanvasFont(settings.fontFamily, 400, 12);
    drawTrimmedText(
      context,
      formatUnitSummary(
        employeeSummaryByUnitId.get(unit.id) ?? {
          directCount: unit.employeeIds.length,
          hasChildUnits: false,
          totalCount: unit.employeeIds.length,
        },
      ),
      unit.x + ORG_EDITOR_EXPORT_PADDING,
      unit.y + ORG_EDITOR_EXPORT_HEADER_HEIGHT - ORG_EDITOR_EXPORT_PADDING,
      width - ORG_EDITOR_EXPORT_PADDING * 2,
    );

    for (const [employeeIndex, employeeId] of employeeIds.entries()) {
      const employee = employeeById.get(employeeId);
      const employeeGeometry = getOrgEditorExportEmployeeGeometry(
        unit,
        employeeRowOffsets[employeeIndex] ?? 0,
      );
      const { avatarX, avatarY } = employeeGeometry;
      const isBoss = unit.bossEmployeeId === employeeId;
      const avatarUrl = avatarUrlByEmployeeKey.get(`${unit.id}:${employeeId}`);
      const avatarImage = avatarUrl ? (avatarImageByUrl.get(avatarUrl) ?? null) : null;
      const employeeText = employee
        ? renderOrgEditorTemplate({
            bossLabel: settings.imageBossLabel.trim(),
            employee,
            format: settings.employeeFormat,
            isBoss,
            position: getEffectiveEmployeePosition(employee, unit),
            unitName: getOrgEditorUnitDisplayName(unit),
          })
            .replace(/\s+/g, " ")
            .trim()
        : "Employee unavailable";

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
      if (avatarImage) {
        context.drawImage(
          avatarImage,
          avatarX - ORG_EDITOR_AVATAR_RADIUS,
          avatarY - ORG_EDITOR_AVATAR_RADIUS,
          ORG_EDITOR_AVATAR_SIZE,
          ORG_EDITOR_AVATAR_SIZE,
        );
      } else {
        context.fillStyle = "#e2e8f0";
        context.fill();
        context.fillStyle = "#475569";
        context.font = getCanvasFont(settings.fontFamily, 700, 8);
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(employee ? getEmployeeInitials(employee) : "?", avatarX, avatarY + 0.5);
      }
      context.restore();

      context.beginPath();
      context.arc(avatarX, avatarY, ORG_EDITOR_AVATAR_RADIUS, 0, Math.PI * 2);
      context.strokeStyle = "rgba(15, 23, 42, 0.2)";
      context.lineWidth = 1;
      context.stroke();

      context.textAlign = "start";
      context.textBaseline = "alphabetic";
      context.fillStyle = "#0f172a";
      context.font = getCanvasFont(settings.fontFamily, 400, 12);
      drawTrimmedText(
        context,
        employeeText,
        employeeGeometry.textX,
        employeeGeometry.textBaselineY,
        employeeGeometry.textMaxWidth,
      );
      if (employee) {
        drawOrgEditorEmployeeTags({
          context,
          employee,
          fontFamily: settings.fontFamily,
          locale,
          maxWidth: employeeGeometry.textMaxWidth,
          x: employeeGeometry.textX,
          y: employeeGeometry.tagY,
        });
      }
    }
  }

  context.restore();

  return createPngBlobFromCanvas(canvas);
};

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

export const createOrgEditorTemplateText = ({
  bossLabel,
  rows,
  templateFormat,
}: {
  bossLabel: string;
  rows: OrgEditorTemplateRow[];
  templateFormat: string;
}) =>
  rows
    .map((row) =>
      renderOrgEditorTemplate({
        bossLabel,
        employee: row.employee,
        format: templateFormat,
        isBoss: row.isBoss,
        position: row.position,
        unitName: row.unitName,
      }),
    )
    .join("");
