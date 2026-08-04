import type { Employee } from "@org-tools/types";

import { createBirthdayKey } from "@/lib/birthday";

export const isCalendarLeapYear = (year: number) =>
  year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);

export const getCalendarBirthdayEmployees = (
  employeesByBirthday: ReadonlyMap<string, Employee[]>,
  year: number,
  month: number,
  day: number,
): Employee[] => {
  const employees = [...(employeesByBirthday.get(createBirthdayKey(day, month)) ?? [])];
  if (month !== 2 || day !== 28 || isCalendarLeapYear(year)) return employees;

  const employeeIds = new Set(employees.map(({ id }) => id));
  for (const employee of employeesByBirthday.get(createBirthdayKey(29, 2)) ?? []) {
    if (!employeeIds.has(employee.id)) employees.push(employee);
  }
  return employees;
};
