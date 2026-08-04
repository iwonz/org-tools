import type { EditableEmployeeFields } from "./employee.js";
import type { EmployeeId, UnitId } from "./ids.js";

export type EmployeeLiveFilterBirthday = {
  day: number;
  month: number;
};

/** Persisted rule used to derive the direct membership of a Live Unit. */
export type EmployeeLiveFilterRule = {
  birthday: EmployeeLiveFilterBirthday | null;
  includeWithoutTags: boolean;
  includeWithoutUnits: boolean;
  query: string;
  selectedPositions: string[];
  selectedTags: string[];
  selectedUnitIds: UnitId[];
};

/** Materialized global Employee stored by the current complete workspace format. */
export type WorkspaceEmployee = EditableEmployeeFields & {
  createdAt: string;
  id: EmployeeId;
  updatedAt: string;
};

export type PersistedEmployee = WorkspaceEmployee;

export type UnitMembership = {
  employeeId: EmployeeId;
  isBoss: boolean;
  position: string | null;
  unitId: UnitId;
};

export type UnitAssignment = Omit<UnitMembership, "employeeId">;
