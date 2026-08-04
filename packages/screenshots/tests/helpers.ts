import { fileURLToPath } from "node:url";

import { expect, type Page } from "@playwright/test";

export type ImportFilePayload = {
  buffer: Buffer;
  mimeType: string;
  name: string;
};

export const syntheticWorkspacePath = fileURLToPath(
  new URL("../fixtures/synthetic-workspace.json", import.meta.url),
);
export const syntheticEmployeesJsonPath = fileURLToPath(
  new URL("../../../examples/employees.json", import.meta.url),
);

export const productTabs = [
  "Units",
  "Employees",
  "Org Editor",
  "Analytics",
  "Calendar",
  "Download",
] as const;

export const localeStorageKey = "org-tools-locale";

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

export async function openBlankWorkspace(page: Page): Promise<void> {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.clock.setFixedTime(new Date("2026-07-31T12:00:00.000Z"));
  await page.addInitScript(({ key, locale }) => window.localStorage.setItem(key, locale), {
    key: localeStorageKey,
    locale: "en",
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("tab", { name: "Org Editor", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
}

export async function replaceWithSyntheticWorkspace(page: Page): Promise<void> {
  const dialog = await openImportDialog(page, syntheticWorkspacePath);
  await expect(dialog.getByText("Workspace state detected", { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Replace all current", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("status")).toHaveCount(0);
  await expect(page.getByText("Product", { exact: true }).first()).toBeVisible();
}

export async function openImportDialog(page: Page, file: ImportFilePayload | string) {
  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Import", exact: true }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(file);
  const dialog = page.getByRole("dialog", { name: "Import" });
  await expect(dialog).toBeVisible();
  return dialog;
}

export async function stabilizeForScreenshot(page: Page): Promise<void> {
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
