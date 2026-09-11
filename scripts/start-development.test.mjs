import { spawn } from "node:child_process";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { expect, onTestFinished, test, vi } from "vitest";

const syntheticNext = `
const { createServer } = require("node:http");
const { writeFileSync } = require("node:fs");
const mode = process.env.LAUNCHER_TEST_MODE;
if (mode === "early") {
  console.error("Synthetic startup failure.");
  process.exit(7);
}
process.on("SIGTERM", () => {
  console.log("Synthetic child stopped.");
  process.exit(0);
});
createServer((request, response) => {
  if (request.url === "/exit") {
    response.end("stopping");
    setTimeout(() => process.exit(Number(process.env.LAUNCHER_TEST_EXIT_CODE)), 20);
    return;
  }
  if (request.url === "/api/state") {
    writeFileSync(process.env.LAUNCHER_TEST_MARKER, "requested");
    if (mode === "pending") {
      setTimeout(() => process.exit(7), 20);
      return;
    }
    if (mode === "interrupt") return;
    response.end("{}");
    if (mode === "settling") setTimeout(() => process.exit(7), 100);
    return;
  }
  response.end("<title>Org Tools</title>");
}).listen(Number(process.env.PORT), "127.0.0.1");
`;

async function startLauncher(mode, exitCode = 7) {
  const portReservation = createServer();
  await new Promise((resolve, reject) => {
    portReservation.once("error", reject);
    portReservation.listen(0, "127.0.0.1", resolve);
  });
  const port = portReservation.address().port;
  await new Promise((resolve) => portReservation.close(resolve));
  const root = await mkdtemp(join(tmpdir(), "org-tools-launcher-test-"));
  const entry = join(root, "scripts", "start-development.mjs");
  const nextEntry = join(root, "apps", "ui", "node_modules", "next", "dist", "bin", "next");
  const marker = join(root, "state-requested");
  await mkdir(dirname(entry), { recursive: true });
  await copyFile(new URL("./start-development.mjs", import.meta.url), entry);
  if (mode !== "spawn-error") {
    await mkdir(dirname(nextEntry), { recursive: true });
    await writeFile(nextEntry, syntheticNext);
  }
  let output = "";
  const child = spawn(process.execPath, [entry], {
    env: {
      ...process.env,
      PORT: String(port),
      LAUNCHER_TEST_MODE: mode,
      LAUNCHER_TEST_MARKER: marker,
      LAUNCHER_TEST_EXIT_CODE: String(exitCode),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const completion = new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("close", (code, signal) => resolve({ code, signal }));
  });
  child.stdout.on("data", (chunk) => {
    output += chunk;
  });
  child.stderr.on("data", (chunk) => {
    output += chunk;
  });
  onTestFinished(async () => {
    child.kill("SIGTERM");
    const timeout = setTimeout(() => child.kill("SIGKILL"), 6_000);
    try {
      await completion;
    } finally {
      clearTimeout(timeout);
      await rm(root, { force: true, recursive: true });
    }
  });
  return {
    child,
    completion,
    marker,
    origin: `http://127.0.0.1:${port}`,
    output: () => output,
  };
}

test.each(["early", "settling", "pending"])(
  "reports a child exit during %s startup without false readiness or an unsettled await",
  async (mode) => {
    const launcher = await startLauncher(mode);
    expect(await launcher.completion).toEqual({ code: 1, signal: null });
    expect(launcher.output()).toContain("Next.js exited during startup (7).");
    expect(launcher.output()).not.toContain("Development state runtime ready");
    expect(launcher.output()).not.toContain("unsettled top-level await");
  },
  10_000,
);

test("reports a spawn error without an unhandled event", async () => {
  const launcher = await startLauncher("spawn-error");
  expect(await launcher.completion).toEqual({ code: 1, signal: null });
  expect(launcher.output()).toContain("ENOENT");
  expect(launcher.output()).not.toContain("Unhandled 'error' event");
  expect(launcher.output()).not.toContain("unsettled top-level await");
});

test.each([0, 7])("preserves running child exit code %i", async (exitCode) => {
  const launcher = await startLauncher("running", exitCode);
  await vi.waitFor(() => expect(launcher.output()).toContain("Development state runtime ready"), {
    timeout: 5_000,
  });
  expect(launcher.child.exitCode).toBeNull();
  await fetch(`${launcher.origin}/exit`);
  expect(await launcher.completion).toEqual({ code: exitCode, signal: null });
  expect(launcher.output()).not.toContain("unsettled top-level await");
});

test.each(["SIGINT", "SIGTERM"])("cancels an in-flight probe on %s", async (signal) => {
  const launcher = await startLauncher("interrupt");
  await vi.waitFor(async () => expect(await readFile(launcher.marker, "utf8")).toBe("requested"), {
    timeout: 5_000,
  });
  launcher.child.kill(signal);
  expect(await launcher.completion).toEqual({ code: 0, signal: null });
  expect(launcher.output()).toContain("Synthetic child stopped.");
  expect(launcher.output()).not.toContain("Development state runtime ready");
  expect(launcher.output()).not.toContain("unsettled top-level await");
  await expect(fetch(launcher.origin)).rejects.toThrow();
});

test("stops the running child on interruption", async () => {
  const launcher = await startLauncher("running");
  await vi.waitFor(() => expect(launcher.output()).toContain("Development state runtime ready"), {
    timeout: 5_000,
  });
  launcher.child.kill("SIGTERM");
  expect(await launcher.completion).toEqual({ code: 0, signal: null });
  expect(launcher.output()).toContain("Synthetic child stopped.");
  await expect(fetch(launcher.origin)).rejects.toThrow();
});
