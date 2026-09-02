import type { EditableEmployeeFields } from "@org-tools/types";
import { describe, expect, test } from "vitest";
import { createEmployeeId } from "@/lib/employee-id";
import {
  applyEmployeeImport,
  createSuggestedEmployeeImportMapping,
  deriveEmployeeImportPreview,
  parseEmployeeImportText,
} from "@/lib/employee-transfer";
import type { OrgEditorUnitConfiguration } from "@/stores/org-editor-store";
import { OrgStore } from "@/stores/org-store";

const fields = (email: string, firstName = "Alex"): EditableEmployeeFields => ({
  avatarBase64Url: null,
  birthday: null,
  email,
  firstName,
  gender: "unspecified",
  lastName: "Morgan",
  phone: null,
  profileUrl: null,
  tags: [],
  username: null,
});

const manualUnit = (name: string): OrgEditorUnitConfiguration => ({
  assignments: [],
  bossEmployeeId: null,
  membershipMode: "manual",
  name,
});

describe("Employee transfer", () => {
  test("maps arbitrary source paths and applies new Employees and Teams atomically", () => {
    const store = new OrgStore();
    const source = parseEmployeeImportText(
      "employees.json",
      JSON.stringify([
        {
          contact: { email: "sam@example.test" },
          person: { first: "Sam", last: "River" },
          teams: [
            {
              id: "00000000-0000-4000-8000-000000000010",
              isBoss: false,
              name: "Research",
              path: ["Product", "Research"],
              position: "Analyst",
            },
          ],
        },
      ]),
    );
    const mapping = createSuggestedEmployeeImportMapping(source.paths);
    mapping.firstName = "person.first";
    mapping.lastName = "person.last";
    mapping.email = "contact.email";
    mapping.teams = "teams";
    const preview = deriveEmployeeImportPreview(source, mapping, []);
    const next = applyEmployeeImport({
      bulkPolicy: "update",
      currentState: store.createOrgToolsState(),
      importTeams: true,
      overrides: new Map(),
      preview,
    });
    expect(next.organization.employees[0]?.id).toBe(
      createEmployeeId({ email: "sam@example.test", firstName: "Sam", lastName: "River" }),
    );
    expect(next.organization.structure.units.map((unit) => unit.name)).toEqual([
      "Product",
      "Research",
    ]);
    expect(next.organization.structure.units[1]?.employeePositions[0]?.position).toBe("Analyst");
  });

  test("supports update, skip, and Teams-only duplicate policies without replacing assignments", () => {
    const store = new OrgStore();
    const existingUnitId = store.createUnit(manualUnit("Existing"));
    const employeeId = store.createEmployee(fields("alex@example.test"), [
      { isBoss: false, position: "Developer", unitId: existingUnitId },
    ]);
    const rows = [
      {
        email: "alex@example.test",
        firstName: "Alex",
        lastName: "Morgan",
        teams: [
          {
            id: "00000000-0000-4000-8000-000000000010",
            isBoss: false,
            name: "Imported",
            path: ["Imported"],
            position: "Reviewer",
          },
        ],
        username: "changed",
      },
    ];
    const source = parseEmployeeImportText("employees.json", JSON.stringify(rows));
    const mapping = createSuggestedEmployeeImportMapping(source.paths);
    const preview = deriveEmployeeImportPreview(source, mapping, store.organizationEmployees);
    expect(preview.matchedCount).toBe(1);

    const updated = applyEmployeeImport({
      bulkPolicy: "update",
      currentState: store.createOrgToolsState(),
      importTeams: true,
      overrides: new Map(),
      preview,
    });
    expect(updated.organization.employees[0]?.username).toBe("changed");
    expect(updated.organization.structure.units).toHaveLength(2);
    expect(updated.organization.structure.units[0]?.employeeIds).toContain(employeeId);

    const teamsOnly = applyEmployeeImport({
      bulkPolicy: "teamsOnly",
      currentState: store.createOrgToolsState(),
      importTeams: true,
      overrides: new Map(),
      preview,
    });
    expect(teamsOnly.organization.employees[0]?.username).toBeNull();
    expect(teamsOnly.organization.structure.units).toHaveLength(2);
    expect(teamsOnly.organization.structure.units[0]?.employeeIds).toContain(employeeId);

    const skipped = applyEmployeeImport({
      bulkPolicy: "update",
      currentState: store.createOrgToolsState(),
      importTeams: true,
      overrides: new Map([[employeeId, "skip"]]),
      preview,
    });
    expect(skipped.organization.employees[0]?.username).toBeNull();
    expect(skipped.organization.structure.units).toHaveLength(1);
    expect(skipped.organization.structure.units[0]?.employeeIds).toContain(employeeId);
  });

  test("rejects duplicate imported identities and leaves current state untouched", () => {
    const store = new OrgStore();
    const before = store.createOrgToolsState();
    const source = parseEmployeeImportText(
      "employees.json",
      JSON.stringify([
        { email: "same@example.test", firstName: "ALICE", lastName: "Stone" },
        { email: " SAME@example.test ", firstName: "Ａlice", lastName: "Stone" },
      ]),
    );
    const mapping = createSuggestedEmployeeImportMapping(source.paths);
    expect(() => deriveEmployeeImportPreview(source, mapping, [])).toThrow("duplicate identities");
    expect(store.createOrgToolsState()).toEqual(before);
  });

  test("derives 20,000 rows once with sparse override state", () => {
    const rows = Array.from({ length: 20_000 }, (_, index) => ({
      email: `employee-${index}@example.test`,
      firstName: "Employee",
      lastName: String(index),
    }));
    const source = parseEmployeeImportText("large.json", JSON.stringify(rows));
    const mapping = createSuggestedEmployeeImportMapping(source.paths);
    const preview = deriveEmployeeImportPreview(source, mapping, []);
    expect(preview.rows).toHaveLength(20_000);
    expect(preview.newCount).toBe(20_000);
  });
});
