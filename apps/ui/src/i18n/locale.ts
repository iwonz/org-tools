import type { AppLocale } from "@org-tools/types";

export type { AppLocale } from "@org-tools/types";

export const APP_LOCALES = [
  "en",
  "zh",
  "ru",
  "es",
  "fr",
  "ar",
] as const satisfies readonly AppLocale[];

export const DEFAULT_LOCALE: AppLocale = "en";
export const LOCALE_STORAGE_KEY = "org-tools-locale";

export const APP_LOCALE_CONFIG = {
  ar: {
    dateLocale: "ar",
    direction: "rtl",
    selfName: "\u0627\u0644\u0639\u0631\u0628\u064a\u0629",
    weekStartsOn: 6,
  },
  en: { dateLocale: "en", direction: "ltr", selfName: "English", weekStartsOn: 0 },
  es: { dateLocale: "es", direction: "ltr", selfName: "Español", weekStartsOn: 1 },
  fr: { dateLocale: "fr", direction: "ltr", selfName: "Français", weekStartsOn: 1 },
  ru: {
    dateLocale: "ru",
    direction: "ltr",
    selfName: "\u0420\u0443\u0441\u0441\u043a\u0438\u0439",
    weekStartsOn: 1,
  },
  zh: {
    dateLocale: "zh-CN",
    direction: "ltr",
    selfName: "\u7b80\u4f53\u4e2d\u6587",
    weekStartsOn: 1,
  },
} as const satisfies Record<
  AppLocale,
  { dateLocale: string; direction: "ltr" | "rtl"; selfName: string; weekStartsOn: 0 | 1 | 6 }
>;

export const isAppLocale = (value: unknown): value is AppLocale =>
  typeof value === "string" && APP_LOCALES.includes(value as AppLocale);

export const normalizeBrowserLocale = (value: string): AppLocale | null => {
  const primaryLanguage = value.trim().toLocaleLowerCase("en-US").split(/[-_]/u)[0];
  return isAppLocale(primaryLanguage) ? primaryLanguage : null;
};

export const detectBrowserLocale = (languages: readonly string[]): AppLocale => {
  for (const language of languages) {
    const locale = normalizeBrowserLocale(language);
    if (locale) return locale;
  }
  return DEFAULT_LOCALE;
};

export const persistLocale = (locale: AppLocale, storage: Pick<Storage, "setItem">): boolean => {
  try {
    storage.setItem(LOCALE_STORAGE_KEY, locale);
    return true;
  } catch {
    return false;
  }
};

export const resolveInitialLocale = ({
  languages,
  readStoredLocale,
}: {
  languages: readonly string[];
  readStoredLocale: () => unknown;
}): AppLocale => {
  try {
    const storedLocale = readStoredLocale();
    if (isAppLocale(storedLocale)) return storedLocale;
  } catch {
    // Storage can be unavailable in privacy-restricted browsers.
  }
  return detectBrowserLocale(languages);
};
