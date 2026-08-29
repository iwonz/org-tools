import { fileURLToPath } from "node:url";

import { defineConfig, devices } from "@playwright/test";

const repositoryRoot = fileURLToPath(new URL("../..", import.meta.url));
const port = Number(process.env.ORG_TOOLS_PORT ?? "4173");
const configuredBaseUrl = process.env.ORG_TOOLS_BASE_URL;
const baseURL = configuredBaseUrl ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [["line"], ["html", { open: "never" }]] : "line",
  outputDir: "../../test-results/screenshots",
  expect: {
    timeout: 10_000,
  },
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    colorScheme: "light",
    launchOptions: {
      args: ["--disable-gpu", "--disable-lcd-text", "--font-render-hinting=none"],
    },
    locale: "en-US",
    timezoneId: "UTC",
    trace: "retain-on-failure",
    viewport: { width: 1440, height: 1000 },
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
  ...(configuredBaseUrl
    ? {}
    : {
        webServer: {
          command: `pnpm --filter @org-tools/ui exec serve out -l ${port}`,
          cwd: repositoryRoot,
          url: baseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      }),
});
