#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));

function run(command, arguments_, options = {}) {
  const result = spawnSync(command, arguments_, {
    cwd: repositoryRoot,
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0 && !options.allowFailure) {
    const detail = options.capture ? result.stderr.trim() : "";
    throw new Error(detail || `${command} ${arguments_.join(" ")} failed.`);
  }
  return result;
}

function output(command, arguments_) {
  return run(command, arguments_, { capture: true }).stdout.trim();
}

try {
  const branch = output("git", ["branch", "--show-current"]);
  if (branch !== "main") throw new Error("Pages publication must run from main.");
  if (output("git", ["status", "--porcelain"]) !== "") {
    throw new Error("Pages publication requires a clean worktree.");
  }

  run("git", ["fetch", "origin", "main"]);
  const head = output("git", ["rev-parse", "HEAD"]);
  const main = output("git", ["rev-parse", "main"]);
  const remoteMain = output("git", ["rev-parse", "origin/main"]);
  if (head !== main || main !== remoteMain) {
    throw new Error("HEAD, main, and origin/main must match before Pages publication.");
  }

  run("gh", ["auth", "status"]);
  const pagesState = run("gh", ["api", "repos/{owner}/{repo}/pages", "--silent"], {
    allowFailure: true,
    capture: true,
  });
  if (pagesState.status === 0) {
    run("gh", [
      "api",
      "--method",
      "PUT",
      "repos/{owner}/{repo}/pages",
      "-f",
      "build_type=workflow",
      "--silent",
    ]);
  } else {
    run("gh", [
      "api",
      "--method",
      "POST",
      "repos/{owner}/{repo}/pages",
      "-f",
      "build_type=workflow",
      "--silent",
    ]);
  }

  run("gh", ["workflow", "run", "pages.yml", "--ref", "main"]);
  console.log("GitHub Pages deployment dispatched. Monitor it with:");
  console.log("  gh run list --workflow pages.yml --limit 1");
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
