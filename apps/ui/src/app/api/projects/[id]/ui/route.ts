import { assertProjectId, readJsonObject, withProjectApi } from "@/server/project-api";
import { getProjectRepository } from "@/server/project-repository";

type RouteContext = { params: Promise<{ id: string }> };

export const PUT = (request: Request, context: RouteContext) =>
  withProjectApi(
    request,
    async () => {
      const { id } = await context.params;
      assertProjectId(id);
      const body = await readJsonObject(request, ["ui"]);
      return { ui: getProjectRepository().saveUi(id, body.ui) };
    },
    { mutation: true },
  );
