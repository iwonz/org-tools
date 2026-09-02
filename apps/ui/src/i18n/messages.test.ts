import { describe, expect, it } from "vitest";

import en from "../../messages/en.json";
import ru from "../../messages/ru.json";

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
    const russianMessages = flattenMessages(ru);

    expect(russianMessages.map(([key]) => key)).toEqual(englishMessages.map(([key]) => key));
    expect(englishMessages.every(([, value]) => value.trim().length > 0)).toBe(true);
    expect(russianMessages.every(([, value]) => value.trim().length > 0)).toBe(true);
    expect(russianMessages.map(([, value]) => getParameters(value))).toEqual(
      englishMessages.map(([, value]) => getParameters(value)),
    );
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

  it("does not silently fall back to source keys in the Russian UI", () => {
    const allowedEnglishValues = new Set(["CSV", "English", "Org Tools"]);
    const untranslated = Object.entries(ru.Ui)
      .filter(([key, value]) => key === value && !allowedEnglishValues.has(value))
      .map(([key]) => key);

    expect(untranslated).toEqual([]);
  });
});
