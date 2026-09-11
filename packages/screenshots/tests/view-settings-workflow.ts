import type { Page } from "@playwright/test";
import { expect } from "./browser-test.js";
import { createDistributionStateFile, openImportDialog } from "./helpers.js";
import { exportState } from "./refined-editor-workflow.js";

export async function exerciseViewSettings(page: Page) {
  const imported = await openImportDialog(page, await createDistributionStateFile());
  await imported.getByRole("button", { name: "Replace state", exact: true }).click();
  await expect(imported).toBeHidden();
  await page.getByRole("tab", { name: "Editor", exact: true }).click();
  const card = page.locator('fieldset[aria-label="Canvas Unit Product"]');
  const footer = card.locator("[data-org-editor-unit-tag-footer]");
  const gear = page.getByRole("button", { name: "View settings", exact: true });
  const dialog = page.getByRole("dialog", { name: "View settings", exact: true });
  await expect(page.locator('[data-demo-id="unit-settings-action"]')).toHaveCount(0);
  await expect(footer).toBeVisible();
  const originalHeight = await card.evaluate((element) => element.clientHeight);
  await card.click({ button: "right", position: { x: 50, y: 40 } });
  await page.locator('[data-demo-id="org-editor-distribution-mode-action"]').click();
  const assigned = card.locator('[data-distribution-status="assigned"]').first();
  const sourceOnly = card.locator('[data-distribution-status="sourceOnly"]').first();
  await assigned.click();
  await expect(page.locator("[data-distribution-connection] path")).toHaveCount(1);
  const rowColor = () =>
    assigned.locator("..").evaluate((element) => getComputedStyle(element).backgroundColor);
  const originalColor = await rowColor();
  await gear.focus();
  await gear.press("Enter");
  await expect(dialog.getByRole("heading", { name: "Unit display" })).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "Distribution mode" })).toBeVisible();
  const cloud = dialog.getByRole("switch", { name: "Show Tag cloud" });
  await expect(cloud).toHaveAttribute("aria-checked", "true");
  await cloud.focus();
  await cloud.press("Space");
  await expect(footer).toBeHidden();
  expect(await card.evaluate((element) => element.clientHeight)).toBeLessThan(originalHeight);
  await expect(card.locator("[data-employee-tags-density]").first()).toBeVisible();

  await page.evaluate(() => {
    const originalPost = BroadcastChannel.prototype.postMessage;
    Reflect.set(window, "__settingsWrites", 0);
    BroadcastChannel.prototype.postMessage = function (value) {
      if (value?.type === "state")
        Reflect.set(
          window,
          "__settingsWrites",
          Number(Reflect.get(window, "__settingsWrites")) + 1,
        );
      originalPost.call(this, value);
    };
  });
  const writes = () => page.evaluate(() => Number(Reflect.get(window, "__settingsWrites")));
  const distributed = dialog.getByRole("button", { name: "Distributed", exact: true });
  await distributed.click();
  const picker = page.locator('[data-demo-id="tag-color-dropdown"]');
  await expect(picker.getByRole("option", { name: "No color", exact: true })).toHaveCount(0);
  const palette = picker.getByRole("slider", { name: "Choose custom color" });
  const bounds = await palette.boundingBox();
  if (!bounds) throw new Error("Missing palette bounds");
  await page.mouse.move(bounds.x + 15, bounds.y + 15);
  await page.mouse.down();
  await page.mouse.move(bounds.x + 90, bounds.y + 50, { steps: 5 });
  expect(await writes()).toBe(0);
  await page.mouse.up();
  await expect.poll(writes).toBe(1);
  await page.mouse.move(bounds.x + 40, bounds.y + 40);
  await page.mouse.down();
  await palette.dispatchEvent("pointercancel", { pointerId: 1 });
  await page.mouse.up();
  await page.keyboard.press("Escape");
  expect(await writes()).toBe(1);
  await expect(distributed).toBeFocused();
  await distributed.click();
  const exact = picker.getByRole("textbox", { name: "Color value" });
  await exact.fill("invalid");
  await exact.press("Enter");
  await expect(exact).toHaveAttribute("aria-invalid", "true");
  expect(await writes()).toBe(1);
  await exact.fill("#123456");
  await exact.press("Escape");
  expect(await writes()).toBe(1);
  await distributed.click();
  await exact.fill("#7c3aed");
  await exact.press("Enter");
  await expect.poll(writes).toBe(2);
  await page.keyboard.press("Escape");
  await expect.poll(rowColor).not.toBe(originalColor);
  const pathColor = () =>
    page
      .locator("[data-distribution-connection] path")
      .evaluate((path) => getComputedStyle(path).stroke);
  const lightPathColor = await pathColor();
  await expect
    .poll(() => assigned.locator("..").evaluate((element) => getComputedStyle(element).color))
    .toBe(lightPathColor);
  const rowForeground = lightPathColor;
  expect(
    await page
      .locator("[data-distribution-connection] circle")
      .evaluate((marker) => getComputedStyle(marker).fill),
  ).toBe(rowForeground);
  await dialog.getByRole("button", { name: "Not distributed", exact: true }).click();
  await picker.getByRole("option", { name: "Rose", exact: true }).click();
  await expect.poll(writes).toBe(3);
  await page.keyboard.press("Escape");
  await expect(gear).toBeFocused();
  await page.keyboard.press("Control+z");
  await gear.click();
  await expect(dialog.getByRole("button", { name: "Not distributed", exact: true })).toContainText(
    "Amber",
  );
  await page.keyboard.press("Escape");
  await page.keyboard.press("Control+Shift+z");

  await page.locator('[data-demo-id="theme-toggle"]').click();
  await page.locator('[data-demo-id="theme-dialog"] label:has(input[value="dark"])').click();
  await expect.poll(pathColor).not.toBe(lightPathColor);
  await expect
    .poll(() => assigned.locator("..").evaluate((element) => getComputedStyle(element).color))
    .toBe(await pathColor());
  expect(
    await sourceOnly.locator("..").evaluate((element) => getComputedStyle(element).backgroundColor),
  ).not.toBe(await rowColor());
  await page.locator('[data-demo-id="theme-toggle"]').click();
  await page.locator('[data-demo-id="theme-dialog"] label:has(input[value="light"])').click();

  // The PNG painter must not draw the hidden footer; row Tags remain painted.
  await page.evaluate(() => {
    const original = CanvasRenderingContext2D.prototype.fillText;
    Reflect.set(window, "__viewPaintedText", []);
    CanvasRenderingContext2D.prototype.fillText = function (text, x, y, maxWidth) {
      (Reflect.get(window, "__viewPaintedText") as string[]).push(text);
      if (maxWidth === undefined) original.call(this, text, x, y);
      else original.call(this, text, x, y, maxWidth);
    };
  });
  await card.click({ button: "right", position: { x: 50, y: 40 } });
  await page.locator('[data-demo-id="org-editor-export-action"]').click();
  const image = page.locator('[data-demo-id="org-editor-export-image"]');
  await expect(image).toBeVisible();
  const painted = await page.evaluate(() => Reflect.get(window, "__viewPaintedText") as string[]);
  expect(painted.some((text) => /· [0-9]+$/.test(text))).toBe(false);
  expect(painted.length).toBeGreaterThan(0);
  await page.keyboard.press("Escape");
  const saved = await exportState(page);
  expect(saved.organization.views[0]?.structure.settings).toEqual({
    groupByTag: true,
    showTagCloud: false,
    distributedColor: "#7c3aed",
    undistributedColor: "rose",
  });

  const peer = await page.context().newPage();
  // Delay SQLite hydration so a newer live-peer snapshot arrives first.
  await peer.route("**/api/state", async (route) => {
    if (route.request().method() !== "GET") return route.continue();
    const response = await route.fetch();
    await new Promise((resolve) => setTimeout(resolve, 200));
    await route.fulfill({ response });
  });
  await peer.goto(page.url(), { waitUntil: "domcontentloaded" });
  await peer.getByRole("tab", { name: "Editor", exact: true }).click();
  await peer.getByRole("button", { name: "View settings", exact: true }).click();
  await expect(peer.getByRole("switch", { name: "Show Tag cloud" })).toHaveAttribute(
    "aria-checked",
    "false",
  );
  await peer.getByRole("switch", { name: "Show Tag cloud" }).click();
  await expect(peer.getByRole("switch", { name: "Show Tag cloud" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await expect(footer).toBeVisible();
  await page.evaluate(() => Reflect.set(window, "__viewPaintedText", []));
  await card.click({ button: "right", position: { x: 50, y: 40 } });
  await page.locator('[data-demo-id="org-editor-export-action"]').click();
  await expect(image).toBeVisible();
  expect(
    await page.evaluate(() =>
      (Reflect.get(window, "__viewPaintedText") as string[]).some((text) => /· [0-9]+$/.test(text)),
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await gear.click();
  await peer.keyboard.press("Escape");
  await peer.getByRole("button", { name: "Create View", exact: true }).click();
  await peer.getByRole("textbox", { name: "View name" }).fill("Empty settings test");
  await peer.getByRole("button", { name: "Create", exact: true }).click();
  await expect(dialog).toBeHidden();
  await gear.click();
  await expect(dialog.getByRole("switch", { name: "Show Tag cloud" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await expect(dialog.getByRole("button", { name: "Distributed", exact: true })).toContainText(
    "Green",
  );
  await peer.getByRole("button", { name: "Delete View", exact: true }).click();
  await peer.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(card).toBeVisible();
  await peer.close();
  await page.setViewportSize({ width: 700, height: 380 });
  await gear.click();
  await dialog.getByRole("button", { name: "Not distributed", exact: true }).click();
  await picker.hover();
  await page.mouse.wheel(0, 1200);
  await expect.poll(() => picker.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await expect(picker.getByRole("option", { name: "Rose", exact: true })).toBeInViewport();
  expect(await page.evaluate(() => document.scrollingElement?.scrollTop)).toBe(0);
  await page.keyboard.press("Escape");
  await expect(dialog.getByRole("button", { name: "Not distributed", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(gear).toBeFocused();
  await page.setViewportSize({ width: 1440, height: 1000 });
  return saved.organization.views[0]?.structure.settings;
}
