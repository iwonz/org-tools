#!/usr/bin/env node

import { spawn } from "node:child_process";
import { performance } from "node:perf_hooks";

import {
  ALL_SCREENSHOT_MODULES,
  createFullValidationPlan,
  createValidationPlan,
  discoverChangedPaths,
  formatValidationPlan,
} from "./validation-plan.mjs";

const mode = process.argv[2];
if (!new Set(["fast", "changed", "full"]).has(mode)) {
  console.error(
    "Usage: node scripts/run-validation.mjs {fast|changed|full} [--base <ref>] [--path <path>]",
  );
  process.exit(2);
}

let base = "origin/main";
const explicitPaths = [];
for (let index = 3; index < process.argv.length; index += 1) {
  if (process.argv[index] === "--base") base = process.argv[++index] ?? base;
  else if (process.argv[index] === "--path") explicitPaths.push(process.argv[++index] ?? "");
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
  if (commands.length === 0) return true;
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
  { args: ["architecture:check"], command: "pnpm", name: "architecture boundaries" },
  { args: ["hygiene:dead-code"], command: "pnpm", name: "dead source and dependencies" },
  { args: ["spec:validate"], command: "pnpm", name: "OpenSpec" },
  { args: ["diff", "--check"], command: "git", name: "diff check" },
  { args: ["public:check:source"], command: "pnpm", name: "source publication safety" },
];

const runBrowserTags = async (tags, performanceMode) => {
  if (tags.length === 0) return true;
  const grep = tags.join("|");
  return (
    (await runCommand(`browser: ${grep}`, "pnpm", ["test:browser", "--grep", grep], {
      ORG_TOOLS_PERFORMANCE_MODE: performanceMode,
    })) === 0
  );
};

const totalStartedAt = performance.now();
let succeeded = await runParallel(fastCommands);

let plan;
if (mode === "changed") {
  const discovery = explicitPaths.length
    ? { baseAvailable: true, paths: explicitPaths }
    : discoverChangedPaths(base);
  plan = createValidationPlan(discovery.paths, discovery);
  console.log(`\n${formatValidationPlan(plan)}`);
} else if (mode === "full") {
  plan = createFullValidationPlan();
  console.log("\nValidation plan (Full Regression): every maintained evidence surface.");
}

if (succeeded && plan?.audit) {
  succeeded = (await runCommand("dependency security audit", "pnpm", ["security:audit"])) === 0;
}

if (succeeded && plan?.full) {
  succeeded = (await runCommand("browser shard partition", "pnpm", ["test:browser:shards"])) === 0;
}

if (succeeded && (plan?.runtime || plan?.build)) {
  const runtimeCommands = [];
  if (plan.runtime && process.env.ORG_TOOLS_SKIP_DEV_PROBE !== "1") {
    runtimeCommands.push({ args: ["dev:check"], command: "pnpm", name: "development probe" });
  }
  if (plan.build) {
    runtimeCommands.push({ args: ["build"], command: "pnpm", name: "production build" });
  }
  succeeded = await runParallel(runtimeCommands);
}

if (succeeded && plan?.build) {
  succeeded = (await runCommand("full publication safety", "pnpm", ["public:check"])) === 0;
}

if (succeeded && plan) {
  succeeded = await runBrowserTags(
    plan.full ? ["@regression"] : plan.browserTags,
    plan.full ? "full" : "structural",
  );
}

if (succeeded && plan?.screenshots) {
  if (plan.full) {
    succeeded =
      (await runCommand("deterministic full gallery", "pnpm", ["screenshots:verify"])) === 0;
  } else {
    const environment = plan.screenshotAll
      ? { ORG_TOOLS_SCREENSHOT_MODULES: ALL_SCREENSHOT_MODULES.join(",") }
      : { ORG_TOOLS_SCREENSHOT_MODULES: plan.screenshotModules.join(",") };
    succeeded =
      (await runCommand(
        "affected screenshot feedback",
        "pnpm",
        ["screenshots:verify:affected"],
        environment,
      )) === 0;
  }
}

if (plan?.image) {
  console.log(
    "\nProduction image inspection is selected and is executed by the host validation wrapper.",
  );
}

printSummary(performance.now() - totalStartedAt);
if (!succeeded || results.some((result) => result.exitCode !== 0)) process.exitCode = 1;
