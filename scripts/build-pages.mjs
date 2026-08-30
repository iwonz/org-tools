#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { cp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { pagesOutput, repositoryRoot, validatePagesOutput } from "./pages.mjs";

const result = spawnSync("pnpm", ["--filter", "@org-tools/pages", "build"], {
  cwd: repositoryRoot,
  encoding: "utf8",
  stdio: "inherit",
});
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

await rm(pagesOutput, { force: true, recursive: true });
await cp(join(repositoryRoot, "apps", "pages", "out"), pagesOutput, { recursive: true });
await writeFile(join(pagesOutput, ".nojekyll"), "", "utf8");

const violations = await validatePagesOutput();
if (violations.length > 0) {
  for (const violation of violations) console.error(`- ${violation}`);
  process.exitCode = 1;
} else {
  console.log("Working browser-only Org Tools built for GitHub Pages.");
}
