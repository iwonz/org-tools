import type { AppLocale } from "@org-tools/types";

export type TagLabelEntry<TId extends string = string> = {
  id: TId;
  label: string;
};

export const normalizeTagSearchValue = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toLocaleLowerCase("en-US");

export const sortTagsByLocalizedLabel = <TEntry extends TagLabelEntry>(
  entries: readonly TEntry[],
  locale: AppLocale,
): TEntry[] => {
  const collator = new Intl.Collator(locale, { numeric: true, sensitivity: "base" });
  return [...entries].sort(
    (first, second) =>
      collator.compare(first.label, second.label) ||
      String(first.id).localeCompare(String(second.id), "en"),
  );
};
