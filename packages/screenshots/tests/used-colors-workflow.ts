import { expect, type Page } from "@playwright/test";
import {
  createUsedColorsStateFile,
  expectUsedColorPalette,
  replaceStateFromFile,
} from "./helpers.js";

export async function exerciseUsedColorsAndToolIcons(page: Page) {
  await replaceStateFromFile(page, await createUsedColorsStateFile());
  await page.reload({ waitUntil: "domcontentloaded" });

  await page.getByRole("tab", { name: "Editor", exact: true }).click();
  const tools = page.locator('[data-demo-id="org-editor-canvas-tool-actions"]');
  const arrowIcon = tools.locator(
    '[data-canvas-tool="arrow"] [data-canvas-tool-icon="arrow-up-right"]',
  );
  await expect(arrowIcon).toBeVisible();
  await expect(arrowIcon).toHaveAttribute("fill", "none");
  await expect(arrowIcon.locator("path")).toHaveCount(1);
  await expect(arrowIcon.locator("path")).toHaveAttribute(
    "d",
    "m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25",
  );
  await expect(arrowIcon.locator("path")).toHaveAttribute("stroke-linecap", "round");
  await expect(
    tools.locator('[data-canvas-tool="image"] [data-canvas-tool-icon="image-rounded"]'),
  ).toBeVisible();

  await page.setViewportSize({ height: 844, width: 390 });
  const employeeTabWrite = page.waitForResponse(
    (response) => response.request().method() === "PUT" && response.url().endsWith("/api/ui"),
  );
  await page.getByRole("tab", { name: "Employees", exact: true }).click();
  await employeeTabWrite;
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
    if (request.method() === "POST" && request.url().endsWith("/api/commands")) requestWrites += 1;
  };
  page.on("request", onRequest);
  const writes = async () => requestWrites;

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

  page.off("request", onRequest);
  await catalog.getByRole("button", { name: "Close", exact: true }).first().click();
  await page.setViewportSize({ height: 1000, width: 1440 });
}
