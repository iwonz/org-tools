#!/usr/bin/env node

import { createValidationPlan, discoverChangedPaths } from "./validation-plan.mjs";

const field = process.argv[2];
let base = "origin/main";
for (let index = 3; index < process.argv.length; index += 1) {
  if (process.argv[index] === "--base") base = process.argv[++index] ?? base;
  else throw new Error(`Unknown argument: ${process.argv[index]}`);
}
const plan = createValidationPlan(discoverChangedPaths(base).paths);
const outputs = {
  audit: String(plan.audit),
  browserGrep: plan.browserTags.join("|"),
  build: String(plan.build),
  image: String(plan.image),
  migration: String(plan.migrations),
  runtime: String(plan.runtime),
  screenshotModules: plan.screenshotAll ? "*" : plan.screenshotModules.join(","),
  screenshots: String(plan.screenshots),
};
if (!(field in outputs)) throw new Error(`Unknown CI output: ${field}`);
console.log(outputs[field]);
