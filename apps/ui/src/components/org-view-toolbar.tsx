"use client";

import type { OrgToolsViewDocument, ViewId } from "@org-tools/types";
import { useEffect, useState } from "react";
import {
  HiOutlineDocumentDuplicate,
  HiOutlinePencilSquare,
  HiOutlinePlus,
  HiOutlineTrash,
} from "react-icons/hi2";

import { ActionIconButton } from "@/components/action-icon-button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { describeError, type UiMessageDescriptor } from "@/i18n/messages";
import { useMessageText, useUiText } from "@/i18n/use-ui-text";
import type { NewOrgViewSource } from "@/stores/org-views-store";

type ViewDialog = "create" | "delete" | "rename" | null;

const displayViewName = (view: Omit<OrgToolsViewDocument, "structure">, systemName: string) =>
  view.kind === "system" ? systemName : (view.name ?? "");

export function OrgViewToolbar({
  activeViewId,
  onCreate,
  onDelete,
  onRename,
  onSelect,
  views,
}: {
  activeViewId: ViewId;
  onCreate: (name: string, source: NewOrgViewSource) => void;
  onDelete: (viewId: ViewId) => void;
  onRename: (viewId: ViewId, name: string) => void;
  onSelect: (viewId: ViewId) => void;
  views: Array<Omit<OrgToolsViewDocument, "structure">>;
}) {
  const t = useUiText();
  const messageText = useMessageText();
  const activeView = views.find((view) => view.id === activeViewId) ?? views[0];
  const [dialog, setDialog] = useState<ViewDialog>(null);
  const [name, setName] = useState("");
  const [sourceMode, setSourceMode] = useState<"blank" | "copy">("blank");
  const [sourceViewId, setSourceViewId] = useState(activeViewId);
  const [error, setError] = useState<UiMessageDescriptor | null>(null);

  useEffect(() => {
    if (!views.some((view) => view.id === sourceViewId)) setSourceViewId(activeViewId);
  }, [activeViewId, sourceViewId, views]);

  const openDialog = (nextDialog: Exclude<ViewDialog, null>) => {
    setError(null);
    setName(
      nextDialog === "rename" && activeView?.kind === "custom" ? (activeView.name ?? "") : "",
    );
    setSourceMode("blank");
    setSourceViewId(activeViewId);
    setDialog(nextDialog);
  };

  const submit = () => {
    try {
      if (dialog === "create") {
        onCreate(
          name,
          sourceMode === "blank" ? { type: "blank" } : { type: "copy", viewId: sourceViewId },
        );
      } else if (dialog === "rename" && activeView?.kind === "custom") {
        onRename(activeView.id, name);
      } else if (dialog === "delete" && activeView?.kind === "custom") {
        onDelete(activeView.id);
      }
      setDialog(null);
    } catch (submitError) {
      setError(describeError(submitError));
    }
  };

  return (
    <>
      <div className="flex min-w-0 items-center gap-1" data-demo-id="org-editor-view-toolbar">
        <Select onValueChange={onSelect} value={activeViewId}>
          <SelectTrigger
            aria-label={t("Organization View")}
            className="h-9 w-20 border-0 bg-transparent px-2 shadow-none hover:bg-accent sm:w-44"
            data-demo-id="org-editor-view-select"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {views.map((view) => (
              <SelectItem key={view.id} value={view.id}>
                {displayViewName(view, t("Units"))}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ActionIconButton
          dataDemoId="org-editor-create-view"
          disabled={false}
          icon={<HiOutlinePlus />}
          label={t("Create View")}
          onClick={() => openDialog("create")}
          showTooltip={false}
        />
        <ActionIconButton
          dataDemoId="org-editor-rename-view"
          disabled={activeView?.kind !== "custom"}
          icon={<HiOutlinePencilSquare />}
          label={t("Rename View")}
          onClick={() => openDialog("rename")}
          showTooltip={false}
        />
        <ActionIconButton
          dataDemoId="org-editor-delete-view"
          disabled={activeView?.kind !== "custom"}
          icon={<HiOutlineTrash />}
          label={t("Delete View")}
          onClick={() => openDialog("delete")}
          showTooltip={false}
        />
      </div>

      <Dialog onOpenChange={(open) => !open && setDialog(null)} open={dialog !== null}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog === "create"
                ? t("Create View")
                : dialog === "rename"
                  ? t("Rename View")
                  : t("Delete View")}
            </DialogTitle>
          </DialogHeader>
          <DialogBody className="grid gap-4">
            {dialog === "delete" ? (
              <p className="text-sm text-muted-foreground">
                {t("Delete View confirmation", {
                  name: activeView ? displayViewName(activeView, t("Units")) : "",
                })}
              </p>
            ) : (
              <>
                <label className="grid gap-2 text-sm font-medium" htmlFor="org-editor-view-name">
                  {t("View name")}
                  <Input
                    autoFocus
                    id="org-editor-view-name"
                    maxLength={100}
                    onChange={(event) => setName(event.target.value)}
                    value={name}
                  />
                </label>
                {dialog === "create" && (
                  <>
                    <Select
                      onValueChange={(value) => setSourceMode(value as "blank" | "copy")}
                      value={sourceMode}
                    >
                      <SelectTrigger aria-label={t("View source")}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blank">{t("Empty View")}</SelectItem>
                        <SelectItem value="copy">
                          <span className="flex items-center gap-2">
                            <HiOutlineDocumentDuplicate className="size-4" />
                            {t("Copy View")}
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {sourceMode === "copy" && (
                      <Select onValueChange={setSourceViewId} value={sourceViewId}>
                        <SelectTrigger aria-label={t("Source View")}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {views.map((view) => (
                            <SelectItem key={view.id} value={view.id}>
                              {displayViewName(view, t("Units"))}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </>
                )}
              </>
            )}
            {error && <p className="text-sm text-destructive">{messageText(error)}</p>}
          </DialogBody>
          <DialogFooter>
            <Button onClick={() => setDialog(null)} type="button" variant="outline">
              {t("Cancel")}
            </Button>
            <Button
              onClick={submit}
              type="button"
              variant={dialog === "delete" ? "destructive" : "default"}
            >
              {dialog === "delete" ? (
                <HiOutlineTrash />
              ) : dialog === "rename" ? (
                <HiOutlinePencilSquare />
              ) : (
                <HiOutlinePlus />
              )}
              {dialog === "create" ? t("Create") : dialog === "rename" ? t("Rename") : t("Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
