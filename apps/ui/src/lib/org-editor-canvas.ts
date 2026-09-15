import type {
  EmployeeTagColor,
  OrgEditorAnchorRef,
  OrgEditorArrowElement,
  OrgEditorArrowEndpoint,
  OrgEditorCanvasElement,
  OrgEditorCanvasElementId,
  OrgEditorCanvasPoint,
  OrgEditorImageElement,
  OrgEditorRectAnchorId,
  OrgEditorStickerElement,
  OrgEditorTextElement,
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
export const ORG_EDITOR_CANVAS_FONTS = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Noto Sans",
  "Source Sans 3",
  "IBM Plex Sans",
  "Montserrat",
  "Manrope",
  "Nunito Sans",
  "PT Sans",
] as const;

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
  fontFamily: "Inter",
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
  height: 96,
  id: createUuid(),
  layer: "aboveUnits",
  rotation: 0,
  text: "Text",
  typography: createDefaultOrgEditorTypography(),
  type: "text",
  width: 240,
  x: point.x - 120,
  y: point.y - 48,
});

export const createOrgEditorStickerElement = (
  point: OrgEditorCanvasPoint,
): OrgEditorStickerElement => ({
  attachment: null,
  backgroundColor: "amber",
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
  const width = Math.max(ORG_EDITOR_CANVAS_MIN_RECT_SIZE, intrinsicWidth * scale);
  const height = Math.max(ORG_EDITOR_CANVAS_MIN_RECT_SIZE, intrinsicHeight * scale);
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
    ...(element.type === "image" ? {} : { typography: { ...element.typography } }),
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
      element = {
        ...element,
        end: resolveEndpoint(element.end),
        start: resolveEndpoint(element.start),
      };
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
  rotation = 0,
  sourceBounds,
  targetBounds,
}: {
  elements: readonly OrgEditorCanvasElement[];
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
    const lockedScale =
      source.type === "image" && source.lockAspectRatio ? Math.min(scaleX, scaleY) : null;
    const width = Math.max(ORG_EDITOR_CANVAS_MIN_RECT_SIZE, source.width * (lockedScale ?? scaleX));
    const height = Math.max(
      ORG_EDITOR_CANVAS_MIN_RECT_SIZE,
      source.height * (lockedScale ?? scaleY),
    );
    return {
      ...cloneOrgEditorCanvasElement(source),
      attachment: source.attachment
        ? { ...source.attachment, offset: transformOffset(source.attachment.offset) }
        : null,
      height,
      rotation: normalizeOrgEditorRotation(source.rotation + rotation),
      width,
      x: center.x - width / 2,
      y: center.y - height / 2,
    } as Exclude<OrgEditorCanvasElement, OrgEditorArrowElement>;
  });

export const createOrgEditorCanvasElementKey = (elementId: OrgEditorCanvasElementId) =>
  `element:${elementId}`;

export const remapOrgEditorAnchorRef = (
  ref: OrgEditorAnchorRef,
  unitIdMap: ReadonlyMap<string, string>,
  elementIdMap: ReadonlyMap<string, string>,
  preserveExternal: boolean,
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
  const elementId = elementIdMap.get(ref.owner.elementId);
  return elementId
    ? { ...ref, owner: { elementId, type: "element" } }
    : preserveExternal
      ? cloneOrgEditorAnchorRef(ref)
      : null;
};

export type OrgEditorTextLine = { text: string; width: number; x: number; y: number };

export const layoutOrgEditorCanvasText = ({
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
}) => {
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
  return lines.map(
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
};

/** Returns the smallest persisted height that can contain every wrapped text line. */
export const getOrgEditorCanvasTextMinimumHeight = ({
  element,
  measure,
}: {
  element: OrgEditorStickerElement | OrgEditorTextElement;
  measure: (text: string, typography: OrgEditorTypography) => number;
}) => {
  const padding = element.type === "sticker" ? 16 : 4;
  const lines = layoutOrgEditorCanvasText({
    height: 0,
    measure,
    padding,
    text: element.text,
    typography: { ...element.typography, verticalAlign: "top" },
    width: element.width,
  });
  const lineHeight = Math.ceil(element.typography.fontSize * 1.25);
  return Math.min(
    ORG_EDITOR_CANVAS_MAX_RECT_SIZE,
    Math.max(ORG_EDITOR_CANVAS_MIN_RECT_SIZE, padding * 2 + lines.length * lineHeight),
  );
};

/** Grows text-backed rectangles when wrapping or typography would otherwise clip content. */
export const fitOrgEditorCanvasTextElementHeight = <
  Element extends OrgEditorStickerElement | OrgEditorTextElement,
>(
  element: Element,
  measure: (text: string, typography: OrgEditorTypography) => number,
): Element => ({
  ...element,
  height: Math.max(element.height, getOrgEditorCanvasTextMinimumHeight({ element, measure })),
});

export const isFiniteOrgEditorCanvasNumber = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  Math.abs(value) <= ORG_EDITOR_CANVAS_MAX_COORDINATE;

export const isOrgEditorCanvasColor = (value: unknown): value is EmployeeTagColor =>
  typeof value === "string" &&
  (/^(red|orange|amber|green|teal|cyan|blue|rose)$/u.test(value) ||
    /^#[0-9a-f]{6}([0-9a-f]{2})?$/u.test(value));

export const isOrgEditorCanvasFont = (value: unknown): value is string =>
  typeof value === "string" && ORG_EDITOR_CANVAS_FONTS.includes(value as never);
