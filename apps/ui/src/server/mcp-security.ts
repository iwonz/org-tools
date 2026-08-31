import { getMcpRepository } from "@/server/mcp-repository";

const LOOPBACK_HOSTNAMES = new Set(["127.0.0.1", "::1", "[::1]", "localhost"]);

export class McpTransportError extends Error {
  readonly status: 400 | 401 | 403 | 405 | 415;

  constructor(message: string, status: 400 | 401 | 403 | 405 | 415) {
    super(message);
    this.name = "McpTransportError";
    this.status = status;
  }
}

const parseHost = (host: string): string => {
  try {
    return new URL(`http://${host}`).hostname;
  } catch {
    throw new McpTransportError("Invalid Host.", 403);
  }
};

export const assertMcpTransportRequest = (request: Request): void => {
  if (request.method !== "POST") throw new McpTransportError("Method is not allowed.", 405);
  const host = request.headers.get("host");
  if (!host || !LOOPBACK_HOSTNAMES.has(parseHost(host))) {
    throw new McpTransportError("MCP is loopback-only.", 403);
  }
  const originValue = request.headers.get("origin");
  if (originValue) {
    try {
      const origin = new URL(originValue);
      if (
        origin.host !== host ||
        !LOOPBACK_HOSTNAMES.has(origin.hostname) ||
        (origin.protocol !== "http:" && origin.protocol !== "https:")
      ) {
        throw new Error("Origin mismatch.");
      }
    } catch {
      throw new McpTransportError("Origin must match the loopback Host.", 403);
    }
  }
  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (contentType !== "application/json") {
    throw new McpTransportError("Expected application/json.", 415);
  }
  const authorization = request.headers.get("authorization");
  const match = /^Bearer ([^\s]+)$/u.exec(authorization ?? "");
  if (!match || !getMcpRepository().authenticate(match[1] ?? "")) {
    throw new McpTransportError("Invalid MCP credentials.", 401);
  }
};

export const mcpTransportErrorResponse = (error: unknown): Response => {
  const status = error instanceof McpTransportError ? error.status : 503;
  const headers = new Headers({
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
  });
  if (status === 401) headers.set("WWW-Authenticate", "Bearer");
  if (status === 405) headers.set("Allow", "POST");
  return new Response(
    JSON.stringify({ error: status === 401 ? "unauthorized" : "invalid_request" }),
    {
      headers,
      status,
    },
  );
};
