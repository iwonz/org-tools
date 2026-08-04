import type { Employee, EmployeeId, EmployeeUnitPosition, Unit, UnitId } from "@org-tools/types";

export type EmployeeOrgUnitContext = {
  id: string;
  isBoss: boolean;
  position: string | null;
  type: "org";
  unitFullPath: string;
  unitId: UnitId;
  unitName: string;
  unitPosition: EmployeeUnitPosition;
};

export type EmployeeUnitContext = EmployeeOrgUnitContext;

export type EmployeeUnitMembership = {
  manualUnitIdSet: Set<UnitId>;
  unitIdSet: Set<UnitId>;
};

export const createOrgUnitContext = (
  unitPosition: EmployeeUnitPosition,
): EmployeeOrgUnitContext => ({
  id: `org:${unitPosition.unitId}`,
  isBoss: unitPosition.isBoss,
  position: unitPosition.position,
  type: "org",
  unitFullPath: unitPosition.unitPath.fullName,
  unitId: unitPosition.unitId,
  unitName: unitPosition.unitName,
  unitPosition,
});

export const buildEmployeeUnitContextIndex = (employees: Employee[]) => {
  const result = new Map<EmployeeId, EmployeeUnitContext[]>();

  for (const employee of employees) {
    result.set(employee.id, employee.unitPositions.map(createOrgUnitContext));
  }

  return result;
};

export const buildEmployeeUnitMembershipIndex = (
  employees: Employee[],
  unitsById?: ReadonlyMap<UnitId, Pick<Unit, "membershipMode">>,
) => {
  const result = new Map<EmployeeId, EmployeeUnitMembership>();

  for (const employee of employees) {
    const unitIdSet = new Set(employee.unitIds);
    result.set(employee.id, {
      manualUnitIdSet: new Set(
        unitsById
          ? employee.unitIds.filter((unitId) => unitsById.get(unitId)?.membershipMode === "manual")
          : employee.unitIds,
      ),
      unitIdSet,
    });
  }

  return result;
};

export const getEmployeeOrgUnitContexts = (contexts: EmployeeUnitContext[]) => contexts;

const getPositionOrder = (context: EmployeeOrgUnitContext, unitOrderById: Map<UnitId, number>) =>
  unitOrderById.get(context.unitId) ?? Number.MAX_SAFE_INTEGER;

export const compareOrgUnitContexts = (
  firstContext: EmployeeOrgUnitContext,
  secondContext: EmployeeOrgUnitContext,
  unitOrderById: Map<UnitId, number>,
) => {
  const firstDepth = firstContext.unitPosition.unitPath.ids.length;
  const secondDepth = secondContext.unitPosition.unitPath.ids.length;

  if (firstDepth !== secondDepth) return firstDepth - secondDepth;

  return (
    getPositionOrder(firstContext, unitOrderById) - getPositionOrder(secondContext, unitOrderById)
  );
};

export const getTopOrgUnitContext = (
  contexts: EmployeeUnitContext[],
  unitOrderById: Map<UnitId, number>,
) => {
  const orgContexts = getEmployeeOrgUnitContexts(contexts);

  return orgContexts.length === 0
    ? null
    : ([...orgContexts].sort((firstContext, secondContext) =>
        compareOrgUnitContexts(firstContext, secondContext, unitOrderById),
      )[0] ?? null);
};
