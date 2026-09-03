"use client";

import type { OrgEditorUnit } from "@org-tools/types";
import { lazy, Suspense, useEffect, useState } from "react";
import {
  HiOutlineCheck,
  HiOutlineDocumentText,
  HiOutlineEye,
  HiOutlinePencilSquare,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { describeError } from "@/i18n/messages";
import { useUiText } from "@/i18n/use-ui-text";
import { normalizeOrgEditorUnitNoteMarkdown } from "@/lib/org-editor";

const LazyUnitNotePreview = lazy(() =>
  import("@/components/unit-note-preview").then(({ UnitNotePreview }) => ({
    default: UnitNotePreview,
  })),
);

type NoteTab = "editor" | "preview";

export function UnitNoteDialog({
  onOpenChange,
  onSave,
  open,
  unit,
}: {
  onOpenChange: (open: boolean) => void;
  onSave: (unitId: OrgEditorUnit["id"], source: string) => void;
  open: boolean;
  unit: OrgEditorUnit;
}) {
  const t = useUiText();
  const [activeTab, setActiveTab] = useState<NoteTab>("preview");
  const [baseline, setBaseline] = useState(unit.noteMarkdown);
  const [draft, setDraft] = useState(unit.noteMarkdown);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = draft !== baseline;

  useEffect(() => {
    if (!open) return;
    setActiveTab("preview");
    setBaseline(unit.noteMarkdown);
    setDraft(unit.noteMarkdown);
    setDiscardOpen(false);
    setError(null);
  }, [open, unit.noteMarkdown]);

  const requestClose = () => {
    if (dirty) {
      setDiscardOpen(true);
      return;
    }
    onOpenChange(false);
  };

  const save = () => {
    setError(null);
    try {
      const normalized = normalizeOrgEditorUnitNoteMarkdown(draft);
      if (normalized === null) {
        throw new Error("Unit notes can contain at most 64 KiB.");
      }
      onSave(unit.id, normalized);
      setBaseline(normalized);
      setDraft(normalized);
      onOpenChange(false);
    } catch (cause) {
      const descriptor = describeError(cause);
      setError(t(descriptor.key, descriptor.values));
    }
  };

  return (
    <>
      <Dialog
        onOpenChange={(nextOpen) => (nextOpen ? onOpenChange(true) : requestClose())}
        open={open}
      >
        <DialogContent
          className="flex h-[min(720px,calc(100dvh-32px))] max-w-3xl flex-col"
          data-demo-id="unit-note-dialog"
        >
          <DialogHeader>
            <DialogTitle>{t("Note for {name}", { name: unit.name })}</DialogTitle>
          </DialogHeader>
          <DialogBody className="flex min-h-0 flex-1 flex-col py-0">
            <Tabs
              className="min-h-0 flex-1"
              onValueChange={(value) => setActiveTab(value as NoteTab)}
              value={activeTab}
            >
              <TabsList className="mb-3 w-fit shrink-0">
                <TabsTrigger data-demo-id="unit-note-preview-tab" value="preview">
                  <HiOutlineEye className="size-4" />
                  {t("Preview")}
                </TabsTrigger>
                <TabsTrigger data-demo-id="unit-note-editor-tab" value="editor">
                  <HiOutlinePencilSquare className="size-4" />
                  {t("Editor")}
                </TabsTrigger>
              </TabsList>
              <TabsContent className="h-full min-h-0 overflow-y-auto pb-4" value="preview">
                {draft.trim() ? (
                  <Suspense
                    fallback={
                      <div className="grid min-h-48 place-items-center text-muted-foreground">
                        <HiOutlineDocumentText className="size-6 animate-pulse" />
                      </div>
                    }
                  >
                    <LazyUnitNotePreview className="pb-6" source={draft} />
                  </Suspense>
                ) : (
                  <div
                    className="grid min-h-64 place-items-center text-center"
                    data-demo-id="unit-note-empty"
                  >
                    <div className="grid max-w-sm gap-2 text-muted-foreground">
                      <HiOutlineDocumentText className="mx-auto size-7" />
                      <p className="font-medium text-foreground">{t("No note yet.")}</p>
                      <p className="text-sm">{t("Write Markdown in the Editor tab.")}</p>
                    </div>
                  </div>
                )}
              </TabsContent>
              <TabsContent className="h-full min-h-0 pb-4" value="editor">
                <Textarea
                  aria-label={t("Markdown editor")}
                  className="h-full min-h-72 resize-none leading-6"
                  data-demo-id="unit-note-editor"
                  onChange={(event) => {
                    setDraft(event.target.value);
                    setError(null);
                  }}
                  placeholder={t("Describe responsibilities, decisions, or context with Markdown.")}
                  value={draft}
                />
              </TabsContent>
            </Tabs>
            {error && (
              <p aria-live="polite" className="pb-3 text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </DialogBody>
          <DialogFooter>
            <Button onClick={requestClose} type="button" variant="outline">
              {t("Cancel")}
            </Button>
            <Button disabled={!dirty} onClick={save} type="button">
              <HiOutlineCheck className="size-4" />
              {t("Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog onOpenChange={setDiscardOpen} open={discardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Discard note changes?")}</AlertDialogTitle>
            <AlertDialogDescription>{t("Discard note changes description")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setDiscardOpen(false);
                onOpenChange(false);
              }}
            >
              {t("Discard changes")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
