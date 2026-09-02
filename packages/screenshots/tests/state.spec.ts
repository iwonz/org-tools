import type { OrgToolsState } from "@org-tools/types";
import { expect, test } from "./browser-test.js";

import {
  expectLocalRequestsOnly,
  openBlankState,
  replaceWithSyntheticState,
  resetServerState,
} from "./helpers.js";

const configuredOrigin = () => {
  const port = process.env.ORG_TOOLS_PORT ?? "4273";
  return process.env.ORG_TOOLS_BASE_URL ?? `http://127.0.0.1:${port}`;
};

test("opens at the root and writes organization plus durable UI automatically", async ({
  page,
}) => {
  await openBlankState(page);
  await expect(page).toHaveURL(/\/$/u);
  await expect(page.locator('[data-demo-id="project-switcher"]')).toHaveCount(0);
  await expect(page.locator('[data-demo-id="project-save"]')).toHaveCount(0);

  await replaceWithSyntheticState(page);
  await page.waitForTimeout(500);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByText("Product", { exact: true }).first()).toBeVisible();

  await page.getByRole("tab", { name: "Analytics", exact: true }).click();
  await page.waitForTimeout(500);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("tab", { name: "Analytics", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

test("synchronizes state and durable UI between tabs without conflicts", async ({
  page,
  context,
}) => {
  await page.goto(await resetServerState(page), { waitUntil: "domcontentloaded" });
  const secondPage = await context.newPage();
  await secondPage.goto("/", { waitUntil: "domcontentloaded" });

  await replaceWithSyntheticState(page);
  await expect(secondPage.getByText("Product", { exact: true }).first()).toBeVisible();

  await secondPage.getByRole("tab", { name: "Employees", exact: true }).click();
  await expect(page.getByRole("tab", { name: "Employees", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await secondPage
    .locator('[data-demo-id="employees-search"]')
    .getByRole("searchbox")
    .fill("Avery");
  await expect(
    page.locator('[data-demo-id="employees-search"]').getByRole("searchbox"),
  ).toHaveValue("Avery");
});

test("validates scoped state writes and rejects cross-origin mutations", async ({ page }) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await page.goto(await resetServerState(page), { waitUntil: "domcontentloaded" });

  const current = await page.request.get("/api/state");
  expect(current.ok()).toBe(true);
  expect(current.headers()["cache-control"]).toBe("no-store");
  const document = (await current.json()) as { revision: number; state: OrgToolsState };

  const uiWrite = await page.request.put("/api/state", {
    data: {
      scope: "ui",
      ui: { ...document.state.ui, sidebarCollapsed: false },
    },
    headers: { Origin: configuredOrigin() },
  });
  expect(uiWrite.ok()).toBe(true);
  expect((await uiWrite.json()).revision).toBe(document.revision + 1);

  const secondWrite = await page.request.put("/api/state", {
    data: {
      scope: "ui",
      ui: document.state.ui,
    },
    headers: { Origin: configuredOrigin() },
  });
  expect(secondWrite.ok()).toBe(true);
  expect((await secondWrite.json()).revision).toBe(document.revision + 2);

  const obsoleteShape = await page.request.put("/api/state", {
    data: {
      expectedRevision: document.revision,
      scope: "ui",
      ui: document.state.ui,
    },
    headers: { Origin: configuredOrigin() },
  });
  expect(obsoleteShape.status()).toBe(400);
  expect(await obsoleteShape.json()).toEqual({ error: { code: "invalid_input" } });

  const invalid = await page.request.put("/api/state", {
    data: { scope: "unknown" },
    headers: { Origin: configuredOrigin() },
  });
  expect(invalid.status()).toBe(400);
  expect(await invalid.json()).toEqual({ error: { code: "invalid_input" } });

  const remote = await page.request.put("/api/state", {
    data: { scope: "ui", ui: document.state.ui },
    headers: { Origin: "https://remote.example.test" },
  });
  expect(remote.status()).toBe(403);
  expect(await remote.json()).toEqual({ error: { code: "invalid_input" } });
  await assertLocalRequests();
});
