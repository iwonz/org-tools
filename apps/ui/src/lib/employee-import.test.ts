import { describe, expect, it } from "vitest";

import {
  createEmployeeImportAutoMapping,
  createEmptyEmployeeImportMapping,
  type EmployeeFieldMapping,
  normalizeEmployeeImportRows,
  parseEmployeeImportText,
  parseJsonEmployeeImport,
  planEmployeeImport,
} from "@/lib/employee-import";
import { createBlankOrgToolsState } from "@/lib/org-file";

const getFirstCollection = (value: unknown) => {
  const collection = parseJsonEmployeeImport(value).collections[0];
  if (!collection) throw new Error("Expected an import collection in this test.");
  return collection;
};

const withMapping = (
  mapping: Partial<Record<keyof EmployeeFieldMapping, string>>,
): EmployeeFieldMapping => ({ ...createEmptyEmployeeImportMapping(), ...mapping });

describe("JSON Employee import", () => {
  it("accepts a root array and exposes nested scalar leaves as dot paths", () => {
    const document = parseJsonEmployeeImport([
      {
        contact: { email: "ada@example.test", phone: "+1 555-0101" },
        name: { first: "Ada", last: "Lovelace" },
        tags: ["Engineering", "Research"],
      },
    ]);

    expect(document.collections[0]?.id).toBe("$");
    expect(document.collections[0]?.sourceFields).toEqual([
      "contact.email",
      "contact.phone",
      "name.first",
      "name.last",
      "tags",
    ]);
  });

  it("discovers selectable nested collections and aggregates arrays below parent rows", () => {
    const document = parseJsonEmployeeImport({
      metadata: { generated: true },
      teams: [
        { employees: [{ first_name: "Ada" }], name: "Research" },
        { employees: [{ first_name: "Grace" }], name: "Platform" },
      ],
    });

    expect(document.collections.map(({ id }) => id)).toEqual([
      "$.teams",
      "$.teams[].employees",
      "$",
    ]);
    expect(document.collections[1]?.rows.map(({ values }) => values.first_name)).toEqual([
      "Ada",
      "Grace",
    ]);
  });

  it("accepts a single object row", () => {
    const document = parseJsonEmployeeImport({ email: "single@example.test", firstName: "Single" });
    expect(document.collections).toHaveLength(1);
    expect(document.collections[0]?.rows[0]?.values.email).toBe("single@example.test");
  });

  it("separates full-state candidates and rejects foreign state-like JSON", () => {
    const state = createBlankOrgToolsState();
    expect(parseEmployeeImportText(JSON.stringify(state))).toEqual({
      kind: "state",
      state,
    });
    expect(() =>
      parseEmployeeImportText(
        JSON.stringify({ employees: [], kind: "org-structure-ui-state", views: [] }),
      ),
    ).toThrow(/Unsupported workspace state/);
    expect(() =>
      parseEmployeeImportText(
        JSON.stringify({ employees: [], kind: "org-tools-state", views: [] }),
      ),
    ).toThrow(/top-level structure/);
  });

  it("rejects malformed JSON without interpreting it as CSV", () => {
    expect(() => parseEmployeeImportText("firstName,email\nAda,ada@example.test")).toThrow(
      /JSON could not be parsed/,
    );
  });
});

describe("Employee mapping and normalization", () => {
  it("auto-maps common aliases, including nested leaf fields", () => {
    expect(
      createEmployeeImportAutoMapping([
        "person.first_name",
        "person.surname",
        "mail_address",
        "user_login",
        "labels",
      ]),
    ).toMatchObject({
      email: "mail_address",
      firstName: "person.first_name",
      lastName: "person.surname",
      tags: "labels",
      username: "user_login",
    });
  });

  it("normalizes tags from arrays and delimited strings and converts ISO birthdays", () => {
    const collection = getFirstCollection([
      {
        birthday: "1815-12-10",
        name: "Ada",
        tags: [" Research ", "research", "Engineering"],
      },
      { birthday: "12-09", name: "Grace", tags: "Platform | Leadership | platform" },
    ]);
    const mapping = withMapping({ birthday: "birthday", firstName: "name", tags: "tags" });

    const arrayRows = normalizeEmployeeImportRows(collection, mapping, "|");
    expect(arrayRows[0]?.draft).toMatchObject({
      birthday: "12-10",
      tags: [
        { date: null, label: "Research" },
        { date: null, label: "Engineering" },
      ],
    });
    expect(arrayRows[1]?.draft).toMatchObject({
      birthday: "12-09",
      tags: [
        { date: null, label: "Platform" },
        { date: null, label: "Leadership" },
      ],
    });
  });

  it("rejects invalid profile, avatar, birthday, and missing identity values", () => {
    const collection = getFirstCollection([
      {
        avatar: "data:image/svg+xml;base64,PHN2Zz4=",
        birthday: "02-30",
        internalId: "42",
        profile: "javascript:alert(1)",
      },
    ]);
    const rows = normalizeEmployeeImportRows(
      collection,
      withMapping({
        avatarBase64Url: "avatar",
        birthday: "birthday",
        phone: "internalId",
        profileUrl: "profile",
      }),
    );

    expect(rows[0]?.status).toBe("invalid");
    expect(rows[0]?.errors).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/Profile URL/),
        expect.stringMatching(/Avatar/),
        expect.stringMatching(/Birthday/),
        expect.stringMatching(/name, username, or email/),
      ]),
    );
  });
});

describe("atomic Employee import planning", () => {
  const createRows = (records: Array<Record<string, unknown>>) => {
    const collection = getFirstCollection(records);
    const mapping = withMapping({
      email: "email",
      firstName: "firstName",
      username: "username",
    });
    return { mapping, rows: normalizeEmployeeImportRows(collection, mapping) };
  };

  it("skips an unambiguous username match before considering email fallback", () => {
    const { mapping, rows } = createRows([
      { email: "ada+new@example.test", firstName: "Imported", username: "ADA" },
      { email: "new@example.test", firstName: "New", username: "new-user" },
    ]);
    const plan = planEmployeeImport(
      rows,
      [{ email: "ada@example.test", id: "employee-a", username: "ada" }],
      mapping,
    );

    expect(plan.canCommit).toBe(true);
    expect(plan.duplicateRowCount).toBe(1);
    expect(plan.newEmployeeCount).toBe(1);
    expect(plan.drafts.map(({ username }) => username)).toEqual(["new-user"]);
  });

  it("blocks when username and email point to different existing Employees", () => {
    const { mapping, rows } = createRows([
      { email: "grace@example.test", firstName: "Conflict", username: "ada" },
    ]);
    const plan = planEmployeeImport(
      rows,
      [
        { email: "ada@example.test", id: "employee-a", username: "ada" },
        { email: "grace@example.test", id: "employee-b", username: "grace" },
      ],
      mapping,
    );

    expect(plan.canCommit).toBe(false);
    expect(plan.conflictRowCount).toBe(1);
    expect(plan.drafts).toEqual([]);
    expect(plan.rows[0]?.errors).toContain(
      "Username and email identify different existing Employees.",
    );
  });

  it("blocks an identity that is already ambiguous in the workspace", () => {
    const { mapping, rows } = createRows([
      { email: "new@example.test", firstName: "Conflict", username: "duplicate" },
    ]);
    const plan = planEmployeeImport(
      rows,
      [
        { email: "one@example.test", id: "employee-a", username: "duplicate" },
        { email: "two@example.test", id: "employee-b", username: "DUPLICATE" },
      ],
      mapping,
    );

    expect(plan.canCommit).toBe(false);
    expect(plan.rows[0]?.errors).toContain("Username matches multiple existing Employees.");
    expect(plan.drafts).toEqual([]);
  });

  it("blocks duplicate identities within the incoming file", () => {
    const { mapping, rows } = createRows([
      { email: "one@example.test", firstName: "First", username: "same" },
      { email: "two@example.test", firstName: "Second", username: "SAME" },
    ]);
    const plan = planEmployeeImport(rows, [], mapping);

    expect(plan.canCommit).toBe(false);
    expect(plan.conflictRowCount).toBe(2);
    expect(plan.drafts).toEqual([]);
  });

  it("keeps every draft out of the commit payload when one non-empty row is invalid", () => {
    const mapping = withMapping({
      email: "email",
      firstName: "firstName",
      phone: "phone",
      username: "username",
    });
    const invalidRows = normalizeEmployeeImportRows(
      {
        id: "$",
        label: "Rows",
        rows: [
          {
            rowNumber: 1,
            values: {
              email: "valid@example.test",
              firstName: "Valid",
              phone: "",
              username: "valid",
            },
          },
          {
            rowNumber: 2,
            values: { email: "", firstName: "", phone: "555-0102", username: "" },
          },
        ],
        sourceFields: ["email", "firstName", "phone", "username"],
      },
      mapping,
    );
    const plan = planEmployeeImport(invalidRows, [], mapping);

    expect(plan.invalidRowCount).toBe(1);
    expect(plan.newEmployeeCount).toBe(1);
    expect(plan.canCommit).toBe(false);
    expect(plan.drafts).toEqual([]);
  });
});
