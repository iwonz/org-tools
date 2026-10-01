import { createRequire } from "node:module";
import type { Pool as DatabasePool, PoolClient, PoolConfig } from "pg";

import { loadRuntimeConfig, type RuntimeConfig } from "@/server/runtime-config";

const { Pool } = createRequire(import.meta.url)("pg") as typeof import("pg");

export class SessionRevokedError extends Error {
  constructor() {
    super("Session is no longer active.");
    this.name = "SessionRevokedError";
  }
}

type DatabaseGlobal = typeof globalThis & { __orgToolsDatabasePool?: DatabasePool };

const sslFor = (mode: RuntimeConfig["database"]["sslMode"]): PoolConfig["ssl"] => {
  if (mode === "disable") return undefined;
  return { rejectUnauthorized: mode === "verify-ca" || mode === "verify-full" };
};

export const createDatabasePool = (config = loadRuntimeConfig()): DatabasePool =>
  new Pool({
    application_name: "org-tools",
    database: config.database.database,
    host: config.database.host,
    idleTimeoutMillis: 30_000,
    max: 12,
    password: config.database.password,
    port: config.database.port,
    ssl: sslFor(config.database.sslMode),
    user: config.database.user,
  });

export const getDatabasePool = (): DatabasePool => {
  const shared = globalThis as DatabaseGlobal;
  shared.__orgToolsDatabasePool ??= createDatabasePool();
  return shared.__orgToolsDatabasePool;
};

export const withDatabaseTransaction = async <T>(
  operation: (client: PoolClient) => Promise<T>,
  pool: DatabasePool = getDatabasePool(),
  options: {
    isolation?: "repeatable read";
    maintenance?: "exclusive" | "shared";
    readOnly?: boolean;
  } = {},
): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (options.isolation || options.readOnly) {
      await client.query(
        `SET TRANSACTION${options.isolation ? ` ISOLATION LEVEL ${options.isolation.toUpperCase()}` : ""}${options.readOnly ? " READ ONLY" : ""}`,
      );
    }
    await client.query(
      options.maintenance === "exclusive"
        ? "SELECT pg_advisory_xact_lock(hashtext('org-tools:maintenance'))"
        : "SELECT pg_advisory_xact_lock_shared(hashtext('org-tools:maintenance'))",
    );
    const result = await operation(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const assertActiveSession = async (
  client: PoolClient,
  accountId: string,
  sessionId: string,
): Promise<void> => {
  const result = await client.query(
    `SELECT 1 FROM sessions s
     JOIN accounts a ON a.id = s.account_id
     WHERE s.id = $1 AND s.account_id = $2 AND s.revoked_at IS NULL
       AND s.idle_expires_at > clock_timestamp()
       AND s.absolute_expires_at > clock_timestamp()
       AND a.status = 'active'`,
    [sessionId, accountId],
  );
  if (result.rowCount === 0) throw new SessionRevokedError();
};

export const closeDatabasePoolForTests = async (): Promise<void> => {
  const shared = globalThis as DatabaseGlobal;
  await shared.__orgToolsDatabasePool?.end();
  delete shared.__orgToolsDatabasePool;
};
