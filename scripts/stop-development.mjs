#!/usr/bin/env node

import { fileURLToPath } from "node:url";

import { stopDevelopment } from "./development-processes.mjs";

try {
  const count = await stopDevelopment(fileURLToPath(new URL("..", import.meta.url)));
  console.log(
    count > 0
      ? `Stopped ${count} development instance(s) for this checkout.`
      : "No development instances are running for this checkout.",
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : "Could not stop development instances.");
  process.exitCode = 1;
}
