import { describe, expect, it } from "vitest";

import ar from "../../messages/ar.json";
import en from "../../messages/en.json";
import es from "../../messages/es.json";
import fr from "../../messages/fr.json";
import ru from "../../messages/ru.json";
import zh from "../../messages/zh.json";

const translatedCatalogs = { ar, es, fr, ru, zh } as const;

const flattenMessages = (value: unknown, prefix = ""): Array<[string, string]> => {
  if (typeof value === "string") return [[prefix, value]];
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];

  return Object.entries(value).flatMap(([key, nestedValue]) =>
    flattenMessages(nestedValue, prefix ? `${prefix}.${key}` : key),
  );
};

const getParameters = (message: string) =>
  [...message.matchAll(/\{([A-Za-z][A-Za-z0-9]*)(?:,|\})/gu)]
    .map((match) => match[1])
    .filter((value): value is string => Boolean(value))
    .sort();

describe("locale catalogs", () => {
  it("have identical non-empty message leaves", () => {
    const englishMessages = flattenMessages(en);
    expect(englishMessages.every(([, value]) => value.trim().length > 0)).toBe(true);
    for (const catalog of Object.values(translatedCatalogs)) {
      const translatedMessages = flattenMessages(catalog);
      expect(translatedMessages.map(([key]) => key)).toEqual(englishMessages.map(([key]) => key));
      expect(translatedMessages.every(([, value]) => value.trim().length > 0)).toBe(true);
      expect(translatedMessages.map(([, value]) => getParameters(value))).toEqual(
        englishMessages.map(([, value]) => getParameters(value)),
      );
      expect(translatedMessages.map(([, value]) => value).join("\n")).not.toMatch(
        /ZQ{1,2}PH|QXZ/iu,
      );
    }
  });

  it("uses Team terminology throughout the Russian catalog", () => {
    const russianText = flattenMessages(ru)
      .map(([, value]) => value)
      .join("\n");

    expect(russianText).not.toMatch(
      /\u043f\u043e\u0434\u0440\u0430\u0437\u0434\u0435\u043b|\u044e\u043d\u0438\u0442/iu,
    );
    expect(ru.Ui.Units).toBe("\u041a\u043e\u043c\u0430\u043d\u0434\u044b");
  });

  it("does not silently fall back to source keys in translated catalogs", () => {
    const allowedIdenticalValues: Partial<Record<keyof typeof translatedCatalogs, Set<string>>> = {
      ar: new Set(["Org Tools", "UUID", "{label}: {count}"]),
      es: new Set(["Avatar", "Aurora", "Color", "Editor", "Org Tools", "UUID", "Zoom"]),
      fr: new Set([
        "Actions",
        "Air",
        "Avatar",
        "Aurora",
        "Cyan",
        "Date",
        "Format",
        "Graphite",
        "Image",
        "Option",
        "Options",
        "Orange",
        "Org Tools",
        "Positions",
        "Rose",
        "Transparent",
        "UUID",
        "Zoom",
      ]),
      ru: new Set(["Org Tools"]),
      zh: new Set(["Org Tools", "UUID"]),
    };

    for (const [locale, catalog] of Object.entries(translatedCatalogs)) {
      const untranslated = Object.entries(catalog.Ui)
        .filter(
          ([key, value]) =>
            key === value &&
            !allowedIdenticalValues[locale as keyof typeof translatedCatalogs]?.has(value),
        )
        .map(([key]) => key);
      expect(untranslated).toEqual([]);
    }
  });

  it("does not retain encoded markup or source-language workflow copy", () => {
    const sourceWorkflowTerms = /\b(?:Employee|Employees|Live Unit|Paste|download|Save|Copy)\b/iu;

    for (const catalog of Object.values(translatedCatalogs)) {
      const translatedText = flattenMessages(catalog)
        .map(([, value]) => value)
        .join("\n");
      const productCopy = translatedText
        .replace(/Org Tools|JSON|PNG|JPEG|WebP|UUID|HTTP\(S\)|HTTP|HTTPS|MD5|SHA-256|MiB/gu, "")
        .replace(/`[^`]+`/gu, "");

      expect(translatedText).not.toMatch(/&(?:amp|apos|quot);/u);
      expect(productCopy).not.toMatch(sourceWorkflowTerms);
    }
  });
});
