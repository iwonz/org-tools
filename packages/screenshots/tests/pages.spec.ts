import { readFile } from "node:fs/promises";

import arMessages from "../../../apps/ui/messages/ar.json" with { type: "json" };
import enMessages from "../../../apps/ui/messages/en.json" with { type: "json" };
import esMessages from "../../../apps/ui/messages/es.json" with { type: "json" };
import frMessages from "../../../apps/ui/messages/fr.json" with { type: "json" };
import ruMessages from "../../../apps/ui/messages/ru.json" with { type: "json" };
import zhMessages from "../../../apps/ui/messages/zh.json" with { type: "json" };
import { expect, test } from "./browser-test.js";
import { localeStorageKey, syntheticStatePath } from "./helpers.js";

const useEnglish = (key: string) => window.localStorage.setItem(key, "en");

const localeCases = [
  ["en", enMessages, "ltr"],
  ["zh", zhMessages, "ltr"],
  ["ru", ruMessages, "ltr"],
  ["es", esMessages, "ltr"],
  ["fr", frMessages, "ltr"],
  ["ar", arMessages, "rtl"],
] as const;

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

test("detects the browser locale and switches all six bundled languages", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript((key) => {
    window.localStorage.removeItem(key);
    Object.defineProperty(navigator, "languages", {
      configurable: true,
      value: ["de-DE", "zh-Hans-CN", "en-US"],
    });
  }, localeStorageKey);
  await page.goto("./", { waitUntil: "domcontentloaded" });

  await expect(page.locator("html")).toHaveAttribute("lang", "zh");
  await expect(page.getByRole("tab", { name: zhMessages.Ui.Editor, exact: true })).toBeVisible();

  for (const [locale, messages, direction] of localeCases) {
    await page.locator('[data-demo-id="language-toggle"]').click();
    const dialog = page.locator('[data-demo-id="language-dialog"]');
    await expect(dialog.getByRole("radio")).toHaveCount(6);
    await dialog.locator(`label:has(input[value="${locale}"])`).click();
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.locator("html")).toHaveAttribute("dir", direction);
    await expect(page.getByRole("tab", { name: messages.Ui.Editor, exact: true })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
});

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

  await expect(page.locator('[data-demo-id="org-editor-view-toolbar"]')).toBeVisible();
  await expect(page.locator('[data-demo-id="org-editor-view-select"]')).toContainText("Units");
  const footerChipInsets = await page
    .locator('[data-org-editor-unit-id="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"]')
    .locator("[data-org-editor-unit-tag-footer] > span")
    .evaluateAll((chips) =>
      chips.map((chip) => {
        const label = chip.firstElementChild?.getBoundingClientRect();
        const count = chip.lastElementChild?.getBoundingClientRect();
        const bounds = chip.getBoundingClientRect();
        return {
          labelClientWidth: chip.firstElementChild?.clientWidth ?? 0,
          labelScrollWidth: chip.firstElementChild?.scrollWidth ?? 0,
          left: (label?.left ?? bounds.left) - bounds.left,
          right: bounds.right - (count?.right ?? bounds.right),
        };
      }),
    );
  expect(footerChipInsets.length).toBeGreaterThan(1);
  for (const inset of footerChipInsets) {
    expect(inset.left).toBeGreaterThanOrEqual(7);
    expect(inset.left).toBeLessThanOrEqual(9);
    expect(inset.right).toBeGreaterThanOrEqual(7);
    expect(inset.right).toBeLessThanOrEqual(12);
    expect(inset.labelScrollWidth).toBeLessThanOrEqual(inset.labelClientWidth + 1);
  }

  await page.getByRole("tab", { name: "Employees", exact: true }).click();
  const coloredTag = page.locator('[data-tag-color-surface][data-tag-color="blue"]').first();
  const neutralTag = page.locator('[data-tag-color-surface][data-tag-color="none"]').first();
  await expect(coloredTag).toBeVisible();
  await expect(neutralTag).toBeVisible();
  const [coloredBackground, neutralBackground] = await Promise.all(
    [coloredTag, neutralTag].map((tag) =>
      tag.evaluate((element) => window.getComputedStyle(element).backgroundColor),
    ),
  );
  expect(coloredBackground).not.toBe("rgba(0, 0, 0, 0)");
  expect(coloredBackground).not.toBe(neutralBackground);
  await expect(page.locator('[data-tag-color-surface] [class~="rounded-full"]')).toHaveCount(0);

  await page.locator('[data-demo-id="employee-tags-button"]').click();
  const tagCatalog = page.getByRole("dialog", { name: "Tags", exact: true });
  const tagRow = tagCatalog.locator('[data-demo-id="tag-catalog-row"]').first();
  await tagRow.locator('[data-demo-id="tag-color-trigger"]').click();
  const colorDropdown = page.locator('[data-demo-id="tag-color-dropdown"]');
  await expect(colorDropdown.locator('[data-demo-id="tag-color-full-palette"]')).toBeVisible();
  await colorDropdown.getByLabel("Color format").click();
  await page.getByRole("option", { name: "RGBA", exact: true }).click();
  const colorValue = colorDropdown.getByLabel("Color value");
  await colorValue.fill("rgba(124, 58, 237, .5)");
  await colorValue.press("Enter");
  await page.keyboard.press("Escape");
  const customColor = await tagRow
    .locator('[data-tag-color-surface][data-tag-color^="#"]')
    .getAttribute("data-tag-color");
  expect(customColor).toBe("#7c3aed80");
  await expect(tagCatalog.locator(`[data-tag-color="${customColor}"]`).first()).toBeVisible();
  await tagCatalog.getByRole("button", { name: "Close", exact: true }).first().click();

  const stateExportPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export", exact: true }).click();
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
  const jsonPromise = page.waitForEvent("download");
  await settings.getByRole("button", { name: "Download", exact: true }).click();
  expect((await jsonPromise).suggestedFilename()).toBe("org-tools-export.json");
  await page.keyboard.press("Escape");

  const metadata = await page.evaluate(async () => ({
    databases: typeof indexedDB.databases === "function" ? await indexedDB.databases() : [],
    storageKeys: Object.keys(localStorage).sort(),
  }));
  expect(metadata.databases).toEqual([]);
  expect(metadata.storageKeys).toEqual([localeStorageKey, "org-tools-theme"]);
  await page.locator('[data-demo-id="sidebar-toggle"]').click();
  await page.locator('[data-demo-id="theme-toggle"]').click();
  await page.locator('[data-demo-id="theme-dialog"] label:has(input[value="dark"])').click();
  await page.locator('[data-demo-id="language-toggle"]').click();
  await page.locator('[data-demo-id="language-dialog"] label:has(input[value="ru"])').click();
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
  await page.locator('[data-demo-id="org-editor-create-view"]').click();
  const createView = page.getByRole("dialog", { name: "Create View", exact: true });
  await createView.getByLabel("View name", { exact: true }).fill("Live scenario");
  await createView.getByLabel("View source", { exact: true }).click();
  await page.getByRole("option", { name: "Copy a View", exact: true }).click();
  await createView.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page.locator('[data-demo-id="org-editor-view-select"]')).toContainText(
    "Live scenario",
  );

  const secondPage = await context.newPage();
  await secondPage.goto("./", { waitUntil: "domcontentloaded" });
  await page.bringToFront();
  await expect(page.getByText("Product", { exact: true }).first()).toBeVisible();
  await secondPage.bringToFront();
  await expect(secondPage.getByText("Product", { exact: true }).first()).toBeVisible();
  await expect(secondPage.locator('[data-demo-id="org-editor-view-select"]')).toContainText(
    "Live scenario",
  );
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

  const exportPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export", exact: true }).click();
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
