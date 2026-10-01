import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import process from "node:process";
import readline from "node:readline";
import argon2 from "argon2";

const pg = createRequire(import.meta.url)("pg");

const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
};

const ask = (prompt, hidden = false) =>
  new Promise((resolve, reject) => {
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
      reject(new Error("Recovery requires an interactive TTY."));
      return;
    }
    if (!hidden) {
      const interface_ = readline.createInterface({ input: process.stdin, output: process.stdout });
      interface_.question(prompt, (answer) => {
        interface_.close();
        resolve(answer);
      });
      return;
    }
    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");
    let value = "";
    const onData = (character) => {
      if (character === "\r" || character === "\n") {
        process.stdin.off("data", onData);
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdout.write("\n");
        resolve(value);
      } else if (character === "\u0003") {
        process.stdin.setRawMode(false);
        reject(new Error("Recovery cancelled."));
      } else if (character === "\u007f") {
        value = value.slice(0, -1);
      } else {
        value += character;
      }
    };
    process.stdin.on("data", onData);
  });

const main = async () => {
  const email = String(await ask("Super Administrator email: "))
    .trim()
    .normalize("NFKC")
    .toLocaleLowerCase("en-US");
  const password = String(await ask("New password: ", true));
  if ([...password].length < 15 || [...password].length > 128)
    throw new Error("Password must contain between 15 and 128 Unicode code points.");
  const sslMode = required("ORG_TOOLS_DB_SSLMODE");
  if (!["disable", "require", "verify-ca", "verify-full"].includes(sslMode)) {
    throw new Error("ORG_TOOLS_DB_SSLMODE is invalid.");
  }
  const client = new pg.Client({
    database: required("POSTGRES_DB"),
    host: required("ORG_TOOLS_DB_HOST"),
    password: required("ORG_TOOLS_DB_PASSWORD"),
    port: Number(required("ORG_TOOLS_DB_PORT")),
    ssl:
      sslMode === "disable"
        ? undefined
        : { rejectUnauthorized: sslMode === "verify-ca" || sslMode === "verify-full" },
    user: required("ORG_TOOLS_DB_USER"),
  });
  await client.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock_shared(hashtext('org-tools:maintenance'))");
    const account = await client.query(
      `SELECT a.id::text FROM accounts a JOIN roles r ON r.id = a.role_id
       WHERE a.normalized_email = $1 AND r.system_key = 'superAdmin' AND a.status = 'active'
       FOR UPDATE`,
      [email],
    );
    const accountId = account.rows[0]?.id;
    if (!accountId) throw new Error("Active Super Administrator was not found.");
    const encoded = await argon2.hash(password, {
      hashLength: 32,
      memoryCost: 65_536,
      parallelism: 1,
      timeCost: 3,
      type: argon2.argon2id,
    });
    await client.query(
      "UPDATE accounts SET password_hash = $1, must_change_password = FALSE, updated_at = clock_timestamp() WHERE id = $2",
      [encoded, accountId],
    );
    await client.query("UPDATE sessions SET revoked_at = clock_timestamp() WHERE account_id = $1", [
      accountId,
    ]);
    await client.query(
      `INSERT INTO audit_events (id, actor_account_id, action, target_ids, result, correlation_id)
       VALUES ($1, NULL, 'auth.super-admin.recovery', $2::jsonb, 'succeeded', $3)`,
      [randomUUID(), JSON.stringify([accountId]), randomUUID()],
    );
    const revision = await client.query(
      `UPDATE organization_documents
       SET security_revision = security_revision + 1, updated_at = clock_timestamp()
       WHERE singleton = TRUE
       RETURNING revision, security_revision`,
    );
    const document = revision.rows[0];
    if (!document) throw new Error("Organization document was not found.");
    await client.query(
      `INSERT INTO server_events
         (organization_revision, security_revision, event_kind, account_id)
       VALUES ($1, $2, 'security', NULL)`,
      [document.revision, document.security_revision],
    );
    await client.query("COMMIT");
    process.stdout.write("Super Administrator password reset; all sessions were revoked.\n");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
};

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Recovery failed."}\n`);
  process.exitCode = 1;
});
