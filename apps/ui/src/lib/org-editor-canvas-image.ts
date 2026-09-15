import {
  ORG_EDITOR_CANVAS_IMAGE_MAX_BYTES,
  ORG_EDITOR_CANVAS_IMAGE_MAX_PIXELS,
} from "@/lib/org-editor-canvas";

export type OrgEditorCanvasImageSource = {
  bytes: Uint8Array;
  dataUrl: string;
  height: number;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  width: number;
};

const DATA_URL_PATTERN = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/u;

const decodeBase64 = (value: string) => {
  if (value.length % 4 !== 0) return null;
  try {
    const decoded = globalThis.atob(value);
    if (globalThis.btoa(decoded) !== value) return null;
    return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
};

const readUint16LittleEndian = (bytes: Uint8Array, offset: number) =>
  (bytes[offset] ?? 0) | ((bytes[offset + 1] ?? 0) << 8);
const readUint16BigEndian = (bytes: Uint8Array, offset: number) =>
  ((bytes[offset] ?? 0) << 8) | (bytes[offset + 1] ?? 0);
const readUint24LittleEndian = (bytes: Uint8Array, offset: number) =>
  (bytes[offset] ?? 0) | ((bytes[offset + 1] ?? 0) << 8) | ((bytes[offset + 2] ?? 0) << 16);
const ascii = (bytes: Uint8Array, offset: number, length: number) =>
  String.fromCharCode(...bytes.slice(offset, offset + length));

const readPngDimensions = (bytes: Uint8Array) => {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (bytes.length < 24 || signature.some((value, index) => bytes[index] !== value)) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { height: view.getUint32(20), width: view.getUint32(16) };
};

const readJpegDimensions = (bytes: Uint8Array) => {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 8 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = bytes[offset + 1] ?? 0;
    offset += 2;
    if (marker === 0xd8 || marker === 0xd9) continue;
    const length = readUint16BigEndian(bytes, offset);
    if (length < 2 || offset + length > bytes.length) return null;
    if (
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf)
    ) {
      return {
        height: readUint16BigEndian(bytes, offset + 3),
        width: readUint16BigEndian(bytes, offset + 5),
      };
    }
    offset += length;
  }
  return null;
};

const readWebpDimensions = (bytes: Uint8Array) => {
  if (bytes.length < 30 || ascii(bytes, 0, 4) !== "RIFF" || ascii(bytes, 8, 4) !== "WEBP") {
    return null;
  }
  const chunk = ascii(bytes, 12, 4);
  if (chunk === "VP8X") {
    return {
      height: readUint24LittleEndian(bytes, 27) + 1,
      width: readUint24LittleEndian(bytes, 24) + 1,
    };
  }
  if (chunk === "VP8L" && bytes[20] === 0x2f) {
    const bits =
      (bytes[21] ?? 0) |
      ((bytes[22] ?? 0) << 8) |
      ((bytes[23] ?? 0) << 16) |
      ((bytes[24] ?? 0) << 24);
    return { height: ((bits >> 14) & 0x3fff) + 1, width: (bits & 0x3fff) + 1 };
  }
  if (chunk === "VP8 " && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) {
    return {
      height: readUint16LittleEndian(bytes, 28) & 0x3fff,
      width: readUint16LittleEndian(bytes, 26) & 0x3fff,
    };
  }
  return null;
};

export const parseOrgEditorCanvasImageDataUrl = (
  dataUrl: string,
): OrgEditorCanvasImageSource | null => {
  const match = DATA_URL_PATTERN.exec(dataUrl);
  if (!match) return null;
  const bytes = decodeBase64(match[2] ?? "");
  if (!bytes || bytes.byteLength === 0 || bytes.byteLength > ORG_EDITOR_CANVAS_IMAGE_MAX_BYTES) {
    return null;
  }
  const mimeType = `image/${match[1]}` as OrgEditorCanvasImageSource["mimeType"];
  const dimensions =
    mimeType === "image/png"
      ? readPngDimensions(bytes)
      : mimeType === "image/jpeg"
        ? readJpegDimensions(bytes)
        : readWebpDimensions(bytes);
  if (
    !dimensions ||
    dimensions.width <= 0 ||
    dimensions.height <= 0 ||
    dimensions.width * dimensions.height > ORG_EDITOR_CANVAS_IMAGE_MAX_PIXELS
  ) {
    return null;
  }
  return { bytes, dataUrl, height: dimensions.height, mimeType, width: dimensions.width };
};

export const loadOrgEditorCanvasImageFile = async (
  file: Blob,
): Promise<OrgEditorCanvasImageSource | null> => {
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    file.size > ORG_EDITOR_CANVAS_IMAGE_MAX_BYTES
  ) {
    return null;
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return parseOrgEditorCanvasImageDataUrl(`data:${file.type};base64,${globalThis.btoa(binary)}`);
};
