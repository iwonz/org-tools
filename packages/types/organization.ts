import type {
  CustomEmployeeFieldValue,
  EditableEmployeeFields,
  EmployeeGender,
  EmployeeTagAssignment,
} from "./employee.js";
import type { EmployeeFieldId, EmployeeId, TagId, UnitId } from "./ids.js";

export type EmployeeLiveFilterBirthday = {
  day: number;
  month: number;
  year: number;
};

export type EmployeeCustomFieldFilter = {
  fieldId: EmployeeFieldId;
  includeUnset: boolean;
  selectedValues: string[];
};

/** Persisted rule used to derive the direct membership of a Live Unit. */
export type EmployeeLiveFilterRule = {
  birthday: EmployeeLiveFilterBirthday | null;
  customFields: EmployeeCustomFieldFilter[];
  includeWithoutTags: boolean;
  includeWithoutUnits: boolean;
  query: string;
  selectedGenders: EmployeeGender[];
  selectedPositions: string[];
  selectedTags: TagId[];
  selectedUnitIds: UnitId[];
};

/** Materialized global Employee stored by the organization state. */
export type OrganizationEmployee = Omit<EditableEmployeeFields, "customFieldValues" | "tags"> & {
  createdAt: string;
  customFieldValues: Record<EmployeeFieldId, CustomEmployeeFieldValue>;
  id: EmployeeId;
  tags: EmployeeTagAssignment[];
  updatedAt: string;
};

export type UnitMembership = {
  employeeId: EmployeeId;
  isBoss: boolean;
  position: string | null;
  unitId: UnitId;
};

export type UnitAssignment = Omit<UnitMembership, "employeeId">;
