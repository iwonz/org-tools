import type { Area } from "react-easy-crop";

import { LocalizedError, uiMessage } from "@/i18n/messages";
import { normalizeAvatarBase64Url } from "@/lib/employee-data";

export const MAX_AVATAR_SOURCE_BYTES = 25 * 1024 * 1024;
export const MAX_AVATAR_SOURCE_PIXELS = 40_000_000;
export const MAX_AVATAR_PREVIEW_DIMENSION = 4096;
export const AVATAR_OUTPUT_SIZE = 512;
export const AVATAR_WEBP_QUALITY = 0.9;

const AVATAR_MEDIA_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type PreparedAvatarSource = {
  height: number;
  url: string;
  width: number;
};

const loadImage = async (url: string): Promise<HTMLImageElement> => {
  const image = new Image();
  image.decoding = "async";
  image.src = url;
  try {
    await image.decode();
  } catch {
    throw new LocalizedError(uiMessage("The avatar image could not be decoded."));
  }
  if (image.naturalWidth <= 0 || image.naturalHeight <= 0) {
    throw new LocalizedError(uiMessage("The avatar image could not be decoded."));
  }
  return image;
};

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality?: number) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new LocalizedError(uiMessage("The avatar crop could not be encoded as WebP.")));
      },
      type,
      quality,
    );
  });

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () =>
      reject(new LocalizedError(uiMessage("The avatar crop could not be encoded as WebP.")));
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new LocalizedError(uiMessage("The avatar crop could not be encoded as WebP.")));
    };
    reader.readAsDataURL(blob);
  });

export const isSupportedAvatarBlob = (blob: Blob): boolean =>
  AVATAR_MEDIA_TYPES.has(blob.type.toLocaleLowerCase("en-US"));

export const prepareAvatarSource = async (blob: Blob): Promise<PreparedAvatarSource> => {
  if (!isSupportedAvatarBlob(blob)) {
    throw new LocalizedError(uiMessage("Choose a PNG, JPEG, or WebP image."));
  }
  if (blob.size > MAX_AVATAR_SOURCE_BYTES) {
    throw new LocalizedError(uiMessage("Avatar source exceeds the 25 MiB limit."));
  }

  const sourceUrl = URL.createObjectURL(blob);
  try {
    const image = await loadImage(sourceUrl);
    if (image.naturalWidth * image.naturalHeight > MAX_AVATAR_SOURCE_PIXELS) {
      throw new LocalizedError(uiMessage("Avatar source exceeds the 40 megapixel limit."));
    }
    const scale = Math.min(
      1,
      MAX_AVATAR_PREVIEW_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight),
    );
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    if (scale === 1) return { height, url: sourceUrl, width };

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new LocalizedError(uiMessage("The avatar image could not be decoded."));
    }
    context.drawImage(image, 0, 0, width, height);
    const previewBlob = await canvasToBlob(canvas, "image/webp", 0.92);
    const previewUrl = URL.createObjectURL(previewBlob);
    URL.revokeObjectURL(sourceUrl);
    return { height, url: previewUrl, width };
  } catch (error) {
    URL.revokeObjectURL(sourceUrl);
    throw error;
  }
};

export const releaseAvatarSource = (source: PreparedAvatarSource | null): void => {
  if (source) URL.revokeObjectURL(source.url);
};

export const avatarDataUrlToBlob = (dataUrl: string): Blob => {
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/i.exec(dataUrl);
  if (!match?.[1] || !match[2]) {
    throw new LocalizedError(uiMessage("Choose a PNG, JPEG, or WebP image."));
  }
  const bytes = Uint8Array.from(atob(match[2]), (character) => character.charCodeAt(0));
  return new Blob([bytes], { type: match[1].toLocaleLowerCase("en-US") });
};

export const readClipboardAvatarBlob = async (): Promise<Blob> => {
  if (!navigator.clipboard?.read) {
    throw new LocalizedError(
      uiMessage("The browser did not allow reading an image from the clipboard."),
    );
  }
  let items: ClipboardItems;
  try {
    items = await navigator.clipboard.read();
  } catch {
    throw new LocalizedError(
      uiMessage("The browser did not allow reading an image from the clipboard."),
    );
  }
  for (const item of items) {
    const type = item.types.find((candidate) => AVATAR_MEDIA_TYPES.has(candidate));
    if (type) return item.getType(type);
  }
  throw new LocalizedError(uiMessage("The clipboard does not contain a supported image."));
};

export const createCroppedAvatarDataUrl = async (
  sourceUrl: string,
  crop: Area,
): Promise<string> => {
  const image = await loadImage(sourceUrl);
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_OUTPUT_SIZE;
  canvas.height = AVATAR_OUTPUT_SIZE;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new LocalizedError(uiMessage("The avatar crop could not be encoded as WebP."));
  }
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    AVATAR_OUTPUT_SIZE,
    AVATAR_OUTPUT_SIZE,
  );
  const blob = await canvasToBlob(canvas, "image/webp", AVATAR_WEBP_QUALITY);
  if (blob.type !== "image/webp") {
    throw new LocalizedError(uiMessage("The avatar crop could not be encoded as WebP."));
  }
  return normalizeAvatarBase64Url(await blobToDataUrl(blob)) ?? "";
};
