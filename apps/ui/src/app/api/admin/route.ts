import { AdminService, parseAdminCommand } from "@/server/admin-service";
import { authenticateRequest, json, withApi } from "@/server/http-api";
import { readJson } from "@/server/request-security";

export const dynamic = "force-dynamic";

export const GET = (request: Request) =>
  withApi(
    async () => json(await new AdminService().read(await authenticateRequest(request))),
    request,
  );

export const POST = (request: Request) =>
  withApi(async () => {
    const session = await authenticateRequest(request, { mutation: true });
    const value = await readJson(request, 1024 * 1024);
    return json(await new AdminService().execute(session, parseAdminCommand(value)));
  }, request);
