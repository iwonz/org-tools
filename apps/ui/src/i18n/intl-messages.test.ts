import { describe, expect, it } from "vitest";

import enMessages from "../../messages/en.json";
import ruMessages from "../../messages/ru.json";
import { encodeUiMessageKey, prepareMessagesForNextIntl } from "./intl-messages";

describe("next-intl message preparation", () => {
  it("does not retain a downloaded-file success label", () => {
    expect(enMessages.Ui).not.toHaveProperty("File downloaded");
    expect(ruMessages.Ui).not.toHaveProperty("File downloaded");
  });

  it("encodes sentence periods without changing translated values", () => {
    const english = prepareMessagesForNextIntl(enMessages);
    const russian = prepareMessagesForNextIntl(ruMessages);
    const sourceKey = "Could not read or parse the selected file.";
    const encodedKey = encodeUiMessageKey(sourceKey);

    expect(encodedKey).not.toContain(".");
    expect(Object.keys(english.Ui).every((key) => !key.includes("."))).toBe(true);
    expect(Object.keys(russian.Ui).every((key) => !key.includes("."))).toBe(true);
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
