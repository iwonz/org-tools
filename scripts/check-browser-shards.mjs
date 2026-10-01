#!/usr/bin/env node

import { execFileSync } from "node:child_process";

const shardCount = 4;
const baseArguments = ["--filter", "@org-tools/screenshots", "smoke", "--list"];
const environment = {
  ...process.env,
  FORCE_COLOR: "0",
  NO_COLOR: "1",
  ORG_TOOLS_E2E_ISOLATED_SHARD: "1",
};

function listedTests(extraArguments = []) {
  const output = execFileSync("pnpm", [...baseArguments, ...extraArguments], {
    encoding: "utf8",
    env: environment,
    maxBuffer: 8 * 1024 * 1024,
  });
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("[chromium] › "));
}

const complete = listedTests();
const observed = new Map();
for (let shard = 1; shard <= shardCount; shard += 1) {
  const tests = listedTests([`--shard=${shard}/${shardCount}`]);
  console.log(`Browser shard ${shard}/${shardCount}: ${tests.length} tests`);
  for (const test of tests) observed.set(test, (observed.get(test) ?? 0) + 1);
}

const missing = complete.filter((test) => !observed.has(test));
const duplicates = [...observed].filter(([, count]) => count !== 1);
const unexpected = [...observed].filter(([test]) => !complete.includes(test));
if (missing.length || duplicates.length || unexpected.length || observed.size !== complete.length) {
  console.error(
    `Invalid browser shard partition: ${missing.length} missing, ${duplicates.length} duplicate, ${unexpected.length} unexpected.`,
  );
  process.exitCode = 1;
} else {
  console.log(`Browser shard partition passed: ${complete.length} tests appear exactly once.`);
}
