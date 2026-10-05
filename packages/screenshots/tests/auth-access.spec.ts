import type {
  AccountUiState,
  AuthorizedOrganizationProjection,
  OrganizationDocument,
} from "@org-tools/types";
import type { BrowserContext, Page } from "@playwright/test";

import { expect, test } from "./browser-test.js";
import {
  authenticateSuperAdministrator,
  configuredOrigin,
  mutationHeaders,
  replaceWithSyntheticState,
  testAdministrator,
} from "./helpers.js";

const backupPassphrase = "Org Tools browser backup passphrase 2026";
const nextPasswords = {
  custom: "Org Tools custom role password 2026",
  employee: "Org Tools employee password 2026",
  manager: "Org Tools manager password 2026",
};

type AdminData = {
  accounts: Array<{ email: string; id: string }>;
  roles: Array<{ id: string; name: string; system_key: string | null }>;
};

type Bootstrap = {
  account: { email: string; mustChangePassword: boolean; roleSystemKey: string | null };
  csrfToken: string;
  organizationRevision: number;
  projection: AuthorizedOrganizationProjection;
  securityRevision: number;
  ui: AccountUiState;
};

const organizationFromProjection = (
  projection: AuthorizedOrganizationProjection,
): OrganizationDocument => ({
  ...structuredClone(projection),
  employees: projection.employees.map((employee) => ({
    avatarBase64Url: employee.avatarBase64Url ?? null,
    birthday: employee.birthday ?? null,
    createdAt: employee.createdAt,
    customFieldValues: employee.customFieldValues ?? {},
    email: employee.email ?? null,
    firstName: employee.firstName ?? "",
    gender: employee.gender ?? "unspecified",
    id: employee.id,
    lastName: employee.lastName ?? "",
    phone: employee.phone ?? null,
    profileUrl: employee.profileUrl ?? null,
    tags: employee.tags ?? [],
    updatedAt: employee.updatedAt,
    username: employee.username ?? null,
  })),
});

const readAdmin = async (page: Page): Promise<AdminData> => {
  const response = await page.request.get("/api/admin");
  expect(response.ok()).toBe(true);
  return (await response.json()) as AdminData;
};

const adminCommand = async <T extends object>(page: Page, value: T) => {
  const session = await authenticateSuperAdministrator(page);
  const response = await page.request.post("/api/admin", {
    data: value,
    headers: mutationHeaders(session.csrfToken),
  });
  expect(response.ok(), await response.text()).toBe(true);
  return (await response.json()) as { temporaryPassword?: string };
};

const createAccount = async (
  page: Page,
  input: { email: string; employeeId: string; roleId: string },
): Promise<string> => {
  const result = await adminCommand(page, { ...input, type: "user.create" });
  expect(result.temporaryPassword).toBeTruthy();
  return result.temporaryPassword ?? "";
};

const loginAndChangeTemporaryPassword = async (
  context: BrowserContext,
  credentials: { email: string; nextPassword: string; temporaryPassword: string },
): Promise<Page> => {
  const page = await context.newPage();
  const login = await page.request.post("/api/auth/login", {
    data: { email: credentials.email, password: credentials.temporaryPassword },
    headers: mutationHeaders(),
  });
  expect(login.ok()).toBe(true);
  const temporary = await page.request.get("/api/session");
  expect(temporary.ok()).toBe(true);
  const bootstrap = (await temporary.json()) as Bootstrap;
  expect(bootstrap.account.mustChangePassword).toBe(true);
  const change = await page.request.post("/api/auth/password", {
    data: {
      currentPassword: credentials.temporaryPassword,
      password: credentials.nextPassword,
    },
    headers: mutationHeaders(bootstrap.csrfToken),
  });
  expect(change.ok()).toBe(true);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-demo-id="app-shell"]')).toHaveAttribute(
    "data-state-pending",
    "false",
    { timeout: 60_000 },
  );
  await expect(page.locator('[data-demo-id="account-menu"]')).toBeVisible({ timeout: 60_000 });
  return page;
};

test("enforces roles, scopes, ACL projections, and Administration isolation", async ({
  browser,
  page,
}, testInfo) => {
  test.setTimeout(480_000);
  await replaceWithSyntheticState(page);
  const adminSession = await authenticateSuperAdministrator(page);
  const backupResponse = await page.request.post("/api/backup", {
    data: {
      action: "create",
      currentPassword: testAdministrator.password,
      passphrase: backupPassphrase,
    },
    headers: mutationHeaders(adminSession.csrfToken),
  });
  expect(backupResponse.ok()).toBe(true);
  const backup = Buffer.from(await backupResponse.body());

  const contexts: BrowserContext[] = [];
  try {
    const initialAdmin = await readAdmin(page);
    const employeeRole = initialAdmin.roles.find((role) => role.system_key === "employee");
    const managerRole = initialAdmin.roles.find((role) => role.system_key === "manager");
    const superAdminRole = initialAdmin.roles.find((role) => role.system_key === "superAdmin");
    const currentAdmin = initialAdmin.accounts.find(
      (account) => account.email === testAdministrator.email,
    );
    expect(employeeRole).toBeTruthy();
    expect(managerRole).toBeTruthy();
    expect(superAdminRole).toBeTruthy();
    expect(currentAdmin).toBeTruthy();

    const lastSuperAdmin = await page.request.post("/api/admin", {
      data: {
        accountId: currentAdmin?.id,
        active: false,
        type: "user.active.update",
      },
      headers: mutationHeaders(adminSession.csrfToken),
    });
    expect(lastSuperAdmin.status()).toBe(404);
    expect(await lastSuperAdmin.json()).toEqual({
      error: { code: "resource_unavailable" },
    });

    const missingCsrf = await page.request.post("/api/admin", {
      data: { accountId: currentAdmin?.id, type: "user.sessions.revoke" },
      headers: mutationHeaders(),
    });
    expect(missingCsrf.status()).toBe(403);

    await adminCommand(page, {
      grants: [
        { permission: "employee.read", scope: "all" },
        { permission: "unit.read", scope: "all" },
      ],
      name: "Directory Reader",
      type: "role.create",
    });
    const adminAfterRole = await readAdmin(page);
    const customRole = adminAfterRole.roles.find((role) => role.name === "Directory Reader");
    expect(customRole).toBeTruthy();

    const managerTemporaryPassword = await createAccount(page, {
      email: "avery.stone@example.test",
      employeeId: "10000000-0000-4000-8000-000000000001",
      roleId: managerRole?.id ?? "",
    });
    const employeeTemporaryPassword = await createAccount(page, {
      email: "jordan.reed@example.test",
      employeeId: "10000000-0000-4000-8000-000000000002",
      roleId: employeeRole?.id ?? "",
    });
    const customTemporaryPassword = await createAccount(page, {
      email: "morgan.park@example.test",
      employeeId: "10000000-0000-4000-8000-000000000003",
      roleId: customRole?.id ?? "",
    });
    const accountsAfterCreation = await readAdmin(page);
    const employeeAccount = accountsAfterCreation.accounts.find(
      (account) => account.email === "jordan.reed@example.test",
    );
    expect(employeeAccount).toBeTruthy();
    await adminCommand(page, {
      accountId: employeeAccount?.id ?? "",
      directGrants: [{ permission: "editorImageExport.create", scope: "all" }],
      roleId: employeeRole?.id ?? "",
      type: "user.access.update",
    });

    const knownFailure = await page.request.post("/api/auth/login", {
      data: { email: "morgan.park@example.test", password: "Incorrect password value" },
      headers: mutationHeaders(),
    });
    const unknownFailure = await page.request.post("/api/auth/login", {
      data: { email: "unknown.person@example.test", password: "Incorrect password value" },
      headers: mutationHeaders(),
    });
    expect(knownFailure.status()).toBe(400);
    expect(unknownFailure.status()).toBe(400);
    expect(await knownFailure.json()).toEqual(await unknownFailure.json());
    for (let attempt = 2; attempt <= 8; attempt += 1) {
      const failure = await page.request.post("/api/auth/login", {
        data: { email: "unknown.person@example.test", password: "Incorrect password value" },
        headers: mutationHeaders(),
      });
      expect(failure.status()).toBe(attempt === 8 ? 429 : 400);
    }

    await adminCommand(page, {
      hideEmployeesWhenUnread: true,
      read: {
        allAuthenticated: false,
        relations: [],
        roleIds: [superAdminRole?.id ?? ""],
        userIds: [],
      },
      resourceId: "90000000-0000-4000-8000-000000000007",
      resourceKind: "tag",
      type: "policy.update",
      write: {
        allAuthenticated: false,
        relations: [],
        roleIds: [superAdminRole?.id ?? ""],
        userIds: [],
      },
    });
    await adminCommand(page, {
      hideEmployeesWhenUnread: false,
      read: {
        allAuthenticated: false,
        relations: [],
        roleIds: [superAdminRole?.id ?? ""],
        userIds: [],
      },
      resourceId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      resourceKind: "unit",
      type: "policy.update",
      write: {
        allAuthenticated: false,
        relations: [],
        roleIds: [superAdminRole?.id ?? ""],
        userIds: [],
      },
    });

    const managerContext = await browser.newContext({ baseURL: configuredOrigin() });
    const employeeContext = await browser.newContext({ baseURL: configuredOrigin() });
    const customContext = await browser.newContext({ baseURL: configuredOrigin() });
    contexts.push(managerContext, employeeContext, customContext);
    const managerPage = await loginAndChangeTemporaryPassword(managerContext, {
      email: "avery.stone@example.test",
      nextPassword: nextPasswords.manager,
      temporaryPassword: managerTemporaryPassword,
    });
    const employeePage = await loginAndChangeTemporaryPassword(employeeContext, {
      email: "jordan.reed@example.test",
      nextPassword: nextPasswords.employee,
      temporaryPassword: employeeTemporaryPassword,
    });
    const customPage = await loginAndChangeTemporaryPassword(customContext, {
      email: "morgan.park@example.test",
      nextPassword: nextPasswords.custom,
      temporaryPassword: customTemporaryPassword,
    });

    for (const restrictedPage of [managerPage, employeePage, customPage]) {
      await expect(restrictedPage.getByRole("tab", { name: "Administration" })).toHaveCount(0);
      await restrictedPage.locator('[data-demo-id="account-menu"]').click();
      await expect(restrictedPage.locator('[data-demo-id="account-administration"]')).toHaveCount(
        0,
      );
      await restrictedPage.keyboard.press("Escape");
      const denied = await restrictedPage.request.get("/api/admin");
      expect(denied.status()).toBe(404);
      expect(await denied.json()).toEqual({ error: { code: "resource_unavailable" } });
      const bootstrapResponse = await restrictedPage.request.get("/api/session");
      expect(bootstrapResponse.ok()).toBe(true);
      const bootstrap = (await bootstrapResponse.json()) as Bootstrap;
      expect(bootstrap.projection.tags.some((tag) => tag.label === "Content")).toBe(false);
      expect(
        bootstrap.projection.employees.some((employee) => employee.firstName === "Riley"),
      ).toBe(false);
    }

    const exportSubjects = await page.request.get("/api/editor-image-export/subjects");
    expect(exportSubjects.ok(), await exportSubjects.text()).toBe(true);
    const subjectPayload = (await exportSubjects.json()) as {
      subjects: Array<{ accountId: string; email: string }>;
    };
    expect(subjectPayload.subjects.map((subject) => subject.email)).toEqual(
      expect.arrayContaining([
        testAdministrator.email,
        "avery.stone@example.test",
        "jordan.reed@example.test",
        "morgan.park@example.test",
      ]),
    );
    expect(subjectPayload.subjects.every((subject) => Object.keys(subject).length === 4)).toBe(
      true,
    );

    const managerSubject = subjectPayload.subjects.find(
      (subject) => subject.email === "avery.stone@example.test",
    );
    const customSubject = subjectPayload.subjects.find(
      (subject) => subject.email === "morgan.park@example.test",
    );
    for (const [accountId, available] of [
      [managerSubject?.accountId, true],
      [customSubject?.accountId, false],
    ] as const) {
      const response = await page.request.post("/api/editor-image-export/projection", {
        data: { accountId, viewId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc" },
        headers: mutationHeaders(adminSession.csrfToken),
      });
      expect(response.ok(), await response.text()).toBe(true);
      expect((await response.json()) as { available: boolean }).toMatchObject({ available });
    }

    const employeeProjection = await page.request.post("/api/editor-image-export/projection", {
      data: {
        accountId: employeeAccount?.id,
        viewId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      },
      headers: mutationHeaders(adminSession.csrfToken),
    });
    expect(employeeProjection.ok(), await employeeProjection.text()).toBe(true);
    const exportProjection = (await employeeProjection.json()) as {
      available: boolean;
      projection: AuthorizedOrganizationProjection;
    };
    expect(exportProjection.available).toBe(true);
    expect(exportProjection.projection.tags.some((tag) => tag.label === "Content")).toBe(false);
    expect(
      exportProjection.projection.employees.some((employee) => employee.firstName === "Riley"),
    ).toBe(false);
    expect(exportProjection).not.toHaveProperty("ui");
    expect(exportProjection).not.toHaveProperty("access");
    const adminWithExportAudit = (await (await page.request.get("/api/admin")).json()) as {
      audit: Array<{ action: string; actor_account_id: string; target_ids: string[] }>;
    };
    expect(adminWithExportAudit.audit).toContainEqual(
      expect.objectContaining({
        action: "editor.image_export.project_as",
        actor_account_id: currentAdmin?.id,
        target_ids: [employeeAccount?.id, "cccccccc-cccc-4ccc-8ccc-cccccccccccc"],
      }),
    );

    const forbiddenSubjects = await employeePage.request.get("/api/editor-image-export/subjects");
    expect(forbiddenSubjects.status()).toBe(404);
    const employeeExportBootstrapResponse = await employeePage.request.get("/api/session");
    expect(employeeExportBootstrapResponse.ok()).toBe(true);
    const employeeExportBootstrap = (await employeeExportBootstrapResponse.json()) as Bootstrap;
    const forbiddenProjection = await employeePage.request.post(
      "/api/editor-image-export/projection",
      {
        data: {
          accountId: employeeAccount?.id,
          viewId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
        },
        headers: mutationHeaders(employeeExportBootstrap.csrfToken),
      },
    );
    expect(forbiddenProjection.status()).toBe(404);

    await page.getByRole("tab", { name: "Editor", exact: true }).click();
    await expect(page.locator('[data-demo-id="org-editor-canvas"]')).toBeVisible();
    await page.locator('[data-demo-id="org-editor-view-image-export-action"]').click();
    let imageDialog = page.locator('[data-demo-id="org-editor-view-image-export-dialog"]');
    const subjectTrigger = imageDialog.locator(
      '[data-demo-id="org-editor-image-export-subject-trigger"]',
    );
    const viewPreview = imageDialog.getByAltText("View export preview", { exact: true });
    await expect(viewPreview).toHaveAttribute("src", /.+/);
    await expect(subjectTrigger).toContainText("My access");
    await subjectTrigger.click();
    const fullProjectionResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/editor-image-export/projection") &&
        response.request().method() === "POST",
    );
    await page
      .locator('[data-demo-id="org-editor-image-export-subject-options"]')
      .getByText("jordan.reed@example.test", { exact: false })
      .click();
    expect((await fullProjectionResponse).ok()).toBe(true);
    await expect(subjectTrigger).toContainText("Jordan Reed");
    await expect(viewPreview).toBeVisible();
    const subjectTagTrigger = imageDialog.locator(
      '[data-demo-id="org-editor-image-tag-visibility-trigger"]',
    );
    await subjectTagTrigger.click();
    const subjectTagOptions = page.locator('[data-demo-id="org-editor-image-tag-options"]');
    await expect(subjectTagOptions).not.toContainText("Content");
    await expect(subjectTagOptions).toContainText("Design");
    await page.keyboard.press("Escape");
    await expect(imageDialog.getByRole("button", { name: "Save", exact: true })).toBeEnabled();
    const adminAfterExport = (await (await page.request.get("/api/session")).json()) as Bootstrap;
    expect(adminAfterExport.account.email).toBe(testAdministrator.email);
    await page.keyboard.press("Escape");
    await page.locator('[data-demo-id="org-editor-view-image-export-action"]').click();
    imageDialog = page.locator('[data-demo-id="org-editor-view-image-export-dialog"]');
    await expect(
      imageDialog.locator('[data-demo-id="org-editor-image-export-subject-trigger"]'),
    ).toContainText("My access");
    await page.keyboard.press("Escape");

    await page.locator('fieldset[aria-label="Canvas Unit Product"]').click({
      button: "right",
      position: { x: 20, y: 20 },
    });
    await page.locator('[data-demo-id="org-editor-export-action"]').click();
    const unitImageDialog = page.locator('[data-demo-id="org-editor-export-dialog"]');
    const unitSubjectTrigger = unitImageDialog.locator(
      '[data-demo-id="org-editor-image-export-subject-trigger"]',
    );
    const unitPreview = unitImageDialog.getByAltText("Unit export preview", { exact: true });
    await expect(unitPreview).toHaveAttribute("src", /.+/);
    await expect(unitSubjectTrigger).toContainText("My access");
    await unitSubjectTrigger.click();
    const unitProjectionResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/editor-image-export/projection") &&
        response.request().method() === "POST",
    );
    await page
      .locator('[data-demo-id="org-editor-image-export-subject-options"]')
      .getByText("jordan.reed@example.test", { exact: false })
      .click();
    expect((await unitProjectionResponse).ok()).toBe(true);
    await expect(unitSubjectTrigger).toContainText("Jordan Reed");
    await expect(unitPreview).toBeVisible();
    await expect(unitImageDialog.getByRole("button", { name: "Save", exact: true })).toBeEnabled();
    await page.keyboard.press("Escape");

    await page.locator('fieldset[aria-label="Canvas Unit Platform"]').click({
      button: "right",
      position: { x: 20, y: 20 },
    });
    await page.locator('[data-demo-id="org-editor-export-action"]').click();
    const unavailableUnitDialog = page.locator('[data-demo-id="org-editor-export-dialog"]');
    const unavailableSubjectTrigger = unavailableUnitDialog.locator(
      '[data-demo-id="org-editor-image-export-subject-trigger"]',
    );
    await unavailableSubjectTrigger.click();
    const unavailableProjectionResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/editor-image-export/projection") &&
        response.request().method() === "POST",
    );
    await page
      .locator('[data-demo-id="org-editor-image-export-subject-options"]')
      .getByText("jordan.reed@example.test", { exact: false })
      .click();
    expect((await unavailableProjectionResponse).ok()).toBe(true);
    await expect(unavailableUnitDialog).toContainText(
      "The selected user does not have access to this View or Unit.",
    );
    await expect(
      unavailableUnitDialog.getByRole("button", { name: "Copy", exact: true }),
    ).toBeDisabled();
    await expect(
      unavailableUnitDialog.getByRole("button", { name: "Save", exact: true }),
    ).toBeDisabled();
    await page.keyboard.press("Escape");

    await employeePage.getByRole("tab", { name: "Editor", exact: true }).click();
    await expect(
      employeePage.locator('[data-demo-id="org-editor-view-image-export-action"]'),
    ).toBeVisible();
    await employeePage.locator('[data-demo-id="org-editor-view-image-export-action"]').click();
    await expect(
      employeePage.locator('[data-demo-id="org-editor-image-export-subject-trigger"]'),
    ).toHaveCount(0);
    await expect(employeePage.getByAltText("View export preview", { exact: true })).toBeVisible();
    await employeePage.keyboard.press("Escape");

    const employeeBootstrapResponse = await employeePage.request.get("/api/session");
    const employeeBootstrap = (await employeeBootstrapResponse.json()) as Bootstrap;
    const staleAdministrationUi = structuredClone(employeeBootstrap.ui);
    staleAdministrationUi.activeTab = "administration";
    const correctedUiResponse = await employeePage.request.put("/api/ui", {
      data: staleAdministrationUi,
      headers: mutationHeaders(employeeBootstrap.csrfToken),
    });
    expect(correctedUiResponse.ok(), await correctedUiResponse.text()).toBe(true);
    const correctedUi = (await correctedUiResponse.json()) as { ui: AccountUiState };
    expect(correctedUi.ui.activeTab).not.toBe("administration");
    await employeePage.reload({ waitUntil: "domcontentloaded" });
    await expect(employeePage.locator('[data-demo-id="administration-tab"]')).toHaveCount(0);

    await expect(employeePage.getByRole("tab", { name: "Data Download" })).toHaveCount(0);
    await expect(customPage.getByRole("tab", { name: "Calendar" })).toHaveCount(0);
    await expect(managerPage.getByRole("tab", { name: "Employees" })).toBeVisible();

    const managerBootstrapResponse = await managerPage.request.get("/api/session");
    const managerBootstrap = (await managerBootstrapResponse.json()) as Bootstrap;
    const productUnit = managerBootstrap.projection.views
      .flatMap((view) => view.structure.units)
      .find((unit) => unit.name === "Product");
    expect(productUnit).toBeTruthy();

    const candidate = organizationFromProjection(managerBootstrap.projection);
    const candidateProduct = candidate.views
      .flatMap((view) => view.structure.units)
      .find((unit) => unit.id === productUnit?.id);
    if (!candidateProduct) throw new Error("Product Unit is unavailable.");
    candidateProduct.name = "Managed Product";
    const allowed = await managerPage.request.post("/api/commands", {
      data: {
        expectedOrganizationRevision: managerBootstrap.organizationRevision,
        expectedSecurityRevision: managerBootstrap.securityRevision,
        organization: candidate,
        type: "organization.patch",
      },
      headers: mutationHeaders(managerBootstrap.csrfToken),
    });
    expect(allowed.ok(), await allowed.text()).toBe(true);

    const refreshedResponse = await managerPage.request.get("/api/session");
    const refreshed = (await refreshedResponse.json()) as Bootstrap;
    const deniedCandidate = structuredClone(candidate);
    const deniedView = deniedCandidate.views.find((view) => view.kind === "system");
    if (!deniedView) throw new Error("System View is unavailable.");
    deniedView.structure.units.push({
      bossEmployeeId: null,
      collapsed: false,
      createdAt: "2026-09-30T00:00:00.000Z",
      employeeIds: [],
      employeePositions: [],
      id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      liveFilter: null,
      name: "Outside managed subtree",
      noteMarkdown: "",
      order: 100,
      parentId: null,
      staffingSlots: [],
      updatedAt: "2026-09-30T00:00:00.000Z",
      x: 0,
      y: 0,
    });
    const deniedMutation = await managerPage.request.post("/api/commands", {
      data: {
        expectedOrganizationRevision: refreshed.organizationRevision,
        expectedSecurityRevision: refreshed.securityRevision,
        organization: deniedCandidate,
        type: "organization.patch",
      },
      headers: mutationHeaders(refreshed.csrfToken),
    });
    expect(deniedMutation.status()).toBe(404);
    expect(await deniedMutation.json()).toEqual({ error: { code: "resource_unavailable" } });

    const accounts = await readAdmin(page);
    const customAccount = accounts.accounts.find(
      (account) => account.email === "morgan.park@example.test",
    );
    expect(customAccount).toBeTruthy();
    await adminCommand(page, {
      accountId: customAccount?.id ?? "",
      type: "user.sessions.revoke",
    });
    await expect
      .poll(() => customPage.request.get("/api/session").then((response) => response.status()))
      .toBe(401);
  } finally {
    // Keep the assertion deadline strict while reserving bounded time for baseline restoration.
    testInfo.setTimeout(testInfo.timeout + 120_000);
    // Close pages first so their EventSource cleanup runs before the browser contexts disappear.
    // Closing a context with an active streaming response can otherwise wait for the server-side
    // stream on some Chromium/Playwright combinations.
    await Promise.all(
      contexts.flatMap((context) =>
        context
          .pages()
          .map((contextPage) =>
            contextPage.close({ runBeforeUnload: false }).catch(() => undefined),
          ),
      ),
    );
    await Promise.all(contexts.map((context) => context.close()));
    const restoreSession = await authenticateSuperAdministrator(page);
    const request = page.context().request;
    await page.close({ runBeforeUnload: false }).catch(() => undefined);
    const restore = await request.post("/api/backup", {
      data: {
        action: "restore",
        currentPassword: testAdministrator.password,
        fileBase64: backup.toString("base64"),
        passphrase: backupPassphrase,
      },
      headers: mutationHeaders(restoreSession.csrfToken),
    });
    expect(restore.ok(), await restore.text()).toBe(true);
  }
});
