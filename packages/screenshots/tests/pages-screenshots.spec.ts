import { expect, test } from "@playwright/test";

import { localeStorageKey, syntheticStatePath } from "./helpers.js";

test("keeps the screenshot source scenarios available in the static runtime", async ({ page }) => {
  await page.addInitScript((key) => window.localStorage.setItem(key, "en"), localeStorageKey);
  await page.goto("./", { waitUntil: "domcontentloaded" });
  const chooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Import", exact: true }).click();
  await (await chooserPromise).setFiles(syntheticStatePath);
  const dialog = page.getByRole("dialog", { name: "Import state" });
  await dialog.getByRole("button", { name: "Replace state", exact: true }).click();
  await expect(page.getByText("Product", { exact: true }).first()).toBeVisible();
  await expect(page.locator('[data-demo-id="project-save"]')).toHaveCount(0);
  await expect(page.locator('[data-demo-id="browser-file-switcher"]')).toHaveCount(0);
});
