import type { Employee, EmployeeSearchDocument, Unit, UnitSearchDocument } from "@org-tools/types";

import { createBirthdayKey, parseBirthdayMonthDay } from "@/lib/birthday";

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
  const birthday = parseBirthdayMonthDay(employee.birthday);

  return birthday ? createBirthdayKey(birthday.day, birthday.month) : null;
};

export const createEmployeeSearchDocument = (employee: Employee): EmployeeSearchDocument => {
  const positionLabels = getEmployeePositionLabels(employee);
  const tagLabels = employee.tags.map(({ label }) => label);

  return {
    birthdayKey: getEmployeeBirthdayKey(employee),
    employeeId: employee.id,
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
    tagLabelSet: new Set(tagLabels),
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
