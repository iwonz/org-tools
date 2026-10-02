import { access, readdir, readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

const obsoletePathPattern =
  /apps\/pages|apps\/ui\/out|pages-out|playwright\.pages|next\s+export|output\s*:\s*["']export["']/u;
const pagesWorkflowPattern =
  /actions\/(?:configure|deploy|upload)-pages|pages:\s*write|environment:\s*github-pages/iu;

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

describe("server-only delivery", () => {
  it("contains no GitHub Pages application or static-export configuration", async () => {
    expect(await exists("apps/pages")).toBe(false);
    expect(await exists("apps/ui/out")).toBe(false);
    expect(await exists("pages-out")).toBe(false);
    expect(await exists("packages/screenshots/playwright.pages.config.ts")).toBe(false);

    const configuration = (
      await Promise.all(
        [
          ".dockerignore",
          ".gitignore",
          "Dockerfile",
          "apps/ui/next.config.ts",
          "apps/ui/package.json",
          "biome.json",
          "compose.dev.yaml",
          "compose.yaml",
          "package.json",
          "packages/screenshots/tsconfig.json",
          "pnpm-workspace.yaml",
        ].map((path) => readFile(path, "utf8")),
      )
    ).join("\n");

    expect(configuration).not.toMatch(obsoletePathPattern);
  });

  it("contains no GitHub Pages workflow or deployment permission", async () => {
    const workflowDirectory = ".github/workflows";
    const workflowFiles = (await readdir(workflowDirectory)).filter((name) =>
      /\.ya?ml$/u.test(name),
    );
    const workflowSource = (
      await Promise.all(
        workflowFiles.map((name) => readFile(`${workflowDirectory}/${name}`, "utf8")),
      )
    ).join("\n");

    expect(workflowSource).not.toMatch(pagesWorkflowPattern);
  });
});
