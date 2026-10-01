import { AuthService, sessionCookie } from "@/server/auth-service";
import { json, withApi } from "@/server/http-api";
import { exactRecord, readJson, validatePublicMutationRequest } from "@/server/request-security";

export const dynamic = "force-dynamic";

const parse = (value: unknown): { email: string; password: string } => {
  const input = exactRecord(value, ["email", "password"]);
  if (
    typeof input.email !== "string" ||
    input.email.length > 320 ||
    typeof input.password !== "string" ||
    input.password.length > 256
  )
    throw new SyntaxError();
  return { email: input.email, password: input.password };
};

export const POST = (request: Request) =>
  withApi(async () => {
    validatePublicMutationRequest(request);
    const session = await new AuthService().login(parse(await readJson(request, 8 * 1024)));
    return json(
      { csrfToken: session.csrfToken, mustChangePassword: session.account.mustChangePassword },
      { headers: { "Set-Cookie": sessionCookie(session.sessionToken) } },
    );
  }, request);
