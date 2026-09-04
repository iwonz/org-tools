import { describe, expect, test } from "vitest";

import { normalizeTagSearchValue, sortTagsByLocalizedLabel } from "@/lib/tag-order";

describe("Tag discovery ordering", () => {
  test("sorts by the active locale with stable ID tie-breaking", () => {
    const tags = [
      { id: "3", label: "Tag 10" },
      { id: "2", label: "Tag 2" },
      { id: "1", label: "tag 2" },
    ];

    expect(sortTagsByLocalizedLabel(tags, "en").map((tag) => tag.id)).toEqual(["1", "2", "3"]);
  });

  test("normalizes case and combining marks for search", () => {
    expect(normalizeTagSearchValue("  ÉQUIPE  ")).toContain("equipe");
    expect(normalizeTagSearchValue("Développement")).toBe("developpement");
  });
});
