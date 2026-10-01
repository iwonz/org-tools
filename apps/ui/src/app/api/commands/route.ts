import type { OrganizationDocument, SessionBootstrap } from "@org-tools/types";
import { AuthorizedProjectionService } from "@/server/authorized-projection";
import { authenticateRequest, json, withApi } from "@/server/http-api";
import {
  AuthorizationDeniedError,
  authorizeOrganizationReplacement,
} from "@/server/organization-authorization";
import { OrganizationRepository } from "@/server/organization-repository";
import { mergeAuthorizedProjection } from "@/server/projection-merge";
import { readJson } from "@/server/request-security";

export const dynamic = "force-dynamic";

type ReplaceCommand = {
  expectedOrganizationRevision: number;
  expectedSecurityRevision: number;
  organization: OrganizationDocument;
  type: "organization.patch" | "organization.replace";
};

const parse = (value: unknown): ReplaceCommand => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new SyntaxError();
  const input = value as Record<string, unknown>;
  if (
    Object.keys(input).sort().join("\0") !==
      ["expectedOrganizationRevision", "expectedSecurityRevision", "organization", "type"]
        .sort()
        .join("\0") ||
    (input.type !== "organization.replace" && input.type !== "organization.patch") ||
    !Number.isSafeInteger(input.expectedOrganizationRevision) ||
    !Number.isSafeInteger(input.expectedSecurityRevision) ||
    typeof input.organization !== "object" ||
    input.organization === null
  ) {
    throw new SyntaxError();
  }
  return input as ReplaceCommand;
};

export const POST = (request: Request) =>
  withApi(async () => {
    const session = await authenticateRequest(request, { mutation: true });
    const command = parse(await readJson(request));
    const repository = new OrganizationRepository();
    const current = await repository.read();
    const candidate = await repository.parseOrganization(command.organization);
    const projectionService = new AuthorizedProjectionService();
    const [{ access, projection: baseline }, policies] = await Promise.all([
      projectionService.build({
        account: session.account,
        organization: current.organization,
        organizationRevision: current.revision,
        role: session.role,
        securityRevision: current.securityRevision,
      }),
      projectionService.readPolicies(),
    ]);
    if (command.type === "organization.replace" && !access.isSuperAdmin) {
      throw new AuthorizationDeniedError();
    }
    const organization =
      command.type === "organization.patch"
        ? mergeAuthorizedProjection({
            baseline,
            candidate,
            current: current.organization,
          })
        : candidate;
    authorizeOrganizationReplacement({
      access,
      account: session.account,
      candidate: organization,
      current: current.organization,
      policies,
      role: session.role,
    });
    const snapshot = await repository.replaceOrganization({
      actorAccountId: session.account.id,
      correlationId: crypto.randomUUID(),
      expectedRevision: command.expectedOrganizationRevision,
      expectedSecurityRevision: command.expectedSecurityRevision,
      organization,
      sessionId: session.sessionId,
    });
    const { access: nextAccess, projection } = await new AuthorizedProjectionService().build({
      account: session.account,
      organization: snapshot.organization,
      organizationRevision: snapshot.revision,
      role: session.role,
      securityRevision: snapshot.securityRevision,
    });
    const body: Pick<
      SessionBootstrap,
      "access" | "organizationRevision" | "projection" | "securityRevision"
    > = {
      access: nextAccess,
      organizationRevision: snapshot.revision,
      projection,
      securityRevision: snapshot.securityRevision,
    };
    return json(body);
  }, request);
