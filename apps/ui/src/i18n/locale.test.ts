import { describe, expect, it } from "vitest";

import {
  detectBrowserLocale,
  isAppLocale,
  normalizeBrowserLocale,
  persistLocale,
  resolveInitialLocale,
} from "./locale";

describe("application locale", () => {
  it("accepts only supported persisted values", () => {
    expect(isAppLocale("en")).toBe(true);
    expect(isAppLocale("ru")).toBe(true);
    expect(isAppLocale("de")).toBe(false);
  });

  it("normalizes supported browser language tags", () => {
    expect(normalizeBrowserLocale("ru-RU")).toBe("ru");
    expect(normalizeBrowserLocale("en_US")).toBe("en");
    expect(normalizeBrowserLocale("fr-FR")).toBeNull();
  });

  it("selects the first supported browser language and falls back to English", () => {
    expect(detectBrowserLocale(["fr-FR", "ru-RU", "en-US"])).toBe("ru");
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
