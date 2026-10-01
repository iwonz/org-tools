import type {
  Account,
  OrganizationDocument,
  OrganizationEmployee,
  PermissionGrant,
  Role,
  StoredResourcePolicy,
} from "@org-tools/types";
import type { Pool } from "pg";
import { beforeEach, describe, expect, it } from "vitest";

import { createBlankOrgToolsState } from "@/lib/org-file";
import type { AuthenticatedSession } from "@/server/auth-service";
import { clearAuthorizedProjectionCacheForTests } from "@/server/authorized-projection";
import {
  EditorImageExportAccessService,
  parseEditorImageExportProjectionRequest,
} from "@/server/editor-image-export-access";
import { AuthorizationDeniedError } from "@/server/organization-authorization";

const timestamp = "2026-10-01T00:00:00.000Z";
const uuid = (value: number) => `00000000-0000-4000-8000-${String(value).padStart(12, "0")}`;
const actorAccountId = uuid(1);
const actorRoleId = uuid(2);
const targetEmployeeId = uuid(10);
const hiddenEmployeeId = uuid(11);
const targetAccountId = uuid(20);
const targetRoleId = uuid(21);
const viewId = uuid(30);
const rootUnitId = uuid(31);
const hiddenTagId = uuid(40);
const hiddenFieldId = uuid(41);
const hiddenSlotId = uuid(42);

const account = (input: {
  directGrants?: PermissionGrant[];
  employeeId: string | null;
  id: string;
  roleId: string;
  status?: "active" | "disabled";
}): Account => ({
  createdAt: timestamp,
  directGrants: input.directGrants ?? [],
  email: `${input.id}@example.test`,
  employeeId: input.employeeId,
  id: input.id,
  mustChangePassword: false,
  roleId: input.roleId,
  status: input.status ?? "active",
  updatedAt: timestamp,
});

const role = (input: {
  grants?: PermissionGrant[];
  id: string;
  name: string;
  systemKey: Role["systemKey"];
}): Role => ({
  grants: input.grants ?? [],
  id: input.id,
  name: input.name,
  systemKey: input.systemKey,
});

const employee = (id: string, firstName: string): OrganizationEmployee => ({
  avatarBase64Url: null,
  birthday: null,
  createdAt: timestamp,
  customFieldValues: { [hiddenFieldId]: `${firstName} secret` },
  email: `${firstName.toLocaleLowerCase("en-US")}@example.test`,
  firstName,
  gender: "unspecified",
  id,
  lastName: "Example",
  phone: null,
  profileUrl: null,
  tags: [],
  updatedAt: timestamp,
  username: firstName.toLocaleLowerCase("en-US"),
});

const organization = (): OrganizationDocument => {
  const state = createBlankOrgToolsState();
  const document = state.organization;
  const target = employee(targetEmployeeId, "Taylor");
  const hidden = employee(hiddenEmployeeId, "Hidden");
  hidden.tags = [{ date: null, tagId: hiddenTagId }];
  document.employees = [target, hidden];
  document.tags = [{ color: null, id: hiddenTagId, label: "Confidential" }];
  document.employeeFieldDefinitions = [
    {
      allowCustomOptions: false,
      id: hiddenFieldId,
      key: "privateCode",
      kind: "value",
      multiple: false,
      name: "Private code",
      options: [],
      required: false,
      valueType: "text",
    },
  ];
  const view = document.views[0];
  if (!view) throw new Error("System View is missing.");
  view.id = viewId;
  view.structure.units = [
    {
      bossEmployeeId: targetEmployeeId,
      collapsed: false,
      createdAt: timestamp,
      employeeIds: [targetEmployeeId, hiddenEmployeeId],
      employeePositions: [],
      id: rootUnitId,
      liveFilter: null,
      name: "Root Unit",
      noteMarkdown: "",
      order: 0,
      parentId: null,
      staffingSlots: [{ id: hiddenSlotId, name: "Secret slot", tags: [] }],
      updatedAt: timestamp,
      x: 0,
      y: 0,
    },
  ];
  return document;
};

const actorAccount = account({ employeeId: null, id: actorAccountId, roleId: actorRoleId });
const actorRole = role({
  id: actorRoleId,
  name: "Super Administrator",
  systemKey: "superAdmin",
});
const targetAccount = account({
  directGrants: [
    { permission: "unit.read", scope: "all" },
    { permission: "editor.system.read", scope: "all" },
  ],
  employeeId: targetEmployeeId,
  id: targetAccountId,
  roleId: targetRoleId,
});
const targetRole = role({
  grants: [{ permission: "employee.read", scope: "all" }],
  id: targetRoleId,
  name: "Viewer",
  systemKey: null,
});

const session: AuthenticatedSession = {
  account: actorAccount,
  accountSummary: {
    ...actorAccount,
    effectiveGrants: [],
    roleName: actorRole.name,
    roleSystemKey: actorRole.systemKey,
  },
  csrfHash: Buffer.alloc(32),
  previousCsrfHash: null,
  role: actorRole,
  sessionId: uuid(3),
};

const audience = (allAuthenticated: boolean) => ({
  allAuthenticated,
  relations: [],
  roleIds: [],
  userIds: [],
});

const policy = (
  resourceKind: StoredResourcePolicy["resourceKind"],
  resourceId: string,
  hideEmployeesWhenUnread = false,
): StoredResourcePolicy => ({
  hideEmployeesWhenUnread,
  read: audience(false),
  resourceId,
  resourceKind,
  write: audience(false),
});

type FakePoolOptions = {
  status?: "active" | "disabled";
  targetExists?: boolean;
};

const fakePool = (
  auditTargets: string[][],
  { status = "active", targetExists = true }: FakePoolOptions = {},
): Pool => {
  const document = organization();
  const policies = [
    policy("tag", hiddenTagId, true),
    policy("employeeField", hiddenFieldId),
    policy("staffingSlot", hiddenSlotId),
  ];
  const targetRow = {
    created_at: timestamp,
    direct_grants: targetAccount.directGrants,
    email: targetAccount.email,
    employee_id: targetAccount.employeeId,
    id: targetAccount.id,
    must_change_password: false,
    password_hash: "$argon2id$test",
    role_grants: targetRole.grants,
    role_id: targetRole.id,
    role_name: targetRole.name,
    status,
    system_key: null,
    updated_at: timestamp,
  };
  const client = {
    query: async (sql: string, parameters?: unknown[]) => {
      if (
        sql === "BEGIN" ||
        sql === "COMMIT" ||
        sql === "ROLLBACK" ||
        sql.startsWith("SET TRANSACTION") ||
        sql.includes("pg_advisory_xact_lock")
      ) {
        return { rowCount: 0, rows: [] };
      }
      if (sql.includes("FROM sessions s")) return { rowCount: 1, rows: [{}] };
      if (sql.includes("FROM organization_documents")) {
        return {
          rowCount: 1,
          rows: [
            {
              bootstrap_ui_json: null,
              organization_json: document,
              revision: "73",
              security_revision: "91",
            },
          ],
        };
      }
      if (sql.includes("WHERE a.status = 'active'")) {
        return {
          rowCount: 2,
          rows: [
            {
              email: actorAccount.email,
              employee_id: null,
              id: actorAccount.id,
              role_name: actorRole.name,
            },
            {
              email: targetAccount.email,
              employee_id: targetAccount.employeeId,
              id: targetAccount.id,
              role_name: targetRole.name,
            },
          ],
        };
      }
      if (sql.includes("FROM accounts a JOIN roles r") && sql.includes("WHERE a.id = $1")) {
        return targetExists ? { rowCount: 1, rows: [targetRow] } : { rowCount: 0, rows: [] };
      }
      if (sql.includes("SELECT employee_id::text FROM accounts")) {
        return { rowCount: 1, rows: [{ employee_id: targetEmployeeId }] };
      }
      if (sql.includes("FROM resource_policies")) {
        return {
          rowCount: policies.length,
          rows: policies.map((item) => ({
            hide_employees_when_unread: item.hideEmployeesWhenUnread,
            read_audience: item.read,
            resource_id: item.resourceId,
            resource_kind: item.resourceKind,
            write_audience: item.write,
          })),
        };
      }
      if (sql.includes("INSERT INTO audit_events")) {
        auditTargets.push(JSON.parse(String(parameters?.[3])) as string[]);
        return { rowCount: 1, rows: [] };
      }
      throw new Error(`Unexpected query: ${sql}`);
    },
    release: () => undefined,
  };
  return { connect: async () => client } as unknown as Pool;
};

describe("Editor image export access", () => {
  beforeEach(() => clearAuthorizedProjectionCacheForTests());

  it("parses an exact View or Unit projection request", () => {
    expect(parseEditorImageExportProjectionRequest({ accountId: targetAccountId, viewId })).toEqual(
      {
        accountId: targetAccountId,
        viewId,
      },
    );
    expect(
      parseEditorImageExportProjectionRequest({
        accountId: targetAccountId,
        rootUnitId,
        viewId,
      }),
    ).toEqual({ accountId: targetAccountId, rootUnitId, viewId });
  });

  it("rejects malformed IDs and unknown keys", () => {
    for (const input of [
      null,
      { accountId: "invalid", viewId },
      { accountId: targetAccountId, rootUnitId: null, viewId },
      { accountId: targetAccountId, extra: true, viewId },
    ]) {
      expect(() => parseEditorImageExportProjectionRequest(input)).toThrow(SyntaxError);
    }
  });

  it("lists only the minimal active-account identity fields", async () => {
    const response = await new EditorImageExportAccessService(fakePool([])).listSubjects(session);
    expect(response).toEqual({
      subjects: [
        {
          accountId: actorAccountId,
          displayName: actorAccount.email,
          email: actorAccount.email,
          roleName: actorRole.name,
        },
        {
          accountId: targetAccountId,
          displayName: "Taylor Example",
          email: targetAccount.email,
          roleName: targetRole.name,
        },
      ],
    });
  });

  it("exports with the target role, direct grants, and ACL without requiring target export rights", async () => {
    const auditTargets: string[][] = [];
    const response = await new EditorImageExportAccessService(
      fakePool(auditTargets),
    ).createProjection(session, { accountId: targetAccountId, rootUnitId, viewId });

    expect(response.available).toBe(true);
    expect(response.organizationRevision).toBe(73);
    expect(response.securityRevision).toBe(91);
    expect(response.projection.views).toHaveLength(1);
    expect(response.projection.views[0]?.id).toBe(viewId);
    expect(response.projection.employeeFieldDefinitions).toEqual([]);
    expect(response.projection.tags).toEqual([]);
    expect(response.projection.employees.map((item) => item.id)).toEqual([targetEmployeeId]);
    expect(response.projection.employees[0]).not.toHaveProperty("email");
    expect(response.projection.employees[0]?.customFieldValues).toEqual({});
    expect(response.projection.views[0]?.structure.units[0]?.employeeIds).toEqual([
      targetEmployeeId,
    ]);
    expect(response.projection.views[0]?.structure.units[0]?.staffingSlots).toEqual([]);
    expect(auditTargets).toEqual([[targetAccountId, viewId, rootUnitId]]);
  });

  it("returns an unavailable projection when the requested View or Unit is not visible", async () => {
    const response = await new EditorImageExportAccessService(fakePool([])).createProjection(
      session,
      { accountId: targetAccountId, rootUnitId: uuid(999), viewId },
    );
    expect(response.available).toBe(false);
    expect(response.projection).toMatchObject({
      employeeFieldDefinitions: [],
      employees: [],
      tags: [],
      views: [],
    });
  });

  it("does not reveal whether an unavailable account is missing or disabled", async () => {
    await expect(
      new EditorImageExportAccessService(fakePool([], { targetExists: false })).createProjection(
        session,
        { accountId: targetAccountId, viewId },
      ),
    ).rejects.toBeInstanceOf(AuthorizationDeniedError);
    await expect(
      new EditorImageExportAccessService(fakePool([], { status: "disabled" })).createProjection(
        session,
        { accountId: targetAccountId, viewId },
      ),
    ).rejects.toBeInstanceOf(AuthorizationDeniedError);
  });

  it("rejects an ordinary actor even when a malformed grant contains the reserved permission", async () => {
    const ordinaryAccount = account({
      directGrants: [{ permission: "editorImageExport.exportAs", scope: "all" }],
      employeeId: targetEmployeeId,
      id: actorAccountId,
      roleId: targetRoleId,
    });
    await expect(
      new EditorImageExportAccessService(fakePool([])).listSubjects({
        ...session,
        account: ordinaryAccount,
        role: targetRole,
      }),
    ).rejects.toBeInstanceOf(AuthorizationDeniedError);
  });
});
