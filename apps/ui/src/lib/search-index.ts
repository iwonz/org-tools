import type {
  CustomEmployeeFieldDefinition,
  Employee,
  EmployeeSearchDocument,
  Unit,
  UnitSearchDocument,
} from "@org-tools/types";

import { createBirthdayKey, parseEmployeeBirthday } from "@/lib/birthday";
import { evaluateCustomEmployeeFields } from "@/lib/custom-employee-fields";

export const EMPTY_POSITION_LABEL = "Position not specified";

export const normalizeSearchValue = (value: string | null | undefined) =>
  (value ?? "").toLocaleLowerCase("en-US");

export const getSearchTokens = (query: string) =>
  normalizeSearchValue(query)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);

export const getEmployeePositionLabel = (position: string | null | undefined) =>
  position?.trim() || EMPTY_POSITION_LABEL;

export const getEmployeePositionLabels = (employee: Employee) =>
  employee.unitPositions.length === 0
    ? [EMPTY_POSITION_LABEL]
    : employee.unitPositions.map((unitPosition) => getEmployeePositionLabel(unitPosition.position));

const getEmployeeBirthdayKey = (employee: Employee) => {
  const birthday = parseEmployeeBirthday(employee.birthday);

  return birthday ? createBirthdayKey(birthday.day, birthday.month) : null;
};

export const createEmployeeSearchDocument = (
  employee: Employee,
  customFieldDefinitions: readonly CustomEmployeeFieldDefinition[] = [],
): EmployeeSearchDocument => {
  const positionLabels = getEmployeePositionLabels(employee);
  const tagLabels = employee.tags.map(({ label }) => label);
  const customValues = evaluateCustomEmployeeFields(employee, customFieldDefinitions);

  return {
    birthday: employee.birthday,
    birthdayKey: getEmployeeBirthdayKey(employee),
    customFieldValues: new Map(
      [...customValues].map(([fieldId, value]) => [fieldId, value === null ? null : String(value)]),
    ),
    employeeId: employee.id,
    gender: employee.gender,
    positionLabelSet: new Set(positionLabels),
    positionLabels,
    searchText: normalizeSearchValue(
      [
        employee.firstName,
        employee.lastName,
        employee.fullName,
        employee.username,
        employee.email,
        ...tagLabels,
      ]
        .filter(Boolean)
        .join(" "),
    ),
    tagIdSet: new Set(employee.tags.flatMap((tag) => (tag.tagId ? [tag.tagId] : []))),
    tagLabels,
  };
};

export const createUnitSearchDocument = (unit: Unit): UnitSearchDocument => ({
  normalizedName: normalizeSearchValue(unit.name),
  pathIds: unit.path.ids,
  unitId: unit.id,
});

export const getPositionOptionsFromSearchDocuments = (
  employeeSearchDocuments: EmployeeSearchDocument[],
) => {
  const positions = new Set<string>();

  for (const document of employeeSearchDocuments) {
    for (const position of document.positionLabels) {
      positions.add(position);
    }
  }

  return [...positions].sort((firstPosition, secondPosition) =>
    firstPosition.localeCompare(secondPosition, "en", { sensitivity: "base" }),
  );
};
