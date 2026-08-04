export const APP_LOCALES = ["en", "ru"] as const;
export type AppLocale = (typeof APP_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "en";
export const LOCALE_STORAGE_KEY = "org-tools-locale";

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
