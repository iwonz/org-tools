import { spawnSync } from "node:child_process";
import { chmod, cp, mkdir, mkdtemp, readFile, rename, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = new URL("../bin/org-tools", import.meta.url);

const createCheckout = async () => {
  const root = await mkdtemp(join(tmpdir(), "org-tools-env-test-"));
  const storageRoot = await mkdtemp(join(tmpdir(), "org-tools-env-storage-"));
  await mkdir(join(root, "bin"));
  await mkdir(join(storageRoot, "postgres"));
  await mkdir(join(storageRoot, "backups"));
  await cp(source, join(root, "bin", "org-tools"));
  const example = await readFile(new URL("../.env.example", import.meta.url), "utf8");
  const environment = example
    .replace(
      "ORG_TOOLS_SETUP_TOKEN=GENERATE_WITH_BIN_ORG_TOOLS_ENV_INIT",
      `ORG_TOOLS_SETUP_TOKEN=${"a".repeat(64)}`,
    )
    .replace(
      "POSTGRES_PASSWORD=GENERATE_WITH_BIN_ORG_TOOLS_ENV_INIT",
      `POSTGRES_PASSWORD=${"b".repeat(64)}`,
    )
    .replace(
      "ORG_TOOLS_DB_PASSWORD=GENERATE_WITH_BIN_ORG_TOOLS_ENV_INIT",
      `ORG_TOOLS_DB_PASSWORD=${"c".repeat(64)}`,
    )
    .replace("/absolute/path/outside/repository/postgres", join(storageRoot, "postgres"))
    .replace("/absolute/path/outside/repository/backups", join(storageRoot, "backups"));
  await writeFile(join(root, ".env"), environment, { mode: 0o600 });
  await chmod(join(root, ".env"), 0o600);
  return root;
};

const validate = (root, environmentFile) =>
  spawnSync("sh", [join(root, "bin", "org-tools"), "env", "validate"], {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      ...(environmentFile ? { ORG_TOOLS_ENV_FILE: environmentFile } : {}),
    },
  });

describe("environment validation", () => {
  it("accepts the exact generated environment contract", async () => {
    const root = await createCheckout();
    const result = validate(root);
    expect(result, result.stderr).toMatchObject({ status: 0, stdout: ".env is valid.\n" });
  });

  it.each([
    ["ORG_TOOLS_PORT=3000", "ORG_TOOLS_PORT=70000"],
    [
      "ORG_TOOLS_PUBLIC_ORIGIN=http://localhost:3000",
      "ORG_TOOLS_PUBLIC_ORIGIN=https://example.test/path",
    ],
    ["POSTGRES_DB=org_tools", "POSTGRES_DB=Org-Tools"],
    [
      `ORG_TOOLS_SETUP_TOKEN=${"a".repeat(64)}`,
      "ORG_TOOLS_SETUP_TOKEN=Replace_with_a_generated_setup_token_value",
    ],
  ])("rejects inconsistent deployment input", async (from, to) => {
    const root = await createCheckout();
    const path = join(root, ".env");
    await writeFile(path, (await readFile(path, "utf8")).replace(from, to), { mode: 0o600 });
    expect(validate(root).status).not.toBe(0);
  });

  it("rejects an environment file readable by other users", async () => {
    const root = await createCheckout();
    await chmod(join(root, ".env"), 0o644);
    expect(validate(root).status).not.toBe(0);
  });

  it("supports an explicit environment file for isolated tooling", async () => {
    const root = await createCheckout();
    const environmentFile = join(root, "validation.env");
    await rename(join(root, ".env"), environmentFile);
    expect(
      validate(root, environmentFile),
      "the explicit environment file must be authoritative",
    ).toMatchObject({
      status: 0,
      stdout: ".env is valid.\n",
    });
  });
});
