import { randomUUID } from "node:crypto";
import type {
  EditorImageExportProjectionRequest,
  EditorImageExportProjectionResponse,
  EditorImageExportSubjectSummary,
  EditorImageExportSubjectsResponse,
  OrganizationDocument,
} from "@org-tools/types";
import type { Pool, PoolClient } from "pg";

import { type AuthenticatedSession, readAccountWithRole } from "@/server/auth-service";
import { AuthorizedProjectionService } from "@/server/authorized-projection";
import { assertActiveSession, getDatabasePool, withDatabaseTransaction } from "@/server/database";
import { AuthorizationDeniedError } from "@/server/organization-authorization";
import { appendAuditEvent, readOrganizationSnapshot } from "@/server/organization-repository";
import { buildEffectiveAccess, hasPermission } from "@/server/permissions";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

const exactKeys = (input: Record<string, unknown>, expected: readonly string[]): boolean => {
  const actual = Object.keys(input).sort();
  const sortedExpected = [...expected].sort();
  return (
    actual.length === sortedExpected.length &&
    actual.every((key, index) => key === sortedExpected[index])
  );
};

export const parseEditorImageExportProjectionRequest = (
  value: unknown,
): EditorImageExportProjectionRequest => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new SyntaxError();
  const input = value as Record<string, unknown>;
  const keys =
    input.rootUnitId === undefined
      ? ["accountId", "viewId"]
      : ["accountId", "rootUnitId", "viewId"];
  if (
    !exactKeys(input, keys) ||
    typeof input.accountId !== "string" ||
    typeof input.viewId !== "string" ||
    !UUID_PATTERN.test(input.accountId) ||
    !UUID_PATTERN.test(input.viewId) ||
    (input.rootUnitId !== undefined &&
      (typeof input.rootUnitId !== "string" || !UUID_PATTERN.test(input.rootUnitId)))
  ) {
    throw new SyntaxError();
  }
  return input as EditorImageExportProjectionRequest;
};

const assertExportAs = (
  session: AuthenticatedSession,
  organization: OrganizationDocument,
): void => {
  const access = buildEffectiveAccess({
    directGrants: session.account.directGrants,
    employeeId: session.account.employeeId,
    organization,
    role: session.role,
  });
  if (
    !hasPermission(access, "editorImageExport.create") ||
    !hasPermission(access, "editorImageExport.exportAs")
  ) {
    throw new AuthorizationDeniedError();
  }
};

type SubjectRow = {
  email: string;
  employee_id: string | null;
  id: string;
  role_name: string;
};

const subjectSummary = (
  row: SubjectRow,
  organization: OrganizationDocument,
): EditorImageExportSubjectSummary => {
  const employee = row.employee_id
    ? organization.employees.find((candidate) => candidate.id === row.employee_id)
    : null;
  return {
    accountId: row.id,
    displayName: (employee ? `${employee.firstName} ${employee.lastName}`.trim() : "") || row.email,
    email: row.email,
    roleName: row.role_name,
  };
};

const readActiveSubjects = async (
  client: PoolClient,
  organization: OrganizationDocument,
): Promise<EditorImageExportSubjectSummary[]> => {
  const result = await client.query<SubjectRow>(
    `SELECT a.id::text, a.email, a.employee_id::text, r.name AS role_name
     FROM accounts a JOIN roles r ON r.id = a.role_id
     WHERE a.status = 'active'
     ORDER BY lower(a.email), a.id`,
  );
  return result.rows.map((row) => subjectSummary(row, organization));
};

const emptyProjection = (
  projection: EditorImageExportProjectionResponse["projection"],
): EditorImageExportProjectionResponse["projection"] => ({
  employeeDisplayFormats: projection.employeeDisplayFormats,
  employeeDisplayLineGaps: projection.employeeDisplayLineGaps,
  employeeFieldDefinitions: [],
  employees: [],
  tags: [],
  views: [],
});

export class EditorImageExportAccessService {
  constructor(private readonly pool: Pool = getDatabasePool()) {}

  async listSubjects(session: AuthenticatedSession): Promise<EditorImageExportSubjectsResponse> {
    return withDatabaseTransaction(
      async (client) => {
        await assertActiveSession(client, session.account.id, session.sessionId);
        const snapshot = await readOrganizationSnapshot(client);
        assertExportAs(session, snapshot.organization);
        return { subjects: await readActiveSubjects(client, snapshot.organization) };
      },
      this.pool,
      { isolation: "repeatable read", readOnly: true },
    );
  }

  async createProjection(
    session: AuthenticatedSession,
    request: EditorImageExportProjectionRequest,
  ): Promise<EditorImageExportProjectionResponse> {
    return withDatabaseTransaction(
      async (client) => {
        await assertActiveSession(client, session.account.id, session.sessionId);
        const snapshot = await readOrganizationSnapshot(client);
        assertExportAs(session, snapshot.organization);
        const target = await readAccountWithRole(client, request.accountId);
        if (target?.account.status !== "active") throw new AuthorizationDeniedError();

        const result = await new AuthorizedProjectionService(client).build({
          account: target.account,
          organization: snapshot.organization,
          organizationRevision: snapshot.revision,
          role: target.role,
          securityRevision: snapshot.securityRevision,
        });
        const view = result.projection.views.find((candidate) => candidate.id === request.viewId);
        const available = Boolean(
          view &&
            (request.rootUnitId === undefined ||
              view.structure.units.some((unit) => unit.id === request.rootUnitId)),
        );
        const projection = available
          ? { ...result.projection, views: view ? [view] : [] }
          : emptyProjection(result.projection);
        const employee = target.account.employeeId
          ? snapshot.organization.employees.find(
              (candidate) => candidate.id === target.account.employeeId,
            )
          : null;
        const subject: EditorImageExportSubjectSummary = {
          accountId: target.account.id,
          displayName:
            (employee ? `${employee.firstName} ${employee.lastName}`.trim() : "") ||
            target.account.email,
          email: target.account.email,
          roleName: target.role.name,
        };
        await appendAuditEvent(client, {
          action: "editor.image_export.project_as",
          actorAccountId: session.account.id,
          correlationId: randomUUID(),
          result: "succeeded",
          targetIds: [
            request.accountId,
            request.viewId,
            ...(request.rootUnitId ? [request.rootUnitId] : []),
          ],
        });
        return {
          available,
          organizationRevision: snapshot.revision,
          projection,
          securityRevision: snapshot.securityRevision,
          subject,
        };
      },
      this.pool,
      { isolation: "repeatable read" },
    );
  }
}
