import { EditorImageExportAccessService } from "@/server/editor-image-export-access";
import { authenticateRequest, json, withApi } from "@/server/http-api";

export const dynamic = "force-dynamic";

export const GET = (request: Request) =>
  withApi(async () => {
    const session = await authenticateRequest(request);
    return json(await new EditorImageExportAccessService().listSubjects(session));
  }, request);
