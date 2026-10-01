import type { AppLocale } from "@org-tools/types";
import type { Page } from "@playwright/test";

import arMessages from "../../../apps/ui/messages/ar.json" with { type: "json" };
import enMessages from "../../../apps/ui/messages/en.json" with { type: "json" };
import esMessages from "../../../apps/ui/messages/es.json" with { type: "json" };
import frMessages from "../../../apps/ui/messages/fr.json" with { type: "json" };
import ruMessages from "../../../apps/ui/messages/ru.json" with { type: "json" };
import zhMessages from "../../../apps/ui/messages/zh.json" with { type: "json" };
import { expect, test } from "./browser-test.js";
import { expectLocalRequestsOnly, localeStorageKey, resetServerState } from "./helpers.js";

type Messages = typeof enMessages;

const setBrowserLanguages = async (page: Page, languages: string[]) => {
  await page.addInitScript((values) => {
    Object.defineProperty(navigator, "language", { configurable: true, value: values[0] });
    Object.defineProperty(navigator, "languages", { configurable: true, value: values });
  }, languages);
};

const seedLocale = async (page: Page, locale: AppLocale) => {
  await page.addInitScript(({ key, value }) => window.localStorage.setItem(key, value), {
    key: localeStorageKey,
    value: locale,
  });
};

test("honors a supported locale from the current account UI state", async ({ page }) => {
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

test("switches the authenticated interface in place and persists the choice", async ({ page }) => {
  await page.goto(await resetServerState(page), { waitUntil: "domcontentloaded" });
  await page.locator('[data-demo-id="language-toggle"]').click();
  await page.locator('[data-demo-id="language-dialog"] label:has(input[value="ru"])').click();

  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(page.getByRole("tab", { name: ruMessages.Ui.Units, exact: true })).toBeVisible();
  await expect(
    page.getByRole("tab", { name: ruMessages.Ui.Administration, exact: true }),
  ).toBeVisible();
  await expect(page.locator('[data-demo-id="account-menu"]')).toHaveAccessibleName(
    ruMessages.Ui["Account menu"],
  );

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(page.getByRole("tab", { name: ruMessages.Ui.Editor, exact: true })).toBeVisible();
});

for (const [locale, messages] of [
  ["en", enMessages],
  ["zh", zhMessages],
  ["ru", ruMessages],
  ["es", esMessages],
  ["fr", frMessages],
  ["ar", arMessages],
] as const satisfies ReadonlyArray<readonly [AppLocale, Messages]>) {
  test(`localizes authentication and Administration in ${locale}`, async ({ page }) => {
    const assertLocalRequests = await expectLocalRequestsOnly(page);
    await seedLocale(page, locale);
    await page.goto(await resetServerState(page, locale), { waitUntil: "domcontentloaded" });

    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.locator("html")).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
    await expect(page.getByRole("tab", { name: messages.Ui.Employees, exact: true })).toBeVisible();
    await expect(page.getByRole("tab", { name: messages.Ui.Units, exact: true })).toBeVisible();
    await expect(page.getByRole("tab", { name: messages.Ui.Editor, exact: true })).toBeVisible();
    await expect(page.getByRole("tab", { name: messages.Ui.Calendar, exact: true })).toBeVisible();
    await expect(
      page.getByRole("tab", { name: messages.Ui["Data Download"], exact: true }),
    ).toBeVisible();
    await page.getByRole("tab", { name: messages.Ui.Administration, exact: true }).click();
    const administration = page.locator('[data-demo-id="administration-tab"]');
    for (const label of ["Users", "Roles", "Access", "Audit", "Backup and Restore"] as const) {
      await expect(
        administration.getByRole("tab", { name: messages.Ui[label], exact: true }),
      ).toBeVisible();
    }

    await page.route("**/api/session", (route) =>
      route.fulfill({
        body: JSON.stringify({ error: { code: "unauthenticated" } }),
        contentType: "application/json",
        status: 401,
      }),
    );
    await page.route("**/api/auth/status", (route) =>
      route.fulfill({ body: JSON.stringify({ kind: "login" }), contentType: "application/json" }),
    );
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator('[data-demo-id="login-form"]')).toContainText(messages.Ui["Sign in"]);
    await expect(page.getByLabel(messages.Ui.Email, { exact: true })).toBeVisible();
    await expect(page.getByLabel(messages.Ui.Password, { exact: true })).toBeVisible();
    await assertLocalRequests();
  });
}
