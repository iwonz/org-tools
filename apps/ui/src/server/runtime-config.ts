import { isAbsolute, relative, resolve } from "node:path";

const PLACEHOLDER_PATTERN = /(?:change|replace|example|placeholder|your[-_])/iu;
const SECRET_MIN_LENGTH = 32;

export type DatabaseSslMode = "disable" | "require" | "verify-ca" | "verify-full";

export type RuntimeConfig = {
  backupPath: string;
  database: {
    database: string;
    host: string;
    password: string;
    port: number;
    sslMode: DatabaseSslMode;
    user: string;
  };
  port: number;
  publicOrigin: string;
  setupToken: string;
};

export type MigrationConfig = RuntimeConfig & {
  databaseOwner: {
    password: string;
    user: string;
  };
};

export type DeploymentStorageConfig = {
  backupPath: string;
  postgresDataPath: string;
};

export class RuntimeConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RuntimeConfigurationError";
  }
}

const required = (environment: NodeJS.ProcessEnv, name: string): string => {
  const value = environment[name]?.trim();
  if (!value) throw new RuntimeConfigurationError(`${name} is required.`);
  return value;
};

const secret = (environment: NodeJS.ProcessEnv, name: string): string => {
  const value = required(environment, name);
  if (value.length < SECRET_MIN_LENGTH || PLACEHOLDER_PATTERN.test(value)) {
    throw new RuntimeConfigurationError(`${name} must contain a generated secret.`);
  }
  if (/\p{Cc}/u.test(value)) {
    throw new RuntimeConfigurationError(`${name} contains a control character.`);
  }
  return value;
};

const boundedPort = (environment: NodeJS.ProcessEnv, name: string): number => {
  const raw = required(environment, name);
  if (!/^\d{1,5}$/u.test(raw)) throw new RuntimeConfigurationError(`${name} is invalid.`);
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > 65_535) {
    throw new RuntimeConfigurationError(`${name} is invalid.`);
  }
  return value;
};

const databaseName = (environment: NodeJS.ProcessEnv, name: string): string => {
  const value = required(environment, name);
  if (!/^[a-z_][a-z0-9_]{0,62}$/u.test(value)) {
    throw new RuntimeConfigurationError(`${name} is invalid.`);
  }
  return value;
};

const publicOrigin = (environment: NodeJS.ProcessEnv): string => {
  const raw = required(environment, "ORG_TOOLS_PUBLIC_ORIGIN");
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new RuntimeConfigurationError("ORG_TOOLS_PUBLIC_ORIGIN is invalid.");
  }
  if (
    parsed.origin !== raw ||
    parsed.username !== "" ||
    parsed.password !== "" ||
    (parsed.protocol !== "https:" &&
      !(
        parsed.protocol === "http:" &&
        (parsed.hostname === "localhost" ||
          parsed.hostname === "127.0.0.1" ||
          parsed.hostname === "[::1]")
      ))
  ) {
    throw new RuntimeConfigurationError(
      "ORG_TOOLS_PUBLIC_ORIGIN must be an exact HTTPS origin or localhost HTTP origin.",
    );
  }
  return parsed.origin;
};

const externalPath = (raw: string, name: string, repositoryRoot: string): string => {
  if (!isAbsolute(raw)) throw new RuntimeConfigurationError(`${name} must be absolute.`);
  const path = resolve(raw);
  const fromRepository = relative(resolve(repositoryRoot), path);
  if (fromRepository === "" || (!fromRepository.startsWith("..") && !isAbsolute(fromRepository))) {
    throw new RuntimeConfigurationError(`${name} must be outside the repository.`);
  }
  return path;
};

const sslMode = (environment: NodeJS.ProcessEnv): DatabaseSslMode => {
  const value = required(environment, "ORG_TOOLS_DB_SSLMODE");
  if (
    value === "disable" ||
    value === "require" ||
    value === "verify-ca" ||
    value === "verify-full"
  ) {
    return value;
  }
  throw new RuntimeConfigurationError("ORG_TOOLS_DB_SSLMODE is invalid.");
};

export const loadDeploymentStorageConfig = (
  environment: NodeJS.ProcessEnv = process.env,
  repositoryRoot = process.cwd(),
): DeploymentStorageConfig => ({
  backupPath: externalPath(
    required(environment, "ORG_TOOLS_BACKUP_PATH"),
    "ORG_TOOLS_BACKUP_PATH",
    repositoryRoot,
  ),
  postgresDataPath: externalPath(
    required(environment, "ORG_TOOLS_POSTGRES_DATA_PATH"),
    "ORG_TOOLS_POSTGRES_DATA_PATH",
    repositoryRoot,
  ),
});

export const loadRuntimeConfig = (
  environment: NodeJS.ProcessEnv = process.env,
  repositoryRoot = process.cwd(),
): RuntimeConfig => {
  // The web container does not receive the host PostgreSQL path, but when the value is
  // present (CLI, migration, Compose validation) it must pass the same external-path guard.
  if (environment.ORG_TOOLS_POSTGRES_DATA_PATH !== undefined) {
    externalPath(
      required(environment, "ORG_TOOLS_POSTGRES_DATA_PATH"),
      "ORG_TOOLS_POSTGRES_DATA_PATH",
      repositoryRoot,
    );
  }
  return {
    backupPath: externalPath(
      required(environment, "ORG_TOOLS_BACKUP_PATH"),
      "ORG_TOOLS_BACKUP_PATH",
      repositoryRoot,
    ),
    database: {
      database: databaseName(environment, "POSTGRES_DB"),
      host: required(environment, "ORG_TOOLS_DB_HOST"),
      password: secret(environment, "ORG_TOOLS_DB_PASSWORD"),
      port: boundedPort(environment, "ORG_TOOLS_DB_PORT"),
      sslMode: sslMode(environment),
      user: databaseName(environment, "ORG_TOOLS_DB_USER"),
    },
    port: boundedPort(environment, "ORG_TOOLS_PORT"),
    publicOrigin: publicOrigin(environment),
    setupToken: secret(environment, "ORG_TOOLS_SETUP_TOKEN"),
  };
};

export const loadMigrationConfig = (
  environment: NodeJS.ProcessEnv = process.env,
  repositoryRoot = process.cwd(),
): MigrationConfig => ({
  ...loadRuntimeConfig(environment, repositoryRoot),
  databaseOwner: {
    password: secret(environment, "POSTGRES_PASSWORD"),
    user: databaseName(environment, "POSTGRES_USER"),
  },
});
