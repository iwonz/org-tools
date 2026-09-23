import type { CustomEmployeeFieldDefinition } from "@org-tools/types";

import type { TemplateFormatToken } from "@/components/template-format-input";
import type { UiTextKey } from "@/i18n/messages";
import {
  EMPLOYEE_DISPLAY_POSITIONS_KEY,
  isEmployeeDisplayPositionsKey,
} from "@/lib/custom-employee-fields";
import { exportEmployeeFields } from "@/lib/export-format";
import { orgEditorTemplateUnitFields } from "@/lib/org-editor-export";

export const templateFormatTokenDescriptionKeys: Record<string, UiTextKey> = {
  avatarBase64Url: "Template token: embedded avatar",
  birthday: "Template token: complete birthday",
  email: "Template token: email address",
  firstName: "Template token: first name",
  fullName: "Template token: full name",
  gender: "Template token: gender",
  id: "Template token: Employee identifier",
  isBoss: "Template token: manager status",
  lastName: "Template token: last name",
  phone: "Template token: phone number",
  position: "Template token: Unit position",
  profileUrl: "Template token: profile link",
  tagDates: "Template token: dated Tags",
  tags: "Template token: Tag labels",
  unitFullPath: "Template token: full Unit path",
  unitId: "Template token: Unit identifier",
  unitName: "Template token: Unit name",
  username: "Template token: username",
};

export const createEmployeeDisplayFormatTokens = (
  definitions: readonly CustomEmployeeFieldDefinition[],
  translate: (key: UiTextKey) => string,
): TemplateFormatToken[] =>
  [
    ...exportEmployeeFields,
    ...orgEditorTemplateUnitFields,
    ...(definitions.some((field) => isEmployeeDisplayPositionsKey(field.key))
      ? []
      : [{ key: EMPLOYEE_DISPLAY_POSITIONS_KEY, label: EMPLOYEE_DISPLAY_POSITIONS_KEY }]),
    ...definitions.map((field) => ({ key: field.key, label: field.name })),
  ]
    .filter((field) => field.key !== "avatarBase64Url")
    .map((field) => ({
      description: templateFormatTokenDescriptionKeys[field.key]
        ? translate(templateFormatTokenDescriptionKeys[field.key] as UiTextKey)
        : field.label,
      key: field.key,
    }));
