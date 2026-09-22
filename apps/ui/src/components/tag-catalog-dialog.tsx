"use client";

import type { Employee, EmployeeTagDefinition, TagId } from "@org-tools/types";
import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  HiOutlineBars3,
  HiOutlineEye,
  HiOutlineMagnifyingGlass,
  HiOutlinePencilSquare,
  HiOutlineSwatch,
  HiOutlineTag,
  HiOutlineTrash,
} from "react-icons/hi2";

import { EmployeeCardActions } from "@/components/employee-card-actions";
import { EmployeeCardList, EmployeeIdentity } from "@/components/employee-card-list";
import { EmployeeDialog } from "@/components/employee-dialog";
import { HighlightedText } from "@/components/highlighted-text";
import { TagColorPicker } from "@/components/tag-color-picker";
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
import { useTagCatalogDrag } from "@/components/use-tag-catalog-drag";
import { describeError, type UiMessageDescriptor } from "@/i18n/messages";
import { useCountText, useMessageText, useUiText } from "@/i18n/use-ui-text";
import { customTagColorSurfaceStyle, tagColorSurfaceClassName } from "@/lib/tag-color";
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
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<EmployeeTagDefinition | null>(null);
  const [deleteId, setDeleteId] = useState<TagId | null>(null);
  const [viewingTagId, setViewingTagId] = useState<TagId | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  const units = store.units;
  const [editError, setEditError] = useState<UiMessageDescriptor | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const moveTag = (sourceId: TagId, targetId: TagId, placement: "before" | "after") => {
    store.moveTag(sourceId, targetId, placement);
    const index = store.tagDefinitions.findIndex((tag) => tag.id === sourceId);
    const tag = store.tagDefinitions[index];
    if (tag)
      setAnnouncement(
        t("{name} moved to position {position}", { name: tag.label, position: index + 1 }),
      );
  };
  const visible = useMemo(() => {
    const normalized = normalizeTagSearchValue(query);
    return store.tagDefinitions.filter(
      (tag) => !normalized || normalizeTagSearchValue(tag.label).includes(normalized),
    );
  }, [query, store.tagDefinitions]);
  const drag = useTagCatalogDrag({
    tags: store.tagDefinitions,
    visible,
    query,
    open,
    onMove: moveTag,
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
    return (
      <fieldset
        className={cn(
          "relative m-0 flex min-w-0 items-center gap-2 border-0 p-0",
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
                opacity: drag.preview?.id === tag.id ? 0 : undefined,
              }
        }
        data-demo-id={overlay ? undefined : "tag-catalog-row"}
        data-tag-id={overlay ? undefined : tag.id}
        aria-label={tag.label}
        key={tag.id}
      >
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
            const target = visible[visibleIndex + (event.key === "ArrowUp" ? -1 : 1)];
            if (target) moveTag(tag.id, target.id, event.key === "ArrowUp" ? "before" : "after");
          }}
          title={t("Drag to reorder or use the arrow keys")}
          type="button"
        >
          <HiOutlineBars3 className="size-4" />
        </button>
        <div
          className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden"
          data-demo-id="tag-catalog-identity"
        >
          <div
            className={cn(
              "inline-flex min-w-0 max-w-full rounded-md px-2 py-0.5 text-sm font-medium",
              tagColorSurfaceClassName(tag.color),
            )}
            data-tag-color={tag.color ?? "none"}
            data-tag-color-surface
            style={customTagColorSurfaceStyle(tag.color)}
          >
            <HighlightedText
              className="truncate"
              queryTokens={[normalizeTagSearchValue(query)]}
              text={tag.label}
            />
          </div>
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
        </div>
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
        {overlay ? (
          <span className={buttonVariants({ size: "icon", variant: "ghost" })}>
            <HiOutlineSwatch />
          </span>
        ) : (
          <TagColorPicker
            onChange={(color) => store.saveTagDefinition({ ...tag, color })}
            value={tag.color}
            variant="icon"
          />
        )}
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
      </fieldset>
    );
  };
  return (
    <>
      <Dialog
        onOpenChange={(nextOpen) => {
          drag.cancel();
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
                onChange={(event) => setQuery(event.currentTarget.value)}
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
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
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
            className="pointer-events-none fixed z-[100] rounded-md bg-popover text-popover-foreground shadow-lg ring-1 ring-border"
            data-demo-id="tag-catalog-drag-preview"
            style={{
              left: drag.preview.x,
              top: drag.preview.y,
              width: drag.preview.width,
              height: drag.preview.height,
            }}
          >
            {visible
              .filter((tag) => tag.id === drag.preview?.id)
              .map((tag) => renderRow(tag, -1, true))}
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
            <DialogTitle>{t("Edit tag")}</DialogTitle>
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
                  {t("Save")}
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
      {editingEmployee && units && (
        <EmployeeDialog
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
        open={Boolean(deletingEmployee)}
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
