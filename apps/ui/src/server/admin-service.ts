import { randomUUID } from "node:crypto";
import type {
  AccessAudience,
  AccountId,
  OrganizationDocument,
  PermissionGrant,
  ResourcePolicyKind,
  RoleId,
  StoredResourcePolicy,
} from "@org-tools/types";
import { PERMISSIONS } from "@org-tools/types/security";
import type { Pool, PoolClient } from "pg";
import {
  createTemporaryPassword,
  hashPassword,
  isPlausibleAccountEmail,
  normalizeAccountEmail,
} from "@/server/auth-crypto";
import { type AuthenticatedSession, AuthService } from "@/server/auth-service";
import { parseAccessAudience } from "@/server/authorized-projection";
import { assertActiveSession, getDatabasePool, withDatabaseTransaction } from "@/server/database";
import { AuthorizationDeniedError } from "@/server/organization-authorization";
import {
  appendAuditEvent,
  OrganizationRepository,
  parseOrganizationDocument,
} from "@/server/organization-repository";
import { isValidPermissionGrant, SUPER_ADMIN_ROLE_ID } from "@/server/permissions";

type AdminCommand =
  | { employeeId: string | null; email: string; roleId: RoleId; type: "user.create" }
  | {
      accountId: AccountId;
      directGrants: PermissionGrant[];
      roleId: RoleId;
      type: "user.access.update";
    }
  | { accountId: AccountId; active: boolean; type: "user.active.update" }
  | { accountId: AccountId; type: "user.password.reset" }
  | { accountId: AccountId; type: "user.sessions.revoke" }
  | { accountId: AccountId; currentPassword: string; email: string; type: "user.email.update" }
  | { grants: PermissionGrant[]; name: string; type: "role.create" }
  | { grants: PermissionGrant[]; name: string; roleId: RoleId; type: "role.update" }
  | { roleId: RoleId; type: "role.delete" }
  | {
      hideEmployeesWhenUnread: boolean;
      read: AccessAudience;
      resourceId: string;
      resourceKind: ResourcePolicyKind;
      type: "policy.update";
      write: AccessAudience;
    };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const RESOURCE_POLICY_KINDS = new Set<ResourcePolicyKind>([
  "employeeField",
  "staffingSlot",
  "tag",
  "unit",
  "view",
]);
const PERMISSION_SET = new Set<string>(PERMISSIONS);
const SCOPE_SET = new Set(["all", "managedDirect", "managedSubtree", "self"]);

const record = (value: unknown): Record<string, unknown> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new SyntaxError();
  return value as Record<string, unknown>;
};

const exactKeys = (value: Record<string, unknown>, keys: readonly string[]): void => {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new SyntaxError();
  }
};

const string = (value: unknown, maximum = 320): string => {
  if (typeof value !== "string" || value.length === 0 || value.length > maximum)
    throw new SyntaxError();
  return value;
};

const uuid = <T extends string>(value: unknown): T => {
  const parsed = string(value, 36);
  if (!UUID_PATTERN.test(parsed)) throw new SyntaxError();
  return parsed as T;
};

const parseGrant = (value: unknown): PermissionGrant => {
  const input = record(value);
  exactKeys(input, ["permission", "scope"]);
  if (!PERMISSION_SET.has(String(input.permission)) || !SCOPE_SET.has(String(input.scope))) {
    throw new SyntaxError();
  }
  const grant = input as PermissionGrant;
  if (!isValidPermissionGrant(grant)) throw new SyntaxError();
  return grant;
};

const parseGrants = (value: unknown): PermissionGrant[] => {
  if (!Array.isArray(value) || value.length > 256) throw new SyntaxError();
  return value.map(parseGrant);
};

const parseAudienceInput = (value: unknown): AccessAudience => {
  const input = record(value);
  exactKeys(input, ["allAuthenticated", "relations", "roleIds", "userIds"]);
  return parseAccessAudience(input);
};

export const parseAdminCommand = (value: unknown): AdminCommand => {
  const input = record(value);
  const type = string(input.type, 64);
  if (type === "user.create") {
    exactKeys(input, ["employeeId", "email", "roleId", "type"]);
    return {
      employeeId: input.employeeId === null ? null : uuid(input.employeeId),
      email: string(input.email),
      roleId: uuid(input.roleId),
      type,
    };
  }
  if (type === "user.access.update") {
    exactKeys(input, ["accountId", "directGrants", "roleId", "type"]);
    return {
      accountId: uuid(input.accountId),
      directGrants: parseGrants(input.directGrants),
      roleId: uuid(input.roleId),
      type,
    };
  }
  if (type === "user.active.update") {
    exactKeys(input, ["accountId", "active", "type"]);
    if (typeof input.active !== "boolean") throw new SyntaxError();
    return { accountId: uuid(input.accountId), active: input.active, type };
  }
  if (type === "user.password.reset" || type === "user.sessions.revoke") {
    exactKeys(input, ["accountId", "type"]);
    return { accountId: uuid(input.accountId), type };
  }
  if (type === "user.email.update") {
    exactKeys(input, ["accountId", "currentPassword", "email", "type"]);
    return {
      accountId: uuid(input.accountId),
      currentPassword: string(input.currentPassword, 512),
      email: string(input.email),
      type,
    };
  }
  if (type === "role.create") {
    exactKeys(input, ["grants", "name", "type"]);
    return { grants: parseGrants(input.grants), name: string(input.name, 120), type };
  }
  if (type === "role.update") {
    exactKeys(input, ["grants", "name", "roleId", "type"]);
    return {
      grants: parseGrants(input.grants),
      name: string(input.name, 120),
      roleId: uuid(input.roleId),
      type,
    };
  }
  if (type === "role.delete") {
    exactKeys(input, ["roleId", "type"]);
    return { roleId: uuid(input.roleId), type };
  }
  if (type === "policy.update") {
    exactKeys(input, [
      "hideEmployeesWhenUnread",
      "read",
      "resourceId",
      "resourceKind",
      "type",
      "write",
    ]);
    if (
      typeof input.hideEmployeesWhenUnread !== "boolean" ||
      !RESOURCE_POLICY_KINDS.has(input.resourceKind as ResourcePolicyKind)
    ) {
      throw new SyntaxError();
    }
    return {
      hideEmployeesWhenUnread: input.hideEmployeesWhenUnread,
      read: parseAudienceInput(input.read),
      resourceId: string(input.resourceId),
      resourceKind: input.resourceKind as ResourcePolicyKind,
      type,
      write: parseAudienceInput(input.write),
    };
  }
  throw new SyntaxError();
};

const assertSuperAdmin = (session: AuthenticatedSession): void => {
  if (session.role.systemKey !== "superAdmin") throw new AuthorizationDeniedError();
};

const validateGrants = (grants: readonly PermissionGrant[]): void => {
  const keys = grants.map((grant) => `${grant.permission}\0${grant.scope}`);
  if (
    grants.length > 256 ||
    new Set(keys).size !== keys.length ||
    grants.some((grant) => !isValidPermissionGrant(grant))
  ) {
    throw new SyntaxError();
  }
};

const validateAudience = (audience: AccessAudience): AccessAudience =>
  parseAccessAudience(audience);

const audienceIsWithin = (child: AccessAudience, parent: AccessAudience): boolean => {
  if (parent.allAuthenticated) return true;
  if (child.allAuthenticated) return false;
  return (
    child.relations.every(
      (relation) =>
        parent.relations.includes(relation) ||
        (relation === "managedDirect" && parent.relations.includes("managedSubtree")),
    ) &&
    child.roleIds.every((roleId) => parent.roleIds.includes(roleId)) &&
    child.userIds.every((userId) => parent.userIds.includes(userId))
  );
};

const authenticatedAudience = (): AccessAudience => ({
  allAuthenticated: true,
  relations: [],
  roleIds: [],
  userIds: [],
});

const validateAudienceReferences = async (
  client: PoolClient,
  audience: AccessAudience,
): Promise<void> => {
  if (audience.roleIds.length > 0) {
    const roles = await client.query<{ id: string }>(
      "SELECT id::text FROM roles WHERE id = ANY($1::uuid[])",
      [audience.roleIds],
    );
    if (roles.rowCount !== new Set(audience.roleIds).size) throw new SyntaxError();
  }
  if (audience.userIds.length > 0) {
    const accounts = await client.query<{ id: string }>(
      "SELECT id::text FROM accounts WHERE id = ANY($1::uuid[])",
      [audience.userIds],
    );
    if (accounts.rowCount !== new Set(audience.userIds).size) throw new SyntaxError();
  }
};

const findPolicyParent = (
  organization: OrganizationDocument,
  kind: ResourcePolicyKind,
  resourceId: string,
): { kind: ResourcePolicyKind; resourceId: string } | null | undefined => {
  if (kind === "employeeField") {
    const builtIn =
      resourceId.startsWith("builtin:") &&
      [
        "avatarBase64Url",
        "birthday",
        "email",
        "firstName",
        "gender",
        "lastName",
        "phone",
        "profileUrl",
        "tags",
        "username",
      ].includes(resourceId.slice("builtin:".length));
    return builtIn || organization.employeeFieldDefinitions.some((field) => field.id === resourceId)
      ? null
      : undefined;
  }
  if (kind === "tag") {
    return organization.tags.some((tag) => tag.id === resourceId) ? null : undefined;
  }
  if (kind === "view") {
    return organization.views.some((view) => view.id === resourceId) ? null : undefined;
  }
  for (const view of organization.views) {
    const unit = view.structure.units.find((candidate) => candidate.id === resourceId);
    if (kind === "unit" && unit) {
      return unit.parentId ? { kind: "unit", resourceId: unit.parentId } : null;
    }
    if (kind === "staffingSlot") {
      const owner = view.structure.units.find((candidate) =>
        candidate.staffingSlots.some((slot) => slot.id === resourceId),
      );
      if (owner) return { kind: "unit", resourceId: owner.id };
    }
  }
  return undefined;
};

const readPolicyAudience = async (
  client: PoolClient,
  parent: { kind: ResourcePolicyKind; resourceId: string },
): Promise<{ read: AccessAudience; write: AccessAudience }> => {
  const result = await client.query<{ read_audience: unknown; write_audience: unknown }>(
    `SELECT read_audience, write_audience FROM resource_policies
     WHERE resource_kind = $1 AND resource_id = $2`,
    [parent.kind, parent.resourceId],
  );
  const row = result.rows[0];
  return row
    ? {
        read: parseAccessAudience(row.read_audience),
        write: parseAccessAudience(row.write_audience),
      }
    : { read: authenticatedAudience(), write: authenticatedAudience() };
};

const validateDescendantPolicies = async (
  client: PoolClient,
  organization: OrganizationDocument,
  parent: StoredResourcePolicy,
): Promise<void> => {
  const result = await client.query<{
    read_audience: unknown;
    resource_id: string;
    resource_kind: ResourcePolicyKind;
    write_audience: unknown;
  }>(
    `SELECT resource_kind, resource_id, read_audience, write_audience
     FROM resource_policies`,
  );
  for (const row of result.rows) {
    if (row.resource_kind === parent.resourceKind && row.resource_id === parent.resourceId)
      continue;
    let ancestor = findPolicyParent(organization, row.resource_kind, row.resource_id);
    const visited = new Set<string>();
    let isDescendant = false;
    while (ancestor) {
      const key = `${ancestor.kind}:${ancestor.resourceId}`;
      if (visited.has(key)) throw new AuthorizationDeniedError();
      visited.add(key);
      if (ancestor.kind === parent.resourceKind && ancestor.resourceId === parent.resourceId) {
        isDescendant = true;
        break;
      }
      ancestor = findPolicyParent(organization, ancestor.kind, ancestor.resourceId);
      if (ancestor === undefined) throw new AuthorizationDeniedError();
    }
    if (!isDescendant) continue;
    if (
      !audienceIsWithin(parseAccessAudience(row.read_audience), parent.read) ||
      !audienceIsWithin(parseAccessAudience(row.write_audience), parent.write)
    ) {
      throw new AuthorizationDeniedError();
    }
  }
};

const touchSecurity = async (client: PoolClient): Promise<void> => {
  const repository = new OrganizationRepository();
  await repository.incrementSecurityRevision(client, "security");
};

const assertLastSuperAdmin = async (
  client: PoolClient,
  accountId: string,
  next: { active?: boolean; roleId?: string },
): Promise<void> => {
  await client.query("SELECT pg_advisory_xact_lock(hashtext('org-tools:last-super-admin'))");
  const current = await client.query<{ role_id: string; status: string }>(
    "SELECT role_id::text, status FROM accounts WHERE id = $1 FOR UPDATE",
    [accountId],
  );
  const account = current.rows[0];
  if (!account) throw new AuthorizationDeniedError();
  const losesSuperAdmin =
    account.role_id === SUPER_ADMIN_ROLE_ID &&
    account.status === "active" &&
    (next.active === false || (next.roleId !== undefined && next.roleId !== SUPER_ADMIN_ROLE_ID));
  if (!losesSuperAdmin) return;
  const remaining = await client.query(
    "SELECT 1 FROM accounts WHERE role_id = $1 AND status = 'active' AND id <> $2 LIMIT 1",
    [SUPER_ADMIN_ROLE_ID, accountId],
  );
  if (remaining.rowCount === 0) throw new AuthorizationDeniedError();
};

export class AdminService {
  constructor(private readonly pool: Pool = getDatabasePool()) {}

  async read(session: AuthenticatedSession) {
    assertSuperAdmin(session);
    const snapshot = await new OrganizationRepository(this.pool).read();
    const [accounts, roles, policies, audit, employees] = await Promise.all([
      this.pool.query(
        `SELECT a.id::text, a.email, a.employee_id::text, a.role_id::text, a.must_change_password,
                a.status, a.created_at, a.updated_at,
                COALESCE((SELECT jsonb_agg(jsonb_build_object('permission', permission, 'scope', scope))
                          FROM account_grants WHERE account_id = a.id), '[]'::jsonb) AS direct_grants
         FROM accounts a ORDER BY lower(a.email), a.id`,
      ),
      this.pool.query(
        `SELECT r.id::text, r.name, r.system_key,
                COALESCE((SELECT jsonb_agg(jsonb_build_object('permission', permission, 'scope', scope))
                          FROM role_grants WHERE role_id = r.id), '[]'::jsonb) AS grants,
                (SELECT count(*)::int FROM accounts WHERE role_id = r.id) AS account_count
         FROM roles r ORDER BY system_key IS NULL, lower(name), id`,
      ),
      this.pool.query(
        `SELECT resource_kind, resource_id, read_audience, write_audience,
                hide_employees_when_unread, updated_at
         FROM resource_policies ORDER BY resource_kind, resource_id`,
      ),
      this.pool.query(
        `SELECT id::text, actor_account_id::text, action, target_ids, result,
                correlation_id::text, created_at
         FROM audit_events ORDER BY created_at DESC, id DESC LIMIT 200`,
      ),
      this.pool.query(
        `SELECT employee_id::text AS id, normalized_email
         FROM employee_identities ORDER BY normalized_email NULLS LAST, employee_id`,
      ),
    ]);
    return {
      accounts: accounts.rows,
      audit: audit.rows,
      employees: employees.rows.map((identity) => {
        const employee = snapshot.organization.employees.find(
          (candidate) => candidate.id === identity.id,
        );
        return {
          ...identity,
          label: employee
            ? `${employee.firstName} ${employee.lastName}`.trim() || identity.id
            : identity.id,
        };
      }),
      policies: policies.rows,
      resources: [
        ...[
          "avatarBase64Url",
          "birthday",
          "email",
          "firstName",
          "gender",
          "lastName",
          "phone",
          "profileUrl",
          "tags",
          "username",
        ].map((field) => ({
          defaultAudience: "authenticated",
          id: `builtin:${field}`,
          kind: "employeeField",
          label: field,
        })),
        ...snapshot.organization.employeeFieldDefinitions.map((field) => ({
          defaultAudience: "closed",
          id: field.id,
          kind: "employeeField",
          label: field.name,
        })),
        ...snapshot.organization.tags.map((tag) => ({
          defaultAudience: "authenticated",
          id: tag.id,
          kind: "tag",
          label: tag.label,
        })),
        ...snapshot.organization.views.flatMap((view) => [
          {
            defaultAudience: view.kind === "system" ? "authenticated" : "closed",
            id: view.id,
            kind: "view",
            label: view.kind === "system" ? "System View" : view.name,
          },
          ...view.structure.units.flatMap((unit) => [
            {
              defaultAudience: "authenticated",
              id: unit.id,
              kind: "unit",
              label: unit.name,
            },
            ...unit.staffingSlots.map((slot) => ({
              defaultAudience: "authenticated",
              id: slot.id,
              kind: "staffingSlot",
              label: slot.name ?? "Staffing slot",
            })),
          ]),
        ]),
      ],
      roles: roles.rows,
    };
  }

  async execute(
    session: AuthenticatedSession,
    command: AdminCommand,
  ): Promise<{ temporaryPassword?: string }> {
    assertSuperAdmin(session);
    if (command.type === "user.email.update") {
      await new AuthService(this.pool).verifyCurrentPassword(session, command.currentPassword);
    }
    const correlationId = randomUUID();
    return withDatabaseTransaction(async (client) => {
      await assertActiveSession(client, session.account.id, session.sessionId);
      let temporaryPassword: string | undefined;
      if (command.type === "user.create") {
        if (!isPlausibleAccountEmail(command.email)) throw new SyntaxError();
        const normalizedEmail = normalizeAccountEmail(command.email);
        const role = await client.query<{ system_key: string | null }>(
          "SELECT system_key FROM roles WHERE id = $1",
          [command.roleId],
        );
        if (!role.rows[0]) throw new AuthorizationDeniedError();
        if (role.rows[0].system_key !== "superAdmin" && !command.employeeId)
          throw new SyntaxError();
        if (command.employeeId) {
          const identity = await client.query<{ normalized_email: string | null }>(
            "SELECT normalized_email FROM employee_identities WHERE employee_id = $1",
            [command.employeeId],
          );
          if (!identity.rows[0] || identity.rows[0].normalized_email !== normalizedEmail)
            throw new SyntaxError();
        }
        temporaryPassword = createTemporaryPassword();
        const accountId = randomUUID();
        await client.query(
          `INSERT INTO accounts
             (id, email, normalized_email, employee_id, role_id, password_hash, must_change_password, status)
           VALUES ($1, $2, $3, $4, $5, $6, TRUE, 'active')`,
          [
            accountId,
            command.email.trim().normalize("NFKC"),
            normalizedEmail,
            command.employeeId,
            command.roleId,
            await hashPassword(temporaryPassword),
          ],
        );
        await client.query(
          `INSERT INTO account_ui_states (account_id, ui_json)
           SELECT $1, bootstrap_ui_json FROM organization_documents WHERE singleton = TRUE`,
          [accountId],
        );
        await appendAuditEvent(client, {
          action: command.type,
          actorAccountId: session.account.id,
          correlationId,
          result: "succeeded",
          targetIds: [accountId],
        });
      } else if (command.type === "user.access.update") {
        validateGrants(command.directGrants);
        await assertLastSuperAdmin(client, command.accountId, { roleId: command.roleId });
        const role = await client.query("SELECT 1 FROM roles WHERE id = $1", [command.roleId]);
        if (role.rowCount === 0) throw new AuthorizationDeniedError();
        const target = await client.query<{
          employee_id: string | null;
          system_key: string | null;
        }>(
          `SELECT a.employee_id::text, r.system_key FROM accounts a
           JOIN roles r ON r.id = $1 WHERE a.id = $2`,
          [command.roleId, command.accountId],
        );
        if (
          !target.rows[0] ||
          (target.rows[0].system_key !== "superAdmin" && !target.rows[0].employee_id)
        ) {
          throw new SyntaxError();
        }
        await client.query(
          "UPDATE accounts SET role_id = $1, updated_at = clock_timestamp() WHERE id = $2",
          [command.roleId, command.accountId],
        );
        await client.query("DELETE FROM account_grants WHERE account_id = $1", [command.accountId]);
        for (const grant of command.directGrants) {
          await client.query(
            "INSERT INTO account_grants (account_id, permission, scope) VALUES ($1, $2, $3)",
            [command.accountId, grant.permission, grant.scope],
          );
        }
        await client.query(
          "UPDATE sessions SET revoked_at = clock_timestamp() WHERE account_id = $1",
          [command.accountId],
        );
      } else if (command.type === "user.active.update") {
        await assertLastSuperAdmin(client, command.accountId, { active: command.active });
        await client.query(
          "UPDATE accounts SET status = $1, updated_at = clock_timestamp() WHERE id = $2",
          [command.active ? "active" : "disabled", command.accountId],
        );
        if (!command.active)
          await client.query(
            "UPDATE sessions SET revoked_at = clock_timestamp() WHERE account_id = $1",
            [command.accountId],
          );
      } else if (command.type === "user.password.reset") {
        const target = await client.query("SELECT 1 FROM accounts WHERE id = $1 FOR UPDATE", [
          command.accountId,
        ]);
        if (target.rowCount === 0) throw new AuthorizationDeniedError();
        temporaryPassword = createTemporaryPassword();
        await client.query(
          "UPDATE accounts SET password_hash = $1, must_change_password = TRUE, updated_at = clock_timestamp() WHERE id = $2",
          [await hashPassword(temporaryPassword), command.accountId],
        );
        await client.query(
          "UPDATE sessions SET revoked_at = clock_timestamp() WHERE account_id = $1",
          [command.accountId],
        );
      } else if (command.type === "user.sessions.revoke") {
        const target = await client.query("SELECT 1 FROM accounts WHERE id = $1 FOR UPDATE", [
          command.accountId,
        ]);
        if (target.rowCount === 0) throw new AuthorizationDeniedError();
        await client.query(
          "UPDATE sessions SET revoked_at = clock_timestamp() WHERE account_id = $1",
          [command.accountId],
        );
      } else if (command.type === "user.email.update") {
        if (!isPlausibleAccountEmail(command.email)) throw new SyntaxError();
        const normalizedEmail = normalizeAccountEmail(command.email);
        const target = await client.query<{ employee_id: string | null }>(
          "SELECT employee_id::text FROM accounts WHERE id = $1 FOR UPDATE",
          [command.accountId],
        );
        const employeeId = target.rows[0]?.employee_id;
        if (!employeeId) throw new SyntaxError();
        const document = await client.query<{ organization_json: unknown }>(
          "SELECT organization_json FROM organization_documents WHERE singleton = TRUE FOR UPDATE",
        );
        const row = document.rows[0];
        if (!row) throw new Error("organization_missing");
        const organization = parseOrganizationDocument(row.organization_json);
        const employee = organization.employees.find((item) => item.id === employeeId);
        if (!employee) throw new Error("identity_missing");
        employee.email = command.email.trim().normalize("NFKC");
        employee.updatedAt = new Date().toISOString();
        await client.query(
          `UPDATE organization_documents
           SET organization_json = $1::jsonb, revision = revision + 1, updated_at = clock_timestamp()
           WHERE singleton = TRUE`,
          [JSON.stringify(organization)],
        );
        await client.query(
          "UPDATE employee_identities SET normalized_email = $1, updated_at = clock_timestamp() WHERE employee_id = $2",
          [normalizedEmail, employeeId],
        );
        await client.query(
          "UPDATE accounts SET email = $1, normalized_email = $2, updated_at = clock_timestamp() WHERE id = $3",
          [employee.email, normalizedEmail, command.accountId],
        );
        await client.query(
          "UPDATE sessions SET revoked_at = clock_timestamp() WHERE account_id = $1 AND id <> $2",
          [command.accountId, session.sessionId],
        );
      } else if (command.type === "role.create") {
        validateGrants(command.grants);
        if (!command.name.trim()) throw new SyntaxError();
        const roleId = randomUUID();
        await client.query("INSERT INTO roles (id, name, system_key) VALUES ($1, $2, NULL)", [
          roleId,
          command.name.trim(),
        ]);
        for (const grant of command.grants)
          await client.query(
            "INSERT INTO role_grants (role_id, permission, scope) VALUES ($1, $2, $3)",
            [roleId, grant.permission, grant.scope],
          );
      } else if (command.type === "role.update") {
        validateGrants(command.grants);
        if (!command.name.trim()) throw new SyntaxError();
        const role = await client.query<{ system_key: string | null }>(
          "SELECT system_key FROM roles WHERE id = $1 FOR UPDATE",
          [command.roleId],
        );
        if (!role.rows[0] || role.rows[0].system_key === "superAdmin")
          throw new AuthorizationDeniedError();
        await client.query(
          "UPDATE roles SET name = $1, updated_at = clock_timestamp() WHERE id = $2",
          [command.name.trim(), command.roleId],
        );
        await client.query("DELETE FROM role_grants WHERE role_id = $1", [command.roleId]);
        for (const grant of command.grants)
          await client.query(
            "INSERT INTO role_grants (role_id, permission, scope) VALUES ($1, $2, $3)",
            [command.roleId, grant.permission, grant.scope],
          );
      } else if (command.type === "role.delete") {
        const role = await client.query<{ system_key: string | null }>(
          "SELECT system_key FROM roles WHERE id = $1 FOR UPDATE",
          [command.roleId],
        );
        if (!role.rows[0] || role.rows[0].system_key !== null) throw new AuthorizationDeniedError();
        const references = await client.query(
          `SELECT 1 FROM accounts WHERE role_id = $1
           UNION ALL SELECT 1 FROM role_grants WHERE role_id = $1
           UNION ALL SELECT 1 FROM resource_policies
             WHERE read_audience @> jsonb_build_object('roleIds', jsonb_build_array($1::text))
                OR write_audience @> jsonb_build_object('roleIds', jsonb_build_array($1::text))
           LIMIT 1`,
          [command.roleId],
        );
        if (references.rowCount !== 0) throw new AuthorizationDeniedError();
        await client.query("DELETE FROM roles WHERE id = $1", [command.roleId]);
      } else {
        const document = await client.query<{ organization_json: unknown }>(
          "SELECT organization_json FROM organization_documents WHERE singleton = TRUE FOR UPDATE",
        );
        const documentRow = document.rows[0];
        if (!documentRow) throw new Error("organization_missing");
        const organization = parseOrganizationDocument(documentRow.organization_json);
        const parent = findPolicyParent(organization, command.resourceKind, command.resourceId);
        if (parent === undefined) throw new AuthorizationDeniedError();
        const policy: StoredResourcePolicy = {
          hideEmployeesWhenUnread: command.hideEmployeesWhenUnread,
          read: validateAudience(command.read),
          resourceId: command.resourceId,
          resourceKind: command.resourceKind,
          write: validateAudience(command.write),
        };
        if (!audienceIsWithin(policy.write, policy.read)) throw new AuthorizationDeniedError();
        await Promise.all([
          validateAudienceReferences(client, policy.read),
          validateAudienceReferences(client, policy.write),
        ]);
        let ancestor = parent;
        const visited = new Set<string>();
        while (ancestor) {
          const key = `${ancestor.kind}:${ancestor.resourceId}`;
          if (visited.has(key)) throw new AuthorizationDeniedError();
          visited.add(key);
          const parentPolicy = await readPolicyAudience(client, ancestor);
          if (
            !audienceIsWithin(policy.read, parentPolicy.read) ||
            !audienceIsWithin(policy.write, parentPolicy.write)
          ) {
            throw new AuthorizationDeniedError();
          }
          const nextAncestor = findPolicyParent(organization, ancestor.kind, ancestor.resourceId);
          if (nextAncestor === undefined) throw new AuthorizationDeniedError();
          ancestor = nextAncestor;
        }
        await validateDescendantPolicies(client, organization, policy);
        await client.query(
          `INSERT INTO resource_policies
             (resource_kind, resource_id, read_audience, write_audience, hide_employees_when_unread, updated_at)
           VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, clock_timestamp())
           ON CONFLICT (resource_kind, resource_id) DO UPDATE SET
             read_audience = EXCLUDED.read_audience,
             write_audience = EXCLUDED.write_audience,
             hide_employees_when_unread = EXCLUDED.hide_employees_when_unread,
             updated_at = EXCLUDED.updated_at`,
          [
            policy.resourceKind,
            policy.resourceId,
            JSON.stringify(policy.read),
            JSON.stringify(policy.write),
            policy.hideEmployeesWhenUnread,
          ],
        );
      }
      if (command.type !== "user.create") {
        await appendAuditEvent(client, {
          action: command.type,
          actorAccountId: session.account.id,
          correlationId,
          result: "succeeded",
          targetIds: [
            "accountId" in command
              ? command.accountId
              : "roleId" in command
                ? command.roleId
                : "resourceId" in command
                  ? command.resourceId
                  : "",
          ].filter(Boolean),
        });
      }
      await touchSecurity(client);
      return temporaryPassword ? { temporaryPassword } : {};
    }, this.pool);
  }
}

export type { AdminCommand };
