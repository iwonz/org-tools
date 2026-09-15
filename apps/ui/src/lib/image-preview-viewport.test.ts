import { describe, expect, test } from "vitest";

import {
  constrainImagePreviewViewport,
  createFittedImagePreviewViewport,
  getImagePreviewFitScale,
  getImagePreviewScaleBounds,
  panImagePreviewViewport,
  preserveImagePreviewViewport,
  zoomImagePreviewViewport,
} from "@/lib/image-preview-viewport";

describe("image preview viewport", () => {
  const container = { height: 300, width: 500 };
  const image = { height: 600, width: 1_000 };

  test("fits without upscaling and exposes the smaller of Fit and ten percent", () => {
    expect(getImagePreviewFitScale(container, image)).toBe(0.5);
    expect(createFittedImagePreviewViewport(container, image)).toEqual({
      mode: "fit",
      scale: 0.5,
      x: 0,
      y: 0,
    });
    expect(getImagePreviewScaleBounds(container, image)).toEqual({ maximum: 4, minimum: 0.1 });
    expect(
      getImagePreviewScaleBounds({ height: 20, width: 20 }, { height: 1_000, width: 1_000 }),
    ).toEqual({ maximum: 4, minimum: 0.02 });
    expect(
      createFittedImagePreviewViewport(
        { height: 1_000, width: 1_000 },
        { height: 100, width: 200 },
      ),
    ).toEqual({ mode: "fit", scale: 1, x: 400, y: 450 });
  });

  test("zooms around the requested pointer and clamps scale and translation", () => {
    const fitted = createFittedImagePreviewViewport(container, image);
    const zoomed = zoomImagePreviewViewport({
      container,
      focalPoint: { x: 125, y: 75 },
      image,
      scale: 1,
      viewport: fitted,
    });
    expect(zoomed).toEqual({ mode: "manual", scale: 1, x: -125, y: -75 });
    expect(
      zoomImagePreviewViewport({
        container,
        focalPoint: { x: 250, y: 150 },
        image,
        scale: 99,
        viewport: zoomed,
      }).scale,
    ).toBe(4);
  });

  test("constrains pointer and keyboard pan so the image cannot be lost", () => {
    const zoomed = { mode: "manual" as const, scale: 1, x: -250, y: -150 };
    expect(
      panImagePreviewViewport({
        container,
        delta: { x: 10_000, y: 10_000 },
        image,
        viewport: zoomed,
      }),
    ).toMatchObject({ x: 0, y: 0 });
    expect(
      constrainImagePreviewViewport({
        container,
        image,
        viewport: { mode: "manual", scale: 0.1, x: -999, y: -999 },
      }),
    ).toMatchObject({ x: 200, y: 120 });
  });

  test("keeps Fit automatic and preserves a manual normalized focal point", () => {
    const fitted = createFittedImagePreviewViewport(container, image);
    expect(
      preserveImagePreviewViewport({
        nextContainer: { height: 400, width: 400 },
        nextImage: { height: 400, width: 800 },
        previousContainer: container,
        previousImage: image,
        viewport: fitted,
      }),
    ).toEqual({ mode: "fit", scale: 0.5, x: 0, y: 100 });

    const manual = { mode: "manual" as const, scale: 1, x: -250, y: -150 };
    expect(
      preserveImagePreviewViewport({
        nextContainer: { height: 400, width: 400 },
        nextImage: { height: 800, width: 800 },
        previousContainer: container,
        previousImage: image,
        viewport: manual,
      }),
    ).toEqual({ mode: "manual", scale: 1, x: -200, y: -200 });
  });
});
