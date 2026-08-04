import type { EmployeeId, EmployeeSearchDocument, EmployeeTag } from "@org-tools/types";

import { LocalizedError, uiMessage } from "@/i18n/messages";
import { normalizeSearchValue } from "@/lib/search-index";

const EMPLOYEE_TAG_COLLATOR = new Intl.Collator("en", {
  numeric: true,
  sensitivity: "base",
});

export const compareEmployeeTagLabels = (firstTag: string, secondTag: string) =>
  EMPLOYEE_TAG_COLLATOR.compare(firstTag, secondTag);

export const compareEmployeeTags = (firstTag: EmployeeTag, secondTag: EmployeeTag) =>
  compareEmployeeTagLabels(firstTag.label, secondTag.label);

export const sortEmployeeTagLabels = (tags: readonly string[]) =>
  [...tags].sort(compareEmployeeTagLabels);

export const sortEmployeeTags = (tags: readonly EmployeeTag[]) =>
  [...tags].sort(compareEmployeeTags);

export const orderEmployeeTagsForDisplay = (
  tags: readonly EmployeeTag[],
  queryTokens: readonly string[] = [],
) => {
  const sortedTags = sortEmployeeTags(tags);
  if (queryTokens.length === 0) return sortedTags;

  const matchingTags: EmployeeTag[] = [];
  const otherTags: EmployeeTag[] = [];

  for (const tag of sortedTags) {
    const normalizedTag = normalizeSearchValue(tag.label);
    const target = queryTokens.some((token) => normalizedTag.includes(token))
      ? matchingTags
      : otherTags;
    target.push(tag);
  }

  return [...matchingTags, ...otherTags];
};

export const isValidEmployeeTagDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year ?? 0, (month ?? 0) - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === (month ?? 0) - 1 &&
    date.getUTCDate() === day
  );
};

export const normalizeEmployeeTagDate = (value: string | null | undefined): string | null => {
  if (value === null || value === undefined || value.trim() === "") return null;
  const normalized = value.trim();
  if (!isValidEmployeeTagDate(normalized)) {
    throw new LocalizedError(uiMessage("Employee tag date is invalid."));
  }
  return normalized;
};

export const getEmployeeTagLabels = (tags: readonly EmployeeTag[]): string[] =>
  tags.map(({ label }) => label);

export const findEmployeeTag = (
  tags: readonly EmployeeTag[],
  label: string,
): EmployeeTag | undefined => {
  const normalizedLabel = normalizeSearchValue(label);
  return tags.find((tag) => normalizeSearchValue(tag.label) === normalizedLabel);
};

export const normalizeEmployeeTags = (tags: readonly (EmployeeTag | string)[]): EmployeeTag[] => {
  const normalizedLabelSet = new Set<string>();
  const normalizedTags: EmployeeTag[] = [];

  for (const rawTag of tags) {
    const label = (typeof rawTag === "string" ? rawTag : rawTag.label).trim();
    const normalizedTag = normalizeSearchValue(label);

    if (!normalizedTag || normalizedLabelSet.has(normalizedTag)) continue;

    normalizedLabelSet.add(normalizedTag);
    normalizedTags.push({
      date: typeof rawTag === "string" ? null : normalizeEmployeeTagDate(rawTag.date),
      label,
    });
  }

  return normalizedTags;
};

export const getEmployeeTagOptionsFromSearchDocuments = (
  employeeSearchDocuments: EmployeeSearchDocument[],
) => {
  const optionByNormalizedLabel = new Map<string, string>();

  for (const document of employeeSearchDocuments) {
    for (const tag of document.tagLabels) {
      const normalizedTag = normalizeSearchValue(tag);

      if (!optionByNormalizedLabel.has(normalizedTag)) {
        optionByNormalizedLabel.set(normalizedTag, tag);
      }
    }
  }

  return sortEmployeeTagLabels([...optionByNormalizedLabel.values()]);
};

export type EmployeeTagTarget = {
  id: EmployeeId;
  tags: readonly EmployeeTag[];
};

export type EmployeeTagUpdate = {
  employeeId: EmployeeId;
  tags: EmployeeTag[];
};

export const getEmployeeTagSelectionState = (
  employees: readonly EmployeeTagTarget[],
  tag: string,
): boolean | "indeterminate" => {
  const normalizedTag = normalizeSearchValue(tag);
  if (!normalizedTag || employees.length === 0) return false;

  let selectedCount = 0;

  for (const employee of employees) {
    if (
      employee.tags.some((employeeTag) => normalizeSearchValue(employeeTag.label) === normalizedTag)
    ) {
      selectedCount += 1;
    }
  }

  if (selectedCount === 0) return false;
  if (selectedCount === employees.length) return true;
  return "indeterminate";
};

export const createEmployeeTagUpdates = ({
  employees,
  selected,
  tag,
}: {
  employees: readonly EmployeeTagTarget[];
  selected: boolean;
  tag: string;
}): EmployeeTagUpdate[] => {
  const normalizedTag = normalizeSearchValue(tag);
  if (!normalizedTag) return [];

  const employeeById = new Map<EmployeeId, EmployeeTagTarget>();
  for (const employee of employees) {
    if (!employeeById.has(employee.id)) employeeById.set(employee.id, employee);
  }

  return [...employeeById.values()].flatMap((employee) => {
    const hasTag = employee.tags.some(
      (employeeTag) => normalizeSearchValue(employeeTag.label) === normalizedTag,
    );
    if (hasTag === selected) return [];

    return [
      {
        employeeId: employee.id,
        tags: selected
          ? normalizeEmployeeTags([...employee.tags, { date: null, label: tag }])
          : employee.tags.filter(
              (employeeTag) => normalizeSearchValue(employeeTag.label) !== normalizedTag,
            ),
      },
    ];
  });
};

export const getEmployeeTagDateSelectionState = (
  employees: readonly EmployeeTagTarget[],
  tag: string,
): string | null | "mixed" => {
  const normalizedTag = normalizeSearchValue(tag);
  const dates = new Set<string | null>();
  for (const employee of employees) {
    const match = employee.tags.find(
      (employeeTag) => normalizeSearchValue(employeeTag.label) === normalizedTag,
    );
    if (match) dates.add(match.date);
  }
  if (dates.size === 0) return null;
  if (dates.size > 1) return "mixed";
  return [...dates][0] ?? null;
};

export const createEmployeeTagDateUpdates = ({
  date,
  employees,
  tag,
}: {
  date: string | null;
  employees: readonly EmployeeTagTarget[];
  tag: string;
}): EmployeeTagUpdate[] => {
  const normalizedTag = normalizeSearchValue(tag);
  const normalizedDate = normalizeEmployeeTagDate(date);
  return employees.flatMap((employee) => {
    const current = employee.tags.find(
      (employeeTag) => normalizeSearchValue(employeeTag.label) === normalizedTag,
    );
    if (!current || current.date === normalizedDate) return [];
    return [
      {
        employeeId: employee.id,
        tags: employee.tags.map((employeeTag) =>
          normalizeSearchValue(employeeTag.label) === normalizedTag
            ? { ...employeeTag, date: normalizedDate }
            : employeeTag,
        ),
      },
    ];
  });
};

export const toggleEmployeeTagForTargets = (
  employees: readonly EmployeeTagTarget[],
  tag: string,
): EmployeeTagUpdate[] =>
  createEmployeeTagUpdates({
    employees,
    selected: getEmployeeTagSelectionState(employees, tag) !== true,
    tag,
  });
