import type { TagId } from "@org-tools/types";

export const normalizeTagSearchValue = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toLocaleLowerCase("en-US");

/** The catalog array is the only persisted source of Tag priority. */
export const createTagOrderIndex = (tagIds: readonly TagId[]): ReadonlyMap<TagId, number> =>
  new Map(tagIds.map((id, index) => [id, index]));

export const orderByTagCatalog = <T>(
  entries: readonly T[],
  orderById: ReadonlyMap<TagId, number>,
  getTagId: (entry: T) => TagId,
): T[] =>
  [...entries].sort(
    (first, second) =>
      (orderById.get(getTagId(first)) ?? Number.MAX_SAFE_INTEGER) -
      (orderById.get(getTagId(second)) ?? Number.MAX_SAFE_INTEGER),
  );

export const moveCatalogTag = <T extends { id: TagId }>(
  tags: readonly T[],
  sourceId: TagId,
  targetId: TagId,
  placement: "before" | "after",
): readonly T[] => {
  if (sourceId === targetId) return tags;
  const source = tags.find((tag) => tag.id === sourceId);
  if (!source || !tags.some((tag) => tag.id === targetId)) return tags;
  const next = tags.filter((tag) => tag.id !== sourceId);
  const targetIndex = next.findIndex((tag) => tag.id === targetId);
  next.splice(targetIndex + (placement === "after" ? 1 : 0), 0, source);
  return next.every((tag, index) => tag === tags[index]) ? tags : next;
};
