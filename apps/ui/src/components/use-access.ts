"use client";

import type { Permission, UnitId } from "@org-tools/types";
import { useCallback } from "react";
import { useAuth } from "@/components/auth-context";

export const useAccess = () => {
  const { bootstrap } = useAuth();
  const can = useCallback(
    (permission: Permission, context?: { employeeId?: string | null; unitId?: UnitId }) => {
      const access = bootstrap?.access;
      if (!access) return false;
      if (access.isSuperAdmin) return true;
      return access.grants.some((grant) => {
        if (grant.permission !== permission) return false;
        if (grant.scope === "all") return true;
        if (grant.scope === "self") {
          return Boolean(
            context?.employeeId && context.employeeId === bootstrap?.account.employeeId,
          );
        }
        if (grant.scope === "managedDirect") {
          return Boolean(context?.unitId && access.managedDirectUnitIds.includes(context.unitId));
        }
        return Boolean(context?.unitId && access.managedSubtreeUnitIds.includes(context.unitId));
      });
    },
    [bootstrap],
  );
  return { access: bootstrap?.access ?? null, account: bootstrap?.account ?? null, can };
};
