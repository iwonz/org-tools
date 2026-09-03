import { describe, expect, it } from "vitest";

import {
  APP_LOCALE_CONFIG,
  detectBrowserLocale,
  isAppLocale,
  normalizeBrowserLocale,
  persistLocale,
  resolveInitialLocale,
} from "./locale";

describe("application locale", () => {
  it("accepts only supported persisted values", () => {
    for (const locale of ["en", "zh", "ru", "es", "fr", "ar"]) {
      expect(isAppLocale(locale)).toBe(true);
    }
    expect(isAppLocale("de")).toBe(false);
  });

  it("declares Arabic RTL while preserving LTR for the other locales", () => {
    expect(APP_LOCALE_CONFIG.ar.direction).toBe("rtl");
    for (const locale of ["en", "es", "fr", "ru", "zh"] as const) {
      expect(APP_LOCALE_CONFIG[locale].direction).toBe("ltr");
    }
  });

  it("normalizes supported browser language tags", () => {
    expect(normalizeBrowserLocale("ru-RU")).toBe("ru");
    expect(normalizeBrowserLocale("en_US")).toBe("en");
    expect(normalizeBrowserLocale("zh-Hans-CN")).toBe("zh");
    expect(normalizeBrowserLocale("ar-SA")).toBe("ar");
    expect(normalizeBrowserLocale("fr-FR")).toBe("fr");
  });

  it("selects the first supported browser language and falls back to English", () => {
    expect(detectBrowserLocale(["de-DE", "fr-FR", "ru-RU"])).toBe("fr");
    expect(detectBrowserLocale(["de-DE"])).toBe("en");
  });

  it("prefers a valid saved locale", () => {
    expect(resolveInitialLocale({ languages: ["ru-RU"], readStoredLocale: () => "en" })).toBe("en");
  });

  it("detects a locale when storage is invalid or unavailable", () => {
    expect(resolveInitialLocale({ languages: ["ru-RU"], readStoredLocale: () => "invalid" })).toBe(
      "ru",
    );
    expect(
      resolveInitialLocale({
        languages: ["ru-RU"],
        readStoredLocale: () => {
          throw new Error("Storage unavailable");
        },
      }),
    ).toBe("ru");
  });

  it("persists the locale when storage is available and tolerates write failures", () => {
    const values = new Map<string, string>();
    expect(
      persistLocale("ru", {
        setItem: (key, value) => values.set(key, value),
      }),
    ).toBe(true);
    expect(values.get("org-tools-locale")).toBe("ru");

    expect(
      persistLocale("en", {
        setItem: () => {
          throw new Error("Storage unavailable");
        },
      }),
    ).toBe(false);
  });
});
