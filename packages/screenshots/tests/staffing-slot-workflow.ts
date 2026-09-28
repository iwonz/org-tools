import type { Locator, Page } from "@playwright/test";
import { expect } from "./browser-test.js";

const PRODUCT_UNIT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const PLATFORM_UNIT_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const SEEDED_SLOT_ID = "abababab-abab-4aba-8aba-abababababab";

const expectUnitRowSpacing = async (unit: Locator, expectedCount: number) => {
  const rows = unit.locator(
    "[data-org-editor-employee-row-container], [data-org-editor-staffing-slot-row-container]",
  );
  await expect(rows).toHaveCount(expectedCount);
  const geometry = await rows.evaluateAll((elements) => {
    const rects = elements.map((element) => element.getBoundingClientRect());
    const stack = elements[0]?.parentElement;
    if (!stack) throw new Error("Editor row stack is unavailable.");
    const stackRect = stack.getBoundingClientRect();
    const style = getComputedStyle(stack);
    return {
      bottomInset:
        stackRect.bottom -
        Number.parseFloat(style.paddingBottom || "0") -
        (rects.at(-1)?.bottom ?? stackRect.bottom),
      gaps: rects.slice(1).map((rect, index) => rect.top - (rects[index]?.bottom ?? rect.top)),
      topInset:
        (rects[0]?.top ?? stackRect.top) -
        stackRect.top -
        Number.parseFloat(style.paddingTop || "0"),
    };
  });
  expect(geometry.topInset).toBeCloseTo(0, 4);
  expect(geometry.bottomInset).toBeCloseTo(0, 4);
  for (const gap of geometry.gaps) expect(gap).toBeCloseTo(4, 4);
};

const dragCenterToCenter = async (page: Page, source: Locator, target: Locator) => {
  const sourceBounds = await source.boundingBox();
  const targetBounds = await target.boundingBox();
  if (!sourceBounds || !targetBounds) throw new Error("Editor drag geometry is unavailable.");
  await page.mouse.move(
    sourceBounds.x + sourceBounds.width / 2,
    sourceBounds.y + sourceBounds.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    targetBounds.x + targetBounds.width / 2,
    targetBounds.y + targetBounds.height / 2,
    { steps: 8 },
  );
  await page.mouse.up();
};

export async function exerciseStaffingSlots(page: Page) {
  const productUnit = page.locator(`[data-org-editor-unit-id="${PRODUCT_UNIT_ID}"]`);
  const platformUnit = page.locator(`[data-org-editor-unit-id="${PLATFORM_UNIT_ID}"]`);
  const seededSlot = productUnit.locator(`[data-org-editor-staffing-slot-id="${SEEDED_SLOT_ID}"]`);
  const attachedSticker = page.locator(
    '[data-canvas-element-id="dddddddd-dddd-4ddd-8ddd-dddddddddddd"]',
  );

  await expect(seededSlot).toContainText("Senior Product Engineer");
  await expect(seededSlot).toContainText("Remote");
  await expect(seededSlot).toContainText("Oct 1");
  await expect(seededSlot.locator("[data-org-editor-staffing-slot-avatar]")).toBeVisible();
  await expect(
    seededSlot.locator("..").locator("[data-org-editor-staffing-slot-outline]"),
  ).toHaveCSS("border-top-style", "dashed");
  await expectUnitRowSpacing(productUnit, 3);
  await expect(productUnit.locator("[data-org-editor-unit-header]")).toContainText(
    "Total: 4 Employees · 1 staffing slot",
  );
  await expect(productUnit.locator("[data-org-editor-unit-header]")).toContainText(
    "In Unit: 2 Employees · 1 staffing slot",
  );
  await expect(platformUnit.locator("[data-org-editor-unit-header]")).toContainText(
    "2 Employees · 0 staffing slots",
  );

  await seededSlot.click({ button: "right" });
  const slotMenu = page.getByRole("menu");
  await expect(slotMenu.getByRole("menuitem", { name: "Edit", exact: true })).toBeVisible();
  await expect(slotMenu.getByRole("menuitem", { name: "Delete", exact: true })).toBeVisible();
  await expect(slotMenu.getByRole("menuitem")).toHaveCount(2);
  await slotMenu.getByRole("menuitem", { name: "Edit", exact: true }).click();
  let dialog = page.getByRole("dialog");
  const nameInput = dialog.locator('[data-demo-id="org-editor-staffing-slot-name"]');
  await expect(nameInput).toHaveValue("Senior Product Engineer");
  await expect(dialog.locator('[data-demo-id="org-editor-staffing-slot-background"]')).toHaveCount(
    0,
  );
  await nameInput.fill("  Staff   Engineer  ");
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  await expect(seededSlot).toContainText("Staff Engineer");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(seededSlot).toContainText("Senior Product Engineer");
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await expect(seededSlot).toContainText("Staff Engineer");

  await productUnit.click({ button: "right", position: { x: 80, y: 24 } });
  await page.getByRole("menuitem", { name: "Add staffing slot", exact: true }).click();
  dialog = page.getByRole("dialog");
  await expect(dialog.locator('[data-demo-id="org-editor-staffing-slot-name"]')).toHaveValue("");
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  const productSlots = productUnit.locator("[data-org-editor-staffing-slot-row]");
  await expect(productSlots).toHaveCount(2);
  const unnamedSlot = productSlots.filter({ hasText: "Staffing slot" });
  await expect(unnamedSlot).toHaveCount(1);
  await expect(productUnit.locator("[data-org-editor-unit-header]")).toContainText(
    "Total: 4 Employees · 2 staffing slots",
  );

  const jordan = platformUnit.locator('[data-org-editor-employee-row][title="Jordan Reed"]');
  await dragCenterToCenter(page, jordan, seededSlot);
  await expect(seededSlot).toBeVisible();
  await expect(
    productUnit.locator('[data-org-editor-employee-row][title="Jordan Reed"]'),
  ).toBeVisible();
  await expect(
    platformUnit.locator('[data-org-editor-employee-row][title="Jordan Reed"]'),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(
    platformUnit.locator('[data-org-editor-employee-row][title="Jordan Reed"]'),
  ).toBeVisible();

  const stickerBeforeMove = await attachedSticker.boundingBox();
  await seededSlot.click();
  await unnamedSlot.click({ modifiers: ["ControlOrMeta"] });
  await dragCenterToCenter(page, seededSlot, platformUnit);
  await expect(productUnit.locator("[data-org-editor-staffing-slot-row]")).toHaveCount(0);
  await expect(platformUnit.locator("[data-org-editor-staffing-slot-row]")).toHaveCount(2);
  const stickerAfterMove = await attachedSticker.boundingBox();
  expect(stickerAfterMove?.y).not.toBeCloseTo(stickerBeforeMove?.y ?? 0, 0);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(productUnit.locator("[data-org-editor-staffing-slot-row]")).toHaveCount(2);
  await expect(platformUnit.locator("[data-org-editor-staffing-slot-row]")).toHaveCount(0);
  const stickerAfterUndo = await attachedSticker.boundingBox();
  expect(stickerAfterUndo?.x).toBeCloseTo(stickerBeforeMove?.x ?? 0, 0);
  expect(stickerAfterUndo?.y).toBeCloseTo(stickerBeforeMove?.y ?? 0, 0);

  await platformUnit.click({ button: "right", position: { x: 80, y: 24 } });
  await page.getByRole("menuitem", { name: "Edit Unit", exact: true }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByRole("tab", { name: "Live", exact: true }).click();
  await dialog.getByRole("searchbox", { name: "Live Employee filter", exact: true }).fill("Jordan");
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  const confirmation = page.locator('[data-demo-id="unit-mode-confirmation"]');
  await confirmation.getByRole("button", { name: "Change mode", exact: true }).click();
  await expect(platformUnit).toContainText("Live");

  await platformUnit.click({ button: "right", position: { x: 80, y: 24 } });
  await page.getByRole("menuitem", { name: "Add staffing slot", exact: true }).click();
  dialog = page.getByRole("dialog");
  await dialog.locator('[data-demo-id="org-editor-staffing-slot-name"]').fill("Live capacity");
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  const liveSlot = platformUnit
    .locator("[data-org-editor-staffing-slot-row]")
    .filter({ hasText: "Live capacity" });
  await expect(liveSlot).toBeVisible();
  await expect(platformUnit.locator("[data-org-editor-unit-header]")).toContainText(
    "1 Employee · 1 staffing slot",
  );
  await liveSlot.click({ button: "right" });
  await page.getByRole("menuitem", { name: "Delete", exact: true }).click();
  await expect(liveSlot).toHaveCount(0);

  await productUnit.click({ button: "right", position: { x: 80, y: 24 } });
  await page.getByRole("menuitem", { name: "Collapse", exact: true }).click();
  await expect(productUnit.locator("[data-org-editor-staffing-slot-row]")).toHaveCount(0);
  await productUnit.click({ button: "right", position: { x: 80, y: 24 } });
  await page.getByRole("menuitem", { name: "Expand", exact: true }).click();
  await expect(productUnit.locator("[data-org-editor-staffing-slot-row]")).toHaveCount(2);

  await page.getByRole("tab", { name: "Employees", exact: true }).click();
  await page
    .getByRole("searchbox", { name: "Search Employees", exact: true })
    .fill("Staff Engineer");
  await expect(page.locator('[data-demo-id="employees-match-count"]')).toContainText("0 matches");
}
