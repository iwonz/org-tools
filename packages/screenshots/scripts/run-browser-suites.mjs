#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const suites = [
  "tests/auth-access.spec.ts",
  "tests/localization.spec.ts",
  "tests/smoke.spec.ts",
  "tests/state.spec.ts",
];
const forwarded = process.argv.slice(2);
const shardRequested = forwarded.some((argument) => argument.startsWith("--shard"));
const batches = shardRequested ? [suites] : suites.map((suite) => [suite]);

for (const batch of batches) {
  const result = spawnSync(
    process.execPath,
    ["scripts/run-playwright.mjs", "test", ...batch, "--project=chromium", ...forwarded],
    { env: process.env, stdio: "inherit" },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
