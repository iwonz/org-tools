import { readFile } from "node:fs/promises";

import { expect, type Page } from "@playwright/test";

const ONE_PIXEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2R2sAAAAASUVORK5CYII=",
  "base64",
);

const centerOf = async (locator: ReturnType<Page["locator"]>) => {
  const box = await locator.boundingBox();
  if (!box) throw new Error("Canvas element geometry is unavailable.");
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
};

const documentCenterOf = (locator: ReturnType<Page["locator"]>) =>
  locator.evaluate((element: HTMLElement) => ({
    x: Number.parseFloat(element.style.left) + Number.parseFloat(element.style.width) / 2,
    y: Number.parseFloat(element.style.top) + Number.parseFloat(element.style.height) / 2,
  }));

export async function exerciseCanvasToolsAndViewExport(page: Page): Promise<void> {
  const externalRequests: string[] = [];
  const onRequest = (request: { url(): string }) => {
    const url = new URL(request.url());
    if (
      (url.protocol === "http:" || url.protocol === "https:") &&
      url.hostname !== "127.0.0.1" &&
      url.hostname !== "localhost"
    ) {
      externalRequests.push(url.href);
    }
  };
  page.on("request", onRequest);

  const canvas = page.locator('[data-demo-id="org-editor-canvas"]');
  const toolbar = page.locator('[data-demo-id="org-editor-canvas-tools"]');
  await expect(canvas).toBeVisible();
  await expect(toolbar).toBeVisible();
  const canvasBox = await canvas.boundingBox();
  if (!canvasBox) throw new Error("Editor canvas geometry is unavailable.");
  const point = (x: number, y: number) => ({ x: canvasBox.x + x, y: canvasBox.y + y });

  const textElements = canvas.locator('[data-canvas-element-type="text"]');
  const stickerElements = canvas.locator('[data-canvas-element-type="sticker"]');
  const arrowElements = canvas.locator('[data-canvas-element-type="arrow"]');
  const imageElements = canvas.locator('[data-canvas-element-type="image"]');
  const initialTextCount = await textElements.count();
  const initialStickerCount = await stickerElements.count();
  const initialArrowCount = await arrowElements.count();
  const initialImageCount = await imageElements.count();

  await toolbar.locator('[data-canvas-tool="text"]').click();
  await canvas.click({ position: { x: canvasBox.width - 150, y: canvasBox.height - 130 } });
  const editor = canvas.getByRole("textbox", { name: "Canvas element text", exact: true });
  await expect(editor).toBeFocused();
  await editor.fill("Browser-created canvas text that wraps without clipping");
  await editor.press("Escape");
  await expect(textElements).toHaveCount(initialTextCount + 1);

  await toolbar.locator('[data-canvas-tool="sticker"]').click();
  await canvas.click({ position: { x: canvasBox.width - 410, y: canvasBox.height - 150 } });
  await expect(editor).toBeFocused();
  await editor.fill("Browser sticker");
  await editor.press("Escape");
  await expect(stickerElements).toHaveCount(initialStickerCount + 1);

  await toolbar.locator('[data-canvas-tool="arrow"]').click();
  const arrowStart = point(Math.max(620, canvasBox.width * 0.48), canvasBox.height - 70);
  const arrowEnd = point(Math.max(820, canvasBox.width * 0.65), canvasBox.height - 90);
  await page.mouse.move(arrowStart.x, arrowStart.y);
  await page.mouse.down();
  await page.mouse.move(arrowEnd.x, arrowEnd.y, { steps: 4 });
  await page.mouse.up();
  await expect(arrowElements).toHaveCount(initialArrowCount + 1);

  await page.evaluate((bytes) => {
    const data = Uint8Array.from(atob(bytes), (character) => character.charCodeAt(0));
    const transfer = new DataTransfer();
    transfer.items.add(new File([data], "clipboard-image.png", { type: "image/png" }));
    document
      .querySelector('[data-demo-id="org-editor-canvas"]')
      ?.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, clipboardData: transfer }));
  }, ONE_PIXEL_PNG.toString("base64"));
  await expect(imageElements).toHaveCount(initialImageCount + 1);

  const createdTextId = await textElements.last().getAttribute("data-canvas-element-id");
  const createdStickerId = await stickerElements.last().getAttribute("data-canvas-element-id");
  if (!createdTextId || !createdStickerId)
    throw new Error("Created canvas identity is unavailable.");
  const createdText = canvas.locator(`[data-canvas-element-id="${createdTextId}"]`);
  const createdSticker = canvas.locator(`[data-canvas-element-id="${createdStickerId}"]`);
  const properties = page.locator('[data-demo-id="org-editor-canvas-properties"]');
  await createdText.click();
  await createdSticker.click({ modifiers: ["Control"] });
  const groupFrame = canvas.locator("[data-canvas-group-frame]");
  await expect(groupFrame).toBeVisible();
  await createdText.click();
  await expect(groupFrame).toBeHidden();
  await expect(createdText).toHaveClass(/outline-signal/);
  await expect(createdSticker).not.toHaveClass(/outline-signal/);
  await toolbar.locator('[data-canvas-tool="arrow"]').click();
  await expect(toolbar.locator('[data-canvas-tool="arrow"]')).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(toolbar.locator('[data-canvas-tool="select"]')).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await expect(properties).toBeHidden();
  await expect(createdText).not.toHaveClass(/outline-signal/);
  await toolbar.locator('[data-canvas-tool="select"]').click();

  await createdText.click({ button: "right" });
  const elementMenu = page.locator("[data-org-editor-context-menu]");
  await expect(
    elementMenu.getByRole("menuitem", { name: "Behind Units", exact: true }),
  ).toBeVisible();
  for (const action of [
    "Above Units",
    "Send to back",
    "Send backward",
    "Bring forward",
    "Bring to front",
    "Duplicate",
    "Delete",
  ]) {
    await expect(elementMenu.getByRole("menuitem", { name: action, exact: true })).toBeVisible();
  }
  await expect(elementMenu.getByRole("menuitem", { name: "Add Unit", exact: true })).toHaveCount(0);
  await elementMenu.getByRole("menuitem", { name: "Behind Units", exact: true }).click();
  await expect(createdText).toHaveAttribute("data-canvas-element-layer", "behindUnits");
  await createdText.click({ button: "right" });
  await elementMenu.getByRole("menuitem", { name: "Above Units", exact: true }).click();
  await expect(createdText).toHaveAttribute("data-canvas-element-layer", "aboveUnits");
  await expect(elementMenu).toBeHidden();

  await createdText.click();
  const resizeHandles = createdText.locator("[data-canvas-resize-handle]");
  const rotateHandles = createdText.locator("[data-canvas-rotate-handle]");
  await expect(resizeHandles).toHaveCount(8);
  await expect(rotateHandles).toHaveCount(4);
  expect(
    await properties.evaluate((element) => element.scrollWidth <= element.clientWidth + 1),
  ).toBe(true);
  const textBeforeResize = await createdText.boundingBox();
  const rightResize = await createdText
    .locator('[data-canvas-resize-handle="rightCenter"]')
    .boundingBox();
  if (!textBeforeResize || !rightResize) throw new Error("Text resize geometry is unavailable.");
  await page.mouse.move(
    rightResize.x + rightResize.width / 2,
    rightResize.y + rightResize.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    rightResize.x + rightResize.width / 2 + 72,
    rightResize.y + rightResize.height / 2,
    { steps: 4 },
  );
  await page.mouse.up();
  const textAfterResize = await createdText.boundingBox();
  expect((textAfterResize?.width ?? 0) - textBeforeResize.width).toBeGreaterThan(40);

  const textBeforeRotate = await centerOf(createdText);
  const textDocumentCenterBeforeRotate = await documentCenterOf(createdText);
  const rotateHandleLocator = createdText.locator('[data-canvas-rotate-handle="topRight"]');
  const rotateHandle = await rotateHandleLocator.boundingBox();
  if (!rotateHandle) throw new Error("Text rotation geometry is unavailable.");
  const rotateStart = {
    x: rotateHandle.x + rotateHandle.width / 2,
    y: rotateHandle.y + rotateHandle.height / 2,
  };
  const rotateVector = {
    x: rotateStart.x - textBeforeRotate.x,
    y: rotateStart.y - textBeforeRotate.y,
  };
  await rotateHandleLocator.hover();
  await page.mouse.down();
  await expect(canvas).toHaveAttribute("data-active-drag-type", "canvasElement");
  await page.mouse.move(textBeforeRotate.x - rotateVector.y, textBeforeRotate.y + rotateVector.x, {
    steps: 5,
  });
  await page.mouse.up();
  const textDocumentCenterAfterRotate = await documentCenterOf(createdText);
  expect(Math.abs(textDocumentCenterAfterRotate.x - textDocumentCenterBeforeRotate.x)).toBeLessThan(
    0.01,
  );
  expect(Math.abs(textDocumentCenterAfterRotate.y - textDocumentCenterBeforeRotate.y)).toBeLessThan(
    0.01,
  );
  expect(
    Math.abs(
      await createdText.evaluate((element) =>
        Number.parseFloat(element.style.transform.match(/-?\d+(?:\.\d+)?/)?.[0] ?? "0"),
      ),
    ),
  ).toBeGreaterThan(45);
  await page.keyboard.press("Control+z");
  await expect(properties).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(properties).toBeHidden();
  await expect(createdText).not.toHaveClass(/outline-signal/);

  await imageElements.last().click();
  await expect(
    imageElements.last().locator('[data-canvas-resize-handle="rightCenter"]'),
  ).toBeVisible();
  await expect(
    imageElements.last().locator('[data-canvas-rotate-handle="topRight"]'),
  ).toBeVisible();

  await createdText.click();
  await createdSticker.click({ modifiers: ["Control"] });
  await expect(groupFrame).toBeVisible();
  await expect(createdText).toHaveClass(/outline-signal/);
  await expect(createdSticker).toHaveClass(/outline-signal/);
  await expect(groupFrame.locator("[data-canvas-group-resize-handle]")).toHaveCount(8);
  await expect(groupFrame.locator("[data-canvas-group-rotate-handle]")).toHaveCount(4);
  const textBefore = await documentCenterOf(createdText);
  const stickerBefore = await documentCenterOf(createdSticker);
  const stickerScreenCenter = await centerOf(createdSticker);
  await page.mouse.move(stickerScreenCenter.x, stickerScreenCenter.y);
  await page.mouse.down();
  await expect(canvas).toHaveAttribute("data-active-drag-type", "canvasElement");
  await expect(groupFrame).toBeVisible();
  await page.mouse.move(stickerScreenCenter.x + 48, stickerScreenCenter.y + 48, { steps: 4 });
  await page.mouse.up();
  const textAfter = await documentCenterOf(createdText);
  const stickerAfter = await documentCenterOf(createdSticker);
  expect(textAfter.x - textBefore.x).toBeGreaterThan(24);
  expect(stickerAfter.x - stickerBefore.x).toBeGreaterThan(24);
  await page.keyboard.press("Control+z");

  const attachedSticker = canvas.locator(
    '[data-canvas-element-id="dddddddd-dddd-4ddd-8ddd-dddddddddddd"]',
  );
  const product = canvas.locator('fieldset[aria-label="Canvas Unit Product"]');
  const attachedBefore = await centerOf(attachedSticker);
  const productBox = await product.boundingBox();
  if (!productBox) throw new Error("Product Unit geometry is unavailable.");
  await page.mouse.move(productBox.x + 70, productBox.y + 30);
  await page.mouse.down();
  await page.mouse.move(productBox.x + 142, productBox.y + 30, { steps: 4 });
  await page.mouse.up();
  const attachedAfter = await centerOf(attachedSticker);
  expect(attachedAfter.x - attachedBefore.x).toBeGreaterThan(40);

  await attachedSticker.click();
  const attachedDocumentCenterBeforeRotate = await documentCenterOf(attachedSticker);
  const attachedScreenCenterBeforeRotate = await centerOf(attachedSticker);
  const attachedRotateHandle = attachedSticker.locator('[data-canvas-rotate-handle="topRight"]');
  const attachedRotateHandleBox = await attachedRotateHandle.boundingBox();
  if (!attachedRotateHandleBox)
    throw new Error("Attached Sticker rotation geometry is unavailable.");
  const attachedRotateStart = {
    x: attachedRotateHandleBox.x + attachedRotateHandleBox.width / 2,
    y: attachedRotateHandleBox.y + attachedRotateHandleBox.height / 2,
  };
  const attachedRotateVector = {
    x: attachedRotateStart.x - attachedScreenCenterBeforeRotate.x,
    y: attachedRotateStart.y - attachedScreenCenterBeforeRotate.y,
  };
  await attachedRotateHandle.hover();
  await page.mouse.down();
  await page.mouse.move(
    attachedScreenCenterBeforeRotate.x - attachedRotateVector.y,
    attachedScreenCenterBeforeRotate.y + attachedRotateVector.x,
    { steps: 5 },
  );
  await page.mouse.up();
  await expect
    .poll(async () => {
      const center = await documentCenterOf(attachedSticker);
      return Math.hypot(
        center.x - attachedDocumentCenterBeforeRotate.x,
        center.y - attachedDocumentCenterBeforeRotate.y,
      );
    })
    .toBeLessThan(0.01);
  await page.keyboard.press("Control+z");

  await createdText.click();
  await createdSticker.click({ modifiers: ["Control"] });
  await expect(groupFrame).toBeVisible();
  await toolbar.locator('[data-demo-id="org-editor-view-image-export-action"]').click();
  const dialog = page.locator('[data-demo-id="org-editor-view-image-export-dialog"]');
  await expect(dialog).toBeVisible();
  const preview = dialog.getByAltText("View export preview", { exact: true });
  await expect(preview).toBeVisible();
  await expect(dialog.locator('[data-demo-id="org-editor-view-image-dimensions"]')).toContainText(
    "px",
  );
  await dialog.locator('[data-demo-id="org-editor-view-image-density"]').click();
  await page.getByRole("option", { name: "3×", exact: true }).click();
  await expect(dialog.locator('[data-demo-id="org-editor-view-image-dimensions"]')).toContainText(
    "3.00×",
  );
  const employeeFormat = dialog.locator("#org-editor-view-image-employee-format");
  await employeeFormat.fill("@full");
  const suggestions = dialog.locator('[data-demo-id="template-token-suggestions"]');
  await expect(suggestions).toBeVisible();
  await suggestions.getByRole("option").filter({ hasText: "{fullName}" }).click();
  await expect(employeeFormat).toHaveValue("{fullName}");
  const formatHelp = dialog.getByRole("button", { name: "Token suggestions help", exact: true });
  await formatHelp.focus();
  await expect(dialog.getByRole("tooltip")).toContainText("{condition ? 'value' : 'fallback'}");
  await employeeFormat.fill("{isBoss ? 'Lead' : '{fullName}'}");
  await expect(preview).toBeVisible();
  const copyButton = dialog.getByRole("button", { name: "Copy", exact: true });
  const saveButton = dialog.getByRole("button", { name: "Save", exact: true });
  await expect(copyButton.locator("svg")).toHaveCount(1);
  await expect(saveButton.locator("svg")).toHaveCount(1);
  const downloadPromise = page.waitForEvent("download");
  await saveButton.click();
  const download = await downloadPromise;
  const path = await download.path();
  if (!path) throw new Error("View PNG download is unavailable.");
  const png = await readFile(path);
  expect([...png.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  const fullViewLogicalWidth =
    (await preview.evaluate((image: HTMLImageElement) => image.naturalWidth)) / 3;
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();

  await product.click({ button: "right", position: { x: 20, y: 20 } });
  await page.locator('[data-demo-id="org-editor-export-action"]').click();
  const unitDialog = page.locator('[data-demo-id="org-editor-export-dialog"]');
  await expect(unitDialog).toBeVisible();
  await unitDialog.getByRole("tab", { name: "Unit only", exact: true }).click();
  const unitPreview = unitDialog.getByAltText("Unit export preview", { exact: true });
  await expect(unitPreview).toBeVisible();
  const scopedImage = await unitPreview.evaluate((image: HTMLImageElement) => {
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d");
    if (!context) return { hasArrow: false, hasSticker: false, width: image.naturalWidth };
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let hasArrow = false;
    let hasSticker = false;
    for (let offset = 0; offset < pixels.length; offset += 4) {
      hasArrow ||=
        pixels[offset] === 59 && pixels[offset + 1] === 130 && pixels[offset + 2] === 246;
      hasSticker ||=
        pixels[offset] === 245 && pixels[offset + 1] === 158 && pixels[offset + 2] === 11;
      if (hasArrow && hasSticker) break;
    }
    return { hasArrow, hasSticker, width: image.naturalWidth };
  });
  expect(scopedImage.hasArrow).toBe(true);
  expect(scopedImage.hasSticker).toBe(true);
  expect(scopedImage.width / 2).toBeLessThan(fullViewLogicalWidth);
  await page.keyboard.press("Escape");

  page.off("request", onRequest);
  expect(externalRequests).toEqual([]);
}
