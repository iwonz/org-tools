import { expect, type Page } from "@playwright/test";
import { createUsedColorsStateFile, expectUsedColorPalette, openImportDialog } from "./helpers.js";

export async function exerciseUsedColorsAndToolIcons(page: Page, runtime: "pages" | "server") {
  const importDialog = await openImportDialog(page, await createUsedColorsStateFile());
  const importWrite =
    runtime === "server"
      ? page.waitForResponse(
          (response) =>
            response.request().method() === "PUT" &&
            response.url().endsWith("/api/state") &&
            response.request().postData()?.includes("70000000-0000-4000-8000-000000000001") ===
              true,
        )
      : null;
  await importDialog.getByRole("button", { name: "Replace state", exact: true }).click();
  await expect(importDialog).toBeHidden();
  if (importWrite) await importWrite;

  await page.getByRole("tab", { name: "Editor", exact: true }).click();
  const tools = page.locator('[data-demo-id="org-editor-canvas-tool-actions"]');
  const arrowIcon = tools.locator(
    '[data-canvas-tool="arrow"] [data-canvas-tool-icon="arrow-bezier"]',
  );
  await expect(arrowIcon).toBeVisible();
  await expect(arrowIcon.locator("path")).toHaveCount(2);
  await expect(arrowIcon.locator("path").first()).toHaveAttribute("d", /C/u);
  await expect(arrowIcon.locator("path").first()).toHaveAttribute("fill", "none");
  await expect(arrowIcon.locator("path").nth(1)).toHaveAttribute("fill", "currentColor");
  await expect(
    tools.locator('[data-canvas-tool="image"] [data-canvas-tool-icon="image-rounded"]'),
  ).toBeVisible();

  await page.setViewportSize({ height: 844, width: 390 });
  const employeeTabWrite =
    runtime === "server"
      ? page.waitForResponse(
          (response) =>
            response.request().method() === "PUT" &&
            response.url().endsWith("/api/state") &&
            response.request().postData()?.includes('"activeTab":"employees"') === true,
        )
      : null;
  await page.getByRole("tab", { name: "Employees", exact: true }).click();
  if (employeeTabWrite) await employeeTabWrite;
  await page.locator('[data-demo-id="employee-tags-button"]').click();
  const catalog = page.getByRole("dialog", { name: "Tags", exact: true });
  const row = catalog.locator('[data-demo-id="tag-catalog-row"]').first();
  const trigger = row.locator('[data-demo-id="tag-color-trigger"]');
  const originalColor = await row
    .locator("[data-tag-color]")
    .first()
    .getAttribute("data-tag-color");
  let requestWrites = 0;
  const onRequest = (request: { method(): string; url(): string }) => {
    if (request.method() === "PUT" && request.url().endsWith("/api/state")) requestWrites += 1;
  };
  if (runtime === "server") page.on("request", onRequest);
  if (runtime === "pages") {
    await page.evaluate(() => {
      const originalPost = BroadcastChannel.prototype.postMessage;
      Reflect.set(window, "__usedColorWrites", 0);
      BroadcastChannel.prototype.postMessage = function (value) {
        if (value?.type === "state") {
          Reflect.set(
            window,
            "__usedColorWrites",
            Number(Reflect.get(window, "__usedColorWrites")) + 1,
          );
        }
        originalPost.call(this, value);
      };
    });
  }
  const writes = async () =>
    runtime === "server"
      ? requestWrites
      : page.evaluate(() => Number(Reflect.get(window, "__usedColorWrites")));

  await trigger.click();
  const picker = page.locator('[data-demo-id="tag-color-dropdown"]');
  const used = await expectUsedColorPalette(page, ["#abcdef80", "#12345600", "#3b82f6"]);
  await expect(used.locator('[data-tag-color-used="#3b82f6"]')).toHaveCount(1);
  await used.locator('[data-tag-color-used="#abcdef80"]').click();
  await expect(picker.getByRole("spinbutton", { name: "Opacity (%)", exact: true })).toHaveValue(
    "50",
  );
  await expect(picker.getByRole("textbox", { name: "Color value", exact: true })).toHaveValue(
    "#abcdef",
  );
  expect(await writes()).toBe(0);
  await picker.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(row.locator(`[data-tag-color="${originalColor}"]`)).toBeVisible();
  expect(await writes()).toBe(0);

  await trigger.click();
  await picker.locator('[data-tag-color-used="#12345600"]').click();
  await expect(picker.getByRole("spinbutton", { name: "Opacity (%)", exact: true })).toHaveValue(
    "0",
  );
  await picker.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(row.locator('[data-tag-color="#12345600"]')).toBeVisible();
  await expect.poll(writes).toBe(1);

  if (runtime === "server") page.off("request", onRequest);
  await catalog.getByRole("button", { name: "Close", exact: true }).first().click();
  await page.setViewportSize({ height: 1000, width: 1440 });
}
