import { AuthService } from "@/server/auth-service";
import { json, withApi } from "@/server/http-api";

export const dynamic = "force-dynamic";

export const GET = (request: Request) =>
  withApi(
    async () => json({ kind: (await new AuthService().needsSetup()) ? "setup" : "login" }),
    request,
  );
