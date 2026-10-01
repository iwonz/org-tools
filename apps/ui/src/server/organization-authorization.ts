import type {
  Account,
  EffectiveAccess,
  OrganizationDocument,
  OrganizationEmployee,
  OrgEditorUnit,
  OrgToolsViewDocument,
  Permission,
  Role,
  UnitId,
} from "@org-tools/types";

import { hasEmployeeLiveFilterCriteria } from "@/lib/live-unit-filter";
import { type ResourcePolicyMap, resourcePolicyAllowsWrite } from "@/server/authorized-projection";
import { hasPermission } from "@/server/permissions";

export class AuthorizationDeniedError extends Error {
  constructor() {
    super("The requested resource is unavailable.");
    this.name = "AuthorizationDeniedError";
  }
}

const json = (value: unknown): string => JSON.stringify(value);
const changed = (left: unknown, right: unknown): boolean => json(left) !== json(right);

const assert = (condition: boolean): void => {
  if (!condition) throw new AuthorizationDeniedError();
};

const memberships = (organization: OrganizationDocument): Map<string, UnitId[]> => {
  const result = new Map<string, UnitId[]>();
  const view = organization.views.find((candidate) => candidate.kind === "system");
  for (const unit of view?.structure.units ?? []) {
    for (const employeeId of new Set([
      ...unit.employeeIds,
      ...unit.employeePositions.map((position) => position.employeeId),
      ...(unit.bossEmployeeId ? [unit.bossEmployeeId] : []),
    ])) {
      result.set(employeeId, [...(result.get(employeeId) ?? []), unit.id]);
    }
  }
  return result;
};

const canForEmployee = (
  access: EffectiveAccess,
  account: Account,
  permission: Permission,
  employee: OrganizationEmployee,
  unitIds: readonly UnitId[],
): boolean =>
  hasPermission(access, permission, {
    employeeId: employee.id,
    selfEmployeeId: account.employeeId,
  }) ||
  unitIds.some((unitId) =>
    hasPermission(access, permission, {
      employeeId: employee.id,
      selfEmployeeId: account.employeeId,
      unitId,
    }),
  );

const assertCatalogChanges = (
  current: OrganizationDocument,
  candidate: OrganizationDocument,
  access: EffectiveAccess,
): void => {
  assert(
    !changed(current.employeeFieldDefinitions, candidate.employeeFieldDefinitions) ||
      hasPermission(access, "employee.model.update"),
  );
  assert(
    (!changed(current.employeeDisplayFormats, candidate.employeeDisplayFormats) &&
      !changed(current.employeeDisplayLineGaps, candidate.employeeDisplayLineGaps)) ||
      hasPermission(access, "employee.model.update"),
  );
  const currentTags = new Map(current.tags.map((tag) => [tag.id, tag]));
  const nextTags = new Map(candidate.tags.map((tag) => [tag.id, tag]));
  for (const [id, tag] of nextTags) {
    assert(
      currentTags.has(id)
        ? !changed(currentTags.get(id), tag) || hasPermission(access, "tag.update")
        : hasPermission(access, "tag.create"),
    );
  }
  for (const id of currentTags.keys()) {
    assert(nextTags.has(id) || hasPermission(access, "tag.delete"));
  }
  if (
    changed(
      current.tags.filter((tag) => nextTags.has(tag.id)).map((tag) => tag.id),
      candidate.tags.filter((tag) => currentTags.has(tag.id)).map((tag) => tag.id),
    )
  ) {
    assert(hasPermission(access, "tag.update"));
  }
};

const employeeScalar = (employee: OrganizationEmployee): unknown => ({
  avatarBase64Url: employee.avatarBase64Url,
  birthday: employee.birthday,
  customFieldValues: employee.customFieldValues,
  email: employee.email,
  firstName: employee.firstName,
  gender: employee.gender,
  lastName: employee.lastName,
  phone: employee.phone,
  profileUrl: employee.profileUrl,
  username: employee.username,
});

const employeeBuiltInScalar = (employee: OrganizationEmployee): unknown => ({
  avatarBase64Url: employee.avatarBase64Url,
  birthday: employee.birthday,
  email: employee.email,
  firstName: employee.firstName,
  gender: employee.gender,
  lastName: employee.lastName,
  phone: employee.phone,
  profileUrl: employee.profileUrl,
  username: employee.username,
});

const assertEmployeeChanges = (
  current: OrganizationDocument,
  candidate: OrganizationDocument,
  access: EffectiveAccess,
  account: Account,
): void => {
  const currentMemberships = memberships(current);
  const candidateMemberships = memberships(candidate);
  const candidateTagIds = new Set(candidate.tags.map((tag) => tag.id));
  const candidateFieldIds = new Set(candidate.employeeFieldDefinitions.map((field) => field.id));
  const byId = new Map(current.employees.map((employee) => [employee.id, employee]));
  const nextById = new Map(candidate.employees.map((employee) => [employee.id, employee]));
  for (const [id, employee] of nextById) {
    const previous = byId.get(id);
    if (!previous) {
      assert(hasPermission(access, "employee.create"));
      if (employee.tags.length > 0) {
        assert(
          canForEmployee(
            access,
            account,
            "tag.assign",
            employee,
            candidateMemberships.get(id) ?? [],
          ),
        );
      }
      continue;
    }
    const unitIds = currentMemberships.get(id) ?? [];
    const previousCustomValuesWithoutDeletedDefinitions = Object.fromEntries(
      Object.entries(previous.customFieldValues).filter(([fieldId]) =>
        candidateFieldIds.has(fieldId),
      ),
    );
    if (
      changed(employeeBuiltInScalar(previous), employeeBuiltInScalar(employee)) ||
      changed(previousCustomValuesWithoutDeletedDefinitions, employee.customFieldValues)
    ) {
      assert(canForEmployee(access, account, "employee.update", previous, unitIds));
    }
    const previousTagsWithoutDeletedDefinitions = previous.tags.filter((tag) =>
      candidateTagIds.has(tag.tagId),
    );
    if (changed(previousTagsWithoutDeletedDefinitions, employee.tags)) {
      assert(canForEmployee(access, account, "tag.assign", previous, unitIds));
    }
  }
  for (const id of byId.keys())
    assert(nextById.has(id) || hasPermission(access, "employee.delete"));
};

const assertUnitChanges = (
  current: OrgToolsViewDocument,
  candidate: OrgToolsViewDocument,
  access: EffectiveAccess,
  deletedTagIds: ReadonlySet<string>,
): void => {
  const oldUnits = new Map(current.structure.units.map((unit) => [unit.id, unit]));
  const nextUnits = new Map(candidate.structure.units.map((unit) => [unit.id, unit]));
  const descendants = (units: Map<UnitId, OrgEditorUnit>, rootId: UnitId): OrgEditorUnit[] => {
    const result: OrgEditorUnit[] = [];
    const pending = [rootId];
    const visited = new Set<UnitId>();
    while (pending.length > 0) {
      const parentId = pending.shift();
      if (!parentId || visited.has(parentId)) continue;
      visited.add(parentId);
      for (const unit of units.values()) {
        if (unit.parentId !== parentId) continue;
        result.push(unit);
        pending.push(unit.id);
      }
    }
    return result;
  };
  for (const [id, unit] of nextUnits) {
    const previous = oldUnits.get(id);
    if (!previous) {
      const authorizationUnitId = unit.parentId ?? unit.id;
      assert(hasPermission(access, "unit.create", { unitId: authorizationUnitId }));
      if (unit.employeeIds.length > 0 || unit.employeePositions.length > 0 || unit.liveFilter) {
        assert(
          hasPermission(access, "employee.assignments.update", {
            unitId: authorizationUnitId,
          }),
        );
      }
      if (unit.bossEmployeeId) {
        assert(hasPermission(access, "unit.boss.assign", { unitId: authorizationUnitId }));
      }
      if (unit.staffingSlots.length > 0) {
        assert(hasPermission(access, "staffingSlot.create", { unitId: authorizationUnitId }));
      }
      continue;
    }
    assert(
      !changed(previous.name, unit.name) || hasPermission(access, "unit.update", { unitId: id }),
    );
    if (previous.parentId !== unit.parentId) {
      assert(hasPermission(access, "unit.reparent", { unitId: id }));
      for (const descendant of descendants(oldUnits, id)) {
        assert(hasPermission(access, "unit.reparent", { unitId: descendant.id }));
      }
      if (previous.parentId) {
        assert(hasPermission(access, "unit.reparent", { unitId: previous.parentId }));
      }
      if (unit.parentId) {
        assert(hasPermission(access, "unit.reparent", { unitId: unit.parentId }));
      }
    }
    const expectedAfterTagDeletion = (() => {
      if (!previous.liveFilter) return previous;
      const selectedTags = previous.liveFilter.selectedTags.filter(
        (tagId) => !deletedTagIds.has(tagId),
      );
      if (selectedTags.length === previous.liveFilter.selectedTags.length) return previous;
      const liveFilter = { ...previous.liveFilter, selectedTags };
      return hasEmployeeLiveFilterCriteria(liveFilter)
        ? { ...previous, liveFilter }
        : {
            ...previous,
            bossEmployeeId: null,
            employeeIds: [],
            employeePositions: [],
            liveFilter: null,
          };
    })();
    assert(
      expectedAfterTagDeletion.bossEmployeeId === unit.bossEmployeeId ||
        hasPermission(access, "unit.boss.assign", { unitId: id }),
    );
    assert(
      (!changed(expectedAfterTagDeletion.employeeIds, unit.employeeIds) &&
        !changed(expectedAfterTagDeletion.employeePositions, unit.employeePositions) &&
        !changed(expectedAfterTagDeletion.liveFilter, unit.liveFilter)) ||
        hasPermission(access, "employee.assignments.update", { unitId: id }),
    );
    const oldSlots = new Map(
      previous.staffingSlots.map((slot) => [
        slot.id,
        {
          ...slot,
          tags: slot.tags.filter((tag) => !deletedTagIds.has(tag.tagId)),
        },
      ]),
    );
    const newSlots = new Map(unit.staffingSlots.map((slot) => [slot.id, slot]));
    for (const [slotId, slot] of newSlots) {
      assert(
        oldSlots.has(slotId)
          ? !changed(oldSlots.get(slotId), slot) ||
              hasPermission(access, "staffingSlot.update", { unitId: id })
          : hasPermission(access, "staffingSlot.create", { unitId: id }),
      );
    }
    for (const slotId of oldSlots.keys()) {
      assert(newSlots.has(slotId) || hasPermission(access, "staffingSlot.delete", { unitId: id }));
    }
    const structuralBefore = {
      collapsed: previous.collapsed,
      noteMarkdown: previous.noteMarkdown,
      order: previous.order,
      x: previous.x,
      y: previous.y,
    };
    const structuralAfter = {
      collapsed: unit.collapsed,
      noteMarkdown: unit.noteMarkdown,
      order: unit.order,
      x: unit.x,
      y: unit.y,
    };
    if (changed(structuralBefore, structuralAfter)) {
      assert(
        hasPermission(
          access,
          current.kind === "system" ? "editor.system.layout.update" : "view.update",
          { unitId: id },
        ),
      );
    }
  }
  for (const id of oldUnits.keys()) {
    if (nextUnits.has(id)) continue;
    assert(hasPermission(access, "unit.delete", { unitId: id }));
  }
  if (
    changed(current.structure.canvasElements, candidate.structure.canvasElements) ||
    changed(current.structure.settings, candidate.structure.settings)
  ) {
    assert(
      hasPermission(
        access,
        current.kind === "system" ? "editor.system.layout.update" : "view.update",
      ),
    );
  }
};

const assertViewChanges = (
  current: OrganizationDocument,
  candidate: OrganizationDocument,
  access: EffectiveAccess,
): void => {
  const nextTagIds = new Set(candidate.tags.map((tag) => tag.id));
  const deletedTagIds = new Set(
    current.tags.filter((tag) => !nextTagIds.has(tag.id)).map((tag) => tag.id),
  );
  const oldViews = new Map(current.views.map((view) => [view.id, view]));
  const nextViews = new Map(candidate.views.map((view) => [view.id, view]));
  for (const [id, view] of nextViews) {
    const previous = oldViews.get(id);
    if (!previous) {
      assert(view.kind === "custom" && hasPermission(access, "view.create"));
      continue;
    }
    assert(previous.kind === view.kind);
    if (previous.kind === "custom" && view.kind === "custom" && previous.name !== view.name) {
      assert(hasPermission(access, "view.update"));
    }
    assertUnitChanges(previous, view, access, deletedTagIds);
  }
  for (const [id, view] of oldViews) {
    assert(nextViews.has(id) || (view.kind === "custom" && hasPermission(access, "view.delete")));
  }
};

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

const changedKeys = (left: Record<string, unknown>, right: Record<string, unknown>): string[] =>
  [...new Set([...Object.keys(left), ...Object.keys(right)])].filter((key) =>
    changed(left[key], right[key]),
  );

const assertPolicyWriteForEmployee = (
  policies: ResourcePolicyMap,
  context: { access: EffectiveAccess; account: Account; role: Role },
  kind: "employeeField" | "tag",
  resourceId: string,
  employeeId: string,
  unitIds: readonly UnitId[],
  fallback: boolean,
): void => {
  const withoutUnit = resourcePolicyAllowsWrite(
    policies,
    kind,
    resourceId,
    context,
    { employeeId },
    fallback,
  );
  assert(
    withoutUnit ||
      unitIds.some((unitId) =>
        resourcePolicyAllowsWrite(
          policies,
          kind,
          resourceId,
          context,
          { employeeId, unitId },
          fallback,
        ),
      ),
  );
};

const assertUnitPolicyChain = (
  policies: ResourcePolicyMap,
  context: { access: EffectiveAccess; account: Account; role: Role },
  view: OrgToolsViewDocument,
  unitId: UnitId,
): void => {
  const units = new Map(view.structure.units.map((unit) => [unit.id, unit]));
  let current = units.get(unitId);
  const visited = new Set<UnitId>();
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    assert(
      resourcePolicyAllowsWrite(
        policies,
        "unit",
        current.id,
        context,
        { unitId: current.id },
        true,
      ),
    );
    current = current.parentId ? units.get(current.parentId) : undefined;
  }
};

const assertResourcePolicyChanges = (input: {
  access: EffectiveAccess;
  account: Account;
  candidate: OrganizationDocument;
  current: OrganizationDocument;
  policies: ResourcePolicyMap;
  role: Role;
}): void => {
  if (input.access.isSuperAdmin) return;
  const context = { access: input.access, account: input.account, role: input.role };
  const currentMemberships = memberships(input.current);
  const candidateMemberships = memberships(input.candidate);
  const currentEmployees = new Map(
    input.current.employees.map((employee) => [employee.id, employee]),
  );
  for (const employee of input.candidate.employees) {
    const previous = currentEmployees.get(employee.id);
    const unitIds = previous
      ? (currentMemberships.get(employee.id) ?? [])
      : (candidateMemberships.get(employee.id) ?? []);
    if (!previous) {
      const builtInValues = employeeScalar(employee) as Record<string, unknown>;
      for (const field of BUILT_IN_EMPLOYEE_FIELDS) {
        const value = builtInValues[field];
        const isSet =
          value !== null && value !== undefined && value !== "" && value !== "unspecified";
        if (!isSet) continue;
        assertPolicyWriteForEmployee(
          input.policies,
          context,
          "employeeField",
          `builtin:${field}`,
          employee.id,
          unitIds,
          true,
        );
      }
      for (const fieldId of Object.keys(employee.customFieldValues)) {
        assertPolicyWriteForEmployee(
          input.policies,
          context,
          "employeeField",
          fieldId,
          employee.id,
          unitIds,
          false,
        );
      }
      for (const tag of employee.tags) {
        assertPolicyWriteForEmployee(
          input.policies,
          context,
          "tag",
          tag.tagId,
          employee.id,
          unitIds,
          true,
        );
      }
      continue;
    }
    for (const field of BUILT_IN_EMPLOYEE_FIELDS) {
      if (!changed(previous[field], employee[field])) continue;
      assertPolicyWriteForEmployee(
        input.policies,
        context,
        "employeeField",
        `builtin:${field}`,
        employee.id,
        unitIds,
        true,
      );
    }
    for (const fieldId of changedKeys(previous.customFieldValues, employee.customFieldValues)) {
      assertPolicyWriteForEmployee(
        input.policies,
        context,
        "employeeField",
        fieldId,
        employee.id,
        unitIds,
        false,
      );
    }
    const previousTags = new Map(previous.tags.map((tag) => [tag.tagId, tag]));
    const nextTags = new Map(employee.tags.map((tag) => [tag.tagId, tag]));
    for (const tagId of new Set([...previousTags.keys(), ...nextTags.keys()])) {
      if (!changed(previousTags.get(tagId), nextTags.get(tagId))) continue;
      assertPolicyWriteForEmployee(
        input.policies,
        context,
        "tag",
        tagId,
        employee.id,
        unitIds,
        true,
      );
    }
  }

  const currentFields = new Map(
    input.current.employeeFieldDefinitions.map((field) => [field.id, field]),
  );
  for (const field of input.candidate.employeeFieldDefinitions) {
    if (!changed(currentFields.get(field.id), field)) continue;
    assert(
      resourcePolicyAllowsWrite(
        input.policies,
        "employeeField",
        field.id,
        context,
        undefined,
        false,
      ),
    );
  }
  for (const field of input.current.employeeFieldDefinitions) {
    if (input.candidate.employeeFieldDefinitions.some((candidate) => candidate.id === field.id))
      continue;
    assert(
      resourcePolicyAllowsWrite(
        input.policies,
        "employeeField",
        field.id,
        context,
        undefined,
        false,
      ),
    );
  }
  const currentTags = new Map(input.current.tags.map((tag) => [tag.id, tag]));
  for (const tag of input.candidate.tags) {
    if (!changed(currentTags.get(tag.id), tag)) continue;
    assert(resourcePolicyAllowsWrite(input.policies, "tag", tag.id, context, undefined, true));
  }
  for (const tag of input.current.tags) {
    if (input.candidate.tags.some((candidate) => candidate.id === tag.id)) continue;
    assert(resourcePolicyAllowsWrite(input.policies, "tag", tag.id, context, undefined, true));
  }

  const currentViews = new Map(input.current.views.map((view) => [view.id, view]));
  for (const view of input.candidate.views) {
    const previousView = currentViews.get(view.id);
    if (!previousView || !changed(previousView, view)) continue;
    assert(
      resourcePolicyAllowsWrite(
        input.policies,
        "view",
        view.id,
        context,
        undefined,
        view.kind === "system",
      ),
    );
    const previousUnits = new Map(previousView.structure.units.map((unit) => [unit.id, unit]));
    const candidateUnits = new Map(view.structure.units.map((unit) => [unit.id, unit]));
    for (const unit of view.structure.units) {
      const previousUnit = previousUnits.get(unit.id);
      if (!previousUnit) {
        if (unit.parentId) assertUnitPolicyChain(input.policies, context, view, unit.parentId);
      } else if (changed(previousUnit, unit)) {
        assertUnitPolicyChain(input.policies, context, previousView, unit.id);
        assertUnitPolicyChain(input.policies, context, view, unit.id);
      } else {
        continue;
      }
      const oldSlots = new Map((previousUnit?.staffingSlots ?? []).map((slot) => [slot.id, slot]));
      const newSlots = new Map(unit.staffingSlots.map((slot) => [slot.id, slot]));
      for (const slot of unit.staffingSlots) {
        if (!changed(oldSlots.get(slot.id), slot)) continue;
        assert(
          resourcePolicyAllowsWrite(
            input.policies,
            "staffingSlot",
            slot.id,
            context,
            { unitId: unit.id },
            true,
          ),
        );
      }
      for (const slot of previousUnit?.staffingSlots ?? []) {
        if (newSlots.has(slot.id)) continue;
        assert(
          resourcePolicyAllowsWrite(
            input.policies,
            "staffingSlot",
            slot.id,
            context,
            { unitId: unit.id },
            true,
          ),
        );
      }
      if (previousUnit?.parentId !== unit.parentId) {
        const descendants = previousView.structure.units.filter((candidate) => {
          let parentId = candidate.parentId;
          const visited = new Set<UnitId>();
          while (parentId && !visited.has(parentId)) {
            if (parentId === unit.id) return true;
            visited.add(parentId);
            parentId = previousUnits.get(parentId)?.parentId ?? null;
          }
          return false;
        });
        for (const descendant of descendants) {
          assertUnitPolicyChain(input.policies, context, previousView, descendant.id);
          if (candidateUnits.has(descendant.id)) {
            assertUnitPolicyChain(input.policies, context, view, descendant.id);
          }
        }
      }
    }
    for (const unit of previousView.structure.units) {
      if (candidateUnits.has(unit.id)) continue;
      assertUnitPolicyChain(input.policies, context, previousView, unit.id);
      for (const slot of unit.staffingSlots) {
        assert(
          resourcePolicyAllowsWrite(
            input.policies,
            "staffingSlot",
            slot.id,
            context,
            { unitId: unit.id },
            true,
          ),
        );
      }
    }
  }
  for (const view of input.current.views) {
    if (input.candidate.views.some((candidate) => candidate.id === view.id)) continue;
    assert(
      resourcePolicyAllowsWrite(
        input.policies,
        "view",
        view.id,
        context,
        undefined,
        view.kind === "system",
      ),
    );
    for (const unit of view.structure.units) {
      assertUnitPolicyChain(input.policies, context, view, unit.id);
    }
  }
};

export const authorizeOrganizationReplacement = (input: {
  access: EffectiveAccess;
  account: Account;
  candidate: OrganizationDocument;
  current: OrganizationDocument;
  policies: ResourcePolicyMap;
  role: Role;
}): void => {
  if (input.access.isSuperAdmin) return;
  assertCatalogChanges(input.current, input.candidate, input.access);
  assertEmployeeChanges(input.current, input.candidate, input.access, input.account);
  assertViewChanges(input.current, input.candidate, input.access);
  assertResourcePolicyChanges(input);
};
