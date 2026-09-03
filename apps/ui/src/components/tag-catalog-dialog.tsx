"use client";

import type { EmployeeTagColor, EmployeeTagDefinition, TagId } from "@org-tools/types";
import { useMemo, useState } from "react";
import {
  HiOutlineMagnifyingGlass,
  HiOutlinePencilSquare,
  HiOutlineTag,
  HiOutlineTrash,
} from "react-icons/hi2";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { describeError, type UiMessageDescriptor } from "@/i18n/messages";
import { useCountText, useMessageText, useUiText } from "@/i18n/use-ui-text";
import { normalizeSearchValue } from "@/lib/search-index";
import { tagColorClassName } from "@/lib/tag-color";
import { cn } from "@/lib/utils";
import { useOrgStore } from "@/stores/org-store-context";

export const TAG_COLORS: Array<EmployeeTagColor | null> = [
  null,
  "red",
  "orange",
  "amber",
  "green",
  "teal",
  "cyan",
  "blue",
  "rose",
];
export function TagCatalogDialog({
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
  const [error, setError] = useState<UiMessageDescriptor | null>(null);
  const visible = useMemo(() => {
    const normalized = normalizeSearchValue(query);
    return [...store.tagDefinitions]
      .filter((tag) => !normalized || normalizeSearchValue(tag.label).includes(normalized))
      .sort((first, second) => first.label.localeCompare(second.label));
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
  return (
    <>
      <Dialog onOpenChange={onOpenChange} open={open}>
        <DialogContent
          className="flex max-h-[86dvh] max-w-2xl flex-col"
          data-demo-id="tag-catalog-dialog"
        >
          <DialogHeader>
            <DialogTitle>{t("Tags")}</DialogTitle>
          </DialogHeader>
          <DialogBody className="grid min-h-0 flex-1 gap-3 overflow-hidden">
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
            {error && (
              <div className="text-sm text-destructive" role="alert">
                {messageText(error)}
              </div>
            )}
            <div className="min-h-0 overflow-y-auto">
              {visible.length === 0 ? (
                <div className="rounded-md bg-muted/35 p-4 text-sm text-muted-foreground">
                  {t("No tags found")}
                </div>
              ) : (
                <div className="grid gap-1">
                  {visible.map((tag) => {
                    const count = counts.get(tag.id) ?? { dated: 0, employees: 0 };
                    return (
                      <div
                        className="flex items-center gap-3 rounded-md bg-muted/30 px-3 py-2"
                        key={tag.id}
                      >
                        <span
                          className={cn(
                            "size-2.5 shrink-0 rounded-full",
                            tagColorClassName(tag.color),
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{tag.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {countText("employees", { count: count.employees })} ·{" "}
                            {t("{count} dated", { count: count.dated })}
                          </div>
                        </div>
                        <Button
                          aria-label={t("Edit tag")}
                          onClick={() => {
                            setEditing({ ...tag });
                            setError(null);
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
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {editing && (
              <section
                className="grid gap-3 rounded-lg bg-muted/30 p-4"
                data-demo-id="tag-catalog-editor"
              >
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
                <div className="grid gap-2">
                  <Label>{t("Color")}</Label>
                  <Select
                    onValueChange={(color) =>
                      setEditing({
                        ...editing,
                        color: color === "none" ? null : (color as EmployeeTagColor),
                      })
                    }
                    value={editing.color ?? "none"}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TAG_COLORS.map((color) => (
                        <SelectItem key={color ?? "none"} value={color ?? "none"}>
                          <span className="flex items-center gap-2">
                            <span className={cn("size-2 rounded-full", tagColorClassName(color))} />
                            {color
                              ? t(
                                  color === "red"
                                    ? "Red"
                                    : color === "orange"
                                      ? "Orange"
                                      : color === "amber"
                                        ? "Amber"
                                        : color === "green"
                                          ? "Green"
                                          : color === "teal"
                                            ? "Teal"
                                            : color === "cyan"
                                              ? "Cyan"
                                              : color === "blue"
                                                ? "Blue"
                                                : "Rose",
                                )
                              : t("No color")}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button onClick={() => setEditing(null)} type="button" variant="ghost">
                    {t("Cancel")}
                  </Button>
                  <Button
                    onClick={() => {
                      try {
                        store.saveTagDefinition(editing);
                        setEditing(null);
                        setError(null);
                      } catch (saveError) {
                        setError(describeError(saveError));
                      }
                    }}
                    type="button"
                  >
                    <HiOutlineTag />
                    {t("Save")}
                  </Button>
                </div>
              </section>
            )}
          </DialogBody>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
              {t("Close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
}
