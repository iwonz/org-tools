import { readFile } from "node:fs/promises";

import type { OrgToolsState } from "@org-tools/types";
import { expect, type Page } from "@playwright/test";
import { openImportDialog, syntheticStatePath } from "./helpers.js";

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
  const additiveSelectionModifier = process.platform === "darwin" ? "Meta" : "Control";
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
  const properties = page.locator('[data-demo-id="org-editor-canvas-properties"]');
  const initialTextCount = await textElements.count();
  const initialStickerCount = await stickerElements.count();
  const initialArrowCount = await arrowElements.count();
  const initialImageCount = await imageElements.count();

  await toolbar.locator('[data-canvas-tool="text"]').click();
  await canvas.click({ position: { x: canvasBox.width - 220, y: canvasBox.height - 130 } });
  const editor = canvas.getByRole("textbox", { name: "Canvas element text", exact: true });
  await expect(editor).toBeFocused();
  await editor.fill("Browser-created canvas text that wraps without clipping");
  await editor.press("Escape");
  await expect(textElements).toHaveCount(initialTextCount + 1);
  await expect(editor).toBeHidden();
  expect(await canvas.evaluate((element) => [element.scrollLeft, element.scrollTop])).toEqual([
    0, 0,
  ]);
  await expect(properties).toBeVisible();
  await expect(properties).toHaveCSS("height", "48px");
  await page.keyboard.press("Escape");
  await expect(properties).toBeHidden();

  await toolbar.locator('[data-canvas-tool="sticker"]').click();
  await canvas.click({ position: { x: canvasBox.width - 410, y: canvasBox.height - 150 } });
  await expect(editor).toBeFocused();
  await editor.fill("Browser sticker");
  await editor.press("Escape");
  await expect(stickerElements).toHaveCount(initialStickerCount + 1);
  await expect(properties).toBeVisible();
  await expect(stickerElements.last().locator("[data-canvas-sticker-paper]")).toHaveCount(1);
  await expect(stickerElements.last().locator("[data-canvas-sticker-fold]")).toHaveCount(0);
  await expect(stickerElements.last().locator("[data-canvas-sticker-paper]")).toHaveCSS(
    "border-radius",
    "4px",
  );
  await expect(stickerElements.last().locator("[data-canvas-sticker-paper]")).toHaveCSS(
    "box-shadow",
    "none",
  );
  const createdStickerNode = stickerElements.last();
  const stickerHeightBeforeDraft = Number.parseFloat(
    await createdStickerNode.evaluate((element: HTMLElement) => element.style.height),
  );
  const restingStickerTextTop = Number.parseFloat(
    await createdStickerNode
      .locator("span")
      .first()
      .evaluate((element: HTMLElement) => element.style.top),
  );
  await createdStickerNode.dblclick();
  await expect(editor).toBeFocused();
  const editingStickerTextTop = Number.parseFloat(
    await editor.evaluate((element: HTMLTextAreaElement) => element.style.top),
  );
  expect(Math.abs(editingStickerTextTop - restingStickerTextTop)).toBeLessThan(0.01);
  const overflowStickerText = Array.from({ length: 12 }, (_, index) => `Line ${index + 1}`).join(
    "\n",
  );
  await editor.fill(overflowStickerText);
  await expect
    .poll(() =>
      createdStickerNode.evaluate((element: HTMLElement) =>
        Number.parseFloat(element.style.height),
      ),
    )
    .toBeGreaterThan(stickerHeightBeforeDraft);
  const transientStickerHeight = Number.parseFloat(
    await createdStickerNode.evaluate((element: HTMLElement) => element.style.height),
  );
  await editor.press("Escape");
  await expect(createdStickerNode).toHaveAttribute("data-canvas-element-text", overflowStickerText);
  await expect
    .poll(() =>
      createdStickerNode.evaluate((element: HTMLElement) =>
        Number.parseFloat(element.style.height),
      ),
    )
    .toBe(transientStickerHeight);
  await page.keyboard.press("Control+z");
  await expect(createdStickerNode).toHaveAttribute("data-canvas-element-text", "Browser sticker");
  await expect
    .poll(() =>
      createdStickerNode.evaluate((element: HTMLElement) =>
        Number.parseFloat(element.style.height),
      ),
    )
    .toBe(stickerHeightBeforeDraft);
  await page.keyboard.press("Control+Shift+z");
  await expect(createdStickerNode).toHaveAttribute("data-canvas-element-text", overflowStickerText);
  await page.keyboard.press("Control+z");
  await expect(createdStickerNode).toHaveAttribute("data-canvas-element-text", "Browser sticker");

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
  await expect(page.locator('[data-demo-id="org-editor-view-image-export-action"]')).toHaveCSS(
    "font-weight",
    "400",
  );

  const initialCommittedText = await createdText.getAttribute("data-canvas-element-text");
  await createdText.dblclick();
  await expect(editor).toBeFocused();
  await editor.fill("Committed before selecting another element");
  await createdSticker.click();
  await expect(editor).toBeHidden();
  await expect(createdText).toHaveAttribute(
    "data-canvas-element-text",
    "Committed before selecting another element",
  );
  await expect(createdText).toHaveCSS("outline-style", "none");
  await expect(createdSticker).toHaveCSS("outline-style", "solid");
  await page.keyboard.press("Control+z");
  await expect(createdText).toHaveAttribute("data-canvas-element-text", initialCommittedText ?? "");
  await page.keyboard.press("Control+Shift+z");
  await expect(createdText).toHaveAttribute(
    "data-canvas-element-text",
    "Committed before selecting another element",
  );

  await createdText.dblclick();
  await expect(editor).toBeFocused();
  await editor.fill("Committed before an empty-canvas click");
  await canvas.click({ position: { x: canvasBox.width - 24, y: canvasBox.height / 2 } });
  await expect(editor).toBeHidden();
  await expect(createdText).toHaveAttribute(
    "data-canvas-element-text",
    "Committed before an empty-canvas click",
  );
  await expect(properties).toBeHidden();

  await createdText.dblclick();
  await expect(editor).toBeFocused();
  await editor.fill("Committed before using properties");
  await properties.getByRole("button", { name: "Geometry", exact: true }).click();
  await page.getByLabel("Element width", { exact: true }).click();
  await expect(editor).toBeVisible();
  await expect(properties).toBeVisible();
  await expect(createdText).toHaveCSS("outline-style", "solid");
  await canvas.click({ position: { x: canvasBox.width - 24, y: canvasBox.height / 2 } });
  await expect(editor).toBeHidden();
  await createdText.click();
  await expect(createdText).toHaveAttribute(
    "data-canvas-element-text",
    "Committed before using properties",
  );

  await createdText.dblclick();
  await editor.fill("Committed by Escape");
  await editor.press("Escape");
  await expect(editor).toBeHidden();
  await expect(properties).toBeVisible();
  await expect(createdText).toHaveCSS("outline-style", "solid");
  await page.keyboard.press("Escape");
  await expect(properties).toBeHidden();

  await createdText.click();
  await createdSticker.click({ modifiers: [additiveSelectionModifier] });
  const groupFrame = canvas.locator("[data-canvas-group-frame]");
  await expect(groupFrame).toBeVisible();
  await createdText.click();
  await expect(groupFrame).toBeHidden();
  await expect(createdText).toHaveCSS("outline-style", "solid");
  await expect(createdSticker).toHaveCSS("outline-style", "none");
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
  await expect(createdText).toHaveCSS("outline-style", "none");
  await toolbar.locator('[data-canvas-tool="select"]').click();

  await createdText.click({ button: "right" });
  const elementMenu = page.locator("[data-org-editor-context-menu]");
  for (const action of ["Send to back", "Bring to front", "Duplicate", "Delete"]) {
    await expect(elementMenu.getByRole("menuitem", { name: action, exact: true })).toBeVisible();
  }
  await expect(
    elementMenu.getByRole("menuitem", { name: "Send backward", exact: true }),
  ).toHaveCount(0);
  await expect(
    elementMenu.getByRole("menuitem", { name: "Bring forward", exact: true }),
  ).toHaveCount(0);
  await expect(
    elementMenu.getByRole("menuitem", { name: "Behind Units", exact: true }),
  ).toHaveCount(0);
  await expect(elementMenu.getByRole("menuitem", { name: "Above Units", exact: true })).toHaveCount(
    0,
  );
  await expect(elementMenu.getByRole("menuitem", { name: "Add Unit", exact: true })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(elementMenu).toBeHidden();

  await createdText.click();
  const resizeHandles = createdText.locator("[data-canvas-resize-handle]");
  const rotateHandles = createdText.locator("[data-canvas-rotate-handle]");
  await expect(resizeHandles).toHaveCount(6);
  await expect(rotateHandles).toHaveCount(4);
  await expect(createdText.locator('[data-canvas-transform-handle="corner-resize"]')).toHaveCount(
    4,
  );
  await expect(createdText.locator('[data-canvas-transform-handle="side-resize"]')).toHaveCount(2);
  await expect(createdText.locator("[data-canvas-connector-handle]")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Lock aspect ratio", exact: true })).toHaveCount(0);
  await expect(properties.getByLabel("Layer", { exact: true })).toHaveCount(0);
  expect(
    await properties.evaluate((element) => element.scrollWidth <= element.clientWidth + 1),
  ).toBe(true);
  await properties.getByRole("button", { name: "Geometry", exact: true }).click();
  const widthInput = page.getByLabel("Element width", { exact: true });
  const heightInput = page.getByLabel("Element height", { exact: true });
  await expect(widthInput).toHaveAttribute("step", "1");
  await expect(heightInput).toHaveCount(0);
  expect(Number.isInteger(Number(await widthInput.inputValue()))).toBe(true);

  await createdText.hover();
  await expect(canvas.locator("[data-canvas-target-anchor]")).toHaveCount(0);

  await properties.getByLabel("Font", { exact: true }).click();
  await expect(page.getByRole("option")).toHaveCount(5);
  for (const font of ["System", "Georgia", "Bebas Neue", "Lobster", "Montserrat"]) {
    await expect(page.getByRole("option", { name: font, exact: true })).toBeVisible();
  }
  await page.getByRole("option", { name: "Georgia", exact: true }).click();
  await expect(createdText).toHaveAttribute("data-canvas-font-family", "Georgia");
  await expect(createdText.locator('span[style*="font-family"]').first()).toHaveCSS(
    "font-family",
    /Georgia/,
  );
  const boldButton = properties.getByRole("button", { name: "Bold", exact: true });
  await expect(boldButton).toHaveAttribute("aria-pressed", "false");
  await boldButton.click();
  await expect(boldButton).toHaveAttribute("aria-pressed", "true");
  await expect(createdText.locator('span[style*="font-family"]').first()).toHaveCSS(
    "font-weight",
    "700",
  );
  await boldButton.click();
  await expect(boldButton).toHaveAttribute("aria-pressed", "false");
  const textBackgroundControl = properties.getByLabel("Text background", { exact: true });
  const alignmentControl = properties.getByRole("button", { name: "Alignment", exact: true });
  const [textBackgroundBox, alignmentBox] = await Promise.all([
    textBackgroundControl.boundingBox(),
    alignmentControl.boundingBox(),
  ]);
  if (!textBackgroundBox || !alignmentBox) {
    throw new Error("Text property geometry is unavailable.");
  }
  const alignmentHitLabel = await page.evaluate(
    ({ x, y }) =>
      document.elementFromPoint(x, y)?.closest("button")?.getAttribute("aria-label") ?? null,
    { x: alignmentBox.x + alignmentBox.width / 2, y: alignmentBox.y + alignmentBox.height / 2 },
  );
  expect(alignmentBox.x).toBeGreaterThanOrEqual(textBackgroundBox.x + textBackgroundBox.width);
  expect(alignmentBox.width).toBe(36);
  expect(alignmentHitLabel).toBe("Alignment");
  await alignmentControl.click();
  await expect(page.locator("[data-canvas-alignment]")).toHaveCount(3);
  await page.locator('[data-canvas-alignment="top:right"]').click();

  await createdText.dblclick();
  await editor.fill("A");
  const autoWidthBefore = Number.parseFloat(
    await createdText.evaluate((element: HTMLElement) => element.style.width),
  );
  await editor.fill("Alpha Beta rich text grows automatically");
  await expect
    .poll(() =>
      createdText.evaluate((element: HTMLElement) => Number.parseFloat(element.style.width)),
    )
    .toBeGreaterThan(autoWidthBefore);
  await editor.press("Home");
  for (let index = 0; index < 5; index += 1) await editor.press("Shift+ArrowRight");
  await boldButton.click();
  await expect(editor).toBeVisible();
  await expect(boldButton).toHaveAttribute("aria-pressed", "true");
  await editor.press("Home");
  for (let index = 0; index < 7; index += 1) await editor.press("Shift+ArrowRight");
  await expect(boldButton).toHaveAttribute("aria-pressed", "mixed");
  await editor.press("End");
  await editor.evaluate((element) => {
    const clipboard = new DataTransfer();
    clipboard.setData("text/plain", " plain paste");
    clipboard.setData("text/html", "<strong>formatted paste</strong>");
    element.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, clipboardData: clipboard }));
  });
  await expect(editor).toContainText("Alpha Beta rich text grows automatically plain paste");
  await expect(editor.locator("strong")).toHaveCount(0);
  await canvas.click({ position: { x: canvasBox.width - 24, y: canvasBox.height / 2 } });
  await createdText.click();
  await expect(createdText).toHaveAttribute(
    "data-canvas-element-text",
    "Alpha Beta rich text grows automatically plain paste",
  );
  await expect(createdText.locator('span[style*="font-weight: 700"]').first()).toContainText(
    "Alpha",
  );
  await properties.getByLabel("Text background", { exact: true }).click();
  await page.getByRole("option", { name: "Line background", exact: true }).click();
  await expect(createdText.locator('[data-canvas-text-fill="lines"]')).toHaveCount(1);

  const textBeforeMove = await createdText.boundingBox();
  if (!textBeforeMove) throw new Error("Text move geometry is unavailable.");
  const moveTarget = point(canvasBox.width * 0.62, canvasBox.height * 0.58);
  await page.mouse.move(
    textBeforeMove.x + textBeforeMove.width / 2,
    textBeforeMove.y + textBeforeMove.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(moveTarget.x, moveTarget.y, { steps: 4 });
  await expect(canvas).toHaveAttribute("data-active-drag-type", "canvasElement");
  await page.mouse.up();

  const cornerHandle = createdText.locator('[data-canvas-resize-handle="topRight"]');
  const cornerBeforeZoom = await cornerHandle.boundingBox();
  const viewportActions = page.locator('[data-demo-id="org-editor-viewport-actions"]');
  await viewportActions.getByRole("button", { name: "Zoom in", exact: true }).click();
  await viewportActions.getByRole("button", { name: "Zoom in", exact: true }).click();
  const cornerAfterZoom = await cornerHandle.boundingBox();
  if (!cornerBeforeZoom || !cornerAfterZoom) {
    throw new Error("Corner resize geometry is unavailable.");
  }
  expect(Math.abs(cornerAfterZoom.width - cornerBeforeZoom.width)).toBeLessThan(0.25);
  expect(Math.abs(cornerAfterZoom.height - cornerBeforeZoom.height)).toBeLessThan(0.25);
  await viewportActions.getByRole("button", { name: "Reset zoom", exact: true }).click();

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
  await expect
    .poll(() =>
      createdText.evaluate((element: HTMLElement) =>
        Number.isInteger(Number.parseFloat(element.style.width)),
      ),
    )
    .toBe(true);
  await page.mouse.up();
  const textAfterResize = await createdText.boundingBox();
  expect((textAfterResize?.width ?? 0) - textBeforeResize.width).toBeGreaterThan(40);
  await properties.getByRole("button", { name: "Geometry", exact: true }).click();
  expect(Number.isInteger(Number(await widthInput.inputValue()))).toBe(true);

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
  await expect(createdText).toHaveCSS("outline-style", "none");

  await imageElements.last().click();
  await expect(
    imageElements.last().locator('[data-canvas-resize-handle="rightCenter"]'),
  ).toBeVisible();
  await expect(
    imageElements.last().locator('[data-canvas-rotate-handle="topRight"]'),
  ).toBeVisible();
  const image = imageElements.last();
  const imageBeforeResize = await image.boundingBox();
  const imageRightResize = await image
    .locator('[data-canvas-resize-handle="rightCenter"]')
    .boundingBox();
  if (!imageBeforeResize || !imageRightResize)
    throw new Error("Image resize geometry is unavailable.");
  await page.mouse.move(
    imageRightResize.x + imageRightResize.width / 2,
    imageRightResize.y + imageRightResize.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(imageRightResize.x + imageRightResize.width / 2 + 64, imageRightResize.y, {
    steps: 4,
  });
  await page.mouse.up();
  const independentlyResizedImage = await image.boundingBox();
  expect(
    Math.abs((independentlyResizedImage?.height ?? 0) - imageBeforeResize.height),
  ).toBeLessThan(1);
  await page.keyboard.press("Control+z");
  const proportionalHandle = await image
    .locator('[data-canvas-resize-handle="rightCenter"]')
    .boundingBox();
  if (!proportionalHandle) throw new Error("Proportional Image resize geometry is unavailable.");
  await page.mouse.move(
    proportionalHandle.x + proportionalHandle.width / 2,
    proportionalHandle.y + proportionalHandle.height / 2,
  );
  await page.mouse.down();
  await page.keyboard.down("Shift");
  await page.mouse.move(
    proportionalHandle.x + proportionalHandle.width / 2 + 64,
    proportionalHandle.y,
    {
      steps: 4,
    },
  );
  await page.mouse.up();
  await page.keyboard.up("Shift");
  const proportionallyResizedImage = await image.boundingBox();
  expect(
    Math.abs((proportionallyResizedImage?.height ?? 0) - imageBeforeResize.height),
  ).toBeGreaterThan(20);
  await page.keyboard.press("Control+z");

  await createdText.click();
  await createdSticker.click({ modifiers: [additiveSelectionModifier] });
  await expect(groupFrame).toBeVisible();
  await expect(createdText).toHaveCSS("outline-style", "solid");
  await expect(createdSticker).toHaveCSS("outline-style", "solid");
  await expect(groupFrame.locator("[data-canvas-group-resize-handle]")).toHaveCount(8);
  await expect(groupFrame.locator("[data-canvas-group-rotate-handle]")).toHaveCount(4);
  await expect(groupFrame.locator('[data-canvas-transform-handle="corner-resize"]')).toHaveCount(4);
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
  await createdText.click({ button: "right" });
  await elementMenu.getByRole("menuitem", { name: "Send to back", exact: true }).click();
  await expect(createdText).toHaveAttribute("data-canvas-element-layer", "behindUnits");
  await expect(createdSticker).toHaveAttribute("data-canvas-element-layer", "behindUnits");
  await page.keyboard.press("Control+z");
  await expect(createdText).toHaveAttribute("data-canvas-element-layer", "aboveUnits");
  await expect(createdSticker).toHaveAttribute("data-canvas-element-layer", "aboveUnits");

  const attachedSticker = canvas.locator(
    '[data-canvas-element-id="dddddddd-dddd-4ddd-8ddd-dddddddddddd"]',
  );
  const product = canvas.locator('fieldset[aria-label="Canvas Unit Product"]');
  const attachedBefore = await centerOf(attachedSticker);
  await attachedSticker.click({ button: "right" });
  await elementMenu.getByRole("menuitem", { name: "Send to back", exact: true }).click();
  await expect(attachedSticker).toHaveAttribute("data-canvas-element-layer", "behindUnits");
  const attachedAfterBack = await centerOf(attachedSticker);
  expect(
    Math.hypot(attachedAfterBack.x - attachedBefore.x, attachedAfterBack.y - attachedBefore.y),
  ).toBeLessThan(0.01);
  await page.keyboard.press("Control+z");
  await expect(attachedSticker).toHaveAttribute("data-canvas-element-layer", "aboveUnits");
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
  const attachedRotateHandle = attachedSticker.locator('[data-canvas-rotate-handle="bottomLeft"]');
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

  await toolbar.locator('[data-canvas-tool="arrow"]').click();
  await createdText.hover();
  await expect(canvas.locator("[data-canvas-anchor-target-outline]")).toHaveAttribute(
    "data-canvas-anchor-target-outline",
    `element:${createdTextId}`,
  );
  await expect(canvas.locator("[data-canvas-target-anchor]")).toHaveCount(9);
  const connector = canvas.locator(
    `[data-canvas-target-anchor="element:${createdTextId}"][data-canvas-anchor-id="rightCenter"]`,
  );
  const connectorBox = await connector.boundingBox();
  if (!connectorBox) throw new Error("Canvas attachment source geometry is unavailable.");
  await page.mouse.move(
    connectorBox.x + connectorBox.width / 2,
    connectorBox.y + connectorBox.height / 2,
  );
  await page.mouse.down();
  await expect(canvas).toHaveAttribute("data-active-drag-type", "canvasArrowCreate");
  await expect(elementMenu).toBeHidden();
  const attachmentTarget = canvas.locator(`[data-canvas-element-id="${createdStickerId}"]`);
  const attachmentTargetBox = await attachmentTarget.boundingBox();
  if (!attachmentTargetBox) throw new Error("Canvas attachment target geometry is unavailable.");
  await page.mouse.move(
    attachmentTargetBox.x,
    attachmentTargetBox.y + attachmentTargetBox.height / 2,
    { steps: 4 },
  );
  expect(await canvas.evaluate((element) => [element.scrollLeft, element.scrollTop])).toEqual([
    0, 0,
  ]);
  await expect(canvas.locator("[data-canvas-anchor-target-outline]")).toHaveAttribute(
    "data-canvas-anchor-target-outline",
    `element:${createdStickerId}`,
  );
  await expect(canvas.locator("[data-canvas-target-anchor]")).toHaveCount(9);
  await expect(canvas.locator("[data-canvas-snap-anchor]")).toHaveCount(1);
  await page.mouse.up();
  await expect(canvas.locator("[data-canvas-snap-anchor]")).toHaveCount(0);
  await expect(arrowElements).toHaveCount(initialArrowCount + 2);
  await page.keyboard.press("Control+z");
  await expect(arrowElements).toHaveCount(initialArrowCount + 1);
  await page.keyboard.press("Control+Shift+z");
  await expect(arrowElements).toHaveCount(initialArrowCount + 2);

  await createdText.click();
  await createdSticker.click({ modifiers: [additiveSelectionModifier] });
  await expect(groupFrame).toBeVisible();
  await page.locator('[data-demo-id="org-editor-view-image-export-action"]').click();
  const dialog = page.locator('[data-demo-id="org-editor-view-image-export-dialog"]');
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Font", { exact: true }).click();
  await expect(page.getByRole("option")).toHaveCount(5);
  await expect(page.getByRole("option", { name: "System", exact: true })).toBeVisible();
  await expect(page.getByRole("option", { name: "Georgia", exact: true })).toBeVisible();
  await page.getByRole("option", { name: "System", exact: true }).click();
  const preview = dialog.getByAltText("View export preview", { exact: true });
  await expect(preview).toBeVisible();
  await expect(dialog.locator('[data-demo-id="org-editor-view-image-dimensions"]')).toHaveCount(0);
  const previewViewport = dialog.locator('[data-demo-id="org-editor-view-image-preview"]');
  await expect(previewViewport).toHaveAttribute("data-preview-mode", "fit");
  const fittedScale = Number(await previewViewport.getAttribute("data-preview-scale"));
  await previewViewport.hover();
  await page.mouse.wheel(0, -500);
  await expect(previewViewport).toHaveAttribute("data-preview-mode", "manual");
  await expect
    .poll(async () => Number(await previewViewport.getAttribute("data-preview-scale")))
    .toBeGreaterThan(fittedScale);
  const manualScale = Number(await previewViewport.getAttribute("data-preview-scale"));
  const transformBeforePan = await preview.getAttribute("style");
  const previewBox = await previewViewport.boundingBox();
  if (!previewBox) throw new Error("View preview viewport geometry is unavailable.");
  await page.mouse.move(previewBox.x + previewBox.width / 2, previewBox.y + previewBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    previewBox.x + previewBox.width / 2 + 48,
    previewBox.y + previewBox.height / 2 + 24,
    { steps: 3 },
  );
  await page.mouse.up();
  await expect.poll(() => preview.getAttribute("style")).not.toBe(transformBeforePan);
  const transformBeforeKeyboardPan = await preview.getAttribute("style");
  await previewViewport.press("ArrowRight");
  await expect.poll(() => preview.getAttribute("style")).not.toBe(transformBeforeKeyboardPan);
  await dialog.locator('[data-demo-id="org-editor-view-image-density"]').click();
  await page.getByRole("option", { name: "3×", exact: true }).click();
  await expect
    .poll(async () => Number(await previewViewport.getAttribute("data-preview-scale")))
    .toBeCloseTo(manualScale, 4);
  await previewViewport.getByRole("button", { name: "Fit", exact: true }).click();
  await expect(previewViewport).toHaveAttribute("data-preview-mode", "fit");
  await previewViewport.getByRole("button", { name: "Actual size", exact: true }).click();
  await expect
    .poll(async () => Number(await previewViewport.getAttribute("data-preview-scale")))
    .toBe(1);
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
  await unitDialog.getByLabel("Font", { exact: true }).click();
  await expect(page.getByRole("option")).toHaveCount(5);
  await expect(page.getByRole("option", { name: "System", exact: true })).toBeVisible();
  await expect(page.getByRole("option", { name: "Georgia", exact: true })).toBeVisible();
  await page.getByRole("option", { name: "System", exact: true }).click();
  const unitPreview = unitDialog.getByAltText("Unit export preview", { exact: true });
  await expect(unitPreview).toBeVisible();
  await expect(unitDialog.getByRole("button", { name: "Fit", exact: true })).toBeVisible();
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
  await unitDialog.getByRole("tab", { name: "Template", exact: true }).click();
  const unitTemplateFormat = unitDialog.getByLabel("Format", { exact: true });
  await unitTemplateFormat.fill("{fullName}\n\n");
  const unitTemplatePreview = unitDialog.locator(
    '[data-demo-id="org-editor-export-template-preview"] pre',
  );
  await expect.poll(() => unitTemplatePreview.textContent()).toContain("\n\n");
  const rowModeCounts = unitDialog.locator('[data-demo-id="export-row-mode"] .tabular-nums');
  const countsBeforeFiltering = await rowModeCounts.allTextContents();
  await unitDialog.getByRole("checkbox", { name: "Remove empty lines", exact: true }).click();
  await expect.poll(() => unitTemplatePreview.textContent()).not.toContain("\n\n");
  await expect
    .poll(async () => {
      const countsAfterFiltering = (await rowModeCounts.allTextContents()).map((value) =>
        Number.parseInt(value, 10),
      );
      const previousCounts = countsBeforeFiltering.map((value) => Number.parseInt(value, 10));
      return (
        countsAfterFiltering.every((count, index) => count <= (previousCounts[index] ?? 0)) &&
        countsAfterFiltering.some((count, index) => count < (previousCounts[index] ?? 0))
      );
    })
    .toBe(true);
  const templateDownloadPromise = page.waitForEvent("download");
  await unitDialog.getByRole("button", { name: "Save", exact: true }).click();
  const templateDownload = await templateDownloadPromise;
  const templatePath = await templateDownload.path();
  expect(await readFile(templatePath ?? "", "utf8")).not.toContain("\n\n");
  await page.keyboard.press("Escape");

  await createdText.click();
  await page.setViewportSize({ height: 800, width: 900 });
  await page.locator('[data-demo-id="language-toggle"]').click();
  await page.locator('[data-demo-id="language-dialog"] label:has(input[value="ru"])').click();
  await expect(properties).toBeVisible();
  expect(
    await properties.evaluate((element) => element.scrollWidth <= element.clientWidth + 1),
  ).toBe(true);
  await expect(properties.getByRole("button", { name: /More/u })).toHaveCount(0);

  await page.locator('[data-demo-id="language-toggle"]').click();
  await page.locator('[data-demo-id="language-dialog"] label:has(input[value="en"])').click();
  const legacyState = JSON.parse(await readFile(syntheticStatePath, "utf8")) as OrgToolsState;
  const legacyElement = legacyState.organization.views
    .flatMap((view) => view.structure.canvasElements)
    .find((element) => element.type === "text");
  if (legacyElement?.type !== "text") {
    throw new Error("Legacy typography fixture is unavailable.");
  }
  legacyElement.typography.fontFamily = "Inter";
  legacyElement.typography.fontWeight = 500;
  legacyElement.formatRuns = legacyElement.formatRuns.map((run) => ({
    ...run,
    typography: { ...run.typography, fontFamily: "Inter", fontWeight: 500 },
  }));
  const legacyDialog = await openImportDialog(page, {
    buffer: Buffer.from(JSON.stringify(legacyState)),
    mimeType: "application/json",
    name: "legacy-editor-typography.json",
  });
  await expect(legacyDialog.locator('[data-demo-id="state-import-summary"]')).toContainText(
    "4 Employees",
  );
  await legacyDialog.getByRole("button", { name: "Replace state", exact: true }).click();
  await expect(legacyDialog).toBeHidden();
  const resolvedLegacyElement = page.locator(`[data-canvas-element-id="${legacyElement.id}"]`);
  await expect(resolvedLegacyElement).toHaveAttribute("data-canvas-font-family", "system-ui");
  await expect(resolvedLegacyElement.locator('span[style*="font-family"]').first()).toHaveCSS(
    "font-weight",
    "400",
  );

  page.off("request", onRequest);
  expect(externalRequests).toEqual([]);
}
