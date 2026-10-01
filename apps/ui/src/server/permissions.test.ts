import type { OrganizationDocument, Role } from "@org-tools/types";
import { describe, expect, it } from "vitest";

import { createBlankOrgToolsState } from "@/lib/org-file";
import {
  allowedPermissionScopes,
  buildEffectiveAccess,
  hasPermission,
  MANAGER_ROLE_ID,
} from "@/server/permissions";

const managerRole: Role = {
  grants: [{ permission: "employee.update", scope: "managedSubtree" }],
  id: MANAGER_ROLE_ID,
  name: "Manager",
  systemKey: "manager",
};

describe("permission evaluation", () => {
  it("restricts global permission scopes", () => {
    expect(allowedPermissionScopes("backup.restore")).toEqual(["all"]);
    expect(allowedPermissionScopes("calendar.read")).toEqual(["all"]);
    expect(allowedPermissionScopes("dataDownload.create")).toEqual(["all"]);
    expect(allowedPermissionScopes("editorImageExport.create")).toEqual(["all"]);
    expect(allowedPermissionScopes("view.read")).toEqual(["all"]);
    expect(allowedPermissionScopes("unit.update")).toEqual([
      "managedDirect",
      "managedSubtree",
      "all",
    ]);
  });

  it("derives Manager scope only from system View leadership", () => {
    const state = createBlankOrgToolsState();
    const rootId = "10000000-0000-4000-8000-000000000001";
    const childId = "10000000-0000-4000-8000-000000000002";
    const employeeId = "20000000-0000-4000-8000-000000000001";
    const systemView = state.organization.views[0];
    if (!systemView) throw new Error("Missing system View.");
    systemView.structure.units = [
      {
        bossEmployeeId: employeeId,
        collapsed: false,
        createdAt: new Date(0).toISOString(),
        employeeIds: [],
        employeePositions: [],
        id: rootId,
        liveFilter: null,
        name: "Root",
        noteMarkdown: "",
        order: 0,
        parentId: null,
        staffingSlots: [],
        updatedAt: new Date(0).toISOString(),
        x: 0,
        y: 0,
      },
      {
        bossEmployeeId: null,
        collapsed: false,
        createdAt: new Date(0).toISOString(),
        employeeIds: [],
        employeePositions: [],
        id: childId,
        liveFilter: null,
        name: "Child",
        noteMarkdown: "",
        order: 1,
        parentId: rootId,
        staffingSlots: [],
        updatedAt: new Date(0).toISOString(),
        x: 0,
        y: 0,
      },
    ];
    const access = buildEffectiveAccess({
      directGrants: [],
      employeeId,
      organization: state.organization as OrganizationDocument,
      role: managerRole,
    });
    expect(access.managedDirectUnitIds).toEqual([rootId]);
    expect(access.managedSubtreeUnitIds).toEqual([rootId, childId]);
    expect(hasPermission(access, "employee.update", { unitId: childId })).toBe(true);
  });

  it("does not elevate a Manager without a managed Unit", () => {
    const state = createBlankOrgToolsState();
    const access = buildEffectiveAccess({
      directGrants: [],
      employeeId: "20000000-0000-4000-8000-000000000001",
      organization: state.organization,
      role: managerRole,
    });
    expect(hasPermission(access, "employee.update", { unitId: "missing" })).toBe(false);
  });
});
