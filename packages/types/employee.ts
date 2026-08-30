import type { EmployeeId, OrgEditorEmployeeId } from "./ids.js";

/** Stable persisted Employee gender value. */
export type EmployeeGender = "male" | "female" | "unspecified";

/** A label assigned to one Employee, optionally tied to a one-time calendar date. */
export type EmployeeTag = {
  date: string | null;
  label: string;
};

/** Generic fields shared by organization Employees and View-local Employees. */
export type EditableEmployeeFields = {
  avatarBase64Url: string | null;
  birthday: string | null;
  email: string | null;
  firstName: string;
  gender: EmployeeGender;
  lastName: string;
  phone: string | null;
  profileUrl: string | null;
  tags: EmployeeTag[];
  username: string | null;
};

/** Employee owned exclusively by one custom Org View. */
export type OrgEditorEmployee = EditableEmployeeFields & {
  createdAt: string;
  id: OrgEditorEmployeeId;
  updatedAt: string;
};

/** Sparse copy-on-write record for an organization Employee edited in one custom View. */
export type OrgEditorEmployeeOverride = EditableEmployeeFields & {
  employeeId: EmployeeId;
  updatedAt: string;
};
