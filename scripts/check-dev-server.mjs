#!/usr/bin/env node

import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const launcherEntry = join(repositoryRoot, "scripts", "start-development.mjs");
const requireFromScreenshots = createRequire(
  join(repositoryRoot, "packages", "screenshots", "package.json"),
);
const { chromium } = requireFromScreenshots("@playwright/test");
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

async function probeBrowser(origin, projectPath) {
  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-gpu", "--disable-lcd-text", "--font-render-hinting=none"],
  });
  try {
    const context = await browser.newContext({ locale: "en-US", timezoneId: "UTC" });
    const page = await context.newPage();
    const externalRequests = [];
    const pageErrors = [];
    page.on("pageerror", (error) => {
      pageErrors.push(error.message);
    });
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (
        (url.protocol === "http:" || url.protocol === "https:") &&
        url.hostname !== "127.0.0.1" &&
        url.hostname !== "localhost"
      ) {
        externalRequests.push(url.href);
      }
    });

    const response = await page.goto(origin, {
      timeout: startupTimeoutMs,
      waitUntil: "domcontentloaded",
    });
    if (!response?.ok()) {
      throw new Error(`Root browser navigation failed (HTTP ${response?.status() ?? "unknown"}).`);
    }
    await page.waitForURL(new URL(projectPath, origin).href, { timeout: startupTimeoutMs });
    await page.locator('[data-demo-id="app-shell"]').waitFor({
      state: "visible",
      timeout: startupTimeoutMs,
    });
    await page.locator('[data-demo-id="org-editor-canvas"]').waitFor({
      state: "visible",
      timeout: startupTimeoutMs,
    });
    if (externalRequests.length > 0) {
      throw new Error(`Development browser made an external request: ${externalRequests[0]}`);
    }
    if (pageErrors.length > 0) {
      throw new Error(`Development browser raised an uncaught error: ${pageErrors[0]}`);
    }
  } finally {
    await browser.close();
  }
}

const port = await reserveLoopbackPort();
const runtimeDirectory = join(repositoryRoot, ".org-tools");
await mkdir(runtimeDirectory, { recursive: true });
const temporaryDirectory = await mkdtemp(join(runtimeDirectory, "dev-check-"));
const origin = `http://127.0.0.1:${port}`;
let logs = "";
const child = spawn(process.execPath, [launcherEntry], {
  cwd: repositoryRoot,
  env: {
    ...process.env,
    NEXT_TELEMETRY_DISABLED: "1",
    ORG_TOOLS_DB_PATH: join(temporaryDirectory, "org-tools.sqlite3"),
    PORT: String(port),
  },
  stdio: ["ignore", "pipe", "pipe"],
});

child.stdout.on("data", (chunk) => {
  logs = appendLog(logs, chunk);
});
child.stderr.on("data", (chunk) => {
  logs = appendLog(logs, chunk);
});

try {
  const result = await probe(origin, child);
  await probeBrowser(origin, result.projectPath);
  console.log(`Development server check passed (${origin}${result.projectPath}).`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  if (logs.trim()) console.error(`\nDevelopment server output:\n${logs.trim()}`);
  process.exitCode = 1;
} finally {
  await stopChild(child);
  await rm(temporaryDirectory, { force: true, recursive: true });
}
