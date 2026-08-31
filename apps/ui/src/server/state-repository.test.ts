import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import { afterEach, describe, expect, it } from "vitest";

import { createBlankOrgToolsState } from "@/lib/org-file";
import { StateRepository, StateRepositoryError } from "@/server/state-repository";

const temporaryDirectories: string[] = [];

const temporaryDatabasePath = () => {
  const directory = mkdtempSync(join(tmpdir(), "org-tools-state-"));
  temporaryDirectories.push(directory);
  return join(directory, "state.sqlite3");
};

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

describe("singleton state repository", () => {
  it("creates one strict state row and reopens it", () => {
    const databasePath = temporaryDatabasePath();
    const repository = new StateRepository(databasePath);
    const initial = repository.read();
    expect(initial.revision).toBe(1);
    expect(initial.state.organization.views).toHaveLength(1);

    const state = createBlankOrgToolsState("dark", "ru");
    expect(repository.write({ scope: "all", state }, 1).revision).toBe(2);
    repository.close();

    const reopened = new StateRepository(databasePath);
    expect(reopened.read()).toEqual({ revision: 2, state });
    reopened.close();
  });

  it("replaces the obsolete project schema without migrating its rows", () => {
    const databasePath = temporaryDatabasePath();
    const database = new DatabaseSync(databasePath);
    database.exec(`
      CREATE TABLE projects (id TEXT PRIMARY KEY);
      CREATE TABLE app_state (last_project_id TEXT);
      PRAGMA user_version = 1;
    `);
    database.close();

    const repository = new StateRepository(databasePath);
    expect(repository.read().state.organization.employees).toEqual([]);
    expect(
      repository
        .unsafeStatementForTests(
          "SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
        )
        .all(),
    ).toEqual([
      { name: "application_state" },
      { name: "mcp_changes" },
      { name: "mcp_previews" },
      { name: "mcp_settings" },
    ]);
    repository.close();
  });

  it("migrates the singleton schema from version 1 without changing state", () => {
    const databasePath = temporaryDatabasePath();
    const state = createBlankOrgToolsState("dark", "ru");
    const database = new DatabaseSync(databasePath);
    database.exec(`
      CREATE TABLE application_state (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        organization_json TEXT NOT NULL,
        ui_json TEXT NOT NULL,
        revision INTEGER NOT NULL CHECK (revision >= 1),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      ) STRICT;
      PRAGMA user_version = 1;
    `);
    database
      .prepare(
        `INSERT INTO application_state
         (id, organization_json, ui_json, revision, created_at, updated_at)
         VALUES (1, ?, ?, 7, ?, ?)`,
      )
      .run(
        JSON.stringify(state.organization),
        JSON.stringify(state.ui),
        "2026-08-31T00:00:00.000Z",
        "2026-08-31T00:00:00.000Z",
      );
    database.close();

    const repository = new StateRepository(databasePath);
    expect(repository.read()).toEqual({ revision: 7, state });
    expect(repository.unsafeStatementForTests("PRAGMA user_version").get()).toEqual({
      user_version: 2,
    });
    expect(
      repository.unsafeStatementForTests("SELECT enabled, token FROM mcp_settings").get(),
    ).toEqual({
      enabled: 0,
      token: null,
    });
    repository.close();
  });

  it("writes bounded UI independently and preserves organization data", () => {
    const repository = new StateRepository(":memory:");
    const initial = repository.read();
    const ui = { ...initial.state.ui, locale: "ru" as const, theme: "dark" as const };
    const updated = repository.write({ scope: "ui", ui }, 1);

    expect(updated.revision).toBe(2);
    expect(updated.state.organization).toEqual(initial.state.organization);
    expect(updated.state.ui).toEqual(ui);
    repository.close();
  });

  it("rejects invalid writes atomically and never repairs corrupt stored JSON", () => {
    const repository = new StateRepository(":memory:");
    const before = repository.read();
    const invalid = structuredClone(before.state) as unknown as Record<string, unknown>;
    invalid.unexpected = true;

    expect(() => repository.write({ scope: "all", state: invalid as never }, 1)).toThrow(
      StateRepositoryError,
    );
    expect(repository.read()).toEqual(before);

    repository
      .unsafeStatementForTests("UPDATE application_state SET organization_json = '{broken'")
      .run();
    expect(() => repository.read()).toThrowError(
      expect.objectContaining({ code: "corrupt_stored_state" }),
    );
    repository.close();
  });

  it("rejects unknown schemas", () => {
    const databasePath = temporaryDatabasePath();
    const database = new DatabaseSync(databasePath);
    database.exec("CREATE TABLE unexpected (id INTEGER PRIMARY KEY); PRAGMA user_version = 9;");
    database.close();

    expect(() => new StateRepository(databasePath)).toThrowError(
      expect.objectContaining({ code: "database_unavailable" }),
    );
  });
});
