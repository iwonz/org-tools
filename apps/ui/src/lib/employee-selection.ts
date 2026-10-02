import type { EmployeeId } from "@org-tools/types";

export const countEmployeeIdsNotInSelection = (
  employeeIds: EmployeeId[],
  selectedEmployeeIds: Set<EmployeeId>,
) => employeeIds.filter((employeeId) => !selectedEmployeeIds.has(employeeId)).length;

export const countEmployeeIdsInSelection = (
  employeeIds: EmployeeId[],
  selectedEmployeeIds: Set<EmployeeId>,
) => employeeIds.filter((employeeId) => selectedEmployeeIds.has(employeeId)).length;
