#!/usr/bin/env node

import { spawnSync } from "node:child_process";

import { createBrowserSuiteBatches } from "./browser-suite-plan.mjs";

const suites = [
  "tests/auth-access.spec.ts",
  "tests/localization.spec.ts",
  "tests/smoke.spec.ts",
  "tests/state.spec.ts",
];
const forwarded = process.argv.slice(2);
const batches = createBrowserSuiteBatches(suites, forwarded);

for (const batch of batches) {
  const result = spawnSync(
    process.execPath,
    ["scripts/run-playwright.mjs", "test", ...batch, "--project=chromium", ...forwarded],
    { env: process.env, stdio: "inherit" },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
