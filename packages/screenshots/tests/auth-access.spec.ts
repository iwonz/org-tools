import type { AuthorizedOrganizationProjection, OrganizationDocument } from "@org-tools/types";
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
  return page;
};

test("enforces roles, scopes, ACL projections, and Administration isolation", async ({
  browser,
  page,
}) => {
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
    await Promise.all(contexts.map((context) => context.close()));
    const restoreSession = await authenticateSuperAdministrator(page);
    await page.goto("about:blank");
    const restore = await page.request.post("/api/backup", {
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
