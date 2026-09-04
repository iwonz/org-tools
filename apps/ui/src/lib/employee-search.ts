import type {
  Employee,
  EmployeeCustomFieldFilter,
  EmployeeGender,
  EmployeeId,
  EmployeeSearchDocument,
  TagId,
  UnitId,
} from "@org-tools/types";

import type { EmployeeUnitMembership } from "@/lib/employee-unit-contexts";

export type EmployeeBirthdayFilter = {
  day: number;
  month: number;
  year: number;
};

export type EmployeeSearchFilters = {
  birthday: EmployeeBirthdayFilter | null;
  customFields: EmployeeCustomFieldFilter[];
  includeWithoutTags: boolean;
  includeWithoutUnits: boolean;
  selectedGenders: EmployeeGender[];
  selectedPositions: string[];
  selectedTags: TagId[];
  selectedUnitIds: UnitId[];
};

export const createEmptyEmployeeSearchFilters = (): EmployeeSearchFilters => ({
  birthday: null,
  customFields: [],
  includeWithoutTags: false,
  includeWithoutUnits: false,
  selectedGenders: [],
  selectedPositions: [],
  selectedTags: [],
  selectedUnitIds: [],
});

export const selectAllEmployeeFilterTags = (
  filters: EmployeeSearchFilters,
  visibleTagIds: readonly TagId[],
): EmployeeSearchFilters => ({
  ...filters,
  selectedTags: [...new Set([...filters.selectedTags, ...visibleTagIds])],
});

export const deselectAllEmployeeFilterTags = (
  filters: EmployeeSearchFilters,
  visibleTagIds: readonly TagId[],
): EmployeeSearchFilters => {
  const visibleTags = new Set(visibleTagIds);
  return {
    ...filters,
    selectedTags: filters.selectedTags.filter((tagId) => !visibleTags.has(tagId)),
  };
};

export const getEmployeeSearchFiltersKey = (filters: EmployeeSearchFilters) =>
  [
    filters.selectedGenders.join("|"),
    filters.selectedPositions.join("|"),
    filters.selectedTags.join("|"),
    filters.selectedUnitIds.join("|"),
    filters.includeWithoutTags ? "without-tags" : "",
    filters.includeWithoutUnits ? "without-units" : "",
    filters.birthday === null
      ? ""
      : `${filters.birthday.day}.${filters.birthday.month}.${filters.birthday.year}`,
    ...filters.customFields.map(
      (filter) =>
        `${filter.fieldId}=${filter.includeUnset ? "unset|" : ""}${filter.selectedValues.join("|")}`,
    ),
  ].join(":");

export const hasActiveEmployeeSearchFilters = (filters: EmployeeSearchFilters) =>
  filters.selectedGenders.length > 0 ||
  filters.selectedPositions.length > 0 ||
  filters.selectedTags.length > 0 ||
  filters.selectedUnitIds.length > 0 ||
  filters.includeWithoutTags ||
  filters.includeWithoutUnits ||
  filters.birthday !== null ||
  filters.customFields.some((filter) => filter.includeUnset || filter.selectedValues.length > 0);

export const pruneEmployeeSearchFilters = (
  filters: EmployeeSearchFilters,
  availableUnitIds: Pick<ReadonlySet<UnitId>, "has">,
): EmployeeSearchFilters => ({
  ...filters,
  selectedUnitIds: filters.selectedUnitIds.filter((unitId) => availableUnitIds.has(unitId)),
});

export const employeeSearchDocumentMatches = ({
  document,
  filters,
  membership,
  queryTokens,
  unitAbsenceScope = "all",
}: {
  document: EmployeeSearchDocument;
  filters: EmployeeSearchFilters;
  membership: EmployeeUnitMembership | undefined;
  queryTokens: string[];
  unitAbsenceScope?: "all" | "manual";
}) => {
  if (queryTokens.length > 0) {
    if (!queryTokens.every((token) => document.searchText.includes(token))) {
      return false;
    }
  }

  if (filters.selectedPositions.length > 0) {
    if (!filters.selectedPositions.some((position) => document.positionLabelSet.has(position))) {
      return false;
    }
  }

  if (filters.selectedGenders.length > 0 && !filters.selectedGenders.includes(document.gender)) {
    return false;
  }

  if (filters.selectedTags.length > 0 || filters.includeWithoutTags) {
    const hasSelectedTag = filters.selectedTags.some((tag) => document.tagIdSet.has(tag));
    const matchesWithoutTags = filters.includeWithoutTags && document.tagIdSet.size === 0;

    if (!hasSelectedTag && !matchesWithoutTags) {
      return false;
    }
  }

  if (filters.selectedUnitIds.length > 0 || filters.includeWithoutUnits) {
    const hasSelectedUnit =
      membership !== undefined &&
      filters.selectedUnitIds.some((unitId) => membership.unitIdSet.has(unitId));
    const unitIdSet =
      unitAbsenceScope === "manual" ? membership?.manualUnitIdSet : membership?.unitIdSet;
    const matchesWithoutUnits = filters.includeWithoutUnits && (unitIdSet?.size ?? 0) === 0;

    if (!hasSelectedUnit && !matchesWithoutUnits) {
      return false;
    }
  }

  if (
    filters.birthday !== null &&
    document.birthday !==
      `${String(filters.birthday.day).padStart(2, "0")}.${String(filters.birthday.month).padStart(2, "0")}.${filters.birthday.year}`
  ) {
    return false;
  }

  for (const filter of filters.customFields) {
    const value = document.customFieldValues.get(filter.fieldId) ?? null;
    const matchesValue = value !== null && filter.selectedValues.includes(value);
    const matchesUnset = value === null && filter.includeUnset;
    if (!matchesValue && !matchesUnset) return false;
  }

  return true;
};

export const filterEmployeeSearchDocuments = ({
  documents,
  employeeUnitMembershipsByEmployeeId,
  filters,
  queryTokens,
}: {
  documents: EmployeeSearchDocument[];
  employeeUnitMembershipsByEmployeeId?: ReadonlyMap<EmployeeId, EmployeeUnitMembership>;
  filters: EmployeeSearchFilters;
  queryTokens: string[];
}) =>
  documents.filter((document) =>
    employeeSearchDocumentMatches({
      document,
      filters,
      membership: employeeUnitMembershipsByEmployeeId?.get(document.employeeId),
      queryTokens,
    }),
  );

export const filterEmployeesBySearch = ({
  employeeSearchDocumentByEmployeeId,
  employeeUnitMembershipsByEmployeeId,
  employees,
  filters,
  queryTokens,
  unitAbsenceScope = "all",
}: {
  employeeSearchDocumentByEmployeeId: ReadonlyMap<EmployeeId, EmployeeSearchDocument>;
  employeeUnitMembershipsByEmployeeId?: ReadonlyMap<EmployeeId, EmployeeUnitMembership>;
  employees: Employee[];
  filters: EmployeeSearchFilters;
  queryTokens: string[];
  unitAbsenceScope?: "all" | "manual";
}) =>
  employees.filter((employee) => {
    const document = employeeSearchDocumentByEmployeeId.get(employee.id);

    if (!document) return false;

    return employeeSearchDocumentMatches({
      document,
      filters,
      membership: employeeUnitMembershipsByEmployeeId?.get(employee.id),
      queryTokens,
      unitAbsenceScope,
    });
  });

export const getEmployeesForSearch = ({
  employeeSearchDocumentByEmployeeId,
  employeeUnitMembershipsByEmployeeId,
  employees,
  filters,
  queryTokens,
  unitAbsenceScope = "all",
}: {
  employeeSearchDocumentByEmployeeId: ReadonlyMap<EmployeeId, EmployeeSearchDocument>;
  employeeUnitMembershipsByEmployeeId?: ReadonlyMap<EmployeeId, EmployeeUnitMembership>;
  employees: Employee[];
  filters: EmployeeSearchFilters;
  queryTokens: string[];
  unitAbsenceScope?: "all" | "manual";
}) => {
  if (queryTokens.length === 0 && !hasActiveEmployeeSearchFilters(filters)) {
    return employees;
  }

  return filterEmployeesBySearch({
    employeeSearchDocumentByEmployeeId,
    employees,
    filters,
    queryTokens,
    unitAbsenceScope,
    ...(employeeUnitMembershipsByEmployeeId ? { employeeUnitMembershipsByEmployeeId } : {}),
  });
};
