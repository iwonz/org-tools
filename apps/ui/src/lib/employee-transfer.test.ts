import type { EditableEmployeeFields } from "@org-tools/types";
import { describe, expect, test } from "vitest";
import {
  applyEmployeeImport,
  createSuggestedEmployeeImportMapping,
  deriveEmployeeImportPreview,
  employeeImportBuiltinTarget,
  employeeImportPendingTarget,
  getEmployeeImportSourcePath,
  parseEmployeeImportText,
  setEmployeeImportSourceTarget,
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
const uuid = (value: number) => `00000000-0000-4000-8000-${String(value).padStart(12, "0")}`;

const manualUnit = (name: string): OrgEditorUnitConfiguration => ({
  assignments: [],
  bossEmployeeId: null,
  membershipMode: "manual",
  name,
});

describe("Employee transfer", () => {
  test("keeps one target per source path and transfers an occupied target", () => {
    const paths = ["person.given", "person.preferred"];
    let mapping = createSuggestedEmployeeImportMapping(paths);
    const target = employeeImportBuiltinTarget("firstName");
    mapping = setEmployeeImportSourceTarget(mapping, paths[0] as string, target);
    mapping = setEmployeeImportSourceTarget(mapping, paths[1] as string, target);

    expect(mapping.sourceTargets[paths[0] as string]).toBeNull();
    expect(mapping.sourceTargets[paths[1] as string]).toBe(target);
    expect(getEmployeeImportSourcePath(mapping, target)).toBe(paths[1]);
  });

  test("chooses the first richest representative row while collecting all paths", () => {
    const source = parseEmployeeImportText(
      "employees.json",
      JSON.stringify([
        { firstName: "First" },
        { contact: { email: "rich@example.test", phone: "555-0101" }, firstName: "Rich" },
        { contact: { email: "later@example.test", phone: "555-0102" }, firstName: "Later" },
        { lastName: "Last-only" },
      ]),
    );

    expect(source.representativeRowIndex).toBe(1);
    expect(JSON.parse(source.representativeJson)).toEqual({
      contact: { email: "rich@example.test", phone: "555-0101" },
      firstName: "Rich",
    });
    expect(source.paths).toEqual(["contact.email", "contact.phone", "firstName", "lastName"]);
    expect(source.representativeTruncated).toBe(false);
  });

  test("bounds a large representative preview without dropping source rows", () => {
    const source = parseEmployeeImportText(
      "employees.json",
      JSON.stringify([
        { email: "large@example.test", firstName: "Large", note: "x".repeat(140_000) },
      ]),
    );

    expect(new TextEncoder().encode(source.representativeJson).byteLength).toBeLessThanOrEqual(
      128 * 1024,
    );
    expect(source.representativeTruncated).toBe(true);
    expect(source.rows).toHaveLength(1);
  });

  test("maps arbitrary source paths and applies new Employees and Teams atomically", () => {
    const store = new OrgStore();
    const source = parseEmployeeImportText(
      "employees.json",
      JSON.stringify([
        {
          contact: { email: "sam@example.test" },
          id: uuid(1),
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
    let mapping = createSuggestedEmployeeImportMapping(source.paths);
    mapping = setEmployeeImportSourceTarget(
      mapping,
      "person.first",
      employeeImportBuiltinTarget("firstName"),
    );
    mapping = setEmployeeImportSourceTarget(
      mapping,
      "person.last",
      employeeImportBuiltinTarget("lastName"),
    );
    mapping = setEmployeeImportSourceTarget(
      mapping,
      "contact.email",
      employeeImportBuiltinTarget("email"),
    );
    mapping = setEmployeeImportSourceTarget(mapping, "teams", employeeImportBuiltinTarget("teams"));
    const preview = deriveEmployeeImportPreview(source, mapping, []);
    const next = applyEmployeeImport({
      bulkPolicy: "update",
      currentState: store.createOrgToolsState(),
      overrides: new Map(),
      preview,
    });
    expect(next.organization.employees[0]?.id).toBe(uuid(1));
    const nextUnits = next.organization.views.find((view) => view.kind === "system")?.structure
      .units;
    expect(nextUnits?.map((unit) => unit.name)).toEqual(["Product", "Research"]);
    expect(nextUnits?.[1]?.employeePositions[0]?.position).toBe("Analyst");
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
        id: employeeId,
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
      overrides: new Map(),
      preview,
    });
    expect(updated.organization.employees[0]?.username).toBe("changed");
    const updatedUnits = updated.organization.views.find((view) => view.kind === "system")
      ?.structure.units;
    expect(updatedUnits).toHaveLength(2);
    expect(updatedUnits?.[0]?.employeeIds).toContain(employeeId);

    const teamsOnly = applyEmployeeImport({
      bulkPolicy: "teamsOnly",
      currentState: store.createOrgToolsState(),
      overrides: new Map(),
      preview,
    });
    expect(teamsOnly.organization.employees[0]?.username).toBeNull();
    const teamsOnlyUnits = teamsOnly.organization.views.find((view) => view.kind === "system")
      ?.structure.units;
    expect(teamsOnlyUnits).toHaveLength(2);
    expect(teamsOnlyUnits?.[0]?.employeeIds).toContain(employeeId);

    const skipped = applyEmployeeImport({
      bulkPolicy: "update",
      currentState: store.createOrgToolsState(),
      overrides: new Map([[employeeId, "skip"]]),
      preview,
    });
    expect(skipped.organization.employees[0]?.username).toBeNull();
    const skippedUnits = skipped.organization.views.find((view) => view.kind === "system")
      ?.structure.units;
    expect(skippedUnits).toHaveLength(1);
    expect(skippedUnits?.[0]?.employeeIds).toContain(employeeId);
  });

  test("rejects duplicate imported identities and leaves current state untouched", () => {
    const store = new OrgStore();
    const before = store.createOrgToolsState();
    const source = parseEmployeeImportText(
      "employees.json",
      JSON.stringify([
        { email: "same@example.test", firstName: "ALICE", id: uuid(2), lastName: "Stone" },
        { email: " SAME@example.test ", firstName: "Ａlice", id: uuid(3), lastName: "Stone" },
      ]),
    );
    const mapping = createSuggestedEmployeeImportMapping(source.paths);
    expect(() => deriveEmployeeImportPreview(source, mapping, [])).toThrow("duplicate identities");
    expect(store.createOrgToolsState()).toEqual(before);
  });

  test("blocks UUID collisions with another identity", () => {
    const store = new OrgStore();
    const employeeId = store.createEmployee(fields("first@example.test"), []);
    const source = parseEmployeeImportText(
      "employees.json",
      JSON.stringify([
        {
          email: "second@example.test",
          firstName: "Second",
          id: employeeId,
          lastName: "Person",
        },
      ]),
    );
    expect(() =>
      deriveEmployeeImportPreview(
        source,
        createSuggestedEmployeeImportMapping(source.paths),
        store.organizationEmployees,
      ),
    ).toThrow("Employee import UUID conflicts with another identity");
  });

  test("creates and updates mapped Value fields atomically", () => {
    const store = new OrgStore();
    const employeeId = store.createEmployee(fields("alex@example.test"), []);
    const source = parseEmployeeImportText(
      "employees.json",
      JSON.stringify([
        {
          department: "Platform",
          email: "alex@example.test",
          firstName: "Alex",
          id: employeeId,
          lastName: "Morgan",
        },
      ]),
    );
    const mapping = createSuggestedEmployeeImportMapping(source.paths);
    const fieldId = uuid(501);
    mapping.newValueFields = [
      {
        definition: {
          id: fieldId,
          key: "department",
          kind: "value",
          name: "Department",
          options: [],
          required: false,
          valueType: "text",
        },
        path: "department",
      },
    ];
    mapping.sourceTargets.department = employeeImportPendingTarget(fieldId);
    const preview = deriveEmployeeImportPreview(source, mapping, store.organizationEmployees);
    const next = applyEmployeeImport({
      bulkPolicy: "update",
      currentState: store.createOrgToolsState(),
      overrides: new Map(),
      preview,
    });
    expect(next.organization.employeeFieldDefinitions).toHaveLength(1);
    expect(next.organization.employees[0]?.customFieldValues[fieldId]).toBe("Platform");
  });

  test("imports only complete current birthday values with unknown-year semantics", () => {
    const source = parseEmployeeImportText(
      "employees.json",
      JSON.stringify([
        {
          birthday: "29.02.1900",
          email: "leap@example.test",
          firstName: "Leap",
          id: uuid(4),
          lastName: "Example",
        },
      ]),
    );
    const mapping = createSuggestedEmployeeImportMapping(source.paths);
    const preview = deriveEmployeeImportPreview(source, mapping, []);
    expect(preview.rows[0]?.fields.birthday).toBe("29.02.1900");

    const obsoleteSource = parseEmployeeImportText(
      "employees.json",
      JSON.stringify([
        {
          birthday: "02-29",
          email: "legacy@example.test",
          firstName: "Legacy",
          id: uuid(5),
          lastName: "Example",
        },
      ]),
    );
    const obsoleteMapping = createSuggestedEmployeeImportMapping(obsoleteSource.paths);
    expect(() => deriveEmployeeImportPreview(obsoleteSource, obsoleteMapping, [])).toThrow(
      "Birthday must use the DD.MM.YYYY format.",
    );
  });

  test("derives 20,000 rows once with sparse override state", () => {
    const rows = Array.from({ length: 20_000 }, (_, index) => ({
      email: `employee-${index}@example.test`,
      firstName: "Employee",
      id: uuid(index + 10),
      lastName: String(index),
    }));
    const source = parseEmployeeImportText("large.json", JSON.stringify(rows));
    const mapping = createSuggestedEmployeeImportMapping(source.paths);
    const preview = deriveEmployeeImportPreview(source, mapping, []);
    expect(preview.rows).toHaveLength(20_000);
    expect(preview.newCount).toBe(20_000);
  });
});
