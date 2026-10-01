import type { Permission, PermissionScope } from "@org-tools/types";
import type { UiTextKey } from "@/i18n/messages";

export const PERMISSION_LABEL_KEYS = {
  "backup.create": "Create Backups",
  "backup.restore": "Restore Backups",
  "calendar.read": "View Calendar",
  "dataDownload.create": "Download data",
  "editor.system.layout.update": "Edit the system Editor layout",
  "editor.system.read": "View the system Editor",
  "editorImageExport.create": "Export Editor images",
  "employee.assignments.update": "Change Employee Units and positions",
  "employee.create": "Add Employees",
  "employee.delete": "Delete Employees",
  "employee.model.update": "Edit Employee model",
  "employee.read": "View Employees",
  "employee.update": "Edit Employee data",
  "staffingSlot.create": "Create Staffing Slots",
  "staffingSlot.delete": "Delete Staffing Slots",
  "staffingSlot.update": "Edit Staffing Slots",
  "tag.assign": "Assign Tags",
  "tag.create": "Create Tags",
  "tag.delete": "Delete Tags",
  "tag.update": "Edit and reorder Tags",
  "unit.boss.assign": "Assign Unit managers",
  "unit.create": "Create Units",
  "unit.delete": "Delete Units",
  "unit.read": "View Units",
  "unit.reparent": "Move Units in the structure",
  "unit.update": "Edit Units",
  "view.create": "Create Views",
  "view.delete": "Delete Views",
  "view.read": "View Views",
  "view.update": "Edit Views",
} satisfies Record<Permission, UiTextKey>;

export const PERMISSION_SCOPE_LABEL_KEYS = {
  all: "Entire organization",
  managedDirect: "Directly managed Units",
  managedSubtree: "Managed Units and descendants",
  self: "Own profile only",
} satisfies Record<PermissionScope, UiTextKey>;
