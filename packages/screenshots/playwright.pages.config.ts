import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.ORG_TOOLS_PAGES_PORT ?? "4174");
const configuredBaseUrl = process.env.ORG_TOOLS_PAGES_BASE_URL;
const baseURL = configuredBaseUrl ?? `http://127.0.0.1:${port}/org-tools/`;

export default defineConfig({
  expect: { timeout: 10_000 },
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: false,
  outputDir: "../../test-results/pages",
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
  reporter: process.env.CI ? [["line"], ["html", { open: "never" }]] : "line",
  retries: process.env.CI ? 1 : 0,
  testDir: "./tests",
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    colorScheme: "light",
    locale: "en-US",
    timezoneId: "UTC",
    trace: "retain-on-failure",
    viewport: { height: 1000, width: 1440 },
  },
  workers: 1,
  ...(configuredBaseUrl
    ? {}
    : {
        webServer: {
          command: "node scripts/serve-pages.mjs",
          cwd: "../..",
          env: { ORG_TOOLS_PAGES_PORT: String(port) },
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
          url: baseURL,
        },
      }),
});
