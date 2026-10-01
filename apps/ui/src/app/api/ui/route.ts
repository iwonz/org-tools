import { parseOrgToolsUiState } from "@/lib/org-file";
import { AuthorizedProjectionService } from "@/server/authorized-projection";
import { projectAccountUi } from "@/server/authorized-ui";
import { authenticateRequest, json, withApi } from "@/server/http-api";
import { OrganizationRepository } from "@/server/organization-repository";
import { readJson } from "@/server/request-security";

export const dynamic = "force-dynamic";

const parseUiRequest = (value: unknown) => {
  try {
    return parseOrgToolsUiState(value);
  } catch {
    throw new SyntaxError();
  }
};

export const GET = (request: Request) =>
  withApi(async () => {
    const session = await authenticateRequest(request);
    const repository = new OrganizationRepository();
    const snapshot = await repository.read();
    const { access, projection } = await new AuthorizedProjectionService().build({
      account: session.account,
      organization: snapshot.organization,
      organizationRevision: snapshot.revision,
      role: session.role,
      securityRevision: snapshot.securityRevision,
    });
    return json({
      ui: projectAccountUi({
        access,
        projection,
        ui: await repository.readUi(session.account.id),
      }),
    });
  }, request);

export const PUT = (request: Request) =>
  withApi(async () => {
    const session = await authenticateRequest(request, { mutation: true });
    const repository = new OrganizationRepository();
    const snapshot = await repository.read();
    const { access, projection } = await new AuthorizedProjectionService().build({
      account: session.account,
      organization: snapshot.organization,
      organizationRevision: snapshot.revision,
      role: session.role,
      securityRevision: snapshot.securityRevision,
    });
    const result = await repository.writeUi(
      session.account.id,
      session.sessionId,
      projectAccountUi({
        access,
        projection,
        ui: parseUiRequest(await readJson(request)),
      }),
    );
    return json(result);
  }, request);
