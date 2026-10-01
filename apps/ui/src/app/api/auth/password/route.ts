import { AuthService } from "@/server/auth-service";
import { authenticateRequest, json, withApi } from "@/server/http-api";
import { exactRecord, readJson } from "@/server/request-security";

export const dynamic = "force-dynamic";

export const POST = (request: Request) =>
  withApi(async () => {
    const session = await authenticateRequest(request, {
      allowPasswordChange: true,
      mutation: true,
    });
    const input = exactRecord(await readJson(request, 4 * 1024), ["currentPassword", "password"]);
    if (typeof input.currentPassword !== "string" || typeof input.password !== "string")
      throw new SyntaxError();
    await new AuthService().changePassword(session, input.currentPassword, input.password);
    return json({ ok: true });
  }, request);
