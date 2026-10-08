import type { AppLocale } from "@org-tools/types";
import type { Page } from "@playwright/test";

import arMessages from "../../../apps/ui/messages/ar.json" with { type: "json" };
import enMessages from "../../../apps/ui/messages/en.json" with { type: "json" };
import esMessages from "../../../apps/ui/messages/es.json" with { type: "json" };
import frMessages from "../../../apps/ui/messages/fr.json" with { type: "json" };
import ruMessages from "../../../apps/ui/messages/ru.json" with { type: "json" };
import zhMessages from "../../../apps/ui/messages/zh.json" with { type: "json" };
import { expect, test } from "./browser-test.js";
import {
  expectLocalRequestsOnly,
  localeStorageKey,
  openAdministration,
  resetServerState,
} from "./helpers.js";

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

test("@regression @localization honors a supported locale from the current account UI state", async ({
  page,
}) => {
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

test("@regression @localization falls back to English for unsupported browser locales", async ({
  page,
}) => {
  await setBrowserLanguages(page, ["de-DE", "it-IT"]);
  await page.addInitScript((key) => window.localStorage.removeItem(key), localeStorageKey);
  await page.goto(await resetServerState(page), { waitUntil: "domcontentloaded" });

  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("tab", { name: enMessages.Ui.Editor, exact: true })).toBeVisible();
  expect(await page.evaluate((key) => window.localStorage.getItem(key), localeStorageKey)).toBe(
    "en",
  );
});

test("@core @regression @localization switches the authenticated interface in place and persists the choice", async ({
  page,
}) => {
  await page.goto(await resetServerState(page), { waitUntil: "domcontentloaded" });
  await page.locator('[data-demo-id="language-toggle"]').click();
  await page.locator('[data-demo-id="language-dialog"] label:has(input[value="ru"])').click();

  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(page.getByRole("tab", { name: ruMessages.Ui.Units, exact: true })).toBeVisible();
  await expect(
    page.getByRole("tab", { name: ruMessages.Ui.Administration, exact: true }),
  ).toHaveCount(0);
  await page.locator('[data-demo-id="account-menu"]').click();
  await expect(page.locator('[data-demo-id="account-administration"]')).toHaveText(
    ruMessages.Ui.Administration,
  );
  await page.keyboard.press("Escape");
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
  test(`@regression @localization localizes authentication and Administration in ${locale}`, async ({
    browser,
    page,
  }) => {
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
    await expect(
      page.getByRole("tab", { name: messages.Ui.Administration, exact: true }),
    ).toHaveCount(0);
    await openAdministration(page);
    const administration = page.locator('[data-demo-id="administration-tab"]');
    for (const label of ["Users", "Roles", "Access", "Audit", "Backup and Restore"] as const) {
      await expect(
        administration.getByRole("tab", { name: messages.Ui[label], exact: true }),
      ).toBeVisible();
    }
    const tabsList = administration.locator('[data-demo-id="administration-tabs-list"]');
    await expect(tabsList.locator("svg")).toHaveCount(5);
    await expect(tabsList).toHaveCSS("justify-content", "flex-start");
    const [administrationBox, tabsBox] = await Promise.all([
      administration.boundingBox(),
      tabsList.boundingBox(),
    ]);
    expect(administrationBox).not.toBeNull();
    expect(tabsBox).not.toBeNull();
    const distanceToLeft = (tabsBox?.x ?? 0) - (administrationBox?.x ?? 0);
    const distanceToRight =
      (administrationBox?.x ?? 0) +
      (administrationBox?.width ?? 0) -
      ((tabsBox?.x ?? 0) + (tabsBox?.width ?? 0));
    expect(locale === "ar" ? distanceToRight : distanceToLeft).toBeLessThan(
      locale === "ar" ? distanceToLeft : distanceToRight,
    );
    await administration.getByRole("tab", { name: messages.Ui.Roles, exact: true }).click();
    await administration
      .getByRole("button", { name: messages.Ui["Add permission"], exact: true })
      .click();
    await expect(administration).toContainText(messages.Ui["View Employees"]);
    await expect(administration).toContainText(messages.Ui["Own profile only"]);
    await expect(administration).not.toContainText("employee.read");
    await expect(administration).not.toContainText("managedSubtree");

    await page.getByRole("tab", { name: messages.Ui.Editor, exact: true }).click();
    await expect(page.locator('[data-demo-id="org-editor-canvas"]')).toBeVisible();
    await page.locator('[data-demo-id="org-editor-view-image-export-action"]').click();
    const imageExport = page.locator('[data-demo-id="org-editor-view-image-export-dialog"]');
    await expect(imageExport).toContainText(messages.Ui["Tags in image"]);
    await expect(
      imageExport.getByRole("checkbox", {
        name: messages.Ui["Hide Staffing Slots"],
        exact: true,
      }),
    ).toBeVisible();
    await imageExport.locator('[data-demo-id="org-editor-image-tag-visibility-trigger"]').click();
    await expect(
      page.locator('[data-demo-id="org-editor-image-tag-visibility-popover"]'),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");

    const authenticationContext = await browser.newContext({
      baseURL: new URL(page.url()).origin,
    });
    try {
      await authenticationContext.route("**/api/session", (route) =>
        route.fulfill({
          body: JSON.stringify({ error: { code: "unauthenticated" } }),
          contentType: "application/json",
          status: 401,
        }),
      );
      await authenticationContext.route("**/api/auth/status", (route) =>
        route.fulfill({ body: JSON.stringify({ kind: "login" }), contentType: "application/json" }),
      );
      const authenticationPage = await authenticationContext.newPage();
      const assertAuthenticationLocalRequests = await expectLocalRequestsOnly(authenticationPage);
      await seedLocale(authenticationPage, locale);
      await authenticationPage.goto("/", { waitUntil: "domcontentloaded" });
      const loginForm = authenticationPage.locator('[data-demo-id="login-form"]');
      await expect(loginForm).toContainText(messages.Ui["Sign in"]);
      await expect(loginForm.locator('[data-demo-id="auth-heading"]')).toHaveCSS(
        "text-align",
        "center",
      );
      await expect(authenticationPage.getByLabel(messages.Ui.Email, { exact: true })).toBeVisible();
      await expect(
        authenticationPage.getByLabel(messages.Ui.Password, { exact: true }),
      ).toBeVisible();
      await assertAuthenticationLocalRequests();
    } finally {
      await authenticationContext.close();
    }
    await assertLocalRequests();
  });
}

test("@regression @localization centers Login and Setup headings while keeping fields start-aligned", async ({
  page,
}) => {
  await page.route("**/api/session", (route) =>
    route.fulfill({
      body: JSON.stringify({ error: { code: "unauthenticated" } }),
      contentType: "application/json",
      status: 401,
    }),
  );
  await page.route("**/api/auth/status", (route) =>
    route.fulfill({ body: JSON.stringify({ kind: "setup" }), contentType: "application/json" }),
  );
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const setup = page.locator('[data-demo-id="setup-form"]');
  await expect(setup.locator('[data-demo-id="auth-heading"]')).toHaveCSS("text-align", "center");
  await expect(setup.getByText("Setup token", { exact: true })).toHaveCSS("text-align", "start");

  await page.unroute("**/api/auth/status");
  await page.route("**/api/auth/status", (route) =>
    route.fulfill({ body: JSON.stringify({ kind: "login" }), contentType: "application/json" }),
  );
  await page.reload({ waitUntil: "domcontentloaded" });
  const login = page.locator('[data-demo-id="login-form"]');
  await expect(login.locator('[data-demo-id="auth-heading"]')).toHaveCSS("text-align", "center");
  await expect(login.getByText("Email", { exact: true })).toHaveCSS("text-align", "start");
});
