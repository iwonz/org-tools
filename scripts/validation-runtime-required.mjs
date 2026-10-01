#!/usr/bin/env node

import { createValidationPlan, discoverChangedPaths } from "./validation-plan.mjs";

let base = "origin/main";
for (let index = 2; index < process.argv.length; index += 1) {
  if (process.argv[index] === "--base") base = process.argv[++index] ?? base;
  else throw new Error(`Unknown argument: ${process.argv[index]}`);
}

const discovery = discoverChangedPaths(base);
const plan = createValidationPlan(discovery.paths, discovery);
console.log(
  plan.runtime
    ? "Affected validation requires the development runtime."
    : "Affected validation does not require the development runtime.",
);
process.exitCode = plan.runtime ? 0 : 1;
