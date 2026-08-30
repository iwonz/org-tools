import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { expect, type Page, test } from "@playwright/test";

import { localeStorageKey, stabilizeForScreenshot, syntheticWorkspacePath } from "./helpers.js";

type ScreenshotScenario = { file: string; id: string };

const screenshotsDirectory = fileURLToPath(new URL("../../../docs/screenshots", import.meta.url));
const manifestPath = fileURLToPath(new URL("../../../docs/screenshot-demo.json", import.meta.url));
const screenshotManifest = JSON.parse(await readFile(manifestPath, "utf8")) as ScreenshotScenario[];
const scenariosById = new Map(screenshotManifest.map((scenario) => [scenario.id, scenario]));

test.setTimeout(60_000);

async function capture(page: Page, id: string) {
  const scenario = scenariosById.get(id);
  if (!scenario) throw new Error(`Unknown screenshot scenario: ${id}`);
  await stabilizeForScreenshot(page);
  await writeFile(
    `${screenshotsDirectory}/${scenario.file}`,
    await page.screenshot({ animations: "disabled" }),
  );
}

const useEnglish = () => window.localStorage.setItem(localeStorageKey, "en");

test("captures the native browser file lifecycle", async ({ page }) => {
  const source = await readFile(syntheticWorkspacePath, "utf8");
  await page.clock.setFixedTime(new Date("2026-07-31T12:00:00.000Z"));
  await page.addInitScript(useEnglish);
  await page.addInitScript((workspaceSource) => {
    const fileSystemHandle = Reflect.get(window, "FileSystemHandle") as
      | { prototype: object }
      | undefined;
    if (fileSystemHandle) {
      Object.defineProperty(fileSystemHandle.prototype, "queryPermission", {
        configurable: true,
        value: async () => "prompt",
      });
      Object.defineProperty(fileSystemHandle.prototype, "requestPermission", {
        configurable: true,
        value: async () => "granted",
      });
    }
    const getHandle = async () => {
      const root = await navigator.storage.getDirectory();
      return root.getFileHandle("browser-workspace.json", { create: true });
    };
    Object.defineProperty(window, "showOpenFilePicker", {
      configurable: true,
      value: async () => {
        const handle = await getHandle();
        const writable = await handle.createWritable();
        await writable.write(workspaceSource);
        await writable.close();
        return [handle];
      },
    });
    Object.defineProperty(window, "showSaveFilePicker", {
      configurable: true,
      value: getHandle,
    });
  }, source);
  await page.goto("./", { waitUntil: "domcontentloaded" });
  await page.locator('[data-demo-id="browser-file-switcher"]').click();
  await page.locator('[data-demo-id="browser-workspace-open"]').click();
  await expect(page.getByText("Product", { exact: true }).first()).toBeVisible();
  await page.locator('[data-demo-id="sidebar-toggle"]').click();
  await page.locator('[data-demo-id="browser-file-switcher"]').click();
  const filePopover = page.locator('[data-demo-id="browser-file-popover"]');
  await expect(filePopover).toBeVisible();
  await capture(page, "browser-file-menu");

  await page.keyboard.press("Escape");
  await page.getByRole("tab", { name: "Employees", exact: true }).click();
  await page.locator('[data-demo-id="employee-create-button"]').click();
  const dialog = page.getByRole("dialog", { name: "Create Employee" });
  await dialog.getByLabel("First name").fill("Taylor");
  await dialog.getByLabel("Last name").fill("North");
  await dialog.getByLabel("Username").fill("taylor.north");
  await dialog.getByRole("button", { name: "Create", exact: true }).click();
  await expect(dialog).toBeHidden();
  await page.locator('[data-demo-id="browser-file-switcher"]').click();
  await filePopover.getByText("Autosave", { exact: true }).click();
  await expect(page.locator('[data-demo-id="project-save-status"]')).toHaveText("Saved", {
    timeout: 5_000,
  });
  await expect(filePopover.locator('[data-demo-id="autosave-checkbox"]')).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await capture(page, "browser-autosave");

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Reconnect workspace file" })).toBeVisible();
  await capture(page, "browser-reconnect");
});

test("captures the browser download fallback", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-07-31T12:00:00.000Z"));
  await page.addInitScript(useEnglish);
  await page.addInitScript(() => {
    Object.defineProperty(window, "showOpenFilePicker", { configurable: true, value: undefined });
    Object.defineProperty(window, "showSaveFilePicker", { configurable: true, value: undefined });
  });
  await page.goto("./", { waitUntil: "domcontentloaded" });
  await page
    .locator('[data-demo-id="browser-workspace-file-input"]')
    .setInputFiles(syntheticWorkspacePath);
  await expect(page.getByText("Product", { exact: true }).first()).toBeVisible();
  await page.locator('[data-demo-id="sidebar-toggle"]').click();
  await page.locator('[data-demo-id="browser-file-switcher"]').click();
  await expect(
    page.getByText("Autosave requires File System Access.", { exact: true }),
  ).toBeVisible();
  await capture(page, "browser-fallback");
});
