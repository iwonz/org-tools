import type { Employee } from "@org-tools/types";

export const numberFormatter = new Intl.NumberFormat("en-US");

export const formatNumber = (value: number) =>
  numberFormatter.format(value).replace(/[\u00a0\u202f]/g, " ");

export const pluralize = (
  value: number,
  forms: readonly [one: string, few: string, many: string],
) => (Math.abs(value) === 1 ? forms[0] : forms[2]);

export const formatCount = (
  value: number,
  forms: readonly [one: string, few: string, many: string],
) => `${formatNumber(value)} ${pluralize(value, forms)}`;

export const compactStrings = (values: Array<string | null | undefined>) =>
  values.filter((value): value is string => Boolean(value));

export const uniqueStrings = (values: string[]) => [...new Set(values)];

export const getEmployeeInitials = (employee: Employee) => {
  const firstInitial = employee.firstName?.trim().at(0);
  const lastInitial = employee.lastName?.trim().at(0);

  if (firstInitial || lastInitial) {
    return `${firstInitial ?? ""}${lastInitial ?? ""}`.toLocaleUpperCase("en-US");
  }

  return employee.fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((namePart) => namePart.at(0))
    .join("")
    .toLocaleUpperCase("en-US");
};

export const getEmployeePositionValues = (employee: Employee) =>
  compactStrings(employee.unitPositions.map((unitPosition) => unitPosition.position));

export const getEmployeeSubtitle = (employee: Employee) =>
  [employee.email, employee.username, getEmployeePositionValues(employee).slice(0, 2).join(", ")]
    .filter(Boolean)
    .join(" · ");
