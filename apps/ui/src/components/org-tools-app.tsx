"use client";

import { observer } from "mobx-react-lite";
import { useTheme } from "next-themes";
import type { ComponentType, ReactNode } from "react";
import { useRef, useState } from "react";
import {
  HiOutlineBuildingOffice2,
  HiOutlineCalendarDays,
  HiOutlineChartBar,
  HiOutlineChevronLeft,
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
import { ProjectSwitcher } from "@/components/project-switcher";
import {
  ProjectWorkspaceController,
  useProjectWorkspace,
} from "@/components/project-workspace-controller";
import { SaveDialog } from "@/components/save-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UnitsTab } from "@/components/units-tab";
import { describeError, type UiMessageDescriptor, uiMessage } from "@/i18n/messages";
import { type UiTextKey, useCountText, useMessageText, useUiText } from "@/i18n/use-ui-text";
import { cn } from "@/lib/utils";
import { OrgStoreProvider, useOrgStore } from "@/stores/org-store-context";

type ProductTabValue = "analytics" | "calendar" | "employees" | "export" | "orgEditor" | "units";

const PRODUCT_NAVIGATION_ITEMS: Array<{
  icon: ComponentType<{ className?: string }>;
  label: UiTextKey;
  value: ProductTabValue;
}> = [
  { icon: HiOutlineFolder, label: "Units", value: "units" },
  { icon: HiOutlineUsers, label: "Employees", value: "employees" },
  { icon: HiOutlineBuildingOffice2, label: "Editor", value: "orgEditor" },
  { icon: HiOutlineChartBar, label: "Analytics", value: "analytics" },
  { icon: HiOutlineCalendarDays, label: "Calendar", value: "calendar" },
  { icon: HiOutlineShare, label: "Data Download", value: "export" },
];

const SIDEBAR_CONTROL_CLASS_NAME =
  "h-10 w-full justify-start gap-3 rounded-md bg-transparent px-3.5 text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground active:bg-sidebar-active focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-signal/70 focus-visible:ring-offset-0 data-[state=open]:bg-sidebar-active data-[state=open]:text-sidebar-foreground";

function SidebarTooltip({ children, collapsed }: { children: ReactNode; collapsed: boolean }) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute left-[calc(100%+0.625rem)] top-1/2 z-[70] block -translate-y-1/2 whitespace-nowrap rounded-md bg-foreground px-2.5 py-1.5 text-xs font-medium text-background opacity-0 shadow-[0_8px_20px_-16px_rgb(0_0_0/0.55)] transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 lg:hidden",
        collapsed && "lg:block",
      )}
      role="tooltip"
    >
      {children}
    </span>
  );
}

const LoadedApp = observer(() => {
  const store = useOrgStore();
  const t = useUiText();
  const countText = useCountText();
  const messageText = useMessageText();
  const projectWorkspace = useProjectWorkspace();
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  const activeNavigationItem =
    PRODUCT_NAVIGATION_ITEMS.find((item) => item.value === store.activeTab) ??
    ({
      icon: HiOutlineBuildingOffice2,
      label: "Editor",
      value: "orgEditor",
    } satisfies (typeof PRODUCT_NAVIGATION_ITEMS)[number]);
  const ActiveNavigationIcon = activeNavigationItem.icon;
  const sidebarLabelClassName = cn(
    "hidden min-w-0 overflow-hidden truncate whitespace-nowrap opacity-0 transition-[max-width,opacity] duration-200 ease-out motion-reduce:transition-none lg:inline-block",
    sidebarCollapsed ? "lg:max-w-0 lg:opacity-0" : "lg:max-w-[10rem] lg:opacity-100",
  );

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
        className="flex h-dvh w-dvw overflow-hidden bg-shell text-foreground"
        data-demo-id="app-shell"
      >
        <Tabs
          className="min-h-0 min-w-0 flex-1 flex-row"
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
          orientation="vertical"
          value={store.activeTab}
        >
          <aside
            className={cn(
              "relative z-30 flex h-full w-16 shrink-0 flex-col overflow-visible bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-out motion-reduce:transition-none lg:w-60",
              sidebarCollapsed && "lg:w-16",
            )}
            data-collapsed={sidebarCollapsed ? "true" : "false"}
            data-demo-id="app-sidebar"
          >
            <div
              className="relative flex h-0 shrink-0 items-center px-2 lg:h-16"
              data-demo-id="sidebar-header"
            >
              <Button
                aria-label={t(sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar")}
                className="z-40 hidden h-10 w-12 shrink-0 justify-start rounded-md bg-transparent px-3.5 text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground active:bg-sidebar-active active:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-signal/70 focus-visible:ring-offset-0 lg:inline-flex"
                data-demo-id="sidebar-toggle"
                onClick={() => setSidebarCollapsed((value) => !value)}
                title={t(sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar")}
                type="button"
                variant="ghost"
              >
                <HiOutlineChevronLeft
                  className={cn(
                    "!size-5 transition-transform duration-200 ease-out motion-reduce:transition-none",
                    sidebarCollapsed && "rotate-180",
                  )}
                />
              </Button>
            </div>
            <nav
              aria-label={t("Product navigation")}
              className="min-h-0 flex-1 px-2 py-3"
              data-demo-id="product-navigation"
            >
              <TabsList
                className="flex h-auto w-full flex-col items-stretch justify-start gap-1"
                data-demo-id="product-tabs-list"
              >
                {PRODUCT_NAVIGATION_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const label = t(item.label);

                  return (
                    <TabsTrigger
                      aria-label={label}
                      className="group relative h-10 w-full justify-start gap-3 rounded-md px-3.5 text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground active:bg-sidebar-active data-[state=active]:bg-sidebar-active data-[state=active]:text-sidebar-foreground data-[state=active]:hover:bg-sidebar-active"
                      data-demo-id={`tab-${item.value === "orgEditor" ? "org-editor" : item.value}`}
                      key={item.value}
                      title={label}
                      value={item.value}
                    >
                      <Icon className="size-5 shrink-0" />
                      <span className={sidebarLabelClassName} data-sidebar-label="">
                        {label}
                      </span>
                      <SidebarTooltip collapsed={sidebarCollapsed}>{label}</SidebarTooltip>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </nav>
            <div className="flex shrink-0 flex-col gap-1 p-2 pb-3" data-demo-id="sidebar-actions">
              <div className="group relative mb-1">
                <ProjectSwitcher
                  labelClassName={sidebarLabelClassName}
                  triggerClassName={SIDEBAR_CONTROL_CLASS_NAME}
                />
                <SidebarTooltip collapsed={sidebarCollapsed}>
                  {projectWorkspace.project.name}
                </SidebarTooltip>
              </div>
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
                className={cn("group relative", SIDEBAR_CONTROL_CLASS_NAME)}
                data-demo-id="import-action"
                onClick={() => {
                  if (!importFileInputRef.current) return;
                  importFileInputRef.current.value = "";
                  importFileInputRef.current.click();
                }}
                title={t("Import")}
                type="button"
                variant="ghost"
              >
                <HiOutlineDocumentArrowUp
                  className="!size-5 shrink-0"
                  data-demo-id="import-action-icon"
                  data-icon="document-arrow-up"
                />
                <span className={sidebarLabelClassName} data-sidebar-label="">
                  {t("Import")}
                </span>
                <SidebarTooltip collapsed={sidebarCollapsed}>{t("Import")}</SidebarTooltip>
              </Button>
              <Button
                aria-label={t("Workspace Export")}
                className={cn("group relative", SIDEBAR_CONTROL_CLASS_NAME)}
                data-demo-id="save-workspace"
                onClick={openSaveDialog}
                title={t("Workspace Export")}
                type="button"
                variant="ghost"
              >
                <HiOutlineDocumentArrowDown
                  className="!size-5 shrink-0"
                  data-demo-id="export-action-icon"
                  data-icon="document-arrow-down"
                />
                <span className={sidebarLabelClassName} data-sidebar-label="">
                  {t("Workspace Export")}
                </span>
                <SidebarTooltip collapsed={sidebarCollapsed}>
                  {t("Workspace Export")}
                </SidebarTooltip>
              </Button>
              <div className="group relative">
                <LanguageToggle
                  labelClassName={sidebarLabelClassName}
                  triggerClassName={SIDEBAR_CONTROL_CLASS_NAME}
                />
                <SidebarTooltip collapsed={sidebarCollapsed}>{t("Language")}</SidebarTooltip>
              </div>
              <div className="group relative">
                <ThemeToggle
                  labelClassName={sidebarLabelClassName}
                  triggerClassName={SIDEBAR_CONTROL_CLASS_NAME}
                />
                <SidebarTooltip collapsed={sidebarCollapsed}>{t("Theme")}</SidebarTooltip>
              </div>
            </div>
          </aside>
          <section className="flex min-w-0 flex-1 flex-col bg-background" data-demo-id="workspace">
            <header
              className="relative z-20 flex h-16 shrink-0 items-center gap-3 bg-background/96 px-5 backdrop-blur-sm"
              data-demo-id="app-header"
            >
              <ActiveNavigationIcon className="size-5 text-muted-foreground" />
              <h1 className="truncate text-base font-semibold" data-demo-id="app-title">
                {t(activeNavigationItem.label)}
              </h1>
              <div className="ml-auto flex shrink-0 items-center gap-2">
                <span
                  className={cn(
                    "w-24 text-right text-xs font-medium text-muted-foreground",
                    projectWorkspace.saveStatus === "failed" && "text-destructive",
                  )}
                  data-demo-id="project-save-status"
                  role="status"
                >
                  {projectWorkspace.saveStatus === "saving"
                    ? t("Saving…")
                    : projectWorkspace.saveStatus === "failed"
                      ? t("Save failed")
                      : projectWorkspace.dirty
                        ? t("Unsaved")
                        : t("Saved")}
                </span>
                <Button
                  className="h-9 min-w-20"
                  data-demo-id="project-save"
                  disabled={!projectWorkspace.dirty || projectWorkspace.saveStatus === "saving"}
                  onClick={() => void projectWorkspace.save()}
                  type="button"
                >
                  {t("Save")}
                </Button>
              </div>
            </header>
            {error && (
              <div
                className="shrink-0 bg-destructive/10 px-4 py-2.5 text-sm font-medium text-destructive"
                data-demo-id="app-error"
                role="alert"
              >
                {messageText(error)}
              </div>
            )}
            {notice && (
              <div
                className="shrink-0 bg-accent/45 px-4 py-2.5 text-sm text-foreground"
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
          </section>
        </Tabs>
      </main>
      {projectWorkspace.notice === "link-copied" && (
        <div
          className="fixed bottom-5 right-5 z-[80] rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background"
          data-demo-id="project-link-copied"
          role="status"
        >
          {t("Project link copied.")}
        </div>
      )}
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

function ProjectApp({ projectId }: { projectId: string }) {
  return (
    <ProjectWorkspaceController projectId={projectId}>
      <LoadedApp />
    </ProjectWorkspaceController>
  );
}

export function OrgToolsApp({ projectId }: { projectId: string }) {
  return (
    <OrgStoreProvider>
      <ProjectApp projectId={projectId} />
    </OrgStoreProvider>
  );
}
