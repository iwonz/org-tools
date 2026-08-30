import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import {
  findRepositoryRoot,
  ProjectConfigurationError,
  resolveProjectRuntimeConfig,
} from "@/server/project-config";

const temporaryDirectories: string[] = [];

const createRepository = () => {
  const directory = mkdtempSync(join(tmpdir(), "org-tools-config-"));
  temporaryDirectories.push(directory);
  writeFileSync(join(directory, "pnpm-workspace.yaml"), "packages: []\n");
  return directory;
};

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

describe("project runtime configuration", () => {
  it("uses the ignored repository-local default", () => {
    const repositoryRoot = createRepository();
    expect(resolveProjectRuntimeConfig({ environment: {}, repositoryRoot })).toEqual({
      databasePath: join(repositoryRoot, ".org-tools/org-tools.sqlite3"),
      repositoryRoot,
      source: "default",
    });
  });

  it("resolves file configuration relative to the repository root", () => {
    const repositoryRoot = createRepository();
    mkdirSync(join(repositoryRoot, ".org-tools"));
    writeFileSync(
      join(repositoryRoot, ".org-tools/config.json"),
      JSON.stringify({ databasePath: "runtime/project.sqlite3" }),
    );

    expect(resolveProjectRuntimeConfig({ environment: {}, repositoryRoot })).toMatchObject({
      databasePath: join(repositoryRoot, "runtime/project.sqlite3"),
      source: "file",
    });
  });

  it("gives the environment absolute precedence", () => {
    const repositoryRoot = createRepository();
    mkdirSync(join(repositoryRoot, ".org-tools"));
    writeFileSync(
      join(repositoryRoot, ".org-tools/config.json"),
      JSON.stringify({ databasePath: "ignored.sqlite3" }),
    );

    expect(
      resolveProjectRuntimeConfig({
        environment: { ORG_TOOLS_DB_PATH: "selected.sqlite3" },
        repositoryRoot,
      }),
    ).toMatchObject({
      databasePath: join(repositoryRoot, "selected.sqlite3"),
      source: "environment",
    });
  });

  it("rejects invalid config instead of falling back silently", () => {
    const repositoryRoot = createRepository();
    mkdirSync(join(repositoryRoot, ".org-tools"));
    writeFileSync(join(repositoryRoot, ".org-tools/config.json"), "{broken");

    expect(() => resolveProjectRuntimeConfig({ environment: {}, repositoryRoot })).toThrow(
      ProjectConfigurationError,
    );
  });

  it("locates the repository root from a nested runtime directory", () => {
    const repositoryRoot = createRepository();
    const nested = join(repositoryRoot, "apps/ui");
    mkdirSync(nested, { recursive: true });
    expect(findRepositoryRoot(nested)).toBe(repositoryRoot);
  });
});
