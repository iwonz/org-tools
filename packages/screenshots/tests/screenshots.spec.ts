import { mkdir, readdir, readFile, unlink, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import type { Page } from "@playwright/test";
import sharp from "sharp";

import ruMessages from "../../../apps/ui/messages/ru.json" with { type: "json" };
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
const rasterNoisePixelBudget = 32;

test.setTimeout(60_000);

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

async function callMcp(
  page: Page,
  token: string,
  id: number,
  method: string,
  params: Record<string, unknown>,
) {
  const response = await page.request.post("/mcp", {
    data: { id, jsonrpc: "2.0", method, params },
    headers: {
      Accept: "application/json, text/event-stream",
      Authorization: `Bearer ${token}`,
    },
  });
  expect(response.status()).toBe(200);
  const text = await response.text();
  const data = response.headers()["content-type"]?.includes("text/event-stream")
    ? text
        .split("\n")
        .find((line) => line.startsWith("data: "))
        ?.slice("data: ".length)
    : text;
  if (!data) throw new Error("MCP response did not contain a JSON-RPC payload.");
  return JSON.parse(data) as {
    result?: { structuredContent?: Record<string, unknown> };
  };
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
  await expect(
    dialog.getByText(
      "Import replaces all organization data and interface settings in the current state.",
      {
        exact: true,
      },
    ),
  ).toBeVisible();
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
});

test("captures direct state export", async ({ page }) => {
  await openSyntheticState(page);
  await page.locator('[data-demo-id="sidebar-toggle"]').click();
  const action = page.getByRole("button", { name: "Export state", exact: true });
  await action.hover();
  await capture(page, "export");
  const downloadPromise = page.waitForEvent("download");
  await action.click();
  expect((await downloadPromise).suggestedFilename()).toBe("org-tools-state.json");
});

test("captures both themes and both language states", async ({ page }) => {
  await openSyntheticState(page);
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

test("captures MCP consent, credentials, setup, activity, and selective-undo conflict", async ({
  page,
}) => {
  await openSyntheticState(page);
  const origin = new URL(page.url()).origin;
  const disabled = await page.request.post("/api/mcp", {
    data: { action: "disable" },
    headers: { Origin: origin },
  });
  expect(disabled.ok()).toBe(true);
  await page.getByRole("button", { name: "MCP", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "MCP" });
  await expect(dialog.getByText("MCP is disabled", { exact: true })).toBeVisible();
  await capture(page, "mcp-disabled-consent");

  await dialog.getByRole("button", { name: "Enable MCP", exact: true }).click();
  await expect(dialog.locator('[data-demo-id="mcp-token"]')).toContainText("ot_mcp_");
  const configuration = dialog.locator('[data-demo-id="mcp-configuration"]');
  await expect(configuration).toContainText(/Bearer ot_mcp_[A-Za-z0-9_-]{43}/u);
  await configuration.locator("code").evaluate((element) => {
    element.textContent =
      element.textContent?.replace(
        /ot_mcp_[A-Za-z0-9_-]{43}/gu,
        "ot_mcp_synthetic_screenshot_token",
      ) ?? null;
  });
  await capture(page, "mcp-enabled-credentials");
  await dialog.getByRole("button", { name: "Pi", exact: true }).click();
  await expect(dialog.getByText("pi-codemcp", { exact: false })).toBeVisible();
  await expect(configuration).toContainText(/Bearer ot_mcp_[A-Za-z0-9_-]{43}/u);
  await configuration.locator("code").evaluate((element) => {
    element.textContent =
      element.textContent?.replace(
        /ot_mcp_[A-Za-z0-9_-]{43}/gu,
        "ot_mcp_synthetic_screenshot_token",
      ) ?? null;
  });
  await capture(page, "mcp-client-setup");

  await dialog.getByRole("button", { name: "Reveal", exact: true }).click();
  const tokenLocator = dialog.locator('[data-demo-id="mcp-token"]');
  await expect(tokenLocator).toHaveText(/^ot_mcp_[A-Za-z0-9_-]{43}$/u);
  const token = (await tokenLocator.textContent())?.trim() ?? "";
  const currentResponse = await page.request.get("/api/state");
  const current = (await currentResponse.json()) as {
    revision: number;
    state: { organization: { employees: Array<{ firstName: string; id: string }> } };
  };
  const employee = current.state.organization.employees[0];
  if (!employee) throw new Error("Synthetic MCP screenshot Employee is unavailable.");
  const preview = await callMcp(page, token, 1, "tools/call", {
    arguments: {
      expectedRevision: current.revision,
      operations: [
        {
          employeeId: employee.id,
          patch: { firstName: "Agent Avery" },
          type: "employee.update",
        },
      ],
      reason: "Prepare a product organization scenario",
    },
    name: "preview_change",
  });
  const previewId = preview.result?.structuredContent?.previewId;
  await callMcp(page, token, 2, "tools/call", {
    arguments: { previewId },
    name: "apply_change",
  });
  await dialog.getByRole("tab", { name: "Activity", exact: true }).click();
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: "MCP", exact: true }).click();
  await dialog.getByRole("tab", { name: "Activity", exact: true }).click();
  await expect(
    dialog.getByText("Prepare a product organization scenario", { exact: true }),
  ).toBeVisible();
  await capture(page, "mcp-applied-activity");

  const afterApplyResponse = await page.request.get("/api/state");
  const afterApply = (await afterApplyResponse.json()) as {
    revision: number;
    state: { organization: { employees: Array<{ firstName: string; id: string }> } };
  };
  const changedEmployee = afterApply.state.organization.employees.find(
    (candidate) => candidate.id === employee.id,
  );
  if (!changedEmployee) throw new Error("Changed MCP screenshot Employee is unavailable.");
  changedEmployee.firstName = "Local Avery";
  const localWrite = await page.request.put("/api/state", {
    data: { expectedRevision: afterApply.revision, scope: "all", state: afterApply.state },
    headers: { Origin: origin },
  });
  expect(localWrite.ok()).toBe(true);
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: "MCP", exact: true }).click();
  await dialog.getByRole("tab", { name: "Activity", exact: true }).click();
  await dialog.getByRole("button", { name: "Undo", exact: true }).first().click();
  const undoDialog = page.getByRole("alertdialog", { name: "Undo this agent change?" });
  await undoDialog.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(dialog.locator('[data-demo-id="mcp-undo-conflict"]')).toBeVisible();
  await capture(page, "mcp-selective-undo-conflict");
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
  await openSyntheticState(page);
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
  await capture(page, "download");
});
