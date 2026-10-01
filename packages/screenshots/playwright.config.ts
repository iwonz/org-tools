import { defineConfig, devices } from "@playwright/test";

const baseURL =
  process.env.ORG_TOOLS_BASE_URL ?? process.env.ORG_TOOLS_PUBLIC_ORIGIN ?? "http://127.0.0.1:3000";

export default defineConfig({
  metadata: { runtime: "server-production" },
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
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
});
