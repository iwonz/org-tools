import { assertProjectId, readJsonObject, withProjectApi } from "@/server/project-api";
import { getProjectRepository } from "@/server/project-repository";

type RouteContext = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export const GET = (request: Request, context: RouteContext) =>
  withProjectApi(request, async () => {
    const { id } = await context.params;
    assertProjectId(id);
    return getProjectRepository().openProject(id);
  });

export const PATCH = (request: Request, context: RouteContext) =>
  withProjectApi(
    request,
    async () => {
      const { id } = await context.params;
      assertProjectId(id);
      const body = await readJsonObject(request, ["name"]);
      return getProjectRepository().renameProject(id, body.name);
    },
    { mutation: true },
  );

export const DELETE = (request: Request, context: RouteContext) =>
  withProjectApi(
    request,
    async () => {
      const { id } = await context.params;
      assertProjectId(id);
      await readJsonObject(request, []);
      return getProjectRepository().deleteProject(id);
    },
    { mutation: true },
  );
