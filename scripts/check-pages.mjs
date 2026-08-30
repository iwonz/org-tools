#!/usr/bin/env node

import { validatePagesOutput } from "./pages.mjs";

const violations = await validatePagesOutput();
if (violations.length > 0) {
  console.error(`GitHub Pages check failed with ${violations.length} violation(s):`);
  for (const violation of violations) console.error(`- ${violation}`);
  process.exitCode = 1;
} else {
  console.log("GitHub Pages check passed.");
}
