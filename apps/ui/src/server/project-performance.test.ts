import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";

import { createBlankOrgToolsState, parseOrgToolsState } from "@/lib/org-file";
import { createProjectUiState } from "@/lib/project-workspace";
import { ProjectRepository } from "@/server/project-repository";

const directory = mkdtempSync(join(tmpdir(), "org-tools-performance-test-"));
const repository = new ProjectRepository(join(directory, "workspace.sqlite3"));
const timestamp = "2026-01-15T12:00:00.000Z";
const employeeId = (index: number) =>
  `10000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`;
const unitId = (index: number) => `20000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`;

afterAll(() => {
  repository.close();
  rmSync(directory, { force: true, recursive: true });
});

describe("maintained project Save scale", () => {
  it("persists 20,000 Employees and 4,000 Units while keeping UI Save bounded", () => {
    const state = createBlankOrgToolsState("light");
    state.employees = Array.from({ length: 20_000 }, (_, index) => ({
      avatarBase64Url: null,
      birthday: null,
      createdAt: timestamp,
      email: `employee-${index + 1}@example.test`,
      firstName: "Synthetic",
      gender: "unspecified" as const,
      id: employeeId(index),
      lastName: String(index + 1),
      phone: null,
      profileUrl: null,
      tags: [],
      updatedAt: timestamp,
      username: `employee-${index + 1}`,
    }));
    const mainView = state.views[0];
    if (!mainView) throw new Error("Main View is unavailable.");
    mainView.state.units = Array.from({ length: 4_000 }, (_, index) => {
      const firstEmployee = index * 5;
      const employeeIds = Array.from({ length: 5 }, (_, offset) =>
        employeeId(firstEmployee + offset),
      );
      return {
        bossEmployeeId: employeeIds[0] ?? null,
        collapsed: false,
        createdAt: timestamp,
        employeeIds,
        employeePositions: employeeIds.map((id) => ({ employeeId: id, position: null })),
        id: unitId(index),
        liveFilter: null,
        name: `Unit ${index + 1}`,
        order: index,
        parentId: null,
        updatedAt: timestamp,
        x: (index % 50) * 360,
        y: Math.floor(index / 50) * 240,
      };
    });
    const parsed = parseOrgToolsState(state);
    const project = repository.ensureCurrentProject();
    const saved = repository.saveState(project.id, parsed, project.stateRevision);

    expect(saved.state.employees).toHaveLength(20_000);
    expect(saved.state.views[0]?.state.units).toHaveLength(4_000);
    expect(repository.openProject(project.id).stateRevision).toBe(2);
    const uiJson = JSON.stringify(createProjectUiState(parsed));
    expect(uiJson.length).toBeLessThan(1_000);
    expect(uiJson).not.toContain("employee-1@example.test");
    expect(uiJson).not.toContain("Unit 1");
  });
});
