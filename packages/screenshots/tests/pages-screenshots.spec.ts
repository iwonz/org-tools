import { expect, test } from "./browser-test.js";
import { localeStorageKey, syntheticStatePath } from "./helpers.js";

test("keeps the screenshot source scenarios available in the static runtime", async ({ page }) => {
  await page.addInitScript((key) => window.localStorage.setItem(key, "en"), localeStorageKey);
  await page.goto("./", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Import", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Import", exact: true });
  const chooserPromise = page.waitForEvent("filechooser");
  await dialog.getByText("Choose file", { exact: true }).click();
  await (await chooserPromise).setFiles(syntheticStatePath);
  await dialog.getByRole("button", { name: "Replace state", exact: true }).click();
  await expect(page.getByText("Product", { exact: true }).first()).toBeVisible();
  await expect(page.locator('[data-demo-id="project-save"]')).toHaveCount(0);
  await expect(page.locator('[data-demo-id="browser-file-switcher"]')).toHaveCount(0);
});
