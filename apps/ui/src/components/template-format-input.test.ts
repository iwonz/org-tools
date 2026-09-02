import { describe, expect, it } from "vitest";

import {
  getActiveTemplateFormatQuery,
  getTemplateFormatKeyAction,
  replaceTemplateFormatQuery,
} from "@/lib/template-format-suggestions";

describe("Template Format token query", () => {
  it("finds only the active query immediately before the caret", () => {
    expect(getActiveTemplateFormatQuery("Hello @full", 11)).toEqual({
      end: 11,
      start: 6,
      value: "full",
    });
    expect(getActiveTemplateFormatQuery("Hello @full ", 12)).toBeNull();
    expect(getActiveTemplateFormatQuery("Hello @ full", 12)).toBeNull();
    expect(getActiveTemplateFormatQuery("{fullName}", 10)).toBeNull();
  });

  it("replaces only the active query with current brace syntax", () => {
    const value = "Hello @full from @unit";
    const query = getActiveTemplateFormatQuery(value, value.length);
    expect(query).not.toBeNull();
    expect(replaceTemplateFormatQuery(value, query as NonNullable<typeof query>, "unitName")).toBe(
      "Hello @full from {unitName}",
    );
  });

  it("maps menu keyboard input without changing closed text controls", () => {
    expect(getTemplateFormatKeyAction("ArrowDown", true)).toBe("move-next");
    expect(getTemplateFormatKeyAction("ArrowUp", true)).toBe("move-previous");
    expect(getTemplateFormatKeyAction("Enter", true)).toBe("insert");
    expect(getTemplateFormatKeyAction("Escape", true)).toBe("close");
    expect(getTemplateFormatKeyAction("Tab", true)).toBe("close");
    expect(getTemplateFormatKeyAction("Backspace", true)).toBe("close");
    expect(getTemplateFormatKeyAction("Backspace", false)).toBe("none");
    expect(getTemplateFormatKeyAction(" ", true)).toBe("none");
  });
});
