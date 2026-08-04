"use client";

import type { Employee, EmployeeId, Unit } from "@org-tools/types";
import { useState } from "react";

import { useUiText } from "@/i18n/use-ui-text";
import { isSafeAvatarBase64Url } from "@/lib/employee-data";
import { getEmployeeInitials } from "@/lib/employee-utils";
import { cn } from "@/lib/utils";

const getUnitInitials = (unit: Unit) =>
  unit.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((namePart) => namePart.at(0))
    .join("")
    .toLocaleUpperCase("en-US");

export const getUnitBoss = (
  unit: Unit,
  employeesById: ReadonlyMap<EmployeeId, Employee> | undefined,
): Employee | null => {
  if (!employeesById) return null;

  for (const employeeId of unit.directEmployeeIds) {
    const employee = employeesById.get(employeeId);

    if (
      employee?.unitPositions.some(
        (unitPosition) => unitPosition.unitId === unit.id && unitPosition.isBoss,
      )
    ) {
      return employee;
    }
  }

  return null;
};

export function UnitAvatar({
  className,
  employeesById,
  unit,
}: {
  className?: string;
  employeesById?: ReadonlyMap<EmployeeId, Employee>;
  unit: Unit;
}) {
  const t = useUiText();
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const boss = getUnitBoss(unit, employeesById);
  const imageUrl = isSafeAvatarBase64Url(boss?.avatarBase64Url ?? null)
    ? (boss?.avatarBase64Url ?? null)
    : null;
  const shouldShowImage = imageUrl && failedImageUrl !== imageUrl;
  const fallback = boss ? getEmployeeInitials(boss) : getUnitInitials(unit);

  return (
    <div
      className={cn(
        "flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-medium text-muted-foreground",
        !shouldShowImage && "border border-border bg-background",
        className,
      )}
      title={boss ? t("Boss: {name}", { name: boss.fullName }) : t("No boss")}
    >
      {shouldShowImage ? (
        // biome-ignore lint/performance/noImgElement: embedded data URLs are local-only and unsupported by next/image in a static export.
        <img
          alt={boss ? t("Boss {name}", { name: boss.fullName }) : unit.name}
          className="size-full object-cover"
          decoding="async"
          loading="lazy"
          onError={() => setFailedImageUrl(imageUrl)}
          src={imageUrl}
        />
      ) : (
        <span>{fallback || "?"}</span>
      )}
    </div>
  );
}
