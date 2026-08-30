import type { EmployeeGender, EmployeeTag } from "./employee.js";
import type { EmployeeId, UnitId } from "./ids.js";

/** Derived organization model used only at runtime. */
export type UiOrgStructure = {
  roots: Unit[];
  allEmployees: Employee[];
  deepEmployees: Employee[];
  deepUnits: Unit[];
  indexes: UiOrgIndexes;
};

export type EmployeeSearchDocument = {
  birthdayKey: string | null;
  employeeId: EmployeeId;
  gender: EmployeeGender;
  positionLabelSet: Set<string>;
  positionLabels: string[];
  searchText: string;
  tagLabelSet: Set<string>;
  tagLabels: string[];
};

export type UnitSearchDocument = {
  normalizedName: string;
  pathIds: UnitId[];
  unitId: UnitId;
};

export type UiOrgIndexes = {
  birthdayEmployeesByKey: Map<string, Employee[]>;
  datedTagEventsByDate: Map<string, DatedTagEvent[]>;
  datedTagGroups: DatedTagGroup[];
  bossEmployeeCount: number;
  employeeSearchDocumentByEmployeeId: Map<EmployeeId, EmployeeSearchDocument>;
  employeeSearchDocuments: EmployeeSearchDocument[];
  employeesByName: Employee[];
  employeesById: Map<EmployeeId, Employee>;
  manualEmployeeSearchDocumentByEmployeeId: Map<EmployeeId, EmployeeSearchDocument>;
  manualEmployeeSearchDocuments: EmployeeSearchDocument[];
  manualPositionOptions: string[];
  positionOptions: string[];
  tagOptions: string[];
  unitOrderById: Map<UnitId, number>;
  unitSearchDocuments: UnitSearchDocument[];
  unitsById: Map<UnitId, Unit>;
};

export type DatedTagEvent = {
  date: string;
  employee: Employee;
  label: string;
};

export type DatedTagGroup = {
  events: DatedTagEvent[];
  label: string;
  normalizedLabel: string;
};

export type Unit = {
  id: UnitId;
  parentId: UnitId | null;
  name: string;
  membershipMode: "live" | "manual";
  order: number;
  path: UnitPath;
  directEmployeeIds: EmployeeId[];
  deepEmployeeIds: EmployeeId[];
  children: Unit[];
};

export type UnitPath = {
  ids: UnitId[];
  names: string[];
  fullName: string;
};

/**
 * Derived Employee. Positions and boss status remain scoped to Unit assignments.
 * `scope` distinguishes organization Employees from custom-View-local Employees at runtime only.
 */
export type Employee = {
  avatarBase64Url: string | null;
  birthday: string | null;
  email: string | null;
  firstName: string;
  fullName: string;
  gender: EmployeeGender;
  id: EmployeeId;
  lastName: string;
  phone: string | null;
  profileUrl: string | null;
  scope: "organization" | "view";
  tags: EmployeeTag[];
  unitIds: UnitId[];
  unitPositions: EmployeeUnitPosition[];
  username: string | null;
};

export type EmployeeUnitPosition = {
  unitId: UnitId;
  parentId: UnitId | null;
  unitName: string;
  unitPath: UnitPath;
  position: string | null;
  isBoss: boolean;
};
