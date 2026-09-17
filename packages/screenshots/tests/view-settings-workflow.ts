import type { Page } from "@playwright/test";
import { expect } from "./browser-test.js";
import {
  applyColorPickerDraft,
  createDistributionStateFile,
  expectUsedColorPalette,
  openImportDialog,
} from "./helpers.js";
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
  const nameColors = () =>
    card
      .locator("[data-org-editor-employee-content] > span:first-child")
      .evaluateAll((names) =>
        Array.from(new Set(names.map((name) => getComputedStyle(name).color))),
      );
  const normalNameColors = await nameColors();
  await card.click({ button: "right", position: { x: 50, y: 40 } });
  await page.locator('[data-demo-id="org-editor-distribution-mode-action"]').click();
  const assigned = card.locator('[data-distribution-status="assigned"]').first();
  const sourceOnly = card.locator('[data-distribution-status="sourceOnly"]').first();
  await assigned.click();
  await expect(page.locator("[data-distribution-connection] path")).toHaveCount(1);
  const rowColor = () =>
    assigned.locator("..").evaluate((element) => getComputedStyle(element).backgroundColor);
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
  await expect.poll(rowColor).toBe("rgb(215, 245, 226)");
  const originalColor = await rowColor();

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
  await expectUsedColorPalette(page);
  await expect(picker.getByRole("option", { name: "No color", exact: true })).toHaveCount(0);
  const palette = picker.getByRole("slider", { name: "Choose custom color" });
  const bounds = await palette.boundingBox();
  if (!bounds) throw new Error("Missing palette bounds");
  await page.mouse.move(bounds.x + 15, bounds.y + 15);
  await page.mouse.down();
  await page.mouse.move(bounds.x + 90, bounds.y + 50, { steps: 5 });
  expect(await writes()).toBe(0);
  await page.mouse.up();
  expect(await writes()).toBe(0);
  await page.mouse.move(bounds.x + 40, bounds.y + 40);
  await page.mouse.down();
  await palette.dispatchEvent("pointercancel", { pointerId: 1 });
  await page.mouse.up();
  await picker.getByRole("spinbutton", { name: "Opacity (%)", exact: true }).fill("40");
  expect(await writes()).toBe(0);
  await picker.getByRole("button", { name: "Cancel", exact: true }).click();
  expect(await writes()).toBe(0);
  expect(await rowColor()).toBe(originalColor);
  await expect(distributed).toBeFocused();
  await distributed.click();
  const exact = picker.getByRole("textbox", { name: "Color value" });
  await exact.fill("invalid");
  await exact.press("Enter");
  await expect(exact).toHaveAttribute("aria-invalid", "true");
  await expect(picker.getByRole("button", { name: "Apply", exact: true })).toBeDisabled();
  expect(await writes()).toBe(0);
  await exact.fill("#123456");
  await exact.press("Escape");
  expect(await writes()).toBe(0);
  await distributed.click();
  await exact.fill("#7c3aed");
  await applyColorPickerDraft(page, { opacity: 40 });
  await expect.poll(writes).toBe(1);
  await expect.poll(rowColor).not.toBe(originalColor);
  await expect.poll(rowColor).toBe("rgba(124, 58, 237, 0.4)");
  const pathColor = () =>
    page
      .locator("[data-distribution-connection] path")
      .evaluate((path) => getComputedStyle(path).stroke);
  const lightPathColor = await pathColor();
  await expect.poll(nameColors).toEqual(normalNameColors);
  expect(
    await page
      .locator("[data-distribution-connection] circle")
      .evaluate((marker) => getComputedStyle(marker).fill),
  ).toBe(lightPathColor);
  await dialog.getByRole("button", { name: "Not distributed", exact: true }).click();
  const usedColors = await expectUsedColorPalette(page, ["#334155"]);
  await usedColors.locator('[data-tag-color-used="#334155"]').click();
  expect(await writes()).toBe(1);
  await expect(picker.getByRole("spinbutton", { name: "Opacity (%)", exact: true })).toHaveValue(
    "100",
  );
  await applyColorPickerDraft(page);
  await expect.poll(writes).toBe(2);
  await expect.poll(nameColors).toEqual(normalNameColors);
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
    .poll(nameColors)
    .toEqual([await card.evaluate((element) => getComputedStyle(element).color)]);
  expect(await nameColors()).not.toEqual(normalNameColors);
  expect(
    await sourceOnly.locator("..").evaluate((element) => getComputedStyle(element).backgroundColor),
  ).not.toBe(await rowColor());
  await page.locator('[data-demo-id="theme-toggle"]').click();
  await page.locator('[data-demo-id="theme-dialog"] label:has(input[value="light"])').click();

  const normalizeCanvasColor = (element: Element, property: string) => {
    const context = document.createElement("canvas").getContext("2d");
    if (!context) throw new Error("Canvas color normalization is unavailable.");
    context.fillStyle = getComputedStyle(element).getPropertyValue(property);
    return String(context.fillStyle);
  };
  const assignedFill = await assigned
    .locator("..")
    .evaluate(normalizeCanvasColor, "background-color");
  const sourceOnlyFill = await sourceOnly
    .locator("..")
    .evaluate(normalizeCanvasColor, "background-color");
  const distributionStroke = await page
    .locator("[data-distribution-connection] path")
    .evaluate(normalizeCanvasColor, "stroke");

  // The PNG painter must draw persistent View tones but omit the hidden footer and transient paths.
  await page.evaluate(() => {
    const originalFill = CanvasRenderingContext2D.prototype.fill;
    const originalFillText = CanvasRenderingContext2D.prototype.fillText;
    const originalStroke = CanvasRenderingContext2D.prototype.stroke as (path?: Path2D) => void;
    Reflect.set(window, "__viewPaintedFills", []);
    Reflect.set(window, "__viewPaintedStrokes", []);
    Reflect.set(window, "__viewPaintedText", []);
    Reflect.set(window, "__viewPaintedTextStyles", []);
    CanvasRenderingContext2D.prototype.fill = function (...args) {
      (Reflect.get(window, "__viewPaintedFills") as string[]).push(String(this.fillStyle));
      return Reflect.apply(originalFill, this, args);
    };
    CanvasRenderingContext2D.prototype.fillText = function (text, x, y, maxWidth) {
      (Reflect.get(window, "__viewPaintedText") as string[]).push(text);
      (
        Reflect.get(window, "__viewPaintedTextStyles") as Array<{
          fillStyle: string;
          text: string;
        }>
      ).push({ fillStyle: String(this.fillStyle), text });
      if (maxWidth === undefined) originalFillText.call(this, text, x, y);
      else originalFillText.call(this, text, x, y, maxWidth);
    };
    CanvasRenderingContext2D.prototype.stroke = function (path?: Path2D) {
      (Reflect.get(window, "__viewPaintedStrokes") as string[]).push(String(this.strokeStyle));
      if (path) originalStroke.call(this, path);
      else originalStroke.call(this);
    };
  });
  await card.click({ button: "right", position: { x: 50, y: 40 } });
  await page.locator('[data-demo-id="org-editor-export-action"]').click();
  const exportDialog = page.getByRole("dialog", { name: "Export", exact: true });
  const image = page.locator('[data-demo-id="org-editor-export-image"]');
  await expect(image).toBeVisible();
  await page.evaluate(() => {
    Reflect.set(window, "__viewPaintedFills", []);
    Reflect.set(window, "__viewPaintedStrokes", []);
    Reflect.set(window, "__viewPaintedText", []);
    Reflect.set(window, "__viewPaintedTextStyles", []);
  });
  await exportDialog.getByRole("tab", { name: "Unit only", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(
        ({ assignedTone, sourceOnlyTone }) => {
          const fills = Reflect.get(window, "__viewPaintedFills") as string[];
          return {
            assigned: fills.includes(assignedTone),
            sourceOnly: fills.includes(sourceOnlyTone),
          };
        },
        { assignedTone: assignedFill, sourceOnlyTone: sourceOnlyFill },
      ),
    )
    .toEqual({ assigned: true, sourceOnly: true });
  const painted = await page.evaluate(() => Reflect.get(window, "__viewPaintedText") as string[]);
  expect(painted.some((text) => /· [0-9]+$/.test(text))).toBe(false);
  expect(painted.length).toBeGreaterThan(0);
  const imagePaint = await page.evaluate(() => ({
    fills: Reflect.get(window, "__viewPaintedFills") as string[],
    strokes: Reflect.get(window, "__viewPaintedStrokes") as string[],
    textStyles: Reflect.get(window, "__viewPaintedTextStyles") as Array<{
      fillStyle: string;
      text: string;
    }>,
  }));
  expect(imagePaint.fills).not.toContain(distributionStroke);
  expect(imagePaint.strokes).not.toContain(distributionStroke);
  expect(imagePaint.textStyles.find(({ text }) => text.startsWith("Avery Stone"))?.fillStyle).toBe(
    "#0f172a",
  );
  await page.keyboard.press("Escape");

  await card.click({ button: "right", position: { x: 50, y: 40 } });
  await page.locator('[data-demo-id="org-editor-distribution-mode-action"]').click();
  await page.evaluate(() => Reflect.set(window, "__viewPaintedFills", []));
  await card.click({ button: "right", position: { x: 50, y: 40 } });
  await page.locator('[data-demo-id="org-editor-export-action"]').click();
  await expect(image).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => (Reflect.get(window, "__viewPaintedFills") as string[]).length))
    .toBeGreaterThan(0);
  expect(
    await page.evaluate(
      (sourceOnlyTone) =>
        (Reflect.get(window, "__viewPaintedFills") as string[]).includes(sourceOnlyTone),
      sourceOnlyFill,
    ),
  ).toBe(false);
  await page.keyboard.press("Escape");
  await card.click({ button: "right", position: { x: 50, y: 40 } });
  await page.locator('[data-demo-id="org-editor-distribution-mode-action"]').click();
  const saved = await exportState(page);
  expect(saved.organization.views[0]?.structure.settings).toEqual({
    groupByTag: true,
    showTagCloud: false,
    distributedColor: "#7c3aed66",
    undistributedColor: "#334155",
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
  await picker.evaluate((element: HTMLElement) => {
    element.style.height = "180px";
    element.style.maxHeight = "180px";
  });
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
