export const DEFAULT_RASTER_NOISE_MAX_CHANNEL_DELTA = 3;
export const DEFAULT_RASTER_NOISE_PIXEL_BUDGET = 256;

const containsPoint = (region, x, y) =>
  x >= region.left && x < region.right && y >= region.top && y < region.bottom;

export function compareScreenshotPixels(
  reference,
  candidate,
  regions,
  {
    maxChannelDelta = DEFAULT_RASTER_NOISE_MAX_CHANNEL_DELTA,
    pixelBudget = DEFAULT_RASTER_NOISE_PIXEL_BUDGET,
  } = {},
) {
  if (
    reference.width !== candidate.width ||
    reference.height !== candidate.height ||
    reference.channels !== candidate.channels ||
    reference.data.length !== candidate.data.length
  ) {
    return { changedPixels: 0, matches: false, reason: "dimensions" };
  }

  let changedPixels = 0;
  let ordinaryChangedPixels = 0;
  let scopedRasterChangedPixels = 0;
  for (let offset = 0; offset < reference.data.length; offset += reference.channels) {
    let pixelChanged = false;
    let hasLargeDelta = false;
    for (let channel = 0; channel < reference.channels; channel += 1) {
      const referenceChannel = reference.data[offset + channel];
      const candidateChannel = candidate.data[offset + channel];
      if (referenceChannel === undefined || candidateChannel === undefined) {
        return { changedPixels, matches: false, reason: "data" };
      }
      const delta = Math.abs(referenceChannel - candidateChannel);
      hasLargeDelta ||= delta > maxChannelDelta;
      pixelChanged ||= delta > 0;
    }
    if (!pixelChanged) continue;

    changedPixels += 1;
    const pixelIndex = offset / reference.channels;
    const x = pixelIndex % reference.width;
    const y = Math.floor(pixelIndex / reference.width);
    const isScopedRasterPixel = regions.some((region) => containsPoint(region, x, y));
    if (hasLargeDelta && !isScopedRasterPixel) {
      return { changedPixels, matches: false, reason: "unscoped-delta" };
    }
    if (isScopedRasterPixel) scopedRasterChangedPixels += 1;
    else ordinaryChangedPixels += 1;
    if (ordinaryChangedPixels > pixelBudget || scopedRasterChangedPixels > pixelBudget) {
      return { changedPixels, matches: false, reason: "pixel-budget" };
    }
  }

  return { changedPixels, matches: true, reason: "match" };
}
