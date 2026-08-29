import type {
  EmployeeId,
  EmployeeLiveFilterRule,
  EmployeeSearchDocument,
  OrgEditorUnit,
  UnitId,
} from "@org-tools/types";

import { LocalizedError, uiMessage } from "@/i18n/messages";

import { type EmployeeSearchFilters, employeeSearchDocumentMatches } from "@/lib/employee-search";
import type { EmployeeUnitMembership } from "@/lib/employee-unit-contexts";
import { getSearchTokens } from "@/lib/search-index";

export const createEmptyEmployeeLiveFilterRule = (): EmployeeLiveFilterRule => ({
  birthday: null,
  includeWithoutTags: false,
  includeWithoutUnits: false,
  query: "",
  selectedPositions: [],
  selectedTags: [],
  selectedUnitIds: [],
});

export const cloneEmployeeLiveFilterRule = (
  rule: EmployeeLiveFilterRule,
): EmployeeLiveFilterRule => ({
  birthday: rule.birthday ? { ...rule.birthday } : null,
  includeWithoutTags: rule.includeWithoutTags,
  includeWithoutUnits: rule.includeWithoutUnits,
  query: rule.query,
  selectedPositions: [...rule.selectedPositions],
  selectedTags: [...rule.selectedTags],
  selectedUnitIds: [...rule.selectedUnitIds],
});

export const hasEmployeeLiveFilterCriteria = (rule: EmployeeLiveFilterRule) =>
  rule.query.trim().length > 0 ||
  rule.birthday !== null ||
  rule.includeWithoutTags ||
  rule.includeWithoutUnits ||
  rule.selectedPositions.length > 0 ||
  rule.selectedTags.length > 0 ||
  rule.selectedUnitIds.length > 0;

export const employeeLiveFilterRuleToSearchFilters = (
  rule: EmployeeLiveFilterRule,
): EmployeeSearchFilters => ({
  birthday: rule.birthday ? { ...rule.birthday } : null,
  includeWithoutTags: rule.includeWithoutTags,
  includeWithoutUnits: rule.includeWithoutUnits,
  selectedGenders: [],
  selectedPositions: [...rule.selectedPositions],
  selectedTags: [...rule.selectedTags],
  selectedUnitIds: [...rule.selectedUnitIds],
});

const getLiveUnitDependencies = (unit: OrgEditorUnit, liveUnitIdSet: ReadonlySet<UnitId>) =>
  [...new Set(unit.liveFilter?.selectedUnitIds ?? [])].filter((unitId) =>
    liveUnitIdSet.has(unitId),
  );

export const getLiveUnitTopologicalOrder = (units: readonly OrgEditorUnit[]): OrgEditorUnit[] => {
  const liveUnits = units.filter((unit) => unit.liveFilter !== null);
  const liveUnitById = new Map(liveUnits.map((unit) => [unit.id, unit] as const));
  const liveUnitIdSet = new Set(liveUnitById.keys());
  const visiting = new Set<UnitId>();
  const visited = new Set<UnitId>();
  const result: OrgEditorUnit[] = [];

  const visit = (unit: OrgEditorUnit) => {
    if (visited.has(unit.id)) return;
    if (visiting.has(unit.id)) {
      throw new LocalizedError(uiMessage("Live Unit rules contain a cyclic dependency."));
    }

    visiting.add(unit.id);
    for (const dependencyId of getLiveUnitDependencies(unit, liveUnitIdSet)) {
      const dependency = liveUnitById.get(dependencyId);
      if (dependency) visit(dependency);
    }
    visiting.delete(unit.id);
    visited.add(unit.id);
    result.push(unit);
  };

  for (const unit of liveUnits) visit(unit);

  return result;
};

export const getInvalidLiveUnitDependencyIds = (
  units: readonly OrgEditorUnit[],
  currentUnitId: UnitId,
) => {
  const invalidIds = new Set<UnitId>([currentUnitId]);
  let changed = true;

  while (changed) {
    changed = false;
    for (const unit of units) {
      if (
        unit.liveFilter &&
        !invalidIds.has(unit.id) &&
        unit.liveFilter.selectedUnitIds.some((unitId) => invalidIds.has(unitId))
      ) {
        invalidIds.add(unit.id);
        changed = true;
      }
    }
  }

  return invalidIds;
};

export const validateEmployeeLiveFilterRule = ({
  rule,
  unitId,
  units,
}: {
  rule: EmployeeLiveFilterRule;
  unitId: UnitId;
  units: readonly OrgEditorUnit[];
}) => {
  if (!hasEmployeeLiveFilterCriteria(rule)) {
    throw new LocalizedError(uiMessage("Enter a search query or select at least one filter."));
  }
  if (rule.selectedUnitIds.includes(unitId)) {
    throw new LocalizedError(uiMessage("A Live Unit cannot reference itself."));
  }

  const hasUnit = units.some((unit) => unit.id === unitId);
  const nextUnits = units.map((unit) =>
    unit.id === unitId ? { ...unit, liveFilter: cloneEmployeeLiveFilterRule(rule) } : unit,
  );
  if (!hasUnit) {
    const now = new Date().toISOString();
    nextUnits.push({
      bossEmployeeId: null,
      collapsed: false,
      createdAt: now,
      employeeIds: [],
      employeePositions: [],
      id: unitId,
      liveFilter: cloneEmployeeLiveFilterRule(rule),
      name: "Live",
      order: 0,
      parentId: null,
      updatedAt: now,
      x: 0,
      y: 0,
    });
  }
  getLiveUnitTopologicalOrder(nextUnits);
};

export type LiveUnitResolution = {
  employeeIdsByUnitId: Map<UnitId, EmployeeId[]>;
  membershipsByEmployeeId: Map<EmployeeId, EmployeeUnitMembership>;
};

/**
 * Resolves Live memberships once per document build. Search documents must be
 * created after applying manual memberships so position filters never consume
 * positions produced by Live Units.
 */
export const resolveLiveUnitMemberships = ({
  documents,
  manualMembershipsByEmployeeId,
  units,
}: {
  documents: readonly EmployeeSearchDocument[];
  manualMembershipsByEmployeeId: ReadonlyMap<EmployeeId, EmployeeUnitMembership>;
  units: readonly OrgEditorUnit[];
}): LiveUnitResolution => {
  const membershipsByEmployeeId = new Map<EmployeeId, EmployeeUnitMembership>();
  for (const document of documents) {
    membershipsByEmployeeId.set(document.employeeId, {
      manualUnitIdSet: new Set(
        manualMembershipsByEmployeeId.get(document.employeeId)?.manualUnitIdSet ??
          manualMembershipsByEmployeeId.get(document.employeeId)?.unitIdSet ??
          [],
      ),
      unitIdSet: new Set(manualMembershipsByEmployeeId.get(document.employeeId)?.unitIdSet ?? []),
    });
  }

  const employeeIdsByUnitId = new Map<UnitId, EmployeeId[]>();
  for (const unit of getLiveUnitTopologicalOrder(units)) {
    const rule = unit.liveFilter;
    if (!rule) continue;

    const filters = employeeLiveFilterRuleToSearchFilters(rule);
    const queryTokens = getSearchTokens(rule.query);
    const employeeIds: EmployeeId[] = [];

    for (const document of documents) {
      if (
        employeeSearchDocumentMatches({
          document,
          filters,
          membership: membershipsByEmployeeId.get(document.employeeId),
          queryTokens,
          unitAbsenceScope: "manual",
        })
      ) {
        employeeIds.push(document.employeeId);
      }
    }

    employeeIdsByUnitId.set(unit.id, employeeIds);
    for (const employeeId of employeeIds) {
      membershipsByEmployeeId.get(employeeId)?.unitIdSet.add(unit.id);
    }
  }

  return { employeeIdsByUnitId, membershipsByEmployeeId };
};
