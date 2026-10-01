import { chromium } from "@playwright/test";
import { createBrowserDiagnostics } from "../browser-diagnostics.mjs";
import { startLoopbackProxy } from "./loopback-proxy.mjs";

const upstream = process.env.ORG_TOOLS_TEST_UPSTREAM_ORIGIN;
const closeProxy = upstream ? await startLoopbackProxy(upstream) : null;
const baseURL = process.env.ORG_TOOLS_BASE_URL ?? "http://localhost:3000";
const browser = await chromium.launch({ headless: true });
const diagnostics = createBrowserDiagnostics({ runtime: "server-development", scenario: "probe" });
try {
  const page = await browser.newPage({ baseURL });
  diagnostics.attach(page);
  const response = await page.goto("/", { waitUntil: "domcontentloaded" });
  if (!response?.ok()) throw new Error(`Development page returned ${response?.status() ?? 0}.`);
  await page
    .locator('[data-demo-id="setup-form"], [data-demo-id="login-form"], [data-demo-id="app-shell"]')
    .first()
    .waitFor({
      state: "visible",
      timeout: 30_000,
    });
  diagnostics.assertClean();
} finally {
  await browser.close();
  if (closeProxy) await closeProxy();
}
