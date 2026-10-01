import { spawn } from "node:child_process";
import { startLoopbackProxy } from "./loopback-proxy.mjs";

const upstream = process.env.ORG_TOOLS_TEST_UPSTREAM_ORIGIN;
const loopbackPort = Number(process.env.ORG_TOOLS_TEST_LOOPBACK_PORT ?? "3000");
const closeProxy = upstream ? await startLoopbackProxy(upstream, loopbackPort) : null;
const child = spawn(
  process.execPath,
  ["./node_modules/@playwright/test/cli.js", ...process.argv.slice(2)],
  {
    env: {
      ...process.env,
      ...(upstream ? { ORG_TOOLS_BASE_URL: `http://localhost:${loopbackPort}` } : {}),
    },
    stdio: "inherit",
  },
);

const signal = (name) => child.kill(name);
process.once("SIGINT", signal);
process.once("SIGTERM", signal);
const exitCode = await new Promise((resolve, reject) => {
  child.once("error", reject);
  child.once("exit", (code, childSignal) => resolve(childSignal ? 1 : (code ?? 1)));
});
if (closeProxy) await closeProxy();
process.exit(exitCode);
