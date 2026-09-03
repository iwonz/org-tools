import type { Employee, EmployeeId } from "@org-tools/types";

import { createBirthdayKey, parseEmployeeBirthday } from "@/lib/birthday";

export type AnalyticsCountEntryKind =
  | "birthdayDate"
  | "birthdayMonth"
  | "birthdayYear"
  | "missingPosition"
  | "text";

export type AnalyticsCountEntry = {
  count: number;
  employees: Employee[];
  kind: AnalyticsCountEntryKind;
  label: string;
};

export type AnalyticsAgeExtreme = {
  age: number;
  employee: Employee;
};

export type AnalyticsAgeCohort = {
  averageAge: number | null;
  employeeCount: number;
  oldest: AnalyticsAgeExtreme | null;
  youngest: AnalyticsAgeExtreme | null;
};

export type AnalyticsResult = {
  ageCohorts: {
    all: AnalyticsAgeCohort;
    female: AnalyticsAgeCohort;
    male: AnalyticsAgeCohort;
  };
  birthdayDateCounts: AnalyticsCountEntry[];
  birthdayMonthCounts: AnalyticsCountEntry[];
  birthdayYearCounts: AnalyticsCountEntry[];
  firstNameCounts: AnalyticsCountEntry[];
  fullNameDuplicates: AnalyticsCountEntry[];
  lastNameCounts: AnalyticsCountEntry[];
  positionCounts: AnalyticsCountEntry[];
};

type MutableAgeCohort = {
  ageTotal: number;
  employeeCount: number;
  oldest: AnalyticsAgeExtreme | null;
  youngest: AnalyticsAgeExtreme | null;
};

const sortEntries = (entries: AnalyticsCountEntry[]) =>
  entries.sort((firstEntry, secondEntry) =>
    secondEntry.count === firstEntry.count
      ? firstEntry.label.localeCompare(secondEntry.label, "en")
      : secondEntry.count - firstEntry.count,
  );

const entriesFromEmployeeMap = (
  employeesByValue: Map<string, Employee[]>,
  kind: AnalyticsCountEntryKind = "text",
) =>
  sortEntries(
    [...employeesByValue.entries()].map(([label, currentEmployees]) => ({
      count: currentEmployees.length,
      employees: currentEmployees,
      kind,
      label,
    })),
  );

const addToEmployeeMap = (
  employeesByValue: Map<string, Employee[]>,
  label: string,
  employee: Employee,
) => {
  const currentEmployees = employeesByValue.get(label);
  if (currentEmployees) currentEmployees.push(employee);
  else employeesByValue.set(label, [employee]);
};

const getCompletedAge = (birthday: { day: number; month: number; year: number }, today: Date) => {
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();
  const birthdayPassed =
    currentMonth > birthday.month ||
    (currentMonth === birthday.month && currentDay >= birthday.day);

  return currentYear - birthday.year - (birthdayPassed ? 0 : 1);
};

const compareEmployeeIdentity = (first: Employee, second: Employee) => {
  const nameComparison = first.fullName.localeCompare(second.fullName, "en", {
    sensitivity: "base",
  });
  return nameComparison || String(first.id).localeCompare(String(second.id), "en");
};

const compareByBirthDateThenIdentity = (
  first: AnalyticsAgeExtreme,
  second: AnalyticsAgeExtreme,
) => {
  const firstBirthday = parseEmployeeBirthday(first.employee.birthday);
  const secondBirthday = parseEmployeeBirthday(second.employee.birthday);
  if (!firstBirthday || !secondBirthday) {
    return compareEmployeeIdentity(first.employee, second.employee);
  }

  const dateComparison =
    Date.UTC(firstBirthday.year, firstBirthday.month - 1, firstBirthday.day) -
    Date.UTC(secondBirthday.year, secondBirthday.month - 1, secondBirthday.day);
  return dateComparison || compareEmployeeIdentity(first.employee, second.employee);
};

const createMutableAgeCohort = (): MutableAgeCohort => ({
  ageTotal: 0,
  employeeCount: 0,
  oldest: null,
  youngest: null,
});

const finalizeAgeCohort = (cohort: MutableAgeCohort): AnalyticsAgeCohort => {
  if (cohort.employeeCount === 0) {
    return { averageAge: null, employeeCount: 0, oldest: null, youngest: null };
  }

  return {
    averageAge: cohort.ageTotal / cohort.employeeCount,
    employeeCount: cohort.employeeCount,
    oldest: cohort.oldest,
    youngest: cohort.youngest,
  };
};

const addAge = (cohort: MutableAgeCohort, employee: Employee, age: number) => {
  const candidate = { age, employee };
  cohort.ageTotal += age;
  cohort.employeeCount += 1;
  if (!cohort.oldest || compareByBirthDateThenIdentity(candidate, cohort.oldest) < 0) {
    cohort.oldest = candidate;
  }
  if (!cohort.youngest || compareByBirthDateThenIdentity(candidate, cohort.youngest) > 0) {
    cohort.youngest = candidate;
  }
};

export const buildAnalytics = (
  employees: Employee[],
  options: { now?: Date } = {},
): AnalyticsResult => {
  const today = options.now ?? new Date();
  const birthdayDate = new Map<string, Employee[]>();
  const birthdayMonth = new Map<string, Employee[]>();
  const birthdayYear = new Map<string, Employee[]>();
  const firstNames = new Map<string, Employee[]>();
  const fullNames = new Map<string, Employee[]>();
  const lastNames = new Map<string, Employee[]>();
  const positions = new Map<string, Map<EmployeeId, Employee>>();
  const ageCohorts = {
    all: createMutableAgeCohort(),
    female: createMutableAgeCohort(),
    male: createMutableAgeCohort(),
  };

  for (const employee of employees) {
    const firstName = employee.firstName.trim();
    const lastName = employee.lastName.trim();
    const fullName = employee.fullName.trim();
    if (firstName) addToEmployeeMap(firstNames, firstName, employee);
    if (lastName) addToEmployeeMap(lastNames, lastName, employee);
    if (fullName) addToEmployeeMap(fullNames, fullName, employee);

    for (const unitPosition of employee.unitPositions) {
      const position = unitPosition.position?.trim() || "";
      const employeesInPosition = positions.get(position) ?? new Map<EmployeeId, Employee>();
      employeesInPosition.set(employee.id, employee);
      positions.set(position, employeesInPosition);
    }

    const birthday = parseEmployeeBirthday(employee.birthday, today);
    if (!birthday) continue;

    addToEmployeeMap(birthdayDate, createBirthdayKey(birthday.day, birthday.month), employee);
    addToEmployeeMap(birthdayMonth, String(birthday.month).padStart(2, "0"), employee);
    if (!birthday.yearKnown) continue;

    addToEmployeeMap(birthdayYear, String(birthday.year), employee);
    const age = getCompletedAge(birthday, today);
    addAge(ageCohorts.all, employee, age);
    if (employee.gender === "male" || employee.gender === "female") {
      addAge(ageCohorts[employee.gender], employee, age);
    }
  }

  return {
    ageCohorts: {
      all: finalizeAgeCohort(ageCohorts.all),
      female: finalizeAgeCohort(ageCohorts.female),
      male: finalizeAgeCohort(ageCohorts.male),
    },
    birthdayDateCounts: entriesFromEmployeeMap(birthdayDate, "birthdayDate"),
    birthdayMonthCounts: entriesFromEmployeeMap(birthdayMonth, "birthdayMonth"),
    birthdayYearCounts: entriesFromEmployeeMap(birthdayYear, "birthdayYear"),
    firstNameCounts: entriesFromEmployeeMap(firstNames),
    fullNameDuplicates: entriesFromEmployeeMap(fullNames).filter((entry) => entry.count > 1),
    lastNameCounts: entriesFromEmployeeMap(lastNames),
    positionCounts: sortEntries(
      [...positions.entries()].map(([label, currentEmployees]) => ({
        count: currentEmployees.size,
        employees: [...currentEmployees.values()],
        kind: label ? ("text" as const) : ("missingPosition" as const),
        label,
      })),
    ),
  };
};
