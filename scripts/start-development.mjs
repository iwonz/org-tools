#!/usr/bin/env node

import { spawn } from "node:child_process";
import { join, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
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

function appendBounded(current, chunk) {
  const combined = `${current}${chunk.toString("utf8")}`;
  return combined.length <= maximumBufferedBytes ? combined : combined.slice(-maximumBufferedBytes);
}

let bufferedOutput = "";
let outputRevealed = false;
let interrupted = false;
let stopPromise;
let childResult;
const startupController = new AbortController();

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

// Register before warmup so an exit during a request or settling delay is never lost.
const childCompletion = new Promise((resolveCompletion) => {
  const complete = (result) => {
    if (childResult) return;
    childResult = result;
    startupController.abort(
      result.error ?? new Error(`Next.js exited during startup (${result.code ?? result.signal}).`),
    );
    resolveCompletion(result);
  };
  child.once("error", (error) => complete({ error }));
  child.once("exit", (code, signal) => complete({ code, signal }));
});

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
  if (stopPromise) return stopPromise;
  if (childResult) return;
  stopPromise = (async () => {
    const timeoutController = new AbortController();
    child.kill("SIGTERM");
    try {
      await Promise.race([
        childCompletion,
        delay(5_000, undefined, { signal: timeoutController.signal }),
      ]);
      if (!childResult) {
        child.kill("SIGKILL");
        await childCompletion;
      }
    } finally {
      timeoutController.abort();
    }
  })();
  return stopPromise;
}

async function warmDevelopmentState() {
  const { signal } = startupController;
  let lastError = new Error("Development server did not answer.");
  const timeout = setTimeout(() => {
    startupController.abort(new Error(`Development startup timed out: ${lastError.message}`));
  }, startupTimeoutMs);

  try {
    while (true) {
      signal.throwIfAborted();
      try {
        const rootResponse = await fetch(`${origin}/`, { signal });
        const rootHtml = await rootResponse.text();
        if (!rootResponse.ok || !rootHtml.includes("<title>Org Tools</title>")) {
          throw new Error(`Root route returned HTTP ${rootResponse.status}.`);
        }
        const apiResponse = await fetch(`${origin}/api/state`, {
          headers: { Accept: "application/json" },
          signal,
        });
        await apiResponse.body?.cancel();
        if (!apiResponse.ok) throw new Error(`State API returned HTTP ${apiResponse.status}.`);

        await delay(500, undefined, { signal });
        return origin;
      } catch (error) {
        signal.throwIfAborted();
        lastError = error instanceof Error ? error : new Error(String(error));
        await delay(pollIntervalMs, undefined, { signal });
      }
    }
  } catch (error) {
    throw signal.aborted ? signal.reason : error;
  } finally {
    clearTimeout(timeout);
  }
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, async () => {
    if (interrupted) return;
    interrupted = true;
    startupController.abort(new Error("Development startup interrupted."));
    revealOutput();
    await stopChild();
    process.exitCode = 0;
  });
}

try {
  const stateUrl = await warmDevelopmentState();
  startupController.signal.throwIfAborted();
  revealOutput();
  console.log(`\n✓ Development state runtime ready: ${stateUrl}`);
  const result = await childCompletion;
  if (result.error) throw result.error;
  process.exitCode = interrupted ? 0 : (result.code ?? 1);
} catch (error) {
  revealOutput();
  if (!interrupted) console.error(error instanceof Error ? error.message : String(error));
  await stopChild();
  process.exitCode = interrupted ? 0 : 1;
}
