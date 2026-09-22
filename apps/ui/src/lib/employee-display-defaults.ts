import type { EmployeeDisplayFormats } from "@org-tools/types";

export const DEFAULT_EMPLOYEE_DISPLAY_FORMATS: EmployeeDisplayFormats = {
  editor: "{fullName}\n{tags}",
  editorExport: "{fullName} {isBoss ? '· {isBoss}' : ''}\n{tags}",
  employees: "{fullName}\n{username}\n{email}\n{position}\n{unitName}\n{tags}",
  units: "{fullName}\n{username}\n{email}\n{position}\n{unitName}\n{tags}",
};
