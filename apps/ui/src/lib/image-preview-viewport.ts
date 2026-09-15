export type ImagePreviewPoint = { x: number; y: number };
export type ImagePreviewSize = { height: number; width: number };
export type ImagePreviewViewport = ImagePreviewPoint & {
  mode: "fit" | "manual";
  scale: number;
};

export const IMAGE_PREVIEW_MAX_SCALE = 4;
export const IMAGE_PREVIEW_MIN_MANUAL_SCALE = 0.1;

const isPositiveSize = (size: ImagePreviewSize) => size.height > 0 && size.width > 0;
const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

export const getImagePreviewFitScale = (container: ImagePreviewSize, image: ImagePreviewSize) => {
  if (!isPositiveSize(container) || !isPositiveSize(image)) return 1;
  return Math.min(1, container.width / image.width, container.height / image.height);
};

export const getImagePreviewScaleBounds = (
  container: ImagePreviewSize,
  image: ImagePreviewSize,
) => ({
  maximum: IMAGE_PREVIEW_MAX_SCALE,
  minimum: Math.min(IMAGE_PREVIEW_MIN_MANUAL_SCALE, getImagePreviewFitScale(container, image)),
});

export const constrainImagePreviewViewport = ({
  container,
  image,
  viewport,
}: {
  container: ImagePreviewSize;
  image: ImagePreviewSize;
  viewport: ImagePreviewViewport;
}): ImagePreviewViewport => {
  const scaledWidth = image.width * viewport.scale;
  const scaledHeight = image.height * viewport.scale;
  return {
    ...viewport,
    x:
      scaledWidth <= container.width
        ? (container.width - scaledWidth) / 2
        : clamp(viewport.x, container.width - scaledWidth, 0),
    y:
      scaledHeight <= container.height
        ? (container.height - scaledHeight) / 2
        : clamp(viewport.y, container.height - scaledHeight, 0),
  };
};

export const createFittedImagePreviewViewport = (
  container: ImagePreviewSize,
  image: ImagePreviewSize,
): ImagePreviewViewport => {
  const scale = getImagePreviewFitScale(container, image);
  return constrainImagePreviewViewport({
    container,
    image,
    viewport: { mode: "fit", scale, x: 0, y: 0 },
  });
};

export const zoomImagePreviewViewport = ({
  container,
  focalPoint,
  image,
  scale,
  viewport,
}: {
  container: ImagePreviewSize;
  focalPoint: ImagePreviewPoint;
  image: ImagePreviewSize;
  scale: number;
  viewport: ImagePreviewViewport;
}): ImagePreviewViewport => {
  const bounds = getImagePreviewScaleBounds(container, image);
  const nextScale = clamp(scale, bounds.minimum, bounds.maximum);
  const imagePoint = {
    x: (focalPoint.x - viewport.x) / viewport.scale,
    y: (focalPoint.y - viewport.y) / viewport.scale,
  };
  return constrainImagePreviewViewport({
    container,
    image,
    viewport: {
      mode: "manual",
      scale: nextScale,
      x: focalPoint.x - imagePoint.x * nextScale,
      y: focalPoint.y - imagePoint.y * nextScale,
    },
  });
};

export const panImagePreviewViewport = ({
  container,
  delta,
  image,
  viewport,
}: {
  container: ImagePreviewSize;
  delta: ImagePreviewPoint;
  image: ImagePreviewSize;
  viewport: ImagePreviewViewport;
}): ImagePreviewViewport =>
  constrainImagePreviewViewport({
    container,
    image,
    viewport: {
      ...viewport,
      mode: "manual",
      x: viewport.x + delta.x,
      y: viewport.y + delta.y,
    },
  });

export const preserveImagePreviewViewport = ({
  nextContainer,
  nextImage,
  previousContainer,
  previousImage,
  viewport,
}: {
  nextContainer: ImagePreviewSize;
  nextImage: ImagePreviewSize;
  previousContainer: ImagePreviewSize;
  previousImage: ImagePreviewSize;
  viewport: ImagePreviewViewport;
}): ImagePreviewViewport => {
  if (viewport.mode === "fit") return createFittedImagePreviewViewport(nextContainer, nextImage);
  const previousCenter = {
    x: previousContainer.width / 2,
    y: previousContainer.height / 2,
  };
  const normalizedFocalPoint = {
    x: clamp((previousCenter.x - viewport.x) / (previousImage.width * viewport.scale), 0, 1),
    y: clamp((previousCenter.y - viewport.y) / (previousImage.height * viewport.scale), 0, 1),
  };
  const bounds = getImagePreviewScaleBounds(nextContainer, nextImage);
  const scale = clamp(viewport.scale, bounds.minimum, bounds.maximum);
  return constrainImagePreviewViewport({
    container: nextContainer,
    image: nextImage,
    viewport: {
      mode: "manual",
      scale,
      x: nextContainer.width / 2 - normalizedFocalPoint.x * nextImage.width * scale,
      y: nextContainer.height / 2 - normalizedFocalPoint.y * nextImage.height * scale,
    },
  });
};
