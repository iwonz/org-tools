import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { DELETE as deleteProject, GET as getProject } from "@/app/api/projects/[id]/route";
import { PUT as saveState } from "@/app/api/projects/[id]/state/route";
import { PUT as saveUi } from "@/app/api/projects/[id]/ui/route";
import { POST as createProject, GET as listProjects } from "@/app/api/projects/route";
import type { ProjectDocument, ProjectListResponse } from "@/lib/project-workspace";
import { getProjectRepository, resetProjectRepositoryForTests } from "@/server/project-repository";

const ORIGIN = "http://127.0.0.1:3000";
let temporaryDirectory = "";

const request = (
  path: string,
  options?: { body?: unknown; method?: string; origin?: string; host?: string },
) =>
  new Request(`${ORIGIN}${path}`, {
    ...(options && "body" in options ? { body: JSON.stringify(options.body) } : {}),
    headers: {
      host: options?.host ?? "127.0.0.1:3000",
      ...(options?.method
        ? {
            "content-type": "application/json",
            origin: options.origin ?? ORIGIN,
          }
        : {}),
    },
    method: options?.method ?? "GET",
  });

const params = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  temporaryDirectory = mkdtempSync(join(tmpdir(), "org-tools-api-"));
  process.env.ORG_TOOLS_DB_PATH = join(temporaryDirectory, "workspace.sqlite3");
});

afterEach(() => {
  resetProjectRepositoryForTests();
  delete process.env.ORG_TOOLS_DB_PATH;
  rmSync(temporaryDirectory, { force: true, recursive: true });
});

describe("project API", () => {
  it("creates the first project, returns no-store responses, and supports CRUD", async () => {
    const firstResponse = await listProjects(request("/api/projects"));
    expect(firstResponse.status).toBe(200);
    expect(firstResponse.headers.get("cache-control")).toBe("no-store");
    expect(firstResponse.headers.get("access-control-allow-origin")).toBeNull();
    const firstList = (await firstResponse.json()) as ProjectListResponse;
    expect(firstList.projects).toHaveLength(1);

    const createdResponse = await createProject(
      request("/api/projects", { body: { name: "Roadmap" }, method: "POST" }),
    );
    expect(createdResponse.status).toBe(201);
    const created = (await createdResponse.json()) as ProjectDocument;

    const opened = await getProject(request(`/api/projects/${created.id}`), params(created.id));
    expect(await opened.json()).toMatchObject({ id: created.id, name: "Roadmap" });

    const deleted = await deleteProject(
      request(`/api/projects/${created.id}`, { body: {}, method: "DELETE" }),
      params(created.id),
    );
    expect(deleted.status).toBe(200);
    expect(await deleted.json()).toMatchObject({ nextProject: { id: firstList.projects[0]?.id } });
  });

  it("rejects duplicate names and invalid request shapes with stable codes", async () => {
    await createProject(request("/api/projects", { body: { name: "Alpha" }, method: "POST" }));
    const duplicate = await createProject(
      request("/api/projects", { body: { name: "ALPHA" }, method: "POST" }),
    );
    expect(duplicate.status).toBe(400);
    expect(await duplicate.json()).toMatchObject({ error: { code: "duplicate_name" } });

    const invalid = await createProject(
      request("/api/projects", {
        body: { extra: true, name: "Beta" },
        method: "POST",
      }),
    );
    expect(await invalid.json()).toMatchObject({ error: { code: "invalid_input" } });
  });

  it("validates state atomically and reports revision conflicts", async () => {
    const project = getProjectRepository().ensureCurrentProject();
    const invalid = await saveState(
      request(`/api/projects/${project.id}/state`, {
        body: { expectedRevision: 1, state: { kind: "invalid" } },
        method: "PUT",
      }),
      params(project.id),
    );
    expect(await invalid.json()).toMatchObject({ error: { code: "invalid_state" } });
    expect(getProjectRepository().openProject(project.id).stateRevision).toBe(1);

    const saved = await saveState(
      request(`/api/projects/${project.id}/state`, {
        body: { expectedRevision: 1, state: project.state },
        method: "PUT",
      }),
      params(project.id),
    );
    expect(saved.status).toBe(200);
    const conflict = await saveState(
      request(`/api/projects/${project.id}/state`, {
        body: { expectedRevision: 1, state: project.state },
        method: "PUT",
      }),
      params(project.id),
    );
    expect(conflict.status).toBe(409);
    expect(await conflict.json()).toEqual({
      error: {
        code: "revision_conflict",
        currentRevision: 2,
        message: "Project revision conflict.",
      },
    });
  });

  it("keeps UI writes revision-independent and rejects cross-origin mutations", async () => {
    const project = getProjectRepository().ensureCurrentProject();
    const accepted = await saveUi(
      request(`/api/projects/${project.id}/ui`, {
        body: { ui: project.ui },
        method: "PUT",
      }),
      params(project.id),
    );
    expect(accepted.status).toBe(200);
    expect(getProjectRepository().openProject(project.id).stateRevision).toBe(1);

    const rejected = await createProject(
      request("/api/projects", {
        body: { name: "Remote" },
        method: "POST",
        origin: "https://remote.example.test",
      }),
    );
    expect(rejected.status).toBe(403);
    expect(await rejected.json()).toMatchObject({ error: { code: "invalid_input" } });
    expect(getProjectRepository().listProjects().projects).toHaveLength(1);
  });

  it("returns not-found and corrupt-state responses without data leakage", async () => {
    const missingId = crypto.randomUUID();
    const missing = await getProject(request(`/api/projects/${missingId}`), params(missingId));
    expect(missing.status).toBe(404);
    expect(await missing.json()).toEqual({
      error: { code: "not_found", message: "Project not found." },
    });

    const repository = getProjectRepository();
    const project = repository.ensureCurrentProject();
    repository
      .unsafeStatementForTests("UPDATE projects SET state_json = ? WHERE id = ?")
      .run("{broken", project.id);
    const corrupt = await getProject(request(`/api/projects/${project.id}`), params(project.id));
    expect(corrupt.status).toBe(500);
    expect(await corrupt.json()).toEqual({
      error: {
        code: "corrupt_stored_state",
        message: "The stored project state is corrupt.",
      },
    });
    const list = await listProjects(request("/api/projects"));
    expect(list.status).toBe(200);
    expect(await list.json()).toMatchObject({ currentProjectId: project.id });
  });

  it("reports an unavailable configured database explicitly", async () => {
    resetProjectRepositoryForTests();
    process.env.ORG_TOOLS_DB_PATH = temporaryDirectory;

    const response = await listProjects(request("/api/projects"));

    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      error: {
        code: "database_unavailable",
        message: "The Org Tools database is unavailable.",
      },
    });
  });
});
