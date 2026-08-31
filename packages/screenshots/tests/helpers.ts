import { fileURLToPath } from "node:url";

import type { OrgToolsState } from "@org-tools/types";
import { expect, type Page } from "@playwright/test";

export type ImportFilePayload = {
  buffer: Buffer;
  mimeType: string;
  name: string;
};

export const syntheticStatePath = fileURLToPath(
  new URL("../fixtures/synthetic-state.json", import.meta.url),
);
export const productTabs = [
  "Units",
  "Employees",
  "Editor",
  "Analytics",
  "Calendar",
  "Download",
] as const;

export const localeStorageKey = "org-tools-locale";
const emptyEmployeeFilters = () => ({
  birthday: null,
  includeWithoutTags: false,
  includeWithoutUnits: false,
  selectedGenders: [],
  selectedPositions: [],
  selectedTags: [],
  selectedUnitIds: [],
});

export async function resetServerState(page: Page, locale: "en" | "ru" = "en"): Promise<string> {
  const port = process.env.ORG_TOOLS_PORT ?? "4273";
  const origin = process.env.ORG_TOOLS_BASE_URL ?? `http://127.0.0.1:${port}`;
  const response = await page.request.get("/api/state", {
    headers: { Host: new URL(origin).host },
  });
  if (!response.ok()) throw new Error(JSON.stringify(await response.json()));
  const document = (await response.json()) as { revision: number; state: OrgToolsState };
  const state = document.state;
  const main = state.organization.views.find((view) => view.kind === "main");
  if (!main) throw new Error("Main View is unavailable.");
  main.document.employeeOverrides = [];
  main.document.employees = [];
  main.document.units = [];
  state.organization.employees = [];
  state.organization.views = [main];
  state.ui.activeTab = "orgEditor";
  state.ui.activeViewId = main.id;
  state.ui.analytics = { filters: emptyEmployeeFilters(), query: "" };
  state.ui.calendar = { cloudExpanded: false, monthIndex: 6, year: 2026 };
  state.ui.editor = { searchOpen: false, searchQuery: "" };
  state.ui.employees = { filters: emptyEmployeeFilters(), query: "" };
  state.ui.expandedUnitIds = [];
  state.ui.locale = locale;
  state.ui.selectedUnitId = null;
  state.ui.sidebarCollapsed = true;
  state.ui.theme = "light";
  state.ui.units = {
    employeeFilters: emptyEmployeeFilters(),
    employeeQuery: "",
    unitQuery: "",
  };
  state.ui.download.employeeFilters = emptyEmployeeFilters();
  state.ui.download.employeeQuery = "";
  state.ui.download.excludedEmployeeIds = [];
  state.ui.download.selectedFilters = emptyEmployeeFilters();
  state.ui.download.selectedQuery = "";
  state.ui.download.selections = [];
  state.ui.download.sourceViewId = main.id;
  state.ui.download.unitQuery = "";
  state.ui.views = [{ selectedItems: [], viewId: main.id, viewport: { scale: 1, x: 0, y: 0 } }];
  const write = await page.request.put("/api/state", {
    data: { expectedRevision: document.revision, scope: "all", state },
    headers: { Origin: origin },
  });
  if (!write.ok()) throw new Error(JSON.stringify(await write.json()));
  return "/";
}

export async function expectLocalRequestsOnly(page: Page): Promise<() => Promise<void>> {
  const externalRequests: string[] = [];
  const onRequest = (request: { url(): string }) => {
    const url = new URL(request.url());
    if (
      (url.protocol === "http:" || url.protocol === "https:") &&
      url.hostname !== "127.0.0.1" &&
      url.hostname !== "localhost"
    ) {
      externalRequests.push(url.href);
    }
  };

  page.on("request", onRequest);

  return async () => {
    await page.waitForTimeout(100);
    page.off("request", onRequest);
    expect(externalRequests, "the application must not make external requests").toEqual([]);
  };
}

export async function openBlankState(page: Page): Promise<void> {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.clock.setFixedTime(new Date("2026-07-31T12:00:00.000Z"));
  await page.addInitScript(({ key, locale }) => window.localStorage.setItem(key, locale), {
    key: localeStorageKey,
    locale: "en",
  });
  await page.goto(await resetServerState(page), { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("tab", { name: "Editor", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.locator("html")).not.toHaveClass(/dark/);
}

export async function replaceWithSyntheticState(page: Page): Promise<void> {
  const dialog = await openImportDialog(page, syntheticStatePath);
  await expect(dialog.locator('[data-demo-id="state-import-summary"]')).toContainText(
    "4 Employees",
  );
  await dialog.getByRole("button", { name: "Replace state", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText("Product", { exact: true }).first()).toBeVisible();
}

export async function openImportDialog(page: Page, file: ImportFilePayload | string) {
  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Import", exact: true }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(file);
  const dialog = page.getByRole("dialog", { name: "Import state" });
  await expect(dialog).toBeVisible();
  return dialog;
}

export async function stabilizeForScreenshot(page: Page): Promise<void> {
  await page.mouse.move(1400, 30);
  await page.evaluate(() => {
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement && !activeElement.closest('[role="listbox"]')) {
      activeElement.blur();
    }
  });
  await page.waitForTimeout(500);
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        caret-color: transparent !important;
        transition-duration: 0s !important;
      }
    `,
  });
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}
