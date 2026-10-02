import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = new URL("..", import.meta.url).pathname;

const filesUnder = async (directory) => {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await filesUnder(path)));
    else if (entry.isFile()) files.push(path);
  }
  return files;
};

const readTextFiles = async (paths) =>
  (
    await Promise.all(paths.map(async (path) => ({ content: await readFile(path, "utf8"), path })))
  ).sort((left, right) => left.path.localeCompare(right.path));

describe("current repository contracts", () => {
  it("keeps current documentation free of removed runtime wording", async () => {
    const documentation = [
      join(root, "AGENTS.md"),
      join(root, "CONTRIBUTING.md"),
      join(root, "README.md"),
      join(root, "SECURITY.md"),
      ...(await filesUnder(join(root, "docs"))).filter((path) => path.endsWith(".md")),
      ...(await filesUnder(join(root, "openspec", "specs"))).filter((path) => path.endsWith(".md")),
      ...(await filesUnder(join(root, ".github", "ISSUE_TEMPLATE"))).filter((path) =>
        path.endsWith(".yml"),
      ),
    ];
    const forbidden = [
      "TBD - created by archiving change",
      "browser and loopback same-origin runtime",
      "explicit State import",
      "received from a live peer",
      "representative Employee Import",
      "source-to-target mapping",
      "state is restored from SQLite",
      "### Requirement: SQLite conversion is external and exact",
      "live tabs immediately",
      "synchronized live tab receive",
      "ten featured frames",
      "production applications",
    ];
    const violations = [];
    for (const { content, path } of await readTextFiles(documentation)) {
      for (const phrase of forbidden) {
        if (content.includes(phrase)) violations.push(`${path}: ${phrase}`);
      }
    }
    expect(violations).toEqual([]);
  });

  it("does not generate runtime identifiers with Math.random", async () => {
    const source = (await filesUnder(join(root, "apps", "ui", "src"))).filter((path) =>
      /\.[cm]?[jt]sx?$/u.test(path),
    );
    const violations = (await readTextFiles(source))
      .filter(({ content }) => /\bMath\.random\s*\(/u.test(content))
      .map(({ path }) => path);
    expect(violations).toEqual([]);
  });
});
