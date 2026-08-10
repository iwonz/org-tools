"use client";

import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";
import {
  HiOutlineArrowUturnLeft,
  HiOutlineArrowUturnRight,
  HiOutlineDocumentDuplicate,
  HiOutlinePencilSquare,
  HiOutlinePlus,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { describeError, type UiMessageDescriptor } from "@/i18n/messages";
import { useMessageText, useUiText } from "@/i18n/use-ui-text";
import { useOrgStore } from "@/stores/org-store-context";

type ViewDialogState = { mode: "create"; source: "blank" | "main" } | { mode: "rename" } | null;

const ORG_VIEW_ACTION_CLASS_NAME =
  "size-9 rounded-none border-0 bg-transparent shadow-none hover:bg-accent/60 focus-visible:ring-inset";

const getNextViewName = (names: readonly string[], formatName: (number: number) => string) => {
  const nameSet = new Set(names.map((name) => name.toLocaleLowerCase("en-US")));
  let index = 1;

  while (nameSet.has(formatName(index).toLocaleLowerCase("en-US"))) index += 1;
  return formatName(index);
};

export const OrgViewToolbar = observer(
  ({
    canRedo,
    canUndo,
    emptyCanvas = false,
    onRedo,
    onUndo,
  }: {
    canRedo: boolean;
    canUndo: boolean;
    emptyCanvas?: boolean;
    onRedo: () => void;
    onUndo: () => void;
  }) => {
    const store = useOrgStore();
    const t = useUiText();
    const activeView = store.activeOrgView;
    const views = store.orgViewList;
    const [dialogState, setDialogState] = useState<ViewDialogState>(null);
    const [name, setName] = useState("");
    const [error, setError] = useState<UiMessageDescriptor | null>(null);
    const messageText = useMessageText();
    const [deleteOpen, setDeleteOpen] = useState(false);
    const isMain = activeView?.kind === "main";
    const activeViewDisplayName = activeView
      ? activeView.kind === "main"
        ? t("Main")
        : activeView.name
      : "";
    const nextViewName = useMemo(
      () =>
        getNextViewName(
          views.map((view) => view.name),
          (number) => t("View {number}", { number }),
        ),
      [t, views],
    );

    const openCreate = () => {
      setName(nextViewName);
      setError(null);
      setDialogState({ mode: "create", source: "main" });
    };
    const openRename = () => {
      if (!activeView || isMain) return;
      setName(activeView.name);
      setError(null);
      setDialogState({ mode: "rename" });
    };
    const submit = () => {
      if (!dialogState || !activeView) return;

      try {
        if (dialogState.mode === "create") {
          store.createOrgView(name, dialogState.source);
        } else {
          store.renameOrgView(activeView.id, name);
        }
        setDialogState(null);
        setError(null);
      } catch (submitError) {
        setError(describeError(submitError));
      }
    };

    return (
      <>
        {(!emptyCanvas || views.length > 1) && (
          <div className="flex items-center gap-0" data-demo-id="org-view-toolbar">
            {(!emptyCanvas || views.length > 1) && (
              <Select onValueChange={store.selectOrgView} value={store.activeOrgViewId}>
                <SelectTrigger
                  aria-label={t("Active View")}
                  className="h-9 w-48 max-w-[calc(100vw-6rem)] overflow-hidden rounded-none border-0 bg-transparent shadow-none hover:bg-accent/60 focus-visible:ring-inset xl:w-64"
                  title={activeViewDisplayName}
                >
                  <span
                    className="min-w-0 flex-1 truncate text-left"
                    data-demo-id="org-view-active-value"
                  >
                    <SelectValue className="block truncate whitespace-nowrap" />
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {views.map((view) => (
                    <SelectItem key={view.id} value={view.id}>
                      {view.kind === "main" ? t("Main") : view.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {!emptyCanvas && (
              <>
                {canUndo && (
                  <Button
                    aria-label={t("Undo")}
                    className={ORG_VIEW_ACTION_CLASS_NAME}
                    data-demo-id="org-editor-undo-button"
                    onClick={onUndo}
                    size="icon"
                    title={t("Undo")}
                    variant="ghost"
                  >
                    <HiOutlineArrowUturnLeft />
                  </Button>
                )}
                {canRedo && (
                  <Button
                    aria-label={t("Redo")}
                    className={ORG_VIEW_ACTION_CLASS_NAME}
                    data-demo-id="org-editor-redo-button"
                    onClick={onRedo}
                    size="icon"
                    title={t("Redo")}
                    variant="ghost"
                  >
                    <HiOutlineArrowUturnRight />
                  </Button>
                )}
                <Button
                  className={ORG_VIEW_ACTION_CLASS_NAME}
                  data-demo-id="org-view-create-button"
                  onClick={openCreate}
                  size="icon"
                  title={t("Create View")}
                  variant="ghost"
                >
                  <HiOutlinePlus />
                </Button>
                {!isMain && (
                  <>
                    <Button
                      className={ORG_VIEW_ACTION_CLASS_NAME}
                      onClick={openRename}
                      size="icon"
                      title={t("Rename View")}
                      variant="ghost"
                    >
                      <HiOutlinePencilSquare />
                    </Button>
                    <Button
                      className={ORG_VIEW_ACTION_CLASS_NAME}
                      onClick={() => setDeleteOpen(true)}
                      size="icon"
                      title={t("Delete View")}
                      variant="ghost"
                    >
                      <HiOutlineTrash />
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        )}

        <Dialog
          onOpenChange={(open) => {
            if (!open) setDialogState(null);
          }}
          open={dialogState !== null}
        >
          <DialogContent data-demo-id="org-view-dialog">
            <DialogHeader>
              <DialogTitle>
                {dialogState?.mode === "rename" ? t("Rename View") : t("New View")}
              </DialogTitle>
            </DialogHeader>
            <DialogBody className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="org-view-name">{t("Name")}</Label>
                <Input
                  id="org-view-name"
                  onChange={(event) => setName(event.target.value)}
                  value={name}
                />
              </div>
              {dialogState?.mode === "create" && (
                <div className="grid gap-2">
                  <Label>{t("View base")}</Label>
                  <Tabs
                    onValueChange={(value) =>
                      setDialogState({
                        mode: "create",
                        source: value === "blank" ? "blank" : "main",
                      })
                    }
                    value={dialogState.source}
                  >
                    <TabsList
                      aria-label={t("New View base")}
                      className="grid w-full grid-cols-2"
                      data-demo-id="org-view-source-switcher"
                    >
                      <TabsTrigger className="w-full" value="main">
                        <HiOutlineDocumentDuplicate />
                        {t("Copy of Main")}
                      </TabsTrigger>
                      <TabsTrigger className="w-full" value="blank">
                        <HiOutlinePlus />
                        {t("Blank")}
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              )}
              {error && <p className="text-sm text-destructive">{messageText(error)}</p>}
            </DialogBody>
            <DialogFooter>
              <Button onClick={() => setDialogState(null)} type="button" variant="outline">
                {t("Cancel")}
              </Button>
              <Button disabled={!name.trim()} onClick={submit} type="button">
                {dialogState?.mode === "rename" ? t("Save") : t("Create")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog onOpenChange={setDeleteOpen} open={deleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("Delete View?")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t(
                  "View “{name}” and all of its local changes will be deleted. Main will not change.",
                  {
                    name: activeView?.name ?? "",
                  },
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (activeView) store.deleteOrgView(activeView.id);
                }}
              >
                {t("Delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  },
);
