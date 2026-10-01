import { AuthService } from "@/server/auth-service";
import { authenticateRequest, clearCookieHeaders, json, withApi } from "@/server/http-api";

export const dynamic = "force-dynamic";

export const POST = (request: Request) =>
  withApi(async () => {
    const session = await authenticateRequest(request, {
      allowPasswordChange: true,
      mutation: true,
    });
    await new AuthService().logout(session);
    return json({ ok: true }, { headers: clearCookieHeaders() });
  }, request);
