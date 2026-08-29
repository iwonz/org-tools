import type {
  EmployeeId,
  OrgEditorState,
  OrgView,
  OrgViewKind,
  UnitId,
  WorkspaceEmployee,
} from "@org-tools/types";
import { makeAutoObservable, observable } from "mobx";
import { createUuid } from "@/lib/employee-data";
import { cloneEmployeeLiveFilterRule } from "@/lib/live-unit-filter";
import {
  createDefaultOrgEditorState,
  createOrgEditorEmployeeId,
  createOrgEditorUnitId,
} from "@/lib/org-editor";
import { OrgEditorStore } from "@/stores/org-editor-store";

type NewViewSource = "blank" | "main";

const createViewId = () => createUuid();

const cloneStateWithRemappedUnits = (state: OrgEditorState): OrgEditorState => {
  const unitIdMap = new Map<UnitId, UnitId>(
    state.units.map((unit) => [unit.id, createOrgEditorUnitId()]),
  );

  return {
    employeeOverrides: state.employeeOverrides.map((employeeOverride) => ({
      ...employeeOverride,
      tags: employeeOverride.tags.map((tag) => ({ ...tag })),
    })),
    employees: state.employees.map((employee) => ({
      ...employee,
      tags: employee.tags.map((tag) => ({ ...tag })),
    })),
    layoutMode: state.layoutMode,
    selectedItems: state.selectedItems.flatMap((item) => {
      const unitId = unitIdMap.get(item.unitId);
      return unitId ? [{ ...item, unitId }] : [];
    }),
    units: state.units.map((unit) => ({
      ...unit,
      employeeIds: [...unit.employeeIds],
      employeePositions: unit.employeePositions.map((position) => ({ ...position })),
      id: unitIdMap.get(unit.id) ?? unit.id,
      liveFilter: unit.liveFilter
        ? {
            ...cloneEmployeeLiveFilterRule(unit.liveFilter),
            selectedUnitIds: unit.liveFilter.selectedUnitIds.map(
              (unitId) => unitIdMap.get(unitId) ?? unitId,
            ),
          }
        : null,
      parentId: unit.parentId === null ? null : (unitIdMap.get(unit.parentId) ?? null),
    })),
    viewport: { ...state.viewport },
  };
};

export class OrgViewsStore {
  viewRecords: OrgView[] = [];
  editorByViewId = new Map<string, OrgEditorStore>();
  activeViewId = "";
  readonly onViewDocumentChange: (viewId: string, kind: OrgViewKind) => void;
  private isLoading = false;

  constructor(onViewDocumentChange: (viewId: string, kind: OrgViewKind) => void) {
    this.onViewDocumentChange = onViewDocumentChange;
    makeAutoObservable(
      this,
      {
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
      this.viewRecords.find((view) => view.id === this.activeViewId) ??
      this.viewRecords.find((view) => view.kind === "main") ??
      null
    );
  }

  get mainView() {
    return this.viewRecords.find((view) => view.kind === "main") ?? null;
  }

  get activeEditor() {
    return this.activeView ? (this.editorByViewId.get(this.activeView.id) ?? null) : null;
  }

  get mainEditor() {
    return this.mainView ? (this.editorByViewId.get(this.mainView.id) ?? null) : null;
  }

  load(views: readonly OrgView[], activeViewId: string): void {
    this.isLoading = true;
    try {
      this.viewRecords = views.map((view) => ({
        ...view,
        state: createDefaultOrgEditorState(),
      }));
      this.editorByViewId = new Map();

      for (const view of views) {
        const editor = new OrgEditorStore(() => this.handleDocumentChange(view.id, view.kind));
        this.editorByViewId.set(view.id, editor);
        editor.loadState(view.state);
      }
    } finally {
      this.isLoading = false;
    }

    this.activeViewId = this.editorByViewId.has(activeViewId)
      ? activeViewId
      : (this.mainView?.id ?? "");
  }

  reset(): void {
    this.viewRecords = [];
    this.editorByViewId = new Map();
    this.activeViewId = "";
  }

  selectView(viewId: string): void {
    if (!this.editorByViewId.has(viewId)) return;
    this.activeViewId = viewId;
  }

  createView(name: string, source: NewViewSource): string {
    const normalizedName = this.validateName(name);
    const now = new Date().toISOString();
    const id = createViewId();
    const sourceState =
      source === "main" && this.mainEditor
        ? cloneStateWithRemappedUnits(this.mainEditor.createState())
        : createDefaultOrgEditorState();
    sourceState.employeeOverrides = [];
    sourceState.employees = [];
    sourceState.selectedItems = [];
    const view: OrgView = {
      createdAt: now,
      id,
      kind: "custom",
      name: normalizedName,
      state: createDefaultOrgEditorState(),
      updatedAt: now,
    };
    const editor = new OrgEditorStore(() => this.handleDocumentChange(id, "custom"));

    this.viewRecords = [...this.viewRecords, view];
    this.editorByViewId.set(id, editor);
    editor.loadState(sourceState);
    this.activeViewId = id;

    return id;
  }

  renameView(viewId: string, name: string): void {
    if (this.viewRecords.find((view) => view.id === viewId)?.kind === "main") return;
    const normalizedName = this.validateName(name, viewId);
    const now = new Date().toISOString();

    this.viewRecords = this.viewRecords.map((view) =>
      view.id === viewId ? { ...view, name: normalizedName, updatedAt: now } : view,
    );
  }

  deleteView(viewId: string): void {
    if (
      this.viewRecords.find((view) => view.id === viewId)?.kind === "main" ||
      !this.editorByViewId.has(viewId)
    ) {
      return;
    }

    this.viewRecords = this.viewRecords.filter((view) => view.id !== viewId);
    this.editorByViewId.delete(viewId);
    if (this.activeViewId === viewId) this.activeViewId = this.mainView?.id ?? "";
  }

  materializeEmployeeBeforeDelete(
    employee: WorkspaceEmployee,
    liveEmployeeIdsByViewId: ReadonlyMap<
      string,
      ReadonlyMap<UnitId, readonly EmployeeId[]>
    > = new Map(),
  ): void {
    for (const view of this.viewRecords) {
      if (view.kind !== "custom") continue;

      const editor = this.editorByViewId.get(view.id);
      if (!editor) continue;
      const state = editor.createState();
      const isReferenced = state.units.some(
        (unit) =>
          (unit.liveFilter !== null &&
            (liveEmployeeIdsByViewId.get(view.id)?.get(unit.id) ?? []).includes(employee.id)) ||
          unit.employeeIds.includes(employee.id) ||
          unit.bossEmployeeId === employee.id ||
          unit.employeePositions.some((position) => position.employeeId === employee.id),
      );
      if (!isReferenced) continue;

      const employeeOverride = state.employeeOverrides.find(
        (currentOverride) => currentOverride.employeeId === employee.id,
      );
      const localEmployeeId = createOrgEditorEmployeeId();
      const now = new Date().toISOString();

      editor.loadState({
        ...state,
        employeeOverrides: state.employeeOverrides.filter(
          (currentOverride) => currentOverride.employeeId !== employee.id,
        ),
        employees: [
          ...state.employees,
          {
            avatarBase64Url: employeeOverride?.avatarBase64Url ?? employee.avatarBase64Url,
            birthday: employeeOverride?.birthday ?? employee.birthday,
            createdAt: now,
            email: employeeOverride?.email ?? employee.email,
            firstName: employeeOverride?.firstName ?? employee.firstName,
            gender: employeeOverride?.gender ?? employee.gender,
            id: localEmployeeId,
            lastName: employeeOverride?.lastName ?? employee.lastName,
            phone: employeeOverride?.phone ?? employee.phone,
            profileUrl: employeeOverride?.profileUrl ?? employee.profileUrl,
            tags: (employeeOverride?.tags ?? employee.tags).map((tag) => ({ ...tag })),
            updatedAt: now,
            username: employeeOverride?.username ?? employee.username,
          },
        ],
        selectedItems: state.selectedItems.map((item) =>
          item.type === "employee" && item.employeeId === employee.id
            ? { ...item, employeeId: localEmployeeId }
            : item,
        ),
        units: state.units.map((unit) => ({
          ...unit,
          bossEmployeeId:
            unit.bossEmployeeId === employee.id ? localEmployeeId : unit.bossEmployeeId,
          employeeIds: unit.employeeIds.map((employeeId) =>
            employeeId === employee.id ? localEmployeeId : employeeId,
          ),
          employeePositions: unit.employeePositions.map((position) =>
            position.employeeId === employee.id
              ? { ...position, employeeId: localEmployeeId }
              : position,
          ),
        })),
      });
    }
  }

  createState(): OrgView[] {
    return this.viewRecords.map((view) => ({
      ...view,
      state: this.editorByViewId.get(view.id)?.createState() ?? createDefaultOrgEditorState(),
    }));
  }

  private handleDocumentChange(viewId: string, kind: OrgViewKind): void {
    if (this.isLoading) return;
    const now = new Date().toISOString();
    this.viewRecords = this.viewRecords.map((view) =>
      view.id === viewId ? { ...view, updatedAt: now } : view,
    );
    this.onViewDocumentChange(viewId, kind);
  }

  private validateName(name: string, currentViewId?: string): string {
    const normalizedName = name.trim();
    if (!normalizedName) throw new LocalizedError(uiMessage("Enter a View name."));

    const normalizedKey = normalizedName.toLocaleLowerCase("en-US");
    if (
      this.viewRecords.some(
        (view) =>
          view.id !== currentViewId &&
          view.name.trim().toLocaleLowerCase("en-US") === normalizedKey,
      )
    ) {
      throw new LocalizedError(uiMessage("A View with this name already exists."));
    }

    return normalizedName;
  }
}

import { LocalizedError, uiMessage } from "@/i18n/messages";
