import { mcpControlErrorResponse } from "@/server/mcp-control";
import { getMcpRepository } from "@/server/mcp-repository";
import { assertStateApiRequest, jsonResponse, readJsonValue } from "@/server/state-api";
import { getStateRepository } from "@/server/state-repository";

export const dynamic = "force-dynamic";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const GET = (request: Request): Response => {
  try {
    assertStateApiRequest(request);
    const repository = getMcpRepository();
    return jsonResponse({
      activity: repository.listChanges({ limit: 50 }),
      revision: getStateRepository().read().revision,
      settings: repository.getSettings(),
    });
  } catch (error) {
    return mcpControlErrorResponse(error);
  }
};

export const POST = async (request: Request): Promise<Response> => {
  try {
    assertStateApiRequest(request, true);
    const value = await readJsonValue(request);
    if (!isRecord(value) || Object.keys(value).sort().join("\0") !== "action") {
      return jsonResponse({ error: { code: "invalid_input" } }, { status: 400 });
    }
    const repository = getMcpRepository();
    if (value.action === "enable") {
      const settings = repository.setEnabled(true);
      return jsonResponse({ settings, token: repository.revealToken() });
    }
    if (value.action === "disable") return jsonResponse({ settings: repository.setEnabled(false) });
    if (value.action === "reveal") return jsonResponse({ token: repository.revealToken() });
    if (value.action === "rotate") return jsonResponse(repository.rotateToken());
    return jsonResponse({ error: { code: "invalid_input" } }, { status: 400 });
  } catch (error) {
    return mcpControlErrorResponse(error);
  }
};
