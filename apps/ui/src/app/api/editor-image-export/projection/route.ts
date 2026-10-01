import {
  EditorImageExportAccessService,
  parseEditorImageExportProjectionRequest,
} from "@/server/editor-image-export-access";
import { authenticateRequest, json, withApi } from "@/server/http-api";
import { readJson } from "@/server/request-security";

export const dynamic = "force-dynamic";

export const POST = (request: Request) =>
  withApi(async () => {
    const session = await authenticateRequest(request, { mutation: true });
    const input = parseEditorImageExportProjectionRequest(await readJson(request, 4096));
    return json(await new EditorImageExportAccessService().createProjection(session, input));
  }, request);
