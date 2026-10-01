import { mkdir, readdir, readFile, unlink, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import type { OrgToolsState } from "@org-tools/types";
import type { Page } from "@playwright/test";
import sharp from "sharp";

import arMessages from "../../../apps/ui/messages/ar.json" with { type: "json" };
import { expect, test } from "./browser-test.js";
import {
  createDistributionStateFile,
  openBlankState,
  replaceStateFromFile,
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
const rasterNoiseMaxChannelDelta = 3;
const LONG_EXPORT_TAG = "Strategic Customer Experience Operations Enablement";
const LONG_EXPORT_TAG_ID = "90000000-0000-4000-8000-000000000099";

test.setTimeout(360_000);

function screenshotPath(id: string): string {
  const scenario = scenariosById.get(id);
  if (!scenario) throw new Error(`Unknown screenshot scenario: ${id}`);
  return `${screenshotsDirectory}/${scenario.file}`;
}

async function capture(page: Page, id: string, options: { stabilized?: boolean } = {}) {
  if (!options.stabilized) await stabilizeForScreenshot(page);
  const rasterNoiseRegions = await page
    .locator("[data-screenshot-raster-noise]")
    .evaluateAll((elements) =>
      elements.map((element) => {
        const bounds = element.getBoundingClientRect();
        return {
          bottom: Math.ceil(bounds.bottom),
          left: Math.floor(bounds.left),
          right: Math.ceil(bounds.right),
          top: Math.floor(bounds.top),
        };
      }),
    );
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
        let hasLargeDelta = false;
        for (let channel = 0; channel < existingPixels.info.channels; channel += 1) {
          const existingChannel = existingPixels.data[offset + channel];
          const candidateChannel = candidatePixels.data[offset + channel];
          if (existingChannel === undefined || candidateChannel === undefined) {
            rasterNoiseOnly = false;
            break;
          }
          const delta = Math.abs(existingChannel - candidateChannel);
          hasLargeDelta ||= delta > rasterNoiseMaxChannelDelta;
          pixelChanged ||= delta > 0;
        }
        if (!rasterNoiseOnly) break;
        if (pixelChanged) {
          if (hasLargeDelta) {
            const pixelIndex = offset / existingPixels.info.channels;
            const x = pixelIndex % existingPixels.info.width;
            const y = Math.floor(pixelIndex / existingPixels.info.width);
            if (
              !rasterNoiseRegions.some(
                (region) =>
                  x >= region.left && x < region.right && y >= region.top && y < region.bottom,
              )
            ) {
              rasterNoiseOnly = false;
              break;
            }
          }
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
  const systemView = state.organization.views.find((view) => view.kind === "system");
  const units = systemView?.structure.units;
  const product = units?.find((unit) => unit.name === "Product");
  const platform = units?.find((unit) => unit.name === "Platform");
  const employee = state.organization.employees.find((candidate) =>
    product?.employeeIds.includes(candidate.id),
  );
  if (!systemView || !product || !platform || !employee) {
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
    selectedTags: [LONG_EXPORT_TAG_ID],
    selectedUnitIds: [product.id],
  };
  const editorUi = state.ui.editor.views.find((view) => view.viewId === systemView.id);
  if (!editorUi) throw new Error("Synthetic image-export Editor UI is unavailable.");
  editorUi.distributionModeUnitIds = [product.id];
  await replaceStateFromFile(page, {
    buffer: Buffer.from(JSON.stringify(state)),
    mimeType: "application/json",
    name: "synthetic-image-export.json",
  });
  await page.reload({ waitUntil: "domcontentloaded" });
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

test("captures sign-in and Administration", async ({ page }) => {
  await page.route("**/api/session", (route) =>
    route.fulfill({
      body: JSON.stringify({ error: { code: "unauthenticated" } }),
      contentType: "application/json",
      status: 401,
    }),
  );
  await page.route("**/api/auth/status", (route) =>
    route.fulfill({ body: JSON.stringify({ kind: "login" }), contentType: "application/json" }),
  );
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-demo-id="login-form"]')).toBeVisible();
  await capture(page, "authentication-login");

  await page.unroute("**/api/session");
  await page.unroute("**/api/auth/status");
  await openSyntheticState(page);
  const adminResponse = await page.request.get("/api/admin");
  expect(adminResponse.ok()).toBe(true);
  const deterministicAdminData = (await adminResponse.json()) as {
    audit: Array<Record<string, unknown>>;
    [key: string]: unknown;
  };
  deterministicAdminData.audit = [
    {
      action: "organization.replace",
      actor_account_id: null,
      correlation_id: "00000000-0000-4000-8000-000000000001",
      created_at: "2026-07-31T12:00:00.000Z",
      id: "00000000-0000-4000-8000-000000000002",
      result: "success",
    },
  ];
  await page.route("**/api/admin", async (route) => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }
    await route.fulfill({
      body: JSON.stringify(deterministicAdminData),
      contentType: "application/json",
    });
  });
  await page.getByRole("tab", { name: "Administration", exact: true }).click();
  const administration = page.locator('[data-demo-id="administration-tab"]');
  await expect(administration).toBeVisible();
  await capture(page, "administration-users");

  await administration.getByRole("tab", { name: "Roles", exact: true }).click();
  await capture(page, "administration-roles");
  await administration.getByRole("tab", { name: "Access", exact: true }).click();
  await capture(page, "administration-access");
  await administration.getByRole("tab", { name: "Audit", exact: true }).click();
  await capture(page, "administration-audit");
  await administration.getByRole("tab", { name: "Backup and Restore", exact: true }).click();
  await capture(page, "administration-backup");
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
  await page.reload({ waitUntil: "domcontentloaded" });
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
  await dialog.getByRole("tab", { name: "Display", exact: true }).click();
  await expect(dialog.locator('[data-demo-id="employee-display-employees"]')).toBeVisible();
  const displayFormat = dialog.locator("#employee-display-employees-format");
  await displayFormat.fill("**{fullName}** · {tags}\n{positions}");
  await displayFormat.evaluate((element) => {
    const textarea = element as HTMLTextAreaElement;
    textarea.focus();
    textarea.setSelectionRange(2, 11);
  });
  await displayFormat.press("Shift+ArrowRight");
  await expect(dialog.locator('[data-demo-id="template-markdown-tools"]')).toBeVisible();
  await capture(page, "employees-model");
  await dialog.getByRole("tab", { name: "Model", exact: true }).click();
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
  await filters.getByRole("button", { name: "Tags", exact: true }).click();
  await filters.locator('[data-demo-id="employee-tag-filter-select-all"]').click();
  await capture(page, "employees-filters");

  await filters.getByRole("button", { name: "Clear all", exact: true }).click();
  await filters.getByRole("button", { name: "Department", exact: true }).click();
  await expect(filters.locator('[data-filter-options-list="Department"]')).toBeVisible();
  await capture(page, "employees-custom-filter");

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
  const selectedAnnotation = page.locator(
    '[data-canvas-element-id="dddddddd-dddd-4ddd-8ddd-dddddddddddd"]',
  );
  await selectedAnnotation.click({ button: "right" });
  await expect(page.locator('[data-demo-id="org-editor-canvas-properties"]')).toBeVisible();
  await expect(
    page
      .locator("[data-org-editor-context-menu]")
      .getByRole("menuitem", { name: "Send to back", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .locator("[data-org-editor-context-menu]")
      .getByRole("menuitem", { name: "Behind Units", exact: true }),
  ).toHaveCount(0);
  await page
    .locator("[data-org-editor-context-menu]")
    .getByRole("menuitem", { name: "Send to back", exact: true })
    .hover();
  await page.keyboard.press("Escape");
  const textAnnotation = page.locator(
    '[data-canvas-element-id="ffffffff-ffff-4fff-8fff-ffffffffffff"]',
  );
  await textAnnotation.click();
  await expect(
    textAnnotation.locator('[data-canvas-transform-handle="corner-resize"]'),
  ).toHaveCount(4);
  await expect(page.locator("[data-canvas-sticker-paper]")).toBeVisible();
  await expect(page.locator("[data-canvas-sticker-fold]")).toHaveCount(0);
  await expect(page.locator('[data-demo-id="org-editor-view-image-export-action"]')).toHaveCSS(
    "font-weight",
    "400",
  );
  await page.mouse.move(1000, 760);
  await capture(page, "editor");
  await page.keyboard.press("Escape");

  const productNoteUnit = page.locator('fieldset[aria-label="Canvas Unit Product"]');
  await productNoteUnit.hover();
  await page.locator('[data-demo-id="org-editor-view-settings"]').click();
  await expect(page.getByRole("switch", { name: "Group by tag", exact: true })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await capture(page, "editor-view-settings");
  await page.keyboard.press("Escape");
  await productNoteUnit.hover();
  await productNoteUnit.locator('[data-demo-id="unit-note-action"]').click();
  const noteDialog = page.getByRole("dialog", { name: "Note for Product", exact: true });
  await noteDialog.getByRole("tab", { name: "Editor", exact: true }).click();
  await noteDialog
    .getByLabel("Markdown editor", { exact: true })
    .fill(
      "# Product responsibilities\n\n- Own the product roadmap\n- Coordinate discovery and delivery\n\n| Decision | Owner |\n| --- | --- |\n| Quarterly priorities | Product lead |",
    );
  await noteDialog.getByRole("tab", { name: "Preview", exact: true }).click();
  await capture(page, "editor-unit-note-preview");
  await noteDialog.getByRole("tab", { name: "Editor", exact: true }).click();
  await capture(page, "editor-unit-note-editor");
  await noteDialog.getByRole("button", { name: "Save", exact: true }).click();

  const viewSelect = page.locator('[data-demo-id="org-editor-view-select"]');
  await page.locator('[data-demo-id="org-editor-create-view"]').click();
  let viewDialog = page.getByRole("dialog", { name: "Create View", exact: true });
  await viewDialog.getByLabel("View name", { exact: true }).fill("Growth scenario");
  await viewDialog.getByLabel("View source", { exact: true }).click();
  await page.getByRole("option", { name: "Copy a View", exact: true }).click();
  await capture(page, "editor-view-create-copy");
  await viewDialog.getByRole("button", { name: "Create", exact: true }).click();
  const scenarioProduct = page.locator('fieldset[aria-label="Canvas Unit Product"]');
  await scenarioProduct.click({ button: "right", position: { x: 20, y: 20 } });
  await page.locator('[data-demo-id="org-editor-edit-unit-action"]').click();
  const unitDialog = page.getByRole("dialog", { name: "Edit Unit", exact: true });
  await unitDialog.getByLabel("Name", { exact: true }).fill("Future Product");
  await unitDialog.getByRole("button", { name: "Save", exact: true }).click();
  const futureProduct = page.locator('fieldset[aria-label="Canvas Unit Future Product"]');
  await expect(futureProduct).toBeVisible();
  await stabilizeForScreenshot(page);
  await expect(page.getByRole("button", { name: "Undo", exact: true })).toBeEnabled();
  await capture(page, "editor-view-isolated", { stabilized: true });

  await futureProduct.click({ position: { x: 80, y: 54 } });
  await page.keyboard.press("Control+c");
  await viewSelect.click();
  await page.getByRole("option", { name: "Units", exact: true }).click();
  await page.keyboard.press("Control+v");
  await expect(futureProduct).toBeVisible();
  await viewSelect.click();
  await capture(page, "editor-view-selector");
  await page.keyboard.press("Escape");
  await page.keyboard.press("Control+z");
  await viewSelect.click();
  await page.getByRole("option", { name: "Growth scenario", exact: true }).click();

  const renameView = page.locator('[data-demo-id="org-editor-rename-view"]');
  await expect(viewSelect).toContainText("Growth scenario");
  await expect(renameView).toBeEnabled();
  await renameView.click();
  viewDialog = page.getByRole("dialog", { name: "Rename View", exact: true });
  await capture(page, "editor-view-manage");
  await viewDialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.locator('[data-demo-id="org-editor-delete-view"]').click();
  viewDialog = page.getByRole("dialog", { name: "Delete View", exact: true });
  await viewDialog.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(viewSelect).toContainText("Units");

  await page.locator('[data-demo-id="org-editor-search-button"]').click();
  await page.locator('[data-demo-id="org-editor-search-input"]').fill("Avery");
  await expect(page.locator('[data-demo-id="org-editor-search-results"]')).toContainText(
    "Avery Stone",
  );
  await capture(page, "editor-search");
  await page.locator('[data-demo-id="org-editor-search-button"]').click();

  const platform = page.locator('[data-org-editor-unit-id="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"]');
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

  await replaceStateFromFile(page, await createDistributionStateFile());
  await page.reload({ waitUntil: "domcontentloaded" });
  const distributionProduct = page.locator('fieldset[aria-label="Canvas Unit Product"]');
  await distributionProduct.click({ button: "right", position: { x: 20, y: 20 } });
  await page.locator('[data-demo-id="org-editor-distribution-mode-action"]').click();
  await page.locator('[data-demo-id="org-editor-distribution-selected-action"]').click();
  await expect(distributionProduct.locator('[data-distribution-status="assigned"]')).toBeVisible();
  await expect(
    distributionProduct.locator('[data-distribution-status="sourceOnly"]'),
  ).toBeVisible();
  await capture(page, "editor-distribution-status");
  const distributionPlatform = page.locator('fieldset[aria-label="Canvas Unit Platform"]');
  await distributionProduct.click({ position: { x: 40, y: 40 } });
  await distributionPlatform.click({ modifiers: ["Control"], position: { x: 40, y: 40 } });
  await distributionProduct.click({ button: "right", position: { x: 40, y: 40 } });
  await page.locator('[data-demo-id="org-editor-distribution-mode-action"]').click();
  await expect(
    page.locator('[data-demo-id="org-editor-distribution-selected-action"]'),
  ).toHaveAttribute("aria-checked", "mixed");
  await stabilizeForScreenshot(page);
  await page.locator('[data-demo-id="org-editor-distribution-mode-action"]').click();
  await expect(
    page.locator('[data-demo-id="org-editor-distribution-selected-action"]'),
  ).toHaveAttribute("aria-checked", "mixed");
  await capture(page, "editor-distribution-bulk", { stabilized: true });
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  const distributionSharedRow = distributionProduct.locator(
    '[data-org-editor-employee-id="10000000-0000-4000-8000-000000000001"]',
  );
  await distributionSharedRow
    .locator("..")
    .locator('[data-demo-id="org-editor-employee-placements-action"]')
    .click();
  await expect(page.locator('[data-demo-id="employee-placement-dialog"]')).toBeVisible();
  await capture(page, "editor-placement-map");
  await page
    .locator('[data-demo-id="employee-placement-dialog"]')
    .getByRole("button", { name: "Close", exact: true })
    .click();
  await distributionSharedRow.click();
  await expect(page.locator("[data-distribution-connection] circle")).toBeVisible();
  await capture(page, "editor-distribution-connections");

  await replaceWithImageExportState(page);
  await page.locator('[data-demo-id="org-editor-view-image-export-action"]').click();
  const viewImageDialog = page.locator('[data-demo-id="org-editor-view-image-export-dialog"]');
  await expect(viewImageDialog).toBeVisible();
  await expect(viewImageDialog.getByAltText("View export preview", { exact: true })).toBeVisible();
  await expect(
    viewImageDialog.locator('[data-demo-id="org-editor-view-image-dimensions"]'),
  ).toHaveCount(0);
  await capture(page, "editor-image-export");
  await viewImageDialog.locator('[data-slot="dialog-body"]').evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await viewImageDialog
    .getByRole("button", { name: "Token suggestions help", exact: true })
    .hover();
  await expect(viewImageDialog.getByRole("tooltip")).toContainText("condition ?");
  await capture(page, "editor-image-settings");
  await page.keyboard.press("Escape");
  const dialog = await openEditorExport(page);
  await dialog.getByRole("tab", { name: "Template", exact: true }).click();
  await dialog.getByLabel("Format", { exact: true }).fill("{fullName}\n{fullName}\n\n");
  await dialog.getByRole("checkbox", { name: "Keep only unique values", exact: true }).click();
  await dialog.getByRole("checkbox", { name: "Remove empty lines", exact: true }).click();
  await dialog.getByRole("tab", { name: "Template", exact: true }).focus();
  await capture(page, "editor-template-export");
  await dialog.getByRole("tab", { name: "JSON", exact: true }).click();
  await capture(page, "editor-json-export");
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
  await formatInput.fill("{fullName}\n\n");
  await settings.getByRole("checkbox", { name: "Remove empty lines", exact: true }).click();
  await settingsBody.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await capture(page, "download");
});
