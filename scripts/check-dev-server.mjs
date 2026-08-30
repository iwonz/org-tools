#!/usr/bin/env node

import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const applicationRoot = join(repositoryRoot, "apps", "ui");
const nextEntry = join(applicationRoot, "node_modules", "next", "dist", "bin", "next");
const startupTimeoutMs = 90_000;
const pollIntervalMs = 250;
const maximumLogBytes = 64 * 1024;

function delay(milliseconds) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));
}

async function reserveLoopbackPort() {
  const server = createServer();
  await new Promise((resolveListen, rejectListen) => {
    server.once("error", rejectListen);
    server.listen(0, "127.0.0.1", resolveListen);
  });
  const address = server.address();
  const port = typeof address === "object" && address !== null ? address.port : null;
  await new Promise((resolveClose, rejectClose) =>
    server.close((error) => (error ? rejectClose(error) : resolveClose())),
  );
  if (port === null) throw new Error("Could not reserve a loopback port.");
  return port;
}

function appendLog(current, chunk) {
  const combined = `${current}${chunk.toString("utf8")}`;
  return combined.length <= maximumLogBytes ? combined : combined.slice(-maximumLogBytes);
}

async function waitForExit(child, timeoutMs) {
  if (child.exitCode !== null || child.signalCode !== null) return true;
  return Promise.race([
    new Promise((resolveExit) => child.once("exit", () => resolveExit(true))),
    delay(timeoutMs).then(() => false),
  ]);
}

async function stopChild(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  child.kill("SIGTERM");
  if (await waitForExit(child, 5_000)) return;
  child.kill("SIGKILL");
  await waitForExit(child, 5_000);
}

function validateProjectList(value, projectId) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const response = value;
  return (
    response.currentProjectId === projectId &&
    Array.isArray(response.projects) &&
    response.projects.some(
      (project) =>
        project !== null &&
        typeof project === "object" &&
        project.id === projectId &&
        typeof project.name === "string",
    )
  );
}

async function probe(origin, child) {
  const deadline = Date.now() + startupTimeoutMs;
  let lastError = new Error("Development server did not answer.");

  while (Date.now() < deadline) {
    if (child.exitCode !== null || child.signalCode !== null) {
      throw new Error(`Development server exited before the probe completed (${child.exitCode}).`);
    }

    try {
      const rootResponse = await fetch(`${origin}/`, { redirect: "manual" });
      const rootHtml = await rootResponse.text();
      const location = rootResponse.headers.get("location");
      const streamedRedirect =
        rootResponse.status === 200
          ? rootHtml.match(
              /\/projects\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/u,
            )?.[0]
          : undefined;
      const projectPath = location ? new URL(location, origin).pathname : (streamedRedirect ?? "");
      if (![200, 307, 308].includes(rootResponse.status)) {
        throw new Error(
          `Expected the root project redirect, received HTTP ${rootResponse.status}.`,
        );
      }
      const projectMatch =
        /^\/projects\/([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/u.exec(
          projectPath,
        );
      if (!projectMatch?.[1])
        throw new Error("Root did not redirect to a stable UUID project URL.");

      const projectResponse = await fetch(`${origin}${projectPath}`);
      const projectHtml = await projectResponse.text();
      if (!projectResponse.ok || !projectHtml.includes("<title>Org Tools</title>")) {
        throw new Error(`Project route failed to render (HTTP ${projectResponse.status}).`);
      }

      const apiResponse = await fetch(`${origin}/api/projects`, {
        headers: { Accept: "application/json" },
      });
      const apiValue = await apiResponse.json();
      if (!apiResponse.ok || !validateProjectList(apiValue, projectMatch[1])) {
        throw new Error(`Project API returned an invalid response (HTTP ${apiResponse.status}).`);
      }

      return { projectPath };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      await delay(pollIntervalMs);
    }
  }

  throw new Error(`Development server probe timed out: ${lastError.message}`);
}

const port = await reserveLoopbackPort();
const temporaryDirectory = await mkdtemp(join(tmpdir(), "org-tools-dev-check-"));
const origin = `http://127.0.0.1:${port}`;
let logs = "";
const child = spawn(
  process.execPath,
  [nextEntry, "dev", "--hostname", "127.0.0.1", "--port", String(port)],
  {
    cwd: applicationRoot,
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: "1",
      ORG_TOOLS_DB_PATH: join(temporaryDirectory, "org-tools.sqlite3"),
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);

child.stdout.on("data", (chunk) => {
  logs = appendLog(logs, chunk);
});
child.stderr.on("data", (chunk) => {
  logs = appendLog(logs, chunk);
});

try {
  const result = await probe(origin, child);
  console.log(`Development server check passed (${origin}${result.projectPath}).`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  if (logs.trim()) console.error(`\nDevelopment server output:\n${logs.trim()}`);
  process.exitCode = 1;
} finally {
  await stopChild(child);
  await rm(temporaryDirectory, { force: true, recursive: true });
}
