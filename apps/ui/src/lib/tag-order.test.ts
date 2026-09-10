import { describe, expect, test } from "vitest";
import {
  createTagOrderIndex,
  moveCatalogTag,
  normalizeTagSearchValue,
  orderByTagCatalog,
} from "@/lib/tag-order";

describe("Catalog Tag ordering", () => {
  const tags = [
    { id: "3", label: "Zulu" },
    { id: "2", label: "Beta" },
    { id: "1", label: "Alpha" },
  ];
  test("orders resolved assignments by catalog identity without changing the source", () => {
    const assignments = [
      { tagId: "1", date: null },
      { tagId: "3", date: "2026-09-10" },
    ];
    expect(
      orderByTagCatalog(
        assignments,
        createTagOrderIndex(tags.map((tag) => tag.id)),
        (tag) => tag.tagId,
      ),
    ).toEqual([assignments[1], assignments[0]]);
    expect(assignments[0]?.tagId).toBe("1");
  });
  test("moves relative to a target while preserving hidden Tags", () => {
    expect(moveCatalogTag(tags, "1", "3", "before").map((tag) => tag.id)).toEqual(["1", "3", "2"]);
    expect(moveCatalogTag(tags, "3", "1", "after").map((tag) => tag.id)).toEqual(["2", "1", "3"]);
  });
  test("retains the original reference for invalid and unchanged moves", () => {
    expect(moveCatalogTag(tags, "3", "3", "before")).toBe(tags);
    expect(moveCatalogTag(tags, "3", "2", "before")).toBe(tags);
    expect(moveCatalogTag(tags, "missing", "1", "after")).toBe(tags);
    expect(moveCatalogTag(tags, "1", "missing", "after")).toBe(tags);
  });
  test("normalizes case and combining marks for search", () => {
    expect(normalizeTagSearchValue("Développement")).toBe("developpement");
  });
});
