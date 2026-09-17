import type {
  EmployeeTagColor,
  OrgEditorAnchorRef,
  OrgEditorArrowElement,
  OrgEditorArrowEndpoint,
  OrgEditorCanvasElement,
  OrgEditorCanvasElementId,
  OrgEditorCanvasPoint,
  OrgEditorImageElement,
  OrgEditorInlineTypography,
  OrgEditorRectAnchorId,
  OrgEditorStickerElement,
  OrgEditorTextElement,
  OrgEditorTextFormatRun,
  OrgEditorTypography,
  OrgEditorUnitId,
} from "@org-tools/types";

import { createUuid } from "@/lib/employee-data";

export type OrgEditorCanvasRect = {
  height: number;
  width: number;
  x: number;
  y: number;
};

export type OrgEditorCanvasResizeHandle = Exclude<OrgEditorRectAnchorId, "center">;

export type ResolvedOrgEditorCanvasElement = {
  bounds: OrgEditorCanvasRect;
  element: OrgEditorCanvasElement;
};

export const ORG_EDITOR_CANVAS_TEXT_MAX_UTF8_BYTES = 64 * 1024;
export const ORG_EDITOR_CANVAS_IMAGE_MAX_BYTES = 25 * 1024 * 1024;
export const ORG_EDITOR_CANVAS_IMAGE_MAX_PIXELS = 40_000_000;
export const ORG_EDITOR_CANVAS_MIN_RECT_SIZE = 24;
export const ORG_EDITOR_CANVAS_MAX_RECT_SIZE = 20_000;
export const ORG_EDITOR_CANVAS_MAX_FONT_SIZE = 200;
export const ORG_EDITOR_CANVAS_MIN_FONT_SIZE = 8;
export const ORG_EDITOR_CANVAS_MAX_STROKE_WIDTH = 24;
export const ORG_EDITOR_CANVAS_MAX_COORDINATE = 1_000_000;
export const ORG_EDITOR_CANVAS_MIN_TEXT_WIDTH = 48;
export const ORG_EDITOR_CANVAS_MIN_TEXT_HEIGHT = 32;
export const ORG_EDITOR_CANVAS_TEXT_AUTO_MAX_WIDTH = 480;
export const ORG_EDITOR_CANVAS_TEXT_AUTO_MAX_HEIGHT = 320;
export const ORG_EDITOR_CANVAS_TEXT_PADDING = 4;
export const ORG_EDITOR_CANVAS_FONTS = [
  "system-ui",
  "Georgia",
  "Bebas Neue",
  "Lobster",
  "Montserrat",
] as const;

export const ORG_EDITOR_CANVAS_LEGACY_FONTS = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Noto Sans",
  "Source Sans 3",
  "IBM Plex Sans",
  "Manrope",
  "Nunito Sans",
  "PT Sans",
] as const;

export type OrgEditorCanvasFontFamily = (typeof ORG_EDITOR_CANVAS_FONTS)[number];

const ORG_EDITOR_CANVAS_ACCEPTED_FONTS = [
  ...ORG_EDITOR_CANVAS_FONTS,
  ...ORG_EDITOR_CANVAS_LEGACY_FONTS,
] as const;

export const resolveOrgEditorCanvasFontFamily = (fontFamily: string): OrgEditorCanvasFontFamily =>
  ORG_EDITOR_CANVAS_FONTS.includes(fontFamily as OrgEditorCanvasFontFamily)
    ? (fontFamily as OrgEditorCanvasFontFamily)
    : "system-ui";

export const getOrgEditorCanvasCssFontFamily = (fontFamily: string) => {
  switch (resolveOrgEditorCanvasFontFamily(fontFamily)) {
    case "Georgia":
      return 'Georgia, "Times New Roman", serif';
    case "Bebas Neue":
      return '"Bebas Neue", Impact, sans-serif';
    case "Lobster":
      return "Lobster, Georgia, serif";
    case "Montserrat":
      return "Montserrat, system-ui, sans-serif";
    default:
      return 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  }
};

export const resolveOrgEditorCanvasElementFontWeight = (
  fontWeight: OrgEditorTypography["fontWeight"],
): 400 | 700 => (fontWeight === 700 ? 700 : 400);

export const resolveOrgEditorCanvasTypography = (
  typography: OrgEditorTypography,
): OrgEditorTypography => ({
  ...typography,
  fontFamily: resolveOrgEditorCanvasFontFamily(typography.fontFamily),
  fontWeight: resolveOrgEditorCanvasElementFontWeight(typography.fontWeight),
});

export const getOrgEditorInlineTypography = (
  typography: OrgEditorTypography,
): OrgEditorInlineTypography => ({
  color: typography.color,
  fontFamily: typography.fontFamily,
  fontSize: typography.fontSize,
  fontWeight: typography.fontWeight,
});

export const resolveOrgEditorCanvasInlineTypography = (
  typography: OrgEditorInlineTypography,
): OrgEditorInlineTypography => ({
  ...typography,
  fontFamily: resolveOrgEditorCanvasFontFamily(typography.fontFamily),
  fontWeight: resolveOrgEditorCanvasElementFontWeight(typography.fontWeight),
});

export const getOrgEditorCanvasFont = (fontFamily: string, weight: number, size: number) =>
  `${weight === 700 ? 700 : 400} ${size}px ${getOrgEditorCanvasCssFontFamily(fontFamily)}`;

export const getOrgEditorCanvasElementFont = (
  typography: Pick<OrgEditorTypography, "fontFamily" | "fontSize" | "fontWeight">,
) =>
  getOrgEditorCanvasFont(
    typography.fontFamily,
    resolveOrgEditorCanvasElementFontWeight(typography.fontWeight),
    typography.fontSize,
  );

export const normalizeOrgEditorCanvasDimension = (value: number) =>
  Math.min(
    ORG_EDITOR_CANVAS_MAX_RECT_SIZE,
    Math.max(ORG_EDITOR_CANVAS_MIN_RECT_SIZE, Math.round(value)),
  );

export const normalizeOrgEditorCanvasDimensions = ({
  height,
  width,
}: Pick<OrgEditorCanvasRect, "height" | "width">) => ({
  height: normalizeOrgEditorCanvasDimension(height),
  width: normalizeOrgEditorCanvasDimension(width),
});

export const ORG_EDITOR_RECT_ANCHOR_IDS: readonly OrgEditorRectAnchorId[] = [
  "topLeft",
  "topCenter",
  "topRight",
  "rightCenter",
  "bottomRight",
  "bottomCenter",
  "bottomLeft",
  "leftCenter",
  "center",
];
export const ORG_EDITOR_CANVAS_RESIZE_HANDLE_IDS: readonly OrgEditorCanvasResizeHandle[] = [
  "topLeft",
  "topCenter",
  "topRight",
  "rightCenter",
  "bottomRight",
  "bottomCenter",
  "bottomLeft",
  "leftCenter",
];
export const ORG_EDITOR_CANVAS_ROTATE_HANDLE_IDS = [
  "topLeft",
  "topRight",
  "bottomRight",
  "bottomLeft",
] as const;
export const ORG_EDITOR_EMPLOYEE_ANCHOR_IDS = ["leftCenter", "rightCenter"] as const;
export const ORG_EDITOR_ARROW_ANCHOR_IDS = ["start", "middle", "end"] as const;

export const getOrgEditorCanvasImagePlaceholderPoints = (width: number, height: number) => [
  { x: width * 0.2, y: height * 0.75 },
  { x: width * 0.45, y: height * 0.45 },
  { x: width * 0.62, y: height * 0.62 },
  { x: width * 0.8, y: height * 0.35 },
];

const DEFAULT_TYPOGRAPHY: OrgEditorTypography = {
  color: "#334155",
  fontFamily: "system-ui",
  fontSize: 18,
  fontWeight: 400,
  horizontalAlign: "left",
  verticalAlign: "top",
};

export const createDefaultOrgEditorTypography = (
  overrides: Partial<OrgEditorTypography> = {},
): OrgEditorTypography => ({ ...DEFAULT_TYPOGRAPHY, ...overrides });

export const createOrgEditorTextElement = (point: OrgEditorCanvasPoint): OrgEditorTextElement => ({
  attachment: null,
  autoWidth: true,
  fillColor: "amber",
  fillMode: "none",
  formatRuns: [],
  height: ORG_EDITOR_CANVAS_MIN_TEXT_HEIGHT,
  id: createUuid(),
  layer: "aboveUnits",
  rotation: 0,
  text: "Text",
  typography: createDefaultOrgEditorTypography(),
  type: "text",
  width: ORG_EDITOR_CANVAS_MIN_TEXT_WIDTH,
  x: point.x - ORG_EDITOR_CANVAS_MIN_TEXT_WIDTH / 2,
  y: point.y - ORG_EDITOR_CANVAS_MIN_TEXT_HEIGHT / 2,
});

export const createOrgEditorStickerElement = (
  point: OrgEditorCanvasPoint,
): OrgEditorStickerElement => ({
  attachment: null,
  backgroundColor: "amber",
  formatRuns: [],
  height: 168,
  id: createUuid(),
  layer: "aboveUnits",
  rotation: 0,
  text: "Note",
  typography: createDefaultOrgEditorTypography({
    fontSize: 20,
    horizontalAlign: "center",
    verticalAlign: "middle",
  }),
  type: "sticker",
  width: 220,
  x: point.x - 110,
  y: point.y - 84,
});

export const createOrgEditorImageElement = ({
  dataUrl,
  intrinsicHeight,
  intrinsicWidth,
  point,
}: {
  dataUrl: string;
  intrinsicHeight: number;
  intrinsicWidth: number;
  point: OrgEditorCanvasPoint;
}): OrgEditorImageElement => {
  const scale = Math.min(1, 320 / Math.max(intrinsicWidth, intrinsicHeight));
  const { height, width } = normalizeOrgEditorCanvasDimensions({
    height: intrinsicHeight * scale,
    width: intrinsicWidth * scale,
  });
  return {
    attachment: null,
    dataUrl,
    height,
    id: createUuid(),
    intrinsicHeight,
    intrinsicWidth,
    layer: "aboveUnits",
    lockAspectRatio: true,
    rotation: 0,
    type: "image",
    width,
    x: point.x - width / 2,
    y: point.y - height / 2,
  };
};

export const createOrgEditorArrowElement = (
  start: OrgEditorCanvasPoint,
  end: OrgEditorCanvasPoint,
): OrgEditorArrowElement => {
  const dx = end.x - start.x;
  return {
    dash: "solid",
    end: { attachment: null, ...end },
    endControl: { x: -dx / 3, y: 0 },
    endMarker: "arrow",
    id: createUuid(),
    layer: "behindUnits",
    start: { attachment: null, ...start },
    startControl: { x: dx / 3, y: 0 },
    startMarker: "none",
    strokeColor: "#334155",
    strokeWidth: 2,
    type: "arrow",
  };
};

const clonePoint = (point: OrgEditorCanvasPoint): OrgEditorCanvasPoint => ({ ...point });

export const cloneOrgEditorAnchorRef = (ref: OrgEditorAnchorRef): OrgEditorAnchorRef => ({
  anchorId: ref.anchorId,
  owner: { ...ref.owner },
});

export const cloneOrgEditorCanvasElement = (
  element: OrgEditorCanvasElement,
): OrgEditorCanvasElement => {
  if (element.type === "arrow") {
    return {
      ...element,
      end: {
        ...element.end,
        attachment: element.end.attachment
          ? {
              offset: clonePoint(element.end.attachment.offset),
              target: cloneOrgEditorAnchorRef(element.end.attachment.target),
            }
          : null,
      },
      endControl: clonePoint(element.endControl),
      start: {
        ...element.start,
        attachment: element.start.attachment
          ? {
              offset: clonePoint(element.start.attachment.offset),
              target: cloneOrgEditorAnchorRef(element.start.attachment.target),
            }
          : null,
      },
      startControl: clonePoint(element.startControl),
    };
  }
  return {
    ...element,
    attachment: element.attachment
      ? {
          offset: clonePoint(element.attachment.offset),
          sourceAnchorId: element.attachment.sourceAnchorId,
          target: cloneOrgEditorAnchorRef(element.attachment.target),
        }
      : null,
    ...(element.type === "image"
      ? {}
      : {
          typography: { ...element.typography },
          formatRuns: element.formatRuns.map((run) => ({
            ...run,
            typography: { ...run.typography },
          })),
        }),
  } as OrgEditorCanvasElement;
};

export const detachOrgEditorCanvasElementTargets = (
  element: OrgEditorCanvasElement,
  shouldDetach: (target: OrgEditorAnchorRef) => boolean,
): OrgEditorCanvasElement => {
  if (element.type === "arrow") {
    const clone = cloneOrgEditorCanvasElement(element) as OrgEditorArrowElement;
    return {
      ...clone,
      end: {
        ...element.end,
        attachment:
          element.end.attachment && shouldDetach(element.end.attachment.target)
            ? null
            : element.end.attachment,
      },
      start: {
        ...element.start,
        attachment:
          element.start.attachment && shouldDetach(element.start.attachment.target)
            ? null
            : element.start.attachment,
      },
    };
  }
  const clone = cloneOrgEditorCanvasElement(element) as Exclude<
    OrgEditorCanvasElement,
    OrgEditorArrowElement
  >;
  return {
    ...clone,
    attachment:
      element.attachment && shouldDetach(element.attachment.target) ? null : element.attachment,
  };
};

export const isOrgEditorRectElement = (
  element: OrgEditorCanvasElement,
): element is OrgEditorImageElement | OrgEditorStickerElement | OrgEditorTextElement =>
  element.type !== "arrow";

export const normalizeOrgEditorRotation = (rotation: number) => {
  const normalized = ((((rotation + 180) % 360) + 360) % 360) - 180;
  return Object.is(normalized, -0) ? 0 : normalized;
};

const rotateVector = (point: OrgEditorCanvasPoint, rotation: number): OrgEditorCanvasPoint => {
  const radians = (rotation * Math.PI) / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  return {
    x: point.x * cosine - point.y * sine,
    y: point.x * sine + point.y * cosine,
  };
};

const getRectAnchorLocalPoint = (
  width: number,
  height: number,
  anchorId: OrgEditorRectAnchorId,
): OrgEditorCanvasPoint => {
  switch (anchorId) {
    case "topLeft":
      return { x: 0, y: 0 };
    case "topCenter":
      return { x: width / 2, y: 0 };
    case "topRight":
      return { x: width, y: 0 };
    case "rightCenter":
      return { x: width, y: height / 2 };
    case "bottomRight":
      return { x: width, y: height };
    case "bottomCenter":
      return { x: width / 2, y: height };
    case "bottomLeft":
      return { x: 0, y: height };
    case "leftCenter":
      return { x: 0, y: height / 2 };
    case "center":
      return { x: width / 2, y: height / 2 };
  }
};

export const getOrgEditorRectAnchorPoint = (
  element: Pick<
    OrgEditorImageElement | OrgEditorStickerElement | OrgEditorTextElement,
    "height" | "rotation" | "width" | "x" | "y"
  >,
  anchorId: OrgEditorRectAnchorId,
): OrgEditorCanvasPoint => {
  const center = { x: element.x + element.width / 2, y: element.y + element.height / 2 };
  const local = getRectAnchorLocalPoint(element.width, element.height, anchorId);
  const rotated = rotateVector(
    { x: local.x - element.width / 2, y: local.y - element.height / 2 },
    element.rotation,
  );
  return { x: center.x + rotated.x, y: center.y + rotated.y };
};

const placeRectAnchorAtPoint = <
  Element extends OrgEditorImageElement | OrgEditorStickerElement | OrgEditorTextElement,
>(
  element: Element,
  anchorId: OrgEditorRectAnchorId,
  point: OrgEditorCanvasPoint,
): Element => {
  const local = getRectAnchorLocalPoint(element.width, element.height, anchorId);
  const rotated = rotateVector(
    { x: local.x - element.width / 2, y: local.y - element.height / 2 },
    element.rotation,
  );
  return {
    ...element,
    x: point.x - element.width / 2 - rotated.x,
    y: point.y - element.height / 2 - rotated.y,
  };
};

const canvasResizeHandleEdges = (handle: OrgEditorCanvasResizeHandle) => ({
  bottom: handle === "bottomLeft" || handle === "bottomCenter" || handle === "bottomRight",
  left: handle === "topLeft" || handle === "leftCenter" || handle === "bottomLeft",
  right: handle === "topRight" || handle === "rightCenter" || handle === "bottomRight",
  top: handle === "topLeft" || handle === "topCenter" || handle === "topRight",
});

/** Resolves an axis-aligned resize while keeping the opposite edge or corner stationary. */
export const getOrgEditorCanvasResizeBounds = ({
  handle,
  lockAspectRatio = false,
  pointer,
  sourceBounds,
}: {
  handle: OrgEditorCanvasResizeHandle;
  lockAspectRatio?: boolean;
  pointer: OrgEditorCanvasPoint;
  sourceBounds: OrgEditorCanvasRect;
}): OrgEditorCanvasRect => {
  const edges = canvasResizeHandleEdges(handle);
  const sourceRight = sourceBounds.x + sourceBounds.width;
  const sourceBottom = sourceBounds.y + sourceBounds.height;
  let left = edges.left
    ? Math.min(pointer.x, sourceRight - ORG_EDITOR_CANVAS_MIN_RECT_SIZE)
    : sourceBounds.x;
  let right = edges.right
    ? Math.max(pointer.x, sourceBounds.x + ORG_EDITOR_CANVAS_MIN_RECT_SIZE)
    : sourceRight;
  let top = edges.top
    ? Math.min(pointer.y, sourceBottom - ORG_EDITOR_CANVAS_MIN_RECT_SIZE)
    : sourceBounds.y;
  let bottom = edges.bottom
    ? Math.max(pointer.y, sourceBounds.y + ORG_EDITOR_CANVAS_MIN_RECT_SIZE)
    : sourceBottom;

  let width = Math.min(ORG_EDITOR_CANVAS_MAX_RECT_SIZE, right - left);
  let height = Math.min(ORG_EDITOR_CANVAS_MAX_RECT_SIZE, bottom - top);
  if (lockAspectRatio) {
    const scaleX = width / Math.max(1e-6, sourceBounds.width);
    const scaleY = height / Math.max(1e-6, sourceBounds.height);
    const changesX = edges.left || edges.right;
    const changesY = edges.top || edges.bottom;
    const requestedScale =
      changesX && !changesY
        ? scaleX
        : changesY && !changesX
          ? scaleY
          : Math.abs(scaleX - 1) >= Math.abs(scaleY - 1)
            ? scaleX
            : scaleY;
    const minimumScale = Math.max(
      ORG_EDITOR_CANVAS_MIN_RECT_SIZE / Math.max(1e-6, sourceBounds.width),
      ORG_EDITOR_CANVAS_MIN_RECT_SIZE / Math.max(1e-6, sourceBounds.height),
    );
    const maximumScale = Math.min(
      ORG_EDITOR_CANVAS_MAX_RECT_SIZE / Math.max(1e-6, sourceBounds.width),
      ORG_EDITOR_CANVAS_MAX_RECT_SIZE / Math.max(1e-6, sourceBounds.height),
    );
    const scale = Math.min(maximumScale, Math.max(minimumScale, requestedScale));
    width = sourceBounds.width * scale;
    height = sourceBounds.height * scale;
  }

  ({ height, width } = normalizeOrgEditorCanvasDimensions({ height, width }));

  if (edges.left) left = sourceRight - width;
  else if (edges.right) right = sourceBounds.x + width;
  else left = sourceBounds.x + (sourceBounds.width - width) / 2;
  right = left + width;

  if (edges.top) top = sourceBottom - height;
  else if (edges.bottom) bottom = sourceBounds.y + height;
  else top = sourceBounds.y + (sourceBounds.height - height) / 2;
  bottom = top + height;

  return { height, width, x: left, y: top };
};

/** Resizes one rotated rectangular element in its local axes. */
export const resizeOrgEditorCanvasRectElement = <
  Element extends OrgEditorImageElement | OrgEditorStickerElement | OrgEditorTextElement,
>(
  element: Element,
  handle: OrgEditorCanvasResizeHandle,
  pointer: OrgEditorCanvasPoint,
  preserveAspectRatio = false,
): Element => {
  const sourceCenter = { x: element.x + element.width / 2, y: element.y + element.height / 2 };
  const localPointerDelta = rotateVector(
    { x: pointer.x - sourceCenter.x, y: pointer.y - sourceCenter.y },
    -element.rotation,
  );
  const targetBounds = getOrgEditorCanvasResizeBounds({
    handle,
    lockAspectRatio: element.type === "image" && preserveAspectRatio,
    pointer: {
      x: sourceCenter.x + localPointerDelta.x,
      y: sourceCenter.y + localPointerDelta.y,
    },
    sourceBounds: {
      height: element.height,
      width: element.width,
      x: sourceCenter.x - element.width / 2,
      y: sourceCenter.y - element.height / 2,
    },
  });
  const targetLocalCenter = {
    x: targetBounds.x + targetBounds.width / 2,
    y: targetBounds.y + targetBounds.height / 2,
  };
  const centerDelta = rotateVector(
    { x: targetLocalCenter.x - sourceCenter.x, y: targetLocalCenter.y - sourceCenter.y },
    element.rotation,
  );
  const targetCenter = { x: sourceCenter.x + centerDelta.x, y: sourceCenter.y + centerDelta.y };
  const resized = {
    ...cloneOrgEditorCanvasElement(element),
    height: targetBounds.height,
    width: targetBounds.width,
    x: targetCenter.x - targetBounds.width / 2,
    y: targetCenter.y - targetBounds.height / 2,
    ...(element.type === "text" ? { autoWidth: false } : {}),
  } as Element;

  if (!element.attachment) return resized;
  const previousAnchor = getOrgEditorRectAnchorPoint(element, element.attachment.sourceAnchorId);
  const nextAnchor = getOrgEditorRectAnchorPoint(resized, element.attachment.sourceAnchorId);
  return {
    ...resized,
    attachment: {
      ...element.attachment,
      offset: {
        x: element.attachment.offset.x + nextAnchor.x - previousAnchor.x,
        y: element.attachment.offset.y + nextAnchor.y - previousAnchor.y,
      },
    },
  };
};

export const getOrgEditorCanvasOppositeResizeAnchor = (
  handle: OrgEditorCanvasResizeHandle,
): OrgEditorRectAnchorId => {
  const opposite: Record<OrgEditorCanvasResizeHandle, OrgEditorRectAnchorId> = {
    bottomCenter: "topCenter",
    bottomLeft: "topRight",
    bottomRight: "topLeft",
    leftCenter: "rightCenter",
    rightCenter: "leftCenter",
    topCenter: "bottomCenter",
    topLeft: "bottomRight",
    topRight: "bottomLeft",
  };
  return opposite[handle];
};

/** Rotates one rectangle around its live center while keeping an attachment from moving it. */
export const rotateOrgEditorCanvasRectElementAroundCenter = <
  Element extends OrgEditorImageElement | OrgEditorStickerElement | OrgEditorTextElement,
>(
  element: Element,
  rotationDelta: number,
): Element => {
  const rotated = {
    ...cloneOrgEditorCanvasElement(element),
    rotation: normalizeOrgEditorRotation(element.rotation + rotationDelta),
  } as Element;

  if (!element.attachment) return rotated;
  const previousAnchor = getOrgEditorRectAnchorPoint(element, element.attachment.sourceAnchorId);
  const nextAnchor = getOrgEditorRectAnchorPoint(rotated, element.attachment.sourceAnchorId);
  return {
    ...rotated,
    attachment: {
      ...element.attachment,
      offset: {
        x: element.attachment.offset.x + nextAnchor.x - previousAnchor.x,
        y: element.attachment.offset.y + nextAnchor.y - previousAnchor.y,
      },
    },
  };
};

export const getOrgEditorCanvasRotationDelta = (
  bounds: OrgEditorCanvasRect,
  start: OrgEditorCanvasPoint,
  current: OrgEditorCanvasPoint,
) => {
  const center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
  const startAngle = Math.atan2(start.y - center.y, start.x - center.x);
  const currentAngle = Math.atan2(current.y - center.y, current.x - center.x);
  return ((currentAngle - startAngle) * 180) / Math.PI;
};

const getCubicPoint = (
  start: OrgEditorCanvasPoint,
  control1: OrgEditorCanvasPoint,
  control2: OrgEditorCanvasPoint,
  end: OrgEditorCanvasPoint,
  t: number,
) => {
  const inverse = 1 - t;
  const a = inverse ** 3;
  const b = 3 * inverse ** 2 * t;
  const c = 3 * inverse * t ** 2;
  const d = t ** 3;
  return {
    x: a * start.x + b * control1.x + c * control2.x + d * end.x,
    y: a * start.y + b * control1.y + c * control2.y + d * end.y,
  };
};

export const getOrgEditorArrowControlPoints = (arrow: OrgEditorArrowElement) => ({
  control1: {
    x: arrow.start.x + arrow.startControl.x,
    y: arrow.start.y + arrow.startControl.y,
  },
  control2: {
    x: arrow.end.x + arrow.endControl.x,
    y: arrow.end.y + arrow.endControl.y,
  },
});

const getArrowChordFrame = (start: OrgEditorCanvasPoint, end: OrgEditorCanvasPoint) => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  if (length < 1e-6) return null;
  return {
    length,
    normalX: -dy / length,
    normalY: dx / length,
    unitX: dx / length,
    unitY: dy / length,
  };
};

/** Rebuilds a cubic in a new chord frame without changing its normalized shape. */
export const projectOrgEditorArrowToEndpoints = (
  arrow: OrgEditorArrowElement,
  start: OrgEditorArrowEndpoint,
  end: OrgEditorArrowEndpoint,
): OrgEditorArrowElement => {
  const sourceFrame = getArrowChordFrame(arrow.start, arrow.end);
  const targetFrame = getArrowChordFrame(start, end);
  if (!sourceFrame || !targetFrame) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    return {
      ...(cloneOrgEditorCanvasElement(arrow) as OrgEditorArrowElement),
      end: { ...end },
      endControl: { x: -dx / 3, y: -dy / 3 },
      start: { ...start },
      startControl: { x: dx / 3, y: dy / 3 },
    };
  }
  const { control1, control2 } = getOrgEditorArrowControlPoints(arrow);
  const normalizeControl = (control: OrgEditorCanvasPoint) => {
    const offsetX = control.x - arrow.start.x;
    const offsetY = control.y - arrow.start.y;
    return {
      longitudinal:
        (offsetX * sourceFrame.unitX + offsetY * sourceFrame.unitY) / sourceFrame.length,
      normal: (offsetX * sourceFrame.normalX + offsetY * sourceFrame.normalY) / sourceFrame.length,
    };
  };
  const rebuildControl = (control: ReturnType<typeof normalizeControl>) => ({
    x:
      start.x +
      targetFrame.length *
        (control.longitudinal * targetFrame.unitX + control.normal * targetFrame.normalX),
    y:
      start.y +
      targetFrame.length *
        (control.longitudinal * targetFrame.unitY + control.normal * targetFrame.normalY),
  });
  const nextControl1 = rebuildControl(normalizeControl(control1));
  const nextControl2 = rebuildControl(normalizeControl(control2));
  return {
    ...(cloneOrgEditorCanvasElement(arrow) as OrgEditorArrowElement),
    end: { ...end },
    endControl: { x: nextControl2.x - end.x, y: nextControl2.y - end.y },
    start: { ...start },
    startControl: { x: nextControl1.x - start.x, y: nextControl1.y - start.y },
  };
};

export const moveOrgEditorArrowEndpointPreservingShape = (
  arrow: OrgEditorArrowElement,
  endpoint: "end" | "start",
  point: OrgEditorCanvasPoint,
) =>
  projectOrgEditorArrowToEndpoints(
    arrow,
    endpoint === "start" ? { ...arrow.start, ...point } : arrow.start,
    endpoint === "end" ? { ...arrow.end, ...point } : arrow.end,
  );

const getCubicExtrema = (p0: number, p1: number, p2: number, p3: number) => {
  const a = -p0 + 3 * p1 - 3 * p2 + p3;
  const b = 2 * (p0 - 2 * p1 + p2);
  const c = p1 - p0;
  if (Math.abs(a) < 1e-9) return Math.abs(b) < 1e-9 ? [] : [-c / b];
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return [];
  const root = Math.sqrt(discriminant);
  return [(-b + root) / (2 * a), (-b - root) / (2 * a)];
};

export const getOrgEditorCanvasElementAnchorPoint = (
  element: OrgEditorCanvasElement,
  anchorId: string,
): OrgEditorCanvasPoint | null => {
  if (element.type !== "arrow") {
    return ORG_EDITOR_RECT_ANCHOR_IDS.includes(anchorId as OrgEditorRectAnchorId)
      ? getOrgEditorRectAnchorPoint(element, anchorId as OrgEditorRectAnchorId)
      : null;
  }
  if (anchorId === "start") return { x: element.start.x, y: element.start.y };
  if (anchorId === "end") return { x: element.end.x, y: element.end.y };
  if (anchorId !== "middle") return null;
  const { control1, control2 } = getOrgEditorArrowControlPoints(element);
  return getCubicPoint(element.start, control1, control2, element.end, 0.5);
};

export const getOrgEditorCanvasElementBounds = (
  element: OrgEditorCanvasElement,
): OrgEditorCanvasRect => {
  if (element.type !== "arrow") {
    const points = ["topLeft", "topRight", "bottomLeft", "bottomRight"].map((anchorId) =>
      getOrgEditorRectAnchorPoint(element, anchorId as OrgEditorRectAnchorId),
    );
    const minX = Math.min(...points.map((point) => point.x));
    const minY = Math.min(...points.map((point) => point.y));
    const maxX = Math.max(...points.map((point) => point.x));
    const maxY = Math.max(...points.map((point) => point.y));
    return { height: maxY - minY, width: maxX - minX, x: minX, y: minY };
  }
  const { control1, control2 } = getOrgEditorArrowControlPoints(element);
  const times = new Set([0, 1]);
  for (const t of [
    ...getCubicExtrema(element.start.x, control1.x, control2.x, element.end.x),
    ...getCubicExtrema(element.start.y, control1.y, control2.y, element.end.y),
  ]) {
    if (t > 0 && t < 1) times.add(t);
  }
  const points = [...times].map((t) =>
    getCubicPoint(element.start, control1, control2, element.end, t),
  );
  const markerPadding = Math.max(element.strokeWidth * 5, element.strokeWidth / 2);
  const minX = Math.min(...points.map((point) => point.x)) - markerPadding;
  const minY = Math.min(...points.map((point) => point.y)) - markerPadding;
  const maxX = Math.max(...points.map((point) => point.x)) + markerPadding;
  const maxY = Math.max(...points.map((point) => point.y)) + markerPadding;
  return { height: maxY - minY, width: maxX - minX, x: minX, y: minY };
};

export const getOrgEditorCanvasElementsBounds = (
  elements: readonly OrgEditorCanvasElement[],
): OrgEditorCanvasRect | null => {
  if (elements.length === 0) return null;
  const bounds = elements.map(getOrgEditorCanvasElementBounds);
  const x = Math.min(...bounds.map((rect) => rect.x));
  const y = Math.min(...bounds.map((rect) => rect.y));
  const right = Math.max(...bounds.map((rect) => rect.x + rect.width));
  const bottom = Math.max(...bounds.map((rect) => rect.y + rect.height));
  return { height: bottom - y, width: right - x, x, y };
};

export const getOrgEditorCanvasElementTargetIds = (element: OrgEditorCanvasElement) => {
  const refs =
    element.type === "arrow"
      ? [element.start.attachment?.target, element.end.attachment?.target]
      : [element.attachment?.target];
  return refs.flatMap((ref) => (ref?.owner.type === "element" ? [ref.owner.elementId] : []));
};

const getOrgEditorCanvasElementTargetRefs = (element: OrgEditorCanvasElement) =>
  element.type === "arrow"
    ? [element.start.attachment?.target, element.end.attachment?.target]
    : [element.attachment?.target];

export const createOrgEditorCanvasDependencyIndexes = (
  elements: readonly OrgEditorCanvasElement[],
) => {
  const dependenciesByElementId = new Map<
    OrgEditorCanvasElementId,
    Set<OrgEditorCanvasElementId>
  >();
  const dependentsByElementId = new Map<OrgEditorCanvasElementId, Set<OrgEditorCanvasElementId>>();
  const dependentsByUnitId = new Map<OrgEditorUnitId, Set<OrgEditorCanvasElementId>>();
  for (const element of elements) {
    const dependencies = new Set(getOrgEditorCanvasElementTargetIds(element));
    dependenciesByElementId.set(element.id, dependencies);
    for (const dependencyId of dependencies) {
      const dependents = dependentsByElementId.get(dependencyId) ?? new Set();
      dependents.add(element.id);
      dependentsByElementId.set(dependencyId, dependents);
    }
    for (const ref of getOrgEditorCanvasElementTargetRefs(element)) {
      if (!ref || ref.owner.type === "element") continue;
      const dependents = dependentsByUnitId.get(ref.owner.unitId) ?? new Set();
      dependents.add(element.id);
      dependentsByUnitId.set(ref.owner.unitId, dependents);
    }
  }
  return { dependenciesByElementId, dependentsByElementId, dependentsByUnitId };
};

export const getOrgEditorCanvasDependentClosure = (
  initialElementIds: Iterable<OrgEditorCanvasElementId>,
  dependentsByElementId: ReadonlyMap<
    OrgEditorCanvasElementId,
    ReadonlySet<OrgEditorCanvasElementId>
  >,
) => {
  const closure = new Set(initialElementIds);
  const pending = [...closure];
  while (pending.length > 0) {
    const elementId = pending.pop();
    if (!elementId) continue;
    for (const dependentId of dependentsByElementId.get(elementId) ?? []) {
      if (closure.has(dependentId)) continue;
      closure.add(dependentId);
      pending.push(dependentId);
    }
  }
  return closure;
};

export const hasOrgEditorCanvasElementDependencyCycle = (
  elements: readonly OrgEditorCanvasElement[],
) => {
  const elementById = new Map(elements.map((element) => [element.id, element] as const));
  const visiting = new Set<OrgEditorCanvasElementId>();
  const visited = new Set<OrgEditorCanvasElementId>();
  const visit = (elementId: OrgEditorCanvasElementId): boolean => {
    if (visiting.has(elementId)) return true;
    if (visited.has(elementId)) return false;
    visiting.add(elementId);
    const element = elementById.get(elementId);
    if (element) {
      for (const targetId of getOrgEditorCanvasElementTargetIds(element)) {
        if (targetId === elementId || visit(targetId)) return true;
      }
    }
    visiting.delete(elementId);
    visited.add(elementId);
    return false;
  };
  return elements.some((element) => visit(element.id));
};

const resolveOrgEditorCanvasElementSources = ({
  elementIds,
  fallbackResolvedById,
  resolveExternalAnchor,
  sourceById,
}: {
  elementIds: Iterable<OrgEditorCanvasElementId>;
  fallbackResolvedById: ReadonlyMap<OrgEditorCanvasElementId, ResolvedOrgEditorCanvasElement>;
  resolveExternalAnchor: (ref: OrgEditorAnchorRef) => OrgEditorCanvasPoint | null;
  sourceById: ReadonlyMap<OrgEditorCanvasElementId, OrgEditorCanvasElement>;
}) => {
  const resolvedById = new Map<OrgEditorCanvasElementId, ResolvedOrgEditorCanvasElement>();
  const resolving = new Set<OrgEditorCanvasElementId>();

  const resolveRef = (ref: OrgEditorAnchorRef): OrgEditorCanvasPoint | null => {
    if (ref.owner.type !== "element") return resolveExternalAnchor(ref);
    const target =
      (sourceById.has(ref.owner.elementId)
        ? resolveElement(ref.owner.elementId)
        : fallbackResolvedById.get(ref.owner.elementId)
      )?.element ?? null;
    return target ? getOrgEditorCanvasElementAnchorPoint(target, ref.anchorId) : null;
  };

  const resolveElement = (
    elementId: OrgEditorCanvasElementId,
  ): ResolvedOrgEditorCanvasElement | null => {
    const cached = resolvedById.get(elementId);
    if (cached) return cached;
    const source = sourceById.get(elementId);
    if (!source || resolving.has(elementId)) return null;
    resolving.add(elementId);
    let element = cloneOrgEditorCanvasElement(source);
    if (element.type === "arrow") {
      const resolveEndpoint = (endpoint: OrgEditorArrowEndpoint) => {
        if (!endpoint.attachment) return endpoint;
        const target = resolveRef(endpoint.attachment.target);
        return target
          ? {
              ...endpoint,
              x: target.x + endpoint.attachment.offset.x,
              y: target.y + endpoint.attachment.offset.y,
            }
          : endpoint;
      };
      element = projectOrgEditorArrowToEndpoints(
        element,
        resolveEndpoint(element.start),
        resolveEndpoint(element.end),
      );
    } else if (element.attachment) {
      const target = resolveRef(element.attachment.target);
      if (target) {
        element = placeRectAnchorAtPoint(element, element.attachment.sourceAnchorId, {
          x: target.x + element.attachment.offset.x,
          y: target.y + element.attachment.offset.y,
        });
      }
    }
    resolving.delete(elementId);
    const resolved = { bounds: getOrgEditorCanvasElementBounds(element), element };
    resolvedById.set(elementId, resolved);
    return resolved;
  };

  for (const elementId of elementIds) resolveElement(elementId);
  return resolvedById;
};

export const resolveOrgEditorCanvasElements = ({
  elements,
  resolveExternalAnchor,
}: {
  elements: readonly OrgEditorCanvasElement[];
  resolveExternalAnchor: (ref: OrgEditorAnchorRef) => OrgEditorCanvasPoint | null;
}) => {
  const sourceById = new Map(elements.map((element) => [element.id, element] as const));
  return resolveOrgEditorCanvasElementSources({
    elementIds: sourceById.keys(),
    fallbackResolvedById: new Map(),
    resolveExternalAnchor,
    sourceById,
  });
};

export const resolveOrgEditorCanvasElementSubset = ({
  elements,
  fallbackResolvedById,
  resolveExternalAnchor,
}: {
  elements: readonly OrgEditorCanvasElement[];
  fallbackResolvedById: ReadonlyMap<OrgEditorCanvasElementId, ResolvedOrgEditorCanvasElement>;
  resolveExternalAnchor: (ref: OrgEditorAnchorRef) => OrgEditorCanvasPoint | null;
}) => {
  const sourceById = new Map(elements.map((element) => [element.id, element] as const));
  return resolveOrgEditorCanvasElementSources({
    elementIds: sourceById.keys(),
    fallbackResolvedById,
    resolveExternalAnchor,
    sourceById,
  });
};

const anchorOwnerKey = (ref: OrgEditorAnchorRef) => {
  switch (ref.owner.type) {
    case "unit":
      return `unit:${ref.owner.unitId}`;
    case "employee":
      return `employee:${ref.owner.unitId}:${ref.owner.employeeId}`;
    case "openPosition":
      return `openPosition:${ref.owner.unitId}:${ref.owner.openPositionId}`;
    case "element":
      return `element:${ref.owner.elementId}`;
  }
};

export const getOrgEditorScopedCanvasElementIds = ({
  elements,
  ownerKeys,
}: {
  elements: readonly OrgEditorCanvasElement[];
  ownerKeys: ReadonlySet<string>;
}) => {
  const includedOwnerKeys = new Set(ownerKeys);
  const includedIds = new Set<OrgEditorCanvasElementId>();
  let changed = true;
  while (changed) {
    changed = false;
    for (const element of elements) {
      if (includedIds.has(element.id)) continue;
      const refs = getOrgEditorCanvasElementTargetRefs(element);
      const canInclude =
        element.type === "arrow"
          ? refs.every((ref) => ref && includedOwnerKeys.has(anchorOwnerKey(ref)))
          : Boolean(refs[0] && includedOwnerKeys.has(anchorOwnerKey(refs[0])));
      if (!canInclude) continue;
      includedIds.add(element.id);
      includedOwnerKeys.add(`element:${element.id}`);
      changed = true;
    }
  }
  return includedIds;
};

export const moveOrgEditorCanvasElement = (
  element: OrgEditorCanvasElement,
  delta: OrgEditorCanvasPoint,
  shouldTranslateAttachment: (target: OrgEditorAnchorRef) => boolean = () => true,
): OrgEditorCanvasElement => {
  if (element.type === "arrow") {
    return {
      ...cloneOrgEditorCanvasElement(element),
      end: {
        ...element.end,
        x: element.end.x + delta.x,
        y: element.end.y + delta.y,
        attachment: element.end.attachment
          ? {
              ...element.end.attachment,
              offset: {
                x:
                  element.end.attachment.offset.x +
                  (shouldTranslateAttachment(element.end.attachment.target) ? delta.x : 0),
                y:
                  element.end.attachment.offset.y +
                  (shouldTranslateAttachment(element.end.attachment.target) ? delta.y : 0),
              },
            }
          : null,
      },
      start: {
        ...element.start,
        x: element.start.x + delta.x,
        y: element.start.y + delta.y,
        attachment: element.start.attachment
          ? {
              ...element.start.attachment,
              offset: {
                x:
                  element.start.attachment.offset.x +
                  (shouldTranslateAttachment(element.start.attachment.target) ? delta.x : 0),
                y:
                  element.start.attachment.offset.y +
                  (shouldTranslateAttachment(element.start.attachment.target) ? delta.y : 0),
              },
            }
          : null,
      },
    } as OrgEditorArrowElement;
  }
  return {
    ...cloneOrgEditorCanvasElement(element),
    attachment: element.attachment
      ? {
          ...element.attachment,
          offset: {
            x:
              element.attachment.offset.x +
              (shouldTranslateAttachment(element.attachment.target) ? delta.x : 0),
            y:
              element.attachment.offset.y +
              (shouldTranslateAttachment(element.attachment.target) ? delta.y : 0),
          },
        }
      : null,
    x: element.x + delta.x,
    y: element.y + delta.y,
  } as Exclude<OrgEditorCanvasElement, OrgEditorArrowElement>;
};

const transformPointAround = (
  point: OrgEditorCanvasPoint,
  sourceBounds: OrgEditorCanvasRect,
  targetBounds: OrgEditorCanvasRect,
  rotation: number,
) => {
  const sourceCenter = {
    x: sourceBounds.x + sourceBounds.width / 2,
    y: sourceBounds.y + sourceBounds.height / 2,
  };
  const targetCenter = {
    x: targetBounds.x + targetBounds.width / 2,
    y: targetBounds.y + targetBounds.height / 2,
  };
  const scaled = {
    x: ((point.x - sourceCenter.x) / Math.max(1e-6, sourceBounds.width)) * targetBounds.width,
    y: ((point.y - sourceCenter.y) / Math.max(1e-6, sourceBounds.height)) * targetBounds.height,
  };
  const rotated = rotateVector(scaled, rotation);
  return { x: targetCenter.x + rotated.x, y: targetCenter.y + rotated.y };
};

/** Applies one affine group gesture to rectangles and cubic Arrow geometry. */
export const transformOrgEditorCanvasElements = ({
  elements,
  measureText = (value, typography) => [...value].length * typography.fontSize * 0.55,
  rotation = 0,
  sourceBounds,
  targetBounds,
}: {
  elements: readonly OrgEditorCanvasElement[];
  measureText?: (text: string, typography: OrgEditorInlineTypography) => number;
  rotation?: number;
  sourceBounds: OrgEditorCanvasRect;
  targetBounds: OrgEditorCanvasRect;
}) =>
  elements.map((source): OrgEditorCanvasElement => {
    const transformOffset = (offset: OrgEditorCanvasPoint) =>
      rotateVector(
        {
          x: (offset.x / Math.max(1e-6, sourceBounds.width)) * targetBounds.width,
          y: (offset.y / Math.max(1e-6, sourceBounds.height)) * targetBounds.height,
        },
        rotation,
      );
    if (source.type === "arrow") {
      const clone = cloneOrgEditorCanvasElement(source) as OrgEditorArrowElement;
      const controlPoints = getOrgEditorArrowControlPoints(source);
      const start = transformPointAround(source.start, sourceBounds, targetBounds, rotation);
      const end = transformPointAround(source.end, sourceBounds, targetBounds, rotation);
      const control1 = transformPointAround(
        controlPoints.control1,
        sourceBounds,
        targetBounds,
        rotation,
      );
      const control2 = transformPointAround(
        controlPoints.control2,
        sourceBounds,
        targetBounds,
        rotation,
      );
      return {
        ...clone,
        end: {
          ...source.end,
          ...end,
          attachment: source.end.attachment
            ? { ...source.end.attachment, offset: transformOffset(source.end.attachment.offset) }
            : null,
        },
        endControl: { x: control2.x - end.x, y: control2.y - end.y },
        start: {
          ...source.start,
          ...start,
          attachment: source.start.attachment
            ? {
                ...source.start.attachment,
                offset: transformOffset(source.start.attachment.offset),
              }
            : null,
        },
        startControl: { x: control1.x - start.x, y: control1.y - start.y },
      } as OrgEditorArrowElement;
    }

    const center = transformPointAround(
      { x: source.x + source.width / 2, y: source.y + source.height / 2 },
      sourceBounds,
      targetBounds,
      rotation,
    );
    const scaleX = targetBounds.width / Math.max(1e-6, sourceBounds.width);
    const scaleY = targetBounds.height / Math.max(1e-6, sourceBounds.height);
    const idealWidth = source.width * scaleX;
    const idealHeight = source.height * scaleY;
    const { height, width } = normalizeOrgEditorCanvasDimensions({
      height: idealHeight,
      width: idealWidth,
    });
    const rotationValue = normalizeOrgEditorRotation(source.rotation + rotation);
    const attachment = source.attachment
      ? { ...source.attachment, offset: transformOffset(source.attachment.offset) }
      : null;
    let transformed = {
      ...cloneOrgEditorCanvasElement(source),
      attachment,
      height,
      rotation: rotationValue,
      width,
      x: center.x - width / 2,
      y: center.y - height / 2,
    } as Exclude<OrgEditorCanvasElement, OrgEditorArrowElement>;

    if (transformed.type === "text" && source.type === "text") {
      const scaleFontSize = (fontSize: number) =>
        Math.min(
          ORG_EDITOR_CANVAS_MAX_FONT_SIZE,
          Math.max(ORG_EDITOR_CANVAS_MIN_FONT_SIZE, fontSize * Math.abs(scaleY)),
        );
      const textWithScaledTypography: OrgEditorTextElement = {
        ...transformed,
        autoWidth: false,
        formatRuns: transformed.formatRuns.map((run) => ({
          ...run,
          typography: {
            ...run.typography,
            fontSize: scaleFontSize(run.typography.fontSize),
          },
        })),
        typography: {
          ...transformed.typography,
          fontSize: scaleFontSize(transformed.typography.fontSize),
          verticalAlign: "top",
        },
        width: Math.max(ORG_EDITOR_CANVAS_MIN_TEXT_WIDTH, width),
      };
      const fitted = fitOrgEditorCanvasRichTextElement(textWithScaledTypography, measureText);
      transformed = moveOrgEditorCanvasElement(fitted, {
        x: center.x - fitted.width / 2 - fitted.x,
        y: center.y - fitted.height / 2 - fitted.y,
      }) as OrgEditorTextElement;
    }

    const transformedAttachment = transformed.attachment;
    if (!transformedAttachment || (height === idealHeight && width === idealWidth)) {
      return transformed;
    }

    const ideal = {
      ...transformed,
      height: idealHeight,
      width: idealWidth,
      x: center.x - idealWidth / 2,
      y: center.y - idealHeight / 2,
    };
    const idealAnchor = getOrgEditorRectAnchorPoint(ideal, transformedAttachment.sourceAnchorId);
    const roundedAnchor = getOrgEditorRectAnchorPoint(
      transformed,
      transformedAttachment.sourceAnchorId,
    );
    return {
      ...transformed,
      attachment: {
        ...transformedAttachment,
        offset: {
          x: transformedAttachment.offset.x + roundedAnchor.x - idealAnchor.x,
          y: transformedAttachment.offset.y + roundedAnchor.y - idealAnchor.y,
        },
      },
    };
  });

export const createOrgEditorCanvasElementKey = (elementId: OrgEditorCanvasElementId) =>
  `element:${elementId}`;

export const remapOrgEditorAnchorRef = (
  ref: OrgEditorAnchorRef,
  unitIdMap: ReadonlyMap<string, string>,
  elementIdMap: ReadonlyMap<string, string>,
  preserveExternal: boolean,
  openPositionIdMap: ReadonlyMap<string, string> = new Map(),
): OrgEditorAnchorRef | null => {
  if (ref.owner.type === "unit") {
    const unitId = unitIdMap.get(ref.owner.unitId);
    return unitId
      ? { ...ref, owner: { type: "unit", unitId } }
      : preserveExternal
        ? cloneOrgEditorAnchorRef(ref)
        : null;
  }
  if (ref.owner.type === "employee") {
    const unitId = unitIdMap.get(ref.owner.unitId);
    return unitId
      ? { ...ref, owner: { ...ref.owner, unitId } }
      : preserveExternal
        ? cloneOrgEditorAnchorRef(ref)
        : null;
  }
  if (ref.owner.type === "openPosition") {
    const unitId = unitIdMap.get(ref.owner.unitId);
    const openPositionId = openPositionIdMap.get(ref.owner.openPositionId);
    return unitId && openPositionId
      ? { ...ref, owner: { openPositionId, type: "openPosition", unitId } }
      : preserveExternal
        ? cloneOrgEditorAnchorRef(ref)
        : null;
  }
  const elementId = elementIdMap.get(ref.owner.elementId);
  return elementId
    ? { ...ref, owner: { elementId, type: "element" } }
    : preserveExternal
      ? cloneOrgEditorAnchorRef(ref)
      : null;
};

export type OrgEditorTextGrapheme = {
  end: number;
  start: number;
  text: string;
};

export const getOrgEditorTextGraphemes = (text: string): OrgEditorTextGrapheme[] => {
  const segmenter =
    typeof Intl.Segmenter === "function"
      ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
      : null;
  if (segmenter) {
    return [...segmenter.segment(text)].map(({ index, segment }) => ({
      end: index + segment.length,
      start: index,
      text: segment,
    }));
  }
  const result: OrgEditorTextGrapheme[] = [];
  let index = 0;
  for (const segment of [...text]) {
    result.push({ end: index + segment.length, start: index, text: segment });
    index += segment.length;
  }
  return result;
};

export const getOrgEditorTextGraphemeBoundaries = (text: string) =>
  new Set([0, ...getOrgEditorTextGraphemes(text).map((segment) => segment.end)]);

const areInlineTypographiesEqual = (
  first: OrgEditorInlineTypography,
  second: OrgEditorInlineTypography,
) =>
  first.color === second.color &&
  first.fontFamily === second.fontFamily &&
  first.fontSize === second.fontSize &&
  first.fontWeight === second.fontWeight;

export const getOrgEditorTextStyleAt = (
  baseTypography: OrgEditorInlineTypography,
  formatRuns: readonly OrgEditorTextFormatRun[],
  index: number,
) => formatRuns.find((run) => run.start <= index && index < run.end)?.typography ?? baseTypography;

export const isOrgEditorTextFormatRunSequence = (
  text: string,
  formatRuns: readonly OrgEditorTextFormatRun[],
) => {
  const boundaries = getOrgEditorTextGraphemeBoundaries(text);
  let previousEnd = 0;
  for (const run of formatRuns) {
    if (
      !Number.isInteger(run.start) ||
      !Number.isInteger(run.end) ||
      run.start < previousEnd ||
      run.start >= run.end ||
      run.end > text.length ||
      !boundaries.has(run.start) ||
      !boundaries.has(run.end)
    ) {
      return false;
    }
    previousEnd = run.end;
  }
  return true;
};

const createCanonicalTextRuns = (
  chunks: Array<{ end: number; start: number; typography: OrgEditorInlineTypography }>,
  baseTypography: OrgEditorInlineTypography,
) => {
  const runs: OrgEditorTextFormatRun[] = [];
  for (const chunk of chunks) {
    const typography = resolveOrgEditorCanvasInlineTypography(chunk.typography);
    if (chunk.start >= chunk.end || areInlineTypographiesEqual(typography, baseTypography))
      continue;
    const previous = runs.at(-1);
    if (
      previous &&
      previous.end === chunk.start &&
      areInlineTypographiesEqual(previous.typography, typography)
    ) {
      previous.end = chunk.end;
      continue;
    }
    runs.push({ ...chunk, typography });
  }
  return runs;
};

export const normalizeOrgEditorTextFormatRuns = (
  text: string,
  typography: OrgEditorTypography,
  formatRuns: readonly OrgEditorTextFormatRun[],
) => {
  if (!isOrgEditorTextFormatRunSequence(text, formatRuns)) return [];
  return createCanonicalTextRuns(
    formatRuns.map((run) => ({ ...run, typography: run.typography })),
    resolveOrgEditorCanvasInlineTypography(getOrgEditorInlineTypography(typography)),
  );
};

const normalizeTextRange = (text: string, start: number, end: number) => {
  const boundaries = [...getOrgEditorTextGraphemeBoundaries(text)].sort((a, b) => a - b);
  const clampedStart = Math.max(0, Math.min(text.length, Math.min(start, end)));
  const clampedEnd = Math.max(0, Math.min(text.length, Math.max(start, end)));
  return {
    end: boundaries.find((boundary) => boundary >= clampedEnd) ?? text.length,
    start: [...boundaries].reverse().find((boundary) => boundary <= clampedStart) ?? 0,
  };
};

export const applyOrgEditorTextFormat = ({
  end,
  formatRuns,
  patch,
  start,
  text,
  typography,
}: {
  end: number;
  formatRuns: readonly OrgEditorTextFormatRun[];
  patch: Partial<OrgEditorInlineTypography>;
  start: number;
  text: string;
  typography: OrgEditorTypography;
}) => {
  const range = normalizeTextRange(text, start, end);
  if (range.start === range.end)
    return normalizeOrgEditorTextFormatRuns(text, typography, formatRuns);
  const base = resolveOrgEditorCanvasInlineTypography(getOrgEditorInlineTypography(typography));
  const boundaries = new Set([0, text.length, range.start, range.end]);
  for (const run of formatRuns) {
    boundaries.add(run.start);
    boundaries.add(run.end);
  }
  const ordered = [...boundaries].sort((a, b) => a - b);
  const chunks: Array<{ end: number; start: number; typography: OrgEditorInlineTypography }> = [];
  for (let index = 0; index < ordered.length - 1; index += 1) {
    const chunkStart = ordered[index] ?? 0;
    const chunkEnd = ordered[index + 1] ?? chunkStart;
    const current = resolveOrgEditorCanvasInlineTypography(
      getOrgEditorTextStyleAt(base, formatRuns, chunkStart),
    );
    chunks.push({
      end: chunkEnd,
      start: chunkStart,
      typography:
        chunkStart >= range.start && chunkEnd <= range.end
          ? resolveOrgEditorCanvasInlineTypography({ ...current, ...patch })
          : current,
    });
  }
  return createCanonicalTextRuns(chunks, base);
};

export const replaceOrgEditorTextRange = ({
  end,
  formatRuns,
  graphemeSafeRange = false,
  insertedText,
  insertedTypography,
  start,
  text,
  typography,
}: {
  end: number;
  formatRuns: readonly OrgEditorTextFormatRun[];
  graphemeSafeRange?: boolean;
  insertedText: string;
  insertedTypography: OrgEditorInlineTypography;
  start: number;
  text: string;
  typography: OrgEditorTypography;
}) => {
  const range = graphemeSafeRange
    ? {
        end: Math.max(0, Math.min(text.length, Math.max(start, end))),
        start: Math.max(0, Math.min(text.length, Math.min(start, end))),
      }
    : normalizeTextRange(text, start, end);
  const nextText = `${text.slice(0, range.start)}${insertedText}${text.slice(range.end)}`;
  const base = resolveOrgEditorCanvasInlineTypography(getOrgEditorInlineTypography(typography));
  const chunks: Array<{ end: number; start: number; typography: OrgEditorInlineTypography }> = [];
  const appendSlice = (sliceStart: number, sliceEnd: number, targetStart: number) => {
    if (sliceStart >= sliceEnd) return;
    const boundaries = new Set([sliceStart, sliceEnd]);
    for (const run of formatRuns) {
      if (run.end <= sliceStart || run.start >= sliceEnd) continue;
      boundaries.add(Math.max(sliceStart, run.start));
      boundaries.add(Math.min(sliceEnd, run.end));
    }
    const ordered = [...boundaries].sort((a, b) => a - b);
    for (let index = 0; index < ordered.length - 1; index += 1) {
      const sourceStart = ordered[index] ?? sliceStart;
      const sourceEnd = ordered[index + 1] ?? sourceStart;
      chunks.push({
        end: targetStart + sourceEnd - sliceStart,
        start: targetStart + sourceStart - sliceStart,
        typography: getOrgEditorTextStyleAt(base, formatRuns, sourceStart),
      });
    }
  };
  appendSlice(0, range.start, 0);
  if (insertedText.length > 0) {
    chunks.push({
      end: range.start + insertedText.length,
      start: range.start,
      typography: insertedTypography,
    });
  }
  appendSlice(range.end, text.length, range.start + insertedText.length);
  return {
    formatRuns: createCanonicalTextRuns(chunks, base),
    selection: range.start + insertedText.length,
    text: nextText,
  };
};

export type OrgEditorRichTextFragment = {
  end: number;
  start: number;
  text: string;
  typography: OrgEditorInlineTypography;
  width: number;
  x: number;
  y: number;
};

export type OrgEditorRichTextLine = {
  fragments: OrgEditorRichTextFragment[];
  height: number;
  width: number;
  x: number;
  y: number;
};

export type OrgEditorRichTextLayout = {
  contentHeight: number;
  effectiveScale: number;
  height: number;
  lines: OrgEditorRichTextLine[];
  width: number;
};

export type OrgEditorTextFillRect = OrgEditorCanvasRect & { radius: number };

export const getOrgEditorTextFillRects = (
  element: Pick<OrgEditorTextElement, "fillMode" | "height" | "width">,
  layout: OrgEditorRichTextLayout,
): OrgEditorTextFillRect[] => {
  if (element.fillMode === "none") return [];
  if (element.fillMode === "block") {
    return [{ height: layout.height, radius: 4, width: layout.width, x: 0, y: 0 }];
  }
  return layout.lines.flatMap((line) =>
    line.width <= 0
      ? []
      : [
          {
            height: line.height + 4,
            radius: 4,
            width: line.width + 8,
            x: line.x - 4,
            y: line.y - 2,
          },
        ],
  );
};

export const getOrgEditorTextRangeTypography = ({
  end,
  formatRuns,
  start,
  text,
  typography,
}: {
  end: number;
  formatRuns: readonly OrgEditorTextFormatRun[];
  start: number;
  text: string;
  typography: OrgEditorTypography;
}): {
  color: EmployeeTagColor | null;
  fontFamily: string | null;
  fontSize: number | null;
  fontWeight: 400 | 700 | null;
} => {
  const range = normalizeTextRange(text, start, end);
  const base = resolveOrgEditorCanvasInlineTypography(getOrgEditorInlineTypography(typography));
  const sampleIndexes = getOrgEditorTextGraphemes(text)
    .filter((grapheme) => grapheme.end > range.start && grapheme.start < range.end)
    .map((grapheme) => grapheme.start);
  if (sampleIndexes.length === 0)
    sampleIndexes.push(Math.max(0, Math.min(text.length - 1, range.start)));
  const styles = sampleIndexes.map((index) =>
    resolveOrgEditorCanvasInlineTypography(getOrgEditorTextStyleAt(base, formatRuns, index)),
  );
  const first = styles[0] ?? base;
  const common = <Key extends keyof OrgEditorInlineTypography>(key: Key) =>
    styles.every((style) => style[key] === first[key]) ? first[key] : null;
  return {
    color: common("color"),
    fontFamily: common("fontFamily"),
    fontSize: common("fontSize"),
    fontWeight: common("fontWeight") as 400 | 700 | null,
  };
};

export const getOrgEditorRichTextLayout = ({
  autoWidth,
  formatRuns,
  height,
  measure,
  mode = "text",
  text,
  typography,
  width,
}: {
  autoWidth: boolean;
  formatRuns: readonly OrgEditorTextFormatRun[];
  height?: number;
  measure: (text: string, typography: OrgEditorInlineTypography) => number;
  mode?: "sticker" | "text";
  text: string;
  typography: OrgEditorTypography;
  width: number;
}): OrgEditorRichTextLayout => {
  const base = resolveOrgEditorCanvasInlineTypography(getOrgEditorInlineTypography(typography));
  const graphemes = getOrgEditorTextGraphemes(text);
  const authored = graphemes.map((grapheme) => {
    const fragmentTypography = resolveOrgEditorCanvasInlineTypography(
      getOrgEditorTextStyleAt(base, formatRuns, grapheme.start),
    );
    return {
      ...grapheme,
      authoredWidth: grapheme.text === "\n" ? 0 : measure(grapheme.text, fragmentTypography),
      typography: fragmentTypography,
    };
  });
  let paragraphWidth = 0;
  let maximumParagraphWidth = 0;
  for (const grapheme of authored) {
    if (grapheme.text === "\n") {
      maximumParagraphWidth = Math.max(maximumParagraphWidth, paragraphWidth);
      paragraphWidth = 0;
    } else {
      paragraphWidth += grapheme.authoredWidth;
    }
  }
  maximumParagraphWidth = Math.max(maximumParagraphWidth, paragraphWidth);
  const padding = mode === "sticker" ? 16 : ORG_EDITOR_CANVAS_TEXT_PADDING;
  let targetWidth =
    mode === "text" && autoWidth
      ? Math.min(
          ORG_EDITOR_CANVAS_TEXT_AUTO_MAX_WIDTH,
          Math.max(
            ORG_EDITOR_CANVAS_MIN_TEXT_WIDTH,
            Math.ceil(maximumParagraphWidth + padding * 2),
          ),
        )
      : Math.min(
          ORG_EDITOR_CANVAS_MAX_RECT_SIZE,
          Math.max(ORG_EDITOR_CANVAS_MIN_TEXT_WIDTH, Math.round(width)),
        );
  let availableWidth = Math.max(1, targetWidth - padding * 2);
  const linesByScale = new Map<
    number,
    Array<{
      fragments: OrgEditorRichTextFragment[];
      height: number;
      width: number;
    }>
  >();
  const createLines = (scale: number) => {
    const cached = linesByScale.get(scale);
    if (cached) return cached;
    const measured = authored.map((grapheme) => {
      const fragmentTypography = {
        ...grapheme.typography,
        fontSize: grapheme.typography.fontSize * scale,
      };
      return {
        ...grapheme,
        height: Math.ceil(fragmentTypography.fontSize * 1.25),
        typography: fragmentTypography,
        width: grapheme.authoredWidth * scale,
      };
    });
    const rawLines: Array<{
      fragments: OrgEditorRichTextFragment[];
      height: number;
      width: number;
    }> = [];
    let current = { fragments: [] as OrgEditorRichTextFragment[], height: 0, width: 0 };
    const defaultLineHeight = Math.ceil(base.fontSize * scale * 1.25);
    const finishLine = () => {
      rawLines.push({
        fragments: current.fragments.map((fragment) => ({ ...fragment })),
        height: Math.max(defaultLineHeight, current.height),
        width: current.width,
      });
      current = { fragments: [], height: 0, width: 0 };
    };
    const appendGrapheme = (grapheme: (typeof measured)[number]) => {
      const previous = current.fragments.at(-1);
      if (
        previous &&
        previous.end === grapheme.start &&
        areInlineTypographiesEqual(previous.typography, grapheme.typography)
      ) {
        previous.end = grapheme.end;
        previous.text += grapheme.text;
        previous.width += grapheme.width;
      } else {
        current.fragments.push({
          end: grapheme.end,
          start: grapheme.start,
          text: grapheme.text,
          typography: grapheme.typography,
          width: grapheme.width,
          x: current.width,
          y: 0,
        });
      }
      current.height = Math.max(current.height, grapheme.height);
      current.width += grapheme.width;
    };
    const appendToken = (token: (typeof measured)[number][]) => {
      const tokenWidth = token.reduce((sum, grapheme) => sum + grapheme.width, 0);
      const isWhitespace = token.every((grapheme) => /\s/u.test(grapheme.text));
      if (isWhitespace) {
        if (current.width === 0) return;
        if (current.width + tokenWidth > availableWidth) finishLine();
        else for (const grapheme of token) appendGrapheme(grapheme);
        return;
      }
      if (current.width > 0 && current.width + tokenWidth > availableWidth) finishLine();
      if (tokenWidth <= availableWidth) {
        for (const grapheme of token) appendGrapheme(grapheme);
        return;
      }
      for (const grapheme of token) {
        if (current.width > 0 && current.width + grapheme.width > availableWidth) finishLine();
        appendGrapheme(grapheme);
      }
    };
    let token: (typeof measured)[number][] = [];
    let tokenWhitespace: boolean | null = null;
    const flushToken = () => {
      if (token.length > 0) appendToken(token);
      token = [];
      tokenWhitespace = null;
    };
    for (const grapheme of measured) {
      if (grapheme.text === "\n") {
        flushToken();
        finishLine();
        continue;
      }
      const whitespace = /\s/u.test(grapheme.text);
      if (tokenWhitespace !== null && tokenWhitespace !== whitespace) flushToken();
      tokenWhitespace = whitespace;
      token.push(grapheme);
    }
    flushToken();
    if (current.fragments.length > 0 || rawLines.length === 0 || text.endsWith("\n")) finishLine();
    linesByScale.set(scale, rawLines);
    return rawLines;
  };

  const contentHeightAt = (scale: number) =>
    createLines(scale).reduce((sum, line) => sum + line.height, 0) + padding * 2;
  const authoredSizes = [
    base.fontSize,
    ...authored.map((grapheme) => grapheme.typography.fontSize),
  ];
  const minimumAuthoredSize = Math.min(...authoredSizes);
  const minimumScale =
    mode === "text" ? Math.min(1, ORG_EDITOR_CANVAS_MIN_FONT_SIZE / minimumAuthoredSize) : 1;
  const requestedHeight = Math.min(
    ORG_EDITOR_CANVAS_MAX_RECT_SIZE,
    Math.max(
      ORG_EDITOR_CANVAS_MIN_TEXT_HEIGHT,
      Math.round(height ?? ORG_EDITOR_CANVAS_MIN_TEXT_HEIGHT),
    ),
  );
  const heightLimit =
    mode === "sticker"
      ? Number.POSITIVE_INFINITY
      : autoWidth
        ? ORG_EDITOR_CANVAS_TEXT_AUTO_MAX_HEIGHT
        : requestedHeight;
  let effectiveScale = 1;
  if (mode === "text") {
    let minimumContentHeight = contentHeightAt(minimumScale);
    if (
      autoWidth &&
      minimumContentHeight > heightLimit &&
      targetWidth < ORG_EDITOR_CANVAS_TEXT_AUTO_MAX_WIDTH
    ) {
      targetWidth = ORG_EDITOR_CANVAS_TEXT_AUTO_MAX_WIDTH;
      availableWidth = targetWidth - padding * 2;
      linesByScale.clear();
      minimumContentHeight = contentHeightAt(minimumScale);
    }
    if (minimumContentHeight > heightLimit) {
      effectiveScale = minimumScale;
    } else if (contentHeightAt(1) > heightLimit) {
      let lower = minimumScale;
      let upper = 1;
      for (let iteration = 0; iteration < 14; iteration += 1) {
        const candidate = (lower + upper) / 2;
        if (contentHeightAt(candidate) <= heightLimit) lower = candidate;
        else upper = candidate;
      }
      effectiveScale = lower;
    }
  }
  const rawLines = createLines(effectiveScale);
  const contentHeight = rawLines.reduce((sum, line) => sum + line.height, 0);
  const minimumContentHeight = Math.ceil(contentHeight + padding * 2);
  const targetHeight = Math.min(
    ORG_EDITOR_CANVAS_MAX_RECT_SIZE,
    Math.max(
      ORG_EDITOR_CANVAS_MIN_TEXT_HEIGHT,
      mode === "text" && autoWidth
        ? minimumContentHeight
        : Math.max(requestedHeight, minimumContentHeight),
    ),
  );
  const firstY =
    mode === "sticker" && typography.verticalAlign === "bottom"
      ? Math.max(padding, targetHeight - padding - contentHeight)
      : mode === "sticker" && typography.verticalAlign === "middle"
        ? Math.max(padding, (targetHeight - contentHeight) / 2)
        : padding;
  let nextY = firstY;
  const lines = rawLines.map((line) => {
    const x =
      typography.horizontalAlign === "right"
        ? targetWidth - padding - line.width
        : typography.horizontalAlign === "center"
          ? (targetWidth - line.width) / 2
          : padding;
    const positioned = {
      fragments: line.fragments.map((fragment) => ({
        ...fragment,
        x: x + fragment.x,
        y: nextY + (line.height - Math.ceil(fragment.typography.fontSize * 1.25)) / 2,
      })),
      height: line.height,
      width: line.width,
      x,
      y: nextY,
    };
    nextY += line.height;
    return positioned;
  });
  return {
    contentHeight,
    effectiveScale,
    height: targetHeight,
    lines,
    width: targetWidth,
  };
};

export const fitOrgEditorCanvasRichTextElement = <
  Element extends OrgEditorStickerElement | OrgEditorTextElement,
>(
  element: Element,
  measure: (text: string, typography: OrgEditorInlineTypography) => number,
  preserveAnchorId: OrgEditorRectAnchorId | null = null,
): Element => {
  const layout = getOrgEditorRichTextLayout({
    autoWidth: element.type === "text" && element.autoWidth,
    formatRuns: element.formatRuns,
    height: element.height,
    measure,
    mode: element.type,
    text: element.text,
    typography:
      element.type === "text"
        ? { ...element.typography, verticalAlign: "top" }
        : element.typography,
    width: element.width,
  });
  const widthDelta = layout.width - element.width;
  let fitted = {
    ...cloneOrgEditorCanvasElement(element),
    height: layout.height,
    typography:
      element.type === "text"
        ? { ...element.typography, verticalAlign: "top" }
        : element.typography,
    width: layout.width,
    x:
      element.type === "text" && element.autoWidth && element.typography.horizontalAlign === "right"
        ? element.x - widthDelta
        : element.type === "text" &&
            element.autoWidth &&
            element.typography.horizontalAlign === "center"
          ? element.x - widthDelta / 2
          : element.x,
  } as Element;
  if (preserveAnchorId) {
    const previousAnchor = getOrgEditorRectAnchorPoint(element, preserveAnchorId);
    const nextAnchor = getOrgEditorRectAnchorPoint(fitted, preserveAnchorId);
    fitted = {
      ...fitted,
      x: fitted.x + previousAnchor.x - nextAnchor.x,
      y: fitted.y + previousAnchor.y - nextAnchor.y,
    };
  }
  if (element.attachment) {
    const previousAnchor = getOrgEditorRectAnchorPoint(element, element.attachment.sourceAnchorId);
    const nextAnchor = getOrgEditorRectAnchorPoint(fitted, element.attachment.sourceAnchorId);
    fitted = {
      ...fitted,
      attachment: {
        ...element.attachment,
        offset: {
          x: element.attachment.offset.x + nextAnchor.x - previousAnchor.x,
          y: element.attachment.offset.y + nextAnchor.y - previousAnchor.y,
        },
      },
    };
  }
  return fitted;
};

export type OrgEditorTextLine = { text: string; width: number; x: number; y: number };

export type OrgEditorCanvasTextLayout = {
  contentHeight: number;
  firstY: number;
  lineHeight: number;
  lines: OrgEditorTextLine[];
  minimumHeight: number;
};

/** Measures the complete text block used by live, draft, auto-fit, and PNG renderers. */
export const getOrgEditorCanvasTextLayout = ({
  height,
  measure,
  padding,
  text,
  typography,
  width,
}: {
  height: number;
  measure: (text: string, typography: OrgEditorTypography) => number;
  padding: number;
  text: string;
  typography: OrgEditorTypography;
  width: number;
}): OrgEditorCanvasTextLayout => {
  const availableWidth = Math.max(1, width - padding * 2);
  const lineHeight = Math.ceil(typography.fontSize * 1.25);
  const lines: Array<{ text: string; width: number }> = [];
  const segmenter =
    typeof Intl.Segmenter === "function"
      ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
      : null;
  const splitGraphemes = (value: string) =>
    segmenter ? [...segmenter.segment(value)].map(({ segment }) => segment) : [...value];
  const appendParagraph = (paragraph: string) => {
    if (!paragraph) {
      lines.push({ text: "", width: 0 });
      return;
    }
    let line = "";
    for (const word of paragraph.split(/(\s+)/u).filter(Boolean)) {
      const candidate = `${line}${word}`;
      if (!line || measure(candidate, typography) <= availableWidth) {
        line = candidate;
        continue;
      }
      lines.push({ text: line.trimEnd(), width: measure(line.trimEnd(), typography) });
      if (measure(word, typography) <= availableWidth) {
        line = word.trimStart();
        continue;
      }
      let chunk = "";
      for (const grapheme of splitGraphemes(word)) {
        const next = `${chunk}${grapheme}`;
        if (chunk && measure(next, typography) > availableWidth) {
          lines.push({ text: chunk, width: measure(chunk, typography) });
          chunk = grapheme;
        } else {
          chunk = next;
        }
      }
      line = chunk;
    }
    lines.push({ text: line.trimEnd(), width: measure(line.trimEnd(), typography) });
  };
  for (const paragraph of text.replace(/\r\n?/gu, "\n").split("\n")) appendParagraph(paragraph);
  const contentHeight = lines.length * lineHeight;
  const firstY =
    typography.verticalAlign === "bottom"
      ? Math.max(padding, height - padding - contentHeight)
      : typography.verticalAlign === "middle"
        ? Math.max(padding, (height - contentHeight) / 2)
        : padding;
  const positionedLines = lines.map(
    (line, index): OrgEditorTextLine => ({
      ...line,
      x:
        typography.horizontalAlign === "right"
          ? width - padding - line.width
          : typography.horizontalAlign === "center"
            ? (width - line.width) / 2
            : padding,
      y: firstY + index * lineHeight,
    }),
  );
  return {
    contentHeight,
    firstY,
    lineHeight,
    lines: positionedLines,
    minimumHeight: Math.min(
      ORG_EDITOR_CANVAS_MAX_RECT_SIZE,
      Math.max(ORG_EDITOR_CANVAS_MIN_RECT_SIZE, padding * 2 + contentHeight),
    ),
  };
};

export const layoutOrgEditorCanvasText = (
  options: Parameters<typeof getOrgEditorCanvasTextLayout>[0],
) => getOrgEditorCanvasTextLayout(options).lines;

/** Returns the smallest persisted height that can contain every wrapped text line. */
export const getOrgEditorCanvasTextMinimumHeight = ({
  element,
  measure,
}: {
  element: OrgEditorStickerElement | OrgEditorTextElement;
  measure: (text: string, typography: OrgEditorTypography) => number;
}) => {
  const padding = element.type === "sticker" ? 16 : 4;
  const layout = getOrgEditorCanvasTextLayout({
    height: 0,
    measure,
    padding,
    text: element.text,
    typography: { ...element.typography, verticalAlign: "top" },
    width: element.width,
  });
  return layout.minimumHeight;
};

/** Grows text-backed rectangles when wrapping or typography would otherwise clip content. */
export const fitOrgEditorCanvasTextElementHeight = <
  Element extends OrgEditorStickerElement | OrgEditorTextElement,
>(
  element: Element,
  measure: (text: string, typography: OrgEditorTypography) => number,
): Element => {
  const dimensions = normalizeOrgEditorCanvasDimensions({
    height: Math.max(element.height, getOrgEditorCanvasTextMinimumHeight({ element, measure })),
    width: element.width,
  });
  return { ...element, ...dimensions };
};

export const isFiniteOrgEditorCanvasNumber = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  Math.abs(value) <= ORG_EDITOR_CANVAS_MAX_COORDINATE;

export const isOrgEditorCanvasColor = (value: unknown): value is EmployeeTagColor =>
  typeof value === "string" &&
  (/^(red|orange|amber|green|teal|cyan|blue|rose)$/u.test(value) ||
    /^#[0-9a-f]{6}([0-9a-f]{2})?$/u.test(value));

export const isOrgEditorCanvasFont = (value: unknown): value is string =>
  typeof value === "string" && ORG_EDITOR_CANVAS_ACCEPTED_FONTS.includes(value as never);
