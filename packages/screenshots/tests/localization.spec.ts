import { expect, type Locator, type Page, test } from "@playwright/test";

import enMessages from "../../../apps/ui/messages/en.json" with { type: "json" };
import ruMessages from "../../../apps/ui/messages/ru.json" with { type: "json" };
import {
  expectLocalRequestsOnly,
  type ImportFilePayload,
  localeStorageKey,
  syntheticEmployeesJsonPath,
  syntheticWorkspacePath,
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

const seedLocale = async (page: Page, locale: "en" | "ru") => {
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
  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: messages.Ui.Import, exact: true }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(file);
  const dialog = page.getByRole("dialog", { name: messages.Ui.Import });
  await expect(dialog).toBeVisible();
  return dialog;
};

const readSelectValueLayout = async (value: Locator) =>
  value.evaluate((element) => {
    const trigger = element.closest('[data-slot="select-trigger"]');
    if (!(trigger instanceof HTMLElement) || !(element instanceof HTMLElement)) {
      throw new Error("Expected the Select value to be inside its trigger.");
    }

    const triggerBounds = trigger.getBoundingClientRect();
    const valueBounds = element.getBoundingClientRect();
    return {
      fitsHorizontally: element.scrollWidth <= element.clientWidth + 1,
      isContained:
        valueBounds.top >= triggerBounds.top - 1 && valueBounds.bottom <= triggerBounds.bottom + 1,
      whiteSpace: window.getComputedStyle(element).whiteSpace,
    };
  });

test("detects Russian from browser preferences on first use", async ({ page }) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await setBrowserLanguages(page, ["de-DE", "ru-RU", "en-US"]);
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(
    page.getByRole("tab", { name: ruMessages.Ui["Org Editor"], exact: true }),
  ).toBeVisible();
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    ruMessages.Metadata.description,
  );
  expect(await page.evaluate((key) => window.localStorage.getItem(key), localeStorageKey)).toBe(
    "ru",
  );
  await assertLocalRequests();
});

test("falls back to English for an unsupported browser locale", async ({ page }) => {
  await setBrowserLanguages(page, ["de-DE", "fr-FR"]);
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(
    page.getByRole("tab", { name: enMessages.Ui["Org Editor"], exact: true }),
  ).toBeVisible();
  expect(await page.evaluate((key) => window.localStorage.getItem(key), localeStorageKey)).toBe(
    "en",
  );
});

test("switches the interface in place and persists the choice", async ({ page }, testInfo) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const languageToggle = page.locator('[data-demo-id="language-toggle"]');
  const themeToggle = page.locator('[data-demo-id="theme-toggle"]');
  const languageBox = await languageToggle.boundingBox();
  const themeBox = await themeToggle.boundingBox();
  expect(languageBox).not.toBeNull();
  expect(themeBox).not.toBeNull();
  expect(languageBox?.x).toBeLessThan(themeBox?.x ?? 0);

  await languageToggle.click();
  await page.getByRole("option", { name: ruMessages.Ui.Russian, exact: true }).click();

  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(page.getByRole("tab", { name: ruMessages.Ui.Units, exact: true })).toBeVisible();
  await expect(languageToggle).toHaveAccessibleName(
    `${ruMessages.Ui.Language}: ${ruMessages.Ui.Russian}`,
  );
  await expect(languageToggle).toContainText("🇷🇺");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    ruMessages.Metadata.description,
  );
  const header = page.locator("header");
  await expect(header.getByRole("img", { name: "Org Tools", exact: true })).toBeVisible();
  await expect(
    header.getByRole("button", { name: ruMessages.Ui.Import, exact: true }),
  ).toBeVisible();
  await expect(
    header.getByRole("button", { name: ruMessages.Ui["Workspace Export"], exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("tab", { name: ruMessages.Ui["Data Download"], exact: true }),
  ).toBeVisible();
  await expect(header).not.toContainText(ruMessages.Ui.Main);
  await expect(page.locator('[data-demo-id="top-level-empty-state"]')).toBeVisible();
  await expect(page.locator('[data-demo-id="org-view-toolbar"]')).toHaveCount(0);
  await page.screenshot({
    animations: "disabled",
    fullPage: true,
    path: testInfo.outputPath("russian-shell.png"),
  });

  await page.getByRole("button", { name: ruMessages.Ui["Workspace Export"], exact: true }).click();
  const saveDialog = page.getByRole("dialog", { name: ruMessages.Ui["Export workspace"] });
  await expect(saveDialog).toBeVisible();
  await page.screenshot({
    animations: "disabled",
    fullPage: true,
    path: testInfo.outputPath("russian-save-formats.png"),
  });
  await saveDialog.getByRole("button", { name: ruMessages.Ui.Cancel, exact: true }).click();

  await page.getByRole("tab", { name: ruMessages.Ui.Employees, exact: true }).click();
  await page.getByRole("button", { name: ruMessages.Ui["Create Employee"], exact: true }).click();
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
  await page.getByRole("tab", { name: ruMessages.Ui["Org Editor"], exact: true }).click();

  await page.getByRole("button", { name: ruMessages.Ui["Add to empty canvas"] }).click();
  await page.getByRole("button", { name: ruMessages.Ui["Add Unit"], exact: true }).click();
  const unitDialog = page.getByRole("dialog", { name: ruMessages.Ui["Add Unit"] });
  await unitDialog.getByLabel(ruMessages.Ui.Name, { exact: true }).fill("Platform");
  await unitDialog.getByRole("button", { name: ruMessages.Ui.Save, exact: true }).click();
  await expect(unitDialog).toBeHidden();

  const viewToolbar = page.locator('[data-demo-id="org-view-toolbar"]');
  const viewTrigger = viewToolbar.getByRole("combobox", {
    name: ruMessages.Ui["Active View"],
  });
  const viewValue = viewTrigger.locator('[data-demo-id="org-view-active-value"]');
  await expect(viewValue).toHaveText(ruMessages.Ui.Main);
  await expect(viewTrigger).toHaveAttribute("title", ruMessages.Ui.Main);
  expect(await readSelectValueLayout(viewValue)).toEqual({
    fitsHorizontally: true,
    isContained: true,
    whiteSpace: "nowrap",
  });
  await page.screenshot({
    animations: "disabled",
    fullPage: true,
    path: testInfo.outputPath("russian-view-selector.png"),
  });
  const dialog = await chooseImportFile(page, ruMessages, syntheticWorkspacePath);
  await expect(dialog.getByRole("tab")).toHaveCount(0);
  await expect(
    dialog.getByText(ruMessages.Ui["Workspace state detected"], { exact: true }),
  ).toBeVisible();
  await expect(
    dialog.getByRole("radiogroup", { name: ruMessages.Ui["State content"] }),
  ).toContainText(ruMessages.Ui["Full workspace"]);
  await page.screenshot({
    animations: "disabled",
    fullPage: true,
    path: testInfo.outputPath("russian-state-import.png"),
  });
  await dialog.getByRole("button", { name: ruMessages.Ui.Cancel, exact: true }).click();

  const longViewName = "A custom View name that is wider than the selector";
  await page.locator('[data-demo-id="org-view-create-button"]').click();
  const viewDialog = page.getByRole("dialog", { name: ruMessages.Ui["New View"] });
  await viewDialog.getByLabel(ruMessages.Ui.Name, { exact: true }).fill(longViewName);
  await viewDialog.getByRole("button", { name: ruMessages.Ui.Create, exact: true }).click();
  await expect(viewDialog).toBeHidden();
  await expect(viewTrigger).toHaveAttribute("title", longViewName);
  expect(await readSelectValueLayout(viewValue)).toEqual({
    fitsHorizontally: false,
    isContained: true,
    whiteSpace: "nowrap",
  });

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(
    page.getByRole("tab", { name: ruMessages.Ui["Org Editor"], exact: true }),
  ).toBeVisible();
  expect(consoleErrors.filter((message) => message.includes("INVALID_KEY"))).toEqual([]);
});

for (const [locale, messages] of [
  ["en", enMessages],
  ["ru", ruMessages],
] as const satisfies ReadonlyArray<readonly ["en" | "ru", Messages]>) {
  test(`keeps export, import, and localized error workflows local in ${locale}`, async ({
    page,
  }, testInfo) => {
    const assertLocalRequests = await expectLocalRequestsOnly(page);
    await seedLocale(page, locale);
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await page.getByRole("button", { name: messages.Ui["Workspace Export"], exact: true }).click();
    const saveDialog = page.getByRole("dialog", { name: messages.Ui["Export workspace"] });
    await expect(saveDialog).toBeVisible();
    const saveChoiceLabels = saveDialog.locator('input[name="save-format"]').locator("..");
    for (const [index, choice] of [
      messages.Ui.Teams,
      messages.Ui.Employees,
      messages.Ui["Teams + Employees"],
      messages.Ui["Full workspace"],
    ].entries()) {
      await expect(saveChoiceLabels.nth(index)).toContainText(choice);
    }
    const downloadPromise = page.waitForEvent("download");
    await saveDialog.getByRole("button", { name: messages.Ui.Download, exact: true }).click();
    expect((await downloadPromise).suggestedFilename()).toBe("org-tools-state.json");

    let dialog = await chooseImportFile(page, messages, syntheticEmployeesJsonPath);
    await expect(dialog.getByText(messages.Ui["Field mapping"], { exact: true })).toBeVisible();
    await expect(dialog.getByRole("radiogroup", { name: messages.Ui["Import as"] })).toContainText(
      messages.Ui["Teams + Employees"],
    );
    await dialog.getByRole("button", { name: /2/u }).click();
    await expect(dialog).toBeHidden();
    await page.getByRole("tab", { name: messages.Ui.Employees, exact: true }).click();
    await expect(page.getByText("Avery Stone", { exact: true }).first()).toBeVisible();
    await page.locator('[data-demo-id="employee-create-button"]').click();
    const employeeDialog = page.getByRole("dialog", { name: messages.Ui["Create Employee"] });
    await expect(employeeDialog.getByText(messages.Ui.Avatar, { exact: true })).toBeVisible();
    await expect(
      employeeDialog.getByRole("button", { name: messages.Ui["Paste image"], exact: true }),
    ).toBeVisible();
    await employeeDialog.getByRole("button", { name: messages.Ui.Cancel, exact: true }).click();

    dialog = await chooseImportFile(page, messages, {
      buffer: Buffer.from("{"),
      mimeType: "application/json",
      name: "invalid.json",
    });
    await expect(
      dialog.getByText(messages.Ui["JSON could not be parsed."], { exact: true }),
    ).toBeVisible();
    await dialog.getByRole("button", { name: messages.Ui.Cancel, exact: true }).click();

    dialog = await chooseImportFile(page, messages, syntheticWorkspacePath);
    await expect(
      dialog.getByText(messages.Ui["Workspace state detected"], { exact: true }),
    ).toBeVisible();
    await expect(
      dialog.getByText(
        messages.Ui["Full workspace import replaces all current data and interface state."],
        { exact: true },
      ),
    ).toBeVisible();
    await dialog
      .getByRole("button", { name: messages.Ui["Replace all current"], exact: true })
      .click();
    await expect(page.getByRole("status")).toHaveCount(0);
    await page.getByRole("tab", { name: messages.Ui.Employees, exact: true }).click();
    await expect(page.locator('[data-demo-id="employees-summary"]')).toContainText(
      messages.Ui.Employees,
    );
    await expect(page.locator('[data-demo-id="employees-total-count"]')).toContainText("4");
    await expect(page.locator('[data-demo-id="employees-match-count"]')).toHaveCount(0);
    await page.locator('[data-demo-id="employees-search"]').getByRole("searchbox").fill("Avery");
    await expect(page.locator('[data-demo-id="employees-match-count"]')).toContainText("1");
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
    await expect(page.getByText(messages.Ui["Employee Calendar"], { exact: true })).toBeVisible();
    await page
      .locator('[data-demo-id="dated-tag-cloud"]')
      .getByRole("button", { name: /Operations/u })
      .click();
    await expect(page.getByRole("dialog", { name: "Operations" })).toContainText("Morgan Park");
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await assertLocalRequests();
  });
}
