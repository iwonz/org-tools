export type ScreenshotPixels = {
  channels: number;
  data: Uint8Array;
  height: number;
  width: number;
};

export type ScreenshotRasterNoiseRegion = {
  bottom: number;
  left: number;
  right: number;
  top: number;
};

export type ScreenshotPixelComparison = {
  changedPixels: number;
  matches: boolean;
  reason: "data" | "dimensions" | "match" | "pixel-budget" | "unscoped-delta";
};

export const DEFAULT_RASTER_NOISE_MAX_CHANNEL_DELTA: number;
export const DEFAULT_RASTER_NOISE_PIXEL_BUDGET: number;

export function compareScreenshotPixels(
  reference: ScreenshotPixels,
  candidate: ScreenshotPixels,
  regions: ScreenshotRasterNoiseRegion[],
  options?: { maxChannelDelta?: number; pixelBudget?: number },
): ScreenshotPixelComparison;
