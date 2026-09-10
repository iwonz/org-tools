import { readFile } from "node:fs/promises";
import type { OrgToolsState } from "@org-tools/types";
import type { Page } from "@playwright/test";
import { expect } from "./browser-test.js";
import { openImportDialog, syntheticStatePath } from "./helpers.js";

export async function exerciseTagGrouping(page: Page) {
  const state = JSON.parse(await readFile(syntheticStatePath, "utf8")) as OrgToolsState;
  const [boss, both, alphaEmployee, untagged] = state.organization.employees;
  const units = state.organization.views[0]?.structure.units;
  const product = units?.find((unit) => unit.name === "Product");
  if (!boss || !both || !alphaEmployee || !untagged || !product || !units)
    throw new Error("Incomplete synthetic state");
  const zulu = "90000000-0000-4000-8000-000000000071";
  const hidden = "90000000-0000-4000-8000-000000000072";
  const alpha = "90000000-0000-4000-8000-000000000073";
  state.organization.tags = [
    { id: zulu, label: "Priority Zulu", color: "blue" },
    { id: hidden, label: "Hidden", color: null },
    { id: alpha, label: "Priority Alpha", color: "green" },
  ];
  (
    [
      [boss, "Zane"],
      [both, "Blair"],
      [alphaEmployee, "Alex"],
      [untagged, "Aaron"],
    ] as const
  ).forEach(([employee, name]) => {
    employee.firstName = name;
    employee.lastName = "Example";
    employee.birthday = null;
    employee.tags = [];
  });
  boss.tags = [{ tagId: alpha, date: null }];
  both.tags = [
    { tagId: alpha, date: null },
    { tagId: zulu, date: "2026-07-10" },
  ];
  alphaEmployee.tags = [{ tagId: alpha, date: null }];
  for (const unit of units) {
    unit.employeeIds = unit === product ? [boss.id, both.id, alphaEmployee.id, untagged.id] : [];
    unit.employeePositions = unit.employeeIds.map((employeeId) => ({ employeeId, position: null }));
    unit.bossEmployeeId = unit === product ? boss.id : null;
    unit.liveFilter = null;
    unit.groupByTag = true;
  }
  const dialog = await openImportDialog(page, {
    buffer: Buffer.from(JSON.stringify(state)),
    mimeType: "application/json",
    name: "synthetic-grouping.json",
  });
  await dialog.getByRole("button", { name: "Replace state", exact: true }).click();
  await expect(dialog).toBeHidden();
  await page.getByRole("tab", { name: "Editor", exact: true }).click();
  const card = page.locator('fieldset[aria-label="Canvas Unit Product"]');
  const rows = card.locator("[data-org-editor-employee-id]");
  const rowIds = () =>
    rows.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("data-org-editor-employee-id")),
    );
  const originalOrder = [boss.id, both.id, alphaEmployee.id, untagged.id];
  const alphabeticalOrder = [boss.id, untagged.id, alphaEmployee.id, both.id];
  const groupedOrder = [boss.id, alphaEmployee.id, both.id, untagged.id];
  await expect.poll(rowIds).toEqual(originalOrder);
  await card.hover();
  const gear = card.locator('[data-demo-id="unit-settings-action"]');
  await gear.click();
  const settings = page.locator('[data-demo-id="unit-settings-dialog"]');
  const grouping = settings.getByRole("switch", { name: "Group by tag", exact: true });
  await expect(grouping).toHaveAttribute("aria-checked", "true");
  await expect(settings.getByRole("combobox")).toHaveCount(0);
  await grouping.click();
  await expect(grouping).toHaveAttribute("aria-checked", "false");
  await expect.poll(rowIds).toEqual(alphabeticalOrder);
  await page.keyboard.press("Escape");
  await expect(gear).toBeFocused();
  await page.keyboard.press("Control+z");
  await expect.poll(rowIds).toEqual(originalOrder);
  await page.keyboard.press("Control+Shift+z");
  await expect.poll(rowIds).toEqual(alphabeticalOrder);
  await page.keyboard.press("Control+z");

  await card.click({ button: "right", position: { x: 40, y: 40 } });
  await page.locator('[data-demo-id="org-editor-export-action"]').click();
  const initialExport = page.getByRole("dialog", { name: "Export", exact: true });
  await initialExport.getByRole("tab", { name: "JSON", exact: true }).click();
  const exportTags = initialExport.getByRole("checkbox", { name: "Tags", exact: true });
  if ((await exportTags.getAttribute("aria-checked")) === "false") await exportTags.click();
  await initialExport.locator('[data-demo-id="json-tags-exclusions"]').click();
  const exclusions = page.locator('[data-demo-id="json-tags-exclusions-popover"]');
  await expect(exclusions.locator("label")).toHaveText(["Priority Zulu", "Priority Alpha"]);
  await page.keyboard.press("Escape");
  await initialExport.getByRole("tab", { name: "Image", exact: true }).click();
  await page.keyboard.press("Escape");

  await page.getByRole("tab", { name: "Employees", exact: true }).click();
  await page.locator('[data-demo-id="employee-tags-button"]').click();
  const catalog = page.getByRole("dialog", { name: "Tags", exact: true });
  const tagRow = (id: string) =>
    catalog.locator(`[data-demo-id="tag-catalog-row"][data-tag-id="${id}"]`);
  const tagIds = () =>
    catalog
      .locator('[data-demo-id="tag-catalog-row"]')
      .evaluateAll((elements) => elements.map((element) => element.getAttribute("data-tag-id")));
  await expect(tagRow(alpha).locator('[data-demo-id="tag-catalog-dated-count"]')).toHaveCount(0);
  await expect(tagRow(zulu).locator('[data-demo-id="tag-catalog-dated-count"]')).toHaveText(
    "With date: 1",
  );

  await page.setViewportSize({ width: 900, height: 480 });
  await tagRow(zulu).locator('[data-demo-id="tag-color-trigger"]').click();
  const picker = page.locator('[data-demo-id="tag-color-dropdown"]');
  await expect(picker).toBeVisible();
  const backgroundScroll = await catalog.evaluate((element) => ({
    top: element.scrollTop,
    page: window.scrollY,
  }));
  await picker.hover();
  await page.mouse.wheel(0, 640);
  await expect.poll(() => picker.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await picker.getByRole("option", { name: "Teal", exact: true }).click();
  await expect(picker).toBeHidden();
  expect(
    await catalog.evaluate((element) => ({ top: element.scrollTop, page: window.scrollY })),
  ).toEqual(backgroundScroll);
  await tagRow(zulu).locator('[data-demo-id="tag-color-trigger"]').click();
  await picker.hover();
  for (let sample = 0; sample < 12; sample += 1) await page.mouse.wheel(0, 24);
  await expect.poll(() => picker.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  for (let step = 0; step < 20; step += 1) {
    await page.keyboard.press("Tab");
    if (
      await picker
        .getByRole("option", { name: "Teal", exact: true })
        .evaluate((element) => element === document.activeElement)
    )
      break;
  }
  await expect(picker.getByRole("option", { name: "Teal", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(tagRow(zulu).locator('[data-demo-id="tag-color-trigger"]')).toBeFocused();
  await page.setViewportSize({ width: 1440, height: 1000 });

  await catalog.getByRole("searchbox", { name: "Search tags", exact: true }).fill("Priority");
  await expect(catalog.locator("mark")).toHaveText(["Priority", "Priority"]);
  const handle = tagRow(alpha).locator('[data-demo-id="tag-catalog-drag-handle"]');
  const sourceBounds = await handle.boundingBox();
  const targetBounds = await tagRow(zulu).boundingBox();
  if (!sourceBounds || !targetBounds) throw new Error("Missing Tag drag bounds");
  await page.mouse.move(sourceBounds.x + 12, sourceBounds.y + 12);
  await page.mouse.down();
  await page.mouse.move(targetBounds.x + 100, targetBounds.y + 4, { steps: 8 });
  await page.keyboard.press("Escape");
  await page.mouse.up();
  await expect.poll(tagIds).toEqual([zulu, alpha]);
  await handle.dragTo(tagRow(zulu), { targetPosition: { x: 100, y: 4 } });
  await expect.poll(tagIds).toEqual([alpha, zulu]);
  await handle.focus();
  await handle.press("ArrowDown");
  await expect.poll(tagIds).toEqual([zulu, alpha]);
  await handle.press("ArrowUp");
  await expect.poll(tagIds).toEqual([alpha, zulu]);
  await catalog.getByRole("searchbox", { name: "Search tags", exact: true }).fill("");
  await expect.poll(tagIds).toEqual([alpha, zulu, hidden]);
  await tagRow(zulu)
    .locator('[data-demo-id="tag-catalog-drag-handle"]')
    .dragTo(tagRow(alpha), { targetPosition: { x: 100, y: 4 } });
  await expect.poll(tagIds).toEqual([zulu, alpha, hidden]);
  await handle.dragTo(tagRow(zulu), { targetPosition: { x: 100, y: 4 } });
  await expect.poll(tagIds).toEqual([alpha, zulu, hidden]);
  await page.keyboard.press("Escape");

  const bothCard = page
    .locator('[data-demo-id="employees-list"] article')
    .filter({ hasText: "Blair Example" });
  await expect(bothCard).toBeVisible();
  const chips = bothCard.locator("[data-employee-tags-density] > span");
  await expect(chips.nth(0)).toContainText("Priority Alpha");
  await expect(chips.nth(1)).toContainText("Priority Zulu");
  await page.getByRole("tab", { name: "Editor", exact: true }).click();
  await expect.poll(rowIds).toEqual(groupedOrder);
  await page.evaluate(() => {
    const original = CanvasRenderingContext2D.prototype.fillText;
    const names: string[] = [];
    Reflect.set(window, "__groupingPaintedNames", names);
    CanvasRenderingContext2D.prototype.fillText = function (text, x, y, maxWidth) {
      const match = text.match(/(?:Zane|Blair|Alex|Aaron) Example/);
      if (match) names.push(match[0]);
      if (maxWidth === undefined) original.call(this, text, x, y);
      else original.call(this, text, x, y, maxWidth);
    };
  });
  await card.click({ button: "right", position: { x: 40, y: 40 } });
  await page.locator('[data-demo-id="org-editor-export-action"]').click();
  const exportDialog = page.getByRole("dialog", { name: "Export", exact: true });
  await expect(exportDialog.locator('[data-demo-id="org-editor-export-image"]')).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => (Reflect.get(window, "__groupingPaintedNames") as string[]).slice(-4)),
    )
    .toEqual(["Zane Example", "Alex Example", "Blair Example", "Aaron Example"]);
  await page.keyboard.press("Escape");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export", exact: true }).click();
  const download = await downloadPromise;
  const path = await download.path();
  if (!path) throw new Error("Missing state export");
  const saved = JSON.parse(await readFile(path, "utf8")) as OrgToolsState;
  expect(saved.organization.tags.map((tag) => tag.id)).toEqual([alpha, zulu, hidden]);
  expect(
    saved.organization.views[0]?.structure.units.find((unit) => unit.id === product.id)?.groupByTag,
  ).toBe(true);
  return { groupedOrder, alphabeticalOrder };
}
