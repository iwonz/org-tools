import { mkdir, readdir, readFile, unlink, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import type { OrgToolsState } from "@org-tools/types";
import type { Page } from "@playwright/test";
import sharp from "sharp";

import arMessages from "../../../apps/ui/messages/ar.json" with { type: "json" };
import { expect, test } from "./browser-test.js";
import {
  openBlankState,
  openImportDialog,
  replaceWithSyntheticState,
  stabilizeForScreenshot,
  syntheticStatePath,
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
const rasterNoisePixelBudget = 256;
const LONG_EXPORT_TAG = "Strategic Customer Experience Operations Enablement";
const LONG_EXPORT_TAG_ID = "90000000-0000-4000-8000-000000000099";

test.setTimeout(360_000);

function screenshotPath(id: string): string {
  const scenario = scenariosById.get(id);
  if (!scenario) throw new Error(`Unknown screenshot scenario: ${id}`);
  return `${screenshotsDirectory}/${scenario.file}`;
}

async function capture(page: Page, id: string) {
  await stabilizeForScreenshot(page);
  const screenshot = await page.screenshot({ animations: "disabled" });
  const path = screenshotPath(id);
  try {
    const existing = await readFile(path);
    const [existingPixels, candidatePixels] = await Promise.all([
      sharp(existing)
        .flatten({ background: "#ffffff" })
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true }),
      sharp(screenshot)
        .flatten({ background: "#ffffff" })
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true }),
    ]);
    if (
      existingPixels.info.width === candidatePixels.info.width &&
      existingPixels.info.height === candidatePixels.info.height &&
      existingPixels.info.channels === candidatePixels.info.channels
    ) {
      let changedPixels = 0;
      let rasterNoiseOnly = true;
      for (
        let offset = 0;
        offset < existingPixels.data.length;
        offset += existingPixels.info.channels
      ) {
        let pixelChanged = false;
        for (let channel = 0; channel < existingPixels.info.channels; channel += 1) {
          const existingChannel = existingPixels.data[offset + channel];
          const candidateChannel = candidatePixels.data[offset + channel];
          if (existingChannel === undefined || candidateChannel === undefined) {
            rasterNoiseOnly = false;
            break;
          }
          const delta = Math.abs(existingChannel - candidateChannel);
          if (delta > 2) {
            rasterNoiseOnly = false;
            break;
          }
          pixelChanged ||= delta > 0;
        }
        if (!rasterNoiseOnly) break;
        if (pixelChanged) {
          changedPixels += 1;
          if (changedPixels > rasterNoisePixelBudget) {
            rasterNoiseOnly = false;
            break;
          }
        }
      }
      if (rasterNoiseOnly) return;
    }
  } catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
  }
  await writeFile(path, screenshot);
}

async function openSyntheticState(page: Page) {
  await openBlankState(page);
  await replaceWithSyntheticState(page);
}

async function openSyntheticTab(page: Page, tab: string) {
  await openSyntheticState(page);
  await page.getByRole("tab", { name: tab, exact: true }).click();
}

async function replaceWithImageExportState(page: Page) {
  const state = JSON.parse(await readFile(syntheticStatePath, "utf8")) as OrgToolsState;
  const product = state.organization.structure.units.find((unit) => unit.name === "Product");
  const platform = state.organization.structure.units.find((unit) => unit.name === "Platform");
  const employee = state.organization.employees.find((candidate) =>
    product?.employeeIds.includes(candidate.id),
  );
  if (!product || !platform || !employee) {
    throw new Error("Synthetic image-export state is unavailable.");
  }
  state.organization.tags.push({ color: "rose", id: LONG_EXPORT_TAG_ID, label: LONG_EXPORT_TAG });
  employee.tags.push({ date: "2026-09-01", tagId: LONG_EXPORT_TAG_ID });
  platform.bossEmployeeId = null;
  platform.employeeIds = [];
  platform.employeePositions = [];
  platform.liveFilter = {
    birthday: null,
    customFields: [],
    includeWithoutTags: false,
    includeWithoutUnits: false,
    query: "",
    selectedGenders: [],
    selectedPositions: [],
    selectedTags: [],
    selectedUnitIds: [product.id],
  };
  const dialog = await openImportDialog(page, {
    buffer: Buffer.from(JSON.stringify(state)),
    mimeType: "application/json",
    name: "synthetic-image-export.json",
  });
  await dialog.getByRole("button", { name: "Replace state", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator('[data-demo-id="org-editor-canvas"]')).toBeVisible();
}

async function openEditorExport(page: Page) {
  await page.locator('fieldset[aria-label="Canvas Unit Product"]').click({
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
  const expectedFiles = new Set(screenshotManifest.map((scenario) => scenario.file));
  for (const entry of await readdir(screenshotsDirectory, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith(".png") && !expectedFiles.has(entry.name)) {
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

test("captures valid and invalid state imports", async ({ page }) => {
  await openBlankState(page);
  let dialog = await openImportDialog(page, syntheticStatePath);
  await expect(dialog.locator('[data-demo-id="state-import-summary"]')).toContainText(
    "4 Employees",
  );
  await capture(page, "import");

  await page.keyboard.press("Escape");
  dialog = await openImportDialog(page, {
    buffer: Buffer.from('[{"name":"Unsupported row"}]'),
    mimeType: "application/json",
    name: "invalid-state.json",
  });
  await expect(
    dialog.getByText("Only a complete Org Tools state can be imported.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(dialog.getByText("Choose another file", { exact: true })).toBeVisible();
  await capture(page, "import-invalid-state");

  await page.keyboard.press("Escape");
  await replaceWithSyntheticState(page);
  await page.getByRole("button", { name: "Import", exact: true }).click();
  dialog = page.getByRole("dialog", { name: "Import", exact: true });
  await dialog.getByRole("tab", { name: "Employees", exact: true }).click();
  let fileChooserPromise = page.waitForEvent("filechooser");
  await dialog.getByText("Choose file", { exact: true }).click();
  await (await fileChooserPromise).setFiles({
    buffer: Buffer.from(
      JSON.stringify([
        {
          contact: { email: "riley.brooks@example.test", phone: "+1 555-0120" },
          firstName: "Riley",
          id: "00000000-0000-4000-8000-000000000099",
          lastName: "Brooks",
          teams: [],
        },
      ]),
    ),
    mimeType: "application/json",
    name: "new-employees.json",
  });
  await expect(dialog.getByText("1 new", { exact: true })).toBeVisible();
  await capture(page, "employee-import-mapping");

  await page.keyboard.press("Escape");
  const state = JSON.parse(await readFile(syntheticStatePath, "utf8")) as OrgToolsState;
  const existingEmployee = state.organization.employees[0];
  if (!existingEmployee) throw new Error("Synthetic Employee is unavailable.");
  await page.getByRole("button", { name: "Import", exact: true }).click();
  dialog = page.getByRole("dialog", { name: "Import", exact: true });
  await dialog.getByRole("tab", { name: "Employees", exact: true }).click();
  fileChooserPromise = page.waitForEvent("filechooser");
  await dialog.getByText("Choose file", { exact: true }).click();
  await (await fileChooserPromise).setFiles({
    buffer: Buffer.from(
      JSON.stringify([
        {
          email: existingEmployee.email,
          firstName: existingEmployee.firstName,
          id: existingEmployee.id,
          lastName: existingEmployee.lastName,
          teams: [],
        },
      ]),
    ),
    mimeType: "application/json",
    name: "existing-employees.json",
  });
  await expect(dialog.getByText("1 existing", { exact: true })).toBeVisible();
  const reviewColumns = dialog.locator('[data-demo-id="employee-import-review-columns"]');
  await reviewColumns.scrollIntoViewIfNeeded();
  await expect(reviewColumns).toBeInViewport();
  await capture(page, "employee-import-duplicates");
});

test("captures direct state export", async ({ page }) => {
  await openSyntheticState(page);
  await page.locator('[data-demo-id="sidebar-toggle"]').click();
  const action = page.getByRole("button", { name: "Export", exact: true });
  await action.hover();
  await capture(page, "export");
  const downloadPromise = page.waitForEvent("download");
  await action.click();
  expect((await downloadPromise).suggestedFilename()).toBe("org-tools-state.json");
});

test("captures explicit database recovery", async ({ page }) => {
  await page.route("**/api/state", async (route) => {
    await route.fulfill({
      body: JSON.stringify({ error: { code: "database_unavailable" } }),
      contentType: "application/json",
      status: 200,
    });
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Create new", exact: true }).click();
  await expect(page.locator('[data-demo-id="database-create-new-dialog"]')).toBeVisible();
  await capture(page, "database-create-new");
});

test("captures both themes and multilingual language states", async ({ page }) => {
  await openSyntheticState(page);
  await page.locator('[data-demo-id="sidebar-toggle"]').click();
  await expect(page.locator('[data-demo-id="app-sidebar"]')).toHaveAttribute(
    "data-collapsed",
    "false",
  );
  await capture(page, "theme-light-shell");

  await page.locator('[data-demo-id="theme-toggle"]').click();
  await page.locator('[data-demo-id="theme-dialog"] label:has(input[value="dark"])').click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.locator('[data-demo-id="theme-toggle"]').click();
  await capture(page, "theme");

  await page.locator('[data-demo-id="theme-dialog"] label:has(input[value="light"])').click();
  await page.locator('[data-demo-id="language-toggle"]').click();
  await capture(page, "language");

  await page.locator('[data-demo-id="language-dialog"] label:has(input[value="ar"])').click();
  await expect(page.locator('[data-demo-id="tab-units"]')).toHaveAttribute(
    "aria-label",
    arMessages.Ui.Units,
  );
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await page.locator('[data-demo-id="language-toggle"]').click();
  await capture(page, "language-arabic-rtl");
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

  await page.locator('[data-demo-id="employee-model-button"]').click();
  let dialog = page.getByRole("dialog", { name: "Employee model", exact: true });
  await expect(dialog.getByText("Built-in fields", { exact: true })).toBeVisible();
  await capture(page, "employees-model");
  await dialog.getByRole("button", { name: /Department/u }).click();
  await dialog.locator('[data-slot="dialog-body"]').evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await expect(dialog.locator('[data-demo-id="employee-field-editor"]')).toBeVisible();
  await capture(page, "employees-model-value");
  await dialog
    .locator('[data-demo-id="employee-field-editor"]')
    .getByRole("button", { name: "Cancel", exact: true })
    .click();
  await dialog.getByRole("button", { name: /Directory key/u }).click();
  await dialog.locator('[data-slot="dialog-body"]').evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await capture(page, "employees-model-template");
  await dialog.getByRole("button", { name: "Close", exact: true }).first().click();

  await page.locator('[data-demo-id="employee-tags-button"]').click();
  dialog = page.getByRole("dialog", { name: "Tags", exact: true });
  await expect(dialog).toContainText("Design");
  await capture(page, "employees-tag-catalog");
  const firstTagRow = dialog.locator('[data-demo-id="tag-catalog-row"]').first();
  await firstTagRow.locator('[data-demo-id="tag-color-trigger"]').click();
  await expect(page.locator('[data-demo-id="tag-color-full-palette"]')).toBeVisible();
  await capture(page, "employees-tag-color");
  await page.keyboard.press("Escape");
  await dialog.getByRole("button", { name: "Edit tag", exact: true }).first().click();
  const tagEditor = page.getByRole("dialog", { name: "Edit tag", exact: true });
  await expect(tagEditor).toHaveAttribute("data-demo-id", "tag-catalog-editor");
  await capture(page, "employees-tag-editor");
  await tagEditor.getByRole("button", { name: "Cancel", exact: true }).click();
  await firstTagRow.locator('[data-demo-id="tag-catalog-view-employees"]').click();
  await expect(page.locator('[data-demo-id="tag-employees-list"]')).toBeVisible();
  await capture(page, "employees-tag-members");
  await page
    .getByRole("dialog", { name: /Employees with Tag/u })
    .getByRole("button", { name: "Close", exact: true })
    .first()
    .click();
  await dialog.getByRole("button", { name: "Close", exact: true }).first().click();

  await page.locator('[data-demo-id="employees-position-filter"]').click();
  const filters = page.locator('[data-demo-id="employees-position-popover"]');
  await filters.getByRole("button", { name: "Gender", exact: true }).click();
  await filters.getByRole("checkbox", { name: "Gender: Female", exact: true }).click();
  await capture(page, "employees-filters");

  await filters.getByRole("button", { name: "Department", exact: true }).click();
  await expect(filters.locator('[data-filter-options-list="Department"]')).toBeVisible();
  await capture(page, "employees-custom-filter");

  await filters.getByRole("button", { name: "Clear all", exact: true }).click();
  await page.keyboard.press("Escape");
  await page.locator('[data-demo-id="employee-edit-button"]').first().click();
  dialog = page.getByRole("dialog", { name: "Edit Employee" });
  await expect(dialog.getByRole("radio", { name: "Not specified", exact: true })).toBeVisible();
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
  await openSyntheticState(page);
  await expect(page.locator('[data-demo-id="org-editor-canvas"]')).toBeVisible();
  await capture(page, "editor");

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

  await replaceWithImageExportState(page);
  const dialog = await openEditorExport(page);
  await expect(dialog.locator('[data-demo-id="org-editor-export-image"]')).toBeVisible();
  await capture(page, "editor-image-export");
  await dialog.locator('[data-slot="dialog-body"]').evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await capture(page, "editor-image-settings");
  await dialog.getByRole("tab", { name: "Template", exact: true }).click();
  await capture(page, "editor-template-export");
  await dialog.getByRole("tab", { name: "JSON", exact: true }).click();
  await capture(page, "editor-json-export");
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
  await expect(page.locator('[data-demo-id="calendar-weekdays"]')).toBeVisible();
  await capture(page, "calendar");
  await page.locator('[data-calendar-date="2026-07-10"]').click();
  const dayDialog = page.getByRole("dialog", { name: /July 10, 2026/u });
  await expect(dayDialog).toBeVisible();
  await expect(dayDialog.locator('[data-demo-id="calendar-day-employee-card"]')).toBeVisible();
  await capture(page, "calendar-day-details");
  await page.keyboard.press("Escape");
  await page
    .locator('[data-demo-id="dated-tag-rail"]')
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
  await capture(page, "download-json-settings");
  const jsonSettings = settings.locator('[data-demo-id="structured-json-settings"]');
  await jsonSettings.getByRole("checkbox", { name: "Units", exact: true }).click();
  await jsonSettings.getByRole("checkbox", { name: "Tags", exact: true }).click();
  await settings.locator('[data-demo-id="json-units-exclusions"]').click();
  await page
    .locator('[data-demo-id="json-units-exclusions-popover"] [role="checkbox"]')
    .first()
    .click();
  await capture(page, "download-json-exclusions");
  await page.keyboard.press("Escape");
  await settingsBody.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await expect(settings.locator('[data-demo-id="export-inline-preview"]')).toBeVisible();
  await capture(page, "download-json-preview");
  await settingsBody.evaluate((element) => {
    element.scrollTop = 0;
  });
  await settings.getByRole("tab", { name: "Template", exact: true }).click();
  await expect(settings.locator('[data-demo-id="export-content-template-preview"]')).toBeVisible();
  await settingsBody.evaluate((element) => {
    element.scrollTop = 0;
  });
  const formatInput = settings.getByLabel("Format", { exact: true });
  await expect(formatInput).toHaveAttribute("placeholder", "Type @ to add tokens");
  await formatInput.fill("@full");
  await expect(settings.locator('[data-demo-id="template-token-suggestions"]')).toContainText(
    "{fullName}",
  );
  await settings.getByRole("button", { name: "Token suggestions help", exact: true }).hover();
  await expect(settings.getByRole("tooltip")).toBeVisible();
  await expect(settings.getByRole("tooltip")).toContainText("Type @ to open token suggestions.");
  await capture(page, "download-template-tokens");
  await formatInput.press("Enter");
  await settingsBody.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await capture(page, "download");
});
