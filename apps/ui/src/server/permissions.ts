import type {
  EffectiveAccess,
  OrganizationDocument,
  Permission,
  PermissionGrant,
  PermissionScope,
  Role,
  UnitId,
} from "@org-tools/types";
import { ASSIGNABLE_PERMISSIONS, PERMISSION_SCOPES } from "@org-tools/types/security";

export const SUPER_ADMIN_ROLE_ID = "00000000-0000-4000-8000-000000000001";
export const EMPLOYEE_ROLE_ID = "00000000-0000-4000-8000-000000000002";
export const MANAGER_ROLE_ID = "00000000-0000-4000-8000-000000000003";

export const allowedPermissionScopes = (permission: Permission): readonly PermissionScope[] =>
  PERMISSION_SCOPES[permission];

export const isValidPermissionGrant = (grant: PermissionGrant): boolean =>
  ASSIGNABLE_PERMISSIONS.includes(grant.permission) &&
  allowedPermissionScopes(grant.permission).includes(grant.scope);

const deduplicateGrants = (grants: readonly PermissionGrant[]): PermissionGrant[] => {
  const seen = new Set<string>();
  return grants.filter((grant) => {
    if (!isValidPermissionGrant(grant)) return false;
    const key = `${grant.permission}\0${grant.scope}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const managedUnitIdsForEmployee = (
  organization: OrganizationDocument,
  employeeId: string | null,
): { direct: UnitId[]; subtree: UnitId[] } => {
  if (!employeeId) return { direct: [], subtree: [] };
  const systemView = organization.views.find((view) => view.kind === "system");
  if (!systemView) return { direct: [], subtree: [] };
  const units = [...systemView.structure.units].sort((left, right) => left.order - right.order);
  const directSet = new Set(
    units.filter((unit) => unit.bossEmployeeId === employeeId).map((unit) => unit.id),
  );
  const subtreeSet = new Set(directSet);
  let changed = true;
  while (changed) {
    changed = false;
    for (const unit of units) {
      if (unit.parentId && subtreeSet.has(unit.parentId) && !subtreeSet.has(unit.id)) {
        subtreeSet.add(unit.id);
        changed = true;
      }
    }
  }
  return {
    direct: units.filter((unit) => directSet.has(unit.id)).map((unit) => unit.id),
    subtree: units.filter((unit) => subtreeSet.has(unit.id)).map((unit) => unit.id),
  };
};

export const buildEffectiveAccess = (input: {
  directGrants: readonly PermissionGrant[];
  employeeId: string | null;
  organization: OrganizationDocument;
  role: Role;
}): EffectiveAccess => {
  const managed = managedUnitIdsForEmployee(input.organization, input.employeeId);
  return {
    grants: deduplicateGrants([...input.role.grants, ...input.directGrants]),
    isSuperAdmin: input.role.systemKey === "superAdmin",
    managedDirectUnitIds: managed.direct,
    managedSubtreeUnitIds: managed.subtree,
  };
};

export const hasPermission = (
  access: EffectiveAccess,
  permission: Permission,
  context?: { employeeId?: string | null; selfEmployeeId?: string | null; unitId?: UnitId },
): boolean => {
  if (access.isSuperAdmin) return true;
  return access.grants.some((grant) => {
    if (grant.permission !== permission) return false;
    if (grant.scope === "all") return true;
    if (grant.scope === "self") {
      return Boolean(context?.employeeId && context.employeeId === context.selfEmployeeId);
    }
    if (grant.scope === "managedDirect") {
      return Boolean(context?.unitId && access.managedDirectUnitIds.includes(context.unitId));
    }
    return Boolean(context?.unitId && access.managedSubtreeUnitIds.includes(context.unitId));
  });
};
