import type { Employee, EmployeeId } from "@org-tools/types";

export const createEmployeeIdSet = (employees: Employee[]) =>
  new Set(employees.map((employee) => employee.id));

export const countEmployeesNotInSelection = (
  employees: Employee[],
  selectedEmployeeIds: Set<EmployeeId>,
) => employees.filter((employee) => !selectedEmployeeIds.has(employee.id)).length;

export const countEmployeeIdsNotInSelection = (
  employeeIds: EmployeeId[],
  selectedEmployeeIds: Set<EmployeeId>,
) => employeeIds.filter((employeeId) => !selectedEmployeeIds.has(employeeId)).length;

export const countEmployeesInSelection = (
  employees: Employee[],
  selectedEmployeeIds: Set<EmployeeId>,
) => employees.filter((employee) => selectedEmployeeIds.has(employee.id)).length;

export const countEmployeeIdsInSelection = (
  employeeIds: EmployeeId[],
  selectedEmployeeIds: Set<EmployeeId>,
) => employeeIds.filter((employeeId) => selectedEmployeeIds.has(employeeId)).length;

export const filterEmployeesInSelection = (
  employees: Employee[],
  selectedEmployeeIds: Set<EmployeeId>,
) => employees.filter((employee) => selectedEmployeeIds.has(employee.id));

export const addUniqueEmployees = (currentEmployees: Employee[], employeesToAdd: Employee[]) => {
  const employeesById = new Map(currentEmployees.map((employee) => [employee.id, employee]));

  for (const employee of employeesToAdd) {
    if (!employeesById.has(employee.id)) {
      employeesById.set(employee.id, employee);
    }
  }

  return [...employeesById.values()];
};

export const removeEmployeesById = (
  currentEmployees: Employee[],
  employeeIdsToRemove: Iterable<EmployeeId>,
) => {
  const removableEmployeeIds = new Set(employeeIdsToRemove);

  return currentEmployees.filter((employee) => !removableEmployeeIds.has(employee.id));
};
