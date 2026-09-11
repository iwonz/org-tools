import { execFile } from "node:child_process";
import { readlink, realpath } from "node:fs/promises";
import { join, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { promisify } from "node:util";

const execute = promisify(execFile);
const commandOptions = {
  encoding: "utf8",
  env: { ...process.env, LC_ALL: "C" },
  maxBuffer: 8 * 1024 * 1024,
  timeout: 5_000,
};

export function parseProcesses(output) {
  const processes = [];
  for (const line of output.trim().split("\n")) {
    if (!line.trim()) continue;
    const match = line.match(/^\s*(\d+)\s+(\d+)\s+(\S+)\s+(\S+\s+\S+\s+\d+\s+\S+\s+\d+)\s+(.+)$/u);
    if (!match) throw new Error("Could not parse the local process table.");
    if (match[3].startsWith("Z")) continue;
    processes.push({
      pid: Number(match[1]),
      ppid: Number(match[2]),
      started: match[4],
      command: match[5],
    });
  }
  return processes;
}

async function listProcesses() {
  try {
    const { stdout } = await execute(
      "ps",
      ["-ww", "-axo", "pid=,ppid=,stat=,lstart=,command="],
      commandOptions,
    );
    return parseProcesses(stdout);
  } catch {
    throw new Error(
      "Could not inspect local processes with ps; no unverified process will be stopped.",
    );
  }
}

async function workingDirectory(pid) {
  try {
    if (process.platform === "linux") return await realpath(await readlink(`/proc/${pid}/cwd`));
    const { stdout } = await execute(
      "lsof",
      ["-a", "-p", String(pid), "-d", "cwd", "-Fn"],
      commandOptions,
    );
    const path = stdout
      .split("\n")
      .find((line) => line.startsWith("n"))
      ?.slice(1);
    return path ? await realpath(path) : null;
  } catch (error) {
    if (error.code === "ENOENT" && process.platform === "linux") return null;
    if (error.code === 1 && process.platform === "darwin") return null;
    throw new Error(`Could not inspect the working directory of process ${pid}.`);
  }
}

async function entryPaths(path) {
  try {
    return [...new Set([path, await realpath(path)])];
  } catch (error) {
    if (error.code === "ENOENT") return [path];
    throw new Error("Could not resolve development entry paths.");
  }
}

export async function matchesDevelopmentCommand(command, cwd, entries) {
  const executablePrefix = `${process.execPath} `;
  const args = command.startsWith(executablePrefix)
    ? command.slice(executablePrefix.length)
    : command.match(/^(?:\/[^\s]*\/)?node(?:js)?\s+(.+)$/u)?.[1];
  if (!args) return false;
  const boundaries = [args.length, ...[...args.matchAll(/ /gu)].map((match) => match.index)];
  for (const boundary of boundaries) {
    const rest = args.slice(boundary).trimStart();
    const eligible = entries.filter(
      ({ subcommand }) => !subcommand || rest === subcommand || rest.startsWith(`${subcommand} `),
    );
    if (eligible.length === 0) continue;
    const paths = await entryPaths(resolve(cwd, args.slice(0, boundary)));
    if (eligible.some(({ path }) => paths.includes(path))) return true;
  }
  return false;
}

export function sameProcess(left, right) {
  return Boolean(
    left &&
      right &&
      left.pid === right.pid &&
      left.started === right.started &&
      left.command === right.command,
  );
}

export function descendants(processes, roots) {
  const children = new Map();
  for (const entry of processes) {
    const siblings = children.get(entry.ppid) ?? [];
    siblings.push(entry);
    children.set(entry.ppid, siblings);
  }
  const owned = new Map(roots.map((entry) => [entry.pid, entry]));
  const queue = [...roots];
  for (let index = 0; index < queue.length; index += 1) {
    for (const child of children.get(queue[index].pid) ?? []) {
      if (owned.has(child.pid)) continue;
      owned.set(child.pid, child);
      queue.push(child);
    }
  }
  return owned;
}

export async function stopDevelopment(repositoryPath) {
  if (process.platform !== "darwin" && process.platform !== "linux") {
    throw new Error("dev-stop supports macOS and Linux.");
  }
  const root = await realpath(repositoryPath);
  const directories = [root, join(root, "apps", "ui"), join(root, "apps", "pages")];
  const entries = [];
  for (const path of await entryPaths(join(root, "scripts", "start-development.mjs"))) {
    entries.push({ path, subcommand: null });
  }
  for (const app of directories.slice(1)) {
    for (const entry of ["node_modules/next/dist/bin/next", "node_modules/.bin/next"]) {
      for (const path of await entryPaths(join(app, entry)))
        entries.push({ path, subcommand: "dev" });
    }
  }
  const processes = await listProcesses();
  const candidates = processes.filter(
    (entry) =>
      entry.pid !== process.pid &&
      (entry.command.includes("start-development.mjs") ||
        /next\s+dev(?:\s|$)/u.test(entry.command)),
  );
  const matched = (
    await Promise.all(
      candidates.map(async (entry) => {
        const cwd = await workingDirectory(entry.pid);
        return cwd &&
          directories.includes(cwd) &&
          (await matchesDevelopmentCommand(entry.command, cwd, entries))
          ? entry
          : null;
      }),
    )
  ).filter(Boolean);
  // Signal outer roots first so the launcher can perform its own graceful child shutdown.
  const roots = matched.filter(
    (entry) =>
      !matched.some((other) => other !== entry && descendants(processes, [other]).has(entry.pid)),
  );
  if (roots.length === 0) return 0;
  let owned = descendants(processes, roots);

  async function refresh() {
    const current = await listProcesses();
    const survivors = current.filter((entry) => sameProcess(entry, owned.get(entry.pid)));
    owned = descendants(current, survivors);
    return [...owned.values()];
  }

  async function signalVerified(targets, signal) {
    for (const target of targets) {
      const current = (await listProcesses()).find((entry) => entry.pid === target.pid);
      if (!sameProcess(target, current)) continue;
      try {
        process.kill(target.pid, signal);
      } catch (error) {
        if (error.code !== "ESRCH")
          throw new Error(`Could not send ${signal} to process ${target.pid}.`);
      }
    }
  }

  async function waitForStop(timeoutMs) {
    const deadline = Date.now() + timeoutMs;
    while ((await refresh()).length > 0 && Date.now() < deadline) await delay(100);
    return [...owned.values()];
  }

  await signalVerified(roots, "SIGTERM");
  let survivors = await waitForStop(6_000);
  if (survivors.length > 0) {
    await signalVerified(survivors, "SIGTERM");
    survivors = await waitForStop(1_000);
  }
  if (survivors.length > 0) {
    await signalVerified(survivors, "SIGKILL");
    survivors = await waitForStop(2_000);
  }
  if (survivors.length > 0)
    throw new Error(`${survivors.length} development processes did not stop.`);
  return roots.length;
}
