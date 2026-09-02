"use client";

import type { OrgToolsState } from "@org-tools/types";
import { useState } from "react";
import { HiOutlineArrowDownTray, HiOutlineCircleStack, HiOutlineUsers } from "react-icons/hi2";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { describeError, type UiMessageDescriptor } from "@/i18n/messages";
import { useCountText, useMessageText, useUiText } from "@/i18n/use-ui-text";
import { createEmployeeExport, EMPLOYEE_EXPORT_FILE_NAME } from "@/lib/employee-transfer";
import { downloadJson } from "@/lib/org-file";
import { downloadState } from "@/lib/state-transfer";

type ExportMode = "employees" | "state";

export function StateExportDialog({
  onOpenChange,
  open,
  state,
}: {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  state: OrgToolsState;
}) {
  const t = useUiText();
  const countText = useCountText();
  const messageText = useMessageText();
  const [mode, setMode] = useState<ExportMode>("state");
  const [error, setError] = useState<UiMessageDescriptor | null>(null);
  const download = () => {
    setError(null);
    try {
      if (mode === "state") downloadState(state);
      else downloadJson(createEmployeeExport(state), EMPLOYEE_EXPORT_FILE_NAME);
      onOpenChange(false);
    } catch (downloadError) {
      setError(describeError(downloadError));
    }
  };
  return (
    <Dialog
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setMode("state");
          setError(null);
        }
        onOpenChange(nextOpen);
      }}
      open={open}
    >
      <DialogContent className="max-w-xl" data-demo-id="state-export-dialog">
        <DialogHeader>
          <DialogTitle>{t("Export")}</DialogTitle>
          <DialogDescription>{t("Choose which local data to download as JSON.")}</DialogDescription>
        </DialogHeader>
        <Tabs onValueChange={(value) => setMode(value as ExportMode)} value={mode}>
          <TabsList className="grid w-full grid-cols-2" data-demo-id="export-mode-tabs">
            <TabsTrigger value="state">
              <HiOutlineCircleStack />
              {t("All state")}
            </TabsTrigger>
            <TabsTrigger value="employees">
              <HiOutlineUsers />
              {t("Employees")}
            </TabsTrigger>
          </TabsList>
          <DialogBody className="px-0">
            <TabsContent className="rounded-md bg-muted/35 p-4" value="state">
              <p className="text-sm font-medium">
                {t("Complete organization and interface state")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">org-tools-state.json</p>
            </TabsContent>
            <TabsContent className="rounded-md bg-muted/35 p-4" value="employees">
              <p className="text-sm font-medium">
                {countText("employees", { count: state.organization.employees.length })}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("Flat Employees with nested Team assignments")}
              </p>
            </TabsContent>
            {error && (
              <p className="mt-4 text-sm text-destructive" role="alert">
                {messageText(error)}
              </p>
            )}
          </DialogBody>
        </Tabs>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
            {t("Cancel")}
          </Button>
          <Button onClick={download} type="button">
            <HiOutlineArrowDownTray />
            {t("Download")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
