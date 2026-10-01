import type {
  AccountUiState,
  AuthorizedOrganizationProjection,
  EffectiveAccess,
  Permission,
  UiActiveTab,
} from "@org-tools/types";
import { createBlankOrgToolsState } from "@/lib/org-file";

const has = (access: EffectiveAccess, permission: Permission): boolean =>
  access.isSuperAdmin || access.grants.some((grant) => grant.permission === permission);

const allowedTabs = (access: EffectiveAccess): UiActiveTab[] => {
  const tabs: UiActiveTab[] = [];
  if (has(access, "employee.read")) tabs.push("employees");
  if (has(access, "unit.read")) tabs.push("units");
  if (has(access, "editor.system.read") || has(access, "view.read")) tabs.push("orgEditor");
  if (has(access, "calendar.read")) tabs.push("calendar");
  if (has(access, "dataDownload.create")) tabs.push("export");
  if (access.isSuperAdmin) tabs.push("administration");
  return tabs;
};

export const projectAccountUi = (input: {
  access: EffectiveAccess;
  projection: AuthorizedOrganizationProjection;
  ui: AccountUiState;
}): AccountUiState => {
  const blank = createBlankOrgToolsState(input.ui.theme, input.ui.locale).ui;
  const tabs = allowedTabs(input.access);
  const activeTab = tabs.includes(input.ui.activeTab)
    ? input.ui.activeTab
    : (tabs[0] ?? "employees");
  const viewById = new Map(input.projection.views.map((view) => [view.id, view]));
  const firstView =
    input.projection.views.find((view) => view.kind === "system") ?? input.projection.views[0];
  const activeViewId = viewById.has(input.ui.editor.activeViewId)
    ? input.ui.editor.activeViewId
    : (firstView?.id ?? blank.editor.activeViewId);
  const sourceViewUiById = new Map(input.ui.editor.views.map((view) => [view.viewId, view]));
  const blankViewUi = blank.editor.views[0];
  if (!blankViewUi) throw new Error("Blank UI state is invalid.");

  const views = input.projection.views.map((view) => {
    const source = sourceViewUiById.get(view.id);
    const unitIds = new Set(view.structure.units.map((unit) => unit.id));
    const employeeIds = new Set(input.projection.employees.map((employee) => employee.id));
    const staffingSlotIds = new Set(
      view.structure.units.flatMap((unit) => unit.staffingSlots.map((slot) => slot.id)),
    );
    const elementIds = new Set(view.structure.canvasElements.map((element) => element.id));
    return {
      ...blankViewUi,
      distributionModeUnitIds: (source?.distributionModeUnitIds ?? []).filter((id) =>
        unitIds.has(id),
      ),
      selectedItems: (source?.selectedItems ?? []).filter((item) => {
        if (item.type === "unit") return unitIds.has(item.unitId);
        if (item.type === "employee") {
          return unitIds.has(item.unitId) && employeeIds.has(item.employeeId);
        }
        if (item.type === "staffingSlot") {
          return unitIds.has(item.unitId) && staffingSlotIds.has(item.staffingSlotId);
        }
        return elementIds.has(item.elementId);
      }),
      viewId: view.id,
      viewport: source?.viewport ?? blankViewUi.viewport,
    };
  });
  const visibleUnitIds = new Set(
    input.projection.views.flatMap((view) => view.structure.units.map((unit) => unit.id)),
  );
  const visibleTagIds = new Set(input.projection.tags.map((tag) => tag.id));
  const visibleCustomFieldIds = new Set(
    input.projection.employeeFieldDefinitions.map((field) => field.id),
  );
  const visibleEmployeeIds = new Set(input.projection.employees.map((employee) => employee.id));
  const safeFilters = (filters: AccountUiState["employees"]["filters"]) => ({
    ...filters,
    customFields: filters.customFields.filter((filter) =>
      visibleCustomFieldIds.has(filter.fieldId),
    ),
    selectedTags: filters.selectedTags.filter((tagId) => visibleTagIds.has(tagId)),
    selectedUnitIds: filters.selectedUnitIds.filter((unitId) => visibleUnitIds.has(unitId)),
  });
  const downloadSourceView = viewById.get(input.ui.download.sourceViewId) ?? firstView;
  const downloadUnitIds = new Set(downloadSourceView?.structure.units.map((unit) => unit.id) ?? []);
  const downloadFilters = (filters: AccountUiState["download"]["employeeFilters"]) => ({
    ...safeFilters(filters),
    selectedUnitIds: filters.selectedUnitIds.filter((unitId) => downloadUnitIds.has(unitId)),
  });
  const nonCustomDownloadOrder = input.ui.download.jsonTopLevelFieldOrder.filter(
    (field) => !field.startsWith("custom:"),
  );
  const unitsIndex = nonCustomDownloadOrder.indexOf("units");
  const customDownloadOrder = input.projection.employeeFieldDefinitions.map(
    (field) => `custom:${field.id}` as const,
  );
  const jsonTopLevelFieldOrder = [...nonCustomDownloadOrder];
  jsonTopLevelFieldOrder.splice(unitsIndex, 0, ...customDownloadOrder);

  return {
    ...blank,
    activeTab,
    calendar: input.ui.calendar,
    download: {
      ...input.ui.download,
      employeeFilters: downloadFilters(input.ui.download.employeeFilters),
      excludedEmployeeIds: input.ui.download.excludedEmployeeIds.filter((employeeId) =>
        visibleEmployeeIds.has(employeeId),
      ),
      excludedJsonUnitIds: input.ui.download.excludedJsonUnitIds.filter((unitId) =>
        downloadUnitIds.has(unitId),
      ),
      jsonFieldNames: {
        ...input.ui.download.jsonFieldNames,
        custom: Object.fromEntries(
          input.projection.employeeFieldDefinitions.map((field) => [
            field.id,
            input.ui.download.jsonFieldNames.custom[field.id] ?? field.key,
          ]),
        ),
      },
      jsonTopLevelFieldOrder,
      selectedCustomEmployeeFieldIds: input.ui.download.selectedCustomEmployeeFieldIds.filter(
        (fieldId) => visibleCustomFieldIds.has(fieldId),
      ),
      selectedFilters: downloadFilters(input.ui.download.selectedFilters),
      selections: input.ui.download.selections.filter((selection) =>
        selection.type === "employee"
          ? visibleEmployeeIds.has(selection.employeeId)
          : downloadUnitIds.has(selection.unitId),
      ),
      sourceViewId: downloadSourceView?.id ?? blank.download.sourceViewId,
    },
    editor: {
      activeViewId,
      searchOpen: input.ui.editor.searchOpen,
      searchQuery: input.ui.editor.searchQuery,
      views,
    },
    employees: {
      filters: safeFilters(input.ui.employees.filters),
      query: input.ui.employees.query,
    },
    expandedUnitIds: input.ui.expandedUnitIds.filter((unitId) => visibleUnitIds.has(unitId)),
    locale: input.ui.locale,
    selectedUnitId:
      input.ui.selectedUnitId && visibleUnitIds.has(input.ui.selectedUnitId)
        ? input.ui.selectedUnitId
        : null,
    sidebarCollapsed: input.ui.sidebarCollapsed,
    theme: input.ui.theme,
    units: {
      employeeFilters: safeFilters(input.ui.units.employeeFilters),
      employeeQuery: input.ui.units.employeeQuery,
      unitQuery: input.ui.units.unitQuery,
    },
  };
};
