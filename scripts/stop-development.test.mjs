import { execFile, spawn } from "node:child_process";
import { copyFile, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { promisify } from "node:util";

import { expect, onTestFinished, test, vi } from "vitest";

import {
  descendants,
  matchesDevelopmentCommand,
  parseProcesses,
  sameProcess,
} from "./development-processes.mjs";

const execute = promisify(execFile);
const workerSource = `
process.on("SIGTERM", () => {});
const server = require("node:http").createServer((request, response) => response.end("synthetic"));
server.listen(0, "127.0.0.1", () => process.send({ pid: process.pid, port: server.address().port }));
`;
const nextSource = `
const { spawn } = require("node:child_process");
const server = require("node:http").createServer((request, response) => response.end("synthetic"));
process.on("SIGTERM", () => process.exit(0));
server.listen(0, "127.0.0.1", () => {
  const ready = { pid: process.pid, port: server.address().port };
  if (process.env.DEV_STOP_TEST_WORKER === "1") {
    const child = spawn(process.execPath, ["-e", ${JSON.stringify(workerSource)}], { stdio: ["ignore", "ignore", "ignore", "ipc"] });
    child.once("message", (worker) => console.log(JSON.stringify({ ...ready, worker })));
  } else console.log(JSON.stringify(ready));
});
`;
const launcherSource = `
import { spawn } from "node:child_process";
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev"], { stdio: "inherit" });
child.once("exit", () => process.exit(0));
process.on("SIGTERM", () => child.kill("SIGTERM"));
`;

async function fixture() {
  const temporary = await mkdtemp(join(tmpdir(), "org-tools-dev-stop-test-"));
  const root = join(temporary, "checkout with spaces");
  const other = `${root}-other`;
  const children = [];
  onTestFinished(async () => {
    for (const { child, ready } of children) {
      if (ready?.worker) {
        try {
          process.kill(ready.worker.pid, "SIGKILL");
        } catch (error) {
          if (error.code !== "ESRCH") throw error;
        }
      }
      if (child.exitCode === null && child.signalCode === null) child.kill("SIGTERM");
    }
    await Promise.all(children.map(({ completion }) => completion));
    await rm(temporary, { recursive: true, force: true });
  });
  for (const checkout of [root, other]) {
    await mkdir(join(checkout, "scripts"), { recursive: true });
    for (const file of ["stop-development.mjs", "development-processes.mjs"]) {
      await copyFile(new URL(`./${file}`, import.meta.url), join(checkout, "scripts", file));
    }
    await writeFile(join(checkout, "scripts", "start-development.mjs"), launcherSource);
    for (const app of ["ui", "pages"]) {
      const next = join(checkout, "apps", app, "node_modules", "next", "dist", "bin", "next");
      await mkdir(dirname(next), { recursive: true });
      await writeFile(next, nextSource);
      await mkdir(join(checkout, "apps", app, "node_modules", ".bin"));
    }
  }
  async function start(checkout, app, mode, worker = false) {
    const cwd = join(checkout, "apps", app);
    const args =
      mode === "launcher"
        ? ["../../scripts/start-development.mjs"]
        : [`${cwd}/node_modules/.bin/../next/dist/bin/next`, mode];
    const child = spawn(process.execPath, args, {
      cwd,
      env: { ...process.env, DEV_STOP_TEST_WORKER: worker ? "1" : "0" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    const record = {
      child,
      completion: new Promise((resolve) => child.once("close", resolve)),
      ready: null,
    };
    children.push(record);
    let output = "";
    child.stdout.on("data", (chunk) => {
      output += chunk;
    });
    await vi.waitFor(
      () => {
        record.ready = JSON.parse(output.trim());
      },
      { timeout: 5_000 },
    );
    return record;
  }
  const stop = (env = {}) =>
    execute(process.execPath, [join(root, "scripts", "stop-development.mjs")], {
      cwd: other,
      env: { ...process.env, ...env },
      timeout: 15_000,
    });
  return { root, other, start, stop };
}

test("stops multiple existing server and Pages instances while preserving another checkout and production", async () => {
  const setup = await fixture();
  const first = await setup.start(setup.root, "ui", "launcher");
  const second = await setup.start(setup.root, "ui", "launcher");
  const pages = await setup.start(setup.root, "pages", "dev");
  const foreign = await setup.start(setup.other, "ui", "launcher");
  const production = await setup.start(setup.root, "ui", "start");
  expect(new Set([first.ready.port, second.ready.port, pages.ready.port]).size).toBe(3);
  const result = await setup.stop();
  expect(result.stdout).toContain("Stopped 3 development instance(s)");
  expect(result.stderr).toBe("");
  for (const instance of [first, second, pages]) {
    await instance.completion;
    await expect(fetch(`http://127.0.0.1:${instance.ready.port}`)).rejects.toThrow();
  }
  for (const instance of [foreign, production]) {
    expect(instance.child.exitCode).toBeNull();
    expect((await fetch(`http://127.0.0.1:${instance.ready.port}`)).ok).toBe(true);
  }
  expect((await setup.stop()).stdout).toContain("No development instances are running");
}, 20_000);

test("stops a reparented worker that ignores SIGTERM", async () => {
  const setup = await fixture();
  const instance = await setup.start(setup.root, "pages", "dev", true);
  expect((await setup.stop()).stdout).toContain("Stopped 1 development instance(s)");
  await instance.completion;
  await expect(fetch(`http://127.0.0.1:${instance.ready.worker.port}`)).rejects.toThrow();
}, 20_000);

test("fails closed when process inspection is unavailable", async () => {
  const setup = await fixture();
  const instance = await setup.start(setup.root, "pages", "dev");
  await expect(setup.stop({ PATH: setup.other })).rejects.toMatchObject({
    code: 1,
    stderr: expect.stringContaining("Could not inspect local processes with ps"),
  });
  expect((await fetch(`http://127.0.0.1:${instance.ready.port}`)).ok).toBe(true);
});

test("rejects misleading commands and accepts normalized entry paths", async () => {
  const cwd = "/checkout with spaces/apps/ui";
  const entries = [{ path: `${cwd}/node_modules/next/dist/bin/next`, subcommand: "dev" }];
  expect(
    await matchesDevelopmentCommand(
      `node ${cwd}/node_modules/.bin/../next/dist/bin/next dev --port 3500`,
      cwd,
      entries,
    ),
  ).toBe(true);
  for (const command of [
    `node ${cwd}/node_modules/next/dist/bin/next start`,
    `node ${cwd}/node_modules/next/dist/bin/next development`,
    `node ${cwd}-other/node_modules/next/dist/bin/next dev`,
    `sh -c node ${cwd}/node_modules/next/dist/bin/next dev`,
    `node -e ${cwd}/node_modules/next/dist/bin/next dev`,
  ])
    expect(await matchesDevelopmentCommand(command, cwd, entries)).toBe(false);
});

test("tracks descendant ownership and rejects reused process identities", () => {
  const processes = parseProcesses(`
  100 1 S Fri Sep 11 12:00:00 2026 node /checkout/scripts/start-development.mjs
  101 100 S Fri Sep 11 12:00:01 2026 node next dev
  102 101 S Fri Sep 11 12:00:02 2026 next-server
  103 1 S Fri Sep 11 12:00:03 2026 node next start
  104 100 Z Fri Sep 11 12:00:03 2026 <defunct>
`);
  expect([...descendants(processes, [processes[0]]).keys()]).toEqual([100, 101, 102]);
  expect(sameProcess(processes[2], { ...processes[2], ppid: 1 })).toBe(true);
  expect(sameProcess(processes[2], { ...processes[2], started: "Fri Sep 11 13:00:00 2026" })).toBe(
    false,
  );
  expect(sameProcess(processes[2], { ...processes[2], command: "node other-project" })).toBe(false);
  expect(() => parseProcesses("invalid process table")).toThrow("Could not parse");
});
