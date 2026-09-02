export const UNKNOWN_BIRTH_YEAR = 1900;

export type EmployeeBirthdayDate = {
  day: number;
  month: number;
  year: number;
  yearKnown: boolean;
};

export const BIRTHDAY_MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const getValidationYear = (year: number) => (year === UNKNOWN_BIRTH_YEAR ? 2000 : year);

export const getBirthdayDaysInMonth = (month: number, year: number) => {
  if (!Number.isInteger(month) || month < 1 || month > 12) return 31;
  const validationYear = getValidationYear(year);
  return new Date(Date.UTC(validationYear, month, 0)).getUTCDate();
};

export const parseEmployeeBirthday = (
  birthday: string | null | undefined,
  now = new Date(),
): EmployeeBirthdayDate | null => {
  const match = birthday?.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const yearKnown = year !== UNKNOWN_BIRTH_YEAR;
  const currentYear = now.getUTCFullYear();
  if (year < UNKNOWN_BIRTH_YEAR || year > currentYear) return null;

  const validationYear = getValidationYear(year);
  const date = new Date(Date.UTC(validationYear, month - 1, day));
  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  if (
    yearKnown &&
    Date.UTC(year, month - 1, day) > Date.UTC(currentYear, now.getUTCMonth(), now.getUTCDate())
  ) {
    return null;
  }

  return { day, month, year, yearKnown };
};

export const createEmployeeBirthday = (day: number, month: number, year: number) =>
  `${String(day).padStart(2, "0")}.${String(month).padStart(2, "0")}.${String(year).padStart(4, "0")}`;

export const createBirthdayKey = (day: number, month: number) =>
  `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

export const formatBirthdayMonthName = (month: number) =>
  BIRTHDAY_MONTH_NAMES[month - 1] ?? `Month ${month}`;

export const formatBirthdayDateLabel = (day: number, month: number) =>
  `${formatBirthdayMonthName(month)} ${day}`;
