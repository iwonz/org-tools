import type {
  CustomEmployeeFieldDefinition,
  CustomEmployeeFieldValue,
  CustomEmployeeValueField,
  Employee,
  EmployeeFieldId,
} from "@org-tools/types";

import { sha256Hex } from "@/lib/employee-id";
import { renderTemplateFormat } from "@/lib/template-format";

export const CUSTOM_EMPLOYEE_FIELD_KEY_PATTERN = /^[A-Za-z][A-Za-z0-9]*$/;

export const BUILT_IN_EMPLOYEE_TEMPLATE_KEYS = [
  "id",
  "firstName",
  "lastName",
  "fullName",
  "gender",
  "username",
  "profileUrl",
  "email",
  "phone",
  "birthday",
  "tags",
  "tagDates",
  "unitId",
  "unitName",
  "unitFullPath",
  "position",
  "isBoss",
] as const;

const normalizeDefinitionIdentity = (value: string) =>
  value.normalize("NFKC").trim().replace(/\s+/gu, " ").toLocaleLowerCase("en-US");

export const normalizeCustomEmployeeFieldName = normalizeDefinitionIdentity;
export const normalizeCustomEmployeeFieldKey = normalizeDefinitionIdentity;

export const extractTemplateFieldKeys = (template: string): string[] => {
  const keys = new Set<string>();
  const matcher = /\{\s*([A-Za-z][A-Za-z0-9]*)\s*(?=[}?])/gu;
  for (const match of template.matchAll(matcher)) {
    if (match[1]) keys.add(match[1]);
  }
  return [...keys];
};

export const rewriteTemplateFieldKey = (template: string, previousKey: string, nextKey: string) =>
  template.replace(
    /\{(\s*)([A-Za-z][A-Za-z0-9]*)(\s*)(?=[}?])/gu,
    (match, leading: string, key: string, trailing: string) =>
      key.toLocaleLowerCase("en-US") === previousKey.toLocaleLowerCase("en-US")
        ? `{${leading}${nextKey}${trailing}`
        : match,
  );

export type CustomEmployeeFieldValidationIssue =
  | "duplicate-key"
  | "duplicate-name"
  | "invalid-key"
  | "missing-name"
  | "option-required"
  | "template-cycle";

export const validateCustomEmployeeFieldDefinitions = (
  definitions: readonly CustomEmployeeFieldDefinition[],
): CustomEmployeeFieldValidationIssue | null => {
  const names = new Set<string>();
  const keys = new Set(BUILT_IN_EMPLOYEE_TEMPLATE_KEYS.map(normalizeCustomEmployeeFieldKey));
  const definitionByKey = new Map<string, CustomEmployeeFieldDefinition>();

  for (const definition of definitions) {
    const normalizedName = normalizeCustomEmployeeFieldName(definition.name);
    const normalizedKey = normalizeCustomEmployeeFieldKey(definition.key);
    if (!normalizedName) return "missing-name";
    if (!CUSTOM_EMPLOYEE_FIELD_KEY_PATTERN.test(definition.key)) return "invalid-key";
    if (names.has(normalizedName)) return "duplicate-name";
    if (keys.has(normalizedKey)) return "duplicate-key";
    names.add(normalizedName);
    keys.add(normalizedKey);
    definitionByKey.set(normalizedKey, definition);

    if (definition.kind === "value" && definition.valueType === "option") {
      const optionLabels = new Set<string>();
      for (const option of definition.options) {
        const label = normalizeDefinitionIdentity(option.label);
        if (!label || optionLabels.has(label)) return "option-required";
        optionLabels.add(label);
      }
    }
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (key: string): boolean => {
    if (visiting.has(key)) return false;
    if (visited.has(key)) return true;
    visiting.add(key);
    const definition = definitionByKey.get(key);
    if (definition?.kind === "template") {
      for (const dependency of extractTemplateFieldKeys(definition.template)) {
        const normalizedDependency = normalizeCustomEmployeeFieldKey(dependency);
        if (definitionByKey.has(normalizedDependency) && !visit(normalizedDependency)) return false;
      }
    }
    visiting.delete(key);
    visited.add(key);
    return true;
  };

  for (const key of definitionByKey.keys()) {
    if (!visit(key)) return "template-cycle";
  }
  return null;
};

export const wouldCreateTemplateDependencyCycle = (
  definitions: readonly CustomEmployeeFieldDefinition[],
  sourceId: EmployeeFieldId,
  candidateId: EmployeeFieldId,
): boolean => {
  const definitionByKey = new Map(
    definitions.map((definition) => [normalizeCustomEmployeeFieldKey(definition.key), definition]),
  );
  const visited = new Set<EmployeeFieldId>();
  const reachesSource = (definitionId: EmployeeFieldId): boolean => {
    if (definitionId === sourceId) return true;
    if (visited.has(definitionId)) return false;
    visited.add(definitionId);
    const definition = definitions.find((candidate) => candidate.id === definitionId);
    if (definition?.kind !== "template") return false;
    return extractTemplateFieldKeys(definition.template).some((key) => {
      const dependency = definitionByKey.get(normalizeCustomEmployeeFieldKey(key));
      return dependency ? reachesSource(dependency.id) : false;
    });
  };
  return reachesSource(candidateId);
};

const rotateLeft = (value: number, shift: number) => (value << shift) | (value >>> (32 - shift));
const md5Add = (first: number, second: number) => (first + second) | 0;

export const md5Hex = (input: string): string => {
  const bytes = new TextEncoder().encode(input);
  const paddedLength = Math.ceil((bytes.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const bitLength = bytes.length * 8;
  const view = new DataView(padded.buffer);
  view.setUint32(paddedLength - 8, bitLength >>> 0, true);
  view.setUint32(paddedLength - 4, Math.floor(bitLength / 0x1_0000_0000), true);

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;
  const shifts = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9,
    14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ];
  const constants = Array.from(
    { length: 64 },
    (_, index) => Math.floor(Math.abs(Math.sin(index + 1)) * 0x1_0000_0000) | 0,
  );

  for (let offset = 0; offset < paddedLength; offset += 64) {
    let a = a0;
    let b = b0;
    let c = c0;
    let d = d0;
    for (let index = 0; index < 64; index += 1) {
      let f: number;
      let wordIndex: number;
      if (index < 16) {
        f = (b & c) | (~b & d);
        wordIndex = index;
      } else if (index < 32) {
        f = (d & b) | (~d & c);
        wordIndex = (5 * index + 1) % 16;
      } else if (index < 48) {
        f = b ^ c ^ d;
        wordIndex = (3 * index + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        wordIndex = (7 * index) % 16;
      }
      const word = view.getInt32(offset + wordIndex * 4, true);
      const next = d;
      d = c;
      c = b;
      b = md5Add(
        b,
        rotateLeft(md5Add(md5Add(a, f), md5Add(constants[index] ?? 0, word)), shifts[index] ?? 0),
      );
      a = next;
    }
    a0 = md5Add(a0, a);
    b0 = md5Add(b0, b);
    c0 = md5Add(c0, c);
    d0 = md5Add(d0, d);
  }

  return [a0, b0, c0, d0]
    .map((word) =>
      [0, 8, 16, 24]
        .map((shift) => ((word >>> shift) & 0xff).toString(16).padStart(2, "0"))
        .join(""),
    )
    .join("");
};

const getValueFieldOutput = (
  definition: CustomEmployeeValueField,
  value: CustomEmployeeFieldValue | undefined,
) => {
  if (value === undefined || value === null) return null;
  if (definition.valueType !== "option") return value;
  return definition.options.find((option) => option.id === value)?.label ?? null;
};

const getBuiltInValue = (employee: Employee, key: string): unknown => {
  switch (key) {
    case "id":
      return employee.id;
    case "firstName":
      return employee.firstName;
    case "lastName":
      return employee.lastName;
    case "fullName":
      return employee.fullName;
    case "gender":
      return employee.gender;
    case "username":
      return employee.username;
    case "profileUrl":
      return employee.profileUrl;
    case "email":
      return employee.email;
    case "phone":
      return employee.phone;
    case "birthday":
      return employee.birthday;
    case "tags":
      return employee.tags.map((tag) => tag.label);
    case "tagDates":
      return employee.tags.flatMap((tag) => (tag.date ? [`${tag.label}=${tag.date}`] : []));
    default:
      return undefined;
  }
};

export const evaluateCustomEmployeeFields = (
  employee: Employee,
  definitions: readonly CustomEmployeeFieldDefinition[],
): Map<EmployeeFieldId, CustomEmployeeFieldValue> => {
  const result = new Map<EmployeeFieldId, CustomEmployeeFieldValue>();
  const definitionByKey = new Map(
    definitions.map((definition) => [normalizeCustomEmployeeFieldKey(definition.key), definition]),
  );
  const evaluating = new Set<EmployeeFieldId>();
  const evaluate = (definition: CustomEmployeeFieldDefinition): CustomEmployeeFieldValue => {
    if (result.has(definition.id)) return result.get(definition.id) ?? null;
    if (evaluating.has(definition.id)) return null;
    evaluating.add(definition.id);
    let value: CustomEmployeeFieldValue;
    if (definition.kind === "value") {
      value = getValueFieldOutput(definition, employee.customFieldValues[definition.id]);
    } else {
      const rendered = renderTemplateFormat({
        resolveField: (key) => {
          const customDefinition = definitionByKey.get(normalizeCustomEmployeeFieldKey(key));
          if (customDefinition) return { known: true, value: evaluate(customDefinition) };
          const builtIn = getBuiltInValue(employee, key);
          return builtIn === undefined ? { known: false } : { known: true, value: builtIn };
        },
        template: definition.template,
      });
      value =
        definition.hash === "md5"
          ? md5Hex(rendered)
          : definition.hash === "sha256"
            ? sha256Hex(rendered)
            : rendered;
    }
    evaluating.delete(definition.id);
    result.set(definition.id, value);
    return value;
  };
  for (const definition of definitions) evaluate(definition);
  return result;
};
