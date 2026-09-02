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
    expect(initial.state.organization.structure.units).toHaveLength(0);
    expect(
      repository
        .unsafeStatementForTests(
          "SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
        )
        .all(),
    ).toEqual([{ name: "application_state" }]);

    const state = createBlankOrgToolsState("dark", "ru");
    expect(repository.write({ scope: "all", state }).revision).toBe(2);
    repository.close();

    const reopened = new StateRepository(databasePath);
    expect(reopened.read()).toEqual({ revision: 2, state });
    reopened.close();
  });

  it("rejects a former project schema without changing it", () => {
    const databasePath = temporaryDatabasePath();
    const database = new DatabaseSync(databasePath);
    database.exec(`
      CREATE TABLE projects (id TEXT PRIMARY KEY);
      CREATE TABLE app_state (last_project_id TEXT);
      INSERT INTO projects (id) VALUES ('preserve-me');
    `);
    database.close();

    expect(() => new StateRepository(databasePath)).toThrowError(
      expect.objectContaining({ code: "database_unavailable" }),
    );
    const unchanged = new DatabaseSync(databasePath);
    expect(
      unchanged
        .prepare(
          "SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
        )
        .all(),
    ).toEqual([{ name: "app_state" }, { name: "projects" }]);
    expect(unchanged.prepare("SELECT id FROM projects").get()).toEqual({ id: "preserve-me" });
    unchanged.close();
  });

  it("opens an exact existing singleton schema without changing it", () => {
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
    repository.close();
  });

  it("rejects an incomplete current-looking schema without changing it", () => {
    const databasePath = temporaryDatabasePath();
    const database = new DatabaseSync(databasePath);
    database.exec(`
      CREATE TABLE application_state (id INTEGER PRIMARY KEY, marker TEXT);
      INSERT INTO application_state (id, marker) VALUES (1, 'preserve-me');
    `);
    database.close();

    expect(() => new StateRepository(databasePath)).toThrowError(
      expect.objectContaining({ code: "database_unavailable" }),
    );
    const unchanged = new DatabaseSync(databasePath);
    expect(unchanged.prepare("SELECT marker FROM application_state WHERE id = 1").get()).toEqual({
      marker: "preserve-me",
    });
    unchanged.close();
  });

  it("writes bounded UI independently and preserves organization data", () => {
    const repository = new StateRepository(":memory:");
    const initial = repository.read();
    const ui = { ...initial.state.ui, locale: "ru" as const, theme: "dark" as const };
    const updated = repository.write({ scope: "ui", ui });

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

    expect(() => repository.write({ scope: "all", state: invalid as never })).toThrow(
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
    database.exec("CREATE TABLE unexpected (id INTEGER PRIMARY KEY);");
    database.close();

    expect(() => new StateRepository(databasePath)).toThrowError(
      expect.objectContaining({ code: "database_unavailable" }),
    );
  });
});
