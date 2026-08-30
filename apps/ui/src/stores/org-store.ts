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
  materializeOrgViews,
  parseOrgToolsState,
} from "@/lib/org-file";
import type {
  ExportEmployeeFieldKey,
  ExportFieldDropPlacement,
  ExportFieldKey,
  ExportJsonUnitFieldKey,
  ExportRowMode,
  ExportSelection,
  ExportTabMode,
  ExportUnitFieldKey,
} from "@/stores/export-session-store";
import { ExportSessionStore } from "@/stores/export-session-store";
import { OrgEditorStore, type OrgEditorUnitConfiguration } from "@/stores/org-editor-store";
import { OrgViewsStore } from "@/stores/org-views-store";

type AnalyticsIdleHandle = { id: number; type: "idle" | "timeout" };

export type AnalyticsBuildStatus = "building" | "idle" | "ready" | "scheduled";
export type {
  ExportEmployeeFieldKey,
  ExportFieldDropPlacement,
  ExportFieldKey,
  ExportFieldNameMap,
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
  activeViewOrgStructure: UiOrgStructure | null = null;
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
  exportSourceViewId = "";
  orgViews = new OrgViewsStore((viewId, kind) => this.handleViewDocumentChange(viewId, kind));
  fallbackEditor = new OrgEditorStore();
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
        activeViewOrgStructure: observable.ref,
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
        fallbackEditor: observable.ref,
        isApplyingState: false,
        orgViews: observable.ref,
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
    return [
      this.organizationEmployees,
      this.orgViews.viewRecords,
      ...this.orgViews.views.flatMap((view) => {
        const editor = this.orgViews.editorByViewId.get(view.id);
        return editor
          ? [editor.employeeOverrides, editor.employees, editor.layoutMode, editor.units]
          : [];
      }),
    ];
  }

  private get uiObservation() {
    return [
      this.activeTab,
      this.locale,
      this.sidebarCollapsed,
      this.expandedUnitIds,
      this.orgViews.activeViewId,
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
      this.exportSession.employeeFieldOrder,
      this.exportSession.selectedFlatUnitFieldKeys,
      this.exportSession.flatUnitFieldOrder,
      this.exportSession.selectedJsonUnitFieldKeys,
      this.exportSession.jsonUnitFieldOrder,
      this.exportSession.fieldNames,
      this.exportSession.unitFullPathSeparator,
      this.exportSession.templateFormat,
      this.exportSession.selections,
      this.exportSession.excludedEmployeeIds,
      ...this.orgViews.views.flatMap((view) => {
        const editor = this.orgViews.editorByViewId.get(view.id);
        return editor ? [editor.selectedItems, editor.viewport] : [];
      }),
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

  get orgEditor() {
    return this.orgViews.activeEditor ?? this.fallbackEditor;
  }

  get mainOrgEditor() {
    return this.orgViews.mainEditor ?? this.fallbackEditor;
  }

  get orgViewList() {
    return this.orgViews.views;
  }

  get activeOrgView() {
    return this.orgViews.activeView;
  }

  get activeOrgViewId() {
    return this.orgViews.activeViewId;
  }

  get mainOrgViewId() {
    return this.orgViews.mainView?.id ?? "";
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
  get exportEmployeeFieldOrder() {
    return this.exportSession.employeeFieldOrder;
  }
  get exportSelectedFlatUnitFieldKeys() {
    return this.exportSession.selectedFlatUnitFieldKeys;
  }
  get exportFlatUnitFieldOrder() {
    return this.exportSession.flatUnitFieldOrder;
  }
  get exportSelectedJsonUnitFieldKeys() {
    return this.exportSession.selectedJsonUnitFieldKeys;
  }
  get exportJsonUnitFieldOrder() {
    return this.exportSession.jsonUnitFieldOrder;
  }
  get exportFieldNames() {
    return this.exportSession.fieldNames;
  }
  get exportUnitFullPathSeparator() {
    return this.exportSession.unitFullPathSeparator;
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
    const nextViews = new OrgViewsStore((viewId, kind) =>
      this.handleViewDocumentChange(viewId, kind),
    );
    const previousIsApplyingState = this.isApplyingState;
    this.isApplyingState = true;
    try {
      nextViews.load(materializeOrgViews(state), state.ui.activeViewId);
      const mainEditor = nextViews.mainEditor;
      if (!mainEditor) throw new Error("The Main View is unavailable.");
      const mainResult = buildOrganizationStructureWithResolution(
        nextEmployees,
        mainEditor.createState(),
      );
      const activeEditor = nextViews.activeEditor;
      if (!activeEditor) throw new Error("The active View is unavailable.");
      const activeResult =
        nextViews.activeView?.kind === "main"
          ? mainResult
          : buildOrganizationStructureWithResolution(nextEmployees, activeEditor.createState());

      mainEditor.synchronizeLiveResolution(mainResult.liveEmployeeIdsByUnitId);
      if (activeEditor !== mainEditor) {
        activeEditor.synchronizeLiveResolution(activeResult.liveEmployeeIdsByUnitId);
      }

      this.organizationEmployees = nextEmployees;
      this.orgViews = nextViews;
      this.uiOrgStructure = mainResult.structure;
      this.activeViewOrgStructure = activeResult.structure;
      this.theme = state.ui.theme;
      this.locale = state.ui.locale;
      this.activeTab = state.ui.activeTab;
      this.sidebarCollapsed = state.ui.sidebarCollapsed;
      this.selectedUnitId = state.ui.selectedUnitId;
      this.expandedUnitIds = [...state.ui.expandedUnitIds];
      this.unitsUi = structuredClone(state.ui.units);
      this.employeesUi = structuredClone(state.ui.employees);
      this.editorUi = structuredClone(state.ui.editor);
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
      this.exportSourceViewId = nextViews.mainView?.id ?? "";
      if (nextViews.editorByViewId.has(state.ui.download.sourceViewId)) {
        this.exportSourceViewId = state.ui.download.sourceViewId;
      }
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

  selectExportOrgView(viewId: string): void {
    if (!this.orgViews.editorByViewId.has(viewId)) return;
    this.exportSourceViewId = viewId;
    this.resetExportSessionState();
  }

  selectUnitFromOrgView(viewId: string, unitId: UnitId): void {
    if (this.orgViews.views.find((view) => view.id === viewId)?.kind === "main") {
      this.selectUnitFromEmployeeCard(unitId);
      return;
    }

    this.selectOrgView(viewId);
    if (!this.orgEditor.units.some((unit) => unit.id === unitId)) return;
    this.orgEditor.setSelectedItems([{ type: "unit", unitId }]);
    this.activeTab = "orgEditor";
  }

  selectOrgView(viewId: string): void {
    this.orgViews.selectView(viewId);
    this.rebuildActiveViewModel();
  }

  createOrgView(name: string, source: "blank" | "main"): string {
    const viewId = this.orgViews.createView(name, source);
    this.rebuildActiveViewModel();
    return viewId;
  }

  renameOrgView(viewId: string, name: string): void {
    this.orgViews.renameView(viewId, name);
  }

  deleteOrgView(viewId: string): void {
    this.orgViews.deleteView(viewId);
    this.rebuildActiveViewModel();
  }

  getOrgViewStructure(viewId: string): UiOrgStructure | null {
    if (this.orgViews.views.find((view) => view.id === viewId)?.kind === "main") {
      return this.uiOrgStructure;
    }
    if (viewId === this.activeOrgViewId) return this.activeViewOrgStructure;

    const editor = this.orgViews.editorByViewId.get(viewId);
    if (!editor) return null;

    const result = buildOrganizationStructureWithResolution(
      this.organizationEmployees,
      editor.createState(),
    );
    editor.synchronizeLiveResolution(result.liveEmployeeIdsByUnitId);
    return result.structure;
  }

  private handleViewDocumentChange(viewId: string, kind: "custom" | "main"): void {
    if (this.isApplyingState) return;
    if (kind === "main") this.rebuildMainModel();
    if (viewId === this.activeOrgViewId) this.rebuildActiveViewModel();
  }

  private rebuildMainModel(): void {
    const mainEditor = this.orgViews.mainEditor;
    if (!mainEditor) {
      this.uiOrgStructure = null;
      return;
    }

    const result = buildOrganizationStructureWithResolution(
      this.organizationEmployees,
      mainEditor.createState(),
    );
    mainEditor.synchronizeLiveResolution(result.liveEmployeeIdsByUnitId);
    this.uiOrgStructure = result.structure;
    if (this.activeOrgView?.kind === "main") {
      this.activeViewOrgStructure = result.structure;
    }
    this.refreshEmployeeUnitContexts();
    this.resetAnalyticsCache();
    this.scheduleAnalyticsPrecompute();
  }

  private rebuildActiveViewModel(): void {
    if (this.activeOrgView?.kind === "main") {
      this.activeViewOrgStructure = this.uiOrgStructure;
      return;
    }

    const editor = this.orgViews.activeEditor;
    if (!editor) {
      this.activeViewOrgStructure = null;
      return;
    }

    const result = buildOrganizationStructureWithResolution(
      this.organizationEmployees,
      editor.createState(),
    );
    editor.synchronizeLiveResolution(result.liveEmployeeIdsByUnitId);
    this.activeViewOrgStructure = result.structure;
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
  setExportRowMode(value: ExportRowMode): void {
    this.exportSession.setRowMode(value);
  }
  setExportTemplateFormat(value: string): void {
    this.exportSession.setTemplateFormat(value);
  }
  setExportUnitFullPathSeparator(value: string): void {
    this.exportSession.setUnitFullPathSeparator(value);
  }
  appendExportTemplateField(value: ExportFieldKey): void {
    this.exportSession.appendTemplateField(value);
  }
  setExportFieldName(fieldKey: ExportFieldKey, fieldName: string): void {
    this.exportSession.setFieldName(fieldKey, fieldName);
  }
  resetExportFieldName(fieldKey: ExportFieldKey): void {
    this.exportSession.resetFieldName(fieldKey);
  }
  toggleExportEmployeeFieldKey(fieldKey: ExportEmployeeFieldKey): void {
    this.exportSession.toggleEmployeeFieldKey(fieldKey);
  }
  toggleExportFlatUnitFieldKey(fieldKey: ExportUnitFieldKey): void {
    this.exportSession.toggleFlatUnitFieldKey(fieldKey);
  }
  toggleExportJsonUnitFieldKey(fieldKey: ExportJsonUnitFieldKey): void {
    this.exportSession.toggleJsonUnitFieldKey(fieldKey);
  }
  moveExportEmployeeFieldKey(
    fieldKey: ExportEmployeeFieldKey,
    targetFieldKey: ExportEmployeeFieldKey,
    placement: ExportFieldDropPlacement,
  ): void {
    this.exportSession.moveEmployeeFieldKey(fieldKey, targetFieldKey, placement);
  }
  moveExportFlatUnitFieldKey(
    fieldKey: ExportUnitFieldKey,
    targetFieldKey: ExportUnitFieldKey,
    placement: ExportFieldDropPlacement,
  ): void {
    this.exportSession.moveFlatUnitFieldKey(fieldKey, targetFieldKey, placement);
  }
  moveExportJsonUnitFieldKey(
    fieldKey: ExportJsonUnitFieldKey,
    targetFieldKey: ExportJsonUnitFieldKey,
    placement: ExportFieldDropPlacement,
  ): void {
    this.exportSession.moveJsonUnitFieldKey(fieldKey, targetFieldKey, placement);
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
    const id = createOrganizationEmployeeId();
    const employee: OrganizationEmployee = {
      ...normalizeEditableEmployeeFields(fields),
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
    this.organizationEmployees = this.organizationEmployees.map((employee) =>
      employee.id === employeeId
        ? { ...employee, ...normalizeEditableEmployeeFields(fields), updatedAt: now }
        : employee,
    );
    this.applyOrganizationEmployeeAssignments(employeeId, unitMemberships);
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
    const employee = this.organizationEmployees.find((candidate) => candidate.id === employeeId);
    if (!employee) return;

    const liveEmployeeIdsByViewId = new Map<string, ReadonlyMap<UnitId, readonly EmployeeId[]>>();
    for (const view of this.orgViewList) {
      if (view.kind !== "custom") continue;

      const editor = this.orgViews.editorByViewId.get(view.id);
      if (!editor?.units.some((unit) => unit.liveFilter !== null)) continue;
      liveEmployeeIdsByViewId.set(
        view.id,
        buildOrganizationStructureWithResolution(this.organizationEmployees, editor.createState())
          .liveEmployeeIdsByUnitId,
      );
    }

    this.orgViews.materializeEmployeeBeforeDelete(employee, liveEmployeeIdsByViewId);
    this.mainOrgEditor.purgeEmployeeReferences(employeeId);
    this.organizationEmployees = this.organizationEmployees.filter(
      (candidate) => candidate.id !== employeeId,
    );
    this.exportSession.purgeEmployee(employeeId);
    this.rebuildMainModel();
    this.rebuildActiveViewModel();
  }

  createOrgToolsState(): OrgToolsState {
    const views = this.orgViews.createState();
    if (!views.some((view) => view.kind === "main")) {
      throw new Error("The Main View is unavailable.");
    }

    return parseOrgToolsState({
      organization: this.createOrganizationState(views),
      ui: this.createDurableUiState(views),
    });
  }

  createOrganizationState(views = this.orgViews.createState()): OrgToolsState["organization"] {
    return {
      employees: this.organizationEmployees.map((employee) => ({
        ...employee,
        tags: employee.tags.map((tag) => ({ ...tag })),
      })),
      views: views.map((view) => ({
        createdAt: view.createdAt,
        document: {
          employeeOverrides: view.state.employeeOverrides.map((employee) => ({
            ...employee,
            tags: employee.tags.map((tag) => ({ ...tag })),
          })),
          employees: view.state.employees.map((employee) => ({
            ...employee,
            tags: employee.tags.map((tag) => ({ ...tag })),
          })),
          layoutMode: view.state.layoutMode,
          units: view.state.units.map((unit) => ({
            ...unit,
            employeeIds: [...unit.employeeIds],
            employeePositions: unit.employeePositions.map((position) => ({ ...position })),
            liveFilter: unit.liveFilter ? structuredClone(unit.liveFilter) : null,
          })),
        },
        id: view.id,
        kind: view.kind,
        name: view.name,
        updatedAt: view.updatedAt,
      })),
    };
  }

  createDurableUiState(views = this.orgViews.createState()): OrgToolsState["ui"] {
    const exportState = this.exportSession.createState();
    return {
      activeTab: this.activeTab,
      activeViewId: this.activeOrgViewId,
      analytics: structuredClone(this.analyticsUi),
      calendar: { ...this.calendarUi },
      download: {
        ...exportState,
        employeeFilters: structuredClone(this.downloadUi.employeeFilters),
        employeeQuery: this.downloadUi.employeeQuery,
        selectedFilters: structuredClone(this.downloadUi.selectedFilters),
        selectedQuery: this.downloadUi.selectedQuery,
        sourceViewId: this.exportSourceViewId,
        unitQuery: this.downloadUi.unitQuery,
      },
      editor: { ...this.editorUi },
      employees: structuredClone(this.employeesUi),
      expandedUnitIds: [...this.expandedUnitIds],
      locale: this.locale,
      selectedUnitId: this.selectedUnitId,
      sidebarCollapsed: this.sidebarCollapsed,
      theme: this.theme,
      units: structuredClone(this.unitsUi),
      views: views.map((view) => ({
        selectedItems: view.state.selectedItems.map((item) => ({ ...item })),
        viewId: view.id,
        viewport: { ...view.state.viewport },
      })),
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
      this.editorUi = structuredClone(ui.editor);
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
      this.exportSourceViewId = this.orgViews.editorByViewId.has(ui.download.sourceViewId)
        ? ui.download.sourceViewId
        : this.mainOrgViewId;
      this.orgViews.selectView(ui.activeViewId);
      for (const viewUi of ui.views) {
        const editor = this.orgViews.editorByViewId.get(viewUi.viewId);
        if (!editor) continue;
        editor.setViewport({ ...viewUi.viewport });
        editor.setSelectedItems(viewUi.selectedItems.map((item) => ({ ...item })));
      }
      this.rebuildActiveViewModel();
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
