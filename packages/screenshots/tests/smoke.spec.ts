import { readFile } from "node:fs/promises";

import { expect, type Locator, type Page, test } from "@playwright/test";

import {
  expectLocalRequestsOnly,
  openBlankWorkspace,
  openImportDialog,
  productTabs,
  replaceWithSyntheticWorkspace,
  syntheticEmployeesJsonPath,
  syntheticWorkspacePath,
} from "./helpers.js";

async function expectNoHorizontalRule(locator: Locator) {
  expect(
    await locator.evaluate((element) => ({
      bottom: window.getComputedStyle(element).borderBottomWidth,
      top: window.getComputedStyle(element).borderTopWidth,
    })),
  ).toEqual({ bottom: "0px", top: "0px" });
}

async function getBackgroundColor(locator: Locator) {
  return locator.evaluate((element) => window.getComputedStyle(element).backgroundColor);
}

async function expectTransparentBackground(locator: Locator) {
  expect(await getBackgroundColor(locator)).toBe("rgba(0, 0, 0, 0)");
}

async function expectProductTabIsland(page: Page) {
  const tabsList = page.locator('[data-demo-id="product-tabs-list"]');
  const tabs = tabsList.locator('[data-demo-id^="tab-"]');
  const listStyle = await tabsList.evaluate((element) => {
    const style = window.getComputedStyle(element);
    return {
      borderWidth: style.borderWidth,
      columnGap: style.columnGap,
      height: element.getBoundingClientRect().height,
    };
  });
  const tabStyles = await tabs.evaluateAll((elements) =>
    elements.map((element) => {
      const style = window.getComputedStyle(element);
      return {
        backgroundColor: style.backgroundColor,
        borderWidth: style.borderWidth,
        height: element.getBoundingClientRect().height,
      };
    }),
  );

  expect(listStyle).toEqual({ borderWidth: "1px", columnGap: "0px", height: 36 });
  expect(tabStyles).toHaveLength(6);
  expect(new Set(tabStyles.map(({ borderWidth }) => borderWidth))).toEqual(new Set(["0px"]));
  expect(new Set(tabStyles.map(({ height }) => height)).size).toBe(1);

  const active = tabsList.locator('[data-demo-id^="tab-"][aria-selected="true"]');
  const inactive = tabsList.locator('[data-demo-id^="tab-"][aria-selected="false"]').first();
  expect(await getBackgroundColor(active)).toBe("rgba(0, 0, 0, 0)");
  expect(await getBackgroundColor(inactive)).toBe("rgba(0, 0, 0, 0)");
  expect(await active.evaluate((element) => window.getComputedStyle(element).color)).not.toBe(
    await inactive.evaluate((element) => window.getComputedStyle(element).color),
  );
  const activeMarker = await active.evaluate((element) => {
    const marker = window.getComputedStyle(element, "::after");
    return {
      backgroundColor: marker.backgroundColor,
      content: marker.content,
      height: marker.height,
    };
  });
  expect(activeMarker).toMatchObject({ content: '""', height: "2px" });
  expect(activeMarker.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
}

test("opens a blank workspace with all product surfaces", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankWorkspace(page);

  await expectNoHorizontalRule(page.locator('[data-demo-id="app-header"]'));
  await expectNoHorizontalRule(page.locator('[data-demo-id="product-navigation"]'));

  const header = page.locator('[data-demo-id="app-header"]');
  const navigation = page.locator('[data-demo-id="product-navigation"]');
  const actions = page.locator('[data-demo-id="header-actions"]');
  await expect(header.locator('[data-demo-id="product-navigation"]')).toHaveCount(1);
  await expect(header.locator('[data-demo-id="header-actions"]')).toHaveCount(1);
  await expect(header.getByRole("img", { name: "Org Tools", exact: true })).toHaveCount(0);
  await expect(page.locator('[data-demo-id="brand-wordmark"]')).toHaveCount(0);
  expect(await header.evaluate((element) => element.getBoundingClientRect().height)).toBe(56);
  const navigationBox = await navigation.boundingBox();
  const actionsBox = await actions.boundingBox();
  expect(navigationBox).not.toBeNull();
  expect(actionsBox).not.toBeNull();
  expect(navigationBox?.x ?? 0).toBeLessThan(actionsBox?.x ?? 0);
  await expect(page.locator('[data-demo-id="import-action-icon"]')).toHaveAttribute(
    "data-icon",
    "document-arrow-up",
  );
  await expect(page.locator('[data-demo-id="export-action-icon"]')).toHaveAttribute(
    "data-icon",
    "document-arrow-down",
  );
  await page.locator('[data-demo-id="theme-toggle"]').click();
  await page.getByRole("option", { name: "Dark", exact: true }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expectProductTabIsland(page);
  await page.locator('[data-demo-id="theme-toggle"]').click();
  await page.getByRole("option", { name: "Light", exact: true }).click();
  expect(
    await page
      .locator('[data-demo-id^="tab-"]')
      .evaluateAll((tabs) => tabs.map((tab) => tab.getAttribute("data-demo-id"))),
  ).toEqual([
    "tab-units",
    "tab-employees",
    "tab-org-editor",
    "tab-analytics",
    "tab-calendar",
    "tab-export",
  ]);
  for (const tabName of productTabs) {
    const tab = page.getByRole("tab", { name: tabName, exact: true });
    await expect(tab).toBeVisible();
    await tab.click();
    await expect(tab).toHaveAttribute("aria-selected", "true");
    await expect(page.locator('[data-demo-id="top-level-empty-state"]')).toBeVisible();
  }
  const unitsTab = page.getByRole("tab", { name: "Units", exact: true });
  await unitsTab.focus();
  await unitsTab.press("End");
  await expect(page.getByRole("tab", { name: "Download", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.getByRole("tab", { name: "Editor", exact: true }).click();
  await expect(page.locator('[data-demo-id="org-view-toolbar"]')).toHaveCount(0);
  await expect(page.locator('[data-demo-id="org-editor-actions"]')).toHaveCount(0);
  await expect(page.locator('[data-demo-id="org-editor-focus-primary-unit-button"]')).toHaveCount(
    0,
  );
  expect(consoleErrors.filter((message) => message.includes("INVALID_KEY"))).toEqual([]);

  await assertLocalRequests();
});

test("contains the unified header at narrow and desktop widths", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openBlankWorkspace(page);

  const header = page.locator('[data-demo-id="app-header"]');
  const navigation = page.locator('[data-demo-id="product-navigation"]');
  const importLabel = page.locator('[data-demo-id="import-action"] span');
  const exportLabel = page.locator('[data-demo-id="save-workspace"] span');

  await expectProductTabIsland(page);
  await expectTransparentBackground(header);
  await expect(importLabel).toBeHidden();
  await expect(exportLabel).toBeHidden();
  await expect(page.locator('[data-demo-id="import-action"]')).toHaveAccessibleName("Import");
  await expect(page.locator('[data-demo-id="save-workspace"]')).toHaveAccessibleName("Export");
  expect(await header.evaluate((element) => element.getBoundingClientRect().height)).toBe(56);
  expect(await navigation.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(
    true,
  );
  await navigation.evaluate((element) => {
    element.scrollLeft = element.scrollWidth;
  });
  expect(await navigation.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );

  for (const width of [1024, 1280]) {
    await page.setViewportSize({ width, height: 720 });
    await expectProductTabIsland(page);
    await expectTransparentBackground(header);
    await expect(importLabel).toBeVisible();
    await expect(exportLabel).toBeVisible();
    expect(await header.evaluate((element) => element.getBoundingClientRect().height)).toBe(56);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
});

test("uses one continuous shell background with distinct bounded surfaces", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await openBlankWorkspace(page);

  const shell = page.locator('[data-demo-id="app-shell"]');
  const header = page.locator('[data-demo-id="app-header"]');
  const lightShellBackground = await getBackgroundColor(shell);

  expect(lightShellBackground).not.toBe("rgb(255, 255, 255)");
  expect(lightShellBackground).not.toBe("rgba(0, 0, 0, 0)");
  await expectTransparentBackground(header);
  await expectTransparentBackground(page.locator('[data-demo-id="top-level-empty-state"]'));

  await replaceWithSyntheticWorkspace(page);
  const surfaces = [
    ["tab-units", '[data-demo-id="units-tree-panel"]'],
    ["tab-employees", '[data-demo-id="employees-tab"]'],
    ["tab-org-editor", '[data-demo-id="org-editor-canvas"]'],
    ["tab-analytics", '[data-demo-id="analytics-tab"]'],
    ["tab-calendar", '[data-demo-id="calendar-tab"]'],
    ["tab-export", '[data-demo-id="export-tab"]'],
  ] as const;

  for (const [tabDemoId, selector] of surfaces) {
    await page.locator(`[data-demo-id="${tabDemoId}"]`).click();
    await expectTransparentBackground(page.locator(selector));
  }

  await page.locator('[data-demo-id="tab-employees"]').click();
  const employeeCard = page.locator('[data-demo-id="employees-list"] article').first();
  await expect(employeeCard).toBeVisible();
  expect(await getBackgroundColor(employeeCard)).not.toBe(lightShellBackground);

  await page.locator('[data-demo-id="theme-toggle"]').click();
  await page.getByRole("option", { name: "Dark", exact: true }).click();
  const darkShellBackground = await getBackgroundColor(shell);
  expect(darkShellBackground).not.toBe(lightShellBackground);
  expect(await getBackgroundColor(employeeCard)).not.toBe(darkShellBackground);
  await expectTransparentBackground(header);
  await expectTransparentBackground(page.locator('[data-demo-id="employees-tab"]'));
});

test("opens the chooser before the dialog and maps ordinary JSON without format examples", async ({
  page,
}) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankWorkspace(page);

  await expect(page.locator('[data-demo-id="import-file-input"]')).toHaveAttribute(
    "accept",
    ".json,application/json",
  );
  const canceledChooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Import", exact: true }).click();
  const canceledChooser = await canceledChooserPromise;
  await canceledChooser.setFiles([]);
  await expect(page.getByRole("dialog", { name: "Import" })).toHaveCount(0);

  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Import", exact: true }).click();
  const fileChooser = await fileChooserPromise;
  await expect(page.getByRole("dialog", { name: "Import" })).toHaveCount(0);
  await fileChooser.setFiles(syntheticEmployeesJsonPath);
  const dialog = page.getByRole("dialog", { name: "Import" });
  await expect(dialog).toBeVisible();
  await expectNoHorizontalRule(dialog.locator('[data-slot="dialog-header"]'));
  await expectNoHorizontalRule(dialog.locator('[data-slot="dialog-footer"]'));
  await expect(dialog.getByText("Field mapping", { exact: true })).toBeVisible();
  await expectNoHorizontalRule(dialog.locator('[data-demo-id="employee-mapping-row"]').first());
  await expect(dialog.getByRole("tab")).toHaveCount(0);
  await expect(dialog.getByRole("radiogroup", { name: "Import as" })).toContainText("Teams");
  await expect(dialog.getByRole("radiogroup", { name: "Import as" })).toContainText("Employees");
  await expect(dialog.getByText("employees.json", { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();

  const repeatedFileDialog = await openImportDialog(page, syntheticEmployeesJsonPath);
  await expect(repeatedFileDialog.getByText("Field mapping", { exact: true })).toBeVisible();
  await repeatedFileDialog.getByRole("button", { name: "Cancel", exact: true }).click();

  const malformedStateDialog = await openImportDialog(page, {
    buffer: Buffer.from(
      JSON.stringify({ employees: [], kind: "org-tools-state", unexpected: [], views: [] }),
    ),
    mimeType: "application/json",
    name: "malformed-state.json",
  });
  await expect(
    malformedStateDialog.getByText("Could not read or parse the selected file.", { exact: true }),
  ).toBeVisible();
  await expect(malformedStateDialog.getByText("Field mapping", { exact: true })).toHaveCount(0);
  await malformedStateDialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await assertLocalRequests();
});

test("selects and appends Employees from a recognized workspace state", async ({ page }) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankWorkspace(page);
  const dialog = await openImportDialog(page, syntheticWorkspacePath);
  await dialog.getByRole("radio", { name: "Employees", exact: true }).check();
  await expect(dialog.getByText("Structured import preview", { exact: true })).toBeVisible();
  await expect(dialog.getByText("4 new Employees", { exact: true })).toBeVisible();
  await expect(dialog.locator('[data-demo-id="structured-preview-employee-card"]')).toHaveCount(4);
  const importMode = dialog.locator('[data-demo-id="state-import-mode"]');
  await expect(importMode.getByText("Import mode", { exact: true })).toBeVisible();
  await expectNoHorizontalRule(importMode);
  await expect(importMode.locator('[data-demo-id="state-operation-append"]')).toHaveClass(
    /ring-primary/u,
  );
  await expect(importMode.locator('[data-demo-id="state-operation-append"]')).toHaveCSS(
    "border-top-width",
    "1px",
  );
  await expect(importMode.locator('[data-demo-id="state-operation-replace"]')).toHaveClass(
    /border-destructive/u,
  );
  await expect(
    dialog.getByRole("radiogroup", { name: "Import operation" }).getByRole("radio").first(),
  ).toBeChecked();
  await dialog.getByRole("button", { name: "Append", exact: true }).click();
  const importNotice = page.getByRole("status");
  await expect(importNotice).toHaveText("Import merged into Main.");
  await expectNoHorizontalRule(importNotice);

  await page.getByRole("tab", { name: "Employees", exact: true }).click();
  await expect(page.getByText("Avery Stone", { exact: true }).first()).toBeVisible();
  await assertLocalRequests();
});

test("previews nested recognized Teams with Employee cards and cancels without mutation", async ({
  page,
}) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankWorkspace(page);
  const dialog = await openImportDialog(page, syntheticWorkspacePath);
  await dialog.getByRole("radio", { name: "Teams + Employees", exact: true }).check();

  const product = dialog
    .locator('[data-demo-id="structured-preview-team"]')
    .filter({ hasText: "Product" });
  const platform = dialog
    .locator('[data-demo-id="structured-preview-team"]')
    .filter({ hasText: "Platform" });
  await expect(product).toBeVisible();
  await expect(platform).toBeVisible();
  expect(
    await platform.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).marginInlineStart),
    ),
  ).toBeGreaterThan(
    await product.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).marginInlineStart),
    ),
  );

  const cards = dialog.locator('[data-demo-id="structured-preview-employee-card"]');
  await expect(cards).toHaveCount(4);
  await expect(cards.filter({ hasText: "Avery Stone" })).toContainText("Product Lead");
  await expect(cards.filter({ hasText: "Avery Stone" })).toContainText("Boss");
  await expect(cards.filter({ hasText: "Riley Chen" })).toContainText("Research");

  await product.getByRole("button", { name: "Collapse" }).click();
  await expect(platform).toHaveCount(0);
  await product.getByRole("button", { name: "Expand" }).click();
  await expect(platform).toBeVisible();

  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.getByRole("tab", { name: "Employees", exact: true }).click();
  await expect(page.locator('[data-demo-id="top-level-empty-state"]')).toBeVisible();
  await assertLocalRequests();
});

test("keeps borderless Import chrome contained at 390 pixels", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankWorkspace(page);
  const dialog = await openImportDialog(page, syntheticWorkspacePath);
  await dialog.getByRole("radio", { name: "Teams + Employees", exact: true }).check();

  const append = dialog.locator('[data-demo-id="state-operation-append"]');
  const replace = dialog.locator('[data-demo-id="state-operation-replace"]');
  const appendBox = await append.boundingBox();
  const replaceBox = await replace.boundingBox();
  expect(appendBox).not.toBeNull();
  expect(replaceBox).not.toBeNull();
  expect(replaceBox?.y ?? 0).toBeGreaterThan((appendBox?.y ?? 0) + (appendBox?.height ?? 0) - 1);
  await expectNoHorizontalRule(dialog.locator('[data-slot="dialog-header"]'));
  await expectNoHorizontalRule(dialog.locator('[data-slot="dialog-footer"]'));
  await expect(dialog.locator('[data-slot="dialog-footer"]')).toBeVisible();
  expect(await dialog.evaluate((element) => element.scrollWidth)).toBeLessThanOrEqual(
    await dialog.evaluate((element) => element.clientWidth),
  );
  expect(
    await dialog.locator('[data-slot="dialog-body"]').evaluate((element) => element.scrollHeight),
  ).toBeGreaterThan(
    await dialog.locator('[data-slot="dialog-body"]').evaluate((element) => element.clientHeight),
  );
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await assertLocalRequests();
});

test("virtualizes a large mapped Team and Employee preview", async ({ page }) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankWorkspace(page);
  const teams = Array.from({ length: 120 }, (_, index) => ({
    employees: [
      {
        email: `employee-${index}@example.test`,
        employeeKey: `employee-${index}`,
        firstName: "Employee",
        lastName: String(index),
        position: "Contributor",
        username: `employee-${index}`,
      },
    ],
    key: `team-${index}`,
    name: `Team ${index}`,
  }));
  const dialog = await openImportDialog(page, {
    buffer: Buffer.from(JSON.stringify(teams)),
    mimeType: "application/json",
    name: "large-teams.json",
  });
  await dialog.getByRole("radio", { name: "Teams + Employees", exact: true }).check();
  const viewport = dialog.locator('[data-demo-id="structured-preview-viewport"]');
  await expect(viewport).toBeVisible();
  expect(await viewport.evaluate((element) => element.clientHeight)).toBeGreaterThanOrEqual(400);
  expect(await viewport.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(
    true,
  );
  expect(await dialog.locator('[data-demo-id="structured-preview-team"]').count()).toBeLessThan(
    teams.length,
  );
  await viewport.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await expect(dialog.getByText("Team 119", { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await assertLocalRequests();
});

test("selects and replaces current data with Teams from a recognized workspace state", async ({
  page,
}) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankWorkspace(page);
  const dialog = await openImportDialog(page, syntheticWorkspacePath);
  await dialog.getByRole("radio", { name: "Teams", exact: true }).check();
  await expect(dialog.getByText("2 manual Teams", { exact: true })).toBeVisible();
  await dialog
    .getByRole("radiogroup", { name: "Import operation" })
    .getByRole("radio")
    .last()
    .check();
  await expect(
    dialog.getByText("Remove current Employees, Teams, and custom Views before importing."),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Replace all current", exact: true }).click();

  await page.getByRole("tab", { name: "Units", exact: true }).click();
  await page.getByText("Product", { exact: true }).first().click();
  await expect(page.getByText("Platform", { exact: true }).first()).toBeVisible();
  await page.getByRole("tab", { name: "Employees", exact: true }).click();
  await expect(page.locator('[data-demo-id="top-level-empty-state"]')).toBeVisible();
  await assertLocalRequests();
});

test("maps nested generic JSON as Teams with Employee assignments", async ({ page }) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankWorkspace(page);
  const dialog = await openImportDialog(page, {
    buffer: Buffer.from(
      JSON.stringify([
        {
          children: [
            {
              employees: [
                {
                  email: "jordan.reed@example.test",
                  employeeKey: "jordan",
                  firstName: "Jordan",
                  isBoss: true,
                  lastName: "Reed",
                  position: "Engineer",
                  tags: ["Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta", "Theta"],
                  username: "jordan.reed",
                },
              ],
              key: "platform",
              name: "Platform",
            },
          ],
          key: "engineering",
          name: "Engineering",
        },
      ]),
    ),
    mimeType: "application/json",
    name: "teams-employees.json",
  });
  await dialog.getByRole("radio", { name: "Teams + Employees", exact: true }).check();
  await expect(dialog.getByText("1 assignments", { exact: true })).toBeVisible();
  await expect(
    dialog.locator('[data-demo-id="structured-preview-team"]').filter({ hasText: "Platform" }),
  ).toBeVisible();
  await expect(
    dialog
      .locator('[data-demo-id="structured-preview-employee-card"]')
      .filter({ hasText: "Jordan Reed" }),
  ).toContainText("Engineer");
  await dialog.getByRole("button", { name: "Append", exact: true }).click();

  const editorEmployee = page
    .locator("[data-org-editor-employee-row]")
    .filter({ hasText: "Jordan Reed" });
  await expect(editorEmployee).toContainText("Theta");
  await expect(editorEmployee.locator('[data-employee-tags-hidden-count="0"]')).toBeVisible();
  const platformCanvasUnit = page.locator('fieldset[aria-label="Canvas Unit Platform"]');
  await platformCanvasUnit.click({ button: "right" });
  await page.locator('[data-demo-id="org-editor-export-action"]').click();
  const imageExportDialog = page.getByRole("dialog", { name: "Export" });
  const imagePreview = imageExportDialog.locator('[data-demo-id="org-editor-export-image"]');
  await expect(imagePreview).toBeVisible();
  expect(
    await imagePreview.evaluate((image) => (image as HTMLImageElement).naturalHeight),
  ).toBeGreaterThan(120);
  const pngDownloadPromise = page.waitForEvent("download");
  await imageExportDialog.getByRole("button", { name: "Save", exact: true }).click();
  const pngDownload = await pngDownloadPromise;
  expect(pngDownload.suggestedFilename()).toMatch(/\.png$/u);
  const pngPath = await pngDownload.path();
  expect(pngPath).not.toBeNull();
  expect((await readFile(pngPath ?? "")).subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  await page.keyboard.press("Escape");
  await page.getByRole("tab", { name: "Units", exact: true }).click();
  await page.getByText("Platform", { exact: true }).first().click();
  const unitEmployee = page.locator('[data-demo-id="unit-employee-card"]');
  await expect(unitEmployee).toContainText("Jordan Reed");
  await expect(unitEmployee).toContainText("Theta");
  await expect(unitEmployee.locator('[data-employee-tags-hidden-count="0"]')).toBeVisible();
  await assertLocalRequests();
});

test("exports a blank workspace as the public state format", async ({ page }) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankWorkspace(page);

  await page.getByRole("button", { name: "Export", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Export workspace" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("radio", { name: /Full workspace/ })).toBeChecked();
  await expect(dialog.locator('input[value="teams"]')).toBeDisabled();
  await expect(dialog.locator('input[value="employees"]')).toBeDisabled();
  const downloadPromise = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Download", exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("org-tools-state.json");

  await assertLocalRequests();
});

test("downloads all workspace Export formats in order and re-imports the combined document", async ({
  page,
}) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankWorkspace(page);
  await replaceWithSyntheticWorkspace(page);

  const downloads: Array<{
    fileName: string;
    content: "employees" | "teams" | "teamsEmployees" | "workspace";
  }> = [
    { content: "teams", fileName: "org-tools-teams.json" },
    { content: "employees", fileName: "org-tools-employees.json" },
    { content: "teamsEmployees", fileName: "org-tools-teams-employees.json" },
    { content: "workspace", fileName: "org-tools-state.json" },
  ];
  let combinedPath = "";

  for (const expected of downloads) {
    await page.getByRole("button", { name: "Export", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Export workspace" });
    expect(
      await dialog
        .locator('input[name="save-format"]')
        .evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value)),
    ).toEqual(["teams", "employees", "teamsEmployees", "workspace"]);
    await expect(dialog.locator('input[value="workspace"]')).toBeChecked();
    await dialog.locator(`input[value="${expected.content}"]`).check();
    const downloadPromise = page.waitForEvent("download");
    await dialog.getByRole("button", { name: "Download", exact: true }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe(expected.fileName);
    const filePath = await download.path();
    expect(filePath).not.toBeNull();
    const document = JSON.parse(await readFile(filePath ?? "", "utf8")) as {
      content: string;
      kind: string;
    };
    expect(document.kind).toBe("org-tools-state");
    expect(document.content).toBe(expected.content);
    expect(document).not.toHaveProperty("formatVersion");
    expect(document).not.toHaveProperty("schemaVersion");
    if (expected.content === "teamsEmployees") combinedPath = filePath ?? "";
  }

  await page.reload({ waitUntil: "domcontentloaded" });
  const importDialog = await openImportDialog(page, combinedPath);
  await expect(importDialog.getByText("Structured import preview", { exact: true })).toBeVisible();
  await importDialog.getByRole("button", { name: "Append", exact: true }).click();
  await page.getByRole("tab", { name: "Units", exact: true }).click();
  await expect(page.getByText("Platform", { exact: true }).first()).toBeVisible();

  await assertLocalRequests();
});

test("keeps CSV as a Download output while Import accepts JSON only", async ({ page }) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankWorkspace(page);
  await replaceWithSyntheticWorkspace(page);

  await expect(page.locator('[data-demo-id="import-file-input"]')).toHaveAttribute(
    "accept",
    ".json,application/json",
  );
  await page.getByRole("tab", { name: "Download", exact: true }).click();
  await page
    .getByRole("button", { name: "Add Unit Employees to download", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  const settings = page.getByRole("dialog").filter({ hasText: "Download settings" });
  await expect(settings.getByRole("tab", { name: "CSV", exact: true })).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await settings.getByRole("button", { name: "Download", exact: true }).click();
  expect((await downloadPromise).suggestedFilename()).toBe("org-tools-export.csv");

  await assertLocalRequests();
});

test("creates, crops, re-crops, pastes, and removes a local Employee avatar", async ({ page }) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankWorkspace(page);
  await page.getByRole("tab", { name: "Employees", exact: true }).click();
  await page.getByRole("button", { name: "Create Employee", exact: true }).click();
  const employeeDialog = page.getByRole("dialog", { name: "Create Employee" });
  const pngBase64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2R2sAAAAASUVORK5CYII=";
  const pngBuffer = Buffer.from(pngBase64, "base64");

  await employeeDialog.getByLabel("Choose file", { exact: true }).setInputFiles({
    buffer: Buffer.from("<svg></svg>"),
    mimeType: "image/svg+xml",
    name: "avatar.svg",
  });
  await expect(employeeDialog.getByText("Choose a PNG, JPEG, or WebP image.")).toBeVisible();

  await employeeDialog.getByLabel("Choose file", { exact: true }).setInputFiles({
    buffer: pngBuffer,
    mimeType: "image/png",
    name: "avatar.png",
  });
  let cropDialog = page.getByRole("dialog", { name: "Crop avatar" });
  await expect(cropDialog).toBeVisible();
  await cropDialog.getByRole("slider", { name: "Zoom" }).fill("2");
  await cropDialog.getByRole("button", { name: "Use avatar", exact: true }).click();
  const preview = employeeDialog.locator('[data-demo-id="employee-avatar-preview"]');
  await expect(preview).toHaveAttribute("src", /^data:image\/webp;base64,/);
  expect(
    await preview.evaluate(async (element) => {
      const image = element as HTMLImageElement;
      await image.decode();
      return [image.naturalWidth, image.naturalHeight];
    }),
  ).toEqual([512, 512]);

  const croppedSource = await preview.getAttribute("src");
  await employeeDialog.getByRole("button", { name: "Adjust crop", exact: true }).click();
  cropDialog = page.getByRole("dialog", { name: "Crop avatar" });
  await cropDialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(preview).toHaveAttribute("src", croppedSource ?? "");

  await employeeDialog.locator("form").evaluate((form, encodedImage) => {
    const bytes = Uint8Array.from(atob(encodedImage), (character) => character.charCodeAt(0));
    const transfer = new DataTransfer();
    transfer.items.add(new File([bytes], "pasted.png", { type: "image/png" }));
    form.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, clipboardData: transfer }));
  }, pngBase64);
  cropDialog = page.getByRole("dialog", { name: "Crop avatar" });
  await expect(cropDialog).toBeVisible();
  await cropDialog.getByRole("button", { name: "Cancel", exact: true }).click();

  await page.evaluate((encodedImage) => {
    const bytes = Uint8Array.from(atob(encodedImage), (character) => character.charCodeAt(0));
    const blob = new Blob([bytes], { type: "image/png" });
    Object.defineProperty(navigator.clipboard, "read", {
      configurable: true,
      value: async () => [{ getType: async () => blob, types: ["image/png"] }],
    });
  }, pngBase64);
  await employeeDialog.getByRole("button", { name: "Paste image", exact: true }).click();
  cropDialog = page.getByRole("dialog", { name: "Crop avatar" });
  await cropDialog.getByRole("button", { name: "Use avatar", exact: true }).click();
  await employeeDialog.getByLabel("First name", { exact: true }).fill("Riley");
  await employeeDialog.getByRole("button", { name: "Create", exact: true }).click();

  await page.locator('[data-demo-id="employee-edit-button"]').click();
  const editDialog = page.getByRole("dialog", { name: "Edit Employee" });
  await expect(editDialog.locator('[data-demo-id="employee-avatar-preview"]')).toHaveAttribute(
    "src",
    /^data:image\/webp;base64,/,
  );
  await editDialog.getByRole("button", { name: "Remove avatar", exact: true }).click();
  await expect(editDialog.locator('[data-demo-id="employee-avatar-preview"]')).toHaveCount(0);
  await editDialog.getByRole("button", { name: "Save", exact: true }).click();

  await assertLocalRequests();
});

test("atomically opens a complete synthetic workspace", async ({ page }) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankWorkspace(page);
  await replaceWithSyntheticWorkspace(page);

  await expect(page.getByText("Platform", { exact: true }).first()).toBeVisible();
  await page.getByRole("tab", { name: "Units", exact: true }).click();
  await expect(page.locator('[data-demo-id="units-tree-panel"]')).toHaveCSS(
    "border-right-width",
    "1px",
  );
  await expectNoHorizontalRule(page.locator('[data-demo-id="units-tree-header"]'));
  await expectNoHorizontalRule(page.locator('[data-demo-id="units-employee-header"]'));
  await assertLocalRequests();
});

test("shows reactive total and filtered Employee counts", async ({ page }) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankWorkspace(page);
  await replaceWithSyntheticWorkspace(page);
  await page.getByRole("tab", { name: "Employees", exact: true }).click();

  await expectNoHorizontalRule(page.locator('[data-demo-id="employees-header"]'));

  const summary = page.locator('[data-demo-id="employees-summary"]');
  await expect(summary).toContainText("Employees");
  await expect(page.locator('[data-demo-id="employees-total-count"]')).toHaveText("4 Employees");
  await expect(page.locator('[data-demo-id="employees-match-count"]')).toHaveCount(0);

  const search = page.locator('[data-demo-id="employees-search"]');
  await search.getByRole("searchbox").fill("Avery");
  await expect(page.locator('[data-demo-id="employees-total-count"]')).toHaveText("4 Employees");
  await expect(page.locator('[data-demo-id="employees-match-count"]')).toHaveText("· 1 match");
  await search.getByRole("searchbox").fill("");
  await expect(page.locator('[data-demo-id="employees-match-count"]')).toHaveCount(0);

  await page.locator('[data-demo-id="employee-create-button"]').click();
  const createDialog = page.getByRole("dialog", { name: "Create Employee" });
  await expectNoHorizontalRule(createDialog.locator('[data-slot="dialog-header"]'));
  await expectNoHorizontalRule(createDialog.locator('[data-slot="dialog-footer"]'));
  await createDialog.getByLabel("First name", { exact: true }).fill("Taylor");
  await createDialog.getByLabel("Last name", { exact: true }).fill("Tester");
  await createDialog.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page.locator('[data-demo-id="employees-total-count"]')).toHaveText("5 Employees");

  const createdEmployee = page.locator("article").filter({ hasText: "Taylor Tester" });
  await createdEmployee.getByRole("button", { name: "Delete", exact: true }).click();
  const deleteDialog = page.getByRole("alertdialog");
  await expectNoHorizontalRule(deleteDialog.locator('[data-slot="alert-dialog-header"]'));
  await expectNoHorizontalRule(deleteDialog.locator('[data-slot="alert-dialog-footer"]'));
  await page.locator('[data-demo-id="confirm-delete-employee"]').click();
  await expect(page.locator('[data-demo-id="employees-total-count"]')).toHaveText("4 Employees");
  await assertLocalRequests();
});

test("renders clean content-sized Analytics groups with working drill-down", async ({ page }) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankWorkspace(page);
  await replaceWithSyntheticWorkspace(page);
  await page.getByRole("tab", { name: "Analytics", exact: true }).click();

  const analyticsHeader = page.locator('[data-demo-id="analytics-header"]');
  await expectNoHorizontalRule(analyticsHeader);
  const positions = page.locator('[data-demo-id="analytics-positions"]');
  await expect(positions).toHaveAttribute("data-analytics-entry-count", "4");
  await expect(positions).toHaveAttribute("data-analytics-visible-rows", "4");
  await expect(positions).toHaveCSS("height", "228px");
  await expect(positions.locator("header")).toHaveCSS("border-bottom-width", "0px");
  expect(
    await positions.locator("[data-analytics-row]").evaluateAll((rows) =>
      rows.map((row) => ({
        bottom: window.getComputedStyle(row).borderBottomWidth,
        top: window.getComputedStyle(row).borderTopWidth,
      })),
    ),
  ).toEqual(
    Array.from({ length: 4 }, () => ({
      bottom: "0px",
      top: "0px",
    })),
  );

  const firstRow = positions.locator("[data-analytics-row]").first();
  const restingBackground = await firstRow.evaluate(
    (row) => window.getComputedStyle(row).backgroundColor,
  );
  await firstRow.hover();
  expect(await firstRow.evaluate((row) => window.getComputedStyle(row).backgroundColor)).not.toBe(
    restingBackground,
  );

  const valueHeader = positions.getByRole("columnheader", { name: /Value/u });
  await valueHeader.getByRole("button", { name: "Value", exact: true }).click();
  await expect(valueHeader).toHaveAttribute("aria-sort", "ascending");
  await positions.locator('[data-demo-id="analytics-positions-view-button"]').first().click();
  const drillDown = page.locator('[data-demo-id="analytics-employees-dialog"]');
  await expect(drillDown).toBeVisible();
  await drillDown.getByRole("button", { name: "Close", exact: true }).click();

  const duplicates = page.locator('[data-demo-id="analytics-full-name-duplicates"]');
  await expect(duplicates).toHaveAttribute("data-analytics-visible-rows", "0");
  await expect(duplicates).toHaveCSS("height", "124px");
  await assertLocalRequests();
});

test("caps long Analytics groups at eight virtualized rows", async ({ page }) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankWorkspace(page);
  const state = JSON.parse(await readFile(syntheticWorkspacePath, "utf8")) as {
    employees: Array<Record<string, unknown>>;
  };
  const template = state.employees[0];
  if (!template) throw new Error("Synthetic Employee template is unavailable.");
  for (let index = 1; index <= 12; index += 1) {
    state.employees.push({
      ...template,
      avatarBase64Url: null,
      birthday: null,
      email: `sample-${index}@example.test`,
      firstName: `Sample${String(index).padStart(2, "0")}`,
      id: `50000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
      lastName: "Employee",
      profileUrl: null,
      tags: [],
      username: `sample-${index}`,
    });
  }
  const dialog = await openImportDialog(page, {
    buffer: Buffer.from(JSON.stringify(state)),
    mimeType: "application/json",
    name: "large-analytics-state.json",
  });
  await dialog.getByRole("button", { name: "Replace all current", exact: true }).click();
  await expect(page.getByRole("status")).toHaveCount(0);
  await page.getByRole("tab", { name: "Analytics", exact: true }).click();

  const firstNames = page.locator('[data-demo-id="analytics-first-names"]');
  await expect(firstNames).toHaveAttribute("data-analytics-entry-count", "16");
  await expect(firstNames).toHaveAttribute("data-analytics-visible-rows", "8");
  await expect(firstNames).toHaveCSS("height", "396px");
  const scrollArea = page.locator('[data-demo-id="analytics-first-names-scroll-area"]');
  expect(
    await scrollArea.evaluate((element) => ({
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
    })),
  ).toMatchObject({ clientHeight: 368 });
  expect(await scrollArea.evaluate((element) => element.scrollHeight)).toBeGreaterThan(368);
  await assertLocalRequests();
});

test("renders safe profile links, birthdays, and dated tag events", async ({ page }) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankWorkspace(page);
  await replaceWithSyntheticWorkspace(page);

  await page.getByRole("tab", { name: "Employees", exact: true }).click();
  const profileLink = page.getByRole("link", { name: "Avery Stone", exact: true }).first();
  await expect(profileLink).toHaveAttribute("href", "https://example.test/profiles/avery-stone");
  await expect(profileLink).toHaveAttribute("target", "_blank");
  await expect(profileLink).toHaveAttribute("rel", "noopener noreferrer");
  await expect(profileLink).toHaveAttribute("referrerpolicy", "no-referrer");

  await page.getByRole("tab", { name: "Calendar", exact: true }).click();
  await expect(page.getByText("Employee Calendar", { exact: true })).toBeVisible();
  const julyBirthday = page.locator('[data-calendar-date="2026-07-22"]');
  await expect(julyBirthday).toHaveRole("button");
  await julyBirthday.click();
  await expect(page.getByRole("dialog", { name: /July 22, 2026/ })).toContainText("Jordan Reed");
  await page
    .getByRole("dialog", { name: /July 22, 2026/ })
    .getByRole("button", { name: "Close" })
    .click();
  await page
    .locator('[data-demo-id="dated-tag-cloud"]')
    .getByRole("button", { name: /Operations/ })
    .click();
  const tagDialog = page.getByRole("dialog", { name: "Operations" });
  await expect(tagDialog).toContainText("Morgan Park");
  await expect(tagDialog).toContainText("Past");

  await assertLocalRequests();
});

test("keeps Calendar navigation in the header and fits July at 1280 by 720", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankWorkspace(page);
  await replaceWithSyntheticWorkspace(page);
  await page.getByRole("tab", { name: "Calendar", exact: true }).click();

  const navigation = page.locator('[data-demo-id="calendar-header-navigation"]');
  await expectNoHorizontalRule(page.locator('[data-demo-id="calendar-header"]'));
  await expectNoHorizontalRule(page.locator('[data-demo-id="dated-tag-cloud"]'));
  await expect(page.locator('[data-calendar-date="2026-07-01"]')).toHaveCSS(
    "border-top-width",
    "1px",
  );
  await expect(navigation).toContainText("July 2026");
  await expect(navigation.getByRole("button")).toHaveText(["Previous", "Next"]);
  const layout = await page.locator('[data-demo-id="calendar-scroll-area"]').evaluate((element) => {
    const grid = element.querySelector('[data-demo-id="calendar-month-grid"]');
    if (!(grid instanceof HTMLElement)) throw new Error("Calendar grid is unavailable.");
    const area = element as HTMLElement;
    return {
      gridBottom: grid.getBoundingClientRect().bottom,
      gridRight: grid.getBoundingClientRect().right,
      scrollBottom: area.getBoundingClientRect().bottom,
      scrollHeight: area.scrollHeight,
      scrollRight: area.getBoundingClientRect().right,
      scrollWidth: area.scrollWidth,
      visibleHeight: area.clientHeight,
      visibleWidth: area.clientWidth,
    };
  });
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.visibleWidth);
  expect(layout.scrollHeight).toBeLessThanOrEqual(layout.visibleHeight);
  expect(layout.gridRight).toBeLessThanOrEqual(layout.scrollRight);
  expect(layout.gridBottom).toBeLessThanOrEqual(layout.scrollBottom);

  for (let index = 0; index < 6; index += 1) {
    await navigation.getByRole("button", { name: "Next", exact: true }).click();
  }
  await expect(navigation).toContainText("January 2027");

  await assertLocalRequests();
});

test("edits and clears a dated tag from quick and full Employee editors", async ({ page }) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankWorkspace(page);
  await replaceWithSyntheticWorkspace(page);
  await page.getByRole("tab", { name: "Employees", exact: true }).click();

  await page.locator('[data-demo-id="employees-tag-picker-trigger"]').first().click();
  const tagPopover = page.locator('[data-demo-id="employees-tag-picker-popover"]');
  await expect(tagPopover.locator('input[type="date"]')).toHaveCount(0);
  await tagPopover.getByRole("button", { name: "Date for tag Remote" }).click();
  const quickDateInput = page.locator('input[type="date"][aria-label="Date for tag Remote"]');
  await expect(quickDateInput).toHaveValue("2026-08-12");
  await quickDateInput.fill("2026-08-15");
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");

  await page.locator('[data-demo-id="employee-edit-button"]').first().click();
  let employeeDialog = page.getByRole("dialog", { name: "Edit Employee" });
  await expect(employeeDialog.locator('input[type="date"]')).toHaveCount(0);
  await employeeDialog.getByRole("button", { name: "Date for tag Remote" }).click();
  const employeeTagDate = page.locator('input[type="date"][aria-label="Date for tag Remote"]');
  await expect(employeeTagDate).toHaveValue("2026-08-15");
  await page.getByRole("button", { name: "Clear date", exact: true }).click();
  await employeeDialog.getByRole("button", { name: "Save", exact: true }).click();

  await page.locator('[data-demo-id="employee-edit-button"]').first().click();
  employeeDialog = page.getByRole("dialog", { name: "Edit Employee" });
  await expect(employeeDialog.locator('input[type="date"]')).toHaveCount(0);
  await employeeDialog.getByRole("button", { name: "Date for tag Remote" }).click();
  await expect(page.locator('input[type="date"][aria-label="Date for tag Remote"]')).toHaveValue(
    "",
  );
  await page.keyboard.press("Escape");
  await employeeDialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await assertLocalRequests();
});

test("adds a tag and applies one date through the bulk Org Editor menu", async ({ page }) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankWorkspace(page);
  await replaceWithSyntheticWorkspace(page);

  const productUnit = page.locator(
    '[data-org-editor-unit-id="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"]',
  );
  const rows = productUnit.locator("[data-org-editor-employee-row]");
  await expect(rows).toHaveCount(2);
  await rows.nth(0).click();
  await rows.nth(1).click({ modifiers: ["Control"] });
  await rows.nth(1).click({ button: "right" });
  const contextMenu = page.locator("[data-org-editor-context-menu]");
  await contextMenu.locator('[data-demo-id="org-editor-employee-tags-action"]').hover();
  const tagPanel = page.locator('[data-demo-id="org-editor-employee-tags-panel"]');
  await expect(tagPanel).toBeVisible();
  await tagPanel.getByRole("checkbox", { name: "Remote", exact: true }).click();
  await tagPanel.getByRole("button", { name: "Date for tag Remote" }).click();
  await page.locator('input[type="date"][aria-label="Date for tag Remote"]').fill("2026-08-18");
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");

  await page.getByRole("tab", { name: "Employees", exact: true }).click();
  await page.locator('[data-demo-id="employee-edit-button"]').nth(3).click();
  const employeeDialog = page.getByRole("dialog", { name: "Edit Employee" });
  await employeeDialog.getByRole("button", { name: "Date for tag Remote" }).click();
  await expect(page.locator('input[type="date"][aria-label="Date for tag Remote"]')).toHaveValue(
    "2026-08-18",
  );
  await page.keyboard.press("Escape");
  await employeeDialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await assertLocalRequests();
});

test("maps and imports synthetic JSON Employees without Unit assignments", async ({ page }) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankWorkspace(page);

  const dialog = await openImportDialog(page, syntheticEmployeesJsonPath);
  await expect(dialog.getByText("Field mapping", { exact: true })).toBeVisible();
  await expect(dialog.getByText("2 new", { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Import 2 Employees", exact: true }).click();
  await expect(dialog).toBeHidden();

  await page.getByRole("tab", { name: "Employees", exact: true }).click();
  await expect(page.getByText("Avery Stone", { exact: true }).first()).toBeVisible();
  await assertLocalRequests();
});

test("discovers the nested Employee collection in synthetic JSON", async ({ page }) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await openBlankWorkspace(page);

  const dialog = await openImportDialog(page, syntheticEmployeesJsonPath);
  await expect(dialog.getByText("$.records (2 rows)", { exact: true }).first()).toBeVisible();
  await expect(dialog.getByText("Field mapping", { exact: true })).toBeVisible();
  await expect(dialog.getByText("2 new", { exact: true })).toBeVisible();

  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(dialog).toBeHidden();
  await assertLocalRequests();
});
