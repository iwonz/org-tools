import type {
  CustomEmployeeFieldDefinition,
  CustomEmployeeFieldValue,
  EmployeeGender,
  EmployeeTag,
  EmployeeTagDefinition,
} from "./employee.js";
import type { EmployeeFieldId, EmployeeId, TagId, UnitId } from "./ids.js";

/** Derived organization model used only at runtime. */
export type UiOrgStructure = {
  roots: Unit[];
  allEmployees: Employee[];
  deepEmployees: Employee[];
  deepUnits: Unit[];
  indexes: UiOrgIndexes;
  employeeFieldDefinitions: CustomEmployeeFieldDefinition[];
  tags: EmployeeTagDefinition[];
};

export type EmployeeSearchDocument = {
  birthday: string | null;
  birthdayKey: string | null;
  customFieldValues: Map<EmployeeFieldId, string | null>;
  employeeId: EmployeeId;
  gender: EmployeeGender;
  positionLabelSet: Set<string>;
  positionLabels: string[];
  searchText: string;
  tagIdSet: Set<TagId>;
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
  employeeFieldDefinitionById: Map<EmployeeFieldId, CustomEmployeeFieldDefinition>;
  customFieldOptionsById: Map<EmployeeFieldId, string[]>;
  manualEmployeeSearchDocumentByEmployeeId: Map<EmployeeId, EmployeeSearchDocument>;
  manualEmployeeSearchDocuments: EmployeeSearchDocument[];
  manualPositionOptions: string[];
  positionOptions: string[];
  tagOptions: string[];
  tagsById: Map<TagId, EmployeeTagDefinition>;
  unitOrderById: Map<UnitId, number>;
  unitSearchDocuments: UnitSearchDocument[];
  unitsById: Map<UnitId, Unit>;
};

export type DatedTagEvent = {
  color: EmployeeTag["color"];
  date: string;
  employee: Employee;
  label: string;
  tagId: TagId;
};

export type DatedTagGroup = {
  color: EmployeeTag["color"];
  events: DatedTagEvent[];
  label: string;
  normalizedLabel: string;
  tagId: TagId;
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
 */
export type Employee = {
  avatarBase64Url: string | null;
  birthday: string | null;
  customFieldValues: Record<EmployeeFieldId, CustomEmployeeFieldValue>;
  email: string | null;
  firstName: string;
  fullName: string;
  gender: EmployeeGender;
  id: EmployeeId;
  lastName: string;
  phone: string | null;
  profileUrl: string | null;
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
