import { describe, expect, it } from "vitest";

import { isForbiddenDataPath } from "./check-public-safety.mjs";

describe("publication data path guard", () => {
  it.each([
    "state.sqlite3",
    "state.sqlite3-before-migration",
    "snapshot.db",
    "database.dump",
    "database.pgdump",
    "recovery.sql.gz",
    "state.org-tools-backup",
    "state.before-change.bak",
    "postgres/pg_wal/000000010000000000000001",
  ])("rejects %s", (path) => {
    expect(isForbiddenDataPath(path)).toBe(true);
  });

  it.each(["apps/ui/migrations/0001_enterprise_auth.sql", ".env.example", "README.md"])(
    "allows %s",
    (path) => {
      expect(isForbiddenDataPath(path)).toBe(false);
    },
  );
});
