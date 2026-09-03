import type { CustomEmployeeFieldDefinition, Employee } from "@org-tools/types";
import { describe, expect, test } from "vitest";

import {
  evaluateCustomEmployeeFields,
  md5Hex,
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
        id: uuid(1),
        key: "department",
        kind: "value",
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
});
