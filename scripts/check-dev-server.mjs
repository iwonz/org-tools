#!/usr/bin/env node

import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createBrowserDiagnostics } from "../packages/screenshots/browser-diagnostics.mjs";

const repositoryRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const launcherEntry = join(repositoryRoot, "scripts", "start-development.mjs");
const requireFromScreenshots = createRequire(
  join(repositoryRoot, "packages", "screenshots", "package.json"),
);
const { chromium } = requireFromScreenshots("@playwright/test");
const startupTimeoutMs = 90_000;
const pollIntervalMs = 250;
const maximumLogBytes = 64 * 1024;
const fixturePath = join(
  repositoryRoot,
  "packages",
  "screenshots",
  "fixtures",
  "synthetic-state.json",
);

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

function validateStateDocument(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const response = value;
  return (
    Number.isSafeInteger(response.revision) &&
    response.state !== null &&
    typeof response.state === "object" &&
    !Array.isArray(response.state) &&
    response.state.organization !== null &&
    typeof response.state.organization === "object" &&
    response.state.ui !== null &&
    typeof response.state.ui === "object"
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
      const rootResponse = await fetch(`${origin}/`);
      const rootHtml = await rootResponse.text();
      if (!rootResponse.ok || !rootHtml.includes("<title>Org Tools</title>")) {
        throw new Error(`Root route failed to render (HTTP ${rootResponse.status}).`);
      }

      const apiResponse = await fetch(`${origin}/api/state`, {
        headers: { Accept: "application/json" },
      });
      const apiValue = await apiResponse.json();
      if (!apiResponse.ok || !validateStateDocument(apiValue)) {
        throw new Error(`State API returned an invalid response (HTTP ${apiResponse.status}).`);
      }

      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      await delay(pollIntervalMs);
    }
  }

  throw new Error(`Development server probe timed out: ${lastError.message}`);
}

async function probeBrowser(origin) {
  const fixture = JSON.parse(await readFile(fixturePath, "utf8"));
  const currentResponse = await fetch(`${origin}/api/state`);
  const currentDocument = await currentResponse.json();
  if (!currentResponse.ok || !validateStateDocument(currentDocument)) {
    throw new Error("Could not read the development diagnostic state.");
  }
  const mainView = fixture.organization.views.find((view) => view.kind === "main");
  const mainViewUi = fixture.ui.views.find((view) => view.viewId === mainView?.id);
  if (!mainView || !mainViewUi) throw new Error("The development fixture has no Main View.");
  const customViewId = "88888888-8888-4888-8888-888888888888";
  fixture.organization.views.push({
    createdAt: mainView.createdAt,
    document: {
      employeeOverrides: [],
      employees: [],
      layoutMode: mainView.document.layoutMode,
      units: [],
    },
    id: customViewId,
    kind: "custom",
    name: "Console audit",
    updatedAt: mainView.updatedAt,
  });
  fixture.ui.activeTab = "orgEditor";
  fixture.ui.activeViewId = customViewId;
  fixture.ui.download.sourceViewId = customViewId;
  fixture.ui.views.push({
    selectedItems: [],
    viewId: customViewId,
    viewport: { ...mainViewUi.viewport },
  });
  const seedResponse = await fetch(`${origin}/api/state`, {
    body: JSON.stringify({
      expectedRevision: currentDocument.revision,
      scope: "all",
      state: fixture,
    }),
    headers: { "Content-Type": "application/json", Origin: origin },
    method: "PUT",
  });
  if (!seedResponse.ok) {
    throw new Error(`Could not seed the development diagnostic state (${seedResponse.status}).`);
  }

  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-gpu", "--disable-lcd-text", "--font-render-hinting=none"],
  });
  try {
    const context = await browser.newContext({ locale: "en-US", timezoneId: "UTC" });
    const page = await context.newPage();
    const diagnostics = createBrowserDiagnostics({
      runtime: "development",
      scenario: "inactive View data download",
    });
    diagnostics.attach(page);
    const externalRequests = [];
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
    await page.locator('[data-demo-id="app-shell"]').waitFor({
      state: "visible",
      timeout: startupTimeoutMs,
    });
    await page.locator('[data-demo-id="org-editor-canvas"]').waitFor({
      state: "visible",
      timeout: startupTimeoutMs,
    });
    await page.getByRole("combobox", { name: "Active View" }).click();
    await page.getByRole("option", { name: "Main", exact: true }).click();
    await page.getByRole("tab", { name: "Download", exact: true }).click();
    await page.getByRole("tabpanel", { name: "Download", exact: true }).waitFor({
      state: "visible",
      timeout: startupTimeoutMs,
    });
    await page.waitForTimeout(100);
    if (externalRequests.length > 0) {
      throw new Error(`Development browser made an external request: ${externalRequests[0]}`);
    }
    diagnostics.assertClean();
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
  await probe(origin, child);
  await probeBrowser(origin);
  console.log(`Development server check passed (${origin}/).`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  if (logs.trim()) console.error(`\nDevelopment server output:\n${logs.trim()}`);
  process.exitCode = 1;
} finally {
  await stopChild(child);
  await rm(temporaryDirectory, { force: true, recursive: true });
}
