/** Stable persisted Employee gender value. */
export type EmployeeGender = "male" | "female" | "unspecified";

/** A label assigned to one Employee, optionally tied to a one-time calendar date. */
export type EmployeeTag = {
  date: string | null;
  label: string;
};

/** Generic fields shared by organization Employees and transfer records. */
export type EditableEmployeeFields = {
  avatarBase64Url: string | null;
  /** Canonical DD.MM.YYYY date; year 1900 means that only day and month are known. */
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
