import { expect, type Page, test } from "@playwright/test";

import {
  createIsolatedProject,
  expectLocalRequestsOnly,
  openBlankWorkspace,
  replaceWithSyntheticWorkspace,
} from "./helpers.js";

const configuredOrigin = () => {
  const port = process.env.ORG_TOOLS_PORT ?? "4273";
  return process.env.ORG_TOOLS_BASE_URL ?? `http://127.0.0.1:${port}`;
};

async function createProjectThroughApi(page: Page, name: string): Promise<string> {
  const response = await page.request.post("/api/projects", {
    data: { name },
    headers: { Origin: configuredOrigin() },
  });
  if (!response.ok()) throw new Error(await response.text());
  return ((await response.json()) as { id: string }).id;
}

async function openProjectSwitcher(page: Page) {
  await page.locator('[data-demo-id="project-switcher"]').click();
  const popover = page.locator('[data-demo-id="project-switcher-popover"]');
  await expect(popover).toBeVisible();
  return popover;
}

test("redirects to the last project and keeps project controls stable in both sidebar modes", async ({
  page,
}) => {
  const route = await createIsolatedProject(page);
  const projectId = route.split("/").at(-1);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(new RegExp(`/projects/${projectId}$`, "u"));
  await expect(page.locator('[data-demo-id="project-switcher"]')).toBeVisible();

  const compact = await page.locator('[data-demo-id="project-switcher"]').evaluate((element) => {
    const box = element.getBoundingClientRect();
    const icon = element.querySelector("svg")?.getBoundingClientRect();
    return { iconCenter: icon ? icon.left + icon.width / 2 - box.left : -1, width: box.width };
  });
  expect(compact).toEqual({ iconCenter: 24, width: 48 });

  await page.locator('[data-demo-id="sidebar-toggle"]').click();
  await expect(page.locator('[data-demo-id="app-sidebar"]')).toHaveAttribute(
    "data-collapsed",
    "false",
  );
  await expect(
    page.locator('[data-demo-id="project-switcher"] [data-sidebar-label=""]'),
  ).toBeVisible();
});

test("recovers from a missing project deep link without replacing saved data", async ({ page }) => {
  const availableRoute = await createIsolatedProject(page);
  await page.goto(`/projects/${crypto.randomUUID()}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Project unavailable" })).toBeVisible();

  await page.getByRole("button", { name: "Open available project", exact: true }).click();

  await expect(page).toHaveURL(new RegExp(`${availableRoute}$`, "u"));
  await expect(page.locator('[data-demo-id="project-save-status"]')).toHaveText("");
});

test("creates, renames, copies, and deletes projects from the sidebar footer", async ({ page }) => {
  await openBlankWorkspace(page);
  let popover = await openProjectSwitcher(page);
  await popover.getByRole("button", { name: "Create project", exact: true }).click();
  let dialog = page.getByRole("dialog", { name: "Create project" });
  await dialog.getByLabel("Project name", { exact: true }).fill("Operations workspace");
  await dialog.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page).toHaveURL(/\/projects\/[0-9a-f-]+$/u);
  await expect(page.locator('[data-demo-id="project-save-status"]')).toHaveText("");

  popover = await openProjectSwitcher(page);
  await popover.getByRole("button", { name: "Rename project", exact: true }).click();
  dialog = page.getByRole("dialog", { name: "Rename project" });
  await dialog.getByLabel("Project name", { exact: true }).fill("Operations 2027");
  await dialog.getByRole("button", { name: "Rename project", exact: true }).click();
  await expect(dialog).toBeHidden();

  popover = await openProjectSwitcher(page);
  await popover.getByRole("button", { name: "Copy project link", exact: true }).click();
  await expect(page.locator('[data-demo-id="project-link-copied"]')).toHaveText(
    "Project link copied.",
  );
  popover = await openProjectSwitcher(page);
  await popover.getByRole("button", { name: "Delete project", exact: true }).click();
  const deleteDialog = page.getByRole("alertdialog", { name: "Delete project?" });
  await deleteDialog.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page).toHaveURL(/\/projects\/[0-9a-f-]+$/u);
  await expect(page.getByRole("tab", { name: "Editor", exact: true })).toBeVisible();
});

test("saves organization data explicitly and UI state independently", async ({ page }) => {
  await openBlankWorkspace(page);
  await replaceWithSyntheticWorkspace(page);
  await expect(page.locator('[data-demo-id="project-save-status"]')).toHaveText("Unsaved");
  await page.keyboard.press("Control+s");
  await expect(page.locator('[data-demo-id="project-save-status"]')).toHaveText("Saved");
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByText("Product", { exact: true }).first()).toBeVisible();

  await page.getByRole("tab", { name: "Analytics", exact: true }).click();
  await expect(page.locator('[data-demo-id="project-save-status"]')).toHaveText("");
  await page.waitForTimeout(450);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("tab", { name: "Analytics", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

test("keeps autosave off by default and supports debounce plus manual flush", async ({ page }) => {
  await openBlankWorkspace(page);
  let popover = await openProjectSwitcher(page);
  await expect(popover.locator('[data-demo-id="autosave-checkbox"]')).toHaveAttribute(
    "aria-checked",
    "false",
  );
  await page.keyboard.press("Escape");

  await replaceWithSyntheticWorkspace(page);
  popover = await openProjectSwitcher(page);
  await popover.getByText("Autosave", { exact: true }).click();
  await expect(page.locator('[data-demo-id="project-save-status"]')).toHaveText("Saved", {
    timeout: 5_000,
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByText("Product", { exact: true }).first()).toBeVisible();
  popover = await openProjectSwitcher(page);
  await expect(popover.locator('[data-demo-id="autosave-checkbox"]')).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await page.keyboard.press("Escape");

  await replaceWithSyntheticWorkspace(page);
  await page.locator('[data-demo-id="project-save"]').click();
  await expect(page.locator('[data-demo-id="project-save-status"]')).toHaveText("Saved");
});

test("offers Save, Discard, or Cancel before switching a dirty project", async ({ page }) => {
  await openBlankWorkspace(page);
  const targetName = `Switch target ${Date.now()}`;
  await createProjectThroughApi(page, targetName);
  await replaceWithSyntheticWorkspace(page);

  const popover = await openProjectSwitcher(page);
  await popover.getByRole("button", { name: targetName, exact: true }).click();
  const dialog = page.getByRole("alertdialog", { name: "Unsaved changes" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Discard", exact: true }).click();
  await expect(page.locator('[data-demo-id="project-save-status"]')).toHaveText("");
  await expect(page.locator('[data-demo-id="project-switcher"]')).toContainText(targetName);
});

test("resolves stale revisions by loading or explicitly overwriting", async ({ page, context }) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  const route = await createIsolatedProject(page);
  await page.goto(route, { waitUntil: "domcontentloaded" });
  const secondPage = await context.newPage();
  await secondPage.goto(route, { waitUntil: "domcontentloaded" });

  await replaceWithSyntheticWorkspace(page);
  await page.locator('[data-demo-id="project-save"]').click();
  await expect(page.locator('[data-demo-id="project-save-status"]')).toHaveText("Saved");
  await replaceWithSyntheticWorkspace(secondPage);
  await secondPage.locator('[data-demo-id="project-save"]').click();
  let conflict = secondPage.getByRole("alertdialog", { name: "Conflict" });
  await expect(conflict).toBeVisible();
  await conflict.getByRole("button", { name: "Load saved version", exact: true }).click();
  await expect(secondPage.getByText("Product", { exact: true }).first()).toBeVisible();

  await replaceWithSyntheticWorkspace(page);
  await page.locator('[data-demo-id="project-save"]').click();
  await expect(page.locator('[data-demo-id="project-save-status"]')).toHaveText("Saved");
  await replaceWithSyntheticWorkspace(secondPage);
  await secondPage.locator('[data-demo-id="project-save"]').click();
  conflict = secondPage.getByRole("alertdialog", { name: "Conflict" });
  await conflict.getByRole("button", { name: "Overwrite saved version", exact: true }).click();
  await expect(conflict).toBeHidden();
  await expect(secondPage.locator('[data-demo-id="project-save-status"]')).toHaveText("Saved");
  await assertLocalRequests();
});

test("rejects cross-origin project mutations and makes no external requests", async ({ page }) => {
  const assertLocalRequests = await expectLocalRequestsOnly(page);
  await page.goto(await createIsolatedProject(page), { waitUntil: "domcontentloaded" });
  const response = await page.request.post("/api/projects", {
    data: { name: "Rejected remote project" },
    headers: { Origin: "https://remote.example.test" },
  });
  expect(response.status()).toBe(403);
  expect(await response.json()).toMatchObject({ error: { code: "invalid_input" } });
  await assertLocalRequests();
});
