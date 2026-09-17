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
  const positionContainer = position.locator("..");
  const positionOutline = positionContainer.locator("[data-org-editor-open-position-outline]");
  await expect(position).toContainText("Senior Product Engineer");
  await expect(position).toContainText("Remote");
  await expect(position).toContainText("Oct 1");
  await expect(position.locator("[data-org-editor-open-position-avatar]")).toBeVisible();
  await expect(positionContainer).toHaveAttribute("data-open-position-background", "amber");
  const restingBackgroundColor = await positionContainer.evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  );
  expect(restingBackgroundColor).not.toBe("rgba(0, 0, 0, 0)");
  await expect(positionOutline).toBeVisible();
  await expect(
    productUnit.locator(
      "[data-org-editor-employee-row-container] [data-org-editor-open-position-outline]",
    ),
  ).toHaveCount(0);
  const restingOutlineStyle = await positionOutline.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      backgroundColor: style.backgroundColor,
      borderColor: style.borderTopColor,
      borderStyle: style.borderTopStyle,
      borderWidth: style.borderTopWidth,
      pointerEvents: style.pointerEvents,
    };
  });
  expect(restingOutlineStyle).toMatchObject({
    backgroundColor: "rgba(0, 0, 0, 0)",
    borderStyle: "dashed",
    borderWidth: "1px",
    pointerEvents: "none",
  });
  const restingBounds = await positionContainer.boundingBox();
  if (!restingBounds) throw new Error("Open-position row geometry is unavailable.");

  await position.hover();
  await expect(positionOutline).toHaveCSS("border-top-style", "dashed");
  await position.focus();
  await expect(position).toBeFocused();
  expect(
    await positionContainer.evaluate((element) => getComputedStyle(element).boxShadow),
  ).not.toBe("none");
  await position.click();
  await expect(positionContainer).toHaveAttribute("data-selected", "true");
  await expect(positionOutline).toHaveClass(/border-primary-foreground\/70/u);
  expect(
    await positionContainer.evaluate((element) => getComputedStyle(element).backgroundColor),
  ).not.toBe(restingBackgroundColor);
  await expect(positionOutline).toHaveCSS("border-top-style", "dashed");
  const selectedBounds = await positionContainer.boundingBox();
  expect(selectedBounds?.x).toBeCloseTo(restingBounds.x, 4);
  expect(selectedBounds?.y).toBeCloseTo(restingBounds.y, 4);
  expect(selectedBounds?.width).toBeCloseTo(restingBounds.width, 4);
  expect(selectedBounds?.height).toBeCloseTo(restingBounds.height, 4);

  const sourceEmployee = page.locator('[data-org-editor-employee-row][title="Jordan Reed"]');
  const sourceBounds = await sourceEmployee.boundingBox();
  const targetBounds = await position.boundingBox();
  if (!sourceBounds || !targetBounds)
    throw new Error("Open-position drop geometry is unavailable.");
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
  await expect(positionContainer).toHaveAttribute("data-open-position-drop-target", "true");
  await expect(positionOutline).toHaveClass(/border-signal/u);
  await page.mouse.up();
  await expect(position).toHaveCount(0);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(position).toContainText("Senior Product Engineer");
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
  const backgroundControl = dialog.locator('[data-demo-id="org-editor-open-position-background"]');
  await expect(backgroundControl).toContainText("Amber");
  await backgroundControl.getByRole("button", { name: "Background color", exact: true }).click();
  await page
    .locator('[data-demo-id="tag-color-dropdown"]')
    .getByRole("option", { name: "Blue", exact: true })
    .click();
  await dialog.locator('[data-demo-id="org-editor-open-position-title"]').fill("Staff Engineer");
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  await expect(position).toContainText("Staff Engineer");
  await expect(positionContainer).toHaveAttribute("data-open-position-background", "blue");

  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(position).toContainText("Senior Product Engineer");
  await expect(positionContainer).toHaveAttribute("data-open-position-background", "amber");
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await expect(position).toContainText("Staff Engineer");
  await expect(positionContainer).toHaveAttribute("data-open-position-background", "blue");

  await position.click({ button: "right" });
  await page.getByRole("menuitem", { name: "Edit", exact: true }).click();
  dialog = page.getByRole("dialog");
  await dialog
    .locator('[data-demo-id="org-editor-open-position-background"]')
    .getByRole("button", { name: "Background color", exact: true })
    .click();
  await page
    .locator('[data-demo-id="tag-color-dropdown"]')
    .getByRole("option", { name: "No background", exact: true })
    .click();
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  await expect(positionContainer).toHaveAttribute("data-open-position-background", "none");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(positionContainer).toHaveAttribute("data-open-position-background", "blue");

  await position.click({ button: "right" });
  await page.getByRole("menuitem", { name: "Edit", exact: true }).click();
  dialog = page.getByRole("dialog");
  await dialog
    .locator('[data-demo-id="org-editor-open-position-background"]')
    .getByRole("button", { name: "Background color", exact: true })
    .click();
  await page
    .locator('[data-demo-id="tag-color-dropdown"]')
    .getByRole("option", { name: "Rose", exact: true })
    .click();
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(positionContainer).toHaveAttribute("data-open-position-background", "blue");

  await productUnit.click({ button: "right", position: { x: 80, y: 24 } });
  await page.getByRole("menuitem", { name: "Add open position", exact: true }).click();
  dialog = page.getByRole("dialog");
  await expect(dialog.locator('[data-demo-id="org-editor-open-position-title"]')).toHaveValue(
    "Open position",
  );
  await expect(
    dialog.locator('[data-demo-id="org-editor-open-position-background"]'),
  ).toContainText("No background");
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  await expect(productUnit.locator("[data-org-editor-open-position-row]")).toHaveCount(2);
  const added = productUnit
    .locator("[data-org-editor-open-position-row]")
    .filter({ hasText: "Open position" });
  await expect(added.locator("..")).toHaveAttribute("data-open-position-background", "none");
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
