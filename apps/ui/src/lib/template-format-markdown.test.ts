import { describe, expect, test } from "vitest";

import {
  applyTemplateFormatMarkdownLink,
  findTemplateFormatMarkdownLink,
  removeTemplateFormatMarkdownLink,
  toggleTemplateFormatMarkdown,
} from "@/lib/template-format-markdown";

describe("Template format Markdown edits", () => {
  test("wraps and unwraps a selected Markdown mark", () => {
    const wrapped = toggleTemplateFormatMarkdown("Avery Stone", { end: 11, start: 0 }, "**");
    expect(wrapped).toEqual({
      selection: { end: 13, start: 2 },
      value: "**Avery Stone**",
    });
    expect(toggleTemplateFormatMarkdown(wrapped.value, wrapped.selection, "**")).toEqual({
      selection: { end: 11, start: 0 },
      value: "Avery Stone",
    });
  });

  test("creates, discovers, edits, and removes a safe link", () => {
    const created = applyTemplateFormatMarkdownLink(
      "Open profile",
      { end: 12, start: 5 },
      "https://example.test/profile",
    );
    expect(created).toEqual({
      selection: { end: 13, start: 6 },
      value: "Open [profile](https://example.test/profile)",
    });
    expect(
      created && findTemplateFormatMarkdownLink(created.value, created.selection),
    ).toMatchObject({
      label: "profile",
      url: "https://example.test/profile",
    });
    const edited =
      created &&
      applyTemplateFormatMarkdownLink(
        created.value,
        created.selection,
        "mailto:avery@example.test",
      );
    expect(edited?.value).toBe("Open [profile](mailto:avery@example.test)");
    expect(edited && removeTemplateFormatMarkdownLink(edited.value, edited.selection)).toEqual({
      selection: { end: 12, start: 5 },
      value: "Open profile",
    });
  });

  test("rejects empty and unsafe links without changing text", () => {
    expect(
      applyTemplateFormatMarkdownLink("Link", { end: 4, start: 0 }, "javascript:alert(1)"),
    ).toBeNull();
    expect(applyTemplateFormatMarkdownLink("Link", { end: 4, start: 0 }, "/relative")).toBeNull();
  });
});
