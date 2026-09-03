import { describe, expect, it } from "vitest";

import arMessages from "../../messages/ar.json";
import enMessages from "../../messages/en.json";
import esMessages from "../../messages/es.json";
import frMessages from "../../messages/fr.json";
import ruMessages from "../../messages/ru.json";
import zhMessages from "../../messages/zh.json";
import { encodeUiMessageKey, prepareMessagesForNextIntl } from "./intl-messages";

describe("next-intl message preparation", () => {
  it("does not retain a downloaded-file success label", () => {
    expect(enMessages.Ui).not.toHaveProperty("File downloaded");
    expect(ruMessages.Ui).not.toHaveProperty("File downloaded");
    expect(zhMessages.Ui).not.toHaveProperty("File downloaded");
    expect(esMessages.Ui).not.toHaveProperty("File downloaded");
    expect(frMessages.Ui).not.toHaveProperty("File downloaded");
    expect(arMessages.Ui).not.toHaveProperty("File downloaded");
  });

  it("encodes sentence periods without changing translated values", () => {
    const english = prepareMessagesForNextIntl(enMessages);
    const russian = prepareMessagesForNextIntl(ruMessages);
    const catalogs = [enMessages, zhMessages, ruMessages, esMessages, frMessages, arMessages];
    const sourceKey = "Could not read or parse the selected file.";
    const encodedKey = encodeUiMessageKey(sourceKey);

    expect(encodedKey).not.toContain(".");
    for (const catalog of catalogs) {
      const prepared = prepareMessagesForNextIntl(catalog);
      expect(Object.keys(prepared.Ui).every((key) => !key.includes("."))).toBe(true);
      expect(prepared.Ui[encodedKey as keyof typeof prepared.Ui]).toBe(catalog.Ui[sourceKey]);
    }
    expect(english.Ui[encodedKey as keyof typeof english.Ui]).toBe(enMessages.Ui[sourceKey]);
    expect(russian.Ui[encodedKey as keyof typeof russian.Ui]).toBe(ruMessages.Ui[sourceKey]);
  });

  it("rejects encoding collisions and dotted semantic namespaces", () => {
    const catalog = {
      Counts: { employees: "Employees" },
      Metadata: { title: "Title" },
      Ui: {
        "A.B": "First",
        A__org_tools_period__B: "Second",
      },
    };
    expect(() => prepareMessagesForNextIntl(catalog)).toThrow(/encoding collision/u);
    expect(() =>
      prepareMessagesForNextIntl({
        ...catalog,
        Counts: { "invalid.key": "Invalid" },
        Ui: {},
      }),
    ).toThrow(/Counts message keys/u);
  });
});
