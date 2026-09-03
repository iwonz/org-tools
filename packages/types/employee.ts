/** Stable persisted Employee gender value. */
export type EmployeeGender = "male" | "female" | "unspecified";

import type { EmployeeFieldId, EmployeeFieldOptionId, TagId } from "./ids.js";

export type EmployeeTagColor =
  | "amber"
  | "blue"
  | "cyan"
  | "green"
  | "orange"
  | "red"
  | "rose"
  | "teal";

/** A global Tag definition shared by Employee assignments. */
export type EmployeeTagDefinition = {
  color: EmployeeTagColor | null;
  id: TagId;
  label: string;
};

/** A persisted Employee-to-Tag assignment. */
export type EmployeeTagAssignment = {
  date: string | null;
  tagId: TagId;
};

/** A catalog-resolved Tag used by runtime Employee cards. */
export type EmployeeTag = {
  color?: EmployeeTagColor | null;
  date: string | null;
  label: string;
  tagId?: TagId;
};

export type CustomEmployeeFieldHash = "md5" | "none" | "sha256";
export type CustomEmployeeValueType = "boolean" | "date" | "number" | "option" | "text";
export type CustomEmployeeFieldValue = boolean | number | string | null;

export type CustomEmployeeFieldOption = {
  id: EmployeeFieldOptionId;
  label: string;
};

type CustomEmployeeFieldBase = {
  id: EmployeeFieldId;
  key: string;
  name: string;
};

export type CustomEmployeeTemplateField = CustomEmployeeFieldBase & {
  hash: CustomEmployeeFieldHash;
  kind: "template";
  template: string;
};

export type CustomEmployeeValueField = CustomEmployeeFieldBase & {
  kind: "value";
  options: CustomEmployeeFieldOption[];
  required: boolean;
  valueType: CustomEmployeeValueType;
};

export type CustomEmployeeFieldDefinition = CustomEmployeeTemplateField | CustomEmployeeValueField;

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
  customFieldValues?: Record<EmployeeFieldId, CustomEmployeeFieldValue>;
  tags: EmployeeTag[];
  username: string | null;
};
