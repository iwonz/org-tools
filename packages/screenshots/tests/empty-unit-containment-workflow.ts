import type { Locator, Page } from "@playwright/test";
import { expect } from "./browser-test.js";

const EMPTY_UNIT_NAME = "Empty capacity";
const EMPTY_UNIT_HEIGHT = 128;
const COLLAPSED_UNIT_HEIGHT = 88;
const IMAGE_PADDING = 20;
const IMAGE_DENSITY = 3;

const expectEmptyStateContained = async (
  emptyState: Locator,
  expectedHeight = EMPTY_UNIT_HEIGHT,
) => {
  await expect(emptyState).toBeVisible();
  const geometry = await emptyState.evaluate((element) => {
    const unitElement = element.closest("[data-org-editor-unit-id]");
    if (!(unitElement instanceof HTMLElement)) throw new Error("Unit container is unavailable.");
    const unitBounds = unitElement.getBoundingClientRect();
    const contentBounds = element.getBoundingClientRect();
    const headerElement = unitElement.querySelector<HTMLElement>("[data-org-editor-unit-header]");
    if (!headerElement) throw new Error("Unit header is unavailable.");
    return {
      contentBottom: contentBounds.bottom,
      contentTop: contentBounds.top,
      headerBottom: headerElement.getBoundingClientRect().bottom,
      height: Number.parseFloat(getComputedStyle(unitElement).height),
      unitBottom: unitBounds.bottom,
      unitTop: unitBounds.top,
    };
  });

  expect(geometry.height).toBe(expectedHeight);
  expect(geometry.contentTop).toBeCloseTo(geometry.headerBottom, 4);
  expect(geometry.contentTop).toBeGreaterThanOrEqual(geometry.unitTop - 0.5);
  expect(geometry.contentBottom).toBeLessThanOrEqual(geometry.unitBottom + 0.5);
};

const zoomInTwice = async (page: Page) => {
  const zoomIn = page.getByRole("button", { name: "Zoom in", exact: true });
  await zoomIn.click();
  await zoomIn.click();
  await expect(page.getByRole("button", { name: "Reset zoom", exact: true })).toContainText("121%");
};

const resetZoom = async (page: Page) => {
  await page.getByRole("button", { name: "Reset zoom", exact: true }).click();
  await expect(page.getByRole("button", { name: "Reset zoom", exact: true })).toContainText("100%");
};

const installCanvasTextRecorder = async (page: Page) => {
  await page.evaluate(() => {
    const paintedTexts: string[] = [];
    Reflect.set(window, "__emptyUnitPaintedTexts", paintedTexts);
    const originalFillText = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (text, x, y, maxWidth) {
      paintedTexts.push(text);
      return maxWidth === undefined
        ? Reflect.apply(originalFillText, this, [text, x, y])
        : Reflect.apply(originalFillText, this, [text, x, y, maxWidth]);
    };
  });
};

const expectPreviewHeight = async (preview: Locator) => {
  await expect(preview).toBeVisible();
  await expect
    .poll(() => preview.evaluate((image: HTMLImageElement) => image.naturalHeight))
    .toBe((EMPTY_UNIT_HEIGHT + IMAGE_PADDING * 2) * IMAGE_DENSITY);
};

const getPaintedTexts = (page: Page) =>
  page.evaluate(() => Reflect.get(window, "__emptyUnitPaintedTexts") as string[]);

export async function exerciseEmptyUnitContainment(page: Page) {
  await page.locator('[data-demo-id="org-editor-empty-canvas-add"]').click();
  await page.getByRole("menuitem", { name: "Add Unit", exact: true }).click();
  let dialog = page.getByRole("dialog", { name: "Add Unit", exact: true });
  await dialog.getByLabel("Name", { exact: true }).fill(EMPTY_UNIT_NAME);
  await dialog.getByRole("button", { name: "Save", exact: true }).click();

  const unit = page.locator(`fieldset[aria-label="Canvas Unit ${EMPTY_UNIT_NAME}"]`);
  const manualAction = unit.locator('[data-demo-id="org-editor-empty-manual-action"]');
  await expectEmptyStateContained(manualAction);

  await zoomInTwice(page);
  await expectEmptyStateContained(manualAction);
  await unit.hover();
  await unit.getByRole("button", { name: "Add child Unit", exact: true }).click();
  dialog = page.getByRole("dialog", { name: "Add Unit", exact: true });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await resetZoom(page);

  await installCanvasTextRecorder(page);
  await page.getByRole("button", { name: "Export image", exact: true }).click();
  let exportDialog = page.locator('[data-demo-id="org-editor-view-image-export-dialog"]');
  await expectPreviewHeight(exportDialog.getByAltText("View export preview", { exact: true }));
  await expect.poll(() => getPaintedTexts(page)).not.toContain("Edit Unit");
  await page.keyboard.press("Escape");

  await manualAction.click();
  dialog = page.getByRole("dialog", { name: "Edit Unit", exact: true });
  await dialog.getByRole("tab", { name: "Live", exact: true }).click();
  await dialog
    .getByRole("searchbox", { name: "Live Employee filter", exact: true })
    .fill("No matching employee");
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  const confirmation = page.locator('[data-demo-id="unit-mode-confirmation"]');
  if (await confirmation.isVisible()) {
    await confirmation.getByRole("button", { name: "Change mode", exact: true }).click();
  }

  const liveMessage = unit.locator('[data-demo-id="org-editor-empty-live-message"]');
  await expectEmptyStateContained(liveMessage);
  await zoomInTwice(page);
  await expectEmptyStateContained(liveMessage);
  await resetZoom(page);

  await unit.click({ button: "right", position: { x: 64, y: 24 } });
  await page.getByRole("menuitem", { name: "Collapse", exact: true }).click();
  await expect(liveMessage).toHaveCount(0);
  await expect
    .poll(() => unit.evaluate((element) => Number.parseFloat(getComputedStyle(element).height)))
    .toBe(COLLAPSED_UNIT_HEIGHT);
  await unit.click({ button: "right", position: { x: 64, y: 24 } });
  await page.getByRole("menuitem", { name: "Expand", exact: true }).click();
  await expectEmptyStateContained(liveMessage);

  await page.evaluate(() => Reflect.set(window, "__emptyUnitPaintedTexts", []));
  await unit.click({ button: "right", position: { x: 64, y: 24 } });
  await page.locator('[data-demo-id="org-editor-export-action"]').click();
  exportDialog = page.locator('[data-demo-id="org-editor-export-dialog"]');
  await expectPreviewHeight(exportDialog.getByAltText("Unit export preview", { exact: true }));
  await expect.poll(() => getPaintedTexts(page)).not.toContain("No Live filter matches");
  await page.keyboard.press("Escape");
}
