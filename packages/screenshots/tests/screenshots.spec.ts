import { mkdir, readdir, readFile, unlink } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { expect, type Page, test } from "@playwright/test";

import ruMessages from "../../../apps/ui/messages/ru.json" with { type: "json" };
import {
  openBlankWorkspace,
  openImportDialog,
  replaceWithSyntheticWorkspace,
  stabilizeForScreenshot,
  syntheticEmployeesJsonPath,
  syntheticWorkspacePath,
} from "./helpers.js";

type ScreenshotScenario = {
  capabilities: string[];
  description: string;
  featured: boolean;
  file: string;
  id: string;
  module: string;
  title: string;
};

const screenshotsDirectory = fileURLToPath(new URL("../../../docs/screenshots", import.meta.url));
const manifestPath = fileURLToPath(new URL("../../../docs/screenshot-demo.json", import.meta.url));
const screenshotManifest = JSON.parse(await readFile(manifestPath, "utf8")) as ScreenshotScenario[];
const scenariosById = new Map(screenshotManifest.map((scenario) => [scenario.id, scenario]));

test.setTimeout(60_000);

function screenshotPath(id: string): string {
  const scenario = scenariosById.get(id);
  if (!scenario) throw new Error(`Unknown screenshot scenario: ${id}`);
  return `${screenshotsDirectory}/${scenario.file}`;
}

async function capture(page: Page, id: string) {
  await stabilizeForScreenshot(page);
  await page.screenshot({ animations: "disabled", fullPage: true, path: screenshotPath(id) });
}

async function openSyntheticWorkspace(page: Page) {
  await openBlankWorkspace(page);
  await replaceWithSyntheticWorkspace(page);
}

async function openSyntheticTab(page: Page, tab: string) {
  await openSyntheticWorkspace(page);
  await page.getByRole("tab", { name: tab, exact: true }).click();
}

async function openEditorExport(page: Page) {
  await page.locator('fieldset[aria-label="Canvas Unit Platform"]').click({
    button: "right",
    position: { x: 20, y: 20 },
  });
  await page.locator('[data-demo-id="org-editor-export-action"]').click();
  const dialog = page.getByRole("dialog", { name: "Export" });
  await expect(dialog).toBeVisible();
  return dialog;
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

test("captures recognized and ordinary import workflows", async ({ page }) => {
  await openBlankWorkspace(page);
  let dialog = await openImportDialog(page, syntheticWorkspacePath);
  await expect(dialog.getByText("Workspace state detected", { exact: true })).toBeVisible();
  await dialog.getByRole("radio", { name: "Teams + Employees", exact: true }).check();
  await expect(dialog.getByText("Import mode", { exact: true })).toBeVisible();
  await expect(dialog.locator('[data-demo-id="structured-preview-employee-card"]')).toHaveCount(4);
  await capture(page, "import");

  await page.keyboard.press("Escape");
  dialog = await openImportDialog(page, syntheticWorkspacePath);
  await expect(dialog.getByRole("radio", { name: "Full workspace", exact: true })).toBeChecked();
  await expect(
    dialog.getByText("Full workspace import replaces all current data and interface state.", {
      exact: true,
    }),
  ).toBeVisible();
  await capture(page, "import-full-replacement");

  await page.keyboard.press("Escape");
  dialog = await openImportDialog(page, syntheticEmployeesJsonPath);
  await expect(dialog.getByText("Field mapping", { exact: true })).toBeVisible();
  await expect(dialog.getByText("2 new", { exact: true })).toBeVisible();
  const body = dialog.locator('[data-slot="dialog-body"]');
  await body.evaluate((element) => {
    element.scrollTop = 90;
  });
  await capture(page, "import-json-mapping");
  await body.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await expect(dialog.getByText("Normalized preview", { exact: true })).toBeVisible();
  await expect(dialog.locator('[data-demo-id="ordinary-import-preview-row"]')).toHaveCount(2);
  await capture(page, "import-json-preview");
});

test("captures every workspace export scope", async ({ page }) => {
  await openSyntheticWorkspace(page);
  await page.getByRole("button", { name: "Export", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Export workspace" });
  await expect(dialog).toBeVisible();
  await capture(page, "export");
  await dialog.locator('input[value="teamsEmployees"]').check();
  await capture(page, "export-partial-scope");
});

test("captures both themes and both language states", async ({ page }) => {
  await openSyntheticWorkspace(page);
  await page.locator('[data-demo-id="sidebar-toggle"]').click();
  await expect(page.locator('[data-demo-id="app-sidebar"]')).toHaveAttribute(
    "data-collapsed",
    "false",
  );
  await capture(page, "theme-light-shell");

  await page.locator('[data-demo-id="theme-toggle"]').click();
  await page.getByRole("option", { name: "Dark", exact: true }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.locator('[data-demo-id="theme-toggle"]').click();
  await capture(page, "theme");

  await page.getByRole("option", { name: "Light", exact: true }).click();
  await page.locator('[data-demo-id="language-toggle"]').click();
  await capture(page, "language-english-menu");

  await page.locator('[data-demo-id="language-menu"]').getByRole("option").first().click();
  await expect(page.locator('[data-demo-id="tab-units"]')).toHaveAttribute(
    "aria-label",
    ruMessages.Ui.Units,
  );
  await page.locator('[data-demo-id="language-toggle"]').click();
  await capture(page, "language");
});

test("captures Team browsing, creation, Live rules, and editing", async ({ page }) => {
  await openSyntheticTab(page, "Units");
  let productUnit = page
    .locator('[data-demo-id="unit-tree-item"]')
    .filter({ hasText: "Product" })
    .first();
  await productUnit.click();
  await expect(page.locator('[data-demo-id="unit-employee-card"]').first()).toBeVisible();
  await capture(page, "teams");

  await page.locator('[data-demo-id="unit-create-root-button"]').click();
  let dialog = page.getByRole("dialog", { name: "Add Unit" });
  await expect(dialog.locator('[data-demo-id="unit-manual-picker"]')).toBeVisible();
  await dialog.getByLabel("Name", { exact: true }).fill("Customer Success");
  await capture(page, "teams-create-manual");

  await dialog.getByRole("tab", { name: "Live", exact: true }).click();
  await expect(dialog.locator('[data-demo-id="live-unit-preview"]')).toBeVisible();
  await dialog.locator('[data-demo-id="live-unit-filter-button"]').click();
  const liveFilters = page.locator('[data-demo-id="live-unit-filter-popover"]');
  await liveFilters.getByRole("button", { name: "Tags", exact: true }).click();
  await capture(page, "teams-create-live");

  await page.keyboard.press("Escape");
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  productUnit = page
    .locator('[data-demo-id="unit-tree-item"]')
    .filter({ hasText: "Product" })
    .first();
  await productUnit.locator('[data-demo-id="unit-edit-button"]').click();
  dialog = page.getByRole("dialog", { name: "Edit Unit" });
  await expect(dialog.locator('[data-demo-id="unit-member-position"]').first()).toBeVisible();
  await capture(page, "teams-edit");
});

test("captures the complete Employee workflow", async ({ page }) => {
  await openSyntheticTab(page, "Employees");
  await expect(page.locator('[data-demo-id="employees-list"]')).toContainText("Avery Stone");
  await capture(page, "employees");

  await page.locator('[data-demo-id="employees-position-filter"]').click();
  const filters = page.locator('[data-demo-id="employees-position-popover"]');
  await filters.getByRole("button", { name: "Gender", exact: true }).click();
  await filters.getByRole("checkbox", { name: "Gender: Female", exact: true }).click();
  await capture(page, "employees-filters");

  await filters.getByRole("button", { name: "Clear all", exact: true }).click();
  await page.keyboard.press("Escape");
  await page.locator('[data-demo-id="employee-edit-button"]').first().click();
  let dialog = page.getByRole("dialog", { name: "Edit Employee" });
  await expect(dialog.getByRole("combobox", { name: "Gender", exact: true })).toBeVisible();
  await capture(page, "employees-form");
  await dialog.locator('[data-slot="dialog-body"]').evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await expect(dialog.getByText("Boss", { exact: true }).first()).toBeVisible();
  await capture(page, "employees-form-assignments");
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();

  await page.locator('[data-demo-id="employees-tag-picker-trigger"]').first().click();
  await page.getByRole("button", { name: "Date for tag Remote" }).click();
  await expect(
    page.locator('[data-demo-id="tag-date-calendar"] [data-day="2026-08-12"]'),
  ).toHaveAttribute("data-selected", "true");
  await capture(page, "employees-tag-date");

  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await page.locator('[data-demo-id="employee-create-button"]').click();
  dialog = page.getByRole("dialog", { name: "Create Employee" });
  const syntheticAvatarDataUrl = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 960;
    canvas.height = 640;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Synthetic avatar canvas is unavailable.");
    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#0f172a");
    gradient.addColorStop(0.5, "#2563eb");
    gradient.addColorStop(1, "#38bdf8");
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "rgba(255, 255, 255, 0.85)";
    context.beginPath();
    context.arc(480, 260, 150, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "rgba(15, 23, 42, 0.72)";
    context.beginPath();
    context.arc(480, 760, 340, 0, Math.PI * 2);
    context.fill();
    return canvas.toDataURL("image/png");
  });
  await dialog.getByLabel("Choose file", { exact: true }).setInputFiles({
    buffer: Buffer.from(syntheticAvatarDataUrl.split(",")[1] ?? "", "base64"),
    mimeType: "image/png",
    name: "synthetic-avatar.png",
  });
  await expect(page.getByRole("dialog", { name: "Crop avatar" })).toBeVisible();
  await capture(page, "employees-avatar-crop");
});

test("captures Editor navigation, commands, and export tooling", async ({ page }) => {
  await openSyntheticWorkspace(page);
  await expect(page.locator('[data-demo-id="org-editor-canvas"]')).toBeVisible();
  await capture(page, "editor");

  await page.locator('[data-demo-id="org-view-create-button"]').click();
  let dialog = page.getByRole("dialog", { name: "New View" });
  await expect(dialog.locator('[data-demo-id="org-view-source-switcher"]')).toBeVisible();
  await capture(page, "editor-views");
  await dialog.getByRole("button", { name: "Create", exact: true }).click();
  await page.getByRole("combobox", { name: "Active View", exact: true }).click();
  await expect(page.getByRole("option", { name: "View 1", exact: true })).toBeVisible();
  await capture(page, "editor-view-management");
  await page.keyboard.press("Escape");

  await page.locator('[data-demo-id="org-editor-search-button"]').click();
  await page.locator('[data-demo-id="org-editor-search-input"]').fill("Avery");
  await expect(page.locator('[data-demo-id="org-editor-search-results"]')).toContainText(
    "Avery Stone",
  );
  await capture(page, "editor-search");
  await page.locator('[data-demo-id="org-editor-search-button"]').click();

  const platform = page.locator('fieldset[aria-label="Canvas Unit Platform"]');
  await platform.click({ button: "right", position: { x: 20, y: 20 } });
  await expect(page.locator("[data-org-editor-context-menu]")).toBeVisible();
  await capture(page, "editor-unit-commands");
  await page.keyboard.press("Escape");

  const productUnit = page.locator('fieldset[aria-label="Canvas Unit Product"]');
  const rows = productUnit.locator("[data-org-editor-employee-row]");
  await rows.nth(0).click();
  await rows.nth(1).click({ modifiers: ["Control"] });
  await rows.nth(1).click({ button: "right" });
  await expect(page.locator("[data-org-editor-context-menu]")).toBeVisible();
  await capture(page, "editor-bulk-employees");
  await page.keyboard.press("Escape");

  dialog = await openEditorExport(page);
  await expect(dialog.locator('[data-demo-id="org-editor-export-image"]')).toBeVisible();
  await capture(page, "editor-image-export");
  await dialog.locator('[data-slot="dialog-body"]').evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await capture(page, "editor-image-settings");
  await dialog.getByRole("tab", { name: "Template", exact: true }).click();
  await capture(page, "editor-template-export");
});

test("captures Analytics overview, lower groups, and drill-down", async ({ page }) => {
  await openSyntheticTab(page, "Analytics");
  await expect(page.locator('[data-demo-id="analytics-positions"]')).toBeVisible();
  await capture(page, "analytics");
  const scrollArea = page.locator('[data-demo-id="analytics-scroll-area"]');
  await scrollArea.evaluate((element) => {
    const lastNames = element.querySelector('[data-demo-id="analytics-last-names"]');
    if (!(lastNames instanceof HTMLElement)) throw new Error("Last-name group is unavailable.");
    element.scrollTop +=
      lastNames.getBoundingClientRect().top - element.getBoundingClientRect().top;
  });
  await expect(page.locator('[data-demo-id="analytics-full-name-duplicates"]')).toBeVisible();
  await capture(page, "analytics-complete-groups");
  await scrollArea.evaluate((element) => {
    element.scrollTop = 0;
  });
  await page.locator('[data-demo-id="analytics-positions-view-button"]').first().click();
  await expect(page.locator('[data-demo-id="analytics-employees-dialog"]')).toBeVisible();
  await capture(page, "analytics-drilldown");
});

test("captures Calendar overview, day details, and dated-tag history", async ({ page }) => {
  await openSyntheticTab(page, "Calendar");
  await expect(page.getByText("Employee Calendar", { exact: true })).toBeVisible();
  await capture(page, "calendar");
  await page.locator('[data-calendar-date="2026-07-22"]').click();
  await expect(page.getByRole("dialog", { name: /July 22, 2026/u })).toBeVisible();
  await capture(page, "calendar-day-details");
  await page.keyboard.press("Escape");
  await page
    .locator('[data-demo-id="dated-tag-cloud"]')
    .getByRole("button", { name: /Operations/u })
    .click();
  await expect(page.getByRole("dialog", { name: "Operations" })).toBeVisible();
  await capture(page, "calendar-tag-events");
});

test("captures source selection and every data Download format", async ({ page }) => {
  await openSyntheticTab(page, "Download");
  await page
    .getByRole("button", { name: "Add Unit Employees to download", exact: true })
    .first()
    .click();
  await capture(page, "download-source-selection");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  const settings = page.locator('[data-demo-id="export-settings-dialog"]');
  await expect(settings).toBeVisible();
  const settingsBody = settings.locator('[data-slot="dialog-body"]');
  await capture(page, "download-csv-settings");
  await settingsBody.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await expect(settings.locator('[data-demo-id="export-inline-preview"]')).toBeVisible();
  await capture(page, "download-csv-preview");
  await settingsBody.evaluate((element) => {
    element.scrollTop = 0;
  });
  await settings.getByRole("tab", { name: "JSON", exact: true }).click();
  await capture(page, "download-json-settings");
  await settingsBody.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await capture(page, "download-json-preview");
  await settingsBody.evaluate((element) => {
    element.scrollTop = 0;
  });
  await settings.getByRole("tab", { name: "Template", exact: true }).click();
  await expect(settings.locator('[data-demo-id="export-inline-preview"]')).toBeVisible();
  await settingsBody.evaluate((element) => {
    element.scrollTop = 8;
  });
  await capture(page, "download");
});
