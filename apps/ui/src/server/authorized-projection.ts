import type {
  AccessAudience,
  Account,
  AuthorizedEmployee,
  AuthorizedOrganizationProjection,
  EffectiveAccess,
  Employee,
  OrganizationDocument,
  OrgEditorAnchorOwner,
  OrgToolsViewDocument,
  ResourcePolicyKind,
  Role,
  StoredResourcePolicy,
  UnitId,
} from "@org-tools/types";
import type { Pool } from "pg";

import { evaluateCustomEmployeeFields } from "@/lib/custom-employee-fields";
import { getDatabasePool } from "@/server/database";
import { buildEffectiveAccess, hasPermission } from "@/server/permissions";

const BUILT_IN_EMPLOYEE_FIELDS = [
  "avatarBase64Url",
  "birthday",
  "email",
  "firstName",
  "gender",
  "lastName",
  "phone",
  "profileUrl",
  "username",
] as const;

type PolicyRow = {
  hide_employees_when_unread: boolean;
  read_audience: unknown;
  resource_id: string;
  resource_kind: ResourcePolicyKind;
  write_audience: unknown;
};

export type ProjectionContext = {
  access: EffectiveAccess;
  account: Account;
  role: Role;
};

export type ResourcePolicyMap = Map<string, StoredResourcePolicy>;

type ProjectionResult = {
  access: EffectiveAccess;
  projection: AuthorizedOrganizationProjection;
};

const PROJECTION_CACHE_LIMIT = 64;
const projectionCache = new Map<string, ProjectionResult>();

const cacheGet = (key: string): ProjectionResult | null => {
  const value = projectionCache.get(key);
  if (!value) return null;
  projectionCache.delete(key);
  projectionCache.set(key, value);
  return structuredClone(value);
};

const cacheSet = (key: string, value: ProjectionResult): void => {
  projectionCache.set(key, structuredClone(value));
  while (projectionCache.size > PROJECTION_CACHE_LIMIT) {
    const oldest = projectionCache.keys().next().value;
    if (typeof oldest !== "string") break;
    projectionCache.delete(oldest);
  }
};

export class InvalidPolicyError extends Error {
  constructor() {
    super("Stored access policy is invalid.");
    this.name = "InvalidPolicyError";
  }
}

const strings = (value: unknown): string[] => {
  if (
    !Array.isArray(value) ||
    value.length > 256 ||
    value.some((entry) => typeof entry !== "string") ||
    new Set(value).size !== value.length
  ) {
    throw new InvalidPolicyError();
  }
  return value;
};

export const parseAccessAudience = (value: unknown): AccessAudience => {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    Object.keys(value).sort().join("\0") !==
      ["allAuthenticated", "relations", "roleIds", "userIds"].sort().join("\0")
  ) {
    throw new InvalidPolicyError();
  }
  const input = value as Record<string, unknown>;
  if (typeof input.allAuthenticated !== "boolean") throw new InvalidPolicyError();
  const relations = strings(input.relations);
  if (
    relations.some((relation) => !["self", "managedDirect", "managedSubtree"].includes(relation))
  ) {
    throw new InvalidPolicyError();
  }
  const roleIds = strings(input.roleIds);
  const userIds = strings(input.userIds);
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
  if (roleIds.some((id) => !uuidPattern.test(id)) || userIds.some((id) => !uuidPattern.test(id))) {
    throw new InvalidPolicyError();
  }
  return {
    allAuthenticated: input.allAuthenticated,
    relations: relations as AccessAudience["relations"],
    roleIds,
    userIds,
  };
};

const policyKey = (kind: ResourcePolicyKind, id: string): string => `${kind}\0${id}`;

const parsePolicies = (rows: readonly PolicyRow[]): ResourcePolicyMap =>
  new Map(
    rows.map((row) => {
      const policy: StoredResourcePolicy = {
        hideEmployeesWhenUnread: row.hide_employees_when_unread,
        read: parseAccessAudience(row.read_audience),
        resourceId: row.resource_id,
        resourceKind: row.resource_kind,
        write: parseAccessAudience(row.write_audience),
      };
      return [policyKey(row.resource_kind, row.resource_id), policy];
    }),
  );

const membershipIndex = (organization: OrganizationDocument): Map<string, UnitId[]> => {
  const result = new Map<string, UnitId[]>();
  const systemView = organization.views.find((view) => view.kind === "system");
  for (const unit of systemView?.structure.units ?? []) {
    const employeeIds = new Set([
      ...unit.employeeIds,
      ...unit.employeePositions.map((position) => position.employeeId),
      ...(unit.bossEmployeeId ? [unit.bossEmployeeId] : []),
    ]);
    for (const employeeId of employeeIds) {
      const current = result.get(employeeId) ?? [];
      if (!current.includes(unit.id)) current.push(unit.id);
      result.set(employeeId, current);
    }
  }
  return result;
};

export const audienceAllows = (
  audience: AccessAudience,
  context: ProjectionContext,
  resource?: { employeeId?: string; unitId?: UnitId },
): boolean => {
  if (context.access.isSuperAdmin || audience.allAuthenticated) return true;
  if (audience.userIds.includes(context.account.id) || audience.roleIds.includes(context.role.id)) {
    return true;
  }
  if (resource?.employeeId === context.account.employeeId && audience.relations.includes("self")) {
    return true;
  }
  if (
    resource?.unitId &&
    audience.relations.includes("managedDirect") &&
    context.access.managedDirectUnitIds.includes(resource.unitId)
  ) {
    return true;
  }
  return Boolean(
    resource?.unitId &&
      audience.relations.includes("managedSubtree") &&
      context.access.managedSubtreeUnitIds.includes(resource.unitId),
  );
};

const policyAllows = (
  policies: ResourcePolicyMap,
  kind: ResourcePolicyKind,
  id: string,
  context: ProjectionContext,
  resource?: { employeeId?: string; unitId?: UnitId },
  fallback = true,
): boolean => {
  const policy = policies.get(policyKey(kind, id));
  return policy
    ? audienceAllows(policy.read, context, resource)
    : fallback || context.access.isSuperAdmin;
};

const policyAllowsForEmployee = (
  policies: ResourcePolicyMap,
  kind: ResourcePolicyKind,
  id: string,
  context: ProjectionContext,
  employeeId: string,
  unitIds: readonly UnitId[],
  fallback: boolean,
): boolean =>
  policyAllows(policies, kind, id, context, { employeeId }, fallback) ||
  unitIds.some((unitId) =>
    policyAllows(policies, kind, id, context, { employeeId, unitId }, fallback),
  );

export const resourcePolicyAllowsWrite = (
  policies: ResourcePolicyMap,
  kind: ResourcePolicyKind,
  id: string,
  context: ProjectionContext,
  resource?: { employeeId?: string; unitId?: UnitId },
  fallback = true,
): boolean => {
  const policy = policies.get(policyKey(kind, id));
  return policy
    ? audienceAllows(policy.write, context, resource)
    : fallback || context.access.isSuperAdmin;
};

const employeePermissionAllows = (
  context: ProjectionContext,
  employeeId: string,
  unitIds: readonly UnitId[],
): boolean => {
  if (
    hasPermission(context.access, "employee.read", {
      employeeId,
      selfEmployeeId: context.account.employeeId,
    })
  ) {
    return true;
  }
  return unitIds.some((unitId) =>
    hasPermission(context.access, "employee.read", {
      employeeId,
      selfEmployeeId: context.account.employeeId,
      unitId,
    }),
  );
};

const visibleUnits = (
  view: OrgToolsViewDocument,
  policies: Map<string, StoredResourcePolicy>,
  context: ProjectionContext,
): Set<UnitId> => {
  const byId = new Map(view.structure.units.map((unit) => [unit.id, unit]));
  const cache = new Map<UnitId, boolean>();
  const visit = (unitId: UnitId, visiting = new Set<UnitId>()): boolean => {
    const cached = cache.get(unitId);
    if (cached !== undefined) return cached;
    if (visiting.has(unitId)) return false;
    const unit = byId.get(unitId);
    if (!unit) return false;
    const next = new Set(visiting).add(unitId);
    const parentVisible = unit.parentId ? visit(unit.parentId, next) : true;
    const ownVisible =
      hasPermission(context.access, "unit.read", { unitId }) &&
      policyAllows(policies, "unit", unit.id, context, { unitId }, true);
    const result = parentVisible && ownVisible;
    cache.set(unitId, result);
    return result;
  };
  return new Set(view.structure.units.filter((unit) => visit(unit.id)).map((unit) => unit.id));
};

const filterEmployee = (
  employee: OrganizationDocument["employees"][number],
  visibleTagIds: Set<string>,
  visibleCustomFieldIds: Set<string>,
  policies: Map<string, StoredResourcePolicy>,
  context: ProjectionContext,
  unitIds: readonly UnitId[],
): AuthorizedEmployee => {
  const builtInVisible = (field: string): boolean =>
    unitIds.some((unitId) =>
      policyAllows(
        policies,
        "employeeField",
        `builtin:${field}`,
        context,
        { employeeId: employee.id, unitId },
        true,
      ),
    ) ||
    (unitIds.length === 0 &&
      policyAllows(
        policies,
        "employeeField",
        `builtin:${field}`,
        context,
        { employeeId: employee.id },
        true,
      ));
  const value: Record<string, unknown> = {
    createdAt: employee.createdAt,
    customFieldValues: Object.fromEntries(
      Object.entries(employee.customFieldValues).filter(
        ([fieldId]) =>
          visibleCustomFieldIds.has(fieldId) &&
          policyAllowsForEmployee(
            policies,
            "employeeField",
            fieldId,
            context,
            employee.id,
            unitIds,
            false,
          ),
      ),
    ),
    id: employee.id,
    updatedAt: employee.updatedAt,
  };
  if (builtInVisible("tags")) {
    const visibleTags = employee.tags.filter(
      (tag) =>
        visibleTagIds.has(tag.tagId) &&
        policyAllowsForEmployee(policies, "tag", tag.tagId, context, employee.id, unitIds, true),
    );
    if (employee.tags.length === 0 || visibleTags.length > 0) value.tags = visibleTags;
  }
  for (const field of BUILT_IN_EMPLOYEE_FIELDS) {
    if (builtInVisible(field)) {
      value[field] = employee[field];
    }
  }
  return value as AuthorizedEmployee;
};

const filterView = (
  view: OrgToolsViewDocument,
  visibleEmployeeIds: Set<string>,
  visibleCustomFieldIds: Set<string>,
  visibleTagIds: Set<string>,
  policies: Map<string, StoredResourcePolicy>,
  context: ProjectionContext,
): OrgToolsViewDocument | null => {
  const viewFallback = view.kind === "system";
  if (!policyAllows(policies, "view", view.id, context, undefined, viewFallback)) return null;
  if (view.kind === "system" && !hasPermission(context.access, "editor.system.read")) return null;
  if (view.kind === "custom" && !hasPermission(context.access, "view.read")) return null;
  const unitIds = visibleUnits(view, policies, context);
  const copy = structuredClone(view);
  copy.structure.units = copy.structure.units
    .filter((unit) => unitIds.has(unit.id))
    .map((unit) => ({
      ...unit,
      bossEmployeeId:
        unit.bossEmployeeId && visibleEmployeeIds.has(unit.bossEmployeeId)
          ? unit.bossEmployeeId
          : null,
      employeeIds: unit.employeeIds.filter((id) => visibleEmployeeIds.has(id)),
      employeePositions: unit.employeePositions.filter((entry) =>
        visibleEmployeeIds.has(entry.employeeId),
      ),
      liveFilter: unit.liveFilter
        ? {
            ...unit.liveFilter,
            customFields: unit.liveFilter.customFields.filter(
              (filter) =>
                visibleCustomFieldIds.has(filter.fieldId) &&
                policyAllows(
                  policies,
                  "employeeField",
                  filter.fieldId,
                  context,
                  { unitId: unit.id },
                  false,
                ),
            ),
            selectedTags: unit.liveFilter.selectedTags.filter(
              (id) =>
                visibleTagIds.has(id) &&
                policyAllows(policies, "tag", id, context, { unitId: unit.id }, true),
            ),
            selectedUnitIds: unit.liveFilter.selectedUnitIds.filter((id) => unitIds.has(id)),
          }
        : null,
      parentId: unit.parentId && unitIds.has(unit.parentId) ? unit.parentId : null,
      staffingSlots: unit.staffingSlots
        .filter((slot) =>
          policyAllows(policies, "staffingSlot", slot.id, context, { unitId: unit.id }, true),
        )
        .map((slot) => ({
          ...slot,
          tags: slot.tags.filter(
            (tag) =>
              visibleTagIds.has(tag.tagId) &&
              policyAllows(policies, "tag", tag.tagId, context, { unitId: unit.id }, true),
          ),
        })),
    }));
  const visibleSlotIds = new Set(
    copy.structure.units.flatMap((unit) => unit.staffingSlots.map((slot) => slot.id)),
  );
  const sourceElements = copy.structure.canvasElements;
  let visibleElementIds = new Set(sourceElements.map((element) => element.id));
  const ownerVisible = (owner: OrgEditorAnchorOwner) => {
    if (owner.type === "unit") return unitIds.has(owner.unitId);
    if (owner.type === "employee") {
      return unitIds.has(owner.unitId) && visibleEmployeeIds.has(owner.employeeId);
    }
    if (owner.type === "staffingSlot") {
      return unitIds.has(owner.unitId) && visibleSlotIds.has(owner.staffingSlotId);
    }
    return visibleElementIds.has(owner.elementId);
  };
  let filteredElements = sourceElements;
  let changedElements = true;
  while (changedElements) {
    filteredElements = filteredElements.filter((element) => {
      const targets =
        element.type === "arrow"
          ? [element.start.attachment?.target, element.end.attachment?.target]
          : [element.attachment?.target];
      return targets.every((target) => !target || ownerVisible(target.owner));
    });
    const nextIds = new Set(filteredElements.map((element) => element.id));
    changedElements = nextIds.size !== visibleElementIds.size;
    visibleElementIds = nextIds;
  }
  copy.structure.canvasElements = filteredElements;
  return copy;
};

export class AuthorizedProjectionService {
  constructor(private readonly pool: Pool = getDatabasePool()) {}

  async readPolicies(): Promise<ResourcePolicyMap> {
    const policyRows = await this.pool.query<PolicyRow>(
      `SELECT resource_kind, resource_id, read_audience, write_audience, hide_employees_when_unread
       FROM resource_policies`,
    );
    return parsePolicies(policyRows.rows);
  }

  async build(input: {
    account: Account;
    organization: OrganizationDocument;
    organizationRevision?: number;
    role: Role;
    securityRevision?: number;
  }): Promise<ProjectionResult> {
    const cacheKey =
      input.organizationRevision === undefined || input.securityRevision === undefined
        ? null
        : `${input.account.id}\0${input.organizationRevision}\0${input.securityRevision}`;
    const cached = cacheKey ? cacheGet(cacheKey) : null;
    if (cached) return cached;
    const linkedAccounts = await this.pool.query<{ employee_id: string }>(
      "SELECT employee_id::text FROM accounts WHERE employee_id IS NOT NULL",
    );
    const linkedEmployeeIds = new Set(linkedAccounts.rows.map((row) => row.employee_id));
    const policies = await this.readPolicies();
    const access = buildEffectiveAccess({
      directGrants: input.account.directGrants,
      employeeId: input.account.employeeId,
      organization: input.organization,
      role: input.role,
    });
    const context: ProjectionContext = { access, account: input.account, role: input.role };
    const memberships = membershipIndex(input.organization);
    const systemView = input.organization.views.find((view) => view.kind === "system");
    const visibleSystemUnitIds = systemView
      ? visibleUnits(systemView, policies, context)
      : new Set<UnitId>();
    const visibleMemberships = (employeeId: string): UnitId[] =>
      (memberships.get(employeeId) ?? []).filter((unitId) => visibleSystemUnitIds.has(unitId));
    const preliminaryEmployees = input.organization.employees.filter((employee) => {
      if (employee.id === input.account.employeeId) return true;
      const allMemberships = memberships.get(employee.id) ?? [];
      const readableMemberships = visibleMemberships(employee.id);
      if (allMemberships.length > 0 && readableMemberships.length === 0) return false;
      return employeePermissionAllows(context, employee.id, readableMemberships);
    });
    const visibleTagIds = new Set(
      input.organization.tags
        .filter(
          (tag) =>
            policyAllows(policies, "tag", tag.id, context, undefined, true) ||
            preliminaryEmployees.some((employee) =>
              policyAllowsForEmployee(
                policies,
                "tag",
                tag.id,
                context,
                employee.id,
                visibleMemberships(employee.id),
                true,
              ),
            ),
        )
        .map((tag) => tag.id),
    );
    const visibleEmployees = preliminaryEmployees.filter((employee) => {
      if (employee.id === input.account.employeeId) return true;
      return !employee.tags.some((tag) => {
        const policy = policies.get(policyKey("tag", tag.tagId));
        return (
          policy?.hideEmployeesWhenUnread === true &&
          !policyAllowsForEmployee(
            policies,
            "tag",
            tag.tagId,
            context,
            employee.id,
            visibleMemberships(employee.id),
            true,
          )
        );
      });
    });
    const visibleCustomFieldIds = new Set(
      input.organization.employeeFieldDefinitions
        .filter(
          (field) =>
            policyAllows(policies, "employeeField", field.id, context, undefined, false) ||
            visibleEmployees.some((employee) =>
              policyAllowsForEmployee(
                policies,
                "employeeField",
                field.id,
                context,
                employee.id,
                visibleMemberships(employee.id),
                false,
              ),
            ),
        )
        .map((field) => field.id),
    );
    const visibleEmployeeIds = new Set(visibleEmployees.map((employee) => employee.id));
    const templateFieldIds = new Set(
      input.organization.employeeFieldDefinitions
        .filter((field) => field.kind === "template" && visibleCustomFieldIds.has(field.id))
        .map((field) => field.id),
    );
    const tagById = new Map(input.organization.tags.map((tag) => [tag.id, tag]));
    const resolvedTemplates = (employee: OrganizationDocument["employees"][number]) => {
      if (templateFieldIds.size === 0) return undefined;
      const unitIds = memberships.get(employee.id) ?? [];
      const evaluationEmployee: Employee = {
        ...employee,
        fullName: `${employee.firstName} ${employee.lastName}`.trim(),
        tagPriority: null,
        tags: employee.tags.flatMap((assignment) => {
          const definition = tagById.get(assignment.tagId);
          return definition ? [{ ...definition, date: assignment.date }] : [];
        }),
        unitIds,
        unitPositions: [],
      };
      const values = evaluateCustomEmployeeFields(
        evaluationEmployee,
        input.organization.employeeFieldDefinitions,
      );
      return Object.fromEntries(
        [...templateFieldIds].flatMap((fieldId) => {
          const value = values.get(fieldId);
          return typeof value === "string" ? [[fieldId, value]] : [];
        }),
      );
    };
    const views = input.organization.views
      .map((view) =>
        filterView(
          view,
          visibleEmployeeIds,
          visibleCustomFieldIds,
          visibleTagIds,
          policies,
          context,
        ),
      )
      .filter((view): view is OrgToolsViewDocument => view !== null);
    const result: ProjectionResult = {
      access,
      projection: {
        employeeDisplayFormats: input.organization.employeeDisplayFormats,
        employeeDisplayLineGaps: input.organization.employeeDisplayLineGaps,
        employeeFieldDefinitions: input.organization.employeeFieldDefinitions
          .filter((field) => visibleCustomFieldIds.has(field.id))
          .map((field) => {
            if (field.kind !== "template" || access.isSuperAdmin) return field;
            const mayEditDefinition =
              hasPermission(access, "employee.model.update") &&
              resourcePolicyAllowsWrite(
                policies,
                "employeeField",
                field.id,
                context,
                undefined,
                false,
              );
            return mayEditDefinition ? field : { ...field, template: "" };
          }),
        employees: visibleEmployees.map((employee) => {
          const projected = filterEmployee(
            employee,
            visibleTagIds,
            visibleCustomFieldIds,
            policies,
            context,
            visibleMemberships(employee.id),
          );
          if (!access.isSuperAdmin && linkedEmployeeIds.has(employee.id)) delete projected.email;
          if (!access.isSuperAdmin) {
            const templateValues = resolvedTemplates(employee);
            if (templateValues) projected.resolvedTemplateValues = templateValues;
          }
          return projected;
        }),
        tags: input.organization.tags.filter((tag) => visibleTagIds.has(tag.id)),
        views,
      },
    };
    if (cacheKey) cacheSet(cacheKey, result);
    return result;
  }
}

export const clearAuthorizedProjectionCacheForTests = (): void => projectionCache.clear();
export const authorizedProjectionCacheSizeForTests = (): number => projectionCache.size;
