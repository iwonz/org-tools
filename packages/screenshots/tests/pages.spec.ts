import { readFile } from "node:fs/promises";

import ruMessages from "../../../apps/ui/messages/ru.json" with { type: "json" };
import { expect, test } from "./browser-test.js";
import { localeStorageKey, syntheticStatePath } from "./helpers.js";

const useEnglish = (key: string) => window.localStorage.setItem(key, "en");

async function importSyntheticState(page: import("@playwright/test").Page) {
  const chooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Import", exact: true }).click();
  await (await chooserPromise).setFiles(syntheticStatePath);
  const dialog = page.getByRole("dialog", { name: "Import state" });
  await expect(dialog.locator('[data-demo-id="state-import-summary"]')).toContainText(
    "4 Employees",
  );
  await dialog.getByRole("button", { name: "Replace state", exact: true }).click();
  await expect(dialog).toBeHidden();
}

test("runs the complete state editor at the repository base path without APIs or file persistence", async ({
  page,
}) => {
  const externalRequests: string[] = [];
  const apiRequests: string[] = [];
  const mcpRequests: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (
      ["http:", "https:"].includes(url.protocol) &&
      !["127.0.0.1", "localhost"].includes(url.hostname)
    ) {
      externalRequests.push(request.url());
    }
    if (url.pathname.includes("/api/")) apiRequests.push(request.url());
    if (url.pathname === "/mcp" || url.pathname.includes("/api/mcp")) {
      mcpRequests.push(request.url());
    }
  });
  await page.addInitScript(useEnglish, localeStorageKey);
  await page.goto("./", { waitUntil: "domcontentloaded" });

  await expect(page).toHaveURL(/\/org-tools\/$/u);
  await expect(page.getByRole("tab", { name: "Editor", exact: true })).toBeVisible();
  await expect(page.locator('[data-demo-id="browser-file-switcher"]')).toHaveCount(0);
  await expect(page.locator('[data-demo-id="mcp-control"]')).toHaveCount(0);
  await expect(page.getByRole("button", { name: "MCP", exact: true })).toHaveCount(0);
  await expect(page.getByRole("dialog", { name: "MCP", exact: true })).toHaveCount(0);
  await expect(page.locator('[data-demo-id="project-save"]')).toHaveCount(0);
  await importSyntheticState(page);
  await expect(page.getByText("Product", { exact: true }).first()).toBeVisible();

  const stateExportPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export state", exact: true }).click();
  const stateExport = await stateExportPromise;
  expect(stateExport.suggestedFilename()).toBe("org-tools-state.json");
  const savedPath = await stateExport.path();
  const saved = JSON.parse(await readFile(savedPath ?? "", "utf8")) as Record<string, unknown>;
  expect(Object.keys(saved).sort()).toEqual(["organization", "ui"]);

  for (const tab of ["Employees", "Analytics", "Calendar"] as const) {
    await page.getByRole("tab", { name: tab, exact: true }).click();
    await expect(page.getByRole("tabpanel", { name: tab, exact: true })).toBeVisible();
  }
  await page.getByRole("tab", { name: "Download", exact: true }).click();
  await page
    .getByRole("button", { name: "Add Unit Employees to download", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  const settings = page.locator('[data-demo-id="export-settings-dialog"]');
  const csvPromise = page.waitForEvent("download");
  await settings.getByRole("button", { name: "Download", exact: true }).click();
  expect((await csvPromise).suggestedFilename()).toBe("org-tools-export.csv");
  await page.keyboard.press("Escape");

  const metadata = await page.evaluate(async () => ({
    databases: typeof indexedDB.databases === "function" ? await indexedDB.databases() : [],
    storageKeys: Object.keys(localStorage).sort(),
  }));
  expect(metadata.databases).toEqual([]);
  expect(metadata.storageKeys).toEqual([localeStorageKey, "org-tools-theme"]);
  await page.locator('[data-demo-id="sidebar-toggle"]').click();
  await page.locator('[data-demo-id="theme-toggle"]').click();
  await page.getByRole("option", { name: "Dark", exact: true }).click();
  await page.locator('[data-demo-id="language-toggle"]').click();
  await page.getByRole("option", { name: ruMessages.Ui.Russian, exact: true }).click();
  await expect(page.locator('[data-demo-id="mcp-control"]')).toHaveCount(0);
  await expect(page.getByRole("button", { name: "MCP", exact: true })).toHaveCount(0);
  await expect(page.getByRole("dialog", { name: "MCP", exact: true })).toHaveCount(0);
  expect(externalRequests).toEqual([]);
  expect(apiRequests).toEqual([]);
  expect(mcpRequests).toEqual([]);
});

test("hands state to another live tab and forgets it after the final tab closes", async ({
  page,
  context,
}) => {
  await page.addInitScript(useEnglish, localeStorageKey);
  await page.goto("./", { waitUntil: "domcontentloaded" });
  await importSyntheticState(page);

  const secondPage = await context.newPage();
  await secondPage.goto("./", { waitUntil: "domcontentloaded" });
  await expect(secondPage.getByText("Product", { exact: true }).first()).toBeVisible();
  await secondPage.getByRole("tab", { name: "Employees", exact: true }).click();
  await expect(page.getByRole("tab", { name: "Employees", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );

  await page.close();
  await secondPage.close();
  const freshPage = await context.newPage();
  await freshPage.goto("./", { waitUntil: "domcontentloaded" });
  await expect(freshPage.getByText("Product", { exact: true })).toHaveCount(0);
  await expect(freshPage.locator('[data-demo-id="top-level-empty-state"]')).toBeVisible();
});
