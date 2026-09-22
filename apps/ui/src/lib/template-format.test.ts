import type { Employee } from "@org-tools/types";
import { describe, expect, test } from "vitest";

import {
  countTemplateOutputLines,
  createExportPreview,
  createExportText,
  type ExportRow,
  filterTemplateEmptyLines,
} from "@/lib/export-format";
import {
  renderTemplateFormat,
  renderTemplateFormatParts,
  type TemplateFieldValue,
  templateReferencesField,
} from "@/lib/template-format";
import {
  createDefaultExportJsonFieldNames,
  defaultExportJsonTopLevelFieldOrder,
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

  test("retains field identity for interactive formatted text", () => {
    const values = { email: "ada@example.test", fullName: "Ada Lovelace", isBoss: "Manager" };
    expect(
      renderTemplateFormatParts({
        resolveField: (fieldName): TemplateFieldValue =>
          Object.hasOwn(values, fieldName)
            ? { known: true, value: values[fieldName as keyof typeof values] }
            : { known: false },
        template: "{fullName} · {email} {isBoss ? '· {isBoss}' : ''}",
      }),
    ).toEqual([
      { fieldName: "fullName", text: "Ada Lovelace" },
      { fieldName: null, text: " · " },
      { fieldName: "email", text: "ada@example.test" },
      { fieldName: null, text: " · " },
      { fieldName: "isBoss", text: "Manager" },
    ]);
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
      customFieldValues: {},
      email: "ada@example.test",
      firstName: "Ada",
      fullName: "Ada Lovelace",
      gender: "female",
      id: "00000000-0000-4000-8000-000000000001",
      lastName: "Lovelace",
      phone: "",
      profileUrl: "https://example.test/profiles/ada",
      tags: [],
      tagPriority: null,
      unitIds: [],
      unitPositions: [],
      username: "ada",
    } satisfies Employee;
    const rows: ExportRow[] = [{ context: "employeeFallback", employee, unitContext: null }];

    expect(
      createExportText({
        excludedJsonTagKeys: [],
        excludedJsonUnitIds: [],
        jsonFieldNames: createDefaultExportJsonFieldNames(),
        jsonTopLevelFieldOrder: defaultExportJsonTopLevelFieldOrder,
        rows,
        selectedEmployeeFieldKeys: [],
        selectedJsonTagFieldKeys: [],
        selectedJsonUnitFieldKeys: [],
        tabMode: "template",
        templateFormat: "{fullName} <{email}> {username ? '@{username}' : ''}\n",
      }),
    ).toBe("Ada Lovelace <ada@example.test> @ada\n");
  });

  test("exports Tags as structured JSON and renders legacy tokens in Template", () => {
    const employee = {
      avatarBase64Url: null,
      birthday: null,
      customFieldValues: {},
      email: null,
      firstName: "Ada",
      fullName: "Ada Lovelace",
      gender: "female",
      id: "00000000-0000-4000-8000-000000000001",
      lastName: "Lovelace",
      phone: null,
      profileUrl: null,
      tags: [
        { date: null, label: "Mentor" },
        { date: "2026-09-01", label: "Backend" },
      ],
      tagPriority: null,
      unitIds: [],
      unitPositions: [],
      username: null,
    } satisfies Employee;
    const rows: ExportRow[] = [{ context: "employeeFallback", employee, unitContext: null }];
    const jsonFieldNames = createDefaultExportJsonFieldNames();
    const baseOptions = {
      excludedJsonTagKeys: [],
      excludedJsonUnitIds: [],
      jsonFieldNames,
      jsonTopLevelFieldOrder: defaultExportJsonTopLevelFieldOrder,
      rows,
      selectedEmployeeFieldKeys: [],
      selectedJsonTagFieldKeys: ["label", "date"] as const,
      selectedJsonUnitFieldKeys: [],
      templateFormat: "{tags}|{tagDates}",
    };
    const json = createExportText({ ...baseOptions, tabMode: "json" });
    const template = createExportText({ ...baseOptions, tabMode: "template" });

    expect(JSON.parse(json)[0].tags).toEqual([
      { date: null, label: "Mentor" },
      { date: "2026-09-01", label: "Backend" },
    ]);
    expect(template).toBe("Mentor; Backend|Backend=2026-09-01");
  });

  test("removes whitespace-only lines and counts the processed output", () => {
    const createEmployee = (id: string, fullName: string, email: string | null): Employee => ({
      avatarBase64Url: null,
      birthday: null,
      customFieldValues: {},
      email,
      firstName: fullName,
      fullName,
      gender: "female",
      id,
      lastName: "",
      phone: null,
      profileUrl: null,
      tags: [],
      tagPriority: null,
      unitIds: [],
      unitPositions: [],
      username: null,
    });
    const rows: ExportRow[] = [
      {
        context: "employeeFallback",
        employee: createEmployee("00000000-0000-4000-8000-000000000011", "Ada", "a@example.test"),
        unitContext: null,
      },
      {
        context: "employeeFallback",
        employee: createEmployee("00000000-0000-4000-8000-000000000012", "Grace", null),
        unitContext: null,
      },
    ];
    const templateFormat = "{email ? '{fullName}' : ' \t '}\n\n";
    const options = {
      excludedJsonTagKeys: [],
      excludedJsonUnitIds: [],
      jsonFieldNames: createDefaultExportJsonFieldNames(),
      jsonTopLevelFieldOrder: defaultExportJsonTopLevelFieldOrder,
      rows,
      selectedEmployeeFieldKeys: [],
      selectedJsonTagFieldKeys: [],
      selectedJsonUnitFieldKeys: [],
      tabMode: "template" as const,
      templateFormat,
    };

    expect(filterTemplateEmptyLines("Ada\r\n \t\nGrace\r\n", true)).toBe("Ada\nGrace");
    expect(countTemplateOutputLines(rows, templateFormat, [], false)).toBe(4);
    expect(countTemplateOutputLines(rows, templateFormat, [], true)).toBe(1);
    expect(createExportText(options)).toBe("Ada\n\n \t \n\n");
    expect(createExportText({ ...options, removeEmptyLines: true })).toBe("Ada");
    expect(createExportPreview({ ...options, removeEmptyLines: true })).toMatchObject({
      fullCount: 1,
      shownCount: 1,
      text: "Ada",
    });

    function* largeRows() {
      for (let index = 0; index < 20_000; index += 1) yield rows[index % rows.length] as ExportRow;
    }
    expect(countTemplateOutputLines(largeRows(), "{fullName}\n", [], true)).toBe(20_000);
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
