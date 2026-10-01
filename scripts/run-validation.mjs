#!/usr/bin/env node

import { spawn } from "node:child_process";
import { performance } from "node:perf_hooks";

import {
  createValidationPlan,
  discoverChangedPaths,
  formatValidationPlan,
} from "./validation-plan.mjs";

const mode = process.argv[2];
if (mode !== "fast" && mode !== "changed") {
  console.error("Usage: node scripts/run-validation.mjs {fast|changed} [--base <ref>]");
  process.exit(2);
}

let base = "origin/main";
for (let index = 3; index < process.argv.length; index += 1) {
  if (process.argv[index] === "--base") base = process.argv[++index] ?? base;
  else throw new Error(`Unknown argument: ${process.argv[index]}`);
}

const results = [];
const formatDuration = (milliseconds) => `${(milliseconds / 1000).toFixed(2)}s`;

async function runCommand(name, command, args, extraEnv = {}) {
  const startedAt = performance.now();
  console.log(`\n▶ ${name}`);
  const exitCode = await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: { ...process.env, ...extraEnv },
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => resolve(signal ? 1 : (code ?? 1)));
  });
  const durationMs = performance.now() - startedAt;
  results.push({ durationMs, exitCode, name });
  console.log(`${exitCode === 0 ? "✓" : "✗"} ${name} (${formatDuration(durationMs)})`);
  return exitCode;
}

async function runParallel(commands) {
  const codes = await Promise.all(
    commands.map(({ args, command, env, name }) => runCommand(name, command, args, env)),
  );
  return codes.every((code) => code === 0);
}

function printSummary(totalMs) {
  console.log("\nValidation timing");
  for (const result of results) {
    console.log(
      `  ${result.exitCode === 0 ? "PASS" : "FAIL"} ${result.name.padEnd(30)} ${formatDuration(result.durationMs)}`,
    );
  }
  console.log(`  TOTAL ${formatDuration(totalMs)}`);
}

const fastCommands = [
  { args: ["lint"], command: "pnpm", name: "lint" },
  { args: ["typecheck"], command: "pnpm", name: "typecheck" },
  { args: ["test:unit"], command: "pnpm", name: "unit tests" },
  { args: ["test:browser:shards"], command: "pnpm", name: "browser shard partition" },
  { args: ["spec:validate"], command: "pnpm", name: "OpenSpec" },
  { args: ["diff", "--check"], command: "git", name: "diff check" },
  {
    args: ["public:check:source"],
    command: "pnpm",
    name: "source publication safety",
  },
];

const totalStartedAt = performance.now();
let succeeded = await runParallel(fastCommands);

if (succeeded && mode === "changed") {
  const discovery = discoverChangedPaths(base);
  const plan = createValidationPlan(discovery.paths, discovery);
  console.log(`\n${formatValidationPlan(plan)}`);

  if (plan.runtime || plan.build) {
    const runtimeCommands = [];
    if (plan.runtime) {
      runtimeCommands.push({ args: ["dev:check"], command: "pnpm", name: "development probe" });
    }
    if (plan.build) {
      runtimeCommands.push({ args: ["build"], command: "pnpm", name: "production build" });
    }
    succeeded = await runParallel(runtimeCommands);
  }

  if (succeeded && plan.build) {
    succeeded = (await runCommand("full publication safety", "pnpm", ["public:check"])) === 0;
  }

  if (succeeded && plan.browserSuites.length > 0) {
    succeeded =
      (await runCommand("affected browser suites", "pnpm", [
        "--filter",
        "@org-tools/screenshots",
        "exec",
        "node",
        "--env-file-if-exists=../../.env",
        "scripts/run-playwright.mjs",
        "test",
        ...plan.browserSuites,
        "--project=chromium",
      ])) === 0;
  }

  if (succeeded && plan.screenshots) {
    succeeded = (await runCommand("gallery feedback pass", "pnpm", ["screenshots:generate"])) === 0;
  }

  if (plan.image) {
    console.log(
      "\nProduction image inspection remains in the authoritative complete CI matrix; changed validation does not certify delivery.",
    );
  }
}

printSummary(performance.now() - totalStartedAt);
if (!succeeded || results.some((result) => result.exitCode !== 0)) process.exitCode = 1;
