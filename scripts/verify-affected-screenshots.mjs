#!/usr/bin/env node

import { spawn } from "node:child_process";
import { performance } from "node:perf_hooks";

const modules = (process.env.ORG_TOOLS_SCREENSHOT_MODULES ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const ids = (process.env.ORG_TOOLS_SCREENSHOT_IDS ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
if (modules.length === 0 && ids.length === 0) {
  throw new Error("ORG_TOOLS_SCREENSHOT_MODULES or ORG_TOOLS_SCREENSHOT_IDS must select evidence.");
}

const startedAt = performance.now();
const run = (command, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { env: process.env, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code, signal) => resolve(signal ? 1 : (code ?? 1)));
  });

const generationExitCode = await run("pnpm", ["screenshots:generate"]);
if (generationExitCode !== 0) process.exit(generationExitCode);
const diffExitCode = await run("git", ["diff", "--exit-code", "--", "docs/screenshots"]);
console.log(
  `Affected screenshots (modules=${modules.join(",") || "none"}; ids=${ids.join(",") || "none"}): ${((performance.now() - startedAt) / 1000).toFixed(2)}s`,
);
if (diffExitCode !== 0) {
  console.error(
    "Affected screenshots differ from their committed references. Review and commit intended changes.",
  );
  process.exitCode = 1;
}
