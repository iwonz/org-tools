import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { EditableEmployeeFields } from "@org-tools/types";
import { afterEach, describe, expect, it, vi } from "vitest";

import { McpRepository } from "@/server/mcp-repository";
import { StateRepository } from "@/server/state-repository";

const temporaryDirectories: string[] = [];
const databasePath = () => {
  const directory = mkdtempSync(join(tmpdir(), "org-tools-mcp-"));
  temporaryDirectories.push(directory);
  return join(directory, "state.sqlite3");
};

const employee = (): EditableEmployeeFields => ({
  avatarBase64Url: null,
  birthday: "03-14",
  email: "casey@example.test",
  firstName: "Casey",
  gender: "unspecified",
  lastName: "Rivera",
  phone: "+1 555-0102",
  profileUrl: null,
  tags: [{ date: null, label: "Operations" }],
  username: "casey",
});

afterEach(() => {
  vi.useRealTimers();
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

describe("MCP repository", () => {
  it("keeps MCP disabled by default and rotates a 256-bit prefixed token", () => {
    const path = databasePath();
    new StateRepository(path).close();
    const repository = new McpRepository(path);

    expect(repository.getSettings()).toMatchObject({ enabled: false, hasToken: false });
    expect(repository.authenticate("missing")).toBe(false);
    repository.setEnabled(true);
    const firstToken = repository.revealToken();
    expect(firstToken).toMatch(/^ot_mcp_[A-Za-z0-9_-]{43}$/u);
    expect(repository.getSettings().maskedToken).toBe(`ot_mcp_${"•".repeat(24)}`);
    expect(repository.authenticate(firstToken)).toBe(true);
    const rotated = repository.rotateToken();
    expect(rotated.token).not.toBe(firstToken);
    expect(repository.authenticate(firstToken)).toBe(false);
    expect(repository.authenticate(rotated.token)).toBe(true);
    repository.setEnabled(false);
    expect(repository.authenticate(rotated.token)).toBe(false);
    expect(repository.revealToken()).toBe(rotated.token);
    repository.close();
  });

  it("previews and atomically applies an idempotent change, then selectively undoes it", () => {
    const path = databasePath();
    const stateRepository = new StateRepository(path);
    const repository = new McpRepository(path);
    const preview = repository.previewChange({
      actor: "test-agent",
      expectedRevision: 1,
      operations: [{ employee: employee(), ref: "employee.casey", type: "employee.create" }],
      reason: "Add the synthetic Operations Employee",
    });
    expect(stateRepository.read().state.organization.employees).toHaveLength(0);

    const applied = repository.applyPreview(preview.previewId);
    expect(applied).toMatchObject({ baseRevision: 1, resultRevision: 2 });
    expect(repository.applyPreview(preview.previewId)).toEqual(applied);
    expect(stateRepository.read().state.organization.employees[0]).toMatchObject({
      email: "casey@example.test",
      firstName: "Casey",
    });
    expect(repository.listChanges().items[0]).toMatchObject({
      actor: "test-agent",
      changeId: applied.changeId,
    });

    const undo = repository.previewUndo({
      changeId: applied.changeId,
      expectedRevision: 2,
    });
    const undone = repository.applyPreview(undo.previewId);
    expect(undone.resultRevision).toBe(3);
    expect(stateRepository.read().state.organization.employees).toHaveLength(0);
    repository.close();
    stateRepository.close();
  });

  it("rejects stale previews without replacing either version", () => {
    const path = databasePath();
    const stateRepository = new StateRepository(path);
    const repository = new McpRepository(path);
    const preview = repository.previewChange({
      expectedRevision: 1,
      operations: [{ employee: employee(), type: "employee.create" }],
      reason: "Prepare an Employee",
    });
    const initial = stateRepository.read();
    stateRepository.write({ scope: "ui", ui: { ...initial.state.ui, theme: "dark" } }, 1);

    expect(() => repository.applyPreview(preview.previewId)).toThrowError(
      expect.objectContaining({ code: "revision_conflict" }),
    );
    const current = stateRepository.read();
    expect(current.revision).toBe(2);
    expect(current.state.ui.theme).toBe("dark");
    expect(current.state.organization.employees).toHaveLength(0);
    repository.close();
    stateRepository.close();
  });

  it("expires unapplied previews and revokes them when the token rotates", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-31T12:00:00.000Z"));
    const path = databasePath();
    const stateRepository = new StateRepository(path);
    const repository = new McpRepository(path);
    const expired = repository.previewChange({
      expectedRevision: 1,
      operations: [{ employee: employee(), type: "employee.create" }],
      reason: "Expire this preview",
    });
    vi.advanceTimersByTime(10 * 60 * 1_000 + 1);
    expect(() => repository.applyPreview(expired.previewId)).toThrowError(
      expect.objectContaining({ code: "preview_expired" }),
    );

    const revoked = repository.previewChange({
      expectedRevision: 1,
      operations: [{ employee: employee(), type: "employee.create" }],
      reason: "Revoke this preview",
    });
    repository.rotateToken();
    expect(() => repository.applyPreview(revoked.previewId)).toThrowError(
      expect.objectContaining({ code: "not_found" }),
    );
    repository.close();
    stateRepository.close();
  });

  it("retains at most one hundred compacted applied changes", () => {
    const path = databasePath();
    const stateRepository = new StateRepository(path);
    const repository = new McpRepository(path);
    for (let index = 0; index < 101; index += 1) {
      const revision = index + 1;
      const preview = repository.previewChange({
        expectedRevision: revision,
        operations: [
          {
            employee: {
              ...employee(),
              email: `employee-${index}@example.test`,
              username: `employee-${index}`,
            },
            type: "employee.create",
          },
        ],
        reason: `Add synthetic Employee ${index}`,
      });
      repository.applyPreview(preview.previewId);
    }
    expect(repository.listChanges({ limit: 100 })).toMatchObject({
      items: { length: 100 },
      nextCursor: null,
    });
    repository.close();
    stateRepository.close();

    const database = new DatabaseSync(path);
    expect(database.prepare("SELECT count(*) AS count FROM mcp_changes").get()).toEqual({
      count: 100,
    });
    expect(database.prepare("SELECT count(*) AS count FROM mcp_previews").get()).toEqual({
      count: 100,
    });
    expect(
      database
        .prepare(
          "SELECT count(*) AS count FROM mcp_previews WHERE before_organization_json = '{}' AND after_organization_json = '{}'",
        )
        .get(),
    ).toEqual({ count: 100 });
    database.close();
  });
});
