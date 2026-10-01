import { createCipheriv, createDecipheriv, randomBytes, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { gunzip, gzip } from "node:zlib";
import type {
  AccessAudience,
  AccountUiState,
  OrganizationDocument,
  PermissionGrant,
  ResourcePolicyKind,
} from "@org-tools/types";
import { argon2id, hash } from "argon2";
import type { Pool, PoolClient } from "pg";
import { parseOrgToolsUiState } from "@/lib/org-file";
import { isPlausibleAccountEmail, normalizeAccountEmail } from "@/server/auth-crypto";
import type { AuthenticatedSession } from "@/server/auth-service";
import { AuthService } from "@/server/auth-service";
import { parseAccessAudience } from "@/server/authorized-projection";
import { assertActiveSession, getDatabasePool, withDatabaseTransaction } from "@/server/database";
import { AuthorizationDeniedError } from "@/server/organization-authorization";
import { appendAuditEvent, parseOrganizationDocument } from "@/server/organization-repository";
import { isValidPermissionGrant } from "@/server/permissions";
import { loadRuntimeConfig } from "@/server/runtime-config";

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);
const MAGIC = Buffer.from("ORGTOOLS-BACKUP-1\n", "ascii");
const BACKUP_VERSION = 1;
const MAX_BACKUP_BYTES = 512 * 1024 * 1024;
const MAX_DECOMPRESSED_BACKUP_BYTES = 512 * 1024 * 1024;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ARGON2_VALUE_PATTERN = /^[A-Za-z0-9+/]+$/u;

const isCurrentPasswordHash = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  const parts = value.split("$");
  if (
    parts.length !== 6 ||
    parts[0] !== "" ||
    parts[1] !== "argon2id" ||
    parts[2] !== "v=19" ||
    !parts[4] ||
    !ARGON2_VALUE_PATTERN.test(parts[4]) ||
    !parts[5] ||
    !ARGON2_VALUE_PATTERN.test(parts[5])
  ) {
    return false;
  }
  const entries = (parts[3] ?? "").split(",");
  if (entries.length !== 3) return false;
  const parameters = new Map<string, number>();
  for (const entry of entries) {
    const match = /^([mtp])=(\d+)$/u.exec(entry);
    if (!match?.[1] || !match[2] || parameters.has(match[1])) return false;
    parameters.set(match[1], Number(match[2]));
  }
  return (
    parameters.size === 3 &&
    parameters.get("m") === 65_536 &&
    parameters.get("t") === 3 &&
    parameters.get("p") === 1
  );
};

type BackupHeader = {
  algorithm: "aes-256-gcm";
  formatVersion: 1;
  kdf: { memoryCost: 65_536; parallelism: 1; timeCost: 3; type: "argon2id" };
  nonce: string;
  salt: string;
  schemaVersion: number;
  tag: string;
};

export type BackupPayload = {
  accountGrants: unknown[];
  accounts: unknown[];
  auditEvents: unknown[];
  employeeIdentities: unknown[];
  organization: {
    bootstrapUi: unknown;
    createdAt: unknown;
    document: unknown;
    revision: unknown;
    securityRevision: unknown;
    updatedAt: unknown;
  };
  resourcePolicies: unknown[];
  roleGrants: unknown[];
  roles: unknown[];
  schemaVersion: number;
  uiStates: unknown[];
};

const deriveKey = async (passphrase: string, salt: Buffer): Promise<Buffer> => {
  if ([...passphrase].length < 15 || [...passphrase].length > 128)
    throw new Error("invalid_passphrase");
  return hash(passphrase, {
    hashLength: 32,
    memoryCost: 65_536,
    parallelism: 1,
    raw: true,
    salt,
    timeCost: 3,
    type: argon2id,
  });
};

const schemaVersion = async (client: PoolClient | Pool): Promise<number> => {
  const result = await client.query<{ version: string }>(
    "SELECT count(*)::text AS version FROM schema_migrations",
  );
  return Number(result.rows[0]?.version ?? 0);
};

const readPayload = async (client: PoolClient | Pool): Promise<BackupPayload> => {
  const document = await client.query(
    `SELECT organization_json AS document, bootstrap_ui_json AS "bootstrapUi",
              revision, security_revision AS "securityRevision", created_at AS "createdAt",
              updated_at AS "updatedAt" FROM organization_documents WHERE singleton = TRUE`,
  );
  const roles = await client.query(
    "SELECT id::text, name, system_key, created_at, updated_at FROM roles ORDER BY id",
  );
  const roleGrants = await client.query(
    "SELECT role_id::text, permission, scope FROM role_grants ORDER BY role_id, permission, scope",
  );
  const identities = await client.query(
    "SELECT employee_id::text, normalized_email, updated_at FROM employee_identities ORDER BY employee_id",
  );
  const accounts = await client.query(
    "SELECT id::text, email, normalized_email, employee_id::text, role_id::text, password_hash, must_change_password, status, created_at, updated_at FROM accounts ORDER BY id",
  );
  const accountGrants = await client.query(
    "SELECT account_id::text, permission, scope FROM account_grants ORDER BY account_id, permission, scope",
  );
  const policies = await client.query(
    "SELECT resource_kind, resource_id, read_audience, write_audience, hide_employees_when_unread, updated_at FROM resource_policies ORDER BY resource_kind, resource_id",
  );
  const uiStates = await client.query(
    "SELECT account_id::text, ui_json, updated_at FROM account_ui_states ORDER BY account_id",
  );
  const auditEvents = await client.query(
    "SELECT id::text, actor_account_id::text, action, target_ids, result, correlation_id::text, created_at FROM audit_events ORDER BY created_at, id",
  );
  const organization = document.rows[0];
  if (!organization) throw new Error("organization_missing");
  return {
    accountGrants: accountGrants.rows,
    accounts: accounts.rows,
    auditEvents: auditEvents.rows,
    employeeIdentities: identities.rows,
    organization,
    resourcePolicies: policies.rows,
    roleGrants: roleGrants.rows,
    roles: roles.rows,
    schemaVersion: await schemaVersion(client),
    uiStates: uiStates.rows,
  };
};

export const encryptBackup = async (
  payload: BackupPayload,
  passphrase: string,
): Promise<Buffer> => {
  const salt = randomBytes(16);
  const nonce = randomBytes(12);
  const key = await deriveKey(passphrase, salt);
  const compressed = await gzipAsync(Buffer.from(JSON.stringify(payload), "utf8"), { level: 9 });
  const headerWithoutTag = {
    algorithm: "aes-256-gcm" as const,
    formatVersion: BACKUP_VERSION as 1,
    kdf: {
      memoryCost: 65_536 as const,
      parallelism: 1 as const,
      timeCost: 3 as const,
      type: "argon2id" as const,
    },
    nonce: nonce.toString("base64url"),
    salt: salt.toString("base64url"),
    schemaVersion: payload.schemaVersion,
  };
  const aad = Buffer.from(JSON.stringify(headerWithoutTag), "utf8");
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  cipher.setAAD(aad);
  const ciphertext = Buffer.concat([cipher.update(compressed), cipher.final()]);
  const header: BackupHeader = {
    ...headerWithoutTag,
    tag: cipher.getAuthTag().toString("base64url"),
  };
  const headerBytes = Buffer.from(JSON.stringify(header), "utf8");
  const size = Buffer.allocUnsafe(4);
  size.writeUInt32BE(headerBytes.length);
  return Buffer.concat([MAGIC, size, headerBytes, ciphertext]);
};

export const decryptBackup = async (file: Buffer, passphrase: string): Promise<BackupPayload> => {
  if (
    file.length > MAX_BACKUP_BYTES ||
    file.length < MAGIC.length + 4 ||
    !file.subarray(0, MAGIC.length).equals(MAGIC)
  ) {
    throw new Error("invalid_backup");
  }
  const headerLength = file.readUInt32BE(MAGIC.length);
  if (headerLength < 2 || headerLength > 16_384) throw new Error("invalid_backup");
  const headerStart = MAGIC.length + 4;
  if (headerStart + headerLength >= file.length) throw new Error("invalid_backup");
  const header = JSON.parse(
    file.subarray(headerStart, headerStart + headerLength).toString("utf8"),
  ) as BackupHeader;
  if (
    typeof header !== "object" ||
    header === null ||
    Object.keys(header).sort().join("\0") !==
      ["algorithm", "formatVersion", "kdf", "nonce", "salt", "schemaVersion", "tag"]
        .sort()
        .join("\0") ||
    header.formatVersion !== 1 ||
    header.algorithm !== "aes-256-gcm" ||
    header.kdf?.type !== "argon2id" ||
    Object.keys(header.kdf).sort().join("\0") !==
      ["memoryCost", "parallelism", "timeCost", "type"].sort().join("\0") ||
    header.kdf.memoryCost !== 65_536 ||
    header.kdf.timeCost !== 3 ||
    header.kdf.parallelism !== 1 ||
    !Number.isSafeInteger(header.schemaVersion) ||
    header.schemaVersion < 1
  ) {
    throw new Error("invalid_backup");
  }
  const { tag, ...headerWithoutTag } = header;
  const salt = Buffer.from(header.salt, "base64url");
  const nonce = Buffer.from(header.nonce, "base64url");
  const authenticationTag = Buffer.from(tag, "base64url");
  if (salt.length !== 16 || nonce.length !== 12 || authenticationTag.length !== 16) {
    throw new Error("invalid_backup");
  }
  const key = await deriveKey(passphrase, salt);
  const decipher = createDecipheriv("aes-256-gcm", key, nonce);
  decipher.setAAD(Buffer.from(JSON.stringify(headerWithoutTag), "utf8"));
  decipher.setAuthTag(authenticationTag);
  const compressed = Buffer.concat([
    decipher.update(file.subarray(headerStart + headerLength)),
    decipher.final(),
  ]);
  const decompressed = await gunzipAsync(compressed, {
    maxOutputLength: MAX_DECOMPRESSED_BACKUP_BYTES,
  });
  const value = JSON.parse(decompressed.toString("utf8")) as BackupPayload;
  if (value.schemaVersion !== header.schemaVersion) throw new Error("invalid_backup");
  return value;
};

const asRecord = (value: unknown): Record<string, unknown> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("invalid_backup");
  }
  return value as Record<string, unknown>;
};

const exactKeys = (value: Record<string, unknown>, keys: readonly string[]): void => {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new Error("invalid_backup");
  }
};

const asRows = (
  value: unknown,
  keys: readonly string[],
  maximum = 1_000_000,
): Record<string, unknown>[] => {
  if (!Array.isArray(value) || value.length > maximum) throw new Error("invalid_backup");
  return value.map((candidate) => {
    const row = asRecord(candidate);
    exactKeys(row, keys);
    return row;
  });
};

const asUuid = (value: unknown): string => {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) throw new Error("invalid_backup");
  return value;
};

const assertUnique = (values: readonly string[]): void => {
  if (new Set(values).size !== values.length) throw new Error("invalid_backup");
};

const audienceIsWithin = (
  child: ReturnType<typeof parseAccessAudience>,
  parent: ReturnType<typeof parseAccessAudience>,
): boolean => {
  if (parent.allAuthenticated) return true;
  if (child.allAuthenticated) return false;
  return (
    child.relations.every(
      (relation) =>
        parent.relations.includes(relation) ||
        (relation === "managedDirect" && parent.relations.includes("managedSubtree")),
    ) &&
    child.roleIds.every((roleId) => parent.roleIds.includes(roleId)) &&
    child.userIds.every((accountId) => parent.userIds.includes(accountId))
  );
};

const validRevision = (value: unknown): boolean => {
  const parsed = typeof value === "string" && /^\d+$/u.test(value) ? Number(value) : value;
  return typeof parsed === "number" && Number.isSafeInteger(parsed) && parsed >= 1;
};

const validateBackupGraph = (
  payload: BackupPayload,
  organization: OrganizationDocument,
  uiStates: Array<{ account_id: string; ui_json: AccountUiState; updated_at: unknown }>,
): void => {
  const roles = asRows(
    payload.roles,
    ["created_at", "id", "name", "system_key", "updated_at"],
    256,
  );
  const roleIds = roles.map((row) => asUuid(row.id));
  assertUnique(roleIds);
  const systemRoleById = new Map<string, string | null>();
  const systemKeys: string[] = [];
  for (const row of roles) {
    if (typeof row.name !== "string" || row.name.length < 1 || row.name.length > 120) {
      throw new Error("invalid_backup");
    }
    if (
      row.system_key !== null &&
      row.system_key !== "superAdmin" &&
      row.system_key !== "employee" &&
      row.system_key !== "manager"
    ) {
      throw new Error("invalid_backup");
    }
    if (typeof row.system_key === "string") systemKeys.push(row.system_key);
    systemRoleById.set(String(row.id), row.system_key as string | null);
  }
  assertUnique(systemKeys);
  if (
    !systemKeys.includes("superAdmin") ||
    !systemKeys.includes("employee") ||
    !systemKeys.includes("manager")
  ) {
    throw new Error("invalid_backup");
  }

  const identityRows = asRows(payload.employeeIdentities, [
    "employee_id",
    "normalized_email",
    "updated_at",
  ]);
  const identityIds = identityRows.map((row) => asUuid(row.employee_id));
  assertUnique(identityIds);
  if (identityRows.length !== organization.employees.length) throw new Error("invalid_backup");
  const employeeById = new Map(organization.employees.map((employee) => [employee.id, employee]));
  const normalizedIdentityEmails: string[] = [];
  for (const row of identityRows) {
    const employee = employeeById.get(String(row.employee_id));
    if (!employee) throw new Error("invalid_backup");
    const expected = employee.email ? normalizeAccountEmail(employee.email) : null;
    if (row.normalized_email !== expected) throw new Error("invalid_backup");
    if (typeof row.normalized_email === "string")
      normalizedIdentityEmails.push(row.normalized_email);
  }
  assertUnique(normalizedIdentityEmails);

  const accounts = asRows(
    payload.accounts,
    [
      "created_at",
      "email",
      "employee_id",
      "id",
      "must_change_password",
      "normalized_email",
      "password_hash",
      "role_id",
      "status",
      "updated_at",
    ],
    100_000,
  );
  const accountIds = accounts.map((row) => asUuid(row.id));
  assertUnique(accountIds);
  const accountIdSet = new Set(accountIds);
  const normalizedAccountEmails: string[] = [];
  const linkedEmployeeIds: string[] = [];
  let activeSuperAdministrators = 0;
  for (const row of accounts) {
    const roleId = asUuid(row.role_id);
    if (!systemRoleById.has(roleId)) throw new Error("invalid_backup");
    if (
      typeof row.email !== "string" ||
      !isPlausibleAccountEmail(row.email) ||
      normalizeAccountEmail(row.email) !== row.normalized_email
    ) {
      throw new Error("invalid_backup");
    }
    normalizedAccountEmails.push(String(row.normalized_email));
    const employeeId = row.employee_id === null ? null : asUuid(row.employee_id);
    const systemKey = systemRoleById.get(roleId);
    if (systemKey !== "superAdmin" && !employeeId) throw new Error("invalid_backup");
    if (employeeId) {
      linkedEmployeeIds.push(employeeId);
      const identity = identityRows.find((candidate) => candidate.employee_id === employeeId);
      if (!identity || identity.normalized_email !== row.normalized_email) {
        throw new Error("invalid_backup");
      }
    }
    if (!isCurrentPasswordHash(row.password_hash)) throw new Error("invalid_backup");
    if (typeof row.must_change_password !== "boolean") throw new Error("invalid_backup");
    if (row.status !== "active" && row.status !== "disabled") throw new Error("invalid_backup");
    if (systemKey === "superAdmin" && row.status === "active") activeSuperAdministrators += 1;
  }
  assertUnique(normalizedAccountEmails);
  assertUnique(linkedEmployeeIds);
  if (activeSuperAdministrators < 1) throw new Error("missing_super_administrator");

  for (const [rows, ownerKey, ownerIds] of [
    [
      asRows(payload.roleGrants, ["permission", "role_id", "scope"], 100_000),
      "role_id",
      new Set(roleIds),
    ],
    [
      asRows(payload.accountGrants, ["account_id", "permission", "scope"], 100_000),
      "account_id",
      accountIdSet,
    ],
  ] as const) {
    const grantKeys: string[] = [];
    for (const row of rows) {
      const ownerId = asUuid(row[ownerKey]);
      if (!ownerIds.has(ownerId)) throw new Error("invalid_backup");
      const grant = { permission: row.permission, scope: row.scope } as PermissionGrant;
      if (!isValidPermissionGrant(grant)) throw new Error("invalid_backup");
      grantKeys.push(`${ownerId}\0${grant.permission}\0${grant.scope}`);
    }
    assertUnique(grantKeys);
  }

  if (uiStates.length !== accounts.length) throw new Error("invalid_backup");
  const uiAccountIds = uiStates.map((row) => asUuid(row.account_id));
  assertUnique(uiAccountIds);
  if (uiAccountIds.some((accountId) => !accountIdSet.has(accountId))) {
    throw new Error("invalid_backup");
  }

  const resourceIds = {
    employeeField: new Set([
      "builtin:avatarBase64Url",
      "builtin:birthday",
      "builtin:email",
      "builtin:firstName",
      "builtin:gender",
      "builtin:lastName",
      "builtin:phone",
      "builtin:profileUrl",
      "builtin:tags",
      "builtin:username",
      ...organization.employeeFieldDefinitions.map((field) => field.id),
    ]),
    staffingSlot: new Set(
      organization.views.flatMap((view) =>
        view.structure.units.flatMap((unit) => unit.staffingSlots.map((slot) => slot.id)),
      ),
    ),
    tag: new Set(organization.tags.map((tag) => tag.id)),
    unit: new Set(
      organization.views.flatMap((view) => view.structure.units.map((unit) => unit.id)),
    ),
    view: new Set(organization.views.map((view) => view.id)),
  } satisfies Record<ResourcePolicyKind, Set<string>>;
  const policies = asRows(
    payload.resourcePolicies,
    [
      "hide_employees_when_unread",
      "read_audience",
      "resource_id",
      "resource_kind",
      "updated_at",
      "write_audience",
    ],
    1_000_000,
  );
  const policyKeys: string[] = [];
  const policyByKey = new Map<
    string,
    {
      read: ReturnType<typeof parseAccessAudience>;
      write: ReturnType<typeof parseAccessAudience>;
    }
  >();
  for (const row of policies) {
    const kind = row.resource_kind as ResourcePolicyKind;
    if (!Object.hasOwn(resourceIds, kind) || typeof row.resource_id !== "string") {
      throw new Error("invalid_backup");
    }
    if (!resourceIds[kind].has(row.resource_id)) throw new Error("invalid_backup");
    if (typeof row.hide_employees_when_unread !== "boolean") throw new Error("invalid_backup");
    const read = parseAccessAudience(row.read_audience);
    const write = parseAccessAudience(row.write_audience);
    for (const audience of [read, write]) {
      if (
        audience.roleIds.some((roleId) => !systemRoleById.has(roleId)) ||
        audience.userIds.some((accountId) => !accountIdSet.has(accountId))
      ) {
        throw new Error("invalid_backup");
      }
    }
    if (!audienceIsWithin(write, read)) throw new Error("invalid_backup");
    policyByKey.set(`${kind}\0${row.resource_id}`, { read, write });
    policyKeys.push(`${kind}\0${row.resource_id}`);
  }
  assertUnique(policyKeys);

  const authenticated: AccessAudience = {
    allAuthenticated: true,
    relations: [],
    roleIds: [],
    userIds: [],
  };
  for (const view of organization.views) {
    const unitById = new Map(view.structure.units.map((unit) => [unit.id, unit]));
    for (const unit of view.structure.units) {
      const child = policyByKey.get(`unit\0${unit.id}`);
      if (child && unit.parentId) {
        const parent = policyByKey.get(`unit\0${unit.parentId}`) ?? {
          read: authenticated,
          write: authenticated,
        };
        if (
          !audienceIsWithin(child.read, parent.read) ||
          !audienceIsWithin(child.write, parent.write)
        ) {
          throw new Error("invalid_backup");
        }
      }
      for (const slot of unit.staffingSlots) {
        const childSlot = policyByKey.get(`staffingSlot\0${slot.id}`);
        if (!childSlot) continue;
        const owner = policyByKey.get(`unit\0${unit.id}`) ?? {
          read: authenticated,
          write: authenticated,
        };
        if (
          !audienceIsWithin(childSlot.read, owner.read) ||
          !audienceIsWithin(childSlot.write, owner.write)
        ) {
          throw new Error("invalid_backup");
        }
      }
      if (unit.parentId && !unitById.has(unit.parentId)) throw new Error("invalid_backup");
    }
  }

  const audits = asRows(payload.auditEvents, [
    "action",
    "actor_account_id",
    "correlation_id",
    "created_at",
    "id",
    "result",
    "target_ids",
  ]);
  for (const row of audits) {
    asUuid(row.id);
    asUuid(row.correlation_id);
    if (row.actor_account_id !== null && !accountIdSet.has(asUuid(row.actor_account_id))) {
      throw new Error("invalid_backup");
    }
    if (
      typeof row.action !== "string" ||
      !["allowed", "denied", "failed", "succeeded"].includes(String(row.result)) ||
      !Array.isArray(row.target_ids) ||
      row.target_ids.some((target) => typeof target !== "string")
    ) {
      throw new Error("invalid_backup");
    }
  }
};

export const validateBackupPayload = async (
  payload: BackupPayload,
  currentSchemaVersion: number,
): Promise<{
  organization: OrganizationDocument;
  uiStates: Array<{ account_id: string; ui_json: AccountUiState; updated_at: unknown }>;
}> => {
  const input = asRecord(payload);
  exactKeys(input, [
    "accountGrants",
    "accounts",
    "auditEvents",
    "employeeIdentities",
    "organization",
    "resourcePolicies",
    "roleGrants",
    "roles",
    "schemaVersion",
    "uiStates",
  ]);
  if (payload.schemaVersion !== currentSchemaVersion) throw new Error("schema_mismatch");
  const organizationRow = asRecord(payload.organization);
  exactKeys(organizationRow, [
    "bootstrapUi",
    "createdAt",
    "document",
    "revision",
    "securityRevision",
    "updatedAt",
  ]);
  if (
    !validRevision(organizationRow.revision) ||
    !validRevision(organizationRow.securityRevision)
  ) {
    throw new Error("invalid_backup");
  }
  const organization = parseOrganizationDocument(payload.organization.document);
  const uiStates = asRows(payload.uiStates, ["account_id", "ui_json", "updated_at"], 100_000).map(
    (row) => ({
      account_id: asUuid(row.account_id),
      ui_json: parseOrgToolsUiState(row.ui_json),
      updated_at: row.updated_at,
    }),
  );
  validateBackupGraph(payload, organization, uiStates);
  return { organization, uiStates };
};

const insertRows = async (client: PoolClient, table: string, rows: unknown[]): Promise<void> => {
  const jsonColumns = new Set(["read_audience", "target_ids", "ui_json", "write_audience"]);
  for (const raw of rows) {
    if (typeof raw !== "object" || raw === null || Array.isArray(raw))
      throw new Error("invalid_backup");
    const row = raw as Record<string, unknown>;
    const columns = Object.keys(row);
    if (columns.length === 0) throw new Error("invalid_backup");
    const identifiers = columns.map((column) => `"${column.replaceAll('"', '""')}"`).join(", ");
    const placeholders = columns.map((_, index) => `$${index + 1}`).join(", ");
    await client.query(
      `INSERT INTO ${table} (${identifiers}) VALUES (${placeholders})`,
      columns.map((column) =>
        jsonColumns.has(column) ? JSON.stringify(row[column]) : row[column],
      ),
    );
  }
};

export class BackupService {
  constructor(private readonly pool: Pool = getDatabasePool()) {}

  async create(
    session: AuthenticatedSession,
    currentPassword: string,
    passphrase: string,
  ): Promise<Buffer> {
    if (
      !session.accountSummary.effectiveGrants.some(
        (grant) => grant.permission === "backup.create",
      ) &&
      session.role.systemKey !== "superAdmin"
    )
      throw new AuthorizationDeniedError();
    await new AuthService(this.pool).verifyCurrentPassword(session, currentPassword);
    const payload = await withDatabaseTransaction(
      async (client) => {
        await assertActiveSession(client, session.account.id, session.sessionId);
        return readPayload(client);
      },
      this.pool,
      { isolation: "repeatable read", readOnly: true },
    );
    const file = await encryptBackup(payload, passphrase);
    await withDatabaseTransaction(
      (client) =>
        appendAuditEvent(client, {
          action: "backup.create",
          actorAccountId: session.account.id,
          correlationId: randomUUID(),
          result: "succeeded",
          targetIds: [],
        }),
      this.pool,
    );
    return file;
  }

  async restore(
    session: AuthenticatedSession,
    currentPassword: string,
    passphrase: string,
    file: Buffer,
  ): Promise<void> {
    if (
      !session.accountSummary.effectiveGrants.some(
        (grant) => grant.permission === "backup.restore",
      ) &&
      session.role.systemKey !== "superAdmin"
    )
      throw new AuthorizationDeniedError();
    await new AuthService(this.pool).verifyCurrentPassword(session, currentPassword);
    const payload = await decryptBackup(file, passphrase);
    const currentVersion = await schemaVersion(this.pool);
    const validated = await validateBackupPayload(payload, currentVersion);
    const config = loadRuntimeConfig();
    await mkdir(config.backupPath, { mode: 0o700, recursive: true });
    const recoveryPath = join(
      config.backupPath,
      `pre-restore-${new Date().toISOString().replaceAll(":", "-")}.org-tools-backup`,
    );
    await withDatabaseTransaction(
      async (client) => {
        await assertActiveSession(client, session.account.id, session.sessionId);
        const recovery = await encryptBackup(await readPayload(client), passphrase);
        await writeFile(recoveryPath, recovery, { flag: "wx", mode: 0o600 });
        for (const table of [
          "sessions",
          "login_rate_limits",
          "account_grants",
          "account_ui_states",
          "audit_events",
          "resource_policies",
          "server_events",
          "accounts",
          "employee_identities",
          "role_grants",
          "roles",
          "organization_documents",
        ]) {
          await client.query(`DELETE FROM ${table}`);
        }
        const organization = payload.organization as Record<string, unknown>;
        await client.query(
          `INSERT INTO organization_documents
           (singleton, organization_json, bootstrap_ui_json, revision, security_revision, created_at, updated_at)
         VALUES (TRUE, $1::jsonb, $2::jsonb, $3, $4, $5, clock_timestamp())`,
          [
            JSON.stringify(validated.organization),
            JSON.stringify(payload.organization.bootstrapUi),
            organization.revision,
            Number(organization.securityRevision) + 1,
            organization.createdAt,
          ],
        );
        await insertRows(client, "roles", payload.roles);
        await insertRows(client, "role_grants", payload.roleGrants);
        await insertRows(client, "employee_identities", payload.employeeIdentities);
        await insertRows(client, "accounts", payload.accounts);
        await insertRows(client, "account_grants", payload.accountGrants);
        await insertRows(client, "resource_policies", payload.resourcePolicies);
        await insertRows(client, "account_ui_states", validated.uiStates);
        await insertRows(client, "audit_events", payload.auditEvents);
        await appendAuditEvent(client, {
          action: "backup.restore",
          actorAccountId: null,
          correlationId: randomUUID(),
          result: "succeeded",
          targetIds: [],
        });
        await client.query(
          `INSERT INTO server_events (organization_revision, security_revision, event_kind, account_id)
         SELECT revision, security_revision, 'restore', NULL FROM organization_documents WHERE singleton = TRUE`,
        );
      },
      this.pool,
      { maintenance: "exclusive" },
    );
  }
}
