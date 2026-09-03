import type {
  EmployeeId,
  EmployeeLiveFilterRule,
  OrgEditorState,
  OrgToolsViewDocument,
  OrgToolsViewUiState,
  UnitId,
  ViewId,
} from "@org-tools/types";
import { makeAutoObservable, observable } from "mobx";

import { LocalizedError, uiMessage } from "@/i18n/messages";
import { createUuid } from "@/lib/employee-data";
import { cloneEmployeeLiveFilterRule } from "@/lib/live-unit-filter";
import { createDefaultOrgEditorState, createOrgEditorUnitId } from "@/lib/org-editor";
import { normalizeSearchValue } from "@/lib/search-index";
import {
  type OrgEditorClipboard,
  type OrgEditorClipboardController,
  OrgEditorStore,
} from "@/stores/org-editor-store";

export type NewOrgViewSource = { type: "blank" } | { type: "copy"; viewId: ViewId };

type OrgViewRecord = Omit<OrgToolsViewDocument, "structure">;

const normalizeViewName = (name: string) => name.normalize("NFKC").trim().replace(/\s+/gu, " ");

const cloneStateWithRemappedUnits = (state: OrgEditorState): OrgEditorState => {
  const unitIdMap = new Map<UnitId, UnitId>(
    state.units.map((unit) => [unit.id, createOrgEditorUnitId()]),
  );

  return {
    distributionModeUnitIds: state.distributionModeUnitIds.flatMap((unitId) => {
      const nextUnitId = unitIdMap.get(unitId);
      return nextUnitId ? [nextUnitId] : [];
    }),
    layoutMode: state.layoutMode,
    selectedItems: [],
    units: state.units.map((unit) => ({
      ...unit,
      bossEmployeeId: unit.bossEmployeeId,
      employeeIds: [...unit.employeeIds],
      employeePositions: unit.employeePositions.map((position) => ({ ...position })),
      id: unitIdMap.get(unit.id) ?? unit.id,
      liveFilter: unit.liveFilter
        ? {
            ...cloneEmployeeLiveFilterRule(unit.liveFilter),
            selectedUnitIds: unit.liveFilter.selectedUnitIds.flatMap((unitId) => {
              const nextUnitId = unitIdMap.get(unitId);
              return nextUnitId ? [nextUnitId] : [];
            }),
          }
        : null,
      parentId: unit.parentId === null ? null : (unitIdMap.get(unit.parentId) ?? null),
    })),
    viewport: { ...state.viewport },
  };
};

export class OrgViewsStore {
  viewRecords: OrgViewRecord[] = [];
  editorByViewId = new Map<ViewId, OrgEditorStore>();
  documentRevisionByViewId = new Map<ViewId, number>();
  activeViewId: ViewId = "";
  clipboard: OrgEditorClipboard | null = null;
  readonly onViewDocumentChange: (viewId: ViewId, kind: "custom" | "system") => void;
  readonly clipboardController: OrgEditorClipboardController;
  private isLoading = false;

  constructor(onViewDocumentChange: (viewId: ViewId, kind: "custom" | "system") => void) {
    this.onViewDocumentChange = onViewDocumentChange;
    this.clipboardController = {
      get: () => this.clipboard,
      set: (clipboard) => {
        this.clipboard = clipboard;
      },
    };
    makeAutoObservable(
      this,
      {
        clipboard: observable.ref,
        clipboardController: false,
        documentRevisionByViewId: observable.shallow,
        editorByViewId: observable.shallow,
        onViewDocumentChange: false,
        viewRecords: observable.shallow,
      },
      { autoBind: true },
    );
  }

  get views() {
    return this.viewRecords;
  }

  get activeView() {
    return (
      this.viewRecords.find((view) => view.id === this.activeViewId) ?? this.systemView ?? null
    );
  }

  get systemView() {
    return this.viewRecords.find((view) => view.kind === "system") ?? null;
  }

  get activeEditor() {
    return this.activeView ? (this.editorByViewId.get(this.activeView.id) ?? null) : null;
  }

  get systemEditor() {
    return this.systemView ? (this.editorByViewId.get(this.systemView.id) ?? null) : null;
  }

  load(
    views: readonly OrgToolsViewDocument[],
    viewUiStates: readonly OrgToolsViewUiState[],
    activeViewId: ViewId,
  ): void {
    const uiByViewId = new Map(viewUiStates.map((viewUi) => [viewUi.viewId, viewUi]));
    this.clipboard = null;
    this.isLoading = true;
    try {
      this.viewRecords = views.map(({ structure: _structure, ...view }) => ({ ...view }));
      this.editorByViewId = new Map();
      this.documentRevisionByViewId = new Map();
      for (const view of views) {
        const editor = new OrgEditorStore(
          () => this.handleDocumentChange(view.id, view.kind),
          this.clipboardController,
          view.id,
        );
        const viewUi = uiByViewId.get(view.id);
        editor.loadState({
          distributionModeUnitIds: viewUi?.distributionModeUnitIds ?? [],
          layoutMode: view.structure.layoutMode,
          selectedItems: viewUi?.selectedItems ?? [],
          units: view.structure.units,
          viewport: viewUi?.viewport ?? createDefaultOrgEditorState().viewport,
        });
        this.editorByViewId.set(view.id, editor);
        this.documentRevisionByViewId.set(view.id, 0);
      }
    } finally {
      this.isLoading = false;
    }
    this.activeViewId = this.editorByViewId.has(activeViewId)
      ? activeViewId
      : (this.systemView?.id ?? "");
  }

  selectView(viewId: ViewId): void {
    if (this.editorByViewId.has(viewId)) this.activeViewId = viewId;
  }

  createView(name: string, source: NewOrgViewSource): ViewId {
    const normalizedName = this.validateName(name);
    const now = new Date().toISOString();
    const id = createUuid();
    const sourceEditor = source.type === "copy" ? this.editorByViewId.get(source.viewId) : null;
    if (source.type === "copy" && !sourceEditor) {
      throw new LocalizedError(uiMessage("The source View is unavailable."));
    }
    const nextState = sourceEditor
      ? cloneStateWithRemappedUnits(sourceEditor.createState())
      : createDefaultOrgEditorState();
    const editor = new OrgEditorStore(
      () => this.handleDocumentChange(id, "custom"),
      this.clipboardController,
      id,
    );
    const record: OrgViewRecord = {
      createdAt: now,
      id,
      kind: "custom",
      name: normalizedName,
      updatedAt: now,
    };
    this.isLoading = true;
    try {
      editor.loadState(nextState);
      this.editorByViewId.set(id, editor);
      this.documentRevisionByViewId.set(id, 0);
      this.viewRecords = [...this.viewRecords, record];
      this.activeViewId = id;
    } finally {
      this.isLoading = false;
    }
    this.onViewDocumentChange(id, "custom");
    return id;
  }

  renameView(viewId: ViewId, name: string): void {
    if (this.viewRecords.find((view) => view.id === viewId)?.kind !== "custom") return;
    const normalizedName = this.validateName(name, viewId);
    const now = new Date().toISOString();
    this.viewRecords = this.viewRecords.map((view) =>
      view.id === viewId ? { ...view, name: normalizedName, updatedAt: now } : view,
    );
    this.onViewDocumentChange(viewId, "custom");
  }

  deleteView(viewId: ViewId): boolean {
    if (this.viewRecords.find((view) => view.id === viewId)?.kind !== "custom") return false;
    this.viewRecords = this.viewRecords.filter((view) => view.id !== viewId);
    this.editorByViewId.delete(viewId);
    this.documentRevisionByViewId.delete(viewId);
    if (this.activeViewId === viewId) this.activeViewId = this.systemView?.id ?? "";
    return true;
  }

  createState(): OrgToolsViewDocument[] {
    return this.viewRecords.map((view) => ({
      ...view,
      structure: {
        layoutMode:
          this.editorByViewId.get(view.id)?.layoutMode ?? createDefaultOrgEditorState().layoutMode,
        units: this.editorByViewId.get(view.id)?.createState().units ?? [],
      },
    })) as OrgToolsViewDocument[];
  }

  createUiState(): OrgToolsViewUiState[] {
    return this.viewRecords.map((view) => {
      const editor = this.editorByViewId.get(view.id);
      return {
        distributionModeUnitIds: [...(editor?.distributionModeUnitIds ?? [])],
        selectedItems: editor?.selectedItems.map((item) => ({ ...item })) ?? [],
        viewId: view.id,
        viewport: { ...(editor?.viewport ?? createDefaultOrgEditorState().viewport) },
      };
    });
  }

  getDocumentRevision(viewId: ViewId): number {
    return this.documentRevisionByViewId.get(viewId) ?? 0;
  }

  markViewDocumentChanged(viewId: ViewId): void {
    if (!this.editorByViewId.has(viewId)) return;
    const now = new Date().toISOString();
    this.viewRecords = this.viewRecords.map((view) =>
      view.id === viewId ? { ...view, updatedAt: now } : view,
    );
    this.documentRevisionByViewId.set(viewId, this.getDocumentRevision(viewId) + 1);
  }

  forEachEditor(callback: (editor: OrgEditorStore, viewId: ViewId) => void): void {
    for (const [viewId, editor] of this.editorByViewId) callback(editor, viewId);
  }

  purgeClipboardEmployee(employeeId: EmployeeId): void {
    if (!this.clipboard) return;
    const removeEmployee = (employeeIds: EmployeeId[]) =>
      employeeIds.filter((currentEmployeeId) => currentEmployeeId !== employeeId);
    this.clipboard = {
      ...this.clipboard,
      employeeIds: removeEmployee(this.clipboard.employeeIds),
      resolvedEmployeeIdsByUnitId: new Map(
        [...this.clipboard.resolvedEmployeeIdsByUnitId].map(([unitId, employeeIds]) => [
          unitId,
          removeEmployee(employeeIds),
        ]),
      ),
      units: this.clipboard.units.map((unit) => ({
        ...unit,
        bossEmployeeId: unit.bossEmployeeId === employeeId ? null : unit.bossEmployeeId,
        employeeIds: removeEmployee(unit.employeeIds),
        employeePositions: unit.employeePositions.filter(
          (position) => position.employeeId !== employeeId,
        ),
      })),
    };
  }

  materializeClipboardLiveUnits(
    dependsOnRemovedValue: (rule: EmployeeLiveFilterRule) => boolean,
  ): void {
    if (!this.clipboard) return;
    this.clipboard = {
      ...this.clipboard,
      units: this.clipboard.units.map((unit) => {
        if (!unit.liveFilter || !dependsOnRemovedValue(unit.liveFilter)) return unit;
        const employeeIds = this.clipboard?.resolvedEmployeeIdsByUnitId.get(unit.id) ?? [];
        return {
          ...unit,
          bossEmployeeId:
            unit.bossEmployeeId !== null && employeeIds.includes(unit.bossEmployeeId)
              ? unit.bossEmployeeId
              : null,
          employeeIds: [...employeeIds],
          employeePositions: unit.employeePositions.filter((position) =>
            employeeIds.includes(position.employeeId),
          ),
          liveFilter: null,
        };
      }),
    };
  }

  private handleDocumentChange(viewId: ViewId, kind: "custom" | "system"): void {
    if (this.isLoading) return;
    this.markViewDocumentChanged(viewId);
    this.onViewDocumentChange(viewId, kind);
  }

  private validateName(name: string, currentViewId?: ViewId): string {
    const normalizedName = normalizeViewName(name);
    if (!normalizedName) throw new LocalizedError(uiMessage("Enter a View name."));
    if (normalizedName.length > 100) {
      throw new LocalizedError(uiMessage("View names can contain at most 100 characters."));
    }
    const key = normalizeSearchValue(normalizedName);
    if (
      this.viewRecords.some(
        (view) =>
          view.kind === "custom" &&
          view.id !== currentViewId &&
          normalizeSearchValue(view.name) === key,
      )
    ) {
      throw new LocalizedError(uiMessage("A View with this name already exists."));
    }
    return normalizedName;
  }
}
