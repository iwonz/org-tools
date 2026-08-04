import type {
  EditableEmployeeFields,
  EmployeeId,
  EmployeeTag,
  OrgToolsState,
  OrgToolsStateContent,
  UiActiveTab,
  UiOrgStructure,
  UiTheme,
  UnitAssignment,
  UnitId,
  WorkspaceEmployee,
} from "@org-tools/types";
import { makeAutoObservable, observable } from "mobx";

import { type AnalyticsResult, buildAnalytics } from "@/lib/analytics";
import { buildWorkspaceOrgStructureWithResolution } from "@/lib/build-workspace-org-structure";
import { createWorkspaceEmployeeId, normalizeEditableEmployeeFields } from "@/lib/employee-data";
import { type EmployeeTagUpdate, normalizeEmployeeTags } from "@/lib/employee-tags";
import {
  buildEmployeeUnitContextIndex,
  buildEmployeeUnitMembershipIndex,
  type EmployeeUnitContext,
  type EmployeeUnitMembership,
} from "@/lib/employee-unit-contexts";
import { createBlankOrgToolsState, parseOrgToolsState } from "@/lib/org-file";
import {
  buildMappedImportCandidate,
  buildStateImportCandidate,
  type MappedImportDocument,
  planMappedImport,
  planStateImport,
  type StateImportOperation,
  type StructuredImportPlan,
} from "@/lib/structured-import";
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

const normalizeIdentity = (value: string | null) =>
  value?.trim().toLocaleLowerCase("en-US") || null;
const areTagsEqual = (firstTags: readonly EmployeeTag[], secondTags: readonly EmployeeTag[]) =>
  firstTags.length === secondTags.length &&
  firstTags.every((tag, index) => {
    const other = secondTags[index];
    return other !== undefined && tag.label === other.label && tag.date === other.date;
  });

export class OrgStore {
  workspaceEmployees: WorkspaceEmployee[] = [];
  uiOrgStructure: UiOrgStructure | null = null;
  activeViewOrgStructure: UiOrgStructure | null = null;
  theme: UiTheme = "system";
  activeTab: UiActiveTab = "orgEditor";
  selectedUnitId: UnitId | null = null;
  expandedUnitIds: UnitId[] = [];
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
        exportSession: observable.ref,
        fallbackEditor: observable.ref,
        isApplyingState: false,
        orgViews: observable.ref,
        uiOrgStructure: observable.ref,
        workspaceEmployees: observable.shallow,
      },
      { autoBind: true },
    );
    this.createBlankWorkspace();
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
    sourceFileName: string,
    sourceFileSizeBytes: number | null,
  ): void {
    this.applyOrgToolsState(parseOrgToolsState(state), sourceFileName, sourceFileSizeBytes);
  }

  createBlankWorkspace(): void {
    this.applyOrgToolsState(createBlankOrgToolsState("system"), null, null);
  }

  private applyOrgToolsState(
    state: OrgToolsState,
    sourceFileName: string | null,
    sourceFileSizeBytes: number | null,
  ): void {
    const nextEmployees = state.employees.map((employee) => ({
      ...employee,
      tags: employee.tags.map((tag) => ({ ...tag })),
    }));
    const nextViews = new OrgViewsStore((viewId, kind) =>
      this.handleViewDocumentChange(viewId, kind),
    );
    const previousIsApplyingState = this.isApplyingState;
    this.isApplyingState = true;
    try {
      nextViews.load(state.views, state.activeViewId);
      const mainEditor = nextViews.mainEditor;
      if (!mainEditor) throw new Error("The Main View is unavailable.");
      const mainResult = buildWorkspaceOrgStructureWithResolution(
        nextEmployees,
        mainEditor.createState(),
      );
      const activeEditor = nextViews.activeEditor;
      if (!activeEditor) throw new Error("The active View is unavailable.");
      const activeResult =
        nextViews.activeView?.kind === "main"
          ? mainResult
          : buildWorkspaceOrgStructureWithResolution(nextEmployees, activeEditor.createState());

      mainEditor.synchronizeLiveResolution(mainResult.liveEmployeeIdsByUnitId);
      if (activeEditor !== mainEditor) {
        activeEditor.synchronizeLiveResolution(activeResult.liveEmployeeIdsByUnitId);
      }

      this.workspaceEmployees = nextEmployees;
      this.orgViews = nextViews;
      this.uiOrgStructure = mainResult.structure;
      this.activeViewOrgStructure = activeResult.structure;
      this.theme = state.ui.theme;
      this.activeTab = state.ui.activeTab;
      this.selectedUnitId = state.ui.selectedUnitId;
      this.expandedUnitIds = [...state.ui.expandedUnitIds];
      this.sourceFileName = sourceFileName;
      this.sourceFileSizeBytes = sourceFileSizeBytes;
      this.exportSourceViewId = nextViews.mainView?.id ?? "";
      this.refreshEmployeeUnitContexts();
      this.resetExportSessionState();
      this.resetAnalyticsCache();
      this.scheduleAnalyticsPrecompute();
    } finally {
      this.isApplyingState = previousIsApplyingState;
    }
  }

  setTheme(theme: UiTheme): void {
    this.theme = theme;
  }

  setActiveTab(activeTab: UiActiveTab): void {
    if (
      activeTab === "export" &&
      (this.activeTab !== "export" || this.exportSourceViewId !== this.mainOrgViewId)
    ) {
      this.exportSourceViewId = this.mainOrgViewId;
      this.resetExportSessionState();
    }
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

    const result = buildWorkspaceOrgStructureWithResolution(
      this.workspaceEmployees,
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

    const result = buildWorkspaceOrgStructureWithResolution(
      this.workspaceEmployees,
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

    const result = buildWorkspaceOrgStructureWithResolution(
      this.workspaceEmployees,
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
    const id = createWorkspaceEmployeeId();
    const employee: WorkspaceEmployee = {
      ...normalizeEditableEmployeeFields(fields),
      createdAt: now,
      id,
      updatedAt: now,
    };

    this.workspaceEmployees = [...this.workspaceEmployees, employee];
    this.applyWorkspaceEmployeeAssignments(id, unitMemberships);
    this.rebuildMainModel();

    return id;
  }

  updateEmployee(
    employeeId: EmployeeId,
    fields: EditableEmployeeFields,
    unitMemberships: UnitAssignment[],
  ): void {
    this.updateWorkspaceEmployee(employeeId, fields, unitMemberships);
  }

  updateEmployeeTags(updates: readonly EmployeeTagUpdate[]): void {
    if (!this.applyWorkspaceEmployeeTagUpdates(updates)) return;
    this.rebuildMainModel();
  }

  updateEmployeeTagsFromEditor(updates: readonly EmployeeTagUpdate[]): void {
    const updateByEmployeeId = this.normalizeEmployeeTagUpdates(updates);
    const before = [...updateByEmployeeId].flatMap(([employeeId]) => {
      const employee = this.workspaceEmployees.find((candidate) => candidate.id === employeeId);
      return employee ? [{ employeeId, tags: employee.tags.map((tag) => ({ ...tag })) }] : [];
    });
    const after = [...updateByEmployeeId].map(([employeeId, tags]) => ({
      employeeId,
      tags: tags.map((tag) => ({ ...tag })),
    }));

    if (!this.applyWorkspaceEmployeeTagUpdates(after)) return;

    this.mainOrgEditor.commitExternalCommand("Update Employee tags", {
      redo: () => {
        this.applyWorkspaceEmployeeTagUpdates(after);
      },
      undo: () => {
        this.applyWorkspaceEmployeeTagUpdates(before);
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

  private applyWorkspaceEmployeeTagUpdates(updates: readonly EmployeeTagUpdate[]): boolean {
    const updateByEmployeeId = this.normalizeEmployeeTagUpdates(updates);
    if (updateByEmployeeId.size === 0) return false;

    const now = new Date().toISOString();
    let changed = false;

    this.workspaceEmployees = this.workspaceEmployees.map((employee) => {
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

  private updateWorkspaceEmployee(
    employeeId: EmployeeId,
    fields: EditableEmployeeFields,
    unitMemberships: UnitAssignment[],
  ): void {
    const now = new Date().toISOString();
    this.workspaceEmployees = this.workspaceEmployees.map((employee) =>
      employee.id === employeeId
        ? { ...employee, ...normalizeEditableEmployeeFields(fields), updatedAt: now }
        : employee,
    );
    this.applyWorkspaceEmployeeAssignments(employeeId, unitMemberships);
    this.rebuildMainModel();
  }

  private applyWorkspaceEmployeeAssignments(
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

  deleteWorkspaceEmployee(employeeId: EmployeeId): void {
    const employee = this.workspaceEmployees.find((candidate) => candidate.id === employeeId);
    if (!employee) return;

    const liveEmployeeIdsByViewId = new Map<string, ReadonlyMap<UnitId, readonly EmployeeId[]>>();
    for (const view of this.orgViewList) {
      if (view.kind !== "custom") continue;

      const editor = this.orgViews.editorByViewId.get(view.id);
      if (!editor?.units.some((unit) => unit.liveFilter !== null)) continue;
      liveEmployeeIdsByViewId.set(
        view.id,
        buildWorkspaceOrgStructureWithResolution(this.workspaceEmployees, editor.createState())
          .liveEmployeeIdsByUnitId,
      );
    }

    this.orgViews.materializeEmployeeBeforeDelete(employee, liveEmployeeIdsByViewId);
    this.mainOrgEditor.purgeEmployeeReferences(employeeId);
    this.workspaceEmployees = this.workspaceEmployees.filter(
      (candidate) => candidate.id !== employeeId,
    );
    this.exportSession.purgeEmployee(employeeId);
    this.rebuildMainModel();
    this.rebuildActiveViewModel();
  }

  importEmployees(fieldsList: readonly EditableEmployeeFields[]): {
    employeeIds: EmployeeId[];
    newEmployeeCount: number;
  } {
    if (fieldsList.length === 0) return { employeeIds: [], newEmployeeCount: 0 };

    const normalizedFields = fieldsList.map(normalizeEditableEmployeeFields);
    const existingIdentityKeys = new Set(
      this.workspaceEmployees.flatMap((employee) => {
        const username = normalizeIdentity(employee.username);
        if (username) return [`username:${username}`];
        const email = normalizeIdentity(employee.email);
        return email ? [`email:${email}`] : [];
      }),
    );
    const incomingIdentityKeys = new Set<string>();
    for (const fields of normalizedFields) {
      if (!fields.firstName && !fields.lastName && !fields.username && !fields.email) {
        throw new Error("Each imported Employee must have a name, username, or email.");
      }
      const username = normalizeIdentity(fields.username);
      const email = username ? null : normalizeIdentity(fields.email);
      const identityKey = username ? `username:${username}` : email ? `email:${email}` : null;
      if (!identityKey) continue;
      if (existingIdentityKeys.has(identityKey) || incomingIdentityKeys.has(identityKey)) {
        throw new Error("Employee import contains an identity that is no longer unique.");
      }
      incomingIdentityKeys.add(identityKey);
    }

    const now = new Date().toISOString();
    const employees = normalizedFields.map<WorkspaceEmployee>((fields) => ({
      ...fields,
      createdAt: now,
      id: createWorkspaceEmployeeId(),
      updatedAt: now,
    }));
    const nextEmployees = [...this.workspaceEmployees, ...employees];
    buildWorkspaceOrgStructureWithResolution(nextEmployees, this.mainOrgEditor.createState());

    this.workspaceEmployees = nextEmployees;
    this.rebuildMainModel();
    this.rebuildActiveViewModel();
    return {
      employeeIds: employees.map((employee) => employee.id),
      newEmployeeCount: employees.length,
    };
  }

  importState(
    source: OrgToolsState,
    content: OrgToolsStateContent,
    operation: StateImportOperation,
    sourceFileName: string | null = this.sourceFileName,
    sourceFileSizeBytes: number | null = this.sourceFileSizeBytes,
  ): StructuredImportPlan | null {
    const plan =
      content === "workspace" ? null : planStateImport(source, content, this.workspaceEmployees);
    const candidate = buildStateImportCandidate(
      this.createOrgToolsState(),
      source,
      content,
      operation,
    );
    this.applyOrgToolsState(candidate, sourceFileName, sourceFileSizeBytes);
    return plan;
  }

  previewStateImport(
    source: OrgToolsState,
    content: OrgToolsStateContent,
    operation: StateImportOperation,
  ): StructuredImportPlan | null {
    const plan =
      content === "workspace" ? null : planStateImport(source, content, this.workspaceEmployees);
    buildStateImportCandidate(this.createOrgToolsState(), source, content, operation);
    return plan;
  }

  importMapped(document: MappedImportDocument): StructuredImportPlan {
    const plan = planMappedImport(document, this.workspaceEmployees);
    const candidate = buildMappedImportCandidate(this.createOrgToolsState(), document);
    this.applyOrgToolsState(candidate, this.sourceFileName, this.sourceFileSizeBytes);
    return plan;
  }

  previewMappedImport(document: MappedImportDocument): StructuredImportPlan {
    const plan = planMappedImport(document, this.workspaceEmployees);
    buildMappedImportCandidate(this.createOrgToolsState(), document);
    return plan;
  }

  createOrgToolsState(): OrgToolsState {
    const views = this.orgViews.createState();
    if (!views.some((view) => view.kind === "main")) {
      throw new Error("The Main View is unavailable.");
    }

    return parseOrgToolsState({
      activeViewId: this.activeOrgViewId,
      content: "workspace",
      employees: this.workspaceEmployees.map((employee) => ({
        ...employee,
        tags: employee.tags.map((tag) => ({ ...tag })),
      })),
      kind: "org-tools-state",
      ui: {
        activeTab: this.activeTab,
        expandedUnitIds: [...this.expandedUnitIds],
        selectedUnitId: this.selectedUnitId,
        theme: this.theme,
      },
      views,
    });
  }
}
