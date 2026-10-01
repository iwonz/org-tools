import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import type { AppLocale, OrgToolsState } from "@org-tools/types";
import { expect, type Page } from "@playwright/test";

export type StateFilePayload = {
  buffer: Buffer;
  mimeType: string;
  name: string;
};

export const syntheticStatePath = fileURLToPath(
  new URL("../fixtures/synthetic-state.json", import.meta.url),
);
export const productTabs = ["Employees", "Units", "Editor", "Calendar", "Download"] as const;

export const localeStorageKey = "org-tools-locale";

export async function applyColorPickerDraft(
  page: Page,
  { color, opacity }: { color?: string; opacity?: number } = {},
) {
  const picker = page.locator('[data-demo-id="tag-color-dropdown"]');
  if (color) await picker.getByRole("option", { name: color, exact: true }).click();
  if (opacity !== undefined) {
    await picker
      .getByRole("spinbutton", { name: "Opacity (%)", exact: true })
      .fill(String(opacity));
  }
  await picker.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(picker).toBeHidden();
}

export async function createDistributionStateFile(
  targetCollapsed = true,
): Promise<StateFilePayload> {
  const state = JSON.parse(await readFile(syntheticStatePath, "utf8")) as OrgToolsState;
  const systemView = state.organization.views.find((view) => view.kind === "system");
  const sourceUnit = systemView?.structure.units.find((unit) => unit.name === "Product");
  const targetUnit = systemView?.structure.units.find((unit) => unit.name === "Platform");
  const sharedEmployeeId = sourceUnit?.employeeIds[0];
  if (!sourceUnit || !targetUnit || !sharedEmployeeId) {
    throw new Error("The distribution fixture Units are unavailable.");
  }
  targetUnit.employeeIds = [sharedEmployeeId, ...targetUnit.employeeIds];
  targetUnit.collapsed = targetCollapsed;
  targetUnit.bossEmployeeId = null;
  return {
    buffer: Buffer.from(JSON.stringify(state)),
    mimeType: "application/json",
    name: "distribution-state.json",
  };
}

export async function createUsedColorsStateFile(): Promise<StateFilePayload> {
  const state = JSON.parse(await readFile(syntheticStatePath, "utf8")) as OrgToolsState;
  const systemView = state.organization.views.find((view) => view.kind === "system");
  if (!systemView) throw new Error("System View is unavailable.");
  const viewId = "70000000-0000-4000-8000-000000000001";
  state.organization.views.push({
    createdAt: "2026-09-17T12:00:00.000Z",
    id: viewId,
    kind: "custom",
    name: "Inactive palette",
    structure: {
      canvasElements: [
        {
          dash: "solid",
          end: { attachment: null, x: 180, y: 100 },
          endControl: { x: -26, y: 0 },
          endMarker: "arrow",
          id: "70000000-0000-4000-8000-000000000002",
          layer: "aboveUnits",
          start: { attachment: null, x: 60, y: 100 },
          startControl: { x: 26, y: 0 },
          startMarker: "none",
          strokeColor: "#12345600",
          strokeWidth: 2,
          type: "arrow",
        },
      ],
      layoutMode: systemView.structure.layoutMode,
      settings: {
        distributedColor: "#abcdef80",
        groupByTag: true,
        showTagCloud: true,
        undistributedColor: "#3b82f6ff",
      },
      units: [],
    },
    updatedAt: "2026-09-17T12:00:00.000Z",
  });
  state.ui.editor.views.push({
    distributionModeUnitIds: [],
    selectedItems: [],
    viewId,
    viewport: { scale: 1, x: 0, y: 0 },
  });
  return {
    buffer: Buffer.from(JSON.stringify(state)),
    mimeType: "application/json",
    name: "used-colors-state.json",
  };
}

export async function expectUsedColorPalette(page: Page, appearances: string[] = []) {
  const section = page.locator('[data-demo-id="tag-color-used-colors"]');
  await expect(section).toBeVisible();
  await expect(section.getByRole("option").first()).toBeVisible();
  for (const appearance of appearances) {
    await expect(section.locator(`[data-tag-color-used="${appearance}"]`)).toHaveCount(1);
  }
  expect(
    await section.getByRole("option").evaluateAll((options) =>
      options.every((option) => {
        const bounds = option.getBoundingClientRect();
        return bounds.width === 28 && bounds.height === 28;
      }),
    ),
  ).toBe(true);
  return section;
}
const emptyEmployeeFilters = () => ({
  birthday: null,
  customFields: [],
  includeWithoutTags: false,
  includeWithoutUnits: false,
  selectedGenders: [],
  selectedPositions: [],
  selectedTags: [],
  selectedUnitIds: [],
});

const emptyDownloadState = (sourceViewId: string): OrgToolsState["ui"]["download"] => ({
  employeeFilters: emptyEmployeeFilters(),
  employeeQuery: "",
  excludedEmployeeIds: [],
  excludedJsonTagKeys: [],
  excludedJsonUnitIds: [],
  jsonFieldNames: {
    custom: {},
    employee: {
      avatarBase64Url: "avatarBase64Url",
      birthday: "birthday",
      email: "email",
      firstName: "firstName",
      fullName: "fullName",
      gender: "gender",
      id: "id",
      lastName: "lastName",
      phone: "phone",
      profileUrl: "profileUrl",
      username: "username",
    },
    tags: { collection: "tags", fields: { date: "date", label: "label" } },
    units: {
      collection: "units",
      fields: {
        isBoss: "isBoss",
        position: "position",
        unitFullPath: "unitFullPath",
        unitId: "unitId",
        unitName: "unitName",
      },
    },
  },
  jsonTagFieldOrder: ["label", "date"],
  jsonTopLevelFieldOrder: [
    "id",
    "firstName",
    "lastName",
    "fullName",
    "gender",
    "username",
    "profileUrl",
    "email",
    "phone",
    "avatarBase64Url",
    "birthday",
    "units",
    "tags",
  ],
  jsonUnitFieldOrder: ["unitId", "unitName", "unitFullPath", "position", "isBoss"],
  selectedCustomEmployeeFieldIds: [],
  selectedEmployeeFieldKeys: ["username"],
  selectedFilters: emptyEmployeeFilters(),
  selectedJsonTagFieldKeys: [],
  selectedJsonUnitFieldKeys: [],
  selectedQuery: "",
  selections: [],
  tabMode: "json" as const,
  templateFormat: "{email}, ",
  unitQuery: "",
  sourceViewId,
});

export const testAdministrator = {
  email: process.env.ORG_TOOLS_TEST_ADMIN_EMAIL ?? "administrator@example.test",
  password:
    process.env.ORG_TOOLS_TEST_ADMIN_PASSWORD ?? "Org Tools test administrator password 2026",
};

export const configuredOrigin = () =>
  process.env.ORG_TOOLS_PUBLIC_ORIGIN ??
  process.env.ORG_TOOLS_BASE_URL ??
  `http://127.0.0.1:${process.env.ORG_TOOLS_PORT ?? "3000"}`;

export const mutationHeaders = (csrfToken?: string): Record<string, string> => ({
  "Content-Type": "application/json",
  Origin: configuredOrigin(),
  "Sec-Fetch-Site": "same-origin",
  ...(csrfToken ? { "X-Org-Tools-CSRF": csrfToken } : {}),
});

type Bootstrap = {
  csrfToken: string;
  organizationRevision: number;
  securityRevision: number;
};

export async function authenticateSuperAdministrator(page: Page): Promise<Bootstrap> {
  let session = await page.request.get("/api/session");
  if (!session.ok()) {
    const status = await page.request.get("/api/auth/status");
    if (!status.ok()) throw new Error(JSON.stringify(await status.json()));
    const mode = (await status.json()) as { kind: "login" | "setup" };
    const endpoint = mode.kind === "setup" ? "/api/auth/setup" : "/api/auth/login";
    const body =
      mode.kind === "setup"
        ? {
            ...testAdministrator,
            setupToken: process.env.ORG_TOOLS_SETUP_TOKEN ?? "",
          }
        : testAdministrator;
    const authenticated = await page.request.post(endpoint, {
      data: body,
      headers: mutationHeaders(),
    });
    if (!authenticated.ok()) throw new Error(JSON.stringify(await authenticated.json()));
    session = await page.request.get("/api/session");
  }
  if (!session.ok()) throw new Error(JSON.stringify(await session.json()));
  return (await session.json()) as Bootstrap;
}

const readStateFile = async (file: StateFilePayload | string): Promise<OrgToolsState> => {
  const source = typeof file === "string" ? await readFile(file) : file.buffer;
  return JSON.parse(source.toString("utf8")) as OrgToolsState;
};

export async function replaceStateFromFile(
  page: Page,
  file: StateFilePayload | string,
): Promise<void> {
  const state = await readStateFile(file);
  const returnUrl = page.url();
  await authenticateSuperAdministrator(page);
  if (returnUrl.startsWith("http://") || returnUrl.startsWith("https://")) {
    await page.goto("/api/health/live", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
  }
  const bootstrap = await authenticateSuperAdministrator(page);
  const write = await page.request.post("/api/commands", {
    data: {
      expectedOrganizationRevision: bootstrap.organizationRevision,
      expectedSecurityRevision: bootstrap.securityRevision,
      organization: state.organization,
      type: "organization.replace",
    },
    headers: mutationHeaders(bootstrap.csrfToken),
  });
  if (!write.ok()) throw new Error(JSON.stringify(await write.json()));
  const uiWrite = await page.request.put("/api/ui", {
    data: state.ui,
    headers: mutationHeaders(bootstrap.csrfToken),
  });
  if (!uiWrite.ok()) throw new Error(JSON.stringify(await uiWrite.json()));
  if (
    (returnUrl.startsWith("http://") || returnUrl.startsWith("https://")) &&
    !returnUrl.endsWith("/api/health/live")
  ) {
    await page.goto(returnUrl, { waitUntil: "domcontentloaded" });
  }
}

export async function resetServerState(page: Page, locale: AppLocale = "en"): Promise<string> {
  const state = await readStateFile(syntheticStatePath);
  const systemView = state.organization.views.find((view) => view.kind === "system");
  if (!systemView) throw new Error("System View is unavailable.");
  systemView.structure.canvasElements = [];
  systemView.structure.units = [];
  state.organization.employees = [];
  state.organization.employeeFieldDefinitions = [];
  state.organization.tags = [];
  state.organization.views = [systemView];
  state.ui.activeTab = "orgEditor";
  state.ui.calendar = { monthIndex: 6, year: 2026 };
  state.ui.editor = {
    activeViewId: systemView.id,
    searchOpen: false,
    searchQuery: "",
    views: [
      {
        distributionModeUnitIds: [],
        selectedItems: [],
        viewId: systemView.id,
        viewport: { scale: 1, x: 0, y: 0 },
      },
    ],
  };
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
  state.ui.download = emptyDownloadState(systemView.id);
  await replaceStateFromFile(page, {
    buffer: Buffer.from(JSON.stringify(state)),
    mimeType: "application/json",
    name: "blank-state.json",
  });
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
  await expect(page.locator('[data-demo-id="app-shell"]')).toHaveAttribute(
    "data-state-pending",
    "false",
    { timeout: 30_000 },
  );
  await expect(page.getByRole("tab", { name: "Editor", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.locator("html")).not.toHaveClass(/dark/);
}

export async function openAdministration(page: Page): Promise<void> {
  await page.locator('[data-demo-id="account-menu"]').click();
  const administrationAction = page.locator('[data-demo-id="account-administration"]');
  await expect(administrationAction).toBeVisible();
  await administrationAction.click();
  await expect(administrationAction).toHaveCount(0);
  await expect(page.locator('[data-demo-id="administration-tab"]')).toBeVisible();
}

export async function replaceWithSyntheticState(page: Page): Promise<void> {
  await replaceStateFromFile(page, syntheticStatePath);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-demo-id="app-shell"]')).toHaveAttribute(
    "data-state-pending",
    "false",
    { timeout: 30_000 },
  );
  await expect(page.getByRole("group", { name: "Canvas Unit Product", exact: true })).toBeVisible({
    timeout: 30_000,
  });
}

export async function stabilizeForScreenshot(page: Page): Promise<void> {
  const appShell = page.locator('[data-demo-id="app-shell"]');
  if ((await appShell.count()) > 0) {
    await expect(appShell).toHaveAttribute("data-state-pending", "false");
  }
  await page.mouse.move(1, 1);
  await page.evaluate(() => {
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement && !activeElement.closest('[role="listbox"]')) {
      activeElement.blur();
    }
  });
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        caret-color: transparent !important;
        transition-duration: 0s !important;
      }
      [data-slot="scroll-area-scrollbar"] {
        display: none !important;
      }
    `,
  });
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.waitForTimeout(1_500);
}
