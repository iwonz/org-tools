import { describe, expect, test } from "vitest";

import {
  createOrgEditorArrowElement,
  createOrgEditorCanvasDependencyIndexes,
  createOrgEditorStickerElement,
  createOrgEditorTextElement,
  fitOrgEditorCanvasTextElementHeight,
  getOrgEditorCanvasDependentClosure,
  getOrgEditorCanvasElementAnchorPoint,
  getOrgEditorCanvasElementBounds,
  getOrgEditorCanvasImagePlaceholderPoints,
  getOrgEditorScopedCanvasElementIds,
  hasOrgEditorCanvasElementDependencyCycle,
  layoutOrgEditorCanvasText,
  moveOrgEditorCanvasElement,
  resolveOrgEditorCanvasElements,
  transformOrgEditorCanvasElements,
} from "@/lib/org-editor-canvas";
import { createSpatialIndex } from "@/lib/org-editor-interaction";

const uuid = (value: number) => `00000000-0000-4000-8000-${String(value).padStart(12, "0")}`;

describe("Org Editor canvas geometry", () => {
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

  test("grows wrapped text without clipping and preserves locked Image proportions", () => {
    const text = {
      ...createOrgEditorTextElement({ x: 0, y: 0 }),
      height: 24,
      text: "one two three four five six",
      width: 70,
    };
    const fitted = fitOrgEditorCanvasTextElementHeight(text, (value) => [...value].length * 10);
    expect(fitted.height).toBeGreaterThan(text.height);

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
    expect(transformed.width / transformed.height).toBeCloseTo(2);
    expect(transformed.width).toBe(300);
    expect(transformed.height).toBe(150);
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
