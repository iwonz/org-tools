import type { Page } from "@playwright/test";
import { expect } from "./browser-test.js";

export async function exerciseOpenPositions(page: Page) {
  const productUnit = page.locator(
    '[data-org-editor-unit-id="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"]',
  );
  const position = productUnit.locator(
    '[data-org-editor-open-position-id="abababab-abab-4aba-8aba-abababababab"]',
  );
  const attachedSticker = page.locator(
    '[data-canvas-element-id="dddddddd-dddd-4ddd-8ddd-dddddddddddd"]',
  );
  await expect(position).toContainText("Senior Product Engineer");
  await expect(position).toContainText("Remote");
  await expect(position).toContainText("Oct 1");
  await expect(position.locator("[data-org-editor-open-position-avatar]")).toBeVisible();
  await expect(productUnit).toContainText("2 Employees · 4 Employees total");

  await productUnit.click({ button: "right", position: { x: 80, y: 24 } });
  await page.getByRole("menuitem", { name: "Collapse", exact: true }).click();
  await expect(position).toHaveCount(0);
  await productUnit.click({ button: "right", position: { x: 80, y: 24 } });
  await page.getByRole("menuitem", { name: "Expand", exact: true }).click();
  await expect(position).toContainText("Senior Product Engineer");

  await position.click({ button: "right" });
  await page.getByRole("menuitem", { name: "Edit", exact: true }).click();
  let dialog = page.getByRole("dialog");
  await dialog.locator('[data-demo-id="org-editor-open-position-title"]').fill("Staff Engineer");
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  await expect(position).toContainText("Staff Engineer");

  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(position).toContainText("Senior Product Engineer");
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await expect(position).toContainText("Staff Engineer");

  await productUnit.click({ button: "right", position: { x: 80, y: 24 } });
  await page.getByRole("menuitem", { name: "Add open position", exact: true }).click();
  dialog = page.getByRole("dialog");
  await expect(dialog.locator('[data-demo-id="org-editor-open-position-title"]')).toHaveValue(
    "Open position",
  );
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  await expect(productUnit.locator("[data-org-editor-open-position-row]")).toHaveCount(2);
  const added = productUnit
    .locator("[data-org-editor-open-position-row]")
    .filter({ hasText: "Open position" });
  await added.click({ button: "right" });
  await page.getByRole("menuitem", { name: "Delete", exact: true }).click();
  await expect(productUnit.locator("[data-org-editor-open-position-row]")).toHaveCount(1);

  const attachedBounds = await attachedSticker.boundingBox();
  if (!attachedBounds) throw new Error("Attached Sticker geometry is unavailable.");
  await position.click({ button: "right" });
  await page.getByRole("menuitem", { name: "Replace with Employee", exact: true }).click();
  dialog = page.getByRole("dialog");
  const jordanCard = dialog
    .getByText("Jordan Reed", { exact: true })
    .locator("xpath=ancestor::article");
  await jordanCard.getByRole("button", { name: "Add", exact: true }).click();
  await dialog.getByRole("button", { name: "Add", exact: true }).last().click();
  await expect(position).toHaveCount(0);
  await expect(
    productUnit.locator('[data-org-editor-employee-row][title="Jordan Reed"]'),
  ).toBeVisible();
  const replacedBounds = await attachedSticker.boundingBox();
  expect(replacedBounds?.x).toBeCloseTo(attachedBounds.x, 0);
  expect(replacedBounds?.y).toBeCloseTo(attachedBounds.y, 0);

  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(position).toContainText("Staff Engineer");

  await position.click({ button: "right" });
  await page.getByRole("menuitem", { name: "Replace with Employee", exact: true }).click();
  dialog = page.getByRole("dialog");
  const averyCard = dialog
    .getByText("Avery Stone", { exact: true })
    .locator("xpath=ancestor::article");
  await averyCard.getByRole("button", { name: "Add", exact: true }).click();
  await dialog.getByRole("button", { name: "Add", exact: true }).last().click();
  await expect(position).toHaveCount(0);
  await expect(
    productUnit.locator('[data-org-editor-employee-row][title="Avery Stone"]'),
  ).toHaveCount(1);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(position).toContainText("Staff Engineer");

  await page.getByRole("tab", { name: "Employees", exact: true }).click();
  await page
    .getByRole("searchbox", { name: "Search Employees", exact: true })
    .fill("Staff Engineer");
  await expect(page.locator('[data-demo-id="employees-match-count"]')).toContainText("0 matches");
}
