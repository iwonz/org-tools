import type {
  Employee,
  EmployeeId,
  EmployeeLiveFilterRule,
  OrgEditorEmployeePosition,
  Unit,
  UnitId,
} from "@org-tools/types";

const normalizePosition = (position: string | null | undefined) => position?.trim() || null;

export const getDefaultLiveEmployeePosition = ({
  employee,
  rule,
  unitOrderById,
  unitsById,
}: {
  employee: Employee;
  rule: EmployeeLiveFilterRule;
  unitOrderById: ReadonlyMap<UnitId, number>;
  unitsById: ReadonlyMap<UnitId, Unit>;
}) => {
  const manualPositions = employee.unitPositions
    .filter(
      (unitPosition) =>
        unitsById.get(unitPosition.unitId)?.membershipMode === "manual" &&
        normalizePosition(unitPosition.position) !== null,
    )
    .sort(
      (firstPosition, secondPosition) =>
        (unitOrderById.get(firstPosition.unitId) ?? Number.MAX_SAFE_INTEGER) -
        (unitOrderById.get(secondPosition.unitId) ?? Number.MAX_SAFE_INTEGER),
    );
  const selectedPositionSet = new Set(rule.selectedPositions);
  const preferredPosition =
    selectedPositionSet.size > 0
      ? manualPositions.find((unitPosition) =>
          selectedPositionSet.has(normalizePosition(unitPosition.position) ?? ""),
        )
      : null;

  return normalizePosition(preferredPosition?.position ?? manualPositions[0]?.position);
};

export const getEffectiveLiveEmployeePosition = ({
  employee,
  positionOverrides,
  rule,
  unitOrderById,
  unitsById,
}: {
  employee: Employee;
  positionOverrides: readonly OrgEditorEmployeePosition[];
  rule: EmployeeLiveFilterRule;
  unitOrderById: ReadonlyMap<UnitId, number>;
  unitsById: ReadonlyMap<UnitId, Unit>;
}) => {
  const positionOverride = positionOverrides.find(
    (position) => position.employeeId === employee.id,
  );

  if (positionOverride) return normalizePosition(positionOverride.position);

  return getDefaultLiveEmployeePosition({
    employee,
    rule,
    unitOrderById,
    unitsById,
  });
};

export const normalizeLivePositionOverrides = (
  positionOverrides: readonly OrgEditorEmployeePosition[],
) => {
  const overrideByEmployeeId = new Map<EmployeeId, OrgEditorEmployeePosition>();

  for (const positionOverride of positionOverrides) {
    overrideByEmployeeId.set(positionOverride.employeeId, {
      employeeId: positionOverride.employeeId,
      position: normalizePosition(positionOverride.position),
    });
  }

  return [...overrideByEmployeeId.values()];
};
