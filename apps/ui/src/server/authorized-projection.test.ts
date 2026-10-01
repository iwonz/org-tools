import type {
  Account,
  OrganizationDocument,
  OrganizationEmployee,
  PermissionGrant,
  Role,
  StoredResourcePolicy,
} from "@org-tools/types";
import type { Pool } from "pg";
import { describe, expect, it } from "vitest";

import { createBlankOrgToolsState } from "@/lib/org-file";
import {
  AuthorizedProjectionService,
  authorizedProjectionCacheSizeForTests,
  clearAuthorizedProjectionCacheForTests,
  type ResourcePolicyMap,
} from "@/server/authorized-projection";
import {
  AuthorizationDeniedError,
  authorizeOrganizationReplacement,
} from "@/server/organization-authorization";
import { buildEffectiveAccess } from "@/server/permissions";
import { mergeAuthorizedProjection } from "@/server/projection-merge";

const timestamp = "2026-09-29T00:00:00.000Z";
const uuid = (value: number) => `00000000-0000-4000-8000-${String(value).padStart(12, "0")}`;
const employeeId = uuid(1);
const hiddenEmployeeId = uuid(2);
const accountId = uuid(11);
const roleId = uuid(12);
const unitId = uuid(21);
const tagId = uuid(31);
const fieldId = uuid(41);
const templateFieldId = uuid(42);

const employee = (id: string, firstName: string): OrganizationEmployee => ({
  avatarBase64Url: null,
  birthday: null,
  createdAt: timestamp,
  customFieldValues: { [fieldId]: `${firstName} secret` },
  email: `${firstName.toLowerCase()}@example.test`,
  firstName,
  gender: "unspecified",
  id,
  lastName: "Example",
  phone: null,
  profileUrl: null,
  tags: [{ date: null, tagId }],
  updatedAt: timestamp,
  username: firstName.toLowerCase(),
});

const document = (): OrganizationDocument => {
  const state = createBlankOrgToolsState();
  state.organization.employeeFieldDefinitions = [
    {
      allowCustomOptions: false,
      id: fieldId,
      key: "privateCode",
      kind: "value",
      multiple: false,
      name: "Private code",
      options: [],
      required: false,
      valueType: "text",
    },
  ];
  state.organization.tags = [{ color: null, id: tagId, label: "Restricted" }];
  state.organization.employees = [
    employee(employeeId, "Alex"),
    employee(hiddenEmployeeId, "Blair"),
  ];
  const systemView = state.organization.views[0];
  if (!systemView) throw new Error("system view missing");
  systemView.structure.units = [
    {
      bossEmployeeId: employeeId,
      collapsed: false,
      createdAt: timestamp,
      employeeIds: [employeeId, hiddenEmployeeId],
      employeePositions: [],
      id: unitId,
      liveFilter: null,
      name: "Example Unit",
      noteMarkdown: "",
      order: 0,
      parentId: null,
      staffingSlots: [],
      updatedAt: timestamp,
      x: 0,
      y: 0,
    },
  ];
  return state.organization;
};

const role = (grants: PermissionGrant[]): Role => ({
  grants,
  id: roleId,
  name: "Example role",
  systemKey: null,
});

const account = (): Account => ({
  createdAt: timestamp,
  directGrants: [],
  email: "alex@example.test",
  employeeId,
  id: accountId,
  mustChangePassword: false,
  roleId,
  status: "active",
  updatedAt: timestamp,
});

const audience = (allAuthenticated: boolean) => ({
  allAuthenticated,
  relations: [],
  roleIds: [],
  userIds: [],
});

const policy = (
  kind: StoredResourcePolicy["resourceKind"],
  id: string,
  read: boolean,
  write = read,
  hideEmployeesWhenUnread = false,
): StoredResourcePolicy => ({
  hideEmployeesWhenUnread,
  read: audience(read),
  resourceId: id,
  resourceKind: kind,
  write: audience(write),
});

const fakePool = (policies: StoredResourcePolicy[], linkedEmployeeIds: string[] = []): Pool =>
  ({
    query: async (sql: string) => {
      if (sql.includes("FROM resource_policies")) {
        return {
          rows: policies.map((item) => ({
            hide_employees_when_unread: item.hideEmployeesWhenUnread,
            read_audience: item.read,
            resource_id: item.resourceId,
            resource_kind: item.resourceKind,
            write_audience: item.write,
          })),
        };
      }
      if (sql.includes("FROM accounts")) {
        return { rows: linkedEmployeeIds.map((id) => ({ employee_id: id })) };
      }
      throw new Error(`Unexpected query: ${sql}`);
    },
  }) as unknown as Pool;

describe("authorized organization projection", () => {
  it("bounds cached projections and invalidates them by organization or security revision", async () => {
    clearAuthorizedProjectionCacheForTests();
    let queryCount = 0;
    const pool = {
      query: async (sql: string) => {
        queryCount += 1;
        if (sql.includes("FROM resource_policies") || sql.includes("FROM accounts")) {
          return { rows: [] };
        }
        throw new Error(`Unexpected query: ${sql}`);
      },
    } as unknown as Pool;
    const service = new AuthorizedProjectionService(pool);
    const input = {
      account: account(),
      organization: document(),
      organizationRevision: 1,
      role: role([{ permission: "employee.read" as const, scope: "all" as const }]),
      securityRevision: 1,
    };

    await service.build(input);
    await service.build(input);
    expect(queryCount).toBe(2);
    await service.build({ ...input, securityRevision: 2 });
    await service.build({ ...input, organizationRevision: 2, securityRevision: 1 });
    expect(queryCount).toBe(6);

    for (let revision = 3; revision <= 70; revision += 1) {
      await service.build({ ...input, organizationRevision: revision });
    }
    expect(authorizedProjectionCacheSizeForTests()).toBe(64);
  });

  it("removes closed fields, linked email, restrictive Employees, and inaccessible identifiers", async () => {
    clearAuthorizedProjectionCacheForTests();
    const organization = document();
    const service = new AuthorizedProjectionService(
      fakePool([policy("tag", tagId, false, false, true)], [employeeId]),
    );
    expect((await service.readPolicies()).get(`tag\0${tagId}`)?.read.allAuthenticated).toBe(false);
    const result = await service.build({
      account: account(),
      organization,
      role: role([
        { permission: "employee.read", scope: "all" },
        { permission: "unit.read", scope: "all" },
        { permission: "editor.system.read", scope: "all" },
      ]),
    });

    expect(result.projection.employees.map((item) => item.id)).toEqual([employeeId]);
    expect(result.projection.tags).toEqual([]);
    expect(result.projection.employees[0]).not.toHaveProperty("email");
    expect(result.projection.employees[0]?.customFieldValues).toEqual({});
    expect(result.projection.employees[0]).not.toHaveProperty("tags");
    expect(result.projection.employeeFieldDefinitions).toEqual([]);
    expect(result.projection.views[0]?.structure.units[0]?.employeeIds).toEqual([employeeId]);
  });

  it("removes unread Tag and custom-field references from live filters and Staffing Slots", async () => {
    clearAuthorizedProjectionCacheForTests();
    const organization = document();
    const sourceUnit = organization.views[0]?.structure.units[0];
    if (!sourceUnit) throw new Error("unit missing");
    sourceUnit.liveFilter = {
      birthday: null,
      customFields: [
        {
          fieldId,
          includeUnset: false,
          selectedValues: ["Alex secret"],
        },
      ],
      includeWithoutTags: false,
      includeWithoutUnits: false,
      query: "",
      selectedGenders: [],
      selectedPositions: [],
      selectedTags: [tagId],
      selectedUnitIds: [],
    };
    sourceUnit.staffingSlots = [
      { id: uuid(51), name: "Private opening", tags: [{ date: null, tagId }] },
    ];
    const result = await new AuthorizedProjectionService(
      fakePool([policy("employeeField", fieldId, false), policy("tag", tagId, false)]),
    ).build({
      account: account(),
      organization,
      role: role([
        { permission: "employee.read", scope: "all" },
        { permission: "unit.read", scope: "all" },
        { permission: "editor.system.read", scope: "all" },
      ]),
    });

    const projectedUnit = result.projection.views[0]?.structure.units[0];
    expect(projectedUnit?.liveFilter?.customFields).toEqual([]);
    expect(projectedUnit?.liveFilter?.selectedTags).toEqual([]);
    expect(projectedUnit?.staffingSlots[0]?.tags).toEqual([]);
  });

  it("preserves hidden source values when a projected client updates visible data", async () => {
    const organization = document();
    const service = new AuthorizedProjectionService(fakePool([]));
    const result = await service.build({
      account: account(),
      organization,
      role: role([
        { permission: "employee.read", scope: "all" },
        { permission: "unit.read", scope: "all" },
        { permission: "editor.system.read", scope: "all" },
      ]),
    });
    const candidate = structuredClone(organization);
    candidate.employees = result.projection.employees.map((item) => ({
      ...employee(item.id, item.firstName ?? ""),
      customFieldValues: item.customFieldValues ?? {},
      firstName: item.id === employeeId ? "Alexandra" : (item.firstName ?? ""),
      tags: item.tags ?? [],
    }));
    candidate.employeeFieldDefinitions = result.projection.employeeFieldDefinitions;
    candidate.tags = result.projection.tags;
    candidate.views = result.projection.views;
    const merged = mergeAuthorizedProjection({
      baseline: result.projection,
      candidate,
      current: organization,
    });
    const mergedEmployee = merged.employees.find((item) => item.id === employeeId);
    expect(mergedEmployee?.firstName).toBe("Alexandra");
    expect(mergedEmployee?.customFieldValues[fieldId]).toBe("Alex secret");
  });

  it("resolves visible Template fields on the server without exposing their hidden sources", async () => {
    const organization = document();
    organization.employeeFieldDefinitions.push({
      hash: "none",
      id: templateFieldId,
      key: "privateSummary",
      kind: "template",
      name: "Private summary",
      template: "{firstName}: {privateCode}",
    });
    const service = new AuthorizedProjectionService(
      fakePool([
        policy("employeeField", fieldId, false),
        policy("employeeField", templateFieldId, true, false),
      ]),
    );
    const result = await service.build({
      account: account(),
      organization,
      role: role([{ permission: "employee.read", scope: "all" }]),
    });

    expect(result.projection.employeeFieldDefinitions).toEqual([
      expect.objectContaining({ id: templateFieldId, template: "" }),
    ]);
    expect(result.projection.employees[0]?.customFieldValues).toEqual({});
    expect(result.projection.employees[0]?.resolvedTemplateValues).toEqual({
      [templateFieldId]: "Alex: Alex secret",
    });

    const candidate = structuredClone(organization);
    candidate.employeeFieldDefinitions = result.projection.employeeFieldDefinitions;
    candidate.employees = result.projection.employees.map((item) => ({
      ...employee(item.id, item.firstName ?? ""),
      customFieldValues: item.customFieldValues ?? {},
      tags: item.tags ?? [],
    }));
    candidate.tags = result.projection.tags;
    candidate.views = result.projection.views;
    const merged = mergeAuthorizedProjection({
      baseline: result.projection,
      candidate,
      current: organization,
    });
    expect(
      merged.employeeFieldDefinitions.find((field) => field.id === templateFieldId),
    ).toMatchObject({ template: "{firstName}: {privateCode}" });
  });

  it("reveals an editable Template source only with model permission and write ACL", async () => {
    const organization = document();
    organization.employeeFieldDefinitions.push({
      hash: "none",
      id: templateFieldId,
      key: "privateSummary",
      kind: "template",
      name: "Private summary",
      template: "{firstName}: {privateCode}",
    });
    const service = new AuthorizedProjectionService(
      fakePool([policy("employeeField", templateFieldId, true, true)]),
    );
    const result = await service.build({
      account: account(),
      organization,
      role: role([
        { permission: "employee.read", scope: "all" },
        { permission: "employee.model.update", scope: "all" },
      ]),
    });
    expect(
      result.projection.employeeFieldDefinitions.find((field) => field.id === templateFieldId),
    ).toMatchObject({ template: "{firstName}: {privateCode}" });
  });
});

describe("write ACL enforcement", () => {
  it("requires Tag assignment permission when creating an Employee with Tags", () => {
    const current = document();
    const candidate = structuredClone(current);
    candidate.employees.push({ ...employee(uuid(3), "Casey"), customFieldValues: {} });
    const currentAccount = account();
    const createRole = role([{ permission: "employee.create", scope: "all" }]);
    const access = buildEffectiveAccess({
      directGrants: [],
      employeeId,
      organization: current,
      role: createRole,
    });
    expect(() =>
      authorizeOrganizationReplacement({
        access,
        account: currentAccount,
        candidate,
        current,
        policies: new Map(),
        role: createRole,
      }),
    ).toThrow(AuthorizationDeniedError);

    const allowedRole = role([
      { permission: "employee.create", scope: "all" },
      { permission: "tag.assign", scope: "all" },
    ]);
    expect(() =>
      authorizeOrganizationReplacement({
        access: buildEffectiveAccess({
          directGrants: [],
          employeeId,
          organization: current,
          role: allowedRole,
        }),
        account: currentAccount,
        candidate,
        current,
        policies: new Map(),
        role: allowedRole,
      }),
    ).not.toThrow();
  });

  it("keeps Tag creation and deletion independent from Tag order permission", () => {
    const current = document();
    const currentAccount = account();
    const created = structuredClone(current);
    created.tags.push({ color: null, id: uuid(32), label: "Created" });
    const createRole = role([{ permission: "tag.create", scope: "all" }]);
    expect(() =>
      authorizeOrganizationReplacement({
        access: buildEffectiveAccess({
          directGrants: [],
          employeeId,
          organization: current,
          role: createRole,
        }),
        account: currentAccount,
        candidate: created,
        current,
        policies: new Map(),
        role: createRole,
      }),
    ).not.toThrow();

    const sourceUnit = current.views[0]?.structure.units[0];
    if (!sourceUnit) throw new Error("unit missing");
    sourceUnit.staffingSlots = [
      { id: uuid(51), name: "Tagged slot", tags: [{ date: null, tagId }] },
    ];
    sourceUnit.liveFilter = {
      birthday: null,
      customFields: [],
      includeWithoutTags: false,
      includeWithoutUnits: false,
      query: "",
      selectedGenders: [],
      selectedPositions: [],
      selectedTags: [tagId],
      selectedUnitIds: [],
    };
    const deleted = structuredClone(current);
    deleted.tags = [];
    deleted.employees = deleted.employees.map((item) => ({ ...item, tags: [] }));
    const deletedUnit = deleted.views[0]?.structure.units[0];
    if (!deletedUnit) throw new Error("unit missing");
    deletedUnit.bossEmployeeId = null;
    deletedUnit.employeeIds = [];
    deletedUnit.employeePositions = [];
    deletedUnit.liveFilter = null;
    deletedUnit.staffingSlots = deletedUnit.staffingSlots.map((slot) => ({ ...slot, tags: [] }));
    const deleteRole = role([{ permission: "tag.delete", scope: "all" }]);
    expect(() =>
      authorizeOrganizationReplacement({
        access: buildEffectiveAccess({
          directGrants: [],
          employeeId,
          organization: current,
          role: deleteRole,
        }),
        account: currentAccount,
        candidate: deleted,
        current,
        policies: new Map(),
        role: deleteRole,
      }),
    ).not.toThrow();
  });

  it("allows model permission to remove a field and its stored values atomically", () => {
    const current = document();
    const candidate = structuredClone(current);
    candidate.employeeFieldDefinitions = [];
    candidate.employees = candidate.employees.map((item) => ({
      ...item,
      customFieldValues: {},
    }));
    const currentRole = role([{ permission: "employee.model.update", scope: "all" }]);
    expect(() =>
      authorizeOrganizationReplacement({
        access: buildEffectiveAccess({
          directGrants: [],
          employeeId,
          organization: current,
          role: currentRole,
        }),
        account: account(),
        candidate,
        current,
        policies: new Map([
          [`employeeField\0${fieldId}`, policy("employeeField", fieldId, true, true)],
        ]) as ResourcePolicyMap,
        role: currentRole,
      }),
    ).not.toThrow();
  });

  it("requires assignment permission for Employees embedded in a new Unit", () => {
    const current = document();
    const candidate = structuredClone(current);
    const source = current.views[0]?.structure.units[0];
    if (!source) throw new Error("unit missing");
    candidate.views[0]?.structure.units.push({
      ...structuredClone(source),
      bossEmployeeId: null,
      id: uuid(22),
      name: "New Unit",
      parentId: source.id,
    });
    const currentAccount = account();
    const createRole = role([{ permission: "unit.create", scope: "all" }]);
    expect(() =>
      authorizeOrganizationReplacement({
        access: buildEffectiveAccess({
          directGrants: [],
          employeeId,
          organization: current,
          role: createRole,
        }),
        account: currentAccount,
        candidate,
        current,
        policies: new Map(),
        role: createRole,
      }),
    ).toThrow(AuthorizationDeniedError);
  });

  it("preserves hidden collection order when a Manager patches a managed Unit", async () => {
    const current = document();
    const visibleTagId = uuid(32);
    current.tags.unshift({ color: null, id: visibleTagId, label: "Visible" });
    current.employees[0]?.tags.unshift({ date: null, tagId: visibleTagId });
    const currentRole = role([
      { permission: "employee.read", scope: "all" },
      { permission: "unit.read", scope: "all" },
      { permission: "editor.system.read", scope: "all" },
      { permission: "unit.update", scope: "managedSubtree" },
    ]);
    const currentAccount = account();
    const restrictiveTag = policy("tag", tagId, false, false, true);
    const pool = fakePool([restrictiveTag]);
    const result = await new AuthorizedProjectionService(pool).build({
      account: currentAccount,
      organization: current,
      role: currentRole,
    });
    const candidate = structuredClone(current);
    candidate.employeeFieldDefinitions = result.projection.employeeFieldDefinitions;
    candidate.employees = result.projection.employees.map((item) => ({
      ...employee(item.id, item.firstName ?? ""),
      customFieldValues: item.customFieldValues ?? {},
      tags: item.tags ?? [],
    }));
    candidate.tags = result.projection.tags;
    candidate.views = result.projection.views;
    const target = candidate.views[0]?.structure.units[0];
    if (!target) throw new Error("unit missing");
    target.name = "Managed Unit";
    const merged = mergeAuthorizedProjection({
      baseline: result.projection,
      candidate,
      current,
    });

    expect(merged.tags.map((tag) => tag.id)).toEqual(current.tags.map((tag) => tag.id));
    expect(merged.employees[0]?.tags).toEqual(current.employees[0]?.tags);
    expect(() =>
      authorizeOrganizationReplacement({
        access: buildEffectiveAccess({
          directGrants: [],
          employeeId,
          organization: current,
          role: currentRole,
        }),
        account: currentAccount,
        candidate: merged,
        current,
        policies: new Map([[`tag\0${tagId}`, restrictiveTag]]) as ResourcePolicyMap,
        role: currentRole,
      }),
    ).not.toThrow();
  });

  it("requires both a scoped permission and a writable field policy", () => {
    const current = document();
    const candidate = structuredClone(current);
    const target = candidate.employees.find((item) => item.id === employeeId);
    if (!target) throw new Error("employee missing");
    target.firstName = "Changed";
    const currentRole = role([{ permission: "employee.update", scope: "managedSubtree" }]);
    const currentAccount = account();
    const access = buildEffectiveAccess({
      directGrants: [],
      employeeId,
      organization: current,
      role: currentRole,
    });
    const denied = new Map([
      [
        `employeeField\0builtin:firstName`,
        policy("employeeField", "builtin:firstName", true, false),
      ],
    ]) as ResourcePolicyMap;
    expect(() =>
      authorizeOrganizationReplacement({
        access,
        account: currentAccount,
        candidate,
        current,
        policies: denied,
        role: currentRole,
      }),
    ).toThrow(AuthorizationDeniedError);

    const allowed = new Map([
      [
        `employeeField\0builtin:firstName`,
        policy("employeeField", "builtin:firstName", true, true),
      ],
    ]) as ResourcePolicyMap;
    expect(() =>
      authorizeOrganizationReplacement({
        access,
        account: currentAccount,
        candidate,
        current,
        policies: allowed,
        role: currentRole,
      }),
    ).not.toThrow();
  });
});
