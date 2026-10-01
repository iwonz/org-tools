import { AuthService, sessionCookie } from "@/server/auth-service";
import { json, withApi } from "@/server/http-api";
import { exactRecord, readJson, validatePublicMutationRequest } from "@/server/request-security";

export const dynamic = "force-dynamic";

const parse = (value: unknown): { email: string; password: string; setupToken: string } => {
  const input = exactRecord(value, ["email", "password", "setupToken"]);
  if (
    typeof input.email !== "string" ||
    input.email.length > 320 ||
    typeof input.password !== "string" ||
    input.password.length > 256 ||
    typeof input.setupToken !== "string" ||
    input.setupToken.length > 1024
  ) {
    throw new SyntaxError();
  }
  return { email: input.email, password: input.password, setupToken: input.setupToken };
};

export const POST = (request: Request) =>
  withApi(async () => {
    validatePublicMutationRequest(request);
    const session = await new AuthService().setup(parse(await readJson(request, 8 * 1024)));
    return json(
      { csrfToken: session.csrfToken, mustChangePassword: session.account.mustChangePassword },
      { headers: { "Set-Cookie": sessionCookie(session.sessionToken) }, status: 201 },
    );
  }, request);
