import { readFile } from "node:fs/promises";

import type { AppLocale, OrgToolsState } from "@org-tools/types";
import type { Locator, Page } from "@playwright/test";
import arMessages from "../../../apps/ui/messages/ar.json" with { type: "json" };
import enMessages from "../../../apps/ui/messages/en.json" with { type: "json" };
import esMessages from "../../../apps/ui/messages/es.json" with { type: "json" };
import frMessages from "../../../apps/ui/messages/fr.json" with { type: "json" };
import ruMessages from "../../../apps/ui/messages/ru.json" with { type: "json" };
import zhMessages from "../../../apps/ui/messages/zh.json" with { type: "json" };
import { expect, test } from "./browser-test.js";
import {
  expectLocalRequestsOnly,
  type ImportFilePayload,
  localeStorageKey,
  resetServerState,
  syntheticStatePath,
} from "./helpers.js";

type Messages = typeof enMessages;

const setBrowserLanguages = async (page: Page, languages: string[]) => {
  await page.addInitScript((values) => {
    Object.defineProperty(navigator, "language", {
      configurable: true,
      value: values[0],
    });
    Object.defineProperty(navigator, "languages", {
      configurable: true,
      value: values,
    });
  }, languages);
};

const seedLocale = async (page: Page, locale: AppLocale) => {
  await page.addInitScript(({ key, value }) => window.localStorage.setItem(key, value), {
    key: localeStorageKey,
    value: locale,
  });
};

const chooseImportFile = async (
  page: Page,
  messages: Messages,
  file: ImportFilePayload | string,
) => {
  await page.getByRole("button", { name: messages.Ui.Import, exact: true }).click();
  const dialog = page.getByRole("dialog", { name: messages.Ui.Import, exact: true });
  const fileChooserPromise = page.waitForEvent("filechooser");
  await dialog.getByText(messages.Ui["Choose file"], { exact: true }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(file);
  await expect(dialog).toBeVisible();
  return dialog;
};

const expectLeadingThematicIcon = async (control: Locator, accessibleName: string) => {
  await expect(control).toHaveAccessibleName(accessibleName);
  expect(
    await control.evaluate((element) => ({
      firstChild: element.firstElementChild?.tagName.toLowerCase() ?? null,
      iconIndex: [...element.children].findIndex((child) => child.tagName.toLowerCase() === "svg"),
      labelIndex: [...element.children].findIndex(
        (child) => child.tagName.toLowerCase() === "span",
      ),
    })),
  ).toEqual({ firstChild: "svg", iconIndex: 0, labelIndex: 1 });
};

const expectTrailingThematicIcon = async (control: Locator, accessibleName: string) => {
  await expect(control).toHaveAccessibleName(accessibleName);
  expect(
    await control.evaluate((element) => ({
      firstChild: element.firstElementChild?.tagName.toLowerCase() ?? null,
      iconIndex: [...element.children].findIndex((child) => child.tagName.toLowerCase() === "svg"),
      labelIndex: [...element.children].findIndex(
        (child) => child.tagName.toLowerCase() === "span",
      ),
    })),
  ).toEqual({ firstChild: "span", iconIndex: 1, labelIndex: 0 });
};

test("honors a supported locale from the current state", async ({ page }) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await setBrowserLanguages(page, ["de-DE", "ar-EG", "en-US"]);
  await page.addInitScript((key) => window.localStorage.removeItem(key), localeStorageKey);
  await page.goto(await resetServerState(page, "ar"), { waitUntil: "domcontentloaded" });

  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("tab", { name: arMessages.Ui.Editor, exact: true })).toBeVisible();
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    arMessages.Metadata.description,
  );
  expect(await page.evaluate((key) => window.localStorage.getItem(key), localeStorageKey)).toBe(
    "ar",
  );
  await assertLocalRequests();
});

test("falls back to English for unsupported browser locales", async ({ page }) => {
  await setBrowserLanguages(page, ["de-DE", "it-IT"]);
  await page.addInitScript((key) => window.localStorage.removeItem(key), localeStorageKey);
  await page.goto(await resetServerState(page), { waitUntil: "domcontentloaded" });

  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("tab", { name: enMessages.Ui.Editor, exact: true })).toBeVisible();
  expect(await page.evaluate((key) => window.localStorage.getItem(key), localeStorageKey)).toBe(
    "en",
  );
});

test("switches the interface in place and persists the choice", async ({ page }, testInfo) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await page.goto(await resetServerState(page), { waitUntil: "domcontentloaded" });

  const languageToggle = page.locator('[data-demo-id="language-toggle"]');
  const themeToggle = page.locator('[data-demo-id="theme-toggle"]');
  const languageBox = await languageToggle.boundingBox();
  const themeBox = await themeToggle.boundingBox();
  expect(languageBox).not.toBeNull();
  expect(themeBox).not.toBeNull();
  expect(languageBox?.x).toBe(themeBox?.x);
  expect(languageBox?.y ?? 0).toBeLessThan(themeBox?.y ?? 0);

  await languageToggle.click();
  const languageDialog = page.locator('[data-demo-id="language-dialog"]');
  await expect(languageDialog.getByRole("radio")).toHaveCount(6);
  await languageDialog.locator('label:has(input[value="ru"])').click();

  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(page.getByRole("tab", { name: ruMessages.Ui.Units, exact: true })).toBeVisible();
  await expect(languageToggle).toHaveAccessibleName(
    `${ruMessages.Ui.Language}: ${ruMessages.Ui.Russian}`,
  );
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    ruMessages.Metadata.description,
  );
  const header = page.locator("header");
  const sidebar = page.locator('[data-demo-id="app-sidebar"]');
  await expect(header).toHaveCount(0);
  await expect(sidebar.getByRole("tab", { name: ruMessages.Ui.Editor, exact: true })).toBeVisible();
  await expect(
    sidebar.getByRole("button", { name: ruMessages.Ui.Import, exact: true }),
  ).toBeVisible();
  await expect(
    sidebar.getByRole("button", { name: ruMessages.Ui.Export, exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("tab", { name: ruMessages.Ui["Data Download"], exact: true }),
  ).toBeVisible();
  await expect(page.locator('[data-demo-id="top-level-empty-state"]')).toBeVisible();
  await expect(page.locator('[data-demo-id="org-view-toolbar"]')).toHaveCount(0);
  await page.screenshot({
    animations: "disabled",
    fullPage: true,
    path: testInfo.outputPath("russian-shell.png"),
  });

  const stateDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: ruMessages.Ui.Export, exact: true }).click();
  expect((await stateDownloadPromise).suggestedFilename()).toBe("org-tools-state.json");

  await page.getByRole("tab", { name: ruMessages.Ui.Employees, exact: true }).click();
  await page.getByRole("button", { name: ruMessages.Ui["Add Employee"], exact: true }).click();
  const employeeDialog = page.getByRole("dialog", { name: ruMessages.Ui["Create Employee"] });
  await expect(
    employeeDialog.getByRole("button", { name: ruMessages.Ui["Paste image"], exact: true }),
  ).toBeVisible();
  await page.screenshot({
    animations: "disabled",
    fullPage: true,
    path: testInfo.outputPath("russian-employee-avatar.png"),
  });
  await employeeDialog.getByRole("button", { name: ruMessages.Ui.Cancel, exact: true }).click();
  await page.getByRole("tab", { name: ruMessages.Ui.Editor, exact: true }).click();

  await page.getByRole("button", { name: ruMessages.Ui["Add to empty canvas"] }).click();
  await page.getByRole("button", { name: ruMessages.Ui["Add Unit"], exact: true }).click();
  const unitDialog = page.getByRole("dialog", { name: ruMessages.Ui["Add Unit"] });
  await unitDialog.getByLabel(ruMessages.Ui.Name, { exact: true }).fill("Platform");
  await unitDialog.getByRole("button", { name: ruMessages.Ui.Save, exact: true }).click();
  await expect(unitDialog).toBeHidden();

  const dialog = await chooseImportFile(page, ruMessages, syntheticStatePath);
  await expect(dialog.getByRole("tab")).toHaveCount(2);
  await expect(dialog.locator('[data-demo-id="state-import-summary"]')).toContainText("4");
  await page.screenshot({
    animations: "disabled",
    fullPage: true,
    path: testInfo.outputPath("russian-state-import.png"),
  });
  await dialog.getByRole("button", { name: ruMessages.Ui.Cancel, exact: true }).click();

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(page.getByRole("tab", { name: ruMessages.Ui.Editor, exact: true })).toBeVisible();
  expect(consoleErrors.filter((message) => message.includes("INVALID_KEY"))).toEqual([]);
});

for (const [locale, messages] of [
  ["en", enMessages],
  ["zh", zhMessages],
  ["ru", ruMessages],
  ["es", esMessages],
  ["fr", frMessages],
  ["ar", arMessages],
] as const satisfies ReadonlyArray<readonly [AppLocale, Messages]>) {
  test(`localizes explicit database recovery in ${locale}`, async ({ page }) => {
    const assertLocalRequests = await expectLocalRequestsOnly(page);
    await seedLocale(page, locale);
    await page.route("**/api/state", async (route) => {
      await route.fulfill({
        body: JSON.stringify({ error: { code: "database_unavailable" } }),
        contentType: "application/json",
        status: 200,
      });
    });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByText(messages.Ui["Database unavailable"], { exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: messages.Ui.Retry, exact: true })).toBeVisible();
    await page.getByRole("button", { name: messages.Ui["Create new"], exact: true }).click();
    const recovery = page.locator('[data-demo-id="database-create-new-dialog"]');
    await expect(recovery).toContainText(messages.Ui["Create a new database?"]);
    await expect(recovery).toContainText(
      messages.Ui["The current database files will be kept as a timestamped backup."],
    );
    await recovery.getByRole("button", { name: messages.Ui.Cancel, exact: true }).click();
    await assertLocalRequests();
  });

  test(`keeps export, import, and localized error workflows local in ${locale}`, async ({
    page,
  }, testInfo) => {
    const assertLocalRequests = await expectLocalRequestsOnly(page);
    await seedLocale(page, locale);
    await page.goto(await resetServerState(page, locale), { waitUntil: "domcontentloaded" });

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: messages.Ui.Export, exact: true }).click();
    expect((await downloadPromise).suggestedFilename()).toBe("org-tools-state.json");
    const localizedState = JSON.parse(await readFile(syntheticStatePath, "utf8")) as OrgToolsState;
    localizedState.ui.locale = locale;
    let dialog = await chooseImportFile(page, messages, {
      buffer: Buffer.from(JSON.stringify(localizedState)),
      mimeType: "application/json",
      name: "synthetic-state.json",
    });
    await expect(dialog.locator('[data-demo-id="state-import-summary"]')).toContainText("4");
    await dialog.getByRole("button", { name: messages.Ui["Replace state"], exact: true }).click();
    await expect(dialog).toBeHidden();

    await page.getByRole("tab", { name: messages.Ui.Employees, exact: true }).click();
    await page.getByRole("button", { name: messages.Ui.Tags, exact: true }).click();
    const tagCatalog = page.getByRole("dialog", { name: messages.Ui.Tags, exact: true });
    const tagColorTrigger = tagCatalog.locator('[data-demo-id="tag-color-trigger"]').first();
    await expect(tagColorTrigger).toHaveAccessibleName(messages.Ui["Choose Tag color"]);
    await tagColorTrigger.click();
    const tagColorDropdown = page.locator('[data-demo-id="tag-color-dropdown"]');
    await expect(tagColorDropdown).toContainText(messages.Ui["Full color palette"]);
    await expect(tagColorDropdown).toContainText(messages.Ui["Exact color"]);
    await expect(tagColorDropdown.getByLabel(messages.Ui["Color format"])).toBeVisible();
    await expect(tagColorDropdown.getByLabel(messages.Ui["Color value"])).toBeVisible();
    await expect(tagColorDropdown.getByLabel(messages.Ui.Hue)).toBeVisible();
    await expect(
      tagColorDropdown.getByRole("option", { name: messages.Ui["No color"], exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await tagCatalog
      .getByRole("button", { name: messages.Ui["Edit tag"], exact: true })
      .first()
      .click();
    const tagEditor = page.getByRole("dialog", {
      name: messages.Ui["Edit tag"],
      exact: true,
    });
    await expect(tagEditor.locator('[data-demo-id="tag-color-trigger"]')).toHaveCount(0);
    await tagEditor.getByRole("button", { name: messages.Ui.Cancel, exact: true }).click();
    await tagCatalog.getByRole("button", { name: messages.Ui.Close, exact: true }).first().click();

    await page.getByRole("tab", { name: messages.Ui.Editor, exact: true }).click();
    const editorCanvas = page.locator('[data-demo-id="org-editor-canvas"]');
    const editorWorld = editorCanvas.locator(':scope > div[dir="ltr"]');
    const productUnit = page.locator("fieldset").filter({ hasText: "Product" }).first();
    await expect(editorWorld).toHaveCount(1);
    await expect(productUnit).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
    const expectedFont =
      locale === "ar" ? '"Noto Sans Arabic"' : locale === "zh" ? '"Noto Sans SC"' : '"Noto Sans"';
    expect(
      await productUnit.evaluate((element) => window.getComputedStyle(element).fontFamily),
    ).toContain(expectedFont);
    if (locale === "ar") {
      const [canvasBox, viewBox, historyBox, actionBox] = await Promise.all([
        editorCanvas.boundingBox(),
        page.locator('[data-demo-id="org-editor-view-toolbar"]').boundingBox(),
        page.locator('[data-demo-id="org-editor-history-actions"]').boundingBox(),
        page.locator('[data-demo-id="org-editor-actions"]').boundingBox(),
      ]);
      expect(canvasBox).not.toBeNull();
      expect(viewBox).not.toBeNull();
      expect(historyBox).not.toBeNull();
      expect(actionBox).not.toBeNull();
      expect((viewBox?.x ?? 0) + (viewBox?.width ?? 0)).toBeCloseTo(
        (canvasBox?.x ?? 0) + (canvasBox?.width ?? 0) - 18,
        0,
      );
      expect((historyBox?.x ?? 0) + (historyBox?.width ?? 0)).toBeLessThan(viewBox?.x ?? 0);
      expect(actionBox?.x ?? 0).toBeCloseTo((canvasBox?.x ?? 0) + 12, 0);
    }
    await productUnit.click({ button: "right", position: { x: 20, y: 20 } });
    await page.locator('[data-demo-id="org-editor-export-action"]').click();
    const editorExport = page.locator('[data-demo-id="org-editor-export-dialog"]');
    await expect(editorExport).toBeVisible();
    await expect(editorExport.getByLabel(messages.Ui["isBoss value"], { exact: true })).toHaveValue(
      messages.Ui.Manager,
    );
    for (const scopeName of [messages.Ui["Entire subtree"], messages.Ui["Unit only"]]) {
      const scope = editorExport.getByRole("tab", { name: scopeName, exact: true });
      await expect(scope.locator("svg")).toHaveCount(1);
      await expect(scope.locator("svg")).toBeVisible();
    }
    await editorExport.getByRole("tab", { name: "JSON", exact: true }).click();
    await expect(
      editorExport.getByRole("button", {
        name: messages.Ui["Drag {name} to reorder"].replace("{name}", "username"),
        exact: true,
      }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(editorExport).toBeHidden();

    await page.getByRole("button", { name: messages.Ui.Import, exact: true }).click();
    const employeeImportDialog = page.getByRole("dialog", {
      name: messages.Ui.Import,
      exact: true,
    });
    await employeeImportDialog
      .getByRole("tab", { name: messages.Ui.Employees, exact: true })
      .click();
    const employeeChooser = page.waitForEvent("filechooser");
    await employeeImportDialog.getByText(messages.Ui["Choose file"], { exact: true }).click();
    await (await employeeChooser).setFiles({
      buffer: Buffer.from(
        JSON.stringify([
          {
            email: "localized.employee@example.test",
            firstName: "Localized",
            id: "00000000-0000-4000-8000-000000000099",
            lastName: "Employee",
            teams: [],
          },
        ]),
      ),
      mimeType: "application/json",
      name: "localized-employees.json",
    });
    await expect(
      employeeImportDialog.getByText(messages.Ui["Representative JSON record"], { exact: true }),
    ).toBeVisible();
    await expect(
      employeeImportDialog.getByText(messages.Ui["Source JSON path"], { exact: true }),
    ).toBeVisible();
    await expect(
      employeeImportDialog.getByText(messages.Ui["Org Tools field"], { exact: true }),
    ).toBeVisible();
    await expect(
      employeeImportDialog.getByRole("button", {
        name: messages.Ui["Import Employees"],
        exact: true,
      }),
    ).toBeEnabled();
    await employeeImportDialog
      .getByRole("button", { name: messages.Ui.Cancel, exact: true })
      .click();
    await page.locator('[data-demo-id="tab-units"]').click();
    await expectLeadingThematicIcon(
      page.locator('[data-demo-id="unit-create-root-button"]'),
      messages.Ui["Add Unit"],
    );
    await expect(page.locator('[data-demo-id="units-employee-summary"]')).toContainText("4");
    await expect(page.locator('[data-demo-id="units-employee-match-count"]')).toHaveCount(0);
    const unitRosterRows = page.locator(
      '[data-demo-id="units-employee-cards"] [data-employee-list-track] > [data-index]',
    );
    await expect(unitRosterRows).toHaveCount(4);
    await expect(unitRosterRows.locator('[data-demo-id="unit-employee-card"]')).toHaveCount(4);
    await page.locator('[data-demo-id="tab-employees"]').click();
    await expect(page.getByText("Avery Stone", { exact: true }).first()).toBeVisible();
    const createEmployeeButton = page.locator('[data-demo-id="employee-create-button"]');
    await expectLeadingThematicIcon(createEmployeeButton, messages.Ui["Add Employee"]);
    await createEmployeeButton.click();
    const employeeDialog = page.getByRole("dialog", { name: messages.Ui["Create Employee"] });
    await expect(employeeDialog.getByText(messages.Ui.Avatar, { exact: true })).toBeVisible();
    await expect(
      employeeDialog.getByRole("button", { name: messages.Ui["Paste image"], exact: true }),
    ).toBeVisible();
    await expect(
      employeeDialog.getByRole("combobox", { name: messages.Ui.Day, exact: true }),
    ).toBeVisible();
    await expect(
      employeeDialog.getByRole("combobox", { name: messages.Ui.Month, exact: true }),
    ).toBeVisible();
    await employeeDialog.getByRole("combobox", { name: messages.Ui.Year, exact: true }).click();
    await expect(
      page.getByRole("option", { name: messages.Ui["Unknown year"], exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await employeeDialog.getByRole("button", { name: messages.Ui.Cancel, exact: true }).click();

    await page.getByRole("tab", { name: messages.Ui["Data Download"], exact: true }).click();
    await page.locator('[data-demo-id="export-source-tab-employees"]').click();
    await page.locator('[data-demo-id="export-toggle-employee"]').first().click();
    const continueButton = page.getByRole("button", { name: messages.Ui.Continue, exact: true });
    await expectTrailingThematicIcon(continueButton, messages.Ui.Continue);
    await continueButton.click();
    const downloadSettings = page.getByRole("dialog").filter({
      hasText: messages.Ui["Download settings"],
    });
    await downloadSettings.getByRole("button", { name: messages.Ui.Copy, exact: true }).click();
    await expect(
      downloadSettings.getByText(messages.Ui["Copied to the clipboard"], { exact: true }),
    ).toBeVisible();
    const localDownloadPromise = page.waitForEvent("download");
    await downloadSettings.getByRole("button", { name: messages.Ui.Download, exact: true }).click();
    await localDownloadPromise;
    await expect(downloadSettings.locator('[data-demo-id="export-actions"] > div')).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(downloadSettings).toBeHidden();

    dialog = await chooseImportFile(page, messages, {
      buffer: Buffer.from("{"),
      mimeType: "application/json",
      name: "invalid.json",
    });
    await expect(
      dialog.getByText(messages.Ui["Could not read or parse the selected file."], { exact: true }),
    ).toBeVisible();
    await dialog.getByRole("button", { name: messages.Ui.Cancel, exact: true }).click();

    dialog = await chooseImportFile(page, messages, {
      buffer: Buffer.from(JSON.stringify({ content: "employees", kind: "org-tools-state" })),
      mimeType: "application/json",
      name: "partial.json",
    });
    await expect(
      dialog.getByText(messages.Ui["Only a complete Org Tools state can be imported."], {
        exact: true,
      }),
    ).toBeVisible();
    await dialog.getByRole("button", { name: messages.Ui.Cancel, exact: true }).click();
    await expect(page.locator('[data-demo-id="app-notice"]')).toHaveCount(0);
    await expect(page.locator('[data-demo-id="state-write-error"]')).toHaveCount(0);
    await page.locator('[data-demo-id="tab-employees"]').click();
    await expect(page.locator('[data-demo-id="employees-total-count"]')).toContainText("4");
    await expect(page.locator('[data-demo-id="employees-match-count"]')).toHaveCount(0);
    await page.locator('[data-demo-id="employees-search"]').getByRole("searchbox").fill("Avery");
    await expect(page.locator('[data-demo-id="employees-match-count"]')).toHaveText(/^·\s*.+/u);
    if (locale === "ru") {
      await page.screenshot({
        animations: "disabled",
        fullPage: true,
        path: testInfo.outputPath("russian-employee-counts.png"),
      });
      await page.getByRole("tab", { name: messages.Ui.Analytics, exact: true }).click();
      await expect(page.locator('[data-demo-id="analytics-grid"]')).toBeVisible();
      await page.screenshot({
        animations: "disabled",
        fullPage: true,
        path: testInfo.outputPath("russian-analytics-clean.png"),
      });
    }
    await page.getByRole("tab", { name: messages.Ui.Calendar, exact: true }).click();
    await expect(page.locator('[data-demo-id="calendar-weekdays"]')).toBeVisible();
    await page
      .locator('[data-demo-id="dated-tag-rail"]')
      .getByRole("button", { name: /Operations/u })
      .click();
    const tagDialog = page.getByRole("dialog", { name: "Operations" });
    await expect(tagDialog).toContainText("Morgan Park");
    await expect(tagDialog.locator('[data-slot="dialog-description"]')).toHaveCount(0);
    const tagEmployeeCard = tagDialog
      .locator('[data-demo-id="calendar-tag-event-employee-card"]')
      .first();
    await expect(
      tagEmployeeCard.getByRole("button", { name: messages.Ui.Edit, exact: true }),
    ).toBeVisible();
    await expect(
      tagEmployeeCard.getByRole("button", { name: messages.Ui.Delete, exact: true }),
    ).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.locator("html")).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
    await assertLocalRequests();
  });
}
