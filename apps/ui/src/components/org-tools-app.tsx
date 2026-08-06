"use client";

import { observer } from "mobx-react-lite";
import { useTheme } from "next-themes";
import { useRef, useState } from "react";
import {
  HiOutlineBuildingOffice2,
  HiOutlineCalendarDays,
  HiOutlineChartBar,
  HiOutlineDocumentArrowDown,
  HiOutlineDocumentArrowUp,
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

const PRODUCT_TAB_CLASS_NAME =
  "h-9 border border-input bg-background/70 px-3 text-foreground hover:bg-accent hover:text-accent-foreground data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground";

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
      <main
        className="flex h-dvh w-dvw flex-col overflow-hidden bg-shell text-foreground"
        data-demo-id="app-shell"
      >
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
          <header
            className="flex h-14 shrink-0 items-center gap-2 bg-transparent px-2 sm:gap-3 sm:px-4"
            data-demo-id="app-header"
          >
            <nav
              aria-label={t("Product navigation")}
              className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              data-demo-id="product-navigation"
            >
              <TabsList
                className="h-9 w-max gap-1 rounded-none bg-transparent p-0 sm:gap-2"
                data-demo-id="product-tabs-list"
              >
                <TabsTrigger
                  className={PRODUCT_TAB_CLASS_NAME}
                  data-demo-id="tab-units"
                  value="units"
                >
                  <HiOutlineFolder />
                  {t("Units")}
                </TabsTrigger>
                <TabsTrigger
                  className={PRODUCT_TAB_CLASS_NAME}
                  data-demo-id="tab-employees"
                  value="employees"
                >
                  <HiOutlineUsers />
                  {t("Employees")}
                </TabsTrigger>
                <TabsTrigger
                  className={PRODUCT_TAB_CLASS_NAME}
                  data-demo-id="tab-org-editor"
                  value="orgEditor"
                >
                  <HiOutlineBuildingOffice2 />
                  {t("Editor")}
                </TabsTrigger>
                <TabsTrigger
                  className={PRODUCT_TAB_CLASS_NAME}
                  data-demo-id="tab-analytics"
                  value="analytics"
                >
                  <HiOutlineChartBar />
                  {t("Analytics")}
                </TabsTrigger>
                <TabsTrigger
                  className={PRODUCT_TAB_CLASS_NAME}
                  data-demo-id="tab-calendar"
                  value="calendar"
                >
                  <HiOutlineCalendarDays />
                  {t("Calendar")}
                </TabsTrigger>
                <TabsTrigger
                  className={PRODUCT_TAB_CLASS_NAME}
                  data-demo-id="tab-export"
                  value="export"
                >
                  <HiOutlineShare />
                  {t("Data Download")}
                </TabsTrigger>
              </TabsList>
            </nav>
            <div
              className="flex shrink-0 items-center gap-1 sm:gap-2"
              data-demo-id="header-actions"
            >
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
                aria-label={t("Import")}
                className="size-9 px-0 lg:w-auto lg:px-4"
                data-demo-id="import-action"
                onClick={() => {
                  if (!importFileInputRef.current) return;
                  importFileInputRef.current.value = "";
                  importFileInputRef.current.click();
                }}
                title={t("Import")}
                type="button"
                variant="outline"
              >
                <HiOutlineDocumentArrowUp
                  data-demo-id="import-action-icon"
                  data-icon="document-arrow-up"
                />
                <span className="hidden lg:inline">{t("Import")}</span>
              </Button>
              <Button
                aria-label={t("Workspace Export")}
                className="size-9 px-0 lg:w-auto lg:px-4"
                data-demo-id="save-workspace"
                onClick={openSaveDialog}
                title={t("Workspace Export")}
                type="button"
              >
                <HiOutlineDocumentArrowDown
                  data-demo-id="export-action-icon"
                  data-icon="document-arrow-down"
                />
                <span className="hidden lg:inline">{t("Workspace Export")}</span>
              </Button>
            </div>
          </header>
          {error && (
            <div
              className="shrink-0 bg-destructive/10 px-4 py-2 text-sm text-destructive"
              data-demo-id="app-error"
              role="alert"
            >
              {messageText(error)}
            </div>
          )}
          {notice && (
            <div
              className="shrink-0 bg-muted/50 px-4 py-2 text-sm text-muted-foreground"
              data-demo-id="app-notice"
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
