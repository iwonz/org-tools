import { describe, expect, it } from "vitest";

import { parseAdminCommand } from "@/server/admin-service";

const accountId = "00000000-0000-4000-8000-000000000010";
const roleId = "00000000-0000-4000-8000-000000000020";

describe("administration command parser", () => {
  it("accepts an exact scoped role update", () => {
    expect(
      parseAdminCommand({
        grants: [{ permission: "employee.update", scope: "managedSubtree" }],
        name: "Branch editor",
        roleId,
        type: "role.update",
      }),
    ).toEqual({
      grants: [{ permission: "employee.update", scope: "managedSubtree" }],
      name: "Branch editor",
      roleId,
      type: "role.update",
    });
  });

  it("rejects unknown keys, malformed identifiers, and invalid scopes", () => {
    for (const value of [
      { accountId, active: true, type: "user.active.update", unexpected: true },
      { accountId: "not-an-id", active: true, type: "user.active.update" },
      {
        grants: [{ permission: "backup.create", scope: "managedSubtree" }],
        name: "Unsafe",
        type: "role.create",
      },
      {
        grants: [{ permission: "editorImageExport.exportAs", scope: "all" }],
        name: "Impersonator",
        type: "role.create",
      },
      { type: "unknown.command" },
    ]) {
      expect(() => parseAdminCommand(value)).toThrow(SyntaxError);
    }
  });

  it("validates exact policy audiences", () => {
    const audience = {
      allAuthenticated: false,
      relations: ["managedSubtree"],
      roleIds: [roleId],
      userIds: [accountId],
    };
    expect(
      parseAdminCommand({
        hideEmployeesWhenUnread: true,
        read: audience,
        resourceId: "tag-id",
        resourceKind: "tag",
        type: "policy.update",
        write: audience,
      }),
    ).toMatchObject({ resourceKind: "tag", type: "policy.update" });
    expect(() =>
      parseAdminCommand({
        hideEmployeesWhenUnread: false,
        read: { ...audience, leaked: true },
        resourceId: "tag-id",
        resourceKind: "tag",
        type: "policy.update",
        write: audience,
      }),
    ).toThrow();
  });
});
