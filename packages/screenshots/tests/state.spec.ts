import { expect, test } from "./browser-test.js";
import {
  authenticateSuperAdministrator,
  expectLocalRequestsOnly,
  openBlankState,
  replaceWithSyntheticState,
  resetServerState,
} from "./helpers.js";

const configuredOrigin = () =>
  process.env.ORG_TOOLS_PUBLIC_ORIGIN ??
  process.env.ORG_TOOLS_BASE_URL ??
  `http://127.0.0.1:${process.env.ORG_TOOLS_PORT ?? "3000"}`;

const mutationHeaders = (csrfToken: string, origin = configuredOrigin()) => ({
  "Content-Type": "application/json",
  Origin: origin,
  "Sec-Fetch-Site": "same-origin",
  "X-Org-Tools-CSRF": csrfToken,
});

test("writes organization and per-account UI automatically", async ({ page }) => {
  await openBlankState(page);
  await expect(page).toHaveURL(/\/$/u);

  await replaceWithSyntheticState(page);
  await page.getByRole("tab", { name: "Employees", exact: true }).click();
  await page.locator('[data-demo-id="employee-model-button"]').click();
  const modelDialog = page.getByRole("dialog", { name: "Employee model", exact: true });
  await modelDialog.getByRole("tab", { name: "Display", exact: true }).click();
  await modelDialog
    .locator("#employee-display-employees-format")
    .fill("{fullName}\nPersisted display");
  const organizationWrite = page.waitForResponse((response) => {
    if (
      response.request().method() !== "POST" ||
      new URL(response.url()).pathname !== "/api/commands" ||
      !response.ok()
    ) {
      return false;
    }
    const payload = response.request().postDataJSON() as {
      organization?: { employeeDisplayLineGaps?: { employees?: number } };
    } | null;
    return payload?.organization?.employeeDisplayLineGaps?.employees === 9;
  });
  await modelDialog.locator('[data-demo-id="employee-display-employees-line-gap"]').fill("9");
  await organizationWrite;
  await modelDialog.getByRole("button", { name: "Close", exact: true }).first().click();
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-demo-id="employees-list"]')).toContainText("Persisted display");
  await expect(
    page.locator('[data-demo-id="employees-list"] [data-employee-display-content]').first(),
  ).toHaveAttribute("data-employee-display-line-gap", "9");

  const uiWrite = page.waitForResponse(
    (response) =>
      response.request().method() === "PUT" &&
      new URL(response.url()).pathname === "/api/ui" &&
      response.ok(),
  );
  await page.getByRole("tab", { name: "Calendar", exact: true }).click();
  await uiWrite;
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("tab", { name: "Calendar", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

test("synchronizes organization and UI between authenticated tabs", async ({ page, context }) => {
  await page.goto(await resetServerState(page), { waitUntil: "domcontentloaded" });
  const secondPage = await context.newPage();
  await secondPage.goto("/", { waitUntil: "domcontentloaded" });

  await replaceWithSyntheticState(page);
  await expect(secondPage.getByText("Product", { exact: true }).first()).toBeVisible();

  await page.getByRole("tab", { name: "Employees", exact: true }).click();
  await secondPage.getByRole("tab", { name: "Employees", exact: true }).click();
  await secondPage
    .locator('[data-demo-id="employees-search"]')
    .getByRole("searchbox")
    .fill("Avery");
  await expect(
    page.locator('[data-demo-id="employees-search"]').getByRole("searchbox"),
  ).toHaveValue("Avery");

  await page.locator('[data-demo-id="employee-model-button"]').click();
  const modelDialog = page.getByRole("dialog", { name: "Employee model", exact: true });
  await modelDialog.getByRole("tab", { name: "Display", exact: true }).click();
  await modelDialog
    .locator("#employee-display-employees-format")
    .fill("{fullName}\nSynchronized display");
  await modelDialog.getByRole("button", { name: "Close", exact: true }).first().click();
  await expect(secondPage.locator('[data-demo-id="employees-list"]')).toContainText(
    "Synchronized display",
  );
});

test("requires exact authenticated CSRF, origin, media type, and UI shape", async ({ page }) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await page.goto(await resetServerState(page), { waitUntil: "domcontentloaded" });
  const bootstrap = await authenticateSuperAdministrator(page);
  const session = await page.request.get("/api/session");
  expect(session.ok()).toBe(true);
  expect(session.headers()["cache-control"]).toBe("no-store");
  const current = (await session.json()) as { csrfToken: string; ui: object };

  const uiWrite = await page.request.put("/api/ui", {
    data: { ...current.ui, sidebarCollapsed: false },
    headers: mutationHeaders(current.csrfToken),
  });
  expect(uiWrite.ok()).toBe(true);

  const malformed = await page.request.put("/api/ui", {
    data: { unexpected: true },
    headers: mutationHeaders(current.csrfToken),
  });
  expect(malformed.status()).toBe(400);
  expect(await malformed.json()).toEqual({ error: { code: "invalid_input" } });

  const wrongCsrf = await page.request.put("/api/ui", {
    data: current.ui,
    headers: mutationHeaders("wrong-token"),
  });
  expect(wrongCsrf.status()).toBe(403);
  expect(await wrongCsrf.json()).toEqual({ error: { code: "invalid_request" } });

  const remote = await page.request.put("/api/ui", {
    data: current.ui,
    headers: mutationHeaders(bootstrap.csrfToken, "https://remote.example.test"),
  });
  expect(remote.status()).toBe(403);
  expect(await remote.json()).toEqual({ error: { code: "invalid_request" } });
  await assertLocalRequests();
});
