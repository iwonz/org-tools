"use client";

import { useRef, useState } from "react";
import {
  HiOutlineDocumentPlus,
  HiOutlineDocumentText,
  HiOutlineFolderOpen,
  HiOutlinePencilSquare,
} from "react-icons/hi2";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useBrowserWorkspace } from "@/components/workspace-persistence-context";
import { useUiText } from "@/i18n/use-ui-text";
import { cn } from "@/lib/utils";

export function BrowserFileSwitcher({
  labelClassName,
  triggerClassName,
}: {
  labelClassName: string;
  triggerClassName: string;
}) {
  const t = useUiText();
  const workspace = useBrowserWorkspace();
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openWorkspace = () => {
    setOpen(false);
    if (workspace.fileAccessSupported) {
      void workspace.openWorkspace();
      return;
    }
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        accept=".json,application/json"
        aria-hidden="true"
        className="sr-only"
        data-demo-id="browser-workspace-file-input"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          if (file) void workspace.openFallbackFile(file);
        }}
        ref={fileInputRef}
        tabIndex={-1}
        type="file"
      />
      <Popover onOpenChange={setOpen} open={open}>
        <PopoverTrigger asChild>
          <Button
            aria-label={t("Workspace file")}
            className={cn("group relative", triggerClassName)}
            data-demo-id="browser-file-switcher"
            title={t("Workspace file")}
            type="button"
            variant="ghost"
          >
            <HiOutlineDocumentText className="!size-5 shrink-0" />
            <span className={labelClassName} data-sidebar-label="">
              {workspace.displayName}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-[19rem] overflow-hidden bg-popover p-0"
          data-demo-id="browser-file-popover"
          side="right"
          sideOffset={10}
        >
          <div className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {t("Workspace file")}
          </div>
          <p className="truncate px-3 pb-3 text-sm font-semibold" title={workspace.displayName}>
            {workspace.displayName}
          </p>
          <div className="grid gap-1 px-2 pb-2">
            <Button
              className="h-9 justify-start gap-2.5 px-2.5"
              data-demo-id="browser-workspace-new"
              onClick={() => {
                setOpen(false);
                workspace.newWorkspace();
              }}
              type="button"
              variant="ghost"
            >
              <HiOutlineDocumentPlus className="size-4" />
              {t("New workspace")}
            </Button>
            <Button
              className="h-9 justify-start gap-2.5 px-2.5"
              data-demo-id="browser-workspace-open"
              onClick={openWorkspace}
              type="button"
              variant="ghost"
            >
              <HiOutlineFolderOpen className="size-4" />
              {t("Open workspace")}
            </Button>
            <Button
              className="h-9 justify-start gap-2.5 px-2.5"
              data-demo-id="browser-workspace-save-as"
              onClick={() => {
                setOpen(false);
                void workspace.saveAs();
              }}
              type="button"
              variant="ghost"
            >
              <HiOutlinePencilSquare className="size-4" />
              {t("Save As")}
            </Button>
          </div>
          <label
            className={cn(
              "flex items-center gap-2.5 bg-muted/45 px-3 pb-2 pt-3 text-sm font-medium",
              workspace.autosaveSupported ? "cursor-pointer" : "cursor-not-allowed opacity-60",
            )}
            htmlFor="browser-workspace-autosave"
          >
            <Checkbox
              checked={workspace.autosaveEnabled}
              data-demo-id="autosave-checkbox"
              disabled={!workspace.autosaveSupported}
              id="browser-workspace-autosave"
              onCheckedChange={(checked) => void workspace.setAutosaveEnabled(checked === true)}
            />
            <span>{t("Autosave")}</span>
          </label>
          {!workspace.autosaveSupported && (
            <p className="bg-muted/45 px-3 pb-3 text-xs leading-5 text-muted-foreground">
              {t("Autosave requires File System Access.")}
            </p>
          )}
        </PopoverContent>
      </Popover>
    </>
  );
}
