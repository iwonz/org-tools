import { readFile } from "node:fs/promises";
import type { OrgToolsState } from "@org-tools/types";
import type { Page } from "@playwright/test";
import { expect } from "./browser-test.js";
import { openImportDialog, syntheticStatePath } from "./helpers.js";

const required = <T>(value: T | null | undefined): T => {
  if (value == null) throw new Error("Missing synthetic value");
  return value;
};

async function importState(page: Page, state: OrgToolsState) {
  const dialog = await openImportDialog(page, {
    buffer: Buffer.from(JSON.stringify(state)),
    mimeType: "application/json",
    name: "refined-synthetic.json",
  });
  await dialog.getByRole("button", { name: "Replace state", exact: true }).click();
  await expect(dialog).toBeHidden();
}

export async function exportState(page: Page): Promise<OrgToolsState> {
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export", exact: true }).click();
  return JSON.parse(await readFile(await (await pending).path(), "utf8")) as OrgToolsState;
}

export async function exerciseRefinedEditor(page: Page) {
  const state = JSON.parse(await readFile(syntheticStatePath, "utf8")) as OrgToolsState;
  const view = required(state.organization.views[0]);
  const root = required(view.structure.units[0]);
  const child = required(view.structure.units[1]);
  const [first, second, third] = state.organization.employees;
  if (!first || !second || !third) throw new Error("Missing synthetic Employees");
  view.structure.canvasElements = [];
  root.employeeIds = [first.id];
  root.employeePositions = [];
  root.bossEmployeeId = first.id;
  root.x = 24;
  root.y = 24;
  child.employeeIds = [first.id, second.id];
  child.employeePositions = [];
  child.bossEmployeeId = null;
  child.x = 360;
  child.y = 24;
  const leaf = {
    ...child,
    id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    parentId: child.id,
    name: "Delivery",
    employeeIds: [first.id, third.id],
    x: 696,
    y: 24,
  };
  const live = {
    ...child,
    id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
    parentId: null,
    name: "Live reference",
    employeeIds: [],
    x: 24,
    y: 432,
    liveFilter: { ...state.ui.employees.filters, query: first.firstName },
  };
  view.structure.units = [root, child, leaf, live];
  required(state.ui.editor.views[0]).distributionModeUnitIds = [root.id, live.id];
  required(state.ui.editor.views[0]).selectedItems = [];
  required(state.ui.editor.views[0]).viewport = { scale: 1, x: 0, y: 0 };
  await importState(page, state);
  await page.getByRole("tab", { name: "Editor", exact: true }).click();
  const card = (name: string, owner = page) =>
    owner.locator(`fieldset[aria-label="Canvas Unit ${name}"]`);
  const action = (name: string) =>
    card(name)
      .locator(`[data-org-editor-employee-id="${first.id}"]`)
      .locator("..")
      .locator('[data-demo-id="org-editor-employee-placements-action"]');
  await expect(card("Product")).toContainText("1 Employee · 3 Employees total");
  await expect(card("Platform")).toContainText("2 Employees · 3 Employees total");
  await expect(card("Delivery")).toContainText("2 Employees");
  const map = page.locator('[data-demo-id="employee-placement-dialog"]');
  for (const name of ["Product", "Live reference"]) {
    await action(name).click();
    await expect(map.locator('[data-placement-node="unit"]')).toHaveCount(4);
    await page.keyboard.press("Escape");
  }
  await action("Platform").click();
  await expect(map.locator('[data-placement-node="unit"]')).toHaveCount(2);
  await expect(map).toContainText("Delivery");
  await expect(map).not.toContainText("Live reference");
  const peer = await page.context().newPage();
  await peer.goto(page.url(), { waitUntil: "domcontentloaded" });
  const toggle = async (name: string) => {
    await card(name, peer).click({ button: "right", position: { x: 70, y: 40 } });
    await peer.locator('[data-demo-id="org-editor-distribution-mode-action"]').click();
  };
  await toggle("Delivery");
  await expect(map).toBeHidden();
  await expect(action("Platform")).toHaveCount(0);
  await toggle("Delivery");
  await action("Platform").click();
  await toggle("Product");
  await expect(map.locator('[data-placement-node="unit"]')).toHaveCount(3);
  await toggle("Platform");
  await expect(map.locator('[data-placement-node="unit"]')).toHaveCount(4);
  // A source removed while other placements remain must close its map as well.
  const replacement = structuredClone(state);
  required(required(replacement.organization.views[0]).structure.units[1]).employeeIds = [
    second.id,
  ];
  await importState(peer, replacement);
  await expect(map).toBeHidden();
  await peer.close();
  await importState(page, state);

  // Every direction activation owns one arrangement command, including the already active mode.
  const vertical = page.getByRole("button", { name: "Vertical layout", exact: true });
  const horizontal = page.getByRole("button", { name: "Horizontal layout", exact: true });
  const before = required((await exportState(page)).organization.views[0]).structure;
  await expect(vertical).toHaveAttribute("aria-pressed", "true");
  await vertical.click();
  const repeatedVertical = required((await exportState(page)).organization.views[0]).structure;
  expect(repeatedVertical.layoutMode).toBe("topDown");
  expect(repeatedVertical).not.toEqual(before);
  await page.keyboard.press("Control+z");
  expect(required((await exportState(page)).organization.views[0]).structure).toEqual(before);
  await page.keyboard.press("Control+Shift+z");
  expect(required((await exportState(page)).organization.views[0]).structure).toEqual(
    repeatedVertical,
  );
  await horizontal.click();
  await expect(horizontal).toHaveAttribute("aria-pressed", "true");
  const changed = required((await exportState(page)).organization.views[0]).structure;
  expect(changed.layoutMode).toBe("leftRight");
  await page.keyboard.press("Control+z");
  await expect(vertical).toHaveAttribute("aria-pressed", "true");
  expect(required((await exportState(page)).organization.views[0]).structure).toEqual(
    repeatedVertical,
  );
  await page.keyboard.press("Control+Shift+z");
  expect(required((await exportState(page)).organization.views[0]).structure).toEqual(changed);
  await page.keyboard.press("Control+z");

  await page.evaluate(() => {
    const painted: string[] = [];
    Reflect.set(window, "__refinedPaint", painted);
    const original = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (text, x, y, maxWidth) {
      painted.push(text);
      if (maxWidth === undefined) original.call(this, text, x, y);
      else original.call(this, text, x, y, maxWidth);
    };
  });
  await card("Product").click({ button: "right", position: { x: 70, y: 40 } });
  await page.locator('[data-demo-id="org-editor-export-action"]').click();
  await expect(page.locator('[data-demo-id="org-editor-export-image"]')).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => Reflect.get(window, "__refinedPaint") as string[]))
    .toEqual(
      expect.arrayContaining(["1 Employee · 3 Employees total", "2 Employees · 3 Employees total"]),
    );
  await page.keyboard.press("Escape");
  await page.getByRole("tab", { name: "Units", exact: true }).click();
  await expect(page.locator('[data-demo-id="units-employee-total-count"]')).toContainText(
    "3 Employees",
  );
}

export async function exercisePointerTagSorting(page: Page) {
  const state = JSON.parse(await readFile(syntheticStatePath, "utf8")) as OrgToolsState;
  const tags = state.organization.tags;
  for (let index = 13; index <= 40; index++)
    tags.push({
      id: `90000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
      label: `Synthetic Tag ${index}`,
      color: null,
    });
  await importState(page, state);
  await page.getByRole("tab", { name: "Employees", exact: true }).click();
  await page.locator('[data-demo-id="employee-tags-button"]').click();
  const catalog = page.getByRole("dialog", { name: "Tags", exact: true });
  const list = catalog.locator('[data-demo-id="tag-catalog-scroll"]');
  const rows = catalog.locator('[data-demo-id="tag-catalog-row"]');
  const ids = () =>
    rows.evaluateAll((items) => items.map((item) => item.getAttribute("data-tag-id")));
  const original = tags.map((tag) => tag.id);
  const overlay = page.locator('[data-demo-id="tag-catalog-drag-preview"]');
  const placeholder = catalog.locator('[data-demo-id="tag-catalog-drop-placeholder"]');
  const handle = rows.first().locator('[data-demo-id="tag-catalog-drag-handle"]');
  const start = async () => {
    const bounds = await handle.boundingBox();
    if (!bounds) throw new Error("Missing handle");
    await page.mouse.move(bounds.x + 12, bounds.y + 12);
    await page.mouse.down();
    return bounds;
  };
  // Observe logical writes in either runtime without exposing a production testing API.
  await page.evaluate(() => {
    const originalPost = BroadcastChannel.prototype.postMessage;
    Reflect.set(window, "__tagWrites", 0);
    BroadcastChannel.prototype.postMessage = function (value) {
      if (value?.type === "state")
        Reflect.set(window, "__tagWrites", Number(Reflect.get(window, "__tagWrites")) + 1);
      originalPost.call(this, value);
    };
  });
  const writes = () => page.evaluate(() => Number(Reflect.get(window, "__tagWrites")));
  const first = await start();
  await page.mouse.move(first.x + 14, first.y + 13);
  await expect(overlay).toHaveCount(0);
  const second = await rows.nth(1).boundingBox();
  if (!second) throw new Error("Missing second row");
  await page.mouse.move(second.x + 100, second.y + second.height + 5, { steps: 8 });
  await expect(overlay).toBeVisible();
  await expect(overlay).toHaveAttribute("inert", "");
  await expect(overlay.locator('[data-demo-id="tag-catalog-employee-count"]')).toHaveCount(1);
  await expect(overlay.locator("svg")).toHaveCount(5);
  await expect(placeholder).toBeVisible();
  await expect
    .poll(() => rows.nth(1).evaluate((row) => row.getBoundingClientRect().y))
    .toBeLessThan(second.y - 20);
  expect(await writes()).toBe(0);
  await page.screenshot({ path: "/tmp/org-tools-tag-drag-preview.png" });
  await page.mouse.up();
  await expect.poll(ids).toEqual([original[1], original[0], ...original.slice(2)]);
  await expect.poll(writes).toBe(1);
  await expect(
    catalog.locator(`[data-tag-id="${original[0]}"] [data-demo-id="tag-catalog-drag-handle"]`),
  ).toBeFocused();

  const saved = await ids();
  for (const cancel of ["escape", "outside", "pointercancel", "query"] as const) {
    const bounds = await start();
    await page.mouse.move(bounds.x + 100, bounds.y + 90, { steps: 5 });
    await expect(overlay).toBeVisible();
    if (cancel === "escape") await page.keyboard.press("Escape");
    else if (cancel === "outside") await page.mouse.move(5, 5);
    else if (cancel === "pointercancel")
      await handle.dispatchEvent("pointercancel", { pointerId: 1 });
    else await catalog.getByRole("searchbox").fill("Synthetic");
    await page.mouse.up();
    await expect(overlay).toHaveCount(0);
    await expect(catalog).toBeVisible();
    await catalog.getByRole("searchbox").fill("");
    expect(await ids()).toEqual(saved);
    expect(await writes()).toBe(1);
  }

  // Browsers can deliver adjacent frames with the same timestamp. A rounded zero-pixel
  // sample must not stop an edge gesture before it reaches the actual scroll boundary.
  await page.evaluate(() => {
    const original = window.requestAnimationFrame;
    let previous = 0;
    let duplicate = false;
    window.requestAnimationFrame = (callback) =>
      original((time) => {
        if (!duplicate) previous = time;
        duplicate = !duplicate;
        callback(previous);
      });
    Reflect.set(window, "__restoreTagRaf", () => {
      window.requestAnimationFrame = original;
    });
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await start();
  const scrollBounds = await list.boundingBox();
  if (!scrollBounds) throw new Error("Missing list");
  await page.mouse.move(scrollBounds.x + 100, scrollBounds.y + scrollBounds.height - 2, {
    steps: 5,
  });
  await expect.poll(() => list.evaluate((node) => node.scrollTop)).toBeGreaterThan(150);
  expect(await rows.first().evaluate((node) => getComputedStyle(node).transitionProperty)).toBe(
    "none",
  );
  expect(await writes()).toBe(1);
  await page.keyboard.press("Escape");
  await page.mouse.up();
  await list.evaluate((node) => {
    node.scrollTop = 0;
  });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.evaluate(() => {
    (Reflect.get(window, "__restoreTagRaf") as () => void)();
  });

  // Real Chromium touch events exercise pointer capture, not synthetic drag/drop events.
  const touch = await page.context().newCDPSession(page);
  const touchStart = await handle.boundingBox();
  const touchTarget = await rows.nth(1).boundingBox();
  if (!touchStart || !touchTarget) throw new Error("Missing touch bounds");
  await touch.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: touchStart.x + 12, y: touchStart.y + 12 }],
  });
  await touch.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [
      { x: touchTarget.x + touchTarget.width - 18, y: touchTarget.y + touchTarget.height - 3 },
    ],
  });
  await expect(overlay).toBeVisible();
  await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect.poll(ids).toEqual(original);
  await expect.poll(writes).toBe(2);
  await touch.detach();

  const peer = await page.context().newPage();
  await peer.goto(page.url(), { waitUntil: "domcontentloaded" });
  await peer.locator('[data-demo-id="employee-tags-button"]').click();
  const peerHandle = peer
    .locator('[data-demo-id="tag-catalog-row"]')
    .nth(2)
    .locator('[data-demo-id="tag-catalog-drag-handle"]');
  await start();
  await page.mouse.move(first.x + 100, first.y + 90, { steps: 5 });
  await expect(overlay).toBeVisible();
  await peerHandle.focus();
  await peerHandle.press("ArrowUp");
  await expect(overlay).toHaveCount(0);
  await page.mouse.up();
  await expect.poll(ids).toEqual([original[0], original[2], original[1], ...original.slice(3)]);
  expect(await writes()).toBe(2);
  await peer.close();
  await page.keyboard.press("Escape");
  const exported = await exportState(page);
  expect(exported.organization.tags.map((tag) => tag.id)).toEqual([
    original[0],
    original[2],
    original[1],
    ...original.slice(3),
  ]);
}
