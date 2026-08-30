import { readFile } from "node:fs/promises";

import { expect, test } from "@playwright/test";

import { localeStorageKey, syntheticWorkspacePath } from "./helpers.js";

const disableNativeFileAccess = () => {
  Object.defineProperty(window, "showOpenFilePicker", { configurable: true, value: undefined });
  Object.defineProperty(window, "showSaveFilePicker", { configurable: true, value: undefined });
};

const useEnglish = () => window.localStorage.setItem(localeStorageKey, "en");

async function createEmployee(page: import("@playwright/test").Page, suffix: string) {
  await page.getByRole("tab", { name: "Employees", exact: true }).click();
  await page.getByRole("button", { name: "Create", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Create Employee" });
  await dialog.getByLabel("First name").fill("Morgan");
  await dialog.getByLabel("Last name").fill(suffix);
  await dialog.getByLabel("Username").fill(`morgan.${suffix.toLocaleLowerCase("en-US")}`);
  await dialog.getByRole("button", { name: "Create", exact: true }).click();
  await expect(dialog).toBeHidden();
}

async function touchWorkspaceFile(page: import("@playwright/test").Page) {
  await page.evaluate(async () => {
    const root = await navigator.storage.getDirectory();
    const handle = await root.getFileHandle("pages-workspace.json");
    const file = await handle.getFile();
    const writable = await handle.createWritable();
    await writable.write(`${await file.text()}\n`);
    await writable.close();
  });
}

test("runs the complete browser workspace at the repository base path without APIs", async ({
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
  await page.addInitScript(disableNativeFileAccess);
  await page.addInitScript(useEnglish);
  await page.goto("./", { waitUntil: "domcontentloaded" });

  await expect(page).toHaveURL(/\/org-tools\/$/u);
  await expect(page.getByRole("tab", { name: "Editor", exact: true })).toBeVisible();
  await page.locator('[data-demo-id="browser-file-switcher"]').click();
  await expect(
    page.getByText("Autosave requires File System Access.", { exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");

  const importChooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Import", exact: true }).click();
  await (await importChooserPromise).setFiles(syntheticWorkspacePath);
  const importDialog = page.getByRole("dialog", { name: "Import" });
  await expect(importDialog.getByText("Workspace state detected", { exact: true })).toBeVisible();
  await importDialog.getByRole("button", { name: "Replace all current", exact: true }).click();
  await expect(page.getByText("Product", { exact: true }).first()).toBeVisible();

  await page
    .locator('fieldset[aria-label="Canvas Unit Platform"]')
    .click({ button: "right", position: { x: 20, y: 20 } });
  await page.locator('[data-demo-id="org-editor-export-action"]').click();
  const imageDialog = page.getByRole("dialog", { name: "Export" });
  await expect(imageDialog.locator('[data-demo-id="org-editor-export-image"]')).toBeVisible();
  const imageDownloadPromise = page.waitForEvent("download");
  await imageDialog.getByRole("button", { name: "Save", exact: true }).click();
  expect((await imageDownloadPromise).suggestedFilename()).toMatch(/\.png$/u);
  await page.keyboard.press("Escape");

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
  const downloadSettings = page.locator('[data-demo-id="export-settings-dialog"]');
  const csvDownloadPromise = page.waitForEvent("download");
  await downloadSettings.getByRole("button", { name: "Download", exact: true }).click();
  expect((await csvDownloadPromise).suggestedFilename()).toBe("org-tools-export.csv");
  await downloadSettings.getByRole("tab", { name: "JSON", exact: true }).click();
  const jsonDownloadPromise = page.waitForEvent("download");
  await downloadSettings.getByRole("button", { name: "Download", exact: true }).click();
  expect((await jsonDownloadPromise).suggestedFilename()).toBe("org-tools-export.json");
  await page.keyboard.press("Escape");

  await page.locator('[data-demo-id="browser-file-switcher"]').click();
  const downloadPromise = page.waitForEvent("download");
  await page.locator('[data-demo-id="browser-workspace-save-as"]').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("org-tools-state.json");
  const savedPath = await download.path();
  const saved = JSON.parse(await readFile(savedPath ?? "", "utf8")) as {
    content: string;
    employees: unknown[];
    kind: string;
  };
  expect(saved).toMatchObject({ content: "workspace", kind: "org-tools-state" });
  expect(saved.employees).toHaveLength(4);
  expect(externalRequests).toEqual([]);
  expect(apiRequests).toEqual([]);
});

test("saves through a real browser file handle and reconnects it after reload", async ({
  page,
}) => {
  const workspaceSource = await readFile(syntheticWorkspacePath, "utf8");
  await page.addInitScript(useEnglish);
  await page.addInitScript((source) => {
    const getHandle = async () => {
      const root = await navigator.storage.getDirectory();
      return root.getFileHandle("pages-workspace.json", { create: true });
    };
    Object.defineProperty(window, "showOpenFilePicker", {
      configurable: true,
      value: async () => {
        const handle = await getHandle();
        const file = await handle.getFile();
        if (file.size === 0) {
          const writable = await handle.createWritable();
          await writable.write(source);
          await writable.close();
        }
        return [handle];
      },
    });
    Object.defineProperty(window, "showSaveFilePicker", {
      configurable: true,
      value: getHandle,
    });
  }, workspaceSource);
  await page.goto("./", { waitUntil: "domcontentloaded" });

  await page.locator('[data-demo-id="browser-file-switcher"]').click();
  await page.locator('[data-demo-id="browser-workspace-open"]').click();
  await expect(page.getByText("Product", { exact: true }).first()).toBeVisible();
  await createEmployee(page, "Lake");
  await expect(page.locator('[data-demo-id="project-save-status"]')).toHaveText("Unsaved");

  await page.locator('[data-demo-id="browser-file-switcher"]').click();
  const filePopover = page.locator('[data-demo-id="browser-file-popover"]');
  await expect(filePopover).toBeVisible();
  await filePopover.getByText("Autosave", { exact: true }).click();
  await expect(page.locator('[data-demo-id="project-save-status"]')).toHaveText("Saved", {
    timeout: 5_000,
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByText("Morgan Lake", { exact: true }).first()).toBeVisible();
});

test("offers every browser file conflict resolution", async ({ page }) => {
  const workspaceSource = await readFile(syntheticWorkspacePath, "utf8");
  await page.addInitScript(useEnglish);
  await page.addInitScript((source) => {
    const getHandle = async () => {
      const root = await navigator.storage.getDirectory();
      return root.getFileHandle("pages-workspace.json", { create: true });
    };
    Object.defineProperty(window, "showOpenFilePicker", {
      configurable: true,
      value: async () => {
        const handle = await getHandle();
        const writable = await handle.createWritable();
        await writable.write(source);
        await writable.close();
        return [handle];
      },
    });
    Object.defineProperty(window, "showSaveFilePicker", {
      configurable: true,
      value: getHandle,
    });
  }, workspaceSource);
  await page.goto("./", { waitUntil: "domcontentloaded" });
  await page.locator('[data-demo-id="browser-file-switcher"]').click();
  await page.locator('[data-demo-id="browser-workspace-open"]').click();
  await expect(page.getByText("Product", { exact: true }).first()).toBeVisible();

  await createEmployee(page, "Cancel");
  await touchWorkspaceFile(page);
  await page.locator('[data-demo-id="project-save"]').click();
  let conflict = page.getByRole("alertdialog", { name: "File conflict" });
  await expect(conflict).toBeVisible();
  for (const action of ["Load file", "Overwrite file", "Save As", "Cancel"] as const) {
    await expect(conflict.getByRole("button", { name: action, exact: true })).toBeVisible();
  }
  await conflict.getByRole("button", { name: "Cancel", exact: true }).click();

  await page.locator('[data-demo-id="project-save"]').click();
  conflict = page.getByRole("alertdialog", { name: "File conflict" });
  await conflict.getByRole("button", { name: "Load file", exact: true }).click();
  await expect(page.getByText("Morgan Cancel", { exact: true })).toHaveCount(0);

  await createEmployee(page, "Overwrite");
  await touchWorkspaceFile(page);
  await page.locator('[data-demo-id="project-save"]').click();
  conflict = page.getByRole("alertdialog", { name: "File conflict" });
  await conflict.getByRole("button", { name: "Overwrite file", exact: true }).click();
  await expect(conflict).toBeHidden();
  await expect(page.locator('[data-demo-id="project-save-status"]')).toHaveText("Saved");

  await createEmployee(page, "SaveAs");
  await touchWorkspaceFile(page);
  await page.locator('[data-demo-id="project-save"]').click();
  conflict = page.getByRole("alertdialog", { name: "File conflict" });
  await conflict.getByRole("button", { name: "Save As", exact: true }).click();
  await expect(conflict).toBeHidden();
  await expect(page.locator('[data-demo-id="project-save-status"]')).toHaveText("Saved");
});
