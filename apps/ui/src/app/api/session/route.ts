import type { SessionBootstrap } from "@org-tools/types";
import { createBlankOrgToolsState } from "@/lib/org-file";
import { AuthService } from "@/server/auth-service";
import { AuthorizedProjectionService } from "@/server/authorized-projection";
import { projectAccountUi } from "@/server/authorized-ui";
import { authenticateRequest, json, withApi } from "@/server/http-api";
import { OrganizationRepository } from "@/server/organization-repository";

export const dynamic = "force-dynamic";

export const GET = (request: Request) =>
  withApi(async () => {
    const session = await authenticateRequest(request, { allowPasswordChange: true });
    const repository = new OrganizationRepository();
    const snapshot = await repository.read();
    if (session.account.mustChangePassword) {
      const blank = createBlankOrgToolsState();
      const csrfToken = await new AuthService().rotateCsrf(session);
      const body: SessionBootstrap = {
        access: {
          grants: [],
          isSuperAdmin: false,
          managedDirectUnitIds: [],
          managedSubtreeUnitIds: [],
        },
        account: session.accountSummary,
        csrfToken,
        organizationRevision: snapshot.revision,
        projection: {
          employeeDisplayFormats: blank.organization.employeeDisplayFormats,
          employeeDisplayLineGaps: blank.organization.employeeDisplayLineGaps,
          employeeFieldDefinitions: [],
          employees: [],
          tags: [],
          views: [],
        },
        securityRevision: snapshot.securityRevision,
        ui: blank.ui,
      };
      return json(body);
    }
    const [{ access, projection }, ui, csrfToken] = await Promise.all([
      new AuthorizedProjectionService().build({
        account: session.account,
        organization: snapshot.organization,
        organizationRevision: snapshot.revision,
        role: session.role,
        securityRevision: snapshot.securityRevision,
      }),
      repository.readUi(session.account.id),
      new AuthService().rotateCsrf(session),
    ]);
    const body: SessionBootstrap = {
      access,
      account: session.accountSummary,
      csrfToken,
      organizationRevision: snapshot.revision,
      projection,
      securityRevision: snapshot.securityRevision,
      ui: projectAccountUi({ access, projection, ui }),
    };
    return json(body);
  }, request);
