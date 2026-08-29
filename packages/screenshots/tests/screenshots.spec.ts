import { mkdir, readdir, readFile, unlink } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { expect, type Page, test } from "@playwright/test";

import ruMessages from "../../../apps/ui/messages/ru.json" with { type: "json" };
import {
  openBlankWorkspace,
  openImportDialog,
  replaceWithSyntheticWorkspace,
  stabilizeForScreenshot,
  syntheticWorkspacePath,
} from "./helpers.js";

type ScreenshotScenario = {
  description: string;
  file: string;
  id: string;
  title: string;
};

const screenshotsDirectory = fileURLToPath(new URL("../../../docs/screenshots", import.meta.url));
const manifestPath = fileURLToPath(new URL("../../../docs/screenshot-demo.json", import.meta.url));
const screenshotManifest = JSON.parse(await readFile(manifestPath, "utf8")) as ScreenshotScenario[];
const scenariosById = new Map(screenshotManifest.map((scenario) => [scenario.id, scenario]));

function screenshotPath(id: string): string {
  const scenario = scenariosById.get(id);
  if (!scenario) throw new Error(`Unknown screenshot scenario: ${id}`);
  return `${screenshotsDirectory}/${scenario.file}`;
}

async function capture(page: Page, id: string) {
  await stabilizeForScreenshot(page);
  await page.screenshot({
    animations: "disabled",
    fullPage: true,
    path: screenshotPath(id),
  });
}

test.beforeAll(async () => {
  await mkdir(screenshotsDirectory, { recursive: true });
  for (const entry of await readdir(screenshotsDirectory, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith(".png")) {
      await unlink(`${screenshotsDirectory}/${entry.name}`);
    }
  }
});

test.afterAll(async () => {
  const generatedFiles = (await readdir(screenshotsDirectory))
    .filter((file) => file.endsWith(".png"))
    .sort();
  expect(generatedFiles).toEqual(screenshotManifest.map((scenario) => scenario.file).sort());
});

test("captures recognized workspace import", async ({ page }) => {
  await openBlankWorkspace(page);
  const dialog = await openImportDialog(page, syntheticWorkspacePath);
  await expect(dialog.getByText("Workspace state detected", { exact: true })).toBeVisible();
  await dialog.getByRole("radio", { name: "Teams + Employees", exact: true }).check();
  await expect(dialog.getByText("Import mode", { exact: true })).toBeVisible();
  await expect(dialog.getByText("Product", { exact: true })).toBeVisible();
  await expect(dialog.locator('[data-demo-id="structured-preview-employee-card"]')).toHaveCount(4);
  await capture(page, "import");
});

test("captures workspace export", async ({ page }) => {
  await openBlankWorkspace(page);
  await replaceWithSyntheticWorkspace(page);
  await page.getByRole("button", { name: "Export", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Export workspace" })).toBeVisible();
  await capture(page, "export");
});

test("captures dark theme selection", async ({ page }) => {
  await openBlankWorkspace(page);
  await replaceWithSyntheticWorkspace(page);
  await page.locator('[data-demo-id="sidebar-toggle"]').click();
  await expect(page.locator('[data-demo-id="app-sidebar"]')).toHaveAttribute(
    "data-collapsed",
    "false",
  );
  await page.locator('[data-demo-id="theme-toggle"]').click();
  await page.getByRole("option", { name: "Dark", exact: true }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.locator('[data-demo-id="theme-toggle"]').click();
  await expect(page.locator('[data-demo-id="theme-menu"]')).toBeVisible();
  await capture(page, "theme");
});

test("captures Russian language selection", async ({ page }) => {
  await openBlankWorkspace(page);
  await replaceWithSyntheticWorkspace(page);
  await page.locator('[data-demo-id="sidebar-toggle"]').click();
  await page.locator('[data-demo-id="language-toggle"]').click();
  await page.locator('[data-demo-id="language-menu"]').getByRole("option").first().click();
  await expect(page.locator('[data-demo-id="tab-units"]')).toHaveAttribute(
    "aria-label",
    ruMessages.Ui.Units,
  );
  await page.locator('[data-demo-id="language-toggle"]').click();
  await expect(page.locator('[data-demo-id="language-menu"]')).toBeVisible();
  await capture(page, "language");
});

test("captures populated Teams", async ({ page }) => {
  await openBlankWorkspace(page);
  await replaceWithSyntheticWorkspace(page);
  await page.getByRole("tab", { name: "Units", exact: true }).click();
  const productUnit = page
    .locator('[data-demo-id="unit-tree-item"]')
    .filter({ hasText: "Product" })
    .first();
  await productUnit.click();
  await expect(page.locator('[data-demo-id="units-selected-path"]')).toContainText("Product");
  await expect(page.locator('[data-demo-id="unit-employee-card"]').first()).toBeVisible();
  await capture(page, "teams");
});

test("captures populated Employees", async ({ page }) => {
  await openBlankWorkspace(page);
  await replaceWithSyntheticWorkspace(page);
  await page.getByRole("tab", { name: "Employees", exact: true }).click();
  await expect(page.locator('[data-demo-id="employees-list"]')).toContainText("Avery Stone");
  await capture(page, "employees");
});

test("captures populated Editor", async ({ page }) => {
  await openBlankWorkspace(page);
  await replaceWithSyntheticWorkspace(page);
  await expect(page.locator('[data-demo-id="org-editor-canvas"]')).toBeVisible();
  await expect(page.getByText("Platform", { exact: true }).first()).toBeVisible();
  await capture(page, "editor");
});

test("captures populated Analytics", async ({ page }) => {
  await openBlankWorkspace(page);
  await replaceWithSyntheticWorkspace(page);
  await page.getByRole("tab", { name: "Analytics", exact: true }).click();
  await expect(page.locator('[data-demo-id="analytics-tab"]')).toBeVisible();
  await capture(page, "analytics");
});

test("captures populated Calendar", async ({ page }) => {
  await openBlankWorkspace(page);
  await replaceWithSyntheticWorkspace(page);
  await page.getByRole("tab", { name: "Calendar", exact: true }).click();
  await expect(page.getByText("Employee Calendar", { exact: true })).toBeVisible();
  await expect(page.locator('[data-demo-id="dated-tag-cloud"]')).toBeVisible();
  await capture(page, "calendar");
});

test("captures configured data Download", async ({ page }) => {
  await openBlankWorkspace(page);
  await replaceWithSyntheticWorkspace(page);
  await page.getByRole("tab", { name: "Download", exact: true }).click();
  await page
    .getByRole("button", { name: "Add Unit Employees to download", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  const settings = page.locator('[data-demo-id="export-settings-dialog"]');
  await expect(settings).toBeVisible();
  await settings.getByRole("tab", { name: "Template", exact: true }).click();
  await expect(settings.locator('[data-demo-id="export-inline-preview"]')).toBeVisible();
  await settings.locator('[data-slot="dialog-body"]').evaluate((element) => {
    element.scrollTop = 100;
  });
  await capture(page, "download");
});
