#!/usr/bin/env node

import { buildPages, validatePagesOutput } from "./pages.mjs";

const screenshotCount = await buildPages();
const violations = await validatePagesOutput();
if (violations.length > 0) {
  for (const violation of violations) console.error(`- ${violation}`);
  process.exitCode = 1;
} else {
  console.log(`GitHub Pages showcase built with ${screenshotCount} synthetic screenshots.`);
}
