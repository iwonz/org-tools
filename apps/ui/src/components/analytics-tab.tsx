"use client";

import type {
  AnalyticsDashboard,
  AnalyticsFilterValue,
  AnalyticsPanel,
  AnalyticsPanelTab,
  AnalyticsWidget,
  EmployeeId,
  OrgToolsAnalyticsUiState,
} from "@org-tools/types";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  HiOutlineArrowDownTray,
  HiOutlineChartBar,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineDocumentDuplicate,
  HiOutlinePencilSquare,
  HiOutlinePlus,
  HiOutlineTrash,
} from "react-icons/hi2";

import { AnalyticsImageExportDialog } from "@/components/analytics-image-export-dialog";
import { AnalyticsWidgetCard } from "@/components/analytics-widget-card";
import { AnalyticsWidgetEditorDialog } from "@/components/analytics-widget-editor-dialog";
import { EmployeeCardList } from "@/components/employee-card-list";
import { TopLevelEmptyState } from "@/components/source-empty-state";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProductSurface } from "@/components/ui/product-surface";
import { useUiText } from "@/i18n/use-ui-text";
import {
  cloneAnalyticsDashboard,
  createAnalyticsDashboard,
  createAnalyticsPanel,
  createAnalyticsPanelTab,
  createAnalyticsWidget,
  moveAnalyticsItem,
} from "@/lib/analytics-dashboard";
import type { AnalyticsAppliedFilter } from "@/lib/analytics-query";
import { ANALYTICS_LIMITS } from "@/lib/analytics-state";
import { AnalyticsWorkerClient } from "@/lib/analytics-worker-client";
import { cn } from "@/lib/utils";
import { useOrgStore } from "@/stores/org-store-context";

type ExportTarget = { fileName: string; node: HTMLElement } | null;
type DragItem = { id: string; kind: "dashboard" | "panel" | "tab" | "widget" };

const reorderById = <T extends { id: string }>(
  items: readonly T[],
  sourceId: string,
  targetId: string,
) => {
  const sourceIndex = items.findIndex((item) => item.id === sourceId);
  const targetIndex = items.findIndex((item) => item.id === targetId);
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return [...items];
  const next = [...items];
  const [item] = next.splice(sourceIndex, 1);
  if (item) next.splice(targetIndex, 0, item);
  return next;
};

const sanitizeName = (value: string) =>
  value.trim().replace(/[^\p{L}\p{N}._ -]+/gu, "-") || "analytics";

function ReorderButtons({
  index,
  length,
  onMove,
}: {
  index: number;
  length: number;
  onMove: (offset: -1 | 1) => void;
}) {
  const t = useUiText();
  return (
    <>
      <Button
        aria-label={t("Move up")}
        disabled={index === 0}
        onClick={() => onMove(-1)}
        size="icon"
        title={t("Move up")}
        type="button"
        variant="ghost"
      >
        <HiOutlineChevronUp />
      </Button>
      <Button
        aria-label={t("Move down")}
        disabled={index === length - 1}
        onClick={() => onMove(1)}
        size="icon"
        title={t("Move down")}
        type="button"
        variant="ghost"
      >
        <HiOutlineChevronDown />
      </Button>
    </>
  );
}

function AnalyticsDrilldown({
  employeeIds,
  onOpenChange,
  open,
}: {
  employeeIds: EmployeeId[];
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const store = useOrgStore();
  const t = useUiText();
  const [query, setQuery] = useState(store.analyticsUi.drilldown.query);
  const employees = useMemo(() => {
    const ids = new Set(employeeIds);
    return store.organizationEmployees
      .map((employee) => store.uiOrgStructure?.indexes.employeesById.get(employee.id))
      .filter((employee): employee is NonNullable<typeof employee> =>
        Boolean(employee && ids.has(employee.id)),
      )
      .filter((employee) =>
        employee.fullName.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
      );
  }, [employeeIds, query, store.organizationEmployees, store.uiOrgStructure]);
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent
        className="flex h-[min(760px,calc(100vh-2rem))] max-w-3xl flex-col"
        data-demo-id="analytics-drilldown-dialog"
      >
        <DialogHeader>
          <DialogTitle>{t("Employees")}</DialogTitle>
        </DialogHeader>
        <DialogBody className="flex min-h-0 flex-1 flex-col gap-3">
          <Input
            onChange={(event) => {
              setQuery(event.target.value);
              store.setAnalyticsDrilldown({ query: event.target.value });
            }}
            placeholder={t("Search")}
            value={query}
          />
          <EmployeeCardList
            className="min-h-0 flex-1"
            dataDemoId="analytics-drilldown-list"
            employees={employees}
            emptyState={t("No data")}
          />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

function DashboardSelector({
  activeId,
  dashboards,
  editing,
  onChange,
  onReorder,
}: {
  activeId: string | null;
  dashboards: AnalyticsDashboard[];
  editing: boolean;
  onChange: (id: string) => void;
  onReorder: (sourceId: string, targetId: string) => void;
}) {
  const dragRef = useRef<DragItem | null>(null);
  return (
    <div className="flex min-w-0 gap-1 overflow-x-auto" role="tablist">
      {dashboards.map((dashboard) => (
        <button
          aria-selected={dashboard.id === activeId}
          className={cn(
            "shrink-0 rounded-md px-3 py-2 text-sm outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring",
            dashboard.id === activeId && "bg-accent font-medium text-accent-foreground",
          )}
          draggable={editing}
          key={dashboard.id}
          onClick={() => onChange(dashboard.id)}
          onDragOver={(event) => {
            if (editing) event.preventDefault();
          }}
          onDragStart={() => {
            dragRef.current = { id: dashboard.id, kind: "dashboard" };
          }}
          onDrop={() => {
            const source = dragRef.current;
            if (source?.kind === "dashboard") onReorder(source.id, dashboard.id);
            dragRef.current = null;
          }}
          role="tab"
          type="button"
        >
          {dashboard.name}
        </button>
      ))}
    </div>
  );
}

export const AnalyticsTab = observer(() => {
  const store = useOrgStore();
  const t = useUiText();
  const clientRef = useRef<AnalyticsWorkerClient | null>(null);
  if (!clientRef.current) clientRef.current = new AnalyticsWorkerClient();
  const client = clientRef.current;
  const [editing, setEditing] = useState(false);
  const [drafts, setDrafts] = useState<AnalyticsDashboard[]>([]);
  const [draftDashboardId, setDraftDashboardId] = useState<string | null>(null);
  const [draftTabs, setDraftTabs] = useState<Record<string, string>>({});
  const [draftFilterValues, setDraftFilterValues] = useState<Record<string, AnalyticsFilterValue>>(
    {},
  );
  const [widgetEditor, setWidgetEditor] = useState<{
    panelId: string;
    tabId: string;
    widget: AnalyticsWidget;
  } | null>(null);
  const [exportTarget, setExportTarget] = useState<ExportTarget>(null);
  const [drilldownOpen, setDrilldownOpen] = useState(false);
  const [dragItem, setDragItem] = useState<DragItem | null>(null);
  const [reorderAnnouncement, setReorderAnnouncement] = useState("");
  const elementByKey = useRef(new Map<string, HTMLElement>());

  useEffect(() => () => client.dispose(), [client]);

  const dashboards = editing ? drafts : store.analyticsDashboards;
  const activeDashboardId = editing ? draftDashboardId : store.analyticsUi.activeDashboardId;
  const activeDashboard =
    dashboards.find((dashboard) => dashboard.id === activeDashboardId) ?? dashboards[0] ?? null;
  const allWidgets =
    activeDashboard?.panels.flatMap((panel) => panel.tabs.flatMap((tab) => tab.widgets)) ?? [];
  const activeTabId = (panel: AnalyticsPanel) =>
    (editing ? draftTabs[panel.id] : store.analyticsUi.activeTabIdsByPanelId[panel.id]) ??
    panel.tabs[0]?.id ??
    null;
  const activeFilterWidgets =
    activeDashboard?.panels.flatMap((panel) => {
      const tab = panel.tabs.find((candidate) => candidate.id === activeTabId(panel));
      return (
        tab?.widgets.filter(
          (widget): widget is Extract<AnalyticsWidget, { type: "filter" }> =>
            widget.type === "filter",
        ) ?? []
      );
    }) ?? [];
  const filtersFor = (widget: AnalyticsWidget): AnalyticsAppliedFilter[] =>
    activeFilterWidgets.flatMap((filterWidget) => {
      if (filterWidget.id === widget.id) return [];
      if (
        filterWidget.targetWidgetIds !== null &&
        !filterWidget.targetWidgetIds.includes(widget.id)
      )
        return [];
      if (
        filterWidget.field.startsWith("assignment.") &&
        (filterWidget.viewId !== widget.viewId || widget.dataset.kind !== "assignments")
      )
        return [];
      const filterValues = editing ? draftFilterValues : store.analyticsUi.filterValuesByWidgetId;
      return [
        {
          field: filterWidget.field,
          value: filterValues[filterWidget.id] ?? filterWidget.defaultValue,
        },
      ];
    });

  const beginEdit = (createWhenEmpty = false) => {
    const next = structuredClone([...store.analyticsDashboards]);
    if (createWhenEmpty && next.length === 0)
      next.push(createAnalyticsDashboard(t("Analytics dashboard")));
    setDrafts(next);
    setDraftDashboardId(
      next.find((dashboard) => dashboard.id === store.analyticsUi.activeDashboardId)?.id ??
        next[0]?.id ??
        null,
    );
    setDraftTabs(structuredClone(store.analyticsUi.activeTabIdsByPanelId));
    setDraftFilterValues(structuredClone(store.analyticsUi.filterValuesByWidgetId));
    setEditing(true);
  };
  const cancelEdit = () => {
    setEditing(false);
    setDrafts([]);
    setDraftFilterValues({});
    setWidgetEditor(null);
  };
  const canSave = drafts.every(
    (dashboard) =>
      dashboard.name.trim().length > 0 &&
      dashboard.panels.length <= ANALYTICS_LIMITS.panels &&
      dashboard.panels.every(
        (panel) =>
          panel.name.trim().length > 0 &&
          panel.tabs.length > 0 &&
          panel.tabs.length <= ANALYTICS_LIMITS.tabs &&
          panel.tabs.every(
            (tab) => tab.name.trim().length > 0 && tab.widgets.length <= ANALYTICS_LIMITS.widgets,
          ),
      ),
  );
  const saveEdit = () => {
    if (!canSave) return;
    const nextUi: OrgToolsAnalyticsUiState = {
      ...structuredClone(store.analyticsUi),
      activeDashboardId: draftDashboardId,
      activeTabIdsByPanelId: structuredClone(draftTabs),
      filterValuesByWidgetId: structuredClone(draftFilterValues),
    };
    store.replaceAnalyticsDashboards(
      drafts.map((dashboard) => ({ ...dashboard, updatedAt: new Date().toISOString() })),
      nextUi,
    );
    setEditing(false);
  };
  const updateDashboard = (
    id: string,
    updater: (dashboard: AnalyticsDashboard) => AnalyticsDashboard,
  ) =>
    setDrafts((current) =>
      current.map((dashboard) => (dashboard.id === id ? updater(dashboard) : dashboard)),
    );
  const updatePanel = (panelId: string, updater: (panel: AnalyticsPanel) => AnalyticsPanel) => {
    if (!activeDashboard) return;
    updateDashboard(activeDashboard.id, (dashboard) => ({
      ...dashboard,
      panels: dashboard.panels.map((panel) => (panel.id === panelId ? updater(panel) : panel)),
    }));
  };
  const updateTab = (
    panelId: string,
    tabId: string,
    updater: (tab: AnalyticsPanelTab) => AnalyticsPanelTab,
  ) =>
    updatePanel(panelId, (panel) => ({
      ...panel,
      tabs: panel.tabs.map((tab) => (tab.id === tabId ? updater(tab) : tab)),
    }));
  const openDrilldown = (employeeIds: EmployeeId[], widgetId: string) => {
    store.setAnalyticsDrilldown({ employeeIds, sourceWidgetId: widgetId });
    setDrilldownOpen(true);
  };
  const registerElement = (key: string) => (node: HTMLDivElement | null) => {
    if (node) elementByKey.current.set(key, node);
    else elementByKey.current.delete(key);
  };
  const openExport = (key: string, fileName: string) => {
    const node = elementByKey.current.get(key);
    if (node) setExportTarget({ fileName: sanitizeName(fileName), node });
  };

  const renderWidget = (
    panel: AnalyticsPanel,
    tab: AnalyticsPanelTab,
    widget: AnalyticsWidget,
    index: number,
  ) => {
    const structure = store.getViewModel(widget.viewId);
    const editChrome = editing ? (
      <>
        <ReorderButtons
          index={index}
          length={tab.widgets.length}
          onMove={(offset) => {
            updateTab(panel.id, tab.id, (current) => ({
              ...current,
              widgets: moveAnalyticsItem(current.widgets, index, offset),
            }));
            setReorderAnnouncement(
              t("{name} moved to position {position}", {
                name: widget.title,
                position: index + offset + 1,
              }),
            );
          }}
        />
        <Button
          aria-label={t("Edit")}
          onClick={() => setWidgetEditor({ panelId: panel.id, tabId: tab.id, widget })}
          size="icon"
          title={t("Edit")}
          type="button"
          variant="ghost"
        >
          <HiOutlinePencilSquare />
        </Button>
        <Button
          aria-label={t("Delete")}
          onClick={() =>
            updateTab(panel.id, tab.id, (current) => ({
              ...current,
              widgets: current.widgets.filter((candidate) => candidate.id !== widget.id),
            }))
          }
          size="icon"
          title={t("Delete")}
          type="button"
          variant="ghost"
        >
          <HiOutlineTrash />
        </Button>
      </>
    ) : undefined;
    return (
      // biome-ignore lint/a11y/noStaticElementInteractions: The native drag surface contains accessible adjacent keyboard reorder controls.
      <div
        className={cn("min-w-0", widget.width === 2 ? "md:col-span-2" : "md:col-span-1")}
        draggable={editing}
        key={widget.id}
        onDragOver={(event) => {
          if (editing) event.preventDefault();
        }}
        onDragStart={() => setDragItem({ id: widget.id, kind: "widget" })}
        onDrop={() => {
          if (dragItem?.kind === "widget")
            updateTab(panel.id, tab.id, (current) => ({
              ...current,
              widgets: reorderById(current.widgets, dragItem.id, widget.id),
            }));
          setDragItem(null);
        }}
        ref={registerElement(`widget:${widget.id}`)}
      >
        <AnalyticsWidgetCard
          activeFilters={filtersFor(widget)}
          client={client}
          {...(editChrome ? { editChrome } : {})}
          {...(widget.type === "filter"
            ? {
                filterValue:
                  (editing ? draftFilterValues : store.analyticsUi.filterValuesByWidgetId)[
                    widget.id
                  ] ?? widget.defaultValue,
              }
            : {})}
          onDrilldown={openDrilldown}
          onExport={() => openExport(`widget:${widget.id}`, widget.title)}
          onFilterChange={(value: AnalyticsFilterValue) =>
            editing
              ? setDraftFilterValues((current) => ({ ...current, [widget.id]: value }))
              : store.setAnalyticsFilterValue(widget.id, value)
          }
          revisionKey={`${store.organizationChangeSequence}:${widget.viewId}`}
          structure={structure}
          widget={widget}
        />
      </div>
    );
  };

  if (!editing && store.analyticsDashboards.length === 0) {
    return (
      <ProductSurface className="flex min-h-0 flex-1 flex-col" data-demo-id="analytics-surface">
        <TopLevelEmptyState
          action={
            <Button
              data-demo-id="analytics-create-dashboard"
              onClick={() => beginEdit(true)}
              type="button"
            >
              <HiOutlinePlus />
              {t("Create dashboard")}
            </Button>
          }
          description={t("Create dashboard")}
          icon={<HiOutlineChartBar className="size-7" />}
          title={t("No dashboards yet")}
        />
      </ProductSurface>
    );
  }

  return (
    <ProductSurface className="flex min-h-0 flex-1 flex-col" data-demo-id="analytics-surface">
      <header className="flex flex-wrap items-center gap-2 border-b px-4 py-3" data-export-exclude>
        <DashboardSelector
          activeId={activeDashboard?.id ?? null}
          dashboards={dashboards}
          editing={editing}
          onChange={(id) =>
            editing ? setDraftDashboardId(id) : store.setAnalyticsActiveDashboard(id)
          }
          onReorder={(sourceId, targetId) =>
            setDrafts((current) => reorderById(current, sourceId, targetId))
          }
        />
        <div className="ms-auto flex items-center gap-2">
          {editing ? (
            <>
              <Button onClick={cancelEdit} type="button" variant="outline">
                {t("Cancel")}
              </Button>
              <Button
                data-demo-id="analytics-save"
                disabled={!canSave}
                onClick={saveEdit}
                type="button"
              >
                {t("Save")}
              </Button>
            </>
          ) : (
            <Button
              data-demo-id="analytics-edit"
              onClick={() => beginEdit()}
              type="button"
              variant="outline"
            >
              <HiOutlinePencilSquare />
              {t("Edit dashboard")}
            </Button>
          )}
        </div>
      </header>

      {editing && activeDashboard ? (
        <section
          className="grid gap-3 border-b bg-muted/20 px-4 py-3"
          data-demo-id="analytics-builder-toolbar"
        >
          <div className="flex flex-wrap items-end gap-2">
            <div className="grid min-w-64 flex-1 gap-1">
              <Label>{t("Dashboard name")}</Label>
              <Input
                maxLength={100}
                onChange={(event) =>
                  updateDashboard(activeDashboard.id, (dashboard) => ({
                    ...dashboard,
                    name: event.target.value,
                  }))
                }
                value={activeDashboard.name}
              />
            </div>
            <ReorderButtons
              index={drafts.findIndex((dashboard) => dashboard.id === activeDashboard.id)}
              length={drafts.length}
              onMove={(offset) => {
                setDrafts((current) =>
                  moveAnalyticsItem(
                    current,
                    current.findIndex((dashboard) => dashboard.id === activeDashboard.id),
                    offset,
                  ),
                );
                setReorderAnnouncement(
                  t("{name} moved to position {position}", {
                    name: activeDashboard.name,
                    position:
                      drafts.findIndex((dashboard) => dashboard.id === activeDashboard.id) +
                      offset +
                      1,
                  }),
                );
              }}
            />
            <Button
              disabled={drafts.length >= ANALYTICS_LIMITS.dashboards}
              onClick={() => {
                const dashboard = createAnalyticsDashboard(t("Analytics dashboard"));
                setDrafts((current) => [...current, dashboard]);
                setDraftDashboardId(dashboard.id);
              }}
              type="button"
              variant="outline"
            >
              <HiOutlinePlus />
              {t("Add dashboard")}
            </Button>
            <Button
              disabled={drafts.length >= 32}
              onClick={() => {
                const dashboard = cloneAnalyticsDashboard(
                  activeDashboard,
                  `${activeDashboard.name} · ${t("Copy")}`,
                );
                setDrafts((current) => [...current, dashboard]);
                setDraftDashboardId(dashboard.id);
              }}
              type="button"
              variant="outline"
            >
              <HiOutlineDocumentDuplicate />
              {t("Copy dashboard")}
            </Button>
            <Button
              onClick={() => {
                const index = drafts.findIndex((dashboard) => dashboard.id === activeDashboard.id);
                const next = drafts.filter((dashboard) => dashboard.id !== activeDashboard.id);
                setDrafts(next);
                setDraftDashboardId(next[Math.min(index, next.length - 1)]?.id ?? null);
              }}
              type="button"
              variant="outline"
            >
              <HiOutlineTrash />
              {t("Delete dashboard")}
            </Button>
          </div>
        </section>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto p-4" data-demo-id="analytics-scroll-area">
        {!activeDashboard ? (
          <TopLevelEmptyState
            action={
              <Button onClick={() => beginEdit(true)} type="button">
                <HiOutlinePlus />
                {t("Create dashboard")}
              </Button>
            }
            icon={<HiOutlineChartBar className="size-7" />}
            title={t("No dashboards yet")}
          />
        ) : activeDashboard.panels.length === 0 ? (
          <TopLevelEmptyState
            action={
              editing ? (
                <Button
                  onClick={() => {
                    const panel = createAnalyticsPanel(t("Panel"), t("Tab"));
                    updateDashboard(activeDashboard.id, (dashboard) => ({
                      ...dashboard,
                      panels: [...dashboard.panels, panel],
                    }));
                    setDraftTabs((current) => ({
                      ...current,
                      [panel.id]: panel.tabs[0]?.id ?? "",
                    }));
                  }}
                  type="button"
                >
                  <HiOutlinePlus />
                  {t("Add panel")}
                </Button>
              ) : undefined
            }
            icon={<HiOutlineChartBar className="size-7" />}
            title={t("No panels yet")}
          />
        ) : (
          <div
            className="grid grid-cols-1 gap-4 lg:grid-cols-3"
            data-demo-id="analytics-dashboard-grid"
          >
            {activeDashboard.panels.map((panel, panelIndex) => {
              const tabId = activeTabId(panel);
              const tab = panel.tabs.find((candidate) => candidate.id === tabId) ?? panel.tabs[0];
              if (!tab) return null;
              return (
                // biome-ignore lint/a11y/noStaticElementInteractions: The native drag surface contains accessible adjacent keyboard reorder controls.
                <section
                  className={cn(
                    "min-w-0 rounded-xl border bg-background",
                    panel.width === 1
                      ? "lg:col-span-1"
                      : panel.width === 2
                        ? "lg:col-span-2"
                        : "lg:col-span-3",
                  )}
                  draggable={editing}
                  key={panel.id}
                  onDragOver={(event) => {
                    if (editing) event.preventDefault();
                  }}
                  onDragStart={() => setDragItem({ id: panel.id, kind: "panel" })}
                  onDrop={() => {
                    if (dragItem?.kind === "panel")
                      updateDashboard(activeDashboard.id, (dashboard) => ({
                        ...dashboard,
                        panels: reorderById(dashboard.panels, dragItem.id, panel.id),
                      }));
                    setDragItem(null);
                  }}
                  ref={registerElement(`panel:${panel.id}`)}
                >
                  <header className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
                    {editing ? (
                      <Input
                        className="h-9 min-w-40 flex-1"
                        maxLength={100}
                        onChange={(event) =>
                          updatePanel(panel.id, (current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                        value={panel.name}
                      />
                    ) : (
                      <h2 className="min-w-0 flex-1 truncate font-semibold">{panel.name}</h2>
                    )}
                    <div className="flex items-center gap-1" data-export-exclude>
                      {editing && (
                        <>
                          <select
                            className="h-9 rounded-md border bg-background px-2 text-sm"
                            onChange={(event) =>
                              updatePanel(panel.id, (current) => ({
                                ...current,
                                width: Number(event.target.value) as 1 | 2 | 3,
                              }))
                            }
                            value={panel.width}
                          >
                            <option value="1">{t("One third")}</option>
                            <option value="2">{t("Two thirds")}</option>
                            <option value="3">{t("Three thirds")}</option>
                          </select>
                          <ReorderButtons
                            index={panelIndex}
                            length={activeDashboard.panels.length}
                            onMove={(offset) => {
                              updateDashboard(activeDashboard.id, (dashboard) => ({
                                ...dashboard,
                                panels: moveAnalyticsItem(dashboard.panels, panelIndex, offset),
                              }));
                              setReorderAnnouncement(
                                t("{name} moved to position {position}", {
                                  name: panel.name,
                                  position: panelIndex + offset + 1,
                                }),
                              );
                            }}
                          />
                          <Button
                            aria-label={t("Delete")}
                            onClick={() =>
                              updateDashboard(activeDashboard.id, (dashboard) => ({
                                ...dashboard,
                                panels: dashboard.panels.filter(
                                  (candidate) => candidate.id !== panel.id,
                                ),
                              }))
                            }
                            size="icon"
                            title={t("Delete")}
                            type="button"
                            variant="ghost"
                          >
                            <HiOutlineTrash />
                          </Button>
                        </>
                      )}
                      {!editing && (
                        <Button
                          aria-label={t("Export PNG")}
                          onClick={() => openExport(`panel:${panel.id}`, panel.name)}
                          size="icon"
                          title={t("Export PNG")}
                          type="button"
                          variant="ghost"
                        >
                          <HiOutlineArrowDownTray />
                        </Button>
                      )}
                    </div>
                  </header>
                  <div
                    className="flex items-center gap-1 overflow-x-auto border-b px-3 py-2"
                    data-export-exclude
                  >
                    {panel.tabs.map((candidate, tabIndex) => (
                      // biome-ignore lint/a11y/noStaticElementInteractions: The native drag surface contains accessible adjacent keyboard reorder controls.
                      <div
                        className="flex shrink-0 items-center"
                        draggable={editing}
                        key={candidate.id}
                        onDragOver={(event) => {
                          if (editing) event.preventDefault();
                        }}
                        onDragStart={() => setDragItem({ id: candidate.id, kind: "tab" })}
                        onDrop={() => {
                          if (dragItem?.kind === "tab")
                            updatePanel(panel.id, (current) => ({
                              ...current,
                              tabs: reorderById(current.tabs, dragItem.id, candidate.id),
                            }));
                          setDragItem(null);
                        }}
                      >
                        <button
                          className={cn(
                            "rounded-md px-3 py-1.5 text-sm outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring",
                            candidate.id === tab.id && "bg-accent font-medium",
                          )}
                          onClick={() =>
                            editing
                              ? setDraftTabs((current) => ({
                                  ...current,
                                  [panel.id]: candidate.id,
                                }))
                              : store.setAnalyticsActiveTab(panel.id, candidate.id)
                          }
                          type="button"
                        >
                          {candidate.name}
                        </button>
                        {editing && candidate.id === tab.id ? (
                          <>
                            <ReorderButtons
                              index={tabIndex}
                              length={panel.tabs.length}
                              onMove={(offset) => {
                                updatePanel(panel.id, (current) => ({
                                  ...current,
                                  tabs: moveAnalyticsItem(current.tabs, tabIndex, offset),
                                }));
                                setReorderAnnouncement(
                                  t("{name} moved to position {position}", {
                                    name: candidate.name,
                                    position: tabIndex + offset + 1,
                                  }),
                                );
                              }}
                            />
                            <Button
                              aria-label={t("Delete")}
                              disabled={panel.tabs.length === 1}
                              onClick={() =>
                                updatePanel(panel.id, (current) => ({
                                  ...current,
                                  tabs: current.tabs.filter((item) => item.id !== candidate.id),
                                }))
                              }
                              size="icon"
                              title={t("Delete")}
                              type="button"
                              variant="ghost"
                            >
                              <HiOutlineTrash />
                            </Button>
                          </>
                        ) : null}
                      </div>
                    ))}
                    {editing && (
                      <Button
                        disabled={panel.tabs.length >= ANALYTICS_LIMITS.tabs}
                        onClick={() => {
                          const nextTab = createAnalyticsPanelTab(t("Tab"));
                          updatePanel(panel.id, (current) => ({
                            ...current,
                            tabs: [...current.tabs, nextTab],
                          }));
                          setDraftTabs((current) => ({ ...current, [panel.id]: nextTab.id }));
                        }}
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        <HiOutlinePlus />
                        {t("Add tab")}
                      </Button>
                    )}
                  </div>
                  {editing ? (
                    <div className="border-b px-4 py-3">
                      <Input
                        maxLength={100}
                        onChange={(event) =>
                          updateTab(panel.id, tab.id, (current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                        value={tab.name}
                      />
                    </div>
                  ) : null}
                  <div
                    className="grid grid-cols-1 gap-3 p-3 md:grid-cols-2"
                    data-demo-id="analytics-widget-grid"
                  >
                    {tab.widgets.map((widget, index) => renderWidget(panel, tab, widget, index))}
                    {editing && tab.widgets.length < ANALYTICS_LIMITS.widgets && (
                      <button
                        className="grid min-h-40 place-items-center rounded-xl border border-dashed p-6 text-sm text-muted-foreground outline-none transition-colors hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring md:col-span-2"
                        onClick={() => {
                          const widget = createAnalyticsWidget(
                            "kpi",
                            store.systemOrgViewId,
                            t("KPI counter"),
                          );
                          setWidgetEditor({ panelId: panel.id, tabId: tab.id, widget });
                        }}
                        type="button"
                      >
                        <span className="inline-flex items-center gap-2">
                          <HiOutlinePlus />
                          {t("Add widget")}
                        </span>
                      </button>
                    )}
                    {!editing && tab.widgets.length === 0 ? (
                      <div className="grid min-h-40 place-items-center text-sm text-muted-foreground md:col-span-2">
                        {t("No widgets yet")}
                      </div>
                    ) : null}
                  </div>
                </section>
              );
            })}
            {editing && activeDashboard.panels.length < ANALYTICS_LIMITS.panels && (
              <button
                className="grid min-h-44 place-items-center rounded-xl border border-dashed text-sm text-muted-foreground outline-none hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring lg:col-span-3"
                onClick={() => {
                  const panel = createAnalyticsPanel(t("Panel"), t("Tab"));
                  updateDashboard(activeDashboard.id, (dashboard) => ({
                    ...dashboard,
                    panels: [...dashboard.panels, panel],
                  }));
                  setDraftTabs((current) => ({ ...current, [panel.id]: panel.tabs[0]?.id ?? "" }));
                }}
                type="button"
              >
                <span className="inline-flex items-center gap-2">
                  <HiOutlinePlus />
                  {t("Add panel")}
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {widgetEditor ? (
        <AnalyticsWidgetEditorDialog
          definitions={store.employeeFieldDefinitions}
          onOpenChange={(open) => {
            if (!open) setWidgetEditor(null);
          }}
          onSave={(widget) =>
            updateTab(widgetEditor.panelId, widgetEditor.tabId, (tab) => ({
              ...tab,
              widgets: tab.widgets.some((candidate) => candidate.id === widget.id)
                ? tab.widgets.map((candidate) => (candidate.id === widget.id ? widget : candidate))
                : [...tab.widgets, widget],
            }))
          }
          open
          views={store.orgViewList}
          widget={widgetEditor.widget}
          widgets={allWidgets}
        />
      ) : null}
      <AnalyticsDrilldown
        employeeIds={store.analyticsUi.drilldown.employeeIds}
        onOpenChange={setDrilldownOpen}
        open={drilldownOpen}
      />
      <AnalyticsImageExportDialog
        fileName={exportTarget?.fileName ?? "analytics"}
        onOpenChange={(open) => {
          if (!open) setExportTarget(null);
        }}
        open={Boolean(exportTarget)}
        target={exportTarget?.node ?? null}
      />
      <p aria-live="polite" className="sr-only">
        {reorderAnnouncement}
      </p>
    </ProductSurface>
  );
});
