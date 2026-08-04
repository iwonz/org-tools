#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const executable = process.platform === "win32" ? "openspec.cmd" : "openspec";
const args = process.argv.slice(2);
if (args[0] === "--") args.shift();

const result = spawnSync(executable, args, {
  env: {
    ...process.env,
    DO_NOT_TRACK: "1",
    OPENSPEC_TELEMETRY: "0",
  },
  stdio: "inherit",
});

if (result.error) {
  console.error(result.error.message);
  process.exitCode = 1;
} else {
  process.exitCode = result.status ?? 1;
}
