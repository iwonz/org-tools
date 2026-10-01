import { describe, expect, it } from "vitest";

import {
  loadDeploymentStorageConfig,
  loadMigrationConfig,
  loadRuntimeConfig,
  RuntimeConfigurationError,
} from "@/server/runtime-config";

const repositoryRoot = "/workspace/org-tools";
const validEnvironment = (): NodeJS.ProcessEnv => ({
  NODE_ENV: "test",
  ORG_TOOLS_BACKUP_PATH: "/srv/org-tools/backups",
  ORG_TOOLS_DB_HOST: "postgres",
  ORG_TOOLS_DB_PASSWORD: "database-app-password-with-32-chars",
  ORG_TOOLS_DB_PORT: "5432",
  ORG_TOOLS_DB_SSLMODE: "disable",
  ORG_TOOLS_DB_USER: "org_tools_app",
  ORG_TOOLS_PORT: "3000",
  ORG_TOOLS_POSTGRES_DATA_PATH: "/srv/org-tools/postgres",
  ORG_TOOLS_PUBLIC_ORIGIN: "http://localhost:3000",
  ORG_TOOLS_SETUP_TOKEN: "setup-token-with-at-least-thirty-two-characters",
  POSTGRES_DB: "org_tools",
  POSTGRES_PASSWORD: "database-owner-password-with-32-chars",
  POSTGRES_USER: "org_tools_owner",
});

describe("runtime configuration", () => {
  it("parses the exact application and migration contract", () => {
    const runtime = loadRuntimeConfig(validEnvironment(), repositoryRoot);
    expect(runtime.database).toEqual({
      database: "org_tools",
      host: "postgres",
      password: "database-app-password-with-32-chars",
      port: 5432,
      sslMode: "disable",
      user: "org_tools_app",
    });
    expect(loadMigrationConfig(validEnvironment(), repositoryRoot).databaseOwner.user).toBe(
      "org_tools_owner",
    );
    expect(loadDeploymentStorageConfig(validEnvironment(), repositoryRoot)).toEqual({
      backupPath: "/srv/org-tools/backups",
      postgresDataPath: "/srv/org-tools/postgres",
    });
  });

  it("requires HTTPS away from localhost", () => {
    const environment = validEnvironment();
    environment.ORG_TOOLS_PUBLIC_ORIGIN = "http://org-tools.example.test";
    expect(() => loadRuntimeConfig(environment, repositoryRoot)).toThrow(RuntimeConfigurationError);
  });

  it("rejects placeholders, invalid ports, and unsafe paths", () => {
    for (const mutate of [
      (environment: NodeJS.ProcessEnv) => {
        environment.ORG_TOOLS_SETUP_TOKEN = "replace-with-a-generated-setup-token-value";
      },
      (environment: NodeJS.ProcessEnv) => {
        environment.ORG_TOOLS_DB_PORT = "70000";
      },
      (environment: NodeJS.ProcessEnv) => {
        environment.ORG_TOOLS_BACKUP_PATH = "/workspace/org-tools/backups";
      },
      (environment: NodeJS.ProcessEnv) => {
        environment.ORG_TOOLS_POSTGRES_DATA_PATH = "./postgres";
      },
    ]) {
      const environment = validEnvironment();
      mutate(environment);
      expect(() => loadRuntimeConfig(environment, repositoryRoot)).toThrow(
        RuntimeConfigurationError,
      );
    }
  });
});
