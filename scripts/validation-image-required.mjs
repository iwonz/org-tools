#!/usr/bin/env node

import { createValidationPlan, discoverChangedPaths } from "./validation-plan.mjs";

let base = "origin/main";
const explicitPaths = [];
for (let index = 2; index < process.argv.length; index += 1) {
  if (process.argv[index] === "--base") base = process.argv[++index] ?? base;
  else if (process.argv[index] === "--path") explicitPaths.push(process.argv[++index] ?? "");
  else throw new Error(`Unknown argument: ${process.argv[index]}`);
}

const discovery = explicitPaths.length
  ? { baseAvailable: true, paths: explicitPaths }
  : discoverChangedPaths(base);
const plan = createValidationPlan(discovery.paths, discovery);
console.log(
  plan.image
    ? "Affected validation requires production image inspection."
    : "Affected validation does not require production image inspection.",
);
process.exitCode = plan.image ? 0 : 1;
