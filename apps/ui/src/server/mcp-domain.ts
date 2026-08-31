import type {
  EditableEmployeeFields,
  OrganizationEmployee,
  OrgEditorEmployee,
  OrgEditorEmployeeOverride,
  OrgEditorUnit,
  OrgToolsState,
  OrgToolsViewDocument,
} from "@org-tools/types";

import { isUuid } from "@/lib/employee-data";
import { parseOrgToolsState } from "@/lib/org-file";
import {
  type McpChangeSummary,
  type McpOperation,
  mcpOperationsSchema,
  type SemanticDiffEntry,
  type SemanticEntityType,
} from "@/server/mcp-types";

const GRID_STEP = 24;
const EMPLOYEE_FIELDS = [
  "avatarBase64Url",
  "birthday",
  "email",
  "firstName",
  "gender",
  "lastName",
  "phone",
  "profileUrl",
  "tags",
  "username",
] as const satisfies readonly (keyof EditableEmployeeFields)[];
const UNIT_FIELDS = [
  "bossEmployeeId",
  "collapsed",
  "employeeIds",
  "employeePositions",
  "liveFilter",
  "name",
  "order",
  "parentId",
  "x",
  "y",
] as const satisfies readonly (keyof OrgEditorUnit)[];

export type McpDomainErrorCode =
  | "invalid_operation"
  | "not_found"
  | "revision_conflict"
  | "undo_conflict";

export class McpDomainError extends Error {
  readonly code: McpDomainErrorCode;
  readonly details?: unknown;

  constructor(code: McpDomainErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "McpDomainError";
    this.code = code;
    this.details = details;
  }
}

type DomainOptions = {
  idFactory?: () => string;
  now?: () => string;
};

const jsonClone = <T>(value: T): T => structuredClone(value);
const jsonEqual = (left: unknown, right: unknown): boolean =>
  JSON.stringify(left) === JSON.stringify(right);
const snap = (value: number) => Math.round(value / GRID_STEP) * GRID_STEP;

const findView = (state: OrgToolsState, viewId: string): OrgToolsViewDocument => {
  const view = state.organization.views.find((candidate) => candidate.id === viewId);
  if (!view) throw new McpDomainError("not_found", "View was not found.", { viewId });
  return view;
};

const findUnit = (view: OrgToolsViewDocument, unitId: string): OrgEditorUnit => {
  const unit = view.document.units.find((candidate) => candidate.id === unitId);
  if (!unit) {
    throw new McpDomainError("not_found", "Unit was not found.", { unitId, viewId: view.id });
  }
  return unit;
};

const availableEmployeeIds = (state: OrgToolsState, view: OrgToolsViewDocument): Set<string> =>
  new Set([
    ...state.organization.employees.map((employee) => employee.id),
    ...view.document.employees.map((employee) => employee.id),
  ]);

const resolveRefsInLiveFilter = (
  liveFilter: OrgEditorUnit["liveFilter"],
  resolve: (value: string) => string,
): OrgEditorUnit["liveFilter"] =>
  liveFilter
    ? { ...jsonClone(liveFilter), selectedUnitIds: liveFilter.selectedUnitIds.map(resolve) }
    : null;

const createEmployee = (
  fields: EditableEmployeeFields,
  id: string,
  timestamp: string,
): OrganizationEmployee => ({
  ...jsonClone(fields),
  createdAt: timestamp,
  id,
  updatedAt: timestamp,
});

const createViewEmployee = (
  fields: EditableEmployeeFields,
  id: string,
  timestamp: string,
): OrgEditorEmployee => ({ ...jsonClone(fields), createdAt: timestamp, id, updatedAt: timestamp });

const pruneEmployeeReferences = (state: OrgToolsState, employeeId: string): void => {
  for (const view of state.organization.views) {
    view.document.employeeOverrides = view.document.employeeOverrides.filter(
      (override) => override.employeeId !== employeeId,
    );
    for (const unit of view.document.units) {
      unit.employeeIds = unit.employeeIds.filter((id) => id !== employeeId);
      unit.employeePositions = unit.employeePositions.filter(
        (position) => position.employeeId !== employeeId,
      );
      if (unit.bossEmployeeId === employeeId) unit.bossEmployeeId = null;
    }
  }
  state.ui.download.excludedEmployeeIds = state.ui.download.excludedEmployeeIds.filter(
    (id) => id !== employeeId,
  );
  state.ui.download.selections = state.ui.download.selections.filter(
    (selection) => selection.type !== "employee" || selection.employeeId !== employeeId,
  );
  for (const viewUi of state.ui.views) {
    viewUi.selectedItems = viewUi.selectedItems.filter(
      (item) => item.type !== "employee" || item.employeeId !== employeeId,
    );
  }
};

const pruneStateReferences = (state: OrgToolsState): void => {
  const viewIds = new Set(state.organization.views.map((view) => view.id));
  const main = state.organization.views.find((view) => view.kind === "main");
  if (!main) return;
  if (!viewIds.has(state.ui.activeViewId)) state.ui.activeViewId = main.id;
  if (!viewIds.has(state.ui.download.sourceViewId)) state.ui.download.sourceViewId = main.id;
  const unitIds = new Set(
    state.organization.views.flatMap((view) => view.document.units.map((unit) => unit.id)),
  );
  const mainUnitIds = new Set(main.document.units.map((unit) => unit.id));
  state.ui.expandedUnitIds = state.ui.expandedUnitIds.filter((id) => mainUnitIds.has(id));
  if (state.ui.selectedUnitId && !mainUnitIds.has(state.ui.selectedUnitId))
    state.ui.selectedUnitId = null;
  state.ui.views = state.ui.views
    .filter((viewUi) => viewIds.has(viewUi.viewId))
    .map((viewUi) => ({
      ...viewUi,
      selectedItems: viewUi.selectedItems.filter((item) => unitIds.has(item.unitId)),
    }));
  for (const view of state.organization.views) {
    if (!state.ui.views.some((viewUi) => viewUi.viewId === view.id)) {
      state.ui.views.push({
        selectedItems: [],
        viewId: view.id,
        viewport: { scale: 1, x: 0, y: 0 },
      });
    }
  }
  const filterGroups = [
    state.ui.analytics.filters,
    state.ui.employees.filters,
    state.ui.units.employeeFilters,
    state.ui.download.employeeFilters,
    state.ui.download.selectedFilters,
  ];
  for (const filters of filterGroups) {
    filters.selectedUnitIds = filters.selectedUnitIds.filter((id) => unitIds.has(id));
  }
  state.ui.download.selections = state.ui.download.selections.filter(
    (selection) => selection.type !== "unit" || unitIds.has(selection.unitId),
  );
};

const cloneViewFromSource = (
  source: OrgToolsViewDocument | undefined,
  idFactory: () => string,
): OrgToolsViewDocument["document"] => {
  if (!source) {
    return { employeeOverrides: [], employees: [], layoutMode: "topDown", units: [] };
  }
  const unitIds = new Map(source.document.units.map((unit) => [unit.id, idFactory()]));
  return {
    employeeOverrides: [],
    employees: [],
    layoutMode: source.document.layoutMode,
    units: source.document.units.map((unit) => ({
      ...jsonClone(unit),
      id: unitIds.get(unit.id) ?? idFactory(),
      liveFilter: unit.liveFilter
        ? {
            ...jsonClone(unit.liveFilter),
            selectedUnitIds: unit.liveFilter.selectedUnitIds.map((id) => unitIds.get(id) ?? id),
          }
        : null,
      parentId: unit.parentId ? (unitIds.get(unit.parentId) ?? null) : null,
    })),
  };
};

const descendantUnitIds = (view: OrgToolsViewDocument, rootId: string): Set<string> => {
  const result = new Set([rootId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const unit of view.document.units) {
      if (unit.parentId && result.has(unit.parentId) && !result.has(unit.id)) {
        result.add(unit.id);
        changed = true;
      }
    }
  }
  return result;
};

const applyOperations = (
  inputState: OrgToolsState,
  rawOperations: unknown,
  options: DomainOptions = {},
): { resolvedRefs: Record<string, string>; state: OrgToolsState } => {
  let operations: McpOperation[];
  try {
    operations = mcpOperationsSchema.parse(rawOperations);
  } catch (error) {
    throw new McpDomainError("invalid_operation", "Operations are invalid.", { cause: error });
  }
  const state = jsonClone(inputState);
  const refs = new Map<string, string>();
  const idFactory = options.idFactory ?? (() => crypto.randomUUID());
  const now = options.now ?? (() => new Date().toISOString());
  const resolve = (value: string): string => {
    if (isUuid(value)) return value;
    const resolved = refs.get(value);
    if (!resolved)
      throw new McpDomainError("invalid_operation", "Temporary reference is unknown.", {
        ref: value,
      });
    return resolved;
  };
  const register = (ref: string | undefined): string => {
    const id = idFactory();
    if (ref) {
      if (isUuid(ref) || refs.has(ref)) {
        throw new McpDomainError(
          "invalid_operation",
          "Temporary reference is invalid or duplicated.",
          { ref },
        );
      }
      refs.set(ref, id);
    }
    return id;
  };

  for (const operation of operations) {
    const timestamp = now();
    switch (operation.type) {
      case "employee.create": {
        const id = register(operation.ref);
        state.organization.employees.push(createEmployee(operation.employee, id, timestamp));
        break;
      }
      case "employee.update": {
        const id = resolve(operation.employeeId);
        const employee = state.organization.employees.find((candidate) => candidate.id === id);
        if (!employee)
          throw new McpDomainError("not_found", "Employee was not found.", { employeeId: id });
        Object.assign(employee, jsonClone(operation.patch), { updatedAt: timestamp });
        break;
      }
      case "employee.delete": {
        const id = resolve(operation.employeeId);
        if (!state.organization.employees.some((employee) => employee.id === id)) {
          throw new McpDomainError("not_found", "Employee was not found.", { employeeId: id });
        }
        state.organization.employees = state.organization.employees.filter(
          (employee) => employee.id !== id,
        );
        pruneEmployeeReferences(state, id);
        break;
      }
      case "unit.create": {
        const view = findView(state, resolve(operation.viewId));
        const id = register(operation.ref);
        const unitInput = operation.unit;
        const employeeIds = (unitInput.employeeIds ?? []).map(resolve);
        const liveFilter = resolveRefsInLiveFilter(unitInput.liveFilter ?? null, resolve);
        view.document.units.push({
          bossEmployeeId: unitInput.bossEmployeeId ? resolve(unitInput.bossEmployeeId) : null,
          collapsed: unitInput.collapsed ?? false,
          createdAt: timestamp,
          employeeIds: liveFilter ? [] : employeeIds,
          employeePositions: (unitInput.employeePositions ?? []).map((position) => ({
            employeeId: resolve(position.employeeId),
            position: position.position?.trim() || null,
          })),
          id,
          liveFilter,
          name: unitInput.name,
          order:
            unitInput.order ?? Math.max(-1, ...view.document.units.map((unit) => unit.order)) + 1,
          parentId: unitInput.parentId ? resolve(unitInput.parentId) : null,
          updatedAt: timestamp,
          x: snap(unitInput.x ?? 0),
          y: snap(unitInput.y ?? 0),
        });
        view.updatedAt = timestamp;
        break;
      }
      case "unit.update": {
        const view = findView(state, resolve(operation.viewId));
        const unit = findUnit(view, resolve(operation.unitId));
        const patch = jsonClone(operation.patch);
        if (patch.parentId !== undefined)
          patch.parentId = patch.parentId ? resolve(patch.parentId) : null;
        if (patch.bossEmployeeId !== undefined)
          patch.bossEmployeeId = patch.bossEmployeeId ? resolve(patch.bossEmployeeId) : null;
        if (patch.employeeIds) patch.employeeIds = patch.employeeIds.map(resolve);
        if (patch.employeePositions)
          patch.employeePositions = patch.employeePositions.map((position) => ({
            ...position,
            employeeId: resolve(position.employeeId),
          }));
        if (patch.liveFilter !== undefined)
          patch.liveFilter = resolveRefsInLiveFilter(patch.liveFilter, resolve);
        if (patch.x !== undefined) patch.x = snap(patch.x);
        if (patch.y !== undefined) patch.y = snap(patch.y);
        Object.assign(unit, patch, { updatedAt: timestamp });
        if (unit.liveFilter) unit.employeeIds = [];
        view.updatedAt = timestamp;
        break;
      }
      case "unit.delete": {
        const view = findView(state, resolve(operation.viewId));
        const unitId = resolve(operation.unitId);
        findUnit(view, unitId);
        const ids = descendantUnitIds(view, unitId);
        if (ids.size > 1 && !operation.cascade) {
          throw new McpDomainError(
            "invalid_operation",
            "Unit has descendants; cascade is required.",
            { unitId },
          );
        }
        view.document.units = view.document.units.filter((unit) => !ids.has(unit.id));
        for (const unit of view.document.units) {
          if (unit.liveFilter)
            unit.liveFilter.selectedUnitIds = unit.liveFilter.selectedUnitIds.filter(
              (id) => !ids.has(id),
            );
        }
        view.updatedAt = timestamp;
        break;
      }
      case "unit.assignEmployee": {
        const view = findView(state, resolve(operation.viewId));
        const unit = findUnit(view, resolve(operation.unitId));
        const employeeId = resolve(operation.employeeId);
        if (!availableEmployeeIds(state, view).has(employeeId))
          throw new McpDomainError("not_found", "Employee was not found in the View.", {
            employeeId,
            viewId: view.id,
          });
        if (!unit.liveFilter && !unit.employeeIds.includes(employeeId))
          unit.employeeIds.push(employeeId);
        if (operation.position !== undefined) {
          unit.employeePositions = unit.employeePositions.filter(
            (position) => position.employeeId !== employeeId,
          );
          if (operation.position?.trim())
            unit.employeePositions.push({ employeeId, position: operation.position.trim() });
        }
        if (operation.isBoss === true) unit.bossEmployeeId = employeeId;
        else if (operation.isBoss === false && unit.bossEmployeeId === employeeId)
          unit.bossEmployeeId = null;
        unit.updatedAt = timestamp;
        view.updatedAt = timestamp;
        break;
      }
      case "unit.unassignEmployee": {
        const view = findView(state, resolve(operation.viewId));
        const unit = findUnit(view, resolve(operation.unitId));
        const employeeId = resolve(operation.employeeId);
        unit.employeeIds = unit.employeeIds.filter((id) => id !== employeeId);
        unit.employeePositions = unit.employeePositions.filter(
          (position) => position.employeeId !== employeeId,
        );
        if (unit.bossEmployeeId === employeeId) unit.bossEmployeeId = null;
        unit.updatedAt = timestamp;
        view.updatedAt = timestamp;
        break;
      }
      case "view.create": {
        const id = register(operation.ref);
        if (
          state.organization.views.some(
            (view) =>
              view.name.toLocaleLowerCase("en-US") === operation.name.toLocaleLowerCase("en-US"),
          )
        ) {
          throw new McpDomainError("invalid_operation", "View name is already in use.", {
            name: operation.name,
          });
        }
        const source = operation.sourceViewId
          ? findView(state, resolve(operation.sourceViewId))
          : undefined;
        state.organization.views.push({
          createdAt: timestamp,
          document: cloneViewFromSource(source, idFactory),
          id,
          kind: "custom",
          name: operation.name,
          updatedAt: timestamp,
        });
        break;
      }
      case "view.rename": {
        const view = findView(state, resolve(operation.viewId));
        if (view.kind === "main")
          throw new McpDomainError("invalid_operation", "Main View cannot be renamed.");
        if (
          state.organization.views.some(
            (candidate) =>
              candidate.id !== view.id &&
              candidate.name.toLocaleLowerCase("en-US") ===
                operation.name.toLocaleLowerCase("en-US"),
          )
        ) {
          throw new McpDomainError("invalid_operation", "View name is already in use.", {
            name: operation.name,
          });
        }
        view.name = operation.name;
        view.updatedAt = timestamp;
        break;
      }
      case "view.delete": {
        const viewId = resolve(operation.viewId);
        const view = findView(state, viewId);
        if (view.kind === "main")
          throw new McpDomainError("invalid_operation", "Main View cannot be deleted.");
        state.organization.views = state.organization.views.filter(
          (candidate) => candidate.id !== viewId,
        );
        break;
      }
      case "view.replaceStructure": {
        const view = findView(state, resolve(operation.viewId));
        const document = operation.document;
        if (
          typeof document !== "object" ||
          document === null ||
          Array.isArray(document) ||
          !("employeeOverrides" in document) ||
          !Array.isArray(document.employeeOverrides) ||
          !("employees" in document) ||
          !Array.isArray(document.employees) ||
          !("units" in document) ||
          !Array.isArray(document.units)
        ) {
          throw new McpDomainError("invalid_operation", "View document is invalid.");
        }
        view.document = jsonClone(document) as OrgToolsViewDocument["document"];
        view.document.units = view.document.units.map((unit) => ({
          ...unit,
          x: snap(unit.x),
          y: snap(unit.y),
        }));
        view.updatedAt = timestamp;
        break;
      }
      case "view.arrange": {
        const view = findView(state, resolve(operation.viewId));
        if (operation.layoutMode) view.document.layoutMode = operation.layoutMode;
        const depthById = new Map<string, number>();
        const depth = (unit: OrgEditorUnit, stack = new Set<string>()): number => {
          if (depthById.has(unit.id)) return depthById.get(unit.id) ?? 0;
          if (!unit.parentId || stack.has(unit.id)) return 0;
          stack.add(unit.id);
          const parent = view.document.units.find((candidate) => candidate.id === unit.parentId);
          const result = parent ? depth(parent, stack) + 1 : 0;
          depthById.set(unit.id, result);
          return result;
        };
        const rowByDepth = new Map<number, number>();
        for (const unit of [...view.document.units].sort(
          (left, right) => left.order - right.order || left.id.localeCompare(right.id),
        )) {
          const unitDepth = depth(unit);
          const row = rowByDepth.get(unitDepth) ?? 0;
          rowByDepth.set(unitDepth, row + 1);
          const primary = snap(unitDepth * 360);
          const secondary = snap(row * 240);
          unit.x = view.document.layoutMode === "leftRight" ? primary : secondary;
          unit.y = view.document.layoutMode === "leftRight" ? secondary : primary;
          unit.updatedAt = timestamp;
        }
        view.updatedAt = timestamp;
        break;
      }
      case "viewEmployee.create": {
        const view = findView(state, resolve(operation.viewId));
        if (view.kind !== "custom")
          throw new McpDomainError(
            "invalid_operation",
            "Main View cannot contain local Employees.",
          );
        view.document.employees.push(
          createViewEmployee(operation.employee, register(operation.ref), timestamp),
        );
        view.updatedAt = timestamp;
        break;
      }
      case "viewEmployee.update": {
        const view = findView(state, resolve(operation.viewId));
        const employeeId = resolve(operation.employeeId);
        const employee = view.document.employees.find((candidate) => candidate.id === employeeId);
        if (!employee)
          throw new McpDomainError("not_found", "View-local Employee was not found.", {
            employeeId,
            viewId: view.id,
          });
        Object.assign(employee, jsonClone(operation.patch), { updatedAt: timestamp });
        view.updatedAt = timestamp;
        break;
      }
      case "viewEmployee.delete": {
        const view = findView(state, resolve(operation.viewId));
        const employeeId = resolve(operation.employeeId);
        if (!view.document.employees.some((employee) => employee.id === employeeId))
          throw new McpDomainError("not_found", "View-local Employee was not found.", {
            employeeId,
            viewId: view.id,
          });
        view.document.employees = view.document.employees.filter(
          (employee) => employee.id !== employeeId,
        );
        pruneEmployeeReferences(state, employeeId);
        view.updatedAt = timestamp;
        break;
      }
      case "viewOverride.upsert": {
        const view = findView(state, resolve(operation.viewId));
        if (view.kind !== "custom")
          throw new McpDomainError(
            "invalid_operation",
            "Main View cannot contain Employee overrides.",
          );
        const employeeId = resolve(operation.employeeId);
        if (!state.organization.employees.some((employee) => employee.id === employeeId))
          throw new McpDomainError("not_found", "Organization Employee was not found.", {
            employeeId,
          });
        const override: OrgEditorEmployeeOverride = {
          ...jsonClone(operation.fields),
          employeeId,
          updatedAt: timestamp,
        };
        view.document.employeeOverrides = [
          ...view.document.employeeOverrides.filter(
            (candidate) => candidate.employeeId !== employeeId,
          ),
          override,
        ];
        view.updatedAt = timestamp;
        break;
      }
      case "viewOverride.delete": {
        const view = findView(state, resolve(operation.viewId));
        const employeeId = resolve(operation.employeeId);
        view.document.employeeOverrides = view.document.employeeOverrides.filter(
          (candidate) => candidate.employeeId !== employeeId,
        );
        view.updatedAt = timestamp;
        break;
      }
    }
  }

  pruneStateReferences(state);
  try {
    return { resolvedRefs: Object.fromEntries(refs), state: parseOrgToolsState(state) };
  } catch (error) {
    throw new McpDomainError("invalid_operation", "Operations produce an invalid organization.", {
      cause: error,
    });
  }
};

type DiffEntity = {
  entity: Record<string, unknown>;
  entityId: string;
  entityType: SemanticEntityType;
  fields: readonly string[];
  viewId: string | null;
};

const viewEntities = (organization: OrgToolsState["organization"]): DiffEntity[] => {
  const entities: DiffEntity[] = organization.employees.map((employee) => ({
    entity: employee as unknown as Record<string, unknown>,
    entityId: employee.id,
    entityType: "employee",
    fields: EMPLOYEE_FIELDS,
    viewId: null,
  }));
  for (const view of organization.views) {
    entities.push({
      entity: {
        ...(view as unknown as Record<string, unknown>),
        layoutMode: view.document.layoutMode,
      },
      entityId: view.id,
      entityType: "view",
      fields: ["name", "layoutMode"],
      viewId: null,
    });
    for (const unit of view.document.units) {
      entities.push({
        entity: unit as unknown as Record<string, unknown>,
        entityId: unit.id,
        entityType: "unit",
        fields: UNIT_FIELDS,
        viewId: view.id,
      });
    }
    for (const employee of view.document.employees) {
      entities.push({
        entity: employee as unknown as Record<string, unknown>,
        entityId: employee.id,
        entityType: "viewEmployee",
        fields: EMPLOYEE_FIELDS,
        viewId: view.id,
      });
    }
    for (const override of view.document.employeeOverrides) {
      entities.push({
        entity: override as unknown as Record<string, unknown>,
        entityId: override.employeeId,
        entityType: "viewOverride",
        fields: EMPLOYEE_FIELDS,
        viewId: view.id,
      });
    }
  }
  return entities;
};

const entityKey = (entity: Pick<DiffEntity, "entityId" | "entityType" | "viewId">) =>
  `${entity.entityType}\0${entity.viewId ?? ""}\0${entity.entityId}`;

export const createSemanticDiff = (
  before: OrgToolsState["organization"],
  after: OrgToolsState["organization"],
): SemanticDiffEntry[] => {
  const beforeEntities = new Map(viewEntities(before).map((entity) => [entityKey(entity), entity]));
  const afterEntities = new Map(viewEntities(after).map((entity) => [entityKey(entity), entity]));
  const keys = [...new Set([...beforeEntities.keys(), ...afterEntities.keys()])].sort();
  const diff: SemanticDiffEntry[] = [];
  const rootValue = (entity: DiffEntity) => {
    const value = jsonClone(entity.entity);
    if (entity.entityType === "view") delete value.layoutMode;
    return value;
  };
  for (const key of keys) {
    const previous = beforeEntities.get(key);
    const next = afterEntities.get(key);
    if (!previous || !next) {
      const entity = previous ?? next;
      if (!entity) continue;
      diff.push({
        after: next ? rootValue(next) : null,
        afterExists: Boolean(next),
        before: previous ? rootValue(previous) : null,
        beforeExists: Boolean(previous),
        entityId: entity.entityId,
        entityType: entity.entityType,
        field: null,
        viewId: entity.viewId,
      });
      continue;
    }
    for (const field of new Set([...previous.fields, ...next.fields])) {
      const beforeValue = previous.entity[field];
      const afterValue = next.entity[field];
      if (jsonEqual(beforeValue, afterValue)) continue;
      diff.push({
        after: jsonClone(afterValue),
        afterExists: true,
        before: jsonClone(beforeValue),
        beforeExists: true,
        entityId: next.entityId,
        entityType: next.entityType,
        field,
        viewId: next.viewId,
      });
    }
  }
  return diff;
};

const summarizeDiff = (diff: readonly SemanticDiffEntry[]): McpChangeSummary => {
  const created = diff.filter((entry) => entry.field === null && !entry.beforeExists).length;
  const deleted = diff.filter((entry) => entry.field === null && !entry.afterExists).length;
  const updatedKeys = new Set(
    diff
      .filter((entry) => entry.field !== null)
      .map((entry) => `${entry.entityType}:${entry.viewId ?? ""}:${entry.entityId}`),
  );
  const updated = updatedKeys.size;
  return {
    created,
    deleted,
    message: `Created ${created}, updated ${updated}, and deleted ${deleted} organization entities.`,
    updated,
  };
};

export const previewDomainOperations = (
  state: OrgToolsState,
  operations: unknown,
  options?: DomainOptions,
) => {
  const applied = applyOperations(state, operations, options);
  const diff = createSemanticDiff(state.organization, applied.state.organization);
  if (diff.length === 0)
    throw new McpDomainError("invalid_operation", "Operations do not change organization state.");
  return {
    affectedIds: [...new Set(diff.map((entry) => entry.entityId))].sort(),
    diff,
    resolvedRefs: applied.resolvedRefs,
    state: applied.state,
    summary: summarizeDiff(diff),
  };
};

const locateEntity = (
  organization: OrgToolsState["organization"],
  entry: SemanticDiffEntry,
): { container: unknown[]; entity: Record<string, unknown> | undefined; index: number } => {
  let container: unknown[];
  if (entry.entityType === "employee") container = organization.employees;
  else {
    const view = organization.views.find(
      (candidate) =>
        candidate.id === entry.viewId ||
        (entry.entityType === "view" && candidate.id === entry.entityId),
    );
    if (entry.entityType === "view") {
      container = organization.views;
      if (entry.field === "layoutMode" && view)
        return {
          container,
          entity: { layoutMode: view.document.layoutMode },
          index: organization.views.indexOf(view),
        };
    } else {
      if (!view) return { container: [], entity: undefined, index: -1 };
      if (entry.entityType === "unit") container = view.document.units;
      else if (entry.entityType === "viewEmployee") container = view.document.employees;
      else container = view.document.employeeOverrides;
    }
  }
  const index = container.findIndex((candidate) => {
    if (typeof candidate !== "object" || candidate === null) return false;
    const record = candidate as Record<string, unknown>;
    return (entry.entityType === "viewOverride" ? record.employeeId : record.id) === entry.entityId;
  });
  return {
    container,
    entity: index >= 0 ? (container[index] as Record<string, unknown>) : undefined,
    index,
  };
};

const currentDiffValue = (
  organization: OrgToolsState["organization"],
  entry: SemanticDiffEntry,
) => {
  const located = locateEntity(organization, entry);
  if (entry.field === null)
    return { exists: Boolean(located.entity), value: located.entity ?? null };
  if (entry.entityType === "view" && entry.field === "layoutMode") {
    const view = organization.views.find((candidate) => candidate.id === entry.entityId);
    return { exists: Boolean(view), value: view?.document.layoutMode };
  }
  return { exists: Boolean(located.entity), value: located.entity?.[entry.field] };
};

const applyDiffValue = (
  organization: OrgToolsState["organization"],
  entry: SemanticDiffEntry,
  direction: "after" | "before",
): void => {
  const exists = direction === "before" ? entry.beforeExists : entry.afterExists;
  const value = direction === "before" ? entry.before : entry.after;
  const located = locateEntity(organization, entry);
  if (entry.field === null) {
    if (!exists && located.index >= 0) located.container.splice(located.index, 1);
    else if (exists && located.index < 0) located.container.push(jsonClone(value));
    else if (exists && located.index >= 0) located.container[located.index] = jsonClone(value);
    return;
  }
  if (entry.entityType === "view" && entry.field === "layoutMode") {
    const view = organization.views.find((candidate) => candidate.id === entry.entityId);
    if (view) view.document.layoutMode = value as OrgToolsViewDocument["document"]["layoutMode"];
    return;
  }
  if (located.entity) located.entity[entry.field] = jsonClone(value);
};

export const previewSelectiveUndo = (
  current: OrgToolsState,
  forwardDiff: readonly SemanticDiffEntry[],
): {
  affectedIds: string[];
  diff: SemanticDiffEntry[];
  state: OrgToolsState;
  summary: McpChangeSummary;
} => {
  const conflicts = forwardDiff.flatMap((entry) => {
    const currentValue = currentDiffValue(current.organization, entry);
    return currentValue.exists === entry.afterExists && jsonEqual(currentValue.value, entry.after)
      ? []
      : [
          {
            entityId: entry.entityId,
            entityType: entry.entityType,
            field: entry.field,
            viewId: entry.viewId,
          },
        ];
  });
  if (conflicts.length > 0) {
    throw new McpDomainError("undo_conflict", "Undo overlaps later changes.", {
      conflicts: conflicts.slice(0, 50),
    });
  }
  const candidate = jsonClone(current);
  for (const entry of [...forwardDiff].reverse())
    applyDiffValue(candidate.organization, entry, "before");
  pruneStateReferences(candidate);
  let state: OrgToolsState;
  try {
    state = parseOrgToolsState(candidate);
  } catch (error) {
    throw new McpDomainError("undo_conflict", "Undo no longer produces a valid organization.", {
      cause: error,
    });
  }
  const diff = createSemanticDiff(current.organization, state.organization);
  return {
    affectedIds: [...new Set(diff.map((entry) => entry.entityId))].sort(),
    diff,
    state,
    summary: summarizeDiff(diff),
  };
};
