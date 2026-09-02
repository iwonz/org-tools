import type {
  AppLocale,
  EditableEmployeeFields,
  EmployeeId,
  EmployeeTag,
  OrganizationEmployee,
  OrgToolsState,
  UiActiveTab,
  UiOrgStructure,
  UiTheme,
  UnitAssignment,
  UnitId,
} from "@org-tools/types";
import { makeAutoObservable, observable, reaction } from "mobx";
import { LocalizedError, uiMessage } from "@/i18n/messages";
import { type AnalyticsResult, buildAnalytics } from "@/lib/analytics";
import { buildOrganizationStructureWithResolution } from "@/lib/build-organization-structure";
import { createOrganizationEmployeeId, normalizeEditableEmployeeFields } from "@/lib/employee-data";
import type { EmployeeSearchFilters } from "@/lib/employee-search";
import { type EmployeeTagUpdate, normalizeEmployeeTags } from "@/lib/employee-tags";
import {
  buildEmployeeUnitContextIndex,
  buildEmployeeUnitMembershipIndex,
  type EmployeeUnitContext,
  type EmployeeUnitMembership,
} from "@/lib/employee-unit-contexts";
import {
  createBlankOrgToolsState,
  createEmptyEmployeeFiltersState,
  parseOrgToolsState,
} from "@/lib/org-file";
import type {
  ExportFieldDropPlacement,
  ExportFieldKey,
  ExportJsonEmployeeFieldKey,
  ExportJsonSettingsState,
  ExportJsonTagFieldKey,
  ExportJsonTopLevelFieldKey,
  ExportJsonUnitFieldKey,
  ExportRowMode,
  ExportSelection,
  ExportTabMode,
} from "@/stores/export-session-store";
import { ExportSessionStore } from "@/stores/export-session-store";
import { OrgEditorStore, type OrgEditorUnitConfiguration } from "@/stores/org-editor-store";

type AnalyticsIdleHandle = { id: number; type: "idle" | "timeout" };

export type AnalyticsBuildStatus = "building" | "idle" | "ready" | "scheduled";
export type {
  ExportEmployeeFieldKey,
  ExportFieldDropPlacement,
  ExportFieldKey,
  ExportJsonEmployeeFieldKey,
  ExportJsonFieldNames,
  ExportJsonSettingsState,
  ExportJsonTagFieldKey,
  ExportJsonTopLevelFieldKey,
  ExportJsonUnitFieldKey,
  ExportRowMode,
  ExportSelection,
  ExportTabMode,
  ExportUnitFieldKey,
} from "@/stores/export-session-store";

const requestAnalyticsIdleCallback = (callback: () => void): AnalyticsIdleHandle => {
  if (typeof window === "undefined") {
    callback();
    return { id: 0, type: "timeout" };
  }

  if (typeof window.requestIdleCallback === "function") {
    return {
      id: window.requestIdleCallback(() => callback(), { timeout: 1500 }),
      type: "idle",
    };
  }

  return {
    id: window.setTimeout(callback, 120),
    type: "timeout",
  };
};

const cancelAnalyticsIdleCallback = (handle: AnalyticsIdleHandle) => {
  if (typeof window === "undefined") return;

  if (handle.type === "idle" && typeof window.cancelIdleCallback === "function") {
    window.cancelIdleCallback(handle.id);
    return;
  }

  window.clearTimeout(handle.id);
};

const areTagsEqual = (firstTags: readonly EmployeeTag[], secondTags: readonly EmployeeTag[]) =>
  firstTags.length === secondTags.length &&
  firstTags.every((tag, index) => {
    const other = secondTags[index];
    return other !== undefined && tag.label === other.label && tag.date === other.date;
  });

export class OrgStore {
  organizationEmployees: OrganizationEmployee[] = [];
  uiOrgStructure: UiOrgStructure | null = null;
  theme: UiTheme = "system";
  activeTab: UiActiveTab = "orgEditor";
  selectedUnitId: UnitId | null = null;
  expandedUnitIds: UnitId[] = [];
  locale: AppLocale = "en";
  sidebarCollapsed = true;
  unitsUi = {
    employeeFilters: createEmptyEmployeeFiltersState(),
    employeeQuery: "",
    unitQuery: "",
  };
  employeesUi = { filters: createEmptyEmployeeFiltersState(), query: "" };
  editorUi = { searchOpen: false, searchQuery: "" };
  analyticsUi = { filters: createEmptyEmployeeFiltersState(), query: "" };
  calendarUi = {
    cloudExpanded: false,
    monthIndex: new Date().getMonth(),
    year: new Date().getFullYear(),
  };
  downloadUi = {
    employeeFilters: createEmptyEmployeeFiltersState(),
    employeeQuery: "",
    selectedFilters: createEmptyEmployeeFiltersState(),
    selectedQuery: "",
    unitQuery: "",
  };
  employeeUnitContextsByEmployeeId = new Map<EmployeeId, EmployeeUnitContext[]>();
  employeeUnitMembershipsByEmployeeId = new Map<EmployeeId, EmployeeUnitMembership>();
  exportSession = new ExportSessionStore();
  orgEditor = new OrgEditorStore(() => this.handleStructureDocumentChange());
  analyticsResult: AnalyticsResult | null = null;
  analyticsBuildStatus: AnalyticsBuildStatus = "idle";
  analyticsBuildFrameId: number | null = null;
  analyticsBuildIdleHandle: AnalyticsIdleHandle | null = null;
  analyticsBuildToken = 0;
  sourceFileName: string | null = null;
  sourceFileSizeBytes: number | null = null;
  isApplyingState = false;
  organizationChangeSequence = 0;
  uiChangeSequence = 0;

  constructor() {
    makeAutoObservable(
      this,
      {
        analyticsBuildFrameId: false,
        analyticsBuildIdleHandle: false,
        analyticsBuildToken: false,
        analyticsResult: observable.ref,
        employeeUnitContextsByEmployeeId: observable.ref,
        employeeUnitMembershipsByEmployeeId: observable.ref,
        expandedUnitIds: observable.shallow,
        unitsUi: observable.ref,
        employeesUi: observable.ref,
        editorUi: observable.ref,
        analyticsUi: observable.ref,
        calendarUi: observable.ref,
        downloadUi: observable.ref,
        exportSession: observable.ref,
        orgEditor: observable.ref,
        isApplyingState: false,
        uiOrgStructure: observable.ref,
        organizationEmployees: observable.shallow,
      },
      { autoBind: true },
    );
    this.createBlankState();
    reaction(
      () => this.organizationObservation,
      () => {
        if (!this.isApplyingState) this.organizationChangeSequence += 1;
      },
    );
    reaction(
      () => this.uiObservation,
      () => {
        if (!this.isApplyingState) this.uiChangeSequence += 1;
      },
    );
  }

  private get organizationObservation() {
    return [this.organizationEmployees, this.orgEditor.layoutMode, this.orgEditor.units];
  }

  private get uiObservation() {
    return [
      this.activeTab,
      this.locale,
      this.sidebarCollapsed,
      this.expandedUnitIds,
      this.selectedUnitId,
      this.theme,
      this.unitsUi,
      this.employeesUi,
      this.editorUi,
      this.analyticsUi,
      this.calendarUi,
      this.downloadUi,
      this.exportSession.tabMode,
      this.exportSession.rowMode,
      this.exportSession.selectedEmployeeFieldKeys,
      this.exportSession.jsonTopLevelFieldOrder,
      this.exportSession.selectedJsonUnitFieldKeys,
      this.exportSession.jsonUnitFieldOrder,
      this.exportSession.selectedJsonTagFieldKeys,
      this.exportSession.jsonTagFieldOrder,
      this.exportSession.jsonFieldNames,
      this.exportSession.excludedJsonUnitIds,
      this.exportSession.excludedJsonTagKeys,
      this.exportSession.templateFormat,
      this.exportSession.selections,
      this.exportSession.excludedEmployeeIds,
      this.orgEditor.selectedItems,
      this.orgEditor.viewport,
    ];
  }

  get units() {
    return this.uiOrgStructure;
  }

  get rootUnit() {
    return this.uiOrgStructure?.roots[0] ?? null;
  }

  get selectedUnit() {
    if (!this.uiOrgStructure) return null;
    if (this.selectedUnitId === null) return this.rootUnit;

    return this.uiOrgStructure.indexes.unitsById.get(this.selectedUnitId) ?? this.rootUnit;
  }

  get mainOrgEditor() {
    return this.orgEditor;
  }

  get exportTabMode() {
    return this.exportSession.tabMode;
  }
  get exportRowMode() {
    return this.exportSession.rowMode;
  }
  get exportSelectedEmployeeFieldKeys() {
    return this.exportSession.selectedEmployeeFieldKeys;
  }
  get exportJsonTopLevelFieldOrder() {
    return this.exportSession.jsonTopLevelFieldOrder;
  }
  get exportSelectedJsonUnitFieldKeys() {
    return this.exportSession.selectedJsonUnitFieldKeys;
  }
  get exportJsonUnitFieldOrder() {
    return this.exportSession.jsonUnitFieldOrder;
  }
  get exportSelectedJsonTagFieldKeys() {
    return this.exportSession.selectedJsonTagFieldKeys;
  }
  get exportJsonTagFieldOrder() {
    return this.exportSession.jsonTagFieldOrder;
  }
  get exportJsonFieldNames() {
    return this.exportSession.jsonFieldNames;
  }
  get exportExcludedJsonUnitIds() {
    return this.exportSession.excludedJsonUnitIds;
  }
  get exportExcludedJsonTagKeys() {
    return this.exportSession.excludedJsonTagKeys;
  }
  get exportTemplateFormat() {
    return this.exportSession.templateFormat;
  }
  get exportSelections() {
    return this.exportSession.selections;
  }
  get exportExcludedEmployeeIds() {
    return this.exportSession.excludedEmployeeIds;
  }

  loadOrgToolsState(
    state: OrgToolsState,
    sourceFileName: string | null,
    sourceFileSizeBytes: number | null,
  ): void {
    this.applyOrgToolsState(parseOrgToolsState(state), sourceFileName, sourceFileSizeBytes);
  }

  createBlankState(): void {
    this.applyOrgToolsState(createBlankOrgToolsState("system", this.locale), null, null);
  }

  private applyOrgToolsState(
    state: OrgToolsState,
    sourceFileName: string | null,
    sourceFileSizeBytes: number | null,
  ): void {
    const nextEmployees = state.organization.employees.map((employee) => ({
      ...employee,
      tags: employee.tags.map((tag) => ({ ...tag })),
    }));
    const nextEditor = new OrgEditorStore(() => this.handleStructureDocumentChange());
    const previousIsApplyingState = this.isApplyingState;
    this.isApplyingState = true;
    try {
      nextEditor.loadState({
        layoutMode: state.organization.structure.layoutMode,
        selectedItems: state.ui.editor.selectedItems,
        units: state.organization.structure.units,
        viewport: state.ui.editor.viewport,
      });
      const result = buildOrganizationStructureWithResolution(
        nextEmployees,
        nextEditor.createState(),
      );
      nextEditor.synchronizeLiveResolution(result.liveEmployeeIdsByUnitId);

      this.organizationEmployees = nextEmployees;
      this.orgEditor = nextEditor;
      this.uiOrgStructure = result.structure;
      this.theme = state.ui.theme;
      this.locale = state.ui.locale;
      this.activeTab = state.ui.activeTab;
      this.sidebarCollapsed = state.ui.sidebarCollapsed;
      this.selectedUnitId = state.ui.selectedUnitId;
      this.expandedUnitIds = [...state.ui.expandedUnitIds];
      this.unitsUi = structuredClone(state.ui.units);
      this.employeesUi = structuredClone(state.ui.employees);
      this.editorUi = {
        searchOpen: state.ui.editor.searchOpen,
        searchQuery: state.ui.editor.searchQuery,
      };
      this.analyticsUi = structuredClone(state.ui.analytics);
      this.calendarUi = { ...state.ui.calendar };
      this.downloadUi = {
        employeeFilters: structuredClone(state.ui.download.employeeFilters),
        employeeQuery: state.ui.download.employeeQuery,
        selectedFilters: structuredClone(state.ui.download.selectedFilters),
        selectedQuery: state.ui.download.selectedQuery,
        unitQuery: state.ui.download.unitQuery,
      };
      this.sourceFileName = sourceFileName;
      this.sourceFileSizeBytes = sourceFileSizeBytes;
      this.refreshEmployeeUnitContexts();
      this.exportSession.loadState(state.ui.download);
      this.resetAnalyticsCache();
      this.scheduleAnalyticsPrecompute();
    } finally {
      this.isApplyingState = previousIsApplyingState;
    }
    if (!previousIsApplyingState) {
      this.organizationChangeSequence += 1;
      this.uiChangeSequence += 1;
    }
  }

  setTheme(theme: UiTheme): void {
    this.theme = theme;
  }

  setLocale(locale: AppLocale): void {
    this.locale = locale;
  }

  setSidebarCollapsed(sidebarCollapsed: boolean): void {
    this.sidebarCollapsed = sidebarCollapsed;
  }

  setUnitsUi(next: Partial<typeof this.unitsUi>): void {
    this.unitsUi = { ...this.unitsUi, ...structuredClone(next) };
  }

  setEmployeesUi(query: string, filters: EmployeeSearchFilters): void {
    this.employeesUi = { filters: structuredClone(filters), query };
  }

  setEditorUi(next: Partial<typeof this.editorUi>): void {
    this.editorUi = { ...this.editorUi, ...next };
  }

  setAnalyticsUi(query: string, filters: EmployeeSearchFilters): void {
    this.analyticsUi = { filters: structuredClone(filters), query };
  }

  setCalendarUi(next: Partial<typeof this.calendarUi>): void {
    this.calendarUi = { ...this.calendarUi, ...next };
  }

  setDownloadUi(next: Partial<typeof this.downloadUi>): void {
    this.downloadUi = { ...this.downloadUi, ...structuredClone(next) };
  }

  setActiveTab(activeTab: UiActiveTab): void {
    this.activeTab = activeTab;
  }

  private handleStructureDocumentChange(): void {
    if (this.isApplyingState) return;
    this.rebuildMainModel();
  }

  private rebuildMainModel(): void {
    const result = buildOrganizationStructureWithResolution(
      this.organizationEmployees,
      this.orgEditor.createState(),
    );
    this.orgEditor.synchronizeLiveResolution(result.liveEmployeeIdsByUnitId);
    this.uiOrgStructure = result.structure;
    this.refreshEmployeeUnitContexts();
    this.resetAnalyticsCache();
    this.scheduleAnalyticsPrecompute();
  }

  resetAnalyticsCache(): void {
    this.clearScheduledAnalyticsBuild();
    this.analyticsBuildToken += 1;
    this.analyticsResult = null;
    this.analyticsBuildStatus = "idle";
  }

  scheduleAnalyticsPrecompute(): void {
    if (
      !this.uiOrgStructure ||
      this.analyticsResult ||
      this.analyticsBuildStatus === "building" ||
      this.analyticsBuildStatus === "scheduled"
    ) {
      return;
    }

    this.clearScheduledAnalyticsBuild();
    this.analyticsBuildStatus = "scheduled";
    const token = ++this.analyticsBuildToken;

    if (typeof window === "undefined") {
      this.buildAnalyticsResult(token);
      return;
    }

    this.analyticsBuildFrameId = window.requestAnimationFrame(() => {
      this.analyticsBuildFrameId = null;
      if (token !== this.analyticsBuildToken || !this.uiOrgStructure || this.analyticsResult)
        return;

      this.analyticsBuildIdleHandle = requestAnalyticsIdleCallback(() => {
        this.analyticsBuildIdleHandle = null;
        this.buildAnalyticsResult(token);
      });
    });
  }

  ensureAnalyticsResult(): void {
    if (!this.uiOrgStructure || this.analyticsResult || this.analyticsBuildStatus === "building") {
      return;
    }

    this.clearScheduledAnalyticsBuild();
    const token = ++this.analyticsBuildToken;
    this.buildAnalyticsResult(token);
  }

  clearScheduledAnalyticsBuild(): void {
    if (typeof window === "undefined") {
      this.analyticsBuildFrameId = null;
      this.analyticsBuildIdleHandle = null;
      return;
    }
    if (this.analyticsBuildFrameId !== null) {
      window.cancelAnimationFrame(this.analyticsBuildFrameId);
      this.analyticsBuildFrameId = null;
    }
    if (this.analyticsBuildIdleHandle !== null) {
      cancelAnalyticsIdleCallback(this.analyticsBuildIdleHandle);
      this.analyticsBuildIdleHandle = null;
    }
  }

  buildAnalyticsResult(token: number): void {
    const units = this.uiOrgStructure;
    if (!units || token !== this.analyticsBuildToken) {
      if (!units) {
        this.analyticsResult = null;
        this.analyticsBuildStatus = "idle";
      }
      return;
    }

    this.analyticsBuildStatus = "building";
    try {
      const nextAnalytics = buildAnalytics(units.allEmployees, {
        birthdayEmployeesByKey: units.indexes.birthdayEmployeesByKey,
      });
      if (token !== this.analyticsBuildToken || this.uiOrgStructure !== units) return;
      this.analyticsResult = nextAnalytics;
      this.analyticsBuildStatus = "ready";
    } catch (error) {
      console.error("Failed to build analytics.", error);
      if (token === this.analyticsBuildToken) {
        this.analyticsResult = null;
        this.analyticsBuildStatus = "idle";
      }
    }
  }

  resetExportSessionState(): void {
    this.exportSession.reset();
  }

  refreshEmployeeUnitContexts(): void {
    const employees = this.uiOrgStructure?.allEmployees ?? [];
    this.employeeUnitContextsByEmployeeId = buildEmployeeUnitContextIndex(employees);
    this.employeeUnitMembershipsByEmployeeId = buildEmployeeUnitMembershipIndex(
      employees,
      this.uiOrgStructure?.indexes.unitsById,
    );
  }

  setExportTabMode(value: ExportTabMode): void {
    this.exportSession.setTabMode(value);
  }
  setExportJsonSettings(value: ExportJsonSettingsState): void {
    this.exportSession.setJsonSettings(value);
  }
  setExportRowMode(value: ExportRowMode): void {
    this.exportSession.setRowMode(value);
  }
  setExportTemplateFormat(value: string): void {
    this.exportSession.setTemplateFormat(value);
  }
  appendExportTemplateField(value: ExportFieldKey): void {
    this.exportSession.appendTemplateField(value);
  }
  setExportJsonFieldName(
    group: "employee" | "tags" | "units",
    fieldKey: ExportJsonEmployeeFieldKey | ExportJsonTagFieldKey | ExportJsonUnitFieldKey,
    fieldName: string,
  ): void {
    this.exportSession.setJsonFieldName(group, fieldKey, fieldName);
  }
  resetExportJsonFieldName(
    group: "employee" | "tags" | "units",
    fieldKey: ExportJsonEmployeeFieldKey | ExportJsonTagFieldKey | ExportJsonUnitFieldKey,
  ): void {
    this.exportSession.resetJsonFieldName(group, fieldKey);
  }
  setExportJsonCollectionName(group: "tags" | "units", value: string): void {
    this.exportSession.setJsonCollectionName(group, value);
  }
  resetExportJsonCollectionName(group: "tags" | "units"): void {
    this.exportSession.resetJsonCollectionName(group);
  }
  toggleExportEmployeeFieldKey(fieldKey: ExportJsonEmployeeFieldKey): void {
    this.exportSession.toggleEmployeeFieldKey(fieldKey);
  }
  toggleExportJsonUnitFieldKey(fieldKey: ExportJsonUnitFieldKey): void {
    this.exportSession.toggleJsonUnitFieldKey(fieldKey);
  }
  toggleExportJsonTagFieldKey(fieldKey: ExportJsonTagFieldKey): void {
    this.exportSession.toggleJsonTagFieldKey(fieldKey);
  }
  toggleExportJsonGroup(group: "tags" | "units"): void {
    this.exportSession.toggleJsonGroup(group);
  }
  setExportExcludedJsonUnitIds(unitIds: UnitId[]): void {
    this.exportSession.setExcludedJsonUnitIds(unitIds);
  }
  setExportExcludedJsonTagKeys(tagKeys: string[]): void {
    this.exportSession.setExcludedJsonTagKeys(tagKeys);
  }
  moveExportJsonTopLevelFieldKey(
    fieldKey: ExportJsonTopLevelFieldKey,
    targetFieldKey: ExportJsonTopLevelFieldKey,
    placement: ExportFieldDropPlacement,
  ): void {
    this.exportSession.moveJsonTopLevelFieldKey(fieldKey, targetFieldKey, placement);
  }
  moveExportJsonUnitFieldKey(
    fieldKey: ExportJsonUnitFieldKey,
    targetFieldKey: ExportJsonUnitFieldKey,
    placement: ExportFieldDropPlacement,
  ): void {
    this.exportSession.moveJsonUnitFieldKey(fieldKey, targetFieldKey, placement);
  }
  moveExportJsonTagFieldKey(
    fieldKey: ExportJsonTagFieldKey,
    targetFieldKey: ExportJsonTagFieldKey,
    placement: ExportFieldDropPlacement,
  ): void {
    this.exportSession.moveJsonTagFieldKey(fieldKey, targetFieldKey, placement);
  }
  addExportSelection(selection: ExportSelection): void {
    this.exportSession.addSelection(selection);
  }
  addExportSelections(selections: ExportSelection[]): void {
    this.exportSession.addSelections(selections);
  }
  removeExportSelection(selectionId: string): void {
    this.exportSession.removeSelection(selectionId);
  }
  removeExportSelections(selectionIds: Iterable<string>): void {
    this.exportSession.removeSelections(selectionIds);
  }
  removeEmployeeFromExport(employeeId: EmployeeId): void {
    this.exportSession.removeEmployee(employeeId);
  }
  removeEmployeesFromExport(employeeIds: Iterable<EmployeeId>): void {
    this.exportSession.removeEmployees(employeeIds);
  }
  clearExportSelection(): void {
    this.exportSession.clearSelection();
  }

  selectUnit(unitId: UnitId): void {
    this.selectedUnitId = unitId;
  }

  selectUnitFromEmployeeCard(unitId: UnitId): void {
    const unit = this.uiOrgStructure?.indexes.unitsById.get(unitId);
    if (!unit) return;

    this.selectedUnitId = unit.id;
    this.expandedUnitIds = [...new Set([...this.expandedUnitIds, ...unit.path.ids])];
    this.activeTab = "units";
  }

  toggleExpandedUnitId(unitId: UnitId): void {
    this.expandedUnitIds = this.expandedUnitIds.includes(unitId)
      ? this.expandedUnitIds.filter((currentUnitId) => currentUnitId !== unitId)
      : [...this.expandedUnitIds, unitId];
  }

  createUnit(configuration: OrgEditorUnitConfiguration, parentId: UnitId | null = null): UnitId {
    const id = this.mainOrgEditor.addConfiguredUnit({
      configuration,
      parentId,
      x: this.uiOrgStructure?.roots.length ? this.uiOrgStructure.roots.length * 380 : 0,
      y: 0,
    });

    this.selectedUnitId = id;
    this.expandedUnitIds =
      parentId === null
        ? [...new Set([...this.expandedUnitIds, id])]
        : [...new Set([...this.expandedUnitIds, parentId, id])];

    return id;
  }

  updateUnit(unitId: UnitId, configuration: OrgEditorUnitConfiguration): void {
    this.mainOrgEditor.configureUnit(unitId, configuration);
  }

  moveEmployeeBetweenUnits(
    employeeId: EmployeeId,
    sourceUnitId: UnitId,
    targetUnitId: UnitId,
  ): void {
    if (sourceUnitId === targetUnitId) return;
    const sourceUnit = this.mainOrgEditor.units.find((unit) => unit.id === sourceUnitId);
    const targetEditorUnit = this.mainOrgEditor.units.find((unit) => unit.id === targetUnitId);
    if (!sourceUnit || !targetEditorUnit || sourceUnit.liveFilter || targetEditorUnit.liveFilter) {
      return;
    }

    this.mainOrgEditor.moveEmployeesToUnit(
      [{ employeeId, type: "employee", unitId: sourceUnitId }],
      targetUnitId,
    );
    this.selectedUnitId = targetUnitId;
    const targetUnit = this.uiOrgStructure?.indexes.unitsById.get(targetUnitId);
    this.expandedUnitIds = [
      ...new Set([...this.expandedUnitIds, ...(targetUnit?.path.ids ?? []), targetUnitId]),
    ];
  }

  deleteUnit(unitId: UnitId): void {
    const previousSelection = this.mainOrgEditor.selectedItems;
    this.mainOrgEditor.setSelectedItems([{ type: "unit", unitId }]);
    this.mainOrgEditor.deleteSelected();
    this.mainOrgEditor.setSelectedItems(previousSelection.filter((item) => item.unitId !== unitId));
    if (this.selectedUnitId === unitId) this.selectedUnitId = this.rootUnit?.id ?? null;
  }

  createEmployee(fields: EditableEmployeeFields, unitMemberships: UnitAssignment[]): EmployeeId {
    const now = new Date().toISOString();
    const normalizedFields = normalizeEditableEmployeeFields(fields);
    const id = createOrganizationEmployeeId(normalizedFields);
    if (this.organizationEmployees.some((employee) => employee.id === id)) {
      throw new LocalizedError(uiMessage("An Employee with this name and email already exists."));
    }
    const employee: OrganizationEmployee = {
      ...normalizedFields,
      createdAt: now,
      id,
      updatedAt: now,
    };

    this.organizationEmployees = [...this.organizationEmployees, employee];
    this.applyOrganizationEmployeeAssignments(id, unitMemberships);
    this.rebuildMainModel();

    return id;
  }

  updateEmployee(
    employeeId: EmployeeId,
    fields: EditableEmployeeFields,
    unitMemberships: UnitAssignment[],
  ): void {
    this.updateOrganizationEmployee(employeeId, fields, unitMemberships);
  }

  updateEmployeeTags(updates: readonly EmployeeTagUpdate[]): void {
    if (!this.applyOrganizationEmployeeTagUpdates(updates)) return;
    this.rebuildMainModel();
  }

  updateEmployeeTagsFromEditor(updates: readonly EmployeeTagUpdate[]): void {
    const updateByEmployeeId = this.normalizeEmployeeTagUpdates(updates);
    const before = [...updateByEmployeeId].flatMap(([employeeId]) => {
      const employee = this.organizationEmployees.find((candidate) => candidate.id === employeeId);
      return employee ? [{ employeeId, tags: employee.tags.map((tag) => ({ ...tag })) }] : [];
    });
    const after = [...updateByEmployeeId].map(([employeeId, tags]) => ({
      employeeId,
      tags: tags.map((tag) => ({ ...tag })),
    }));

    if (!this.applyOrganizationEmployeeTagUpdates(after)) return;

    this.mainOrgEditor.commitExternalCommand("Update Employee tags", {
      redo: () => {
        this.applyOrganizationEmployeeTagUpdates(after);
      },
      undo: () => {
        this.applyOrganizationEmployeeTagUpdates(before);
      },
    });
  }

  private normalizeEmployeeTagUpdates(
    updates: readonly EmployeeTagUpdate[],
  ): Map<EmployeeId, EmployeeTag[]> {
    const updateByEmployeeId = new Map<EmployeeId, EmployeeTag[]>();

    for (const update of updates) {
      updateByEmployeeId.set(update.employeeId, normalizeEmployeeTags(update.tags));
    }

    return updateByEmployeeId;
  }

  private applyOrganizationEmployeeTagUpdates(updates: readonly EmployeeTagUpdate[]): boolean {
    const updateByEmployeeId = this.normalizeEmployeeTagUpdates(updates);
    if (updateByEmployeeId.size === 0) return false;

    const now = new Date().toISOString();
    let changed = false;

    this.organizationEmployees = this.organizationEmployees.map((employee) => {
      const tags = updateByEmployeeId.get(employee.id);
      if (!tags || areTagsEqual(employee.tags, tags)) return employee;

      changed = true;
      return {
        ...employee,
        tags: tags.map((tag) => ({ ...tag })),
        updatedAt: now,
      };
    });

    return changed;
  }

  private updateOrganizationEmployee(
    employeeId: EmployeeId,
    fields: EditableEmployeeFields,
    unitMemberships: UnitAssignment[],
  ): void {
    const now = new Date().toISOString();
    const normalizedFields = normalizeEditableEmployeeFields(fields);
    const nextEmployeeId = createOrganizationEmployeeId(normalizedFields);
    if (
      nextEmployeeId !== employeeId &&
      this.organizationEmployees.some((employee) => employee.id === nextEmployeeId)
    ) {
      throw new LocalizedError(uiMessage("An Employee with this name and email already exists."));
    }
    if (nextEmployeeId !== employeeId) {
      this.orgEditor.rekeyEmployeeReferences(employeeId, nextEmployeeId, false);
      this.exportSession.rekeyEmployee(employeeId, nextEmployeeId);
    }
    this.organizationEmployees = this.organizationEmployees.map((employee) =>
      employee.id === employeeId
        ? { ...employee, ...normalizedFields, id: nextEmployeeId, updatedAt: now }
        : employee,
    );
    this.applyOrganizationEmployeeAssignments(nextEmployeeId, unitMemberships);
    this.rebuildMainModel();
  }

  private applyOrganizationEmployeeAssignments(
    employeeId: EmployeeId,
    memberships: UnitAssignment[],
  ): void {
    const assignmentByUnitId = new Map<
      UnitId,
      { isBoss: boolean; position: string | null; unitId: UnitId }
    >();
    for (const membership of memberships) {
      assignmentByUnitId.set(membership.unitId, {
        isBoss: membership.isBoss,
        position: membership.position,
        unitId: membership.unitId,
      });
    }
    this.mainOrgEditor.setEmployeeAssignments(employeeId, [...assignmentByUnitId.values()]);
  }

  deleteOrganizationEmployee(employeeId: EmployeeId): void {
    if (!this.organizationEmployees.some((candidate) => candidate.id === employeeId)) return;
    this.mainOrgEditor.purgeEmployeeReferences(employeeId);
    this.organizationEmployees = this.organizationEmployees.filter(
      (candidate) => candidate.id !== employeeId,
    );
    this.exportSession.purgeEmployee(employeeId);
    this.rebuildMainModel();
  }

  createOrgToolsState(): OrgToolsState {
    return parseOrgToolsState({
      organization: this.createOrganizationState(),
      ui: this.createDurableUiState(),
    });
  }

  createOrganizationState(): OrgToolsState["organization"] {
    return {
      employees: this.organizationEmployees.map((employee) => ({
        ...employee,
        tags: employee.tags.map((tag) => ({ ...tag })),
      })),
      structure: {
        layoutMode: this.orgEditor.layoutMode,
        units: this.orgEditor.units.map((unit) => ({
          ...unit,
          employeeIds: [...unit.employeeIds],
          employeePositions: unit.employeePositions.map((position) => ({ ...position })),
          liveFilter: unit.liveFilter ? structuredClone(unit.liveFilter) : null,
        })),
      },
    };
  }

  createDurableUiState(): OrgToolsState["ui"] {
    const exportState = this.exportSession.createState();
    return {
      activeTab: this.activeTab,
      analytics: structuredClone(this.analyticsUi),
      calendar: { ...this.calendarUi },
      download: {
        ...exportState,
        employeeFilters: structuredClone(this.downloadUi.employeeFilters),
        employeeQuery: this.downloadUi.employeeQuery,
        selectedFilters: structuredClone(this.downloadUi.selectedFilters),
        selectedQuery: this.downloadUi.selectedQuery,
        unitQuery: this.downloadUi.unitQuery,
      },
      editor: {
        ...this.editorUi,
        selectedItems: this.orgEditor.selectedItems.map((item) => ({ ...item })),
        viewport: { ...this.orgEditor.viewport },
      },
      employees: structuredClone(this.employeesUi),
      expandedUnitIds: [...this.expandedUnitIds],
      locale: this.locale,
      selectedUnitId: this.selectedUnitId,
      sidebarCollapsed: this.sidebarCollapsed,
      theme: this.theme,
      units: structuredClone(this.unitsUi),
    };
  }

  applyDurableUiState(ui: OrgToolsState["ui"]): void {
    const previousIsApplyingState = this.isApplyingState;
    this.isApplyingState = true;
    try {
      this.locale = ui.locale;
      this.theme = ui.theme;
      this.activeTab = ui.activeTab;
      this.sidebarCollapsed = ui.sidebarCollapsed;
      this.selectedUnitId = ui.selectedUnitId;
      this.expandedUnitIds = [...ui.expandedUnitIds];
      this.unitsUi = structuredClone(ui.units);
      this.employeesUi = structuredClone(ui.employees);
      this.editorUi = { searchOpen: ui.editor.searchOpen, searchQuery: ui.editor.searchQuery };
      this.analyticsUi = structuredClone(ui.analytics);
      this.calendarUi = { ...ui.calendar };
      this.downloadUi = {
        employeeFilters: structuredClone(ui.download.employeeFilters),
        employeeQuery: ui.download.employeeQuery,
        selectedFilters: structuredClone(ui.download.selectedFilters),
        selectedQuery: ui.download.selectedQuery,
        unitQuery: ui.download.unitQuery,
      };
      this.exportSession.loadState(ui.download);
      this.orgEditor.setViewport({ ...ui.editor.viewport });
      this.orgEditor.setSelectedItems(ui.editor.selectedItems.map((item) => ({ ...item })));
    } finally {
      this.isApplyingState = previousIsApplyingState;
    }
    if (!previousIsApplyingState) this.uiChangeSequence += 1;
  }

  resetChangeTracking(): void {
    this.organizationChangeSequence = 0;
    this.uiChangeSequence = 0;
  }
}
