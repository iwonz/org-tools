import type { Unit } from "@org-tools/types";

import { useCountText } from "@/i18n/use-ui-text";

export const useUnitEmployeeSummary = () => {
  const countText = useCountText();
  return (unit: Unit) =>
    `${countText("directEmployees", { count: unit.directEmployeeIds.length })} · ${countText("deepEmployees", { count: unit.deepEmployeeIds.length })}`;
};
