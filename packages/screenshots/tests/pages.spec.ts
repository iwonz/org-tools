import { readFile } from "node:fs/promises";

import ruMessages from "../../../apps/ui/messages/ru.json" with { type: "json" };
import { expect, test } from "./browser-test.js";
import { localeStorageKey, syntheticStatePath } from "./helpers.js";

const useEnglish = (key: string) => window.localStorage.setItem(key, "en");

async function importSyntheticState(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Import", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Import", exact: true });
  const chooserPromise = page.waitForEvent("filechooser");
  await dialog.getByText("Choose file", { exact: true }).click();
  await (await chooserPromise).setFiles(syntheticStatePath);
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
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (
      ["http:", "https:"].includes(url.protocol) &&
      !["127.0.0.1", "localhost"].includes(url.hostname)
    ) {
      externalRequests.push(request.url());
    }
    if (url.pathname.includes("/api/")) apiRequests.push(request.url());
  });
  await page.addInitScript(useEnglish, localeStorageKey);
  await page.goto("./", { waitUntil: "domcontentloaded" });

  await expect(page).toHaveURL(/\/org-tools\/$/u);
  await expect(page.getByRole("tab", { name: "Editor", exact: true })).toBeVisible();
  await expect(page.locator('[data-demo-id="browser-file-switcher"]')).toHaveCount(0);
  await expect(page.locator('[data-demo-id="project-save"]')).toHaveCount(0);
  await importSyntheticState(page);
  await expect(page.getByText("Product", { exact: true }).first()).toBeVisible();

  await expect(page.locator('[data-demo-id="org-view-toolbar"]')).toHaveCount(0);

  await page.getByRole("button", { name: "Export", exact: true }).click();
  const exportDialog = page.getByRole("dialog", { name: "Export", exact: true });
  const stateExportPromise = page.waitForEvent("download");
  await exportDialog.getByRole("button", { name: "Download", exact: true }).click();
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
  expect(externalRequests).toEqual([]);
  expect(apiRequests).toEqual([]);
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
  await page.bringToFront();
  await expect(page.getByText("Product", { exact: true }).first()).toBeVisible();
  await secondPage.bringToFront();
  await expect(secondPage.getByText("Product", { exact: true }).first()).toBeVisible();
  await secondPage.getByRole("tab", { name: "Employees", exact: true }).click();
  await expect(secondPage.getByRole("tab", { name: "Employees", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.bringToFront();
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

test("crops and exports a PNG avatar when WebP canvas encoding is unavailable", async ({
  page,
}) => {
  const externalRequests: string[] = [];
  const apiRequests: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (
      ["http:", "https:"].includes(url.protocol) &&
      !["127.0.0.1", "localhost"].includes(url.hostname)
    ) {
      externalRequests.push(request.url());
    }
    if (url.pathname.includes("/api/")) apiRequests.push(request.url());
  });
  await page.addInitScript(useEnglish, localeStorageKey);
  await page.goto("./", { waitUntil: "domcontentloaded" });
  await page.getByRole("tab", { name: "Employees", exact: true }).click();
  await page.getByRole("button", { name: "Add Employee", exact: true }).click();
  const employeeDialog = page.getByRole("dialog", { name: "Create Employee" });
  const pngBuffer = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2R2sAAAAASUVORK5CYII=",
    "base64",
  );
  await page.evaluate(() => {
    const originalToBlob = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function (callback, type, quality) {
      if (type === "image/webp") {
        callback(null);
        return;
      }
      originalToBlob.call(this, callback, type, quality);
    };
  });
  await employeeDialog.getByLabel("Choose file", { exact: true }).setInputFiles({
    buffer: pngBuffer,
    mimeType: "image/png",
    name: "avatar.png",
  });
  const cropDialog = page.getByRole("dialog", { name: "Crop avatar" });
  await expect(cropDialog).toBeVisible();
  await cropDialog.getByRole("button", { name: "Use avatar", exact: true }).click();
  const preview = employeeDialog.locator('[data-demo-id="employee-avatar-preview"]');
  await expect(preview).toHaveAttribute("src", /^data:image\/png;base64,/);
  expect(
    await preview.evaluate(async (element) => {
      const image = element as HTMLImageElement;
      await image.decode();
      return [image.naturalWidth, image.naturalHeight];
    }),
  ).toEqual([512, 512]);
  await employeeDialog.getByLabel("First name", { exact: true }).fill("Fallback");
  await employeeDialog.getByRole("button", { name: "Create", exact: true }).click();

  await page.getByRole("button", { name: "Export", exact: true }).click();
  const exportDialog = page.getByRole("dialog", { name: "Export", exact: true });
  const exportPromise = page.waitForEvent("download");
  await exportDialog.getByRole("button", { name: "Download", exact: true }).click();
  const exportPath = await (await exportPromise).path();
  const exportedState = JSON.parse(await readFile(exportPath ?? "", "utf8")) as {
    organization: { employees: Array<{ avatarBase64Url: string | null }> };
  };
  expect(exportedState.organization.employees[0]?.avatarBase64Url).toMatch(
    /^data:image\/png;base64,/,
  );
  expect(externalRequests).toEqual([]);
  expect(apiRequests).toEqual([]);
});
