import type { CustomEmployeeFieldDefinition, EmployeeTagDefinition } from "./employee.js";
import type {
  AccountId,
  AuditEventId,
  EmployeeFieldId,
  EmployeeId,
  RoleId,
  SessionId,
  TagId,
  UnitId,
  ViewId,
} from "./ids.js";
import type {
  AppLocale,
  OrgToolsState,
  OrgToolsUiState,
  OrgToolsViewDocument,
} from "./org-tools-state.js";
import type { OrganizationEmployee } from "./organization.js";

export type OrganizationDocument = OrgToolsState["organization"];
export type AccountUiState = OrgToolsUiState;

export const PERMISSIONS = [
  "employee.read",
  "employee.create",
  "employee.update",
  "employee.delete",
  "employee.assignments.update",
  "employee.model.update",
  "tag.create",
  "tag.update",
  "tag.delete",
  "tag.assign",
  "unit.read",
  "unit.create",
  "unit.update",
  "unit.delete",
  "unit.reparent",
  "unit.boss.assign",
  "editor.system.read",
  "editor.system.layout.update",
  "view.read",
  "view.create",
  "view.update",
  "view.delete",
  "staffingSlot.create",
  "staffingSlot.update",
  "staffingSlot.delete",
  "calendar.read",
  "dataDownload.create",
  "editorImageExport.create",
  "backup.create",
  "backup.restore",
] as const;

export type Permission = (typeof PERMISSIONS)[number];
export type PermissionScope = "self" | "managedDirect" | "managedSubtree" | "all";

export const PERMISSION_SCOPES = Object.fromEntries(
  PERMISSIONS.map((permission) => {
    const globalOnly = [
      "employee.create",
      "employee.delete",
      "employee.model.update",
      "tag.create",
      "tag.update",
      "tag.delete",
      "editor.system.read",
      "view.read",
      "view.create",
      "view.update",
      "view.delete",
      "calendar.read",
      "dataDownload.create",
      "editorImageExport.create",
      "backup.create",
      "backup.restore",
    ].includes(permission);
    const unitOnly = [
      "unit.create",
      "unit.update",
      "unit.delete",
      "unit.reparent",
      "unit.boss.assign",
      "staffingSlot.create",
      "staffingSlot.update",
      "staffingSlot.delete",
    ].includes(permission);
    return [
      permission,
      globalOnly
        ? (["all"] as const)
        : unitOnly
          ? (["managedDirect", "managedSubtree", "all"] as const)
          : (["self", "managedDirect", "managedSubtree", "all"] as const),
    ];
  }),
) as unknown as Record<Permission, readonly PermissionScope[]>;

export type PermissionGrant = {
  permission: Permission;
  scope: PermissionScope;
};

export type AccessRelation = "self" | "managedDirect" | "managedSubtree";

export type AccessAudience = {
  allAuthenticated: boolean;
  relations: AccessRelation[];
  roleIds: RoleId[];
  userIds: AccountId[];
};

export type ResourceAccessPolicy = {
  read: AccessAudience;
  write: AccessAudience;
};

export type ResourcePolicyKind = "employeeField" | "tag" | "unit" | "staffingSlot" | "view";

export type StoredResourcePolicy = ResourceAccessPolicy & {
  hideEmployeesWhenUnread: boolean;
  resourceId: string;
  resourceKind: ResourcePolicyKind;
};

export type AccountStatus = "active" | "disabled";
export type SystemRoleKey = "superAdmin" | "employee" | "manager";

export type Role = {
  grants: PermissionGrant[];
  id: RoleId;
  name: string;
  systemKey: SystemRoleKey | null;
};

export type Account = {
  createdAt: string;
  directGrants: PermissionGrant[];
  email: string;
  employeeId: EmployeeId | null;
  id: AccountId;
  mustChangePassword: boolean;
  roleId: RoleId;
  status: AccountStatus;
  updatedAt: string;
};

export type AccountSummary = Omit<Account, "directGrants"> & {
  directGrants: PermissionGrant[];
  effectiveGrants: PermissionGrant[];
  roleName: string;
  roleSystemKey: SystemRoleKey | null;
};

export type SessionSummary = {
  absoluteExpiresAt: string;
  accountId: AccountId;
  createdAt: string;
  id: SessionId;
  idleExpiresAt: string;
  lastSeenAt: string;
};

export type AuditEvent = {
  action: string;
  actorAccountId: AccountId | null;
  correlationId: string;
  createdAt: string;
  id: AuditEventId;
  result: "allowed" | "denied" | "failed" | "succeeded";
  targetIds: string[];
};

export type AuthorizedEmployee = Pick<OrganizationEmployee, "createdAt" | "id" | "updatedAt"> &
  Partial<Omit<OrganizationEmployee, "createdAt" | "id" | "updatedAt">> & {
    resolvedTemplateValues?: Partial<Record<EmployeeFieldId, string>>;
  };

export type AuthorizedOrganizationProjection = {
  employeeDisplayFormats: OrganizationDocument["employeeDisplayFormats"];
  employeeDisplayLineGaps: OrganizationDocument["employeeDisplayLineGaps"];
  employeeFieldDefinitions: CustomEmployeeFieldDefinition[];
  employees: AuthorizedEmployee[];
  tags: EmployeeTagDefinition[];
  views: OrgToolsViewDocument[];
};

export type EffectiveAccess = {
  grants: PermissionGrant[];
  isSuperAdmin: boolean;
  managedDirectUnitIds: UnitId[];
  managedSubtreeUnitIds: UnitId[];
};

export type SessionBootstrap = {
  access: EffectiveAccess;
  account: AccountSummary;
  csrfToken: string;
  organizationRevision: number;
  projection: AuthorizedOrganizationProjection;
  securityRevision: number;
  ui: AccountUiState;
};

export type BootstrapStatus =
  | { kind: "login"; locale: AppLocale }
  | { kind: "setup"; locale: AppLocale };

export type OrganizationCommand =
  | {
      expectedOrganizationRevision: number;
      expectedSecurityRevision: number;
      organization: OrganizationDocument;
      type: "organization.patch";
    }
  | {
      expectedOrganizationRevision: number;
      expectedSecurityRevision: number;
      organization: OrganizationDocument;
      type: "organization.replace";
    };

export type CommandResult = {
  organizationRevision: number;
  projection: AuthorizedOrganizationProjection;
  securityRevision: number;
};

export type AccessPolicyReferences = {
  employeeFieldIds: EmployeeFieldId[];
  staffingSlotIds: string[];
  tagIds: TagId[];
  unitIds: UnitId[];
  viewIds: ViewId[];
};
