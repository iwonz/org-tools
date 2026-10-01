import { timingSafeEqual } from "node:crypto";
import { digestToken } from "@/server/auth-crypto";
import { loadRuntimeConfig } from "@/server/runtime-config";

export class RequestSecurityError extends Error {
  constructor(readonly code: "csrf" | "fetch_metadata" | "media_type" | "origin") {
    super(code);
    this.name = "RequestSecurityError";
  }
}

export const validatePublicMutationRequest = (request: Request): void => {
  const config = loadRuntimeConfig();
  if (request.headers.get("origin") !== config.publicOrigin)
    throw new RequestSecurityError("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite !== "same-origin") throw new RequestSecurityError("fetch_metadata");
  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (contentType !== "application/json") throw new RequestSecurityError("media_type");
};

export const validateMutationRequest = (
  request: Request,
  csrfHashes: readonly [Buffer, Buffer | null],
): void => {
  validatePublicMutationRequest(request);
  const token = request.headers.get("x-org-tools-csrf");
  const received = token ? digestToken(token) : Buffer.alloc(csrfHashes[0].length);
  const matches = csrfHashes.some(
    (hash) => hash !== null && received.length === hash.length && timingSafeEqual(received, hash),
  );
  if (!matches) {
    throw new RequestSecurityError("csrf");
  }
};

export const parseCookie = (request: Request, name: string): string | null => {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0 || part.slice(0, separator).trim() !== name) continue;
    try {
      return decodeURIComponent(part.slice(separator + 1).trim());
    } catch {
      return null;
    }
  }
  return null;
};

export const readJson = async (
  request: Request,
  maximumBytes = 64 * 1024 * 1024,
): Promise<unknown> => {
  const declaredLength = request.headers.get("content-length");
  if (
    declaredLength !== null &&
    (!/^\d+$/u.test(declaredLength) || Number(declaredLength) > maximumBytes)
  ) {
    throw new SyntaxError();
  }
  if (!request.body) throw new SyntaxError();
  let source = "";
  try {
    const reader = request.body.getReader();
    const decoder = new TextDecoder("utf-8", { fatal: true });
    let bytes = 0;
    const chunks: string[] = [];
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maximumBytes) {
        await reader.cancel();
        throw new SyntaxError();
      }
      chunks.push(decoder.decode(value, { stream: true }));
    }
    chunks.push(decoder.decode());
    source = chunks.join("");
  } catch {
    throw new RequestSecurityError("media_type");
  }
  return JSON.parse(source);
};

export const exactRecord = (value: unknown, keys: readonly string[]): Record<string, unknown> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new SyntaxError();
  const input = value as Record<string, unknown>;
  if (Object.keys(input).sort().join("\0") !== [...keys].sort().join("\0")) {
    throw new SyntaxError();
  }
  return input;
};
