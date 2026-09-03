import type { AppLocale } from "@org-tools/types";

import { APP_LOCALE_CONFIG } from "@/i18n/locale";

export const getCalendarWeekStart = (locale: AppLocale) => APP_LOCALE_CONFIG[locale].weekStartsOn;

export const formatCalendarDayTitle = (date: Date, locale: AppLocale) => {
  const parts = new Intl.DateTimeFormat(APP_LOCALE_CONFIG[locale].dateLocale, {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).formatToParts(date);

  return parts
    .filter((part) => !(locale === "ru" && part.type === "literal" && /\u0433\./u.test(part.value)))
    .map((part) => part.value)
    .join("")
    .trim();
};
