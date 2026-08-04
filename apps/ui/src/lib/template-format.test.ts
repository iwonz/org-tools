import type { Employee } from "@org-tools/types";
import { describe, expect, test } from "vitest";

import { createExportText, type ExportRow } from "@/lib/export-format";
import {
  renderTemplateFormat,
  type TemplateFieldValue,
  templateReferencesField,
} from "@/lib/template-format";
import {
  createDefaultExportFieldNames,
  type ExportEmployeeFieldKey,
  type ExportFieldNameMap,
} from "@/stores/export-session-store";

const render = (template: string, values: Record<string, unknown>) =>
  renderTemplateFormat({
    resolveField: (fieldName): TemplateFieldValue =>
      Object.hasOwn(values, fieldName)
        ? { known: true, value: values[fieldName] }
        : { known: false },
    template,
  });

describe("renderTemplateFormat", () => {
  test("renders field placeholders and preserves unknown fields", () => {
    expect(
      render("{fullName} <{email}> {unknown}", { email: null, fullName: "Ada Lovelace" }),
    ).toBe("Ada Lovelace <> {unknown}");
  });

  test("uses ternary then branch when field is truthy", () => {
    expect(
      render("{fullName} {isBoss ? '· {isBoss}' : ''}", {
        fullName: "Ada Lovelace",
        isBoss: "Unit Lead",
      }),
    ).toBe("Ada Lovelace · Unit Lead");
  });

  test("uses ternary else branch for false, empty, null, undefined and empty arrays", () => {
    expect(render("{isBoss ? 'yes' : 'no'}", { isBoss: false })).toBe("no");
    expect(render("{isBoss ? 'yes' : 'no'}", { isBoss: "" })).toBe("no");
    expect(render("{isBoss ? 'yes' : 'no'}", { isBoss: "   " })).toBe("no");
    expect(render("{isBoss ? 'yes' : 'no'}", { isBoss: null })).toBe("no");
    expect(render("{isBoss ? 'yes' : 'no'}", { isBoss: undefined })).toBe("no");
    expect(render("{isBoss ? 'yes' : 'no'}", { isBoss: [] })).toBe("no");
  });

  test("renders nested placeholders inside both quoted branches", () => {
    expect(
      render("{username ? '@{username}' : '{fullName}'}", {
        fullName: "Ada Lovelace",
        username: "",
      }),
    ).toBe("Ada Lovelace");
    expect(
      render("{username ? '@{username}' : '{fullName}'}", {
        fullName: "Ada Lovelace",
        username: "ada",
      }),
    ).toBe("@ada");
  });

  test("supports double quotes and escaped quotes in branches", () => {
    expect(render('{username ? "Profile \\"{username}\\"" : "None"}', { username: "ada" })).toBe(
      'Profile "ada"',
    );
  });

  test("preserves malformed expressions instead of throwing", () => {
    expect(render("{fullName ? missing quotes : ''}", { fullName: "Ada" })).toBe(
      "{fullName ? missing quotes : ''}",
    );
    expect(render("{fullName ? 'broken' }", { fullName: "Ada" })).toBe("{fullName ? 'broken' }");
  });
});

describe("createExportText template mode", () => {
  test("renders Employee placeholders and ternary syntax", () => {
    const employee = {
      avatarBase64Url: null,
      birthday: null,
      email: "ada@example.test",
      firstName: "Ada",
      fullName: "Ada Lovelace",
      id: "00000000-0000-4000-8000-000000000001",
      lastName: "Lovelace",
      phone: "",
      profileUrl: "https://example.test/profiles/ada",
      scope: "workspace",
      tags: [],
      unitIds: [],
      unitPositions: [],
      username: "ada",
    } satisfies Employee;
    const rows: ExportRow[] = [{ context: "employeeFallback", employee, unitContext: null }];

    expect(
      createExportText({
        fieldNames: {} as ExportFieldNameMap,
        rows,
        selectedEmployeeFieldKeys: [],
        selectedFlatUnitFieldKeys: [],
        selectedJsonUnitFieldKeys: [],
        tabMode: "template",
        templateFormat: "{fullName} <{email}> {username ? '@{username}' : ''}\n",
        unitFullPathSeparator: " · ",
      }),
    ).toBe("Ada Lovelace <ada@example.test> @ada\n");
  });

  test("exports tags as an array in JSON and semicolon text in flat formats", () => {
    const employee = {
      avatarBase64Url: null,
      birthday: null,
      email: null,
      firstName: "Ada",
      fullName: "Ada Lovelace",
      id: "00000000-0000-4000-8000-000000000001",
      lastName: "Lovelace",
      phone: null,
      profileUrl: null,
      scope: "workspace",
      tags: [
        { date: null, label: "Mentor" },
        { date: "2026-09-01", label: "Backend" },
      ],
      unitIds: [],
      unitPositions: [],
      username: null,
    } satisfies Employee;
    const rows: ExportRow[] = [{ context: "employeeFallback", employee, unitContext: null }];
    const fieldNames = createDefaultExportFieldNames();
    const baseOptions = {
      fieldNames,
      rows,
      selectedEmployeeFieldKeys: ["tags", "tagDates"] as ExportEmployeeFieldKey[],
      selectedFlatUnitFieldKeys: [],
      selectedJsonUnitFieldKeys: [],
      templateFormat: "{tags}|{tagDates}",
      unitFullPathSeparator: " · ",
    };
    const json = createExportText({ ...baseOptions, tabMode: "json" });
    const csv = createExportText({ ...baseOptions, tabMode: "csv" });
    const template = createExportText({ ...baseOptions, tabMode: "template" });

    expect(JSON.parse(json)[0].tags).toEqual(["Mentor", "Backend"]);
    expect(JSON.parse(json)[0].tagDates).toEqual([{ date: "2026-09-01", tag: "Backend" }]);
    expect(csv).toContain("Mentor; Backend");
    expect(csv).toContain("Backend=2026-09-01");
    expect(template).toBe("Mentor; Backend|Backend=2026-09-01");
  });
});

describe("templateReferencesField", () => {
  test("detects simple and ternary references including nested branches", () => {
    expect(templateReferencesField("{isBoss}", "isBoss")).toBe(true);
    expect(templateReferencesField("{isBoss ? '· {isBoss}' : ''}", "isBoss")).toBe(true);
    expect(templateReferencesField("{fullName ? '{isBoss}' : ''}", "isBoss")).toBe(true);
    expect(templateReferencesField("{fullName}", "isBoss")).toBe(false);
  });
});
