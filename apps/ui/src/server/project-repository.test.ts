import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { createBlankOrgToolsState } from "@/lib/org-file";
import { createProjectUiState } from "@/lib/project-workspace";
import {
  normalizeProjectName,
  ProjectRepository,
  ProjectRepositoryError,
} from "@/server/project-repository";

const repositories: ProjectRepository[] = [];
const temporaryDirectories: string[] = [];

const createDatabasePath = () => {
  const directory = mkdtempSync(join(tmpdir(), "org-tools-repository-"));
  temporaryDirectories.push(directory);
  return join(directory, "workspace.sqlite3");
};

const openRepository = (databasePath = createDatabasePath()) => {
  const repository = new ProjectRepository(databasePath);
  repositories.push(repository);
  return repository;
};

afterEach(() => {
  for (const repository of repositories.splice(0)) repository.close();
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

describe("project repository", () => {
  it("creates schema v1 and reopens the last selected project", () => {
    const databasePath = createDatabasePath();
    const firstRepository = openRepository(databasePath);
    const first = firstRepository.ensureCurrentProject();
    const second = firstRepository.createProject("Planning");
    expect(firstRepository.unsafeStatementForTests("PRAGMA user_version").get()).toEqual({
      user_version: 1,
    });
    firstRepository.close();
    repositories.splice(repositories.indexOf(firstRepository), 1);

    const reopened = openRepository(databasePath);
    expect(reopened.ensureCurrentProject()).toMatchObject({ id: second.id, name: "Planning" });
    expect(reopened.listProjects().projects.map((project) => project.id)).toContain(first.id);
  });

  it("normalizes names and enforces normalized case-insensitive uniqueness", () => {
    const repository = openRepository();
    repository.createProject("  Résumé  ");
    expect(normalizeProjectName("Résumé")).toEqual({ key: "résumé", name: "Résumé" });
    expect(() => repository.createProject("RÉSUMÉ")).toThrowError(
      expect.objectContaining({ code: "duplicate_name" }),
    );
  });

  it("supports CRUD and recreates a default after deleting the final project", () => {
    const repository = openRepository();
    const initial = repository.ensureCurrentProject();
    const renamed = repository.renameProject(initial.id, "Operations");
    expect(renamed.name).toBe("Operations");

    const { nextProject } = repository.deleteProject(initial.id);
    expect(nextProject.id).not.toBe(initial.id);
    expect(nextProject.name).toBe("New project");
    expect(repository.listProjects()).toMatchObject({
      currentProjectId: nextProject.id,
      projects: [{ id: nextProject.id }],
    });
  });

  it("validates before writing and increments state revisions atomically", () => {
    const repository = openRepository();
    const project = repository.ensureCurrentProject();
    const state = createBlankOrgToolsState("dark");
    const saved = repository.saveState(project.id, state, project.stateRevision);
    expect(saved.stateRevision).toBe(2);
    expect(saved.state.ui.theme).toBe("dark");

    expect(() => repository.saveState(project.id, { kind: "invalid" }, 2)).toThrowError(
      expect.objectContaining({ code: "invalid_state" }),
    );
    expect(repository.openProject(project.id).stateRevision).toBe(2);
  });

  it("returns the current revision without losing either conflict version", () => {
    const repository = openRepository();
    const project = repository.ensureCurrentProject();
    const firstTab = {
      ...project.state,
      ui: { ...project.state.ui, activeTab: "employees" as const },
    };
    const secondTab = {
      ...project.state,
      ui: { ...project.state.ui, activeTab: "calendar" as const },
    };
    repository.saveState(project.id, firstTab, 1);

    try {
      repository.saveState(project.id, secondTab, 1);
      throw new Error("Expected a revision conflict.");
    } catch (error) {
      expect(error).toBeInstanceOf(ProjectRepositoryError);
      expect(error).toMatchObject({ code: "revision_conflict", currentRevision: 2 });
    }
    expect(repository.openProject(project.id).state.ui.activeTab).toBe("employees");
    expect(secondTab.ui.activeTab).toBe("calendar");
  });

  it("stores only the bounded UI overlay and filters dangling references", () => {
    const repository = openRepository();
    const project = repository.ensureCurrentProject();
    const overlay = createProjectUiState(project.state);
    overlay.activeViewId = crypto.randomUUID();
    overlay.ui.selectedUnitId = crypto.randomUUID();
    overlay.ui.expandedUnitIds = [crypto.randomUUID()];
    overlay.views.push({
      selectedItems: [],
      viewId: crypto.randomUUID(),
      viewport: { scale: 3, x: 10, y: 10 },
    });

    const saved = repository.saveUi(project.id, overlay);
    expect(saved.activeViewId).toBe(project.state.activeViewId);
    expect(saved.ui.selectedUnitId).toBeNull();
    expect(saved.ui.expandedUnitIds).toEqual([]);
    expect(saved.views).toHaveLength(project.state.views.length);
    expect(repository.openProject(project.id).stateRevision).toBe(1);
  });

  it("never replaces corrupt stored state with an empty workspace", () => {
    const repository = openRepository();
    const project = repository.ensureCurrentProject();
    repository
      .unsafeStatementForTests("UPDATE projects SET state_json = ? WHERE id = ?")
      .run("{broken", project.id);

    expect(() => repository.openProject(project.id)).toThrowError(
      expect.objectContaining({ code: "corrupt_stored_state" }),
    );
    expect(repository.listProjects().projects).toHaveLength(1);
  });
});
