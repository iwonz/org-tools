export type BirthdayMonthDay = {
  day: number;
  month: number;
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

export const parseBirthdayMonthDay = (
  birthday: string | null | undefined,
): BirthdayMonthDay | null => {
  const match = birthday?.match(/^(\d{2})-(\d{2})$/);
  if (!match) return null;

  const month = Number(match[1]);
  const day = Number(match[2]);
  const date = new Date(Date.UTC(2000, month - 1, day));
  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;

  return { day, month };
};

export const createBirthdayKey = (day: number, month: number) =>
  `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

export const formatBirthdayMonthName = (month: number) =>
  BIRTHDAY_MONTH_NAMES[month - 1] ?? `Month ${month}`;

export const formatBirthdayDateLabel = (day: number, month: number) =>
  `${formatBirthdayMonthName(month)} ${day}`;
