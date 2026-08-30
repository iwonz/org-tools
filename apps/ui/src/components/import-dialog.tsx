"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  HiOutlineArrowUpTray,
  HiOutlineBuildingOffice2,
  HiOutlineExclamationTriangle,
  HiOutlineRectangleStack,
  HiOutlineUsers,
} from "react-icons/hi2";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { describeError, type UiMessageDescriptor } from "@/i18n/messages";
import { useAppFormatter, useCountText, useMessageText, useUiText } from "@/i18n/use-ui-text";
import { parseWorkspaceImportFile, type WorkspaceImportCandidate } from "@/lib/workspace-transfer";

const formatFileSize = (
  size: number,
  formatNumber: ReturnType<typeof useAppFormatter>["number"],
) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${formatNumber(Math.ceil(size / 1024))} KiB`;
  return `${formatNumber(size / 1024 / 1024, { maximumFractionDigits: 1 })} MiB`;
};

export function ImportDialog({
  initialFile,
  onCommit,
  onOpenChange,
  open,
}: {
  initialFile: File | null;
  onCommit: (candidate: WorkspaceImportCandidate) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const t = useUiText();
  const countText = useCountText();
  const format = useAppFormatter();
  const messageText = useMessageText();
  const loadedInitialFileRef = useRef<File | null>(null);
  const [candidate, setCandidate] = useState<WorkspaceImportCandidate | null>(null);
  const [error, setError] = useState<UiMessageDescriptor | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const readFile = useCallback(async (file: File | undefined) => {
    if (!file) return;
    setSelectedFile(file);
    setCandidate(null);
    setError(null);
    setIsReading(true);
    try {
      setCandidate(await parseWorkspaceImportFile(file));
    } catch (readError) {
      setError(describeError(readError, "Only a complete Org Tools workspace can be imported."));
    } finally {
      setIsReading(false);
    }
  }, []);

  useEffect(() => {
    if (!open || initialFile === null || loadedInitialFileRef.current === initialFile) return;
    loadedInitialFileRef.current = initialFile;
    void readFile(initialFile);
  }, [initialFile, open, readFile]);

  useEffect(() => {
    if (open) return;
    loadedInitialFileRef.current = null;
    setCandidate(null);
    setError(null);
    setIsReading(false);
    setSelectedFile(null);
  }, [open]);

  return (
    <Dialog onOpenChange={(nextOpen) => !isReading && onOpenChange(nextOpen)} open={open}>
      <DialogContent className="max-w-xl" data-demo-id="import-dialog">
        <DialogHeader>
          <DialogTitle>{t("Import workspace")}</DialogTitle>
          <DialogDescription>
            {t("Select a complete Org Tools workspace to replace the current working copy.")}
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="grid gap-4">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">
                {candidate?.fileName ?? selectedFile?.name ?? t("Choose a JSON file")}
              </div>
              {selectedFile && (
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {formatFileSize(candidate?.fileSizeBytes ?? selectedFile.size, format.number)}
                </div>
              )}
            </div>
            <label className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-md bg-secondary/70 px-3 text-sm font-medium transition-colors hover:bg-accent focus-within:ring-2 focus-within:ring-ring/45">
              <HiOutlineArrowUpTray className="size-4" />
              {t("Choose another file")}
              <input
                accept=".json,application/json"
                className="sr-only"
                disabled={isReading}
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  event.currentTarget.value = "";
                  void readFile(file);
                }}
                type="file"
              />
            </label>
          </div>

          {isReading && (
            <div className="text-sm text-muted-foreground" role="status">
              {t("Reading and inspecting the file…")}
            </div>
          )}

          {error && (
            <div
              className="flex gap-2 rounded-md bg-destructive/7 p-3 text-sm text-destructive"
              data-demo-id="workspace-import-error"
              role="alert"
            >
              <HiOutlineExclamationTriangle className="mt-0.5 size-4 shrink-0" />
              <span>{messageText(error)}</span>
            </div>
          )}

          {candidate && (
            <>
              <div className="grid grid-cols-3 gap-2" data-demo-id="workspace-import-summary">
                {[
                  {
                    icon: HiOutlineUsers,
                    text: countText("employees", { count: candidate.employeeCount }),
                  },
                  {
                    icon: HiOutlineBuildingOffice2,
                    text: countText("units", { count: candidate.unitCount }),
                  },
                  {
                    icon: HiOutlineRectangleStack,
                    text: countText("views", { count: candidate.viewCount }),
                  },
                ].map(({ icon: Icon, text }) => (
                  <div className="rounded-md bg-muted/45 px-3 py-3" key={text}>
                    <Icon className="mb-2 size-4 text-muted-foreground" />
                    <div className="text-sm font-medium">{text}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 rounded-md bg-destructive/7 p-3 text-sm text-destructive">
                <HiOutlineExclamationTriangle className="mt-0.5 size-4 shrink-0" />
                <span>
                  {t(
                    "Replacing imports all workspace data and interface state over the current working copy.",
                  )}
                </span>
              </div>
            </>
          )}
        </DialogBody>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
            {t("Cancel")}
          </Button>
          <Button
            disabled={!candidate || isReading}
            onClick={() => candidate && onCommit(candidate)}
            type="button"
            variant="destructive"
          >
            {t("Replace workspace")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
