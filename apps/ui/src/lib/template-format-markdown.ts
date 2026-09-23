import { isSafeEmployeeDisplayHref } from "@/lib/employee-display";

export type TemplateFormatSelection = {
  end: number;
  start: number;
};

export type TemplateFormatEdit = {
  selection: TemplateFormatSelection;
  value: string;
};

export type TemplateFormatLink = {
  label: string;
  linkEnd: number;
  linkStart: number;
  selection: TemplateFormatSelection;
  url: string;
};

const normalizedSelection = (value: string, selection: TemplateFormatSelection) => ({
  end: Math.max(0, Math.min(value.length, Math.max(selection.start, selection.end))),
  start: Math.max(0, Math.min(value.length, Math.min(selection.start, selection.end))),
});

export const toggleTemplateFormatMarkdown = (
  value: string,
  selection: TemplateFormatSelection,
  delimiter: "**" | "_" | "`" | "~~",
): TemplateFormatEdit => {
  const range = normalizedSelection(value, selection);
  const selected = value.slice(range.start, range.end);
  const before = value.slice(Math.max(0, range.start - delimiter.length), range.start);
  const after = value.slice(range.end, range.end + delimiter.length);
  if (before === delimiter && after === delimiter) {
    return {
      selection: {
        end: range.end - delimiter.length,
        start: range.start - delimiter.length,
      },
      value: `${value.slice(0, range.start - delimiter.length)}${selected}${value.slice(
        range.end + delimiter.length,
      )}`,
    };
  }
  if (
    selected.length >= delimiter.length * 2 &&
    selected.startsWith(delimiter) &&
    selected.endsWith(delimiter)
  ) {
    const content = selected.slice(delimiter.length, -delimiter.length);
    return {
      selection: { end: range.start + content.length, start: range.start },
      value: `${value.slice(0, range.start)}${content}${value.slice(range.end)}`,
    };
  }
  return {
    selection: {
      end: range.end + delimiter.length,
      start: range.start + delimiter.length,
    },
    value: `${value.slice(0, range.start)}${delimiter}${selected}${delimiter}${value.slice(
      range.end,
    )}`,
  };
};

export const findTemplateFormatMarkdownLink = (
  value: string,
  selection: TemplateFormatSelection,
): TemplateFormatLink | null => {
  const range = normalizedSelection(value, selection);
  const pattern = /\[([^\]\n]+)\]\(([^)\n]*)\)/gu;
  for (const match of value.matchAll(pattern)) {
    const linkStart = match.index ?? 0;
    const linkEnd = linkStart + match[0].length;
    const labelStart = linkStart + 1;
    const labelEnd = labelStart + (match[1]?.length ?? 0);
    const selectionInsideLabel = range.start >= labelStart && range.end <= labelEnd;
    const selectionContainsLink = range.start <= linkStart && range.end >= linkEnd;
    if (!selectionInsideLabel && !selectionContainsLink) continue;
    return {
      label: match[1] ?? "",
      linkEnd,
      linkStart,
      selection: { end: labelEnd, start: labelStart },
      url: match[2] ?? "",
    };
  }
  return null;
};

export const applyTemplateFormatMarkdownLink = (
  value: string,
  selection: TemplateFormatSelection,
  url: string,
): TemplateFormatEdit | null => {
  const safeUrl = url.trim();
  if (!isSafeEmployeeDisplayHref(safeUrl)) return null;
  const existing = findTemplateFormatMarkdownLink(value, selection);
  const range = normalizedSelection(value, selection);
  const label = existing?.label ?? value.slice(range.start, range.end);
  if (!label) return null;
  const start = existing?.linkStart ?? range.start;
  const end = existing?.linkEnd ?? range.end;
  const replacement = `[${label}](${safeUrl})`;
  return {
    selection: { end: start + 1 + label.length, start: start + 1 },
    value: `${value.slice(0, start)}${replacement}${value.slice(end)}`,
  };
};

export const removeTemplateFormatMarkdownLink = (
  value: string,
  selection: TemplateFormatSelection,
): TemplateFormatEdit | null => {
  const existing = findTemplateFormatMarkdownLink(value, selection);
  if (!existing) return null;
  return {
    selection: {
      end: existing.linkStart + existing.label.length,
      start: existing.linkStart,
    },
    value: `${value.slice(0, existing.linkStart)}${existing.label}${value.slice(existing.linkEnd)}`,
  };
};
