import { readJsonObject, withProjectApi } from "@/server/project-api";
import { getProjectRepository } from "@/server/project-repository";

export const dynamic = "force-dynamic";

export const GET = (request: Request) =>
  withProjectApi(request, () => {
    const repository = getProjectRepository();
    return repository.ensureProjectList();
  });

export const POST = (request: Request) =>
  withProjectApi(
    request,
    async () => {
      const body = await readJsonObject(request, ["name"]);
      return getProjectRepository().createProject(body.name);
    },
    { mutation: true, status: 201 },
  );
