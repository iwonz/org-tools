import {
  assertMcpTransportRequest,
  McpTransportError,
  mcpTransportErrorResponse,
} from "@/server/mcp-security";
import { orgToolsMcpHandler } from "@/server/mcp-server";

export const dynamic = "force-dynamic";

export const POST = async (request: Request): Promise<Response> => {
  try {
    assertMcpTransportRequest(request);
    const response = await orgToolsMcpHandler.fetch(request);
    const headers = new Headers(response.headers);
    headers.set("Cache-Control", "no-store");
    headers.delete("Access-Control-Allow-Origin");
    headers.delete("Access-Control-Allow-Credentials");
    return new Response(response.body, {
      headers,
      status: response.status,
      statusText: response.statusText,
    });
  } catch (error) {
    return mcpTransportErrorResponse(error);
  }
};

const methodNotAllowed = () =>
  mcpTransportErrorResponse(new McpTransportError("Method is not allowed.", 405));

export const GET = methodNotAllowed;
export const DELETE = methodNotAllowed;
export const OPTIONS = methodNotAllowed;
