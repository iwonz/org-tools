import { randomUUID } from "node:crypto";
import type {
  Account,
  AccountId,
  AccountSummary,
  AccountUiState,
  PermissionGrant,
  Role,
  SessionId,
} from "@org-tools/types";
import type { Pool, PoolClient } from "pg";

import {
  createOpaqueToken,
  createSessionCsrfToken,
  digestToken,
  hashPassword,
  isPlausibleAccountEmail,
  normalizeAccountEmail,
  safeTokenEqual,
  verifyPassword,
} from "@/server/auth-crypto";
import { assertActiveSession, getDatabasePool, withDatabaseTransaction } from "@/server/database";
import { appendAuditEvent, OrganizationRepository } from "@/server/organization-repository";
import { SUPER_ADMIN_ROLE_ID } from "@/server/permissions";
import { loadRuntimeConfig } from "@/server/runtime-config";

const IDLE_SESSION_MILLISECONDS = 8 * 60 * 60 * 1_000;
const ABSOLUTE_SESSION_MILLISECONDS = 24 * 60 * 60 * 1_000;
const RATE_LIMIT_WINDOW_MILLISECONDS = 15 * 60 * 1_000;
const RATE_LIMIT_BLOCK_MILLISECONDS = 15 * 60 * 1_000;
const EMAIL_FAILURE_LIMIT = 8;
const INSTANCE_FAILURE_LIMIT = 80;
const DUMMY_PASSWORD_HASH =
  "$argon2id$v=19$m=65536,t=3,p=1$DNfRdh53srGeRpHlv6ER+w$lPb5uew6fp2gn5vvgQ7hKXlHUJq8ch/xKoUZlE/ZPMc";

type AccountRow = {
  created_at: Date | string;
  direct_grants: PermissionGrant[] | null;
  email: string;
  employee_id: string | null;
  id: string;
  must_change_password: boolean;
  password_hash: string;
  role_grants: PermissionGrant[] | null;
  role_id: string;
  role_name: string;
  status: "active" | "disabled";
  system_key: Role["systemKey"];
  updated_at: Date | string;
};

type SessionRow = AccountRow & {
  absolute_expires_at: Date | string;
  csrf_hash: Buffer;
  previous_csrf_hash: Buffer | null;
  idle_expires_at: Date | string;
  session_id: string;
};

export type AuthenticatedSession = {
  account: Account;
  accountSummary: AccountSummary;
  csrfHash: Buffer;
  previousCsrfHash: Buffer | null;
  role: Role;
  sessionId: SessionId;
};

export type IssuedSession = AuthenticatedSession & {
  csrfToken: string;
  sessionToken: string;
};

export class AuthenticationError extends Error {
  constructor(
    readonly code:
      | "account_disabled"
      | "invalid_credentials"
      | "invalid_setup_token"
      | "password_change_required"
      | "rate_limited"
      | "setup_complete"
      | "unauthenticated",
  ) {
    super(code);
    this.name = "AuthenticationError";
  }
}

const iso = (value: Date | string): string => new Date(value).toISOString();

const grants = (value: PermissionGrant[] | null): PermissionGrant[] => value ?? [];

const parseAccount = (
  row: AccountRow,
): { account: Account; role: Role; summary: AccountSummary } => {
  const directGrants = grants(row.direct_grants);
  const roleGrants = grants(row.role_grants);
  const role: Role = {
    grants: roleGrants,
    id: row.role_id,
    name: row.role_name,
    systemKey: row.system_key,
  };
  const account: Account = {
    createdAt: iso(row.created_at),
    directGrants,
    email: row.email,
    employeeId: row.employee_id,
    id: row.id,
    mustChangePassword: row.must_change_password,
    roleId: row.role_id,
    status: row.status,
    updatedAt: iso(row.updated_at),
  };
  return {
    account,
    role,
    summary: {
      ...account,
      effectiveGrants: [...roleGrants, ...directGrants],
      roleName: role.name,
      roleSystemKey: role.systemKey,
    },
  };
};

const ACCOUNT_SELECT = `
  SELECT a.id::text, a.email, a.employee_id::text, a.role_id::text, a.password_hash,
         a.must_change_password, a.status, a.created_at, a.updated_at,
         r.name AS role_name, r.system_key,
         COALESCE((SELECT jsonb_agg(jsonb_build_object('permission', permission, 'scope', scope))
                   FROM role_grants WHERE role_id = r.id), '[]'::jsonb) AS role_grants,
         COALESCE((SELECT jsonb_agg(jsonb_build_object('permission', permission, 'scope', scope))
                   FROM account_grants WHERE account_id = a.id), '[]'::jsonb) AS direct_grants
  FROM accounts a JOIN roles r ON r.id = a.role_id`;

const audit = async (
  client: PoolClient,
  input: {
    action: string;
    actorAccountId: AccountId | null;
    correlationId: string;
    result: "allowed" | "denied" | "failed" | "succeeded";
    targetIds?: string[];
  },
) =>
  appendAuditEvent(client, {
    action: input.action,
    actorAccountId: input.actorAccountId,
    correlationId: input.correlationId,
    result: input.result,
    targetIds: input.targetIds ?? [],
  });

const rateLimitBucket = async (
  client: PoolClient,
  key: string,
  failureLimit: number,
  failed: boolean,
): Promise<boolean> => {
  await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`org-tools:rate:${key}`]);
  const now = Date.now();
  const current = await client.query<{
    blocked_until: Date | null;
    failures: number;
    window_started_at: Date;
  }>(
    "SELECT window_started_at, failures, blocked_until FROM login_rate_limits WHERE bucket_key = $1 FOR UPDATE",
    [key],
  );
  const row = current.rows[0];
  if (row?.blocked_until && row.blocked_until.getTime() > now) return false;
  if (!failed) {
    if (failureLimit !== INSTANCE_FAILURE_LIMIT) {
      await client.query("DELETE FROM login_rate_limits WHERE bucket_key = $1", [key]);
    }
    return true;
  }
  const fresh = !row || now - row.window_started_at.getTime() >= RATE_LIMIT_WINDOW_MILLISECONDS;
  const failures = fresh ? 1 : row.failures + 1;
  const blockedUntil =
    failures >= failureLimit ? new Date(now + RATE_LIMIT_BLOCK_MILLISECONDS) : null;
  await client.query(
    `INSERT INTO login_rate_limits (bucket_key, window_started_at, failures, blocked_until)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (bucket_key) DO UPDATE SET
       window_started_at = EXCLUDED.window_started_at,
       failures = EXCLUDED.failures,
       blocked_until = EXCLUDED.blocked_until`,
    [key, fresh ? new Date(now) : row?.window_started_at, failures, blockedUntil],
  );
  return blockedUntil === null;
};

const rateLimitBlocked = async (
  database: Pool | PoolClient,
  keys: readonly string[],
): Promise<boolean> => {
  const result = await database.query(
    `SELECT 1 FROM login_rate_limits
     WHERE bucket_key = ANY($1::text[])
       AND blocked_until > clock_timestamp()
     LIMIT 1`,
    [keys],
  );
  return result.rowCount !== 0;
};

const issueSession = async (client: PoolClient, row: AccountRow): Promise<IssuedSession> => {
  const sessionToken = createOpaqueToken();
  const sessionId = randomUUID();
  const csrfToken = createSessionCsrfToken(sessionId, loadRuntimeConfig().database.password);
  const now = Date.now();
  await client.query(
    `INSERT INTO sessions
       (id, account_id, token_hash, csrf_hash, idle_expires_at, absolute_expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      sessionId,
      row.id,
      digestToken(sessionToken),
      digestToken(csrfToken),
      new Date(now + IDLE_SESSION_MILLISECONDS),
      new Date(now + ABSOLUTE_SESSION_MILLISECONDS),
    ],
  );
  const parsed = parseAccount(row);
  return {
    account: parsed.account,
    accountSummary: parsed.summary,
    csrfHash: digestToken(csrfToken),
    previousCsrfHash: null,
    csrfToken,
    role: parsed.role,
    sessionId,
    sessionToken,
  };
};

export class AuthService {
  private readonly organization: OrganizationRepository;

  constructor(private readonly pool: Pool = getDatabasePool()) {
    this.organization = new OrganizationRepository(pool);
  }

  async needsSetup(): Promise<boolean> {
    await this.organization.ensureInitialized();
    const result = await this.pool.query<{ count: string }>(
      "SELECT count(*)::text AS count FROM accounts",
    );
    return result.rows[0]?.count === "0";
  }

  async setup(input: {
    email: string;
    password: string;
    setupToken: string;
  }): Promise<IssuedSession> {
    await this.organization.ensureInitialized();
    const correlationId = randomUUID();
    if (!safeTokenEqual(input.setupToken, loadRuntimeConfig().setupToken)) {
      await withDatabaseTransaction(
        (client) =>
          audit(client, {
            action: "auth.setup",
            actorAccountId: null,
            correlationId,
            result: "denied",
          }),
        this.pool,
      );
      throw new AuthenticationError("invalid_setup_token");
    }
    if (!isPlausibleAccountEmail(input.email)) throw new AuthenticationError("invalid_credentials");
    const normalizedEmail = normalizeAccountEmail(input.email);
    const passwordHash = await hashPassword(input.password);
    return withDatabaseTransaction(async (client) => {
      await client.query("SELECT pg_advisory_xact_lock(hashtext('org-tools:first-account'))");
      const count = await client.query("SELECT 1 FROM accounts LIMIT 1");
      if (count.rowCount !== 0) throw new AuthenticationError("setup_complete");
      const identity = await client.query<{ employee_id: string }>(
        "SELECT employee_id::text FROM employee_identities WHERE normalized_email = $1",
        [normalizedEmail],
      );
      const accountId = randomUUID();
      await client.query(
        `INSERT INTO accounts
           (id, email, normalized_email, employee_id, role_id, password_hash, must_change_password, status)
         VALUES ($1, $2, $3, $4, $5, $6, FALSE, 'active')`,
        [
          accountId,
          input.email.trim().normalize("NFKC"),
          normalizedEmail,
          identity.rows[0]?.employee_id ?? null,
          SUPER_ADMIN_ROLE_ID,
          passwordHash,
        ],
      );
      await client.query(
        `INSERT INTO account_ui_states (account_id, ui_json)
         SELECT $1, bootstrap_ui_json FROM organization_documents WHERE singleton = TRUE`,
        [accountId],
      );
      const row = await client.query<AccountRow>(`${ACCOUNT_SELECT} WHERE a.id = $1`, [accountId]);
      const account = row.rows[0];
      if (!account) throw new Error("Created account is missing.");
      const session = await issueSession(client, account);
      await audit(client, {
        action: "auth.setup",
        actorAccountId: accountId,
        correlationId,
        result: "succeeded",
        targetIds: [accountId],
      });
      return session;
    }, this.pool);
  }

  async login(input: { email: string; password: string }): Promise<IssuedSession> {
    const correlationId = randomUUID();
    const plausibleEmail = isPlausibleAccountEmail(input.email);
    const normalizedEmail = plausibleEmail
      ? normalizeAccountEmail(input.email)
      : "invalid-account-identifier";
    const outcome = await withDatabaseTransaction<
      | { error: "invalid_credentials" | "rate_limited"; session?: never }
      | { error?: never; session: IssuedSession }
    >(async (client) => {
      if (await rateLimitBlocked(client, ["login:instance", `login:email:${normalizedEmail}`])) {
        await audit(client, {
          action: "auth.login",
          actorAccountId: null,
          correlationId,
          result: "denied",
        });
        return { error: "rate_limited" };
      }
      const row = await client.query<AccountRow>(
        `${ACCOUNT_SELECT} WHERE a.normalized_email = $1`,
        [normalizedEmail],
      );
      const account = row.rows[0];
      const verification = await verifyPassword(
        account?.password_hash ?? DUMMY_PASSWORD_HASH,
        input.password,
      );
      const failed =
        !plausibleEmail || !account || !verification.valid || account.status !== "active";
      const instanceAllowed = await rateLimitBucket(
        client,
        "login:instance",
        INSTANCE_FAILURE_LIMIT,
        failed,
      );
      const emailAllowed = await rateLimitBucket(
        client,
        `login:email:${normalizedEmail}`,
        EMAIL_FAILURE_LIMIT,
        failed,
      );
      if (!instanceAllowed || !emailAllowed) {
        await audit(client, {
          action: "auth.login",
          actorAccountId: account?.id ?? null,
          correlationId,
          result: "denied",
        });
        return { error: "rate_limited" };
      }
      if (!account || !verification.valid || account.status !== "active") {
        await audit(client, {
          action: "auth.login",
          actorAccountId: account?.id ?? null,
          correlationId,
          result: "failed",
        });
        return { error: "invalid_credentials" };
      }
      if (verification.needsRehash) {
        await client.query(
          "UPDATE accounts SET password_hash = $1, updated_at = clock_timestamp() WHERE id = $2",
          [await hashPassword(input.password), account.id],
        );
      }
      const session = await issueSession(client, account);
      await audit(client, {
        action: "auth.login",
        actorAccountId: account.id,
        correlationId,
        result: "succeeded",
        targetIds: [account.id],
      });
      return { session };
    }, this.pool);
    if (outcome.error) throw new AuthenticationError(outcome.error);
    return outcome.session;
  }

  async authenticate(sessionToken: string | null): Promise<AuthenticatedSession> {
    if (!sessionToken) throw new AuthenticationError("unauthenticated");
    return withDatabaseTransaction(async (client) => {
      const sessionSelect = ACCOUNT_SELECT.replace(
        "SELECT a.id::text",
        "SELECT s.id::text AS session_id, s.csrf_hash, s.previous_csrf_hash, s.idle_expires_at, s.absolute_expires_at, a.id::text",
      );
      const result = await client.query<SessionRow>(
        `${sessionSelect}, sessions s
         WHERE s.account_id = a.id AND s.token_hash = $1 AND s.revoked_at IS NULL
           AND s.idle_expires_at > clock_timestamp() AND s.absolute_expires_at > clock_timestamp()`,
        [digestToken(sessionToken)],
      );
      const row = result.rows[0];
      if (row?.status !== "active") throw new AuthenticationError("unauthenticated");
      await client.query(
        `UPDATE sessions SET last_seen_at = clock_timestamp(),
           idle_expires_at = LEAST(absolute_expires_at, clock_timestamp() + interval '8 hours')
         WHERE id = $1`,
        [row.session_id],
      );
      const parsed = parseAccount(row);
      return {
        account: parsed.account,
        accountSummary: parsed.summary,
        csrfHash: row.csrf_hash,
        previousCsrfHash: row.previous_csrf_hash,
        role: parsed.role,
        sessionId: row.session_id,
      };
    }, this.pool);
  }

  async logout(session: AuthenticatedSession): Promise<void> {
    await withDatabaseTransaction(async (client) => {
      await assertActiveSession(client, session.account.id, session.sessionId);
      await client.query("UPDATE sessions SET revoked_at = clock_timestamp() WHERE id = $1", [
        session.sessionId,
      ]);
      await audit(client, {
        action: "auth.logout",
        actorAccountId: session.account.id,
        correlationId: randomUUID(),
        result: "succeeded",
        targetIds: [session.sessionId],
      });
    }, this.pool);
  }

  async rotateCsrf(session: AuthenticatedSession): Promise<string> {
    const csrfToken = createSessionCsrfToken(
      session.sessionId,
      loadRuntimeConfig().database.password,
    );
    await this.pool.query(
      `UPDATE sessions
       SET previous_csrf_hash = CASE WHEN csrf_hash = $1 THEN previous_csrf_hash ELSE csrf_hash END,
           csrf_hash = $1
       WHERE id = $2 AND revoked_at IS NULL`,
      [digestToken(csrfToken), session.sessionId],
    );
    return csrfToken;
  }

  async changePassword(
    session: AuthenticatedSession,
    currentPassword: string,
    password: string,
  ): Promise<void> {
    const result = await this.pool.query<{ password_hash: string }>(
      "SELECT password_hash FROM accounts WHERE id = $1",
      [session.account.id],
    );
    const current = result.rows[0];
    if (!current || !(await verifyPassword(current.password_hash, currentPassword)).valid) {
      throw new AuthenticationError("invalid_credentials");
    }
    const passwordHash = await hashPassword(password);
    await withDatabaseTransaction(async (client) => {
      await assertActiveSession(client, session.account.id, session.sessionId);
      await client.query(
        "UPDATE accounts SET password_hash = $1, must_change_password = FALSE, updated_at = clock_timestamp() WHERE id = $2",
        [passwordHash, session.account.id],
      );
      await client.query(
        "UPDATE sessions SET revoked_at = clock_timestamp() WHERE account_id = $1 AND id <> $2",
        [session.account.id, session.sessionId],
      );
      await audit(client, {
        action: "auth.password.change",
        actorAccountId: session.account.id,
        correlationId: randomUUID(),
        result: "succeeded",
        targetIds: [session.account.id],
      });
    }, this.pool);
  }

  async verifyCurrentPassword(session: AuthenticatedSession, password: string): Promise<void> {
    const result = await this.pool.query<{ password_hash: string }>(
      "SELECT password_hash FROM accounts WHERE id = $1",
      [session.account.id],
    );
    const current = result.rows[0];
    if (!current || !(await verifyPassword(current.password_hash, password)).valid) {
      throw new AuthenticationError("invalid_credentials");
    }
  }

  async bootstrapUi(accountId: AccountId): Promise<AccountUiState> {
    return this.organization.readUi(accountId);
  }
}

export const sessionCookieName = (): string =>
  loadRuntimeConfig().publicOrigin.startsWith("https://") ? "__Host-id" : "org-tools-id";

export const sessionCookie = (token: string, maxAge = 24 * 60 * 60): string => {
  const secure = loadRuntimeConfig().publicOrigin.startsWith("https://") ? "; Secure" : "";
  return `${sessionCookieName()}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
};

export const clearSessionCookie = (): string => sessionCookie("", 0);
