#!/usr/bin/env node

import { spawn } from "node:child_process";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const applicationRoot = join(repositoryRoot, "apps", "ui");
const nextEntry = join(applicationRoot, "node_modules", "next", "dist", "bin", "next");
const hostname = "127.0.0.1";
const port = process.env.PORT ?? "3000";
const origin = `http://${hostname}:${port}`;
const startupTimeoutMs = 90_000;
const pollIntervalMs = 250;
const maximumBufferedBytes = 64 * 1024;

if (!/^\d+$/u.test(port) || Number(port) < 1 || Number(port) > 65_535) {
  throw new Error(`PORT must be an integer from 1 to 65535, received ${JSON.stringify(port)}.`);
}

function delay(milliseconds) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));
}

function appendBounded(current, chunk) {
  const combined = `${current}${chunk.toString("utf8")}`;
  return combined.length <= maximumBufferedBytes ? combined : combined.slice(-maximumBufferedBytes);
}

let bufferedOutput = "";
let outputRevealed = false;
let stopping = false;

const child = spawn(
  process.execPath,
  [nextEntry, "dev", "--webpack", "--hostname", hostname, "--port", port],
  {
    cwd: applicationRoot,
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: "1",
    },
    stdio: ["inherit", "pipe", "pipe"],
  },
);

function forwardOutput(chunk, destination) {
  if (outputRevealed) {
    destination.write(chunk);
    return;
  }
  bufferedOutput = appendBounded(bufferedOutput, chunk);
}

child.stdout.on("data", (chunk) => forwardOutput(chunk, process.stdout));
child.stderr.on("data", (chunk) => forwardOutput(chunk, process.stderr));

function revealOutput() {
  if (outputRevealed) return;
  outputRevealed = true;
  if (bufferedOutput) process.stdout.write(bufferedOutput);
  bufferedOutput = "";
}

async function stopChild() {
  if (stopping || child.exitCode !== null || child.signalCode !== null) return;
  stopping = true;
  child.kill("SIGTERM");
  await Promise.race([new Promise((resolveExit) => child.once("exit", resolveExit)), delay(5_000)]);
  if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
}

async function warmDevelopmentState() {
  const deadline = Date.now() + startupTimeoutMs;
  let lastError = new Error("Development server did not answer.");

  while (Date.now() < deadline) {
    if (child.exitCode !== null || child.signalCode !== null) {
      throw new Error(`Next.js exited during startup (${child.exitCode ?? child.signalCode}).`);
    }

    try {
      const rootResponse = await fetch(`${origin}/`);
      const rootHtml = await rootResponse.text();
      if (!rootResponse.ok || !rootHtml.includes("<title>Org Tools</title>")) {
        throw new Error(`Root route returned HTTP ${rootResponse.status}.`);
      }
      const apiResponse = await fetch(`${origin}/api/state`, {
        headers: { Accept: "application/json" },
      });
      if (!apiResponse.ok) throw new Error(`State API returned HTTP ${apiResponse.status}.`);

      await delay(500);
      return origin;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      await delay(pollIntervalMs);
    }
  }

  throw new Error(`Development startup timed out: ${lastError.message}`);
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, async () => {
    revealOutput();
    await stopChild();
    process.exit(0);
  });
}

try {
  const stateUrl = await warmDevelopmentState();
  revealOutput();
  console.log(`\n✓ Development state runtime ready: ${stateUrl}`);
  const exitCode = await new Promise((resolveExit) => {
    child.once("exit", (code) => resolveExit(code ?? 1));
  });
  process.exitCode = exitCode;
} catch (error) {
  revealOutput();
  console.error(error instanceof Error ? error.message : String(error));
  await stopChild();
  process.exitCode = 1;
}
