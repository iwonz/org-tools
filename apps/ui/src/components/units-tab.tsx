"use client";

import type { Employee, EmployeeId, Unit, UnitId } from "@org-tools/types";
import { observer } from "mobx-react-lite";
import {
  type DragEvent,
  type RefObject,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  HiOutlineFolder,
  HiOutlinePencilSquare,
  HiOutlinePlus,
  HiOutlineTrash,
} from "react-icons/hi2";

import { ActionIconButton } from "@/components/action-icon-button";
import { EmployeeCard, EmployeeCardList, EmployeeIdentity } from "@/components/employee-card-list";
import { EmployeeDialog } from "@/components/employee-dialog";
import { EmployeeTagPopover } from "@/components/employee-tag-picker";
import { HighlightedText } from "@/components/highlighted-text";
import { MiddleDot } from "@/components/middle-dot";
import {
  createEmptyEmployeeSearchFilters,
  EmployeeSearchInput,
  filterEmployeesBySearch,
  getEmployeeSearchFiltersKey,
  getSearchTokens,
  hasActiveEmployeeSearchFilters,
  UnitSearchInput,
} from "@/components/search-controls";
import { TopLevelEmptyState } from "@/components/source-empty-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UnitDialog } from "@/components/unit-dialog";
import { UnitTree } from "@/components/unit-tree";
import { useUiText } from "@/i18n/use-ui-text";
import { getVisibleUnitIdsForNameSearch } from "@/lib/unit-search";
import { useUnitEmployeeSummary } from "@/lib/unit-summary";
import { useOrgStore } from "@/stores/org-store-context";

const UNIT_SEARCH_THRESHOLD = 20;

type UnitEmployeeDragState = {
  employeeId: EmployeeId;
  sourceUnitId: UnitId;
};

type EmployeeDragPoint = {
  x: number;
  y: number;
};

type UnitDialogState = {
  parentId: UnitId | null;
  unitId: UnitId | null;
};

const setTransparentDragImage = (event: DragEvent<HTMLElement>) => {
  const transparentCanvas = document.createElement("canvas");

  transparentCanvas.dataset.employeeTransparentDragImage = "";
  transparentCanvas.height = 1;
  transparentCanvas.width = 1;
  transparentCanvas.style.position = "fixed";
  transparentCanvas.style.pointerEvents = "none";
  document.body.append(transparentCanvas);
  event.dataTransfer.setDragImage(transparentCanvas, 0, 0);
  window.requestAnimationFrame(() => transparentCanvas.remove());
};

function UnitEmployeeDragPreview({
  employee,
  initialPoint,
  previewRef,
}: {
  employee: Employee;
  initialPoint: EmployeeDragPoint;
  previewRef: RefObject<HTMLDivElement | null>;
}) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[80] w-[min(22rem,calc(100vw-1rem))] rounded-lg border bg-popover p-1 text-popover-foreground opacity-95 shadow-2xl will-change-transform"
      data-demo-id="unit-employee-drag-preview"
      data-employee-id={String(employee.id)}
      ref={previewRef}
      style={{
        transform: `translate3d(${initialPoint.x}px, ${initialPoint.y}px, 0) translate(-50%, -50%)`,
      }}
    >
      <EmployeeCard className="bg-transparent" employee={employee} variant="compact" />
    </div>,
    document.body,
  );
}

export const UnitsTab = observer(() => {
  const store = useOrgStore();
  const t = useUiText();
  const getUnitEmployeeSummary = useUnitEmployeeSummary();
  const units = store.units;
  const selectedUnit = store.selectedUnit;
  const [unitSearchQuery, setUnitSearchQuery] = useState("");
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");
  const [employeeSearchFilters, setEmployeeSearchFilters] = useState(
    createEmptyEmployeeSearchFilters,
  );
  const [unitDialog, setUnitDialog] = useState<UnitDialogState | null>(null);
  const [deletingUnit, setDeletingUnit] = useState<Unit | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  const [employeeDrag, setEmployeeDrag] = useState<UnitEmployeeDragState | null>(null);
  const [employeeDragPoint, setEmployeeDragPoint] = useState<EmployeeDragPoint | null>(null);
  const [dropTargetUnitId, setDropTargetUnitId] = useState<UnitId | null>(null);
  const dragPreviewRef = useRef<HTMLDivElement | null>(null);
  const finishEmployeeDrag = useCallback(() => {
    setEmployeeDrag(null);
    setEmployeeDragPoint(null);
    setDropTargetUnitId(null);
  }, []);
  const positionEmployeeDragPreview = useCallback((point: EmployeeDragPoint) => {
    const preview = dragPreviewRef.current;
    if (!preview) return;

    const viewportInset = 8;
    const previewRect = preview.getBoundingClientRect();
    let left = point.x - previewRect.width / 2;
    let top = point.y - previewRect.height / 2;

    left = Math.min(
      Math.max(left, viewportInset),
      Math.max(window.innerWidth - previewRect.width - viewportInset, viewportInset),
    );
    top = Math.min(
      Math.max(top, viewportInset),
      Math.max(window.innerHeight - previewRect.height - viewportInset, viewportInset),
    );
    preview.style.transform = `translate3d(${Math.round(left)}px, ${Math.round(top)}px, 0)`;
    preview.dataset.previewX = String(Math.round(left));
    preview.dataset.previewY = String(Math.round(top));
  }, []);

  useEffect(() => {
    if (!employeeDrag || !employeeDragPoint) return undefined;

    let animationFrameId = window.requestAnimationFrame(() => {
      positionEmployeeDragPreview(employeeDragPoint);
    });
    const schedulePreviewMove = (event: globalThis.DragEvent) => {
      if (event.clientX === 0 && event.clientY === 0) return;

      window.cancelAnimationFrame(animationFrameId);
      animationFrameId = window.requestAnimationFrame(() => {
        positionEmployeeDragPreview({ x: event.clientX, y: event.clientY });
      });
    };

    document.addEventListener("drag", schedulePreviewMove, true);
    document.addEventListener("dragover", schedulePreviewMove, true);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      document.removeEventListener("drag", schedulePreviewMove, true);
      document.removeEventListener("dragover", schedulePreviewMove, true);
    };
  }, [employeeDrag, employeeDragPoint, positionEmployeeDragPreview]);

  const deferredUnitSearchQuery = useDeferredValue(unitSearchQuery);
  const deferredEmployeeSearchQuery = useDeferredValue(employeeSearchQuery);
  const unitSearchTokens = useMemo(
    () => getSearchTokens(deferredUnitSearchQuery),
    [deferredUnitSearchQuery],
  );
  const employeeSearchTokens = useMemo(
    () => getSearchTokens(deferredEmployeeSearchQuery),
    [deferredEmployeeSearchQuery],
  );
  const employeeSearchFiltersKey = getEmployeeSearchFiltersKey(employeeSearchFilters);
  const hasEmployeeSearch =
    employeeSearchTokens.length > 0 || hasActiveEmployeeSearchFilters(employeeSearchFilters);
  const showUnitSearch = (units?.deepUnits.length ?? 0) > UNIT_SEARCH_THRESHOLD;
  const visibleUnitIds = useMemo(() => {
    if (!showUnitSearch) return null;

    return getVisibleUnitIdsForNameSearch(units?.indexes.unitSearchDocuments, unitSearchTokens);
  }, [showUnitSearch, unitSearchTokens, units]);
  const hasVisibleUnits = visibleUnitIds === null || visibleUnitIds.size > 0;
  const sortedDirectEmployees = useMemo(() => {
    if (!selectedUnit) return [];

    const directEmployees = selectedUnit.directEmployeeIds
      .map((employeeId) => units?.indexes.employeesById.get(employeeId))
      .filter((employee): employee is NonNullable<typeof employee> => Boolean(employee));
    const bossEmployeeIds = new Set(
      directEmployees
        .filter((employee) =>
          employee.unitPositions.some(
            (unitPosition) => unitPosition.unitId === selectedUnit.id && unitPosition.isBoss,
          ),
        )
        .map((employee) => employee.id),
    );

    return directEmployees
      .map((employee, index) => ({ employee, index }))
      .sort((firstEntry, secondEntry) => {
        const firstIsBoss = bossEmployeeIds.has(firstEntry.employee.id);
        const secondIsBoss = bossEmployeeIds.has(secondEntry.employee.id);

        if (firstIsBoss !== secondIsBoss) return firstIsBoss ? -1 : 1;

        return firstEntry.index - secondEntry.index;
      })
      .map(({ employee }) => employee);
  }, [selectedUnit, units?.indexes.employeesById]);
  const directEmployeeIdSet = useMemo(
    () => new Set(selectedUnit?.directEmployeeIds ?? []),
    [selectedUnit?.directEmployeeIds],
  );
  const nestedEmployees = useMemo(() => {
    if (!selectedUnit || !units) return [];

    return selectedUnit.deepEmployeeIds
      .filter((employeeId) => !directEmployeeIdSet.has(employeeId))
      .map((employeeId) => units.indexes.employeesById.get(employeeId))
      .filter((employee): employee is NonNullable<typeof employee> => Boolean(employee));
  }, [directEmployeeIdSet, selectedUnit, units]);
  const employeeSearchDocumentByEmployeeId = units?.indexes.employeeSearchDocumentByEmployeeId;
  const filteredDirectEmployees = useMemo(() => {
    if (!employeeSearchDocumentByEmployeeId) return [];

    return filterEmployeesBySearch({
      employeeSearchDocumentByEmployeeId,
      employeeUnitMembershipsByEmployeeId: store.employeeUnitMembershipsByEmployeeId,
      employees: sortedDirectEmployees,
      filters: employeeSearchFilters,
      queryTokens: employeeSearchTokens,
    });
  }, [
    employeeSearchDocumentByEmployeeId,
    store.employeeUnitMembershipsByEmployeeId,
    employeeSearchFilters,
    employeeSearchTokens,
    sortedDirectEmployees,
  ]);
  const filteredNestedEmployees = useMemo(() => {
    if (!employeeSearchDocumentByEmployeeId) return [];

    return filterEmployeesBySearch({
      employeeSearchDocumentByEmployeeId,
      employeeUnitMembershipsByEmployeeId: store.employeeUnitMembershipsByEmployeeId,
      employees: nestedEmployees,
      filters: employeeSearchFilters,
      queryTokens: employeeSearchTokens,
    });
  }, [
    employeeSearchDocumentByEmployeeId,
    store.employeeUnitMembershipsByEmployeeId,
    employeeSearchFilters,
    employeeSearchTokens,
    nestedEmployees,
  ]);
  const hasUnitEmployees = sortedDirectEmployees.length > 0 || nestedEmployees.length > 0;
  const employeeSections = useMemo(
    () => [
      {
        employees: filteredDirectEmployees,
        id: "direct",
        title: t("Direct Employees"),
      },
      {
        employees: filteredNestedEmployees,
        id: "nested",
        title: t("Employees in descendant Units"),
      },
    ],
    [filteredDirectEmployees, filteredNestedEmployees, t],
  );
  const draggedEmployee = employeeDrag
    ? (units?.indexes.employeesById.get(employeeDrag.employeeId) ?? null)
    : null;
  const editedUnit = unitDialog?.unitId
    ? (store.mainOrgEditor.units.find((unit) => unit.id === unitDialog.unitId) ?? null)
    : null;

  if (!units) return null;

  const unitDialogParentName = unitDialog?.parentId
    ? (units.indexes.unitsById.get(unitDialog.parentId)?.name ?? null)
    : null;

  if (units.roots.length === 0 || !selectedUnit) {
    return (
      <>
        <TopLevelEmptyState
          action={
            <Button
              data-demo-id="unit-create-root-button"
              onClick={() => setUnitDialog({ parentId: null, unitId: null })}
              type="button"
            >
              <HiOutlinePlus />
              {t("Add Unit")}
            </Button>
          }
          description={t("Create the first Unit to start building the hierarchy.")}
          icon={<HiOutlineFolder className="size-6" />}
          title={t("No Units yet")}
        />
        {unitDialog && (
          <UnitDialog
            editorUnits={store.mainOrgEditor.units}
            onOpenChange={(open) => !open && setUnitDialog(null)}
            onSave={(configuration) => store.createUnit(configuration)}
            open
            structure={units}
          />
        )}
      </>
    );
  }

  return (
    <section
      className="grid min-h-0 min-w-0 flex-1 overflow-hidden bg-muted/20"
      style={{ gridTemplateColumns: "fit-content(70%) minmax(30%, 1fr)" }}
    >
      <div
        className="flex min-h-0 min-w-0 flex-col border-r bg-background"
        data-demo-id="units-tree-panel"
      >
        <div className="flex min-h-16 shrink-0 items-center gap-2 border-b px-3 py-2">
          {showUnitSearch && (
            <UnitSearchInput
              ariaLabel={t("Search Units by name")}
              className="min-w-40 flex-1"
              dataDemoId="units-search"
              onValueChange={setUnitSearchQuery}
              placeholder={t("Search Units by name")}
              value={unitSearchQuery}
            />
          )}
          <Button
            className={showUnitSearch ? "shrink-0" : "w-full"}
            data-demo-id="unit-create-root-button"
            onClick={() => setUnitDialog({ parentId: null, unitId: null })}
            size="sm"
            type="button"
          >
            <HiOutlinePlus />
            {t("Add Unit")}
          </Button>
        </div>
        <ScrollArea className="min-h-0 flex-1" scrollbars="none">
          {hasVisibleUnits ? (
            <ul className="grid min-w-max gap-2 p-3">
              <UnitTree
                cardClassName="w-max min-w-full"
                dataDemoId="unit-tree-item"
                dropTarget={(unit) => {
                  if (
                    !employeeDrag ||
                    unit.id === employeeDrag.sourceUnitId ||
                    unit.membershipMode === "live"
                  )
                    return null;

                  return {
                    active: dropTargetUnitId === unit.id,
                    dataDemoId: "unit-employee-drop-zone",
                    label: t("Move Employee to Unit “{name}”", { name: unit.name }),
                    onDragEnter: (event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "move";
                      setDropTargetUnitId(unit.id);
                    },
                    onDragLeave: (event) => {
                      const relatedTarget = event.relatedTarget;
                      if (
                        relatedTarget instanceof Node &&
                        event.currentTarget.contains(relatedTarget)
                      ) {
                        return;
                      }
                      setDropTargetUnitId((currentUnitId) =>
                        currentUnitId === unit.id ? null : currentUnitId,
                      );
                    },
                    onDragOver: (event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "move";
                      setDropTargetUnitId(unit.id);
                    },
                    onDrop: (event) => {
                      event.preventDefault();
                      store.moveEmployeeBetweenUnits(
                        employeeDrag.employeeId,
                        employeeDrag.sourceUnitId,
                        unit.id,
                      );
                      finishEmployeeDrag();
                    },
                  };
                }}
                employeesById={units.indexes.employeesById}
                expandedUnitIds={store.expandedUnitIds}
                actions={(unit) => (
                  <>
                    <ActionIconButton
                      dataDemoId="unit-create-child-button"
                      disabled={false}
                      icon={<HiOutlinePlus />}
                      label={t("Add child Unit")}
                      onClick={() => setUnitDialog({ parentId: unit.id, unitId: null })}
                      tooltip={t("Add child Unit")}
                    />
                    <ActionIconButton
                      dataDemoId="unit-edit-button"
                      disabled={false}
                      icon={<HiOutlinePencilSquare />}
                      label={t("Edit Unit")}
                      onClick={() => setUnitDialog({ parentId: unit.parentId, unitId: unit.id })}
                      tooltip={t("Edit Unit")}
                    />
                    <ActionIconButton
                      disabled={false}
                      icon={<HiOutlineTrash />}
                      label={t("Delete Unit")}
                      onClick={() => setDeletingUnit(unit)}
                      tooltip={t("Delete Unit and descendant branch")}
                    />
                  </>
                )}
                onClick={(unit, state) => {
                  store.selectUnit(unit.id);

                  if (state.hasChildren && !state.isExpanded) {
                    store.toggleExpandedUnitId(unit.id);
                  }
                }}
                onDoubleClick={(unit, state) => {
                  if (state.hasChildren && state.isExpanded) {
                    store.toggleExpandedUnitId(unit.id);
                  }
                }}
                onToggle={store.toggleExpandedUnitId}
                queryTokens={unitSearchTokens}
                roots={units.roots}
                scrollIntoViewUnitId={store.selectedUnitId}
                scrollIntoViewWhen={store.activeTab === "units"}
                selected={(unit) => store.selectedUnitId === unit.id}
                subtitle={getUnitEmployeeSummary}
                visibleUnitIds={visibleUnitIds}
              />
            </ul>
          ) : (
            <div className="grid min-h-[220px] place-items-center p-8 text-center text-sm text-muted-foreground">
              <div className="grid justify-items-center gap-3">
                <HiOutlineFolder className="size-8 text-muted-foreground/70" />
                <span>{t("No Units found")}</span>
              </div>
            </div>
          )}
        </ScrollArea>
      </div>
      <aside
        className="flex min-h-0 min-w-0 flex-col overflow-hidden bg-background"
        data-demo-id="units-employee-panel"
      >
        <div className="grid shrink-0 gap-3 border-b p-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{selectedUnit.name}</div>
            <nav
              aria-label={t("Selected Unit path")}
              className="scrollbar-hidden mt-1 min-w-0 overflow-x-auto overflow-y-hidden"
              data-demo-id="units-selected-path"
            >
              <ol className="flex w-max min-w-full items-center text-xs text-muted-foreground">
                {selectedUnit.path.names.map((pathName, index) => (
                  <li
                    className="flex min-w-0 shrink-0 items-center"
                    key={selectedUnit.path.ids[index] ?? pathName}
                  >
                    {index > 0 && <MiddleDot />}
                    <span className="whitespace-nowrap">{pathName}</span>
                  </li>
                ))}
              </ol>
            </nav>
          </div>
          {hasUnitEmployees && (
            <EmployeeSearchInput
              ariaLabel={t("Search Employees in the selected Unit")}
              dataDemoId="units-employee-search"
              filters={employeeSearchFilters}
              onFiltersChange={setEmployeeSearchFilters}
              onValueChange={setEmployeeSearchQuery}
              placeholder={t("Search Employees")}
              positionButtonDemoId="units-employee-position-filter"
              positionOptions={units.indexes.positionOptions}
              positionPopoverDemoId="units-employee-position-popover"
              tagOptions={units.indexes.tagOptions}
              value={employeeSearchQuery}
            />
          )}
        </div>
        <EmployeeCardList
          actions={(employee) => (
            <>
              <EmployeeTagPopover
                dataDemoId="units-employee-tag-picker"
                employee={employee}
                onApply={store.updateEmployeeTags}
                tagOptions={units.indexes.tagOptions}
              />
              <ActionIconButton
                disabled={false}
                icon={<HiOutlinePencilSquare />}
                label={t("Edit Employee")}
                onClick={() => setEditingEmployee(employee)}
                tooltip={t("Edit Employee")}
              />
              <ActionIconButton
                disabled={false}
                icon={<HiOutlineTrash />}
                label={t("Delete Employee")}
                onClick={() => setDeletingEmployee(employee)}
                tooltip={t("Delete Employee")}
              />
            </>
          )}
          bossUnitId={selectedUnit.id}
          cardDataDemoId="unit-employee-card"
          className="flex-1"
          dataDemoId="units-employee-cards"
          draggable={(employee) =>
            selectedUnit.membershipMode === "manual" && directEmployeeIdSet.has(employee.id)
          }
          emptyState={
            hasUnitEmployees && hasEmployeeSearch
              ? t("No Employees found")
              : t("The selected Unit has no Employees")
          }
          name={(employee) => (
            <HighlightedText queryTokens={employeeSearchTokens} text={employee.fullName} />
          )}
          onDragEnd={() => {
            finishEmployeeDrag();
          }}
          onDragStart={(event: DragEvent<HTMLElement>, employee) => {
            const sourceUnitId = selectedUnit.id;
            const dragState = { employeeId: employee.id, sourceUnitId };
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData(
              "application/x-org-tools-employee",
              JSON.stringify(dragState),
            );
            setTransparentDragImage(event);
            setEmployeeDrag(dragState);
            setEmployeeDragPoint({ x: event.clientX, y: event.clientY });
          }}
          onUnitContextClick={(unitContext) => {
            store.selectUnitFromEmployeeCard(unitContext.unitId);
          }}
          resetKey={`units:${selectedUnit.id}:${deferredEmployeeSearchQuery}:${employeeSearchFiltersKey}`}
          queryTokens={employeeSearchTokens}
          sections={employeeSections}
          subtitle={(employee) => (
            <EmployeeIdentity employee={employee} queryTokens={employeeSearchTokens} />
          )}
          unitContextsByEmployeeId={store.employeeUnitContextsByEmployeeId}
        />
      </aside>
      {draggedEmployee && employeeDragPoint && (
        <UnitEmployeeDragPreview
          employee={draggedEmployee}
          initialPoint={employeeDragPoint}
          previewRef={dragPreviewRef}
        />
      )}
      {unitDialog && (
        <UnitDialog
          editorUnits={store.mainOrgEditor.units}
          initialUnit={editedUnit}
          onOpenChange={(open) => !open && setUnitDialog(null)}
          onSave={(configuration) => {
            if (editedUnit) {
              store.updateUnit(editedUnit.id, configuration);
              return;
            }
            store.createUnit(configuration, unitDialog.parentId);
          }}
          open
          parentName={unitDialogParentName}
          structure={units}
        />
      )}
      {editingEmployee && (
        <EmployeeDialog
          employee={editingEmployee}
          mode="global"
          onOpenChange={(open) => !open && setEditingEmployee(null)}
          onSave={(fields, memberships) =>
            store.updateEmployee(editingEmployee.id, fields, memberships)
          }
          open
          tagOptions={units.indexes.tagOptions}
          units={units}
        />
      )}
      <AlertDialog
        onOpenChange={(open) => !open && setDeletingEmployee(null)}
        open={Boolean(deletingEmployee)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Delete Employee?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingEmployee
                ? t(
                    "Employee {name} will be removed from the global catalog and Main. Custom Views will keep a local copy.",
                    {
                      name: deletingEmployee.fullName,
                    },
                  )
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              data-demo-id="unit-delete-employee-confirm"
              onClick={() => {
                if (deletingEmployee) {
                  store.deleteWorkspaceEmployee(deletingEmployee.id);
                }
                setDeletingEmployee(null);
              }}
            >
              {t("Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog onOpenChange={(open) => !open && setDeletingUnit(null)} open={Boolean(deletingUnit)}>
        <DialogContent className="max-w-lg p-0">
          <DialogHeader>
            <DialogTitle>{t("Delete Unit?")}</DialogTitle>
          </DialogHeader>
          <DialogBody className="text-sm text-muted-foreground">
            {deletingUnit
              ? t(
                  "Unit “{name}”, its descendant branch, and its assignments will be deleted. Employee records will remain in the global catalog.",
                  {
                    name: deletingUnit.name,
                  },
                )
              : null}
          </DialogBody>
          <DialogFooter>
            <Button onClick={() => setDeletingUnit(null)} type="button" variant="outline">
              {t("Cancel")}
            </Button>
            <Button
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (deletingUnit) store.deleteUnit(deletingUnit.id);
                setDeletingUnit(null);
              }}
              type="button"
            >
              {t("Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
});
