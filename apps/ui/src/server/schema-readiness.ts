import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";

import { getDatabasePool } from "@/server/database";

let readiness: Promise<void> | null = null;

export const resolveMigrationsDirectory = (workingDirectory: string): string =>
  workingDirectory.endsWith(`${sep}apps${sep}ui`)
    ? resolve(workingDirectory, "migrations")
    : resolve(workingDirectory, "apps/ui/migrations");

const verify = async (): Promise<void> => {
  const directory = resolveMigrationsDirectory(process.cwd());
  const files = (await readdir(directory))
    .filter((name) => /^\d{4}_[a-z0-9_]+\.sql$/u.test(name))
    .sort();
  const result = await getDatabasePool().query<{ checksum: string; name: string }>(
    "SELECT name, checksum FROM schema_migrations ORDER BY name",
  );
  if (result.rows.length !== files.length) {
    throw new Error("Schema migrations are pending or unknown.");
  }
  for (const [index, file] of files.entries()) {
    const row = result.rows[index];
    const digest = createHash("sha256")
      .update(await readFile(resolve(directory, file), "utf8"))
      .digest("hex");
    if (row?.name !== file || row.checksum !== digest) {
      throw new Error("Schema migration checksum is invalid.");
    }
  }
};

export const assertSchemaReady = async (): Promise<void> => {
  readiness ??= verify().catch((error) => {
    readiness = null;
    throw error;
  });
  return readiness;
};

export const clearSchemaReadinessForTests = (): void => {
  readiness = null;
};
