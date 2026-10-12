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
): readonly T[] => moveCatalogTags(tags, [sourceId], targetId, placement);

export const moveCatalogTags = <T extends { id: TagId }>(
  tags: readonly T[],
  sourceIds: readonly TagId[],
  targetId: TagId,
  placement: "before" | "after",
): readonly T[] => {
  const sourceIdSet = new Set(sourceIds);
  if (sourceIdSet.size === 0 || sourceIdSet.has(targetId)) return tags;
  const sources = tags.filter((tag) => sourceIdSet.has(tag.id));
  if (sources.length !== sourceIdSet.size || !tags.some((tag) => tag.id === targetId)) return tags;
  const next = tags.filter((tag) => !sourceIdSet.has(tag.id));
  const targetIndex = next.findIndex((tag) => tag.id === targetId);
  next.splice(targetIndex + (placement === "after" ? 1 : 0), 0, ...sources);
  return next.every((tag, index) => tag === tags[index]) ? tags : next;
};
