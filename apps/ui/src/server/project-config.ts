import { existsSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";

const DEFAULT_DATABASE_PATH = ".org-tools/org-tools.sqlite3";
const CONFIG_RELATIVE_PATH = ".org-tools/config.json";

export class ProjectConfigurationError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ProjectConfigurationError";
  }
}

export type ProjectRuntimeConfig = {
  databasePath: string;
  repositoryRoot: string;
  source: "default" | "environment" | "file";
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const findRepositoryRoot = (startDirectory = process.cwd()): string => {
  let directory = resolve(startDirectory);
  while (true) {
    if (existsSync(join(directory, "pnpm-workspace.yaml"))) return directory;
    const parent = dirname(directory);
    if (parent === directory) {
      throw new ProjectConfigurationError("Could not locate the Org Tools repository root.");
    }
    directory = parent;
  }
};

const parseConfigFile = (configPath: string): string | null => {
  if (!existsSync(configPath)) return null;

  let value: unknown;
  try {
    value = JSON.parse(readFileSync(configPath, "utf8"));
  } catch (error) {
    throw new ProjectConfigurationError("The Org Tools database config is not valid JSON.", {
      cause: error,
    });
  }

  if (
    !isRecord(value) ||
    Object.keys(value).length !== 1 ||
    typeof value.databasePath !== "string" ||
    !value.databasePath.trim()
  ) {
    throw new ProjectConfigurationError(
      'The Org Tools database config must contain only a non-empty "databasePath" string.',
    );
  }
  return value.databasePath.trim();
};

export const resolveProjectRuntimeConfig = (options?: {
  environment?: Readonly<Record<string, string | undefined>>;
  repositoryRoot?: string;
}): ProjectRuntimeConfig => {
  const repositoryRoot = resolve(options?.repositoryRoot ?? findRepositoryRoot());
  const environment = options?.environment ?? process.env;
  const environmentPath = environment.ORG_TOOLS_DB_PATH;
  if (environmentPath !== undefined && !environmentPath.trim()) {
    throw new ProjectConfigurationError("ORG_TOOLS_DB_PATH must not be empty.");
  }

  const filePath = environmentPath
    ? null
    : parseConfigFile(join(repositoryRoot, CONFIG_RELATIVE_PATH));
  const configuredPath = environmentPath?.trim() || filePath || DEFAULT_DATABASE_PATH;
  const databasePath = isAbsolute(configuredPath)
    ? resolve(configuredPath)
    : resolve(repositoryRoot, configuredPath);

  return {
    databasePath,
    repositoryRoot,
    source: environmentPath ? "environment" : filePath ? "file" : "default",
  };
};
