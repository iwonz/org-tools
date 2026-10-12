"use client";

import type { Employee, EmployeeTagDefinition, TagId } from "@org-tools/types";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  HiOutlineBars3,
  HiOutlineEye,
  HiOutlineMagnifyingGlass,
  HiOutlinePencilSquare,
  HiOutlinePlus,
  HiOutlineSwatch,
  HiOutlineTag,
  HiOutlineTrash,
} from "react-icons/hi2";

import { EmployeeCardActions } from "@/components/employee-card-actions";
import { EmployeeCardList, EmployeeIdentity } from "@/components/employee-card-list";
import { EmployeeDialog } from "@/components/employee-dialog";
import { HighlightedText } from "@/components/highlighted-text";
import { TagColorPicker } from "@/components/tag-color-picker";
import { TagSurface } from "@/components/tag-surface";
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
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAccess } from "@/components/use-access";
import { useTagCatalogDrag } from "@/components/use-tag-catalog-drag";
import { describeError, type UiMessageDescriptor } from "@/i18n/messages";
import { useCountText, useMessageText, useUiText } from "@/i18n/use-ui-text";
import { createUuid } from "@/lib/employee-data";
import { normalizeTagSearchValue } from "@/lib/tag-order";
import { cn } from "@/lib/utils";
import { useOrgStore } from "@/stores/org-store-context";

export const TagCatalogDialog = observer(function TagCatalogDialog({
  onOpenChange,
  open,
}: {
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const store = useOrgStore();
  const t = useUiText();
  const countText = useCountText();
  const messageText = useMessageText();
  const { can } = useAccess();
  const canUpdateTags = can("tag.update");
  const canCreateTags = can("tag.create");
  const canDeleteTags = can("tag.delete");
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<TagId[]>([]);
  const [editing, setEditing] = useState<EmployeeTagDefinition | null>(null);
  const [deleteId, setDeleteId] = useState<TagId | null>(null);
  const [viewingTagId, setViewingTagId] = useState<TagId | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  const units = store.units;
  const [editError, setEditError] = useState<UiMessageDescriptor | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const canForEmployee = (
    employee: Employee,
    permission: "employee.assignments.update" | "employee.update" | "tag.assign",
  ) => {
    const contexts = store.employeeUnitContextsByEmployeeId.get(employee.id) ?? [];
    return (
      can(permission, { employeeId: employee.id }) ||
      contexts.some((context) =>
        can(permission, { employeeId: employee.id, unitId: context.unitId }),
      )
    );
  };
  const moveTags = (
    sourceIds: readonly TagId[],
    targetId: TagId,
    placement: "before" | "after",
  ) => {
    if (!canUpdateTags) return;
    store.moveTags(sourceIds, targetId, placement);
    const positions = sourceIds
      .map((sourceId) => store.tagDefinitions.findIndex((tag) => tag.id === sourceId))
      .filter((index) => index >= 0);
    const position = positions.length > 0 ? Math.min(...positions) + 1 : null;
    const tag = sourceIds.length === 1 ? store.tagDefinitions[positions[0] ?? -1] : null;
    if (tag && position !== null) {
      setAnnouncement(t("{name} moved to position {position}", { name: tag.label, position }));
    } else if (position !== null) {
      setAnnouncement(
        t("Moved {count} Tags to position {position}", { count: sourceIds.length, position }),
      );
    }
  };
  const visible = useMemo(() => {
    const normalized = normalizeTagSearchValue(query);
    return store.tagDefinitions.filter(
      (tag) => !normalized || normalizeTagSearchValue(tag.label).includes(normalized),
    );
  }, [query, store.tagDefinitions]);
  const visibleById = useMemo(() => new Map(visible.map((tag) => [tag.id, tag])), [visible]);
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const catalogIdSet = useMemo(
    () => new Set(store.tagDefinitions.map((tag) => tag.id)),
    [store.tagDefinitions],
  );
  useEffect(() => {
    setSelectedIds((current) => {
      if (!open) return current.length === 0 ? current : [];
      const next = current.filter((id) => catalogIdSet.has(id));
      return next.length === current.length ? current : next;
    });
  }, [catalogIdSet, open]);
  const replaceSelection = (ids: TagId[]) => {
    setSelectedIds(ids);
    setAnnouncement(
      t("Selected {selected} of {total}", {
        selected: ids.length,
        total: store.tagDefinitions.length,
      }),
    );
  };
  const selectTag = (id: TagId, additive: boolean) => {
    if (!canUpdateTags) return;
    const next = additive
      ? selectedIdSet.has(id)
        ? selectedIds.filter((selectedId) => selectedId !== id)
        : [...selectedIds, id]
      : [id];
    replaceSelection(next);
  };
  const drag = useTagCatalogDrag({
    tags: store.tagDefinitions,
    visible,
    query,
    open,
    selectedIds,
    onSelectOnly: (id) => replaceSelection([id]),
    onMove: moveTags,
  });
  const counts = useMemo(() => {
    const result = new Map<TagId, { dated: number; employees: number }>();
    for (const employee of store.organizationEmployees) {
      for (const assignment of employee.tags) {
        const current = result.get(assignment.tagId) ?? { dated: 0, employees: 0 };
        current.employees += 1;
        if (assignment.date) current.dated += 1;
        result.set(assignment.tagId, current);
      }
    }
    return result;
  }, [store.organizationEmployees]);
  const viewingTag = store.tagDefinitions.find((tag) => tag.id === viewingTagId) ?? null;
  const editingExistingTag = Boolean(
    editing && store.tagDefinitions.some((tag) => tag.id === editing.id),
  );
  const taggedEmployees = useMemo(
    () =>
      viewingTagId
        ? (units?.indexes.employeesByName ?? []).filter((employee) =>
            employee.tags.some((assignment) => assignment.tagId === viewingTagId),
          )
        : [],
    [units, viewingTagId],
  );
  const renderRow = (tag: EmployeeTagDefinition, visibleIndex: number, overlay = false) => {
    const count = counts.get(tag.id) ?? { dated: 0, employees: 0 };
    const selected = !overlay && selectedIdSet.has(tag.id);
    return (
      <fieldset
        className={cn(
          "relative m-0 flex min-w-0 items-center gap-2 border-0 p-0",
          selected && "outline outline-2 outline-offset-2 outline-signal/70",
          !overlay &&
            drag.preview &&
            "transition-transform duration-150 motion-reduce:transition-none",
        )}
        style={
          overlay
            ? undefined
            : {
                transform: drag.preview
                  ? `translateY(${drag.preview.offsets.get(tag.id) ?? 0}px)`
                  : undefined,
                opacity: drag.preview?.ids.includes(tag.id) ? 0 : undefined,
              }
        }
        data-demo-id={overlay ? undefined : "tag-catalog-row"}
        data-selected={overlay ? undefined : String(selected)}
        data-tag-id={overlay ? undefined : tag.id}
        aria-label={tag.label}
        key={tag.id}
      >
        {canUpdateTags && (
          <button
            aria-label={t("Drag {name} to reorder", { name: tag.label })}
            className="grid touch-none size-8 shrink-0 cursor-grab place-items-center rounded-md text-muted-foreground outline-none hover:bg-accent/55 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
            data-demo-id="tag-catalog-drag-handle"
            onPointerDown={overlay ? undefined : (event) => drag.onPointerDown(event, tag.id)}
            onPointerMove={overlay ? undefined : drag.onPointerMove}
            onPointerUp={overlay ? undefined : drag.onPointerUp}
            onPointerCancel={overlay ? undefined : drag.onPointerCancel}
            onLostPointerCapture={overlay ? undefined : drag.onLostPointerCapture}
            tabIndex={overlay ? -1 : undefined}
            onKeyDown={(event) => {
              if (overlay) return;
              drag.cancel();
              if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
              event.preventDefault();
              const sourceIds = selectedIdSet.has(tag.id)
                ? visible.filter((item) => selectedIdSet.has(item.id)).map((item) => item.id)
                : [tag.id];
              const sourceIdSet = new Set(sourceIds);
              const target =
                event.key === "ArrowUp"
                  ? visible
                      .slice(0, visibleIndex)
                      .reverse()
                      .find((item) => !sourceIdSet.has(item.id))
                  : visible.slice(visibleIndex + 1).find((item) => !sourceIdSet.has(item.id));
              if (target)
                moveTags(sourceIds, target.id, event.key === "ArrowUp" ? "before" : "after");
            }}
            title={t("Drag to reorder or use the arrow keys")}
            type="button"
          >
            <HiOutlineBars3 className="size-4" />
          </button>
        )}
        <button
          aria-label={tag.label}
          aria-pressed={selected}
          className="flex min-w-0 flex-1 flex-wrap items-center gap-2 rounded-sm text-start outline-none focus-visible:ring-2 focus-visible:ring-ring"
          data-demo-id="tag-catalog-identity"
          disabled={overlay || !canUpdateTags}
          onClick={
            overlay ? undefined : (event) => selectTag(tag.id, event.ctrlKey || event.metaKey)
          }
          tabIndex={overlay ? -1 : undefined}
          type="button"
        >
          <TagSurface className="font-medium" color={tag.color}>
            <HighlightedText queryTokens={[normalizeTagSearchValue(query)]} text={tag.label} />
          </TagSurface>
          <span className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap">
            <span
              className="shrink-0 whitespace-nowrap text-xs text-muted-foreground"
              data-demo-id="tag-catalog-employee-count"
            >
              {countText("employees", { count: count.employees })}
            </span>
            {count.dated > 0 && (
              <span
                className="shrink-0 whitespace-nowrap text-xs text-muted-foreground"
                data-demo-id="tag-catalog-dated-count"
              >
                {t("With date: {count}", { count: count.dated })}
              </span>
            )}
          </span>
        </button>
        <Button
          aria-label={t("View Employees with this Tag")}
          data-demo-id="tag-catalog-view-employees"
          onClick={overlay ? undefined : () => setViewingTagId(tag.id)}
          size="icon"
          title={t("View Employees with this Tag")}
          type="button"
          variant="ghost"
        >
          <HiOutlineEye />
        </Button>
        {canUpdateTags &&
          (overlay ? (
            <span className={buttonVariants({ size: "icon", variant: "ghost" })}>
              <HiOutlineSwatch />
            </span>
          ) : (
            <TagColorPicker
              onChange={(color) => store.saveTagDefinition({ ...tag, color })}
              value={tag.color}
              variant="icon"
            />
          ))}
        {canUpdateTags && (
          <Button
            aria-label={t("Edit tag")}
            onClick={
              overlay
                ? undefined
                : () => {
                    setEditing({ ...tag });
                    setEditError(null);
                  }
            }
            size="icon"
            title={t("Edit tag")}
            type="button"
            variant="ghost"
          >
            <HiOutlinePencilSquare />
          </Button>
        )}
        {canDeleteTags && (
          <Button
            aria-label={t("Delete tag")}
            onClick={overlay ? undefined : () => setDeleteId(tag.id)}
            size="icon"
            title={t("Delete tag")}
            type="button"
            variant="ghost"
          >
            <HiOutlineTrash />
          </Button>
        )}
      </fieldset>
    );
  };
  return (
    <>
      <Dialog
        onOpenChange={(nextOpen) => {
          drag.cancel();
          if (!nextOpen) setSelectedIds([]);
          onOpenChange(nextOpen);
        }}
        open={open}
      >
        <DialogContent
          className="flex max-h-[86dvh] max-w-2xl flex-col"
          data-demo-id="tag-catalog-dialog"
        >
          <DialogHeader>
            <DialogTitle>{t("Tags")}</DialogTitle>
          </DialogHeader>
          <DialogBody className="grid min-h-0 flex-1 gap-3 overflow-hidden">
            <span aria-live="polite" className="sr-only">
              {announcement}
            </span>
            <div className="relative">
              <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label={t("Search tags")}
                className="pl-9"
                onChange={(event) => {
                  setQuery(event.currentTarget.value);
                  setSelectedIds([]);
                }}
                placeholder={t("Search tags")}
                type="search"
                value={query}
              />
            </div>
            <div
              className="min-h-0 overflow-y-auto overscroll-contain"
              data-demo-id="tag-catalog-scroll"
              ref={drag.listRef}
              onScroll={drag.onScroll}
            >
              {visible.length === 0 ? (
                <div className="rounded-md bg-muted/35 p-4 text-sm text-muted-foreground">
                  {t("No tags found")}
                </div>
              ) : (
                <div className="relative grid gap-3">
                  {visible.map((tag, index) => renderRow(tag, index))}
                  {drag.preview && (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 rounded-md border border-dashed border-signal/50 bg-signal/10"
                      data-demo-id="tag-catalog-drop-placeholder"
                      style={{ top: drag.preview.top, height: drag.preview.height }}
                    />
                  )}
                </div>
              )}
            </div>
          </DialogBody>
          <DialogFooter>
            {canCreateTags && (
              <Button
                onClick={() => {
                  setEditing({ color: null, id: createUuid(), label: "" });
                  setEditError(null);
                }}
                type="button"
              >
                <HiOutlinePlus />
                {t("Create")}
              </Button>
            )}
            <Button
              onClick={() => {
                setSelectedIds([]);
                onOpenChange(false);
              }}
              type="button"
              variant="outline"
            >
              {t("Close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {drag.preview &&
        createPortal(
          <div
            aria-hidden="true"
            inert
            className="pointer-events-none fixed z-[100] grid gap-3 rounded-md bg-popover text-popover-foreground shadow-lg ring-1 ring-border"
            data-demo-id="tag-catalog-drag-preview"
            style={{
              left: drag.preview.x,
              top: drag.preview.y,
              width: drag.preview.width,
              height: drag.preview.height,
            }}
          >
            {drag.preview.ids.flatMap((id) => {
              const tag = visibleById.get(id);
              return tag ? [renderRow(tag, -1, true)] : [];
            })}
          </div>,
          document.body,
        )}
      <Dialog
        onOpenChange={(next) => {
          if (next) return;
          setEditing(null);
          setEditError(null);
        }}
        open={editing !== null}
      >
        <DialogContent className="max-w-md" data-demo-id="tag-catalog-editor">
          <DialogHeader>
            <DialogTitle>{editingExistingTag ? t("Edit tag") : t("Create")}</DialogTitle>
          </DialogHeader>
          {editing && (
            <>
              <DialogBody className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="tag-catalog-name">{t("Name")}</Label>
                  <Input
                    id="tag-catalog-name"
                    onChange={(event) =>
                      setEditing({ ...editing, label: event.currentTarget.value })
                    }
                    value={editing.label}
                  />
                </div>
                {editError && (
                  <div className="text-sm text-destructive" role="alert">
                    {messageText(editError)}
                  </div>
                )}
              </DialogBody>
              <DialogFooter>
                <Button
                  onClick={() => {
                    setEditing(null);
                    setEditError(null);
                  }}
                  type="button"
                  variant="ghost"
                >
                  {t("Cancel")}
                </Button>
                <Button
                  onClick={() => {
                    try {
                      store.saveTagDefinition(editing);
                      setEditing(null);
                      setEditError(null);
                    } catch (saveError) {
                      setEditError(describeError(saveError));
                    }
                  }}
                  type="button"
                >
                  <HiOutlineTag />
                  {editingExistingTag ? t("Save") : t("Create")}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        onOpenChange={(nextOpen) => !nextOpen && setViewingTagId(null)}
        open={viewingTag !== null}
      >
        <DialogContent
          className="flex max-h-[86dvh] max-w-3xl flex-col"
          data-demo-id="tag-employees-dialog"
        >
          <DialogHeader>
            <DialogTitle>
              {viewingTag
                ? t("Employees with Tag {tag}", { tag: viewingTag.label })
                : t("Employees")}
            </DialogTitle>
          </DialogHeader>
          <DialogBody className="min-h-0 flex-1 overflow-hidden p-0">
            {units && (
              <EmployeeCardList
                actions={(employee) => (
                  <EmployeeCardActions
                    canAssignTags={canForEmployee(employee, "tag.assign")}
                    canDelete={can("employee.delete")}
                    canEdit={
                      canForEmployee(employee, "employee.update") ||
                      canForEmployee(employee, "employee.assignments.update")
                    }
                    employee={employee}
                    onApplyTags={store.updateEmployeeTags}
                    onDelete={setDeletingEmployee}
                    onEdit={setEditingEmployee}
                    tagOptions={units.indexes.tagOptions}
                    tagPickerDataDemoId="tag-employees-tag-picker"
                  />
                )}
                className="h-full p-0"
                dataDemoId="tag-employees-list"
                employees={taggedEmployees}
                emptyState={t("No Employees have this Tag")}
                onUnitContextClick={(unitContext) =>
                  store.selectUnitFromEmployeeCard(unitContext.unitId)
                }
                resetKey={`tag-employees:${viewingTagId ?? "none"}`}
                subtitle={(employee) => <EmployeeIdentity employee={employee} />}
                unitContextsByEmployeeId={store.employeeUnitContextsByEmployeeId}
              />
            )}
          </DialogBody>
          <DialogFooter>
            <Button onClick={() => setViewingTagId(null)} type="button" variant="outline">
              {t("Close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {editingEmployee &&
        units &&
        (canForEmployee(editingEmployee, "employee.update") ||
          canForEmployee(editingEmployee, "employee.assignments.update") ||
          canForEmployee(editingEmployee, "tag.assign")) && (
          <EmployeeDialog
            canAssignTags={canForEmployee(editingEmployee, "tag.assign")}
            canEditAssignments={canForEmployee(editingEmployee, "employee.assignments.update")}
            canEditFields={canForEmployee(editingEmployee, "employee.update")}
            employee={editingEmployee}
            mode="global"
            onOpenChange={(nextOpen) => !nextOpen && setEditingEmployee(null)}
            onSave={(fields, memberships, customOptionDrafts) =>
              store.updateEmployee(
                editingEmployee.id,
                fields,
                memberships,
                store.systemOrgViewId,
                customOptionDrafts,
              )
            }
            open={Boolean(editingEmployee)}
            tagOptions={units.indexes.tagOptions}
            units={units}
          />
        )}
      <AlertDialog
        onOpenChange={(nextOpen) => !nextOpen && setDeletingEmployee(null)}
        open={Boolean(deletingEmployee) && can("employee.delete")}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Delete Employee?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingEmployee
                ? t("Employee {name} will be removed from the catalog and every Team.", {
                    name: deletingEmployee.fullName,
                  })
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (deletingEmployee) store.deleteOrganizationEmployee(deletingEmployee.id);
                setDeletingEmployee(null);
              }}
            >
              {t("Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog onOpenChange={(next) => !next && setDeleteId(null)} open={deleteId !== null}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Delete tag?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("The Tag will be removed from every Employee and saved filter.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (deleteId) store.deleteTagDefinition(deleteId);
                setDeleteId(null);
              }}
            >
              {t("Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});
