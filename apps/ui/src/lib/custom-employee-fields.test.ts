import type { CustomEmployeeFieldDefinition, Employee } from "@org-tools/types";
import { describe, expect, test } from "vitest";

import {
  evaluateCustomEmployeeFields,
  getCustomEmployeeFieldFilterValues,
  md5Hex,
  normalizeCustomEmployeeFieldValue,
  rewriteTemplateFieldKey,
  validateCustomEmployeeFieldDefinitions,
  wouldCreateTemplateDependencyCycle,
} from "@/lib/custom-employee-fields";

const uuid = (value: number) => `00000000-0000-4000-8000-${String(value).padStart(12, "0")}`;

const employee: Employee = {
  avatarBase64Url: null,
  birthday: "09.07.1900",
  customFieldValues: { [uuid(1)]: "Platform" },
  email: "alex.morgan@example.test",
  firstName: "Alex",
  fullName: "Alex Morgan",
  gender: "unspecified",
  id: uuid(100),
  lastName: "Morgan",
  phone: null,
  profileUrl: null,
  tags: [],
  tagPriority: null,
  unitIds: [],
  unitPositions: [],
  username: null,
};

describe("custom Employee fields", () => {
  test("matches standard MD5 vectors and hashes UTF-8 rendered values", () => {
    expect(md5Hex("")).toBe("d41d8cd98f00b204e9800998ecf8427e");
    expect(md5Hex("abc")).toBe("900150983cd24fb0d6963f7d28e17f72");

    const definitions: CustomEmployeeFieldDefinition[] = [
      {
        allowCustomOptions: false,
        id: uuid(1),
        key: "department",
        kind: "value",
        multiple: false,
        name: "Department",
        options: [],
        required: false,
        valueType: "text",
      },
      {
        hash: "md5",
        id: uuid(2),
        key: "directoryKey",
        kind: "template",
        name: "Directory key",
        template: "{firstName}:{department}",
      },
    ];
    expect(evaluateCustomEmployeeFields(employee, definitions).get(uuid(2))).toBe(
      md5Hex("Alex:Platform"),
    );
  });

  test("rejects duplicate built-in keys, normalized names, and dependency cycles", () => {
    const first: CustomEmployeeFieldDefinition = {
      hash: "none",
      id: uuid(1),
      key: "first",
      kind: "template",
      name: "First",
      template: "{second}",
    };
    const second: CustomEmployeeFieldDefinition = {
      hash: "none",
      id: uuid(2),
      key: "second",
      kind: "template",
      name: "Second",
      template: "{first}",
    };
    const definitions = [first, second];
    expect(validateCustomEmployeeFieldDefinitions(definitions)).toBe("template-cycle");
    expect(wouldCreateTemplateDependencyCycle(definitions, uuid(1), uuid(2))).toBe(true);
    expect(validateCustomEmployeeFieldDefinitions([{ ...first, key: "email", template: "" }])).toBe(
      "duplicate-key",
    );
    expect(
      validateCustomEmployeeFieldDefinitions([
        { ...first, template: "" },
        { ...second, name: "  FIRST  ", template: "" },
      ]),
    ).toBe("duplicate-name");
  });

  test("rewrites custom tokens without touching similarly named tokens", () => {
    expect(rewriteTemplateFieldKey("{office}-{officeCode}-{ office?yes:no}", "office", "hub")).toBe(
      "{hub}-{officeCode}-{ hub?yes:no}",
    );
  });

  test("validates and resolves multi-option values", () => {
    const definition: CustomEmployeeFieldDefinition = {
      allowCustomOptions: true,
      id: uuid(3),
      key: "skills",
      kind: "value",
      multiple: true,
      name: "Skills",
      options: [
        { id: uuid(31), label: "TypeScript" },
        { id: uuid(32), label: "Research" },
      ],
      required: true,
      valueType: "option",
    };
    expect(normalizeCustomEmployeeFieldValue(definition, [uuid(31), uuid(32)])).toEqual([
      uuid(31),
      uuid(32),
    ]);
    expect(() => normalizeCustomEmployeeFieldValue(definition, [uuid(31), uuid(31)])).toThrow();
    expect(
      evaluateCustomEmployeeFields(
        { ...employee, customFieldValues: { [definition.id]: [uuid(31), uuid(32)] } },
        [definition],
      ).get(definition.id),
    ).toEqual(["TypeScript", "Research"]);
    expect(getCustomEmployeeFieldFilterValues(definition, [uuid(31), uuid(32)])).toEqual([
      "TypeScript",
      "Research",
    ]);
    expect(
      validateCustomEmployeeFieldDefinitions([
        { ...definition, allowCustomOptions: true, multiple: false },
      ]),
    ).toBe("option-mode-invalid");
  });

  test("validates Composite required cells and per-Employee primary uniqueness", () => {
    const primaryFieldId = uuid(41);
    const dateFieldId = uuid(42);
    const definition: CustomEmployeeFieldDefinition = {
      fields: [
        {
          id: primaryFieldId,
          name: "Certificate",
          options: [],
          required: true,
          valueType: "text",
        },
        {
          id: dateFieldId,
          name: "Expires",
          options: [],
          required: false,
          valueType: "date",
        },
      ],
      id: uuid(4),
      key: "certificates",
      kind: "composite",
      name: "Certificates",
      primaryFieldId,
      required: true,
    };
    const value = [
      { [primaryFieldId]: "First aid", [dateFieldId]: "01.02.2030" },
      { [primaryFieldId]: "Security" },
    ];
    expect(normalizeCustomEmployeeFieldValue(definition, value)).toEqual(value);
    expect(getCustomEmployeeFieldFilterValues(definition, value)).toEqual([
      "First aid",
      "Security",
    ]);
    expect(() =>
      normalizeCustomEmployeeFieldValue(definition, [
        { [primaryFieldId]: " First  aid " },
        { [primaryFieldId]: "first aid" },
      ]),
    ).toThrow("unique");
    expect(() => normalizeCustomEmployeeFieldValue(definition, [{}])).toThrow("required");
  });
});
