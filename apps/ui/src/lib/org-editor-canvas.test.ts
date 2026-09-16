import { describe, expect, test } from "vitest";

import {
  applyOrgEditorTextFormat,
  createOrgEditorArrowElement,
  createOrgEditorCanvasDependencyIndexes,
  createOrgEditorStickerElement,
  createOrgEditorTextElement,
  fitOrgEditorCanvasRichTextElement,
  fitOrgEditorCanvasTextElementHeight,
  getOrgEditorCanvasDependentClosure,
  getOrgEditorCanvasElementAnchorPoint,
  getOrgEditorCanvasElementBounds,
  getOrgEditorCanvasElementFont,
  getOrgEditorCanvasFont,
  getOrgEditorCanvasImagePlaceholderPoints,
  getOrgEditorCanvasResizeBounds,
  getOrgEditorCanvasRotationDelta,
  getOrgEditorCanvasTextLayout,
  getOrgEditorRectAnchorPoint,
  getOrgEditorRichTextLayout,
  getOrgEditorScopedCanvasElementIds,
  getOrgEditorTextFillRects,
  hasOrgEditorCanvasElementDependencyCycle,
  layoutOrgEditorCanvasText,
  moveOrgEditorCanvasElement,
  normalizeOrgEditorCanvasDimension,
  normalizeOrgEditorCanvasDimensions,
  normalizeOrgEditorTextFormatRuns,
  ORG_EDITOR_CANVAS_FONTS,
  ORG_EDITOR_CANVAS_RESIZE_HANDLE_IDS,
  replaceOrgEditorTextRange,
  resizeOrgEditorCanvasRectElement,
  resolveOrgEditorCanvasElements,
  resolveOrgEditorCanvasFontFamily,
  resolveOrgEditorCanvasTypography,
  rotateOrgEditorCanvasRectElementAroundCenter,
  transformOrgEditorCanvasElements,
} from "@/lib/org-editor-canvas";
import { createSpatialIndex } from "@/lib/org-editor-interaction";

const uuid = (value: number) => `00000000-0000-4000-8000-${String(value).padStart(12, "0")}`;

describe("Org Editor canvas geometry", () => {
  test("shares current font stacks and resolves legacy typography for DOM and PNG", () => {
    expect(ORG_EDITOR_CANVAS_FONTS).toEqual([
      "system-ui",
      "Georgia",
      "Bebas Neue",
      "Lobster",
      "Montserrat",
    ]);
    expect(getOrgEditorCanvasFont("Montserrat", 500, 18)).toBe(
      "400 18px Montserrat, system-ui, sans-serif",
    );
    expect(getOrgEditorCanvasFont("Bebas Neue", 700, 20)).toBe(
      '700 20px "Bebas Neue", Impact, sans-serif',
    );
    expect(getOrgEditorCanvasFont("Lobster", 400, 20)).toBe("400 20px Lobster, Georgia, serif");
    expect(getOrgEditorCanvasFont("Georgia", 700, 24)).toBe(
      '700 24px Georgia, "Times New Roman", serif',
    );
    expect(resolveOrgEditorCanvasFontFamily("Manrope")).toBe("system-ui");
    expect(
      resolveOrgEditorCanvasTypography({
        color: "blue",
        fontFamily: "Inter",
        fontSize: 18,
        fontWeight: 500,
        horizontalAlign: "left",
        verticalAlign: "top",
      }),
    ).toMatchObject({ fontFamily: "system-ui", fontWeight: 400 });
    expect(
      getOrgEditorCanvasElementFont({ fontFamily: "Inter", fontSize: 18, fontWeight: 500 }),
    ).toBe('400 18px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif');
    expect(createOrgEditorTextElement({ x: 0, y: 0 }).typography).toMatchObject({
      fontFamily: "system-ui",
      fontWeight: 400,
    });
    expect(createOrgEditorStickerElement({ x: 0, y: 0 }).typography).toMatchObject({
      fontFamily: "system-ui",
      fontWeight: 400,
    });
  });

  test("rotates rectangular anchors and indexes exact bounds", () => {
    const element = {
      ...createOrgEditorTextElement({ x: 100, y: 100 }),
      height: 80,
      rotation: 90,
      width: 200,
      x: 0,
      y: 60,
    };
    const center = getOrgEditorCanvasElementAnchorPoint(element, "center");
    const top = getOrgEditorCanvasElementAnchorPoint(element, "topCenter");
    const bounds = getOrgEditorCanvasElementBounds(element);

    expect(center).toEqual({ x: 100, y: 100 });
    expect(top?.x).toBeCloseTo(140);
    expect(top?.y).toBeCloseTo(100);
    expect(bounds.width).toBeCloseTo(80);
    expect(bounds.height).toBeCloseTo(200);

    const index = createSpatialIndex([element], getOrgEditorCanvasElementBounds, 64);
    expect(index.query({ height: 20, width: 20, x: 130, y: 90 }).items).toHaveLength(1);
    expect(index.query({ height: 10, width: 10, x: 0, y: 0 }).items).toHaveLength(0);
  });

  test("resolves transitive attachments and rejects dependency cycles", () => {
    const first = { ...createOrgEditorStickerElement({ x: 50, y: 50 }), id: uuid(1) };
    const second = {
      ...createOrgEditorTextElement({ x: 0, y: 0 }),
      attachment: {
        offset: { x: 12, y: 8 },
        sourceAnchorId: "center" as const,
        target: {
          anchorId: "rightCenter" as const,
          owner: { elementId: first.id, type: "element" as const },
        },
      },
      id: uuid(2),
    };
    const resolved = resolveOrgEditorCanvasElements({
      elements: [first, second],
      resolveExternalAnchor: () => null,
    });
    const target = getOrgEditorCanvasElementAnchorPoint(first, "rightCenter");
    const source = getOrgEditorCanvasElementAnchorPoint(
      resolved.get(second.id)?.element as typeof second,
      "center",
    );
    expect(source?.x).toBeCloseTo((target?.x ?? 0) + 12);
    expect(source?.y).toBeCloseTo((target?.y ?? 0) + 8);

    const cyclicFirst = {
      ...first,
      attachment: {
        offset: { x: 0, y: 0 },
        sourceAnchorId: "center" as const,
        target: {
          anchorId: "center" as const,
          owner: { elementId: second.id, type: "element" as const },
        },
      },
    };
    expect(hasOrgEditorCanvasElementDependencyCycle([cyclicFirst, second])).toBe(true);

    const indexes = createOrgEditorCanvasDependencyIndexes([first, second]);
    expect(getOrgEditorCanvasDependentClosure([first.id], indexes.dependentsByElementId)).toEqual(
      new Set([first.id, second.id]),
    );
  });

  test("shares neutral Image placeholder geometry with DOM and PNG painters", () => {
    expect(getOrgEditorCanvasImagePlaceholderPoints(200, 100)).toEqual([
      { x: 40, y: 75 },
      { x: 90, y: 45 },
      { x: 124, y: 62 },
      { x: 160, y: 35 },
    ]);
  });

  test("includes attached rectangles transitively and arrows only between included owners", () => {
    const unitId = uuid(10);
    const outsideUnitId = uuid(11);
    const sticker = {
      ...createOrgEditorStickerElement({ x: 0, y: 0 }),
      attachment: {
        offset: { x: 0, y: 0 },
        sourceAnchorId: "center" as const,
        target: { anchorId: "center" as const, owner: { type: "unit" as const, unitId } },
      },
      id: uuid(12),
    };
    const text = {
      ...createOrgEditorTextElement({ x: 0, y: 0 }),
      attachment: {
        offset: { x: 0, y: 0 },
        sourceAnchorId: "center" as const,
        target: {
          anchorId: "center" as const,
          owner: { elementId: sticker.id, type: "element" as const },
        },
      },
      id: uuid(13),
    };
    const includedArrow = {
      ...createOrgEditorArrowElement({ x: 0, y: 0 }, { x: 100, y: 0 }),
      end: {
        attachment: {
          offset: { x: 0, y: 0 },
          target: {
            anchorId: "center" as const,
            owner: { elementId: text.id, type: "element" as const },
          },
        },
        x: 100,
        y: 0,
      },
      id: uuid(14),
      start: {
        attachment: {
          offset: { x: 0, y: 0 },
          target: { anchorId: "center" as const, owner: { type: "unit" as const, unitId } },
        },
        x: 0,
        y: 0,
      },
    };
    const excludedArrow = {
      ...includedArrow,
      end: {
        ...includedArrow.end,
        attachment: {
          offset: { x: 0, y: 0 },
          target: {
            anchorId: "center" as const,
            owner: { type: "unit" as const, unitId: outsideUnitId },
          },
        },
      },
      id: uuid(15),
    };
    const ids = getOrgEditorScopedCanvasElementIds({
      elements: [sticker, text, includedArrow, excludedArrow],
      ownerKeys: new Set([`unit:${unitId}`]),
    });
    expect(ids).toEqual(new Set([sticker.id, text.id, includedArrow.id]));
  });

  test("lays out grapheme-safe aligned text", () => {
    const element = createOrgEditorTextElement({ x: 0, y: 0 });
    const lines = layoutOrgEditorCanvasText({
      height: 120,
      measure: (value) => [...value].length * 10,
      padding: 8,
      text: "A very long line 😀😀😀",
      typography: { ...element.typography, horizontalAlign: "center", verticalAlign: "middle" },
      width: 90,
    });
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.every((line) => line.x >= 0 && line.width <= 74)).toBe(true);
    expect(lines[0]?.y).toBeGreaterThan(8);
  });

  test("normalizes grapheme-safe rich ranges and preserves inserted caret styling", () => {
    const element = createOrgEditorTextElement({ x: 0, y: 0 });
    const text = "A👩🏽‍💻B";
    const formatted = applyOrgEditorTextFormat({
      end: 2,
      formatRuns: [],
      patch: { color: "blue", fontWeight: 700 },
      start: 1,
      text,
      typography: element.typography,
    });
    expect(formatted).toEqual([
      {
        end: text.length - 1,
        start: 1,
        typography: {
          color: "blue",
          fontFamily: "system-ui",
          fontSize: 18,
          fontWeight: 700,
        },
      },
    ]);
    const inserted = replaceOrgEditorTextRange({
      end: text.length - 1,
      formatRuns: formatted,
      insertedText: "ok",
      insertedTypography: {
        color: "rose",
        fontFamily: "Georgia",
        fontSize: 24,
        fontWeight: 400,
      },
      start: 1,
      text,
      typography: element.typography,
    });
    expect(inserted.text).toBe("AokB");
    expect(inserted.selection).toBe(3);
    expect(inserted.formatRuns).toEqual([
      {
        end: 3,
        start: 1,
        typography: {
          color: "rose",
          fontFamily: "Georgia",
          fontSize: 24,
          fontWeight: 400,
        },
      },
    ]);
    expect(
      normalizeOrgEditorTextFormatRuns(inserted.text, element.typography, inserted.formatRuns),
    ).toEqual(inserted.formatRuns);
  });

  test("derives automatic rich Text bounds and all fill geometries", () => {
    const element = {
      ...createOrgEditorTextElement({ x: 100, y: 100 }),
      fillMode: "lines" as const,
      formatRuns: [
        {
          end: 2,
          start: 1,
          typography: {
            color: "blue" as const,
            fontFamily: "Georgia",
            fontSize: 32,
            fontWeight: 700 as const,
          },
        },
      ],
      text: "AB\nC",
    };
    const layout = getOrgEditorRichTextLayout({
      autoWidth: true,
      formatRuns: element.formatRuns,
      measure: (_value, typography) => typography.fontSize,
      text: element.text,
      typography: element.typography,
      width: element.width,
    });
    expect(layout.width).toBe(58);
    expect(layout.height).toBe(71);
    expect(layout.lines).toHaveLength(2);
    expect(getOrgEditorTextFillRects(element, layout)).toEqual([
      { height: 44, radius: 4, width: 58, x: 0, y: 2 },
      { height: 27, radius: 4, width: 26, x: 0, y: 42 },
    ]);
    expect(getOrgEditorTextFillRects({ ...element, fillMode: "block" }, layout)).toEqual([
      { height: 32, radius: 4, width: 48, x: 0, y: 0 },
    ]);
    expect(getOrgEditorTextFillRects({ ...element, fillMode: "none" }, layout)).toEqual([]);
    const fitted = fitOrgEditorCanvasRichTextElement(
      element,
      (_value, typography) => typography.fontSize,
    );
    expect(fitted).toMatchObject({ height: 71, width: 58 });
  });

  test("uses one text-block geometry for all nine saved alignments and overflow", () => {
    const element = createOrgEditorTextElement({ x: 0, y: 0 });
    const expectedX = { center: 40, left: 10, right: 70 } as const;
    const expectedY = { bottom: 67, middle: 38.5, top: 10 } as const;
    for (const horizontalAlign of ["left", "center", "right"] as const) {
      for (const verticalAlign of ["top", "middle", "bottom"] as const) {
        const layout = getOrgEditorCanvasTextLayout({
          height: 100,
          measure: () => 20,
          padding: 10,
          text: "xx",
          typography: { ...element.typography, horizontalAlign, verticalAlign },
          width: 100,
        });
        expect(layout.lines).toEqual([
          { text: "xx", width: 20, x: expectedX[horizontalAlign], y: expectedY[verticalAlign] },
        ]);
        expect(layout.contentHeight).toBe(23);
        expect(layout.minimumHeight).toBe(43);
      }
    }

    const overflow = getOrgEditorCanvasTextLayout({
      height: 24,
      measure: (value) => value.length * 10,
      padding: 4,
      text: "one two three four",
      typography: { ...element.typography, verticalAlign: "bottom" },
      width: 50,
    });
    expect(overflow.lines.length).toBeGreaterThan(1);
    expect(overflow.firstY).toBe(4);
    expect(overflow.minimumHeight).toBe(8 + overflow.contentHeight);
  });

  test("grows wrapped text without clipping and ignores persisted Image aspect locks", () => {
    const text = {
      ...createOrgEditorTextElement({ x: 0, y: 0 }),
      height: 24,
      text: "one two three four five six",
      width: 70,
    };
    const fitted = fitOrgEditorCanvasTextElementHeight(text, (value) => [...value].length * 10);
    expect(fitted.height).toBeGreaterThan(text.height);
    expect(Number.isInteger(fitted.height)).toBe(true);
    expect(Number.isInteger(fitted.width)).toBe(true);

    const image = {
      attachment: null,
      dataUrl:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAABCAYAAAD0In+KAAAADUlEQVR42mNk+M/wHwAF/gL+3q1HAAAAAElFTkSuQmCC",
      height: 100,
      id: uuid(30),
      intrinsicHeight: 100,
      intrinsicWidth: 200,
      layer: "aboveUnits" as const,
      lockAspectRatio: true,
      rotation: 0,
      type: "image" as const,
      width: 200,
      x: 0,
      y: 0,
    };
    const [transformed] = transformOrgEditorCanvasElements({
      elements: [image],
      sourceBounds: { height: 100, width: 200, x: 0, y: 0 },
      targetBounds: { height: 300, width: 300, x: 0, y: 0 },
    });
    expect(transformed?.type).toBe("image");
    if (transformed?.type !== "image") return;
    expect(transformed.width).toBe(300);
    expect(transformed.height).toBe(300);
  });

  test("normalizes rectangle dimensions to bounded whole logical pixels", () => {
    expect(normalizeOrgEditorCanvasDimension(23.9)).toBe(24);
    expect(normalizeOrgEditorCanvasDimension(240.51)).toBe(241);
    expect(normalizeOrgEditorCanvasDimension(20_000.8)).toBe(20_000);
    expect(normalizeOrgEditorCanvasDimensions({ height: 96.49, width: 240.5 })).toEqual({
      height: 96,
      width: 241,
    });

    const fitted = fitOrgEditorCanvasTextElementHeight(
      {
        ...createOrgEditorTextElement({ x: 0, y: 0 }),
        height: 96.4,
        text: "short",
        width: 240.6,
      },
      (value) => [...value].length * 10,
    );
    expect(fitted).toMatchObject({ height: 96, width: 241 });
  });

  test("resizes from every perimeter handle while retaining opposite edges", () => {
    const sourceBounds = { height: 100, width: 200, x: 100, y: 100 };
    const pointers = {
      bottomCenter: { x: 999, y: 260 },
      bottomLeft: { x: 50, y: 260 },
      bottomRight: { x: 350, y: 260 },
      leftCenter: { x: 50, y: 999 },
      rightCenter: { x: 350, y: 999 },
      topCenter: { x: 999, y: 60 },
      topLeft: { x: 50, y: 60 },
      topRight: { x: 350, y: 60 },
    } as const;
    const expected = {
      bottomCenter: { height: 160, width: 200, x: 100, y: 100 },
      bottomLeft: { height: 160, width: 250, x: 50, y: 100 },
      bottomRight: { height: 160, width: 250, x: 100, y: 100 },
      leftCenter: { height: 100, width: 250, x: 50, y: 100 },
      rightCenter: { height: 100, width: 250, x: 100, y: 100 },
      topCenter: { height: 140, width: 200, x: 100, y: 60 },
      topLeft: { height: 140, width: 250, x: 50, y: 60 },
      topRight: { height: 140, width: 250, x: 100, y: 60 },
    } as const;

    expect(new Set(ORG_EDITOR_CANVAS_RESIZE_HANDLE_IDS)).toEqual(new Set(Object.keys(expected)));
    for (const handle of ORG_EDITOR_CANVAS_RESIZE_HANDLE_IDS) {
      expect(
        getOrgEditorCanvasResizeBounds({ handle, pointer: pointers[handle], sourceBounds }),
      ).toEqual(expected[handle]);
    }
  });

  test("quantizes resize previews while retaining the opposite edge or corner", () => {
    const sourceBounds = { height: 100.4, width: 200.4, x: 100, y: 100 };
    expect(
      getOrgEditorCanvasResizeBounds({
        handle: "rightCenter",
        pointer: { x: 350.6, y: 900 },
        sourceBounds,
      }),
    ).toEqual({ height: 100, width: 251, x: 100, y: 100.2 });
    const topLeft = getOrgEditorCanvasResizeBounds({
      handle: "topLeft",
      pointer: { x: 49.4, y: 59.6 },
      sourceBounds,
    });
    expect(topLeft).toMatchObject({ height: 141, width: 251 });
    expect(topLeft.x).toBeCloseTo(49.4);
    expect(topLeft.y).toBeCloseTo(59.4);
  });

  test("preserves Image proportions only for a modified resize sample", () => {
    const lockedImage = {
      attachment: null,
      dataUrl:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAABCAYAAAD0In+KAAAADUlEQVR42mNk+M/wHwAF/gL+3q1HAAAAAElFTkSuQmCC",
      height: 100,
      id: uuid(31),
      intrinsicHeight: 100,
      intrinsicWidth: 200,
      layer: "aboveUnits" as const,
      lockAspectRatio: true,
      rotation: 0,
      type: "image" as const,
      width: 200,
      x: 100,
      y: 100,
    };
    const resizedImage = resizeOrgEditorCanvasRectElement(lockedImage, "rightCenter", {
      x: 500.6,
      y: 150,
    });
    expect(resizedImage).toMatchObject({ height: 100, width: 401, x: 100, y: 100 });
    const proportionalImage = resizeOrgEditorCanvasRectElement(
      lockedImage,
      "rightCenter",
      { x: 500.6, y: 150 },
      true,
    );
    expect(proportionalImage).toMatchObject({ height: 200, width: 401, x: 100, y: 50 });
    expect(Number.isInteger(resizedImage.width)).toBe(true);
    expect(Number.isInteger(resizedImage.height)).toBe(true);

    const rotated = {
      ...createOrgEditorTextElement({ x: 200, y: 150 }),
      height: 100,
      rotation: 90,
      width: 200,
      x: 100,
      y: 100,
    };
    const previousLeft = getOrgEditorRectAnchorPoint(rotated, "leftCenter");
    const resizedRotated = resizeOrgEditorCanvasRectElement(rotated, "rightCenter", {
      x: 200,
      y: 350,
    });
    expect(resizedRotated.width).toBeCloseTo(300);
    expect(getOrgEditorRectAnchorPoint(resizedRotated, "leftCenter")).toEqual(previousLeft);
  });

  test("rounds group rectangle sizes without moving their transformed centers", () => {
    const source = {
      ...createOrgEditorStickerElement({ x: 120, y: 80 }),
      height: 80.4,
      width: 120.4,
      x: 59.8,
      y: 39.8,
    };
    const [transformed] = transformOrgEditorCanvasElements({
      elements: [source],
      sourceBounds: { height: 80.4, width: 120.4, x: 59.8, y: 39.8 },
      targetBounds: { height: 133, width: 199, x: 10, y: 20 },
    });
    expect(transformed?.type).toBe("sticker");
    if (transformed?.type !== "sticker") return;
    expect(Number.isInteger(transformed.width)).toBe(true);
    expect(Number.isInteger(transformed.height)).toBe(true);
    expect(transformed.x + transformed.width / 2).toBeCloseTo(109.5);
    expect(transformed.y + transformed.height / 2).toBeCloseTo(86.5);
  });

  test("scales Text width and rich font sizes before deriving group height", () => {
    const source = {
      ...createOrgEditorTextElement({ x: 100, y: 80 }),
      autoWidth: false,
      formatRuns: [
        {
          end: 2,
          start: 0,
          typography: {
            color: "blue" as const,
            fontFamily: "Georgia",
            fontSize: 24,
            fontWeight: 700 as const,
          },
        },
      ],
      height: 54,
      text: "AB CD",
      width: 100,
      x: 50,
      y: 53,
    };
    const [transformed] = transformOrgEditorCanvasElements({
      elements: [source],
      measureText: (value, typography) => value.length * typography.fontSize * 0.5,
      sourceBounds: { height: 54, width: 100, x: 50, y: 53 },
      targetBounds: { height: 108, width: 150, x: 20, y: 30 },
    });
    expect(transformed?.type).toBe("text");
    if (transformed?.type !== "text") return;
    expect(transformed.autoWidth).toBe(false);
    expect(transformed.width).toBe(150);
    expect(transformed.typography.fontSize).toBe(36);
    expect(transformed.formatRuns[0]?.typography.fontSize).toBe(48);
    expect(transformed.height).toBe(68);
    expect(transformed.x + transformed.width / 2).toBeCloseTo(95);
    expect(transformed.y + transformed.height / 2).toBeCloseTo(84);
  });

  test("derives rotation from the exact selected-bounds center", () => {
    const bounds = { height: 100, width: 200, x: 20, y: 40 };
    expect(
      getOrgEditorCanvasRotationDelta(bounds, { x: 220, y: 90 }, { x: 120, y: 190 }),
    ).toBeCloseTo(90);
    const source = {
      ...createOrgEditorStickerElement({ x: 120, y: 90 }),
      height: 60,
      rotation: 12,
      width: 80,
      x: 80,
      y: 60,
    };
    const [rotated] = transformOrgEditorCanvasElements({
      elements: [source],
      rotation: 90,
      sourceBounds: bounds,
      targetBounds: bounds,
    });
    expect(rotated?.type).toBe("sticker");
    if (rotated?.type !== "sticker") return;
    expect(rotated.rotation).toBe(102);
    expect(rotated.x + rotated.width / 2).toBeCloseTo(120);
    expect(rotated.y + rotated.height / 2).toBeCloseTo(90);
  });

  test("rotates one resized attached rectangle around its live center", () => {
    const target = {
      ...createOrgEditorStickerElement({ x: 90, y: 80 }),
      height: 110,
      id: uuid(32),
      width: 150,
      x: 15,
      y: 25,
    };
    const sourceWithoutAttachment = {
      ...createOrgEditorTextElement({ x: 360, y: 240 }),
      height: 96,
      id: uuid(33),
      rotation: 27,
      width: 280,
      x: 220,
      y: 192,
    };
    const targetAnchor = getOrgEditorRectAnchorPoint(target, "rightCenter");
    const sourceAnchor = getOrgEditorRectAnchorPoint(sourceWithoutAttachment, "topLeft");
    const source = {
      ...sourceWithoutAttachment,
      attachment: {
        offset: {
          x: sourceAnchor.x - targetAnchor.x,
          y: sourceAnchor.y - targetAnchor.y,
        },
        sourceAnchorId: "topLeft" as const,
        target: {
          anchorId: "rightCenter" as const,
          owner: { elementId: target.id, type: "element" as const },
        },
      },
    };
    const resolvedBefore = resolveOrgEditorCanvasElements({
      elements: [target, source],
      resolveExternalAnchor: () => null,
    }).get(source.id)?.element;
    expect(resolvedBefore?.type).toBe("text");
    if (resolvedBefore?.type !== "text") return;
    const centerBefore = {
      x: resolvedBefore.x + resolvedBefore.width / 2,
      y: resolvedBefore.y + resolvedBefore.height / 2,
    };

    const rotated = rotateOrgEditorCanvasRectElementAroundCenter(resolvedBefore, 81);
    expect(rotated).toMatchObject({
      height: 96,
      rotation: 108,
      width: 280,
      x: resolvedBefore.x,
      y: resolvedBefore.y,
    });
    expect(rotated.attachment?.offset).not.toEqual(resolvedBefore.attachment?.offset);

    const resolvedAfter = resolveOrgEditorCanvasElements({
      elements: [target, rotated],
      resolveExternalAnchor: () => null,
    }).get(rotated.id)?.element;
    expect(resolvedAfter?.type).toBe("text");
    if (resolvedAfter?.type !== "text") return;
    expect(resolvedAfter.x + resolvedAfter.width / 2).toBeCloseTo(centerBefore.x);
    expect(resolvedAfter.y + resolvedAfter.height / 2).toBeCloseTo(centerBefore.y);
  });

  test("keeps attachment offsets stable when a target moves with its dependent", () => {
    const target = { ...createOrgEditorStickerElement({ x: 100, y: 100 }), id: uuid(40) };
    const dependent = {
      ...createOrgEditorTextElement({ x: 300, y: 100 }),
      attachment: {
        offset: { x: 20, y: 0 },
        sourceAnchorId: "leftCenter" as const,
        target: {
          anchorId: "rightCenter" as const,
          owner: { elementId: target.id, type: "element" as const },
        },
      },
      id: uuid(41),
    };
    const moved = moveOrgEditorCanvasElement(
      dependent,
      { x: 80, y: 40 },
      (ref) => ref.owner.type !== "element" || ref.owner.elementId !== target.id,
    );
    expect(moved.type === "text" && moved.attachment?.offset).toEqual({ x: 20, y: 0 });
    const movedAgainstExternal = moveOrgEditorCanvasElement(dependent, { x: 80, y: 40 });
    expect(movedAgainstExternal.type === "text" && movedAgainstExternal.attachment?.offset).toEqual(
      { x: 100, y: 40 },
    );
  });
});
