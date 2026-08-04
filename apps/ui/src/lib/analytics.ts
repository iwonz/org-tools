import type { Employee, EmployeeId } from "@org-tools/types";

import { createBirthdayKey, parseBirthdayMonthDay } from "@/lib/birthday";

export type AnalyticsCountEntryKind = "birthdayDate" | "birthdayMonth" | "missingPosition" | "text";

export type AnalyticsCountEntry = {
  count: number;
  employees: Employee[];
  kind: AnalyticsCountEntryKind;
  label: string;
};

export type AnalyticsResult = {
  birthdayDateCounts: AnalyticsCountEntry[];
  birthdayMonthCounts: AnalyticsCountEntry[];
  firstNameCounts: AnalyticsCountEntry[];
  fullNameDuplicates: AnalyticsCountEntry[];
  lastNameCounts: AnalyticsCountEntry[];
  positionCounts: AnalyticsCountEntry[];
};

const sortEntries = (entries: AnalyticsCountEntry[]) =>
  entries.sort((firstEntry, secondEntry) =>
    secondEntry.count === firstEntry.count
      ? firstEntry.label.localeCompare(secondEntry.label, "en")
      : secondEntry.count - firstEntry.count,
  );

const countEmployeesByValue = (
  employees: Employee[],
  getValue: (employee: Employee) => string | null | undefined,
): AnalyticsCountEntry[] => {
  const employeesByValue = new Map<string, Employee[]>();

  for (const employee of employees) {
    const value = getValue(employee)?.trim();

    if (!value) continue;

    const currentEmployees = employeesByValue.get(value) ?? [];

    currentEmployees.push(employee);
    employeesByValue.set(value, currentEmployees);
  }

  return sortEntries(
    [...employeesByValue.entries()].map(([label, currentEmployees]) => ({
      count: currentEmployees.length,
      employees: currentEmployees,
      kind: "text",
      label,
    })),
  );
};

const countEmployeesByPosition = (employees: Employee[]): AnalyticsCountEntry[] => {
  const employeesByPosition = new Map<string, Map<EmployeeId, Employee>>();

  for (const employee of employees) {
    for (const unitPosition of employee.unitPositions) {
      const position = unitPosition.position?.trim() || "";
      const currentEmployees = employeesByPosition.get(position) ?? new Map<EmployeeId, Employee>();

      currentEmployees.set(employee.id, employee);
      employeesByPosition.set(position, currentEmployees);
    }
  }

  return sortEntries(
    [...employeesByPosition.entries()].map(([label, currentEmployees]) => ({
      count: currentEmployees.size,
      employees: [...currentEmployees.values()],
      kind: label ? "text" : "missingPosition",
      label,
    })),
  );
};

const countEmployeesByBirthdayMonth = (employees: Employee[]): AnalyticsCountEntry[] => {
  const employeesByMonth = new Map<number, Employee[]>();

  for (const employee of employees) {
    const birthday = parseBirthdayMonthDay(employee.birthday);

    if (!birthday) continue;

    const currentEmployees = employeesByMonth.get(birthday.month) ?? [];

    currentEmployees.push(employee);
    employeesByMonth.set(birthday.month, currentEmployees);
  }

  return sortEntries(
    [...employeesByMonth.entries()].map(([month, currentEmployees]) => ({
      count: currentEmployees.length,
      employees: currentEmployees,
      kind: "birthdayMonth",
      label: String(month).padStart(2, "0"),
    })),
  );
};

const countEmployeesByBirthdayDate = (employees: Employee[]): AnalyticsCountEntry[] => {
  const employeesByDate = new Map<string, Employee[]>();

  for (const employee of employees) {
    const birthday = parseBirthdayMonthDay(employee.birthday);

    if (!birthday) continue;

    const dateLabel = createBirthdayKey(birthday.day, birthday.month);
    const currentEmployees = employeesByDate.get(dateLabel) ?? [];

    currentEmployees.push(employee);
    employeesByDate.set(dateLabel, currentEmployees);
  }

  return sortEntries(
    [...employeesByDate.entries()].map(([label, currentEmployees]) => ({
      count: currentEmployees.length,
      employees: currentEmployees,
      kind: "birthdayDate",
      label,
    })),
  );
};

const countEmployeesByBirthdayMonthIndex = (
  birthdayEmployeesByKey: Map<string, Employee[]>,
): AnalyticsCountEntry[] => {
  const employeesByMonth = new Map<number, Employee[]>();

  for (const [birthdayKey, birthdayEmployees] of birthdayEmployeesByKey) {
    const month = Number(birthdayKey.split("-")[0]);

    if (!Number.isInteger(month)) continue;

    const currentEmployees = employeesByMonth.get(month) ?? [];

    currentEmployees.push(...birthdayEmployees);
    employeesByMonth.set(month, currentEmployees);
  }

  return sortEntries(
    [...employeesByMonth.entries()].map(([month, currentEmployees]) => ({
      count: currentEmployees.length,
      employees: currentEmployees,
      kind: "birthdayMonth",
      label: String(month).padStart(2, "0"),
    })),
  );
};

const countEmployeesByBirthdayDateIndex = (
  birthdayEmployeesByKey: Map<string, Employee[]>,
): AnalyticsCountEntry[] =>
  sortEntries(
    [...birthdayEmployeesByKey.entries()].map(([birthdayKey, currentEmployees]) => {
      const [month, day] = birthdayKey.split("-").map(Number);

      return {
        count: currentEmployees.length,
        employees: currentEmployees,
        kind: "birthdayDate" as const,
        label: createBirthdayKey(day ?? 0, month ?? 0),
      };
    }),
  );

export const buildAnalytics = (
  employees: Employee[],
  options: { birthdayEmployeesByKey?: Map<string, Employee[]> } = {},
): AnalyticsResult => ({
  birthdayDateCounts: options.birthdayEmployeesByKey
    ? countEmployeesByBirthdayDateIndex(options.birthdayEmployeesByKey)
    : countEmployeesByBirthdayDate(employees),
  birthdayMonthCounts: options.birthdayEmployeesByKey
    ? countEmployeesByBirthdayMonthIndex(options.birthdayEmployeesByKey)
    : countEmployeesByBirthdayMonth(employees),
  firstNameCounts: countEmployeesByValue(employees, (employee) => employee.firstName),
  fullNameDuplicates: countEmployeesByValue(employees, (employee) => employee.fullName).filter(
    (entry) => entry.count > 1,
  ),
  lastNameCounts: countEmployeesByValue(employees, (employee) => employee.lastName),
  positionCounts: countEmployeesByPosition(employees),
});
