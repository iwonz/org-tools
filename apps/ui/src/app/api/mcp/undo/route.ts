import { mcpControlErrorResponse } from "@/server/mcp-control";
import { getMcpRepository } from "@/server/mcp-repository";
import { assertStateApiRequest, jsonResponse, readJsonValue } from "@/server/state-api";

export const dynamic = "force-dynamic";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const POST = async (request: Request): Promise<Response> => {
  try {
    assertStateApiRequest(request, true);
    const value = await readJsonValue(request);
    if (
      !isRecord(value) ||
      Object.keys(value).sort().join("\0") !== ["changeId", "expectedRevision"].sort().join("\0") ||
      typeof value.changeId !== "string" ||
      !Number.isSafeInteger(value.expectedRevision) ||
      (value.expectedRevision as number) < 1
    ) {
      return jsonResponse({ error: { code: "invalid_input" } }, { status: 400 });
    }
    const repository = getMcpRepository();
    const preview = repository.previewUndo({
      actor: "local-user",
      changeId: value.changeId,
      expectedRevision: value.expectedRevision as number,
    });
    return jsonResponse({ preview, result: repository.applyPreview(preview.previewId) });
  } catch (error) {
    return mcpControlErrorResponse(error, { expectedUndoConflict: true });
  }
};
