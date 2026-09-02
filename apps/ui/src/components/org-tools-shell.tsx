"use client";

import type { OrgToolsState } from "@org-tools/types";
import { observer } from "mobx-react-lite";
import { useTheme } from "next-themes";
import type { ComponentType, ReactNode } from "react";
import { useCallback, useState } from "react";
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
import {
  type ContextHeaderAction,
  ContextHeaderActionContext,
} from "@/components/context-header-action";
import { EmployeesTab } from "@/components/employees-tab";
import { ExportTab } from "@/components/export-tab";
import { ImportDialog } from "@/components/import-dialog";
import { LanguageToggle } from "@/components/language-toggle";
import { useAppLocale } from "@/components/locale-provider";
import { OrgStructureEditorTab } from "@/components/org-structure-editor-tab";
import { useStateRuntime } from "@/components/state-runtime-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UnitsTab } from "@/components/units-tab";
import { describeError, type UiMessageDescriptor } from "@/i18n/messages";
import { type UiTextKey, useMessageText, useUiText } from "@/i18n/use-ui-text";
import { downloadState } from "@/lib/state-transfer";
import { cn } from "@/lib/utils";
import { useOrgStore } from "@/stores/org-store-context";

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

export const OrgToolsShell = observer(function OrgToolsShell() {
  const store = useOrgStore();
  const t = useUiText();
  const messageText = useMessageText();
  const runtime = useStateRuntime();
  const { setLocale } = useAppLocale();
  const { setTheme } = useTheme();
  const [importOpen, setImportOpen] = useState(false);
  const [importState, setImportState] = useState<OrgToolsState | null>(null);
  const [error, setError] = useState<UiMessageDescriptor | null>(null);
  const [contextHeaderAction, setContextHeaderAction] = useState<ContextHeaderAction | null>(null);
  const sidebarCollapsed = store.sidebarCollapsed;
  const registerContextHeaderAction = useCallback((action: ContextHeaderAction) => {
    setContextHeaderAction(action);

    return () => {
      setContextHeaderAction((currentAction) =>
        currentAction?.id === action.id ? null : currentAction,
      );
    };
  }, []);

  const activeNavigationItem =
    PRODUCT_NAVIGATION_ITEMS.find((item) => item.value === store.activeTab) ??
    ({
      icon: HiOutlineBuildingOffice2,
      label: "Editor",
      value: "orgEditor",
    } satisfies (typeof PRODUCT_NAVIGATION_ITEMS)[number]);
  const ActiveNavigationIcon = activeNavigationItem.icon;
  const ContextHeaderActionIcon = contextHeaderAction?.icon;
  const sidebarLabelClassName = cn(
    "hidden min-w-0 overflow-hidden truncate whitespace-nowrap opacity-0 transition-[max-width,opacity] duration-200 ease-out motion-reduce:transition-none lg:inline-block",
    sidebarCollapsed ? "lg:max-w-0 lg:opacity-0" : "lg:max-w-[10rem] lg:opacity-100",
  );

  return (
    <ContextHeaderActionContext.Provider value={registerContextHeaderAction}>
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
                onClick={() => store.setSidebarCollapsed(!sidebarCollapsed)}
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
              <Button
                aria-label={t("Import")}
                className={cn("group relative", SIDEBAR_CONTROL_CLASS_NAME)}
                data-demo-id="import-action"
                onClick={() => {
                  setImportState(store.createOrgToolsState());
                  setImportOpen(true);
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
                aria-label={t("Export")}
                className={cn("group relative", SIDEBAR_CONTROL_CLASS_NAME)}
                data-demo-id="export-state"
                onClick={() => {
                  try {
                    downloadState(store.createOrgToolsState());
                    setError(null);
                  } catch (exportError) {
                    setError(describeError(exportError));
                  }
                }}
                title={t("Export")}
                type="button"
                variant="ghost"
              >
                <HiOutlineDocumentArrowDown
                  className="!size-5 shrink-0"
                  data-demo-id="export-action-icon"
                  data-icon="document-arrow-down"
                />
                <span className={sidebarLabelClassName} data-sidebar-label="">
                  {t("Export")}
                </span>
                <SidebarTooltip collapsed={sidebarCollapsed}>{t("Export")}</SidebarTooltip>
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
          <section className="flex min-w-0 flex-1 flex-col bg-background" data-demo-id="content">
            <header
              className="relative z-20 flex h-16 shrink-0 items-center gap-3 bg-background/96 px-5 backdrop-blur-sm"
              data-demo-id="app-header"
            >
              <ActiveNavigationIcon className="size-5 text-muted-foreground" />
              <h1 className="truncate text-base font-semibold" data-demo-id="app-title">
                {t(activeNavigationItem.label)}
              </h1>
              <div
                className="ml-auto flex min-h-9 min-w-9 shrink-0 items-center justify-end"
                data-demo-id="context-header-action-slot"
              >
                {contextHeaderAction && ContextHeaderActionIcon && (
                  <div className="group relative flex">
                    <Button
                      aria-label={contextHeaderAction.label}
                      className="size-9 shrink-0 px-0 sm:h-9 sm:w-auto sm:px-3"
                      data-demo-id={contextHeaderAction.dataDemoId}
                      disabled={contextHeaderAction.disabled}
                      onClick={contextHeaderAction.onClick}
                      title={contextHeaderAction.label}
                      type="button"
                    >
                      {contextHeaderAction.iconPlacement !== "trailing" && (
                        <ContextHeaderActionIcon className="size-4" />
                      )}
                      <span className="hidden sm:inline">{contextHeaderAction.label}</span>
                      {contextHeaderAction.iconPlacement === "trailing" && (
                        <ContextHeaderActionIcon className="size-4" />
                      )}
                    </Button>
                    <span
                      className="pointer-events-none absolute right-0 top-11 z-30 hidden whitespace-nowrap rounded-md bg-foreground px-2.5 py-1.5 text-xs font-medium text-background group-focus-within:block group-hover:block sm:!hidden"
                      role="tooltip"
                    >
                      {contextHeaderAction.label}
                    </span>
                  </div>
                )}
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
      {runtime.error && (
        <div
          className="fixed bottom-5 right-5 z-[80] flex items-center gap-3 rounded-md border border-border/80 bg-popover px-3 py-2 text-sm text-popover-foreground"
          data-demo-id="state-write-error"
          role="alert"
        >
          <span>{t("Changes could not be written.")}</span>
          <Button onClick={runtime.retry} size="sm" type="button" variant="secondary">
            {t("Retry")}
          </Button>
        </div>
      )}
      {importState && (
        <ImportDialog
          currentState={importState}
          onCommit={(state, fileName, fileSizeBytes) => {
            store.loadOrgToolsState(state, fileName, fileSizeBytes);
            setTheme(state.ui.theme);
            setLocale(state.ui.locale);
            setError(null);
          }}
          onOpenChange={(open) => {
            setImportOpen(open);
            if (!open) setImportState(null);
          }}
          open={importOpen}
        />
      )}
    </ContextHeaderActionContext.Provider>
  );
});
