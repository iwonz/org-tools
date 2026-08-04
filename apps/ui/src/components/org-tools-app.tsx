"use client";

import { observer } from "mobx-react-lite";
import { useTheme } from "next-themes";
import { useRef, useState } from "react";
import {
  HiOutlineArrowUpTray,
  HiOutlineBuildingOffice2,
  HiOutlineCalendarDays,
  HiOutlineChartBar,
  HiOutlineDocumentArrowDown,
  HiOutlineFolder,
  HiOutlineShare,
  HiOutlineUsers,
} from "react-icons/hi2";

import { AnalyticsTab } from "@/components/analytics-tab";
import { CalendarTab } from "@/components/calendar-tab";
import { EmployeesTab } from "@/components/employees-tab";
import { ExportTab } from "@/components/export-tab";
import { ImportDialog } from "@/components/import-dialog";
import { LanguageToggle } from "@/components/language-toggle";
import { OrgStructureEditorTab } from "@/components/org-structure-editor-tab";
import { SaveDialog } from "@/components/save-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UnitsTab } from "@/components/units-tab";
import { describeError, type UiMessageDescriptor, uiMessage } from "@/i18n/messages";
import { useCountText, useMessageText, useUiText } from "@/i18n/use-ui-text";
import { OrgStoreProvider, useOrgStore } from "@/stores/org-store-context";

const LoadedApp = observer(() => {
  const store = useOrgStore();
  const t = useUiText();
  const countText = useCountText();
  const messageText = useMessageText();
  const { setTheme } = useTheme();
  const importFileInputRef = useRef<HTMLInputElement>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [saveState, setSaveState] = useState<ReturnType<typeof store.createOrgToolsState> | null>(
    null,
  );
  const [notice, setNotice] = useState<
    UiMessageDescriptor | { duplicateCount: number; kind: "import"; newCount: number } | null
  >(null);
  const [error, setError] = useState<UiMessageDescriptor | null>(null);

  const openSaveDialog = () => {
    setError(null);
    try {
      setSaveState(store.createOrgToolsState());
    } catch (saveError) {
      setNotice(null);
      setError(describeError(saveError));
    }
  };

  return (
    <>
      <main className="flex h-dvh w-dvw flex-col overflow-hidden bg-background text-foreground">
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b px-4">
          <div
            aria-label="Org Tools"
            className="shrink-0 text-lg font-extrabold tracking-tight text-foreground"
            data-demo-id="brand-wordmark"
            role="img"
          >
            Org Tools
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <input
              accept=".json,application/json"
              aria-hidden="true"
              className="sr-only"
              data-demo-id="import-file-input"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                event.currentTarget.value = "";
                if (file) setImportFile(file);
              }}
              ref={importFileInputRef}
              tabIndex={-1}
              type="file"
            />
            <Button
              onClick={() => {
                if (!importFileInputRef.current) return;
                importFileInputRef.current.value = "";
                importFileInputRef.current.click();
              }}
              type="button"
              variant="outline"
            >
              <HiOutlineArrowUpTray />
              {t("Import")}
            </Button>
            <Button data-demo-id="save-workspace" onClick={openSaveDialog} type="button">
              <HiOutlineDocumentArrowDown />
              {t("Workspace Export")}
            </Button>
          </div>
        </header>
        {error && (
          <div
            className="shrink-0 border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive"
            role="alert"
          >
            {messageText(error)}
          </div>
        )}
        {notice && (
          <div
            className="shrink-0 border-b bg-muted/50 px-4 py-2 text-sm text-muted-foreground"
            role="status"
          >
            {"kind" in notice && notice.kind === "import"
              ? countText("importSummary", {
                  duplicateCount: notice.duplicateCount,
                  newCount: notice.newCount,
                })
              : messageText(notice as UiMessageDescriptor)}
          </div>
        )}
        <Tabs
          className="min-h-0 flex-1"
          onValueChange={(value) => {
            if (
              value === "units" ||
              value === "employees" ||
              value === "orgEditor" ||
              value === "export" ||
              value === "analytics" ||
              value === "calendar"
            ) {
              store.setActiveTab(value);
            }
          }}
          value={store.activeTab}
        >
          <div className="flex h-14 shrink-0 items-center border-b bg-background px-4">
            <TabsList>
              <TabsTrigger data-demo-id="tab-units" value="units">
                <HiOutlineFolder />
                {t("Units")}
              </TabsTrigger>
              <TabsTrigger data-demo-id="tab-employees" value="employees">
                <HiOutlineUsers />
                {t("Employees")}
              </TabsTrigger>
              <TabsTrigger data-demo-id="tab-org-editor" value="orgEditor">
                <HiOutlineBuildingOffice2 />
                {t("Org Editor")}
              </TabsTrigger>
              <TabsTrigger data-demo-id="tab-analytics" value="analytics">
                <HiOutlineChartBar />
                {t("Analytics")}
              </TabsTrigger>
              <TabsTrigger data-demo-id="tab-calendar" value="calendar">
                <HiOutlineCalendarDays />
                {t("Calendar")}
              </TabsTrigger>
              <TabsTrigger data-demo-id="tab-export" value="export">
                <HiOutlineShare />
                {t("Data Download")}
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent
            className="flex min-h-0 flex-1"
            data-demo-id="units-tab-content"
            value="units"
          >
            <UnitsTab />
          </TabsContent>
          <TabsContent
            className="flex min-h-0 flex-1"
            data-demo-id="employees-tab-content"
            value="employees"
          >
            <EmployeesTab />
          </TabsContent>
          <TabsContent
            className="flex min-h-0 flex-1"
            data-demo-id="org-editor-tab-content"
            value="orgEditor"
          >
            <OrgStructureEditorTab />
          </TabsContent>
          <TabsContent
            className="flex min-h-0 flex-1"
            data-demo-id="analytics-tab-content"
            value="analytics"
          >
            <AnalyticsTab />
          </TabsContent>
          <TabsContent
            className="flex min-h-0 flex-1"
            data-demo-id="calendar-tab-content"
            value="calendar"
          >
            <CalendarTab />
          </TabsContent>
          <TabsContent
            className="flex min-h-0 flex-1"
            data-demo-id="export-tab-content"
            value="export"
          >
            <ExportTab />
          </TabsContent>
        </Tabs>
      </main>
      <ImportDialog
        existingEmployees={store.workspaceEmployees.map(({ email, id, username }) => ({
          email,
          id,
          username,
        }))}
        onCommitEmployees={(drafts, summary) => {
          const result = store.importEmployees(drafts);
          setError(null);
          setNotice({
            duplicateCount: summary.duplicateRowCount,
            kind: "import",
            newCount: result.newEmployeeCount,
          });
        }}
        onCommitMapped={(document) => {
          store.importMapped(document);
          setError(null);
          setNotice(uiMessage("Import merged into Main."));
        }}
        onCommitState={(candidate, content, operation) => {
          store.importState(
            candidate.state,
            content,
            operation,
            candidate.fileName,
            candidate.fileSizeBytes,
          );
          if (operation === "replace") setTheme(store.theme);
          setError(null);
          setNotice(operation === "append" ? uiMessage("Import merged into Main.") : null);
        }}
        initialFile={importFile}
        onOpenChange={(open) => {
          if (!open) setImportFile(null);
        }}
        onValidateMapped={(document) => {
          store.previewMappedImport(document);
        }}
        onValidateState={(candidate, content, operation) => {
          store.previewStateImport(candidate.state, content, operation);
        }}
        open={importFile !== null}
      />
      <SaveDialog
        onDownloaded={() => {
          setError(null);
          setNotice(uiMessage("File downloaded"));
        }}
        onOpenChange={(open) => {
          if (!open) setSaveState(null);
        }}
        open={saveState !== null}
        state={saveState}
      />
    </>
  );
});

export function OrgToolsApp() {
  return (
    <OrgStoreProvider>
      <LoadedApp />
    </OrgStoreProvider>
  );
}
