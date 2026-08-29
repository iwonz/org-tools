import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { expect, test } from "@playwright/test";

import {
  openBlankWorkspace,
  openImportDialog,
  replaceWithSyntheticWorkspace,
  stabilizeForScreenshot,
  syntheticEmployeesJsonPath,
  syntheticWorkspacePath,
} from "./helpers.js";

const screenshotsDirectory = fileURLToPath(new URL("../../../docs/screenshots", import.meta.url));

test.beforeAll(async () => {
  await mkdir(screenshotsDirectory, { recursive: true });
});

test("captures the empty Org Editor", async ({ page }) => {
  await openBlankWorkspace(page);
  await stabilizeForScreenshot(page);

  await page.screenshot({
    animations: "disabled",
    fullPage: true,
    path: `${screenshotsDirectory}/empty-org-editor.png`,
  });
});

test("captures the synthetic organization canvas", async ({ page }) => {
  await openBlankWorkspace(page);
  await replaceWithSyntheticWorkspace(page);
  await stabilizeForScreenshot(page);

  await page.screenshot({
    animations: "disabled",
    fullPage: true,
    path: `${screenshotsDirectory}/synthetic-org-editor.png`,
  });
});

test("captures card-consistent tags in the Org Editor image export", async ({ page }) => {
  await openBlankWorkspace(page);
  await replaceWithSyntheticWorkspace(page);
  await page.locator('fieldset[aria-label="Canvas Unit Platform"]').click({
    button: "right",
    position: { x: 20, y: 20 },
  });
  await page.locator('[data-demo-id="org-editor-export-action"]').click();
  const dialog = page.getByRole("dialog", { name: "Export" });
  await expect(dialog.locator('[data-demo-id="org-editor-export-image"]')).toBeVisible();
  await stabilizeForScreenshot(page);

  await page.screenshot({
    animations: "disabled",
    fullPage: true,
    path: `${screenshotsDirectory}/org-editor-image-export.png`,
  });
});

test("captures the synthetic Employees catalog", async ({ page }) => {
  await openBlankWorkspace(page);
  await replaceWithSyntheticWorkspace(page);
  await page.getByRole("tab", { name: "Employees", exact: true }).click();
  await expect(page.getByRole("tab", { name: "Employees", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await stabilizeForScreenshot(page);

  await page.screenshot({
    animations: "disabled",
    fullPage: true,
    path: `${screenshotsDirectory}/synthetic-employees.png`,
  });
});

test("captures the synthetic Download surface", async ({ page }) => {
  await openBlankWorkspace(page);
  await replaceWithSyntheticWorkspace(page);
  await page.getByRole("tab", { name: "Download", exact: true }).click();
  await expect(page.getByRole("tab", { name: "Download", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await stabilizeForScreenshot(page);

  await page.screenshot({
    animations: "disabled",
    fullPage: true,
    path: `${screenshotsDirectory}/synthetic-download.png`,
  });
});

test("captures synthetic analytics", async ({ page }) => {
  await openBlankWorkspace(page);
  await replaceWithSyntheticWorkspace(page);
  await page.getByRole("tab", { name: "Analytics", exact: true }).click();
  await expect(page.getByRole("tab", { name: "Analytics", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await stabilizeForScreenshot(page);

  await page.screenshot({
    animations: "disabled",
    fullPage: true,
    path: `${screenshotsDirectory}/synthetic-analytics.png`,
  });
});

test("captures the synthetic Employee Calendar", async ({ page }) => {
  await openBlankWorkspace(page);
  await replaceWithSyntheticWorkspace(page);
  await page.getByRole("tab", { name: "Calendar", exact: true }).click();
  await expect(page.getByText("Employee Calendar", { exact: true })).toBeVisible();
  await stabilizeForScreenshot(page);

  await page.screenshot({
    animations: "disabled",
    fullPage: true,
    path: `${screenshotsDirectory}/synthetic-calendar.png`,
  });
});

test("captures dated tag editing and event details", async ({ page }) => {
  await openBlankWorkspace(page);
  await replaceWithSyntheticWorkspace(page);
  await page.getByRole("tab", { name: "Employees", exact: true }).click();

  await page.locator('[data-demo-id="employees-tag-picker-trigger"]').first().click();
  await page.getByRole("button", { name: "Date for tag Remote" }).click();
  await expect(
    page.locator('[data-demo-id="tag-date-calendar"] [data-day="2026-08-12"]'),
  ).toHaveAttribute("data-selected", "true");
  await stabilizeForScreenshot(page);
  await page.screenshot({
    animations: "disabled",
    fullPage: true,
    path: `${screenshotsDirectory}/dated-tag-popover.png`,
  });
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");

  await page.locator('[data-demo-id="employee-edit-button"]').first().click();
  await expect(page.getByRole("dialog", { name: "Edit Employee" })).toBeVisible();
  await stabilizeForScreenshot(page);
  await page.screenshot({
    animations: "disabled",
    fullPage: true,
    path: `${screenshotsDirectory}/employee-dated-tags.png`,
  });
  await page
    .getByRole("dialog", { name: "Edit Employee" })
    .getByRole("button", { name: "Cancel" })
    .click();

  await page.getByRole("tab", { name: "Calendar", exact: true }).click();
  await page
    .locator('[data-demo-id="dated-tag-cloud"]')
    .getByRole("button", { name: /Operations/ })
    .click();
  await expect(page.getByRole("dialog", { name: "Operations" })).toBeVisible();
  await stabilizeForScreenshot(page);
  await page.screenshot({
    animations: "disabled",
    fullPage: true,
    path: `${screenshotsDirectory}/dated-tag-events.png`,
  });
});

test("captures the workspace Export dialog", async ({ page }) => {
  await openBlankWorkspace(page);
  await replaceWithSyntheticWorkspace(page);
  await page.getByRole("button", { name: "Export", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Export workspace" })).toBeVisible();
  await stabilizeForScreenshot(page);

  await page.screenshot({
    animations: "disabled",
    fullPage: true,
    path: `${screenshotsDirectory}/save-formats.png`,
  });
});

test("captures local Employee avatar cropping", async ({ page }) => {
  await openBlankWorkspace(page);
  await page.getByRole("tab", { name: "Employees", exact: true }).click();
  await page.getByRole("button", { name: "Create Employee", exact: true }).click();
  const employeeDialog = page.getByRole("dialog", { name: "Create Employee" });
  const syntheticAvatarDataUrl = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 960;
    canvas.height = 640;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Synthetic avatar canvas is unavailable.");
    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#334155");
    gradient.addColorStop(0.5, "#2563eb");
    gradient.addColorStop(1, "#60a5fa");
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "rgba(255, 255, 255, 0.82)";
    context.beginPath();
    context.arc(480, 260, 150, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "rgba(15, 23, 42, 0.72)";
    context.beginPath();
    context.arc(480, 760, 340, 0, Math.PI * 2);
    context.fill();
    return canvas.toDataURL("image/png");
  });
  await employeeDialog.getByLabel("Choose file", { exact: true }).setInputFiles({
    buffer: Buffer.from(syntheticAvatarDataUrl.split(",")[1] ?? "", "base64"),
    mimeType: "image/png",
    name: "synthetic-avatar.png",
  });
  const cropDialog = page.getByRole("dialog", { name: "Crop avatar" });
  await expect(cropDialog).toBeVisible();
  await stabilizeForScreenshot(page);

  await page.screenshot({
    animations: "disabled",
    fullPage: true,
    path: `${screenshotsDirectory}/employee-avatar-crop.png`,
  });

  await cropDialog.getByRole("button", { name: "Use avatar", exact: true }).click();
  await expect(employeeDialog.locator('[data-demo-id="employee-avatar-preview"]')).toBeVisible();
  await stabilizeForScreenshot(page);
  await page.screenshot({
    animations: "disabled",
    fullPage: true,
    path: `${screenshotsDirectory}/employee-avatar-form.png`,
  });
});

test("captures the dark expanded sidebar", async ({ page }) => {
  await openBlankWorkspace(page);
  await replaceWithSyntheticWorkspace(page);
  await page.locator('[data-demo-id="theme-toggle"]').click();
  await page.getByRole("option", { name: "Dark", exact: true }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.locator('[data-demo-id="sidebar-toggle"]').click();
  await expect(page.locator('[data-demo-id="app-sidebar"]')).toHaveAttribute(
    "data-collapsed",
    "false",
  );
  await stabilizeForScreenshot(page);

  await page.screenshot({
    animations: "disabled",
    fullPage: true,
    path: `${screenshotsDirectory}/dark-shell.png`,
  });
});

test("captures JSON Employee field mapping", async ({ page }) => {
  await openBlankWorkspace(page);
  const dialog = await openImportDialog(page, syntheticEmployeesJsonPath);
  await expect(dialog.getByText("Field mapping", { exact: true })).toBeVisible();
  await stabilizeForScreenshot(page);

  await page.screenshot({
    animations: "disabled",
    fullPage: true,
    path: `${screenshotsDirectory}/employee-import-mapping.png`,
  });
});

test("captures recognized state import choices", async ({ page }) => {
  await openBlankWorkspace(page);
  const dialog = await openImportDialog(page, syntheticWorkspacePath);
  await expect(dialog.getByText("Workspace state detected", { exact: true })).toBeVisible();
  await expect(dialog.getByRole("radiogroup", { name: "State content" })).toContainText(
    "Full workspace",
  );
  await dialog.getByRole("radio", { name: "Teams + Employees", exact: true }).check();
  await expect(dialog.getByText("Import mode", { exact: true })).toBeVisible();
  await expect(dialog.getByText("Product", { exact: true })).toBeVisible();
  await expect(dialog.getByText("Platform", { exact: true })).toBeVisible();
  await expect(dialog.locator('[data-demo-id="structured-preview-employee-card"]')).toHaveCount(4);
  await stabilizeForScreenshot(page);

  await page.screenshot({
    animations: "disabled",
    fullPage: true,
    path: `${screenshotsDirectory}/state-import.png`,
  });
});
