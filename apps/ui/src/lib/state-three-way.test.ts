import type { EditableEmployeeFields } from "@org-tools/types";
import { describe, expect, it } from "vitest";

import { createBlankOrgToolsState } from "@/lib/org-file";
import { mergeOrgToolsStates } from "@/lib/state-three-way";
import { previewDomainOperations } from "@/server/mcp-domain";

const uuid = (value: number) => `00000000-0000-4000-8000-${String(value).padStart(12, "0")}`;
const fields = (firstName: string): EditableEmployeeFields => ({
  avatarBase64Url: null,
  birthday: null,
  email: `${firstName.toLowerCase()}@example.test`,
  firstName,
  gender: "unspecified",
  lastName: "Morgan",
  phone: null,
  profileUrl: null,
  tags: [],
  username: firstName.toLowerCase(),
});

describe("three-way state merge", () => {
  it("merges independent fields on the same stable Employee ID", () => {
    const blank = createBlankOrgToolsState();
    const base = previewDomainOperations(
      blank,
      [{ employee: fields("Alex"), type: "employee.create" }],
      { idFactory: () => uuid(1), now: () => "2026-08-31T00:00:00.000Z" },
    ).state;
    const local = structuredClone(base);
    const remote = structuredClone(base);
    if (!local.organization.employees[0] || !remote.organization.employees[0]) {
      throw new Error("Missing test Employee.");
    }
    local.organization.employees[0].firstName = "Avery";
    remote.organization.employees[0].lastName = "Taylor";

    const merged = mergeOrgToolsStates(base, local, remote);
    expect(merged.conflicts).toEqual([]);
    expect(merged.useRemote.organization.employees[0]).toMatchObject({
      firstName: "Avery",
      lastName: "Taylor",
    });
  });

  it("reports overlap and provides deterministic local and MCP choices", () => {
    const blank = createBlankOrgToolsState();
    const base = previewDomainOperations(
      blank,
      [{ employee: fields("Alex"), type: "employee.create" }],
      { idFactory: () => uuid(1), now: () => "2026-08-31T00:00:00.000Z" },
    ).state;
    const local = structuredClone(base);
    const remote = structuredClone(base);
    if (!local.organization.employees[0] || !remote.organization.employees[0]) {
      throw new Error("Missing test Employee.");
    }
    local.organization.employees[0].firstName = "Avery";
    remote.organization.employees[0].firstName = "Jordan";

    const merged = mergeOrgToolsStates(base, local, remote);
    expect(merged.conflicts).toEqual([{ path: `organization/employees/id:${uuid(1)}/firstName` }]);
    expect(merged.keepLocal.organization.employees[0]?.firstName).toBe("Avery");
    expect(merged.useRemote.organization.employees[0]?.firstName).toBe("Jordan");
  });

  it("merges independent entity creation by stable ID", () => {
    const base = createBlankOrgToolsState();
    const local = previewDomainOperations(
      base,
      [{ employee: fields("Alex"), type: "employee.create" }],
      { idFactory: () => uuid(1) },
    ).state;
    const remote = previewDomainOperations(
      base,
      [{ employee: fields("Blair"), type: "employee.create" }],
      { idFactory: () => uuid(2) },
    ).state;

    const merged = mergeOrgToolsStates(base, local, remote);
    expect(merged.conflicts).toEqual([]);
    expect(merged.useRemote.organization.employees.map((employee) => employee.id)).toEqual([
      uuid(2),
      uuid(1),
    ]);
  });
});
