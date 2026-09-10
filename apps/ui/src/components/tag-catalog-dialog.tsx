"use client";

import type { Employee, EmployeeTagDefinition, TagId } from "@org-tools/types";
import { observer } from "mobx-react-lite";
import { useMemo, useRef, useState } from "react";
import {
  HiOutlineBars3,
  HiOutlineEye,
  HiOutlineMagnifyingGlass,
  HiOutlinePencilSquare,
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
import { Button } from "@/components/ui/button";
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
  const dragSource = useRef<TagId | null>(null);
  const [dropTarget, setDropTarget] = useState<{ id: TagId; placement: "before" | "after" } | null>(
    null,
  );
  const [announcement, setAnnouncement] = useState("");
  const clearDrag = () => {
    dragSource.current = null;
    setDropTarget(null);
  };
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
  return (
    <>
      <Dialog
        onOpenChange={(nextOpen) => {
          clearDrag();
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
            <div className="min-h-0 overflow-y-auto">
              {visible.length === 0 ? (
                <div className="rounded-md bg-muted/35 p-4 text-sm text-muted-foreground">
                  {t("No tags found")}
                </div>
              ) : (
                <div className="grid gap-3">
                  {visible.map((tag, visibleIndex) => {
                    const count = counts.get(tag.id) ?? { dated: 0, employees: 0 };
                    return (
                      <fieldset
                        className="relative m-0 flex min-w-0 items-center gap-2 border-0 p-0"
                        data-demo-id="tag-catalog-row"
                        data-tag-id={tag.id}
                        aria-label={tag.label}
                        key={tag.id}
                        onDragOver={(event) => {
                          if (!dragSource.current) return;
                          event.preventDefault();
                          event.dataTransfer.dropEffect = "move";
                          const bounds = event.currentTarget.getBoundingClientRect();
                          const placement =
                            event.clientY < bounds.top + bounds.height / 2 ? "before" : "after";
                          setDropTarget({ id: tag.id, placement });
                        }}
                        onDrop={(event) => {
                          event.preventDefault();
                          if (dragSource.current) {
                            const bounds = event.currentTarget.getBoundingClientRect();
                            moveTag(
                              dragSource.current,
                              tag.id,
                              event.clientY < bounds.top + bounds.height / 2 ? "before" : "after",
                            );
                          }
                          clearDrag();
                        }}
                      >
                        {dropTarget?.id === tag.id && dragSource.current !== tag.id && (
                          <span
                            aria-hidden="true"
                            className={cn(
                              "pointer-events-none absolute inset-x-0 h-0.5 bg-signal",
                              dropTarget.placement === "before" ? "-top-1.5" : "-bottom-1.5",
                            )}
                          />
                        )}
                        <button
                          aria-label={t("Drag {name} to reorder", { name: tag.label })}
                          className="grid size-8 shrink-0 cursor-grab place-items-center rounded-md text-muted-foreground outline-none hover:bg-accent/55 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
                          data-demo-id="tag-catalog-drag-handle"
                          draggable
                          onDragStart={(event) => {
                            dragSource.current = tag.id;
                            event.dataTransfer.effectAllowed = "move";
                            event.dataTransfer.setData("text/plain", tag.id);
                          }}
                          onDragEnd={clearDrag}
                          onKeyDown={(event) => {
                            if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
                            event.preventDefault();
                            const target =
                              visible[visibleIndex + (event.key === "ArrowUp" ? -1 : 1)];
                            if (target)
                              moveTag(
                                tag.id,
                                target.id,
                                event.key === "ArrowUp" ? "before" : "after",
                              );
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
                          onClick={() => setViewingTagId(tag.id)}
                          size="icon"
                          title={t("View Employees with this Tag")}
                          type="button"
                          variant="ghost"
                        >
                          <HiOutlineEye />
                        </Button>
                        <TagColorPicker
                          onChange={(color) => store.saveTagDefinition({ ...tag, color })}
                          value={tag.color}
                          variant="icon"
                        />
                        <Button
                          aria-label={t("Edit tag")}
                          onClick={() => {
                            setEditing({ ...tag });
                            setEditError(null);
                          }}
                          size="icon"
                          title={t("Edit tag")}
                          type="button"
                          variant="ghost"
                        >
                          <HiOutlinePencilSquare />
                        </Button>
                        <Button
                          aria-label={t("Delete tag")}
                          onClick={() => setDeleteId(tag.id)}
                          size="icon"
                          title={t("Delete tag")}
                          type="button"
                          variant="ghost"
                        >
                          <HiOutlineTrash />
                        </Button>
                      </fieldset>
                    );
                  })}
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
          onSave={(fields, memberships) =>
            store.updateEmployee(editingEmployee.id, fields, memberships)
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
