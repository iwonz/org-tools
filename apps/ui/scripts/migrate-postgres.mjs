import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const { Client } = createRequire(import.meta.url)("pg");
const migrationsDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "../migrations");
const identifierPattern = /^[a-z_][a-z0-9_]{0,62}$/u;

const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
};

const identifier = (name) => {
  const value = required(name);
  if (!identifierPattern.test(value)) throw new Error(`${name} is invalid.`);
  return value;
};

const quoteIdentifier = (value) => `"${value.replaceAll('"', '""')}"`;
const quoteLiteral = (value) => `'${value.replaceAll("'", "''")}'`;
const checksum = (value) => createHash("sha256").update(value).digest("hex");

const sslMode = required("ORG_TOOLS_DB_SSLMODE");
const ssl = sslMode === "disable" ? undefined : { rejectUnauthorized: sslMode !== "require" };
const ownerUser = identifier("POSTGRES_USER");
const applicationUser = identifier("ORG_TOOLS_DB_USER");

const client = new Client({
  application_name: "org-tools-migrate",
  database: identifier("POSTGRES_DB"),
  host: required("ORG_TOOLS_DB_HOST"),
  password: required("POSTGRES_PASSWORD"),
  port: Number(required("ORG_TOOLS_DB_PORT")),
  ssl,
  user: ownerUser,
});

try {
  await client.connect();
  await client.query("SELECT pg_advisory_lock(hashtext('org-tools-schema-migrations'))");
  await client.query("BEGIN");
  const existingRole = await client.query("SELECT 1 FROM pg_roles WHERE rolname = $1", [
    applicationUser,
  ]);
  if (existingRole.rowCount === 0) {
    await client.query(
      `CREATE ROLE ${quoteIdentifier(applicationUser)} LOGIN PASSWORD ${quoteLiteral(required("ORG_TOOLS_DB_PASSWORD"))} NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT`,
    );
  } else {
    await client.query(
      `ALTER ROLE ${quoteIdentifier(applicationUser)} PASSWORD ${quoteLiteral(required("ORG_TOOLS_DB_PASSWORD"))}`,
    );
  }
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      checksum TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
    )
  `);
  const files = (await readdir(migrationsDirectory))
    .filter((name) => /^\d{4}_[a-z0-9_]+\.sql$/u.test(name))
    .sort();
  const appliedRows = await client.query(
    "SELECT name, checksum FROM schema_migrations ORDER BY name",
  );
  const applied = new Map(appliedRows.rows.map((row) => [row.name, row.checksum]));
  for (const appliedName of applied.keys()) {
    if (!files.includes(appliedName))
      throw new Error(`Applied migration is missing: ${appliedName}`);
  }
  for (const file of files) {
    const sql = await readFile(resolve(migrationsDirectory, file), "utf8");
    const digest = checksum(sql);
    const previous = applied.get(file);
    if (previous && previous !== digest)
      throw new Error(`Applied migration checksum changed: ${file}`);
    if (previous) continue;
    await client.query(sql);
    await client.query("INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)", [
      file,
      digest,
    ]);
  }
  await client.query(`GRANT USAGE ON SCHEMA public TO ${quoteIdentifier(applicationUser)}`);
  await client.query(
    `GRANT USAGE ON TYPE permission_name, permission_scope TO ${quoteIdentifier(applicationUser)}`,
  );
  await client.query(
    `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${quoteIdentifier(applicationUser)}`,
  );
  await client.query(
    `REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON schema_migrations FROM ${quoteIdentifier(applicationUser)}`,
  );
  await client.query(`GRANT SELECT ON schema_migrations TO ${quoteIdentifier(applicationUser)}`);
  await client.query(
    `GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${quoteIdentifier(applicationUser)}`,
  );
  await client.query("COMMIT");
} catch (error) {
  await client.query("ROLLBACK").catch(() => undefined);
  process.stderr.write(
    `Migration failed: ${error instanceof Error ? error.message : "unknown error"}\n`,
  );
  process.exitCode = 1;
} finally {
  await client
    .query("SELECT pg_advisory_unlock(hashtext('org-tools-schema-migrations'))")
    .catch(() => undefined);
  await client.end().catch(() => undefined);
}
