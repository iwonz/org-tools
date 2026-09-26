"use client";

import type {
  AnalyticsConfiguration,
  AnalyticsFilter,
  AnalyticsFilterValue,
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
  HiOutlinePencilSquare,
  HiOutlinePlus,
  HiOutlineTrash,
} from "react-icons/hi2";

import { AnalyticsFilterEditorDialog } from "@/components/analytics-filter-editor-dialog";
import { AnalyticsImageExportDialog } from "@/components/analytics-image-export-dialog";
import { AnalyticsFilterControl, AnalyticsWidgetCard } from "@/components/analytics-widget-card";
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
import { ProductSurface } from "@/components/ui/product-surface";
import { useUiText } from "@/i18n/use-ui-text";
import {
  addAnalyticsTab,
  createAnalyticsFilter,
  createAnalyticsWidget,
  moveAnalyticsItem,
  removeAnalyticsTab,
  removeAnalyticsWidget,
  reorderById,
} from "@/lib/analytics-dashboard";
import type { AnalyticsAppliedFilter } from "@/lib/analytics-query";
import { ANALYTICS_LIMITS, isAnalyticsFilterCompatible } from "@/lib/analytics-state";
import { AnalyticsWorkerClient } from "@/lib/analytics-worker-client";
import { cn } from "@/lib/utils";
import { useOrgStore } from "@/stores/org-store-context";

type ExportTarget = { fileName: string; node: HTMLElement } | null;
type DragItem = { id: string; kind: "filter" | "tab" | "widget" };

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

const replaceScopedWidgets = (
  configuration: AnalyticsConfiguration,
  tabId: string | null,
  nextWidgets: AnalyticsWidget[],
): AnalyticsConfiguration => {
  let index = 0;
  return {
    ...configuration,
    widgets: configuration.widgets.map((widget) =>
      widget.tabId === tabId ? (nextWidgets[index++] ?? widget) : widget,
    ),
  };
};

export const AnalyticsTab = observer(() => {
  const store = useOrgStore();
  const t = useUiText();
  const clientRef = useRef<AnalyticsWorkerClient | null>(null);
  if (!clientRef.current) clientRef.current = new AnalyticsWorkerClient();
  const client = clientRef.current;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<AnalyticsConfiguration>(() =>
    structuredClone(store.analytics),
  );
  const [draftActiveTabId, setDraftActiveTabId] = useState<string | null>(null);
  const [draftFilterValues, setDraftFilterValues] = useState<Record<string, AnalyticsFilterValue>>(
    {},
  );
  const [widgetEditor, setWidgetEditor] = useState<AnalyticsWidget | null>(null);
  const [filterEditor, setFilterEditor] = useState<AnalyticsFilter | null>(null);
  const [exportTarget, setExportTarget] = useState<ExportTarget>(null);
  const [drilldownOpen, setDrilldownOpen] = useState(false);
  const [dragItem, setDragItem] = useState<DragItem | null>(null);
  const [reorderAnnouncement, setReorderAnnouncement] = useState("");
  const boardRef = useRef<HTMLDivElement | null>(null);
  const widgetElements = useRef(new Map<string, HTMLElement>());

  useEffect(() => () => client.dispose(), [client]);

  const configuration = editing ? draft : store.analytics;
  const activeTabId = editing ? draftActiveTabId : store.analyticsUi.activeTabId;
  const visibleWidgets = configuration.widgets.filter((widget) => widget.tabId === activeTabId);
  const filterValues = editing ? draftFilterValues : store.analyticsUi.filterValuesByFilterId;
  const hasContent =
    configuration.filters.length > 0 ||
    configuration.tabs.length > 0 ||
    configuration.widgets.length > 0;

  const beginEdit = () => {
    setDraft(structuredClone(store.analytics));
    setDraftActiveTabId(store.analyticsUi.activeTabId);
    setDraftFilterValues(structuredClone(store.analyticsUi.filterValuesByFilterId));
    setEditing(true);
  };
  const cancelEdit = () => {
    setEditing(false);
    setWidgetEditor(null);
    setFilterEditor(null);
  };
  const canSave =
    draft.tabs.every((tab) => tab.name.trim()) &&
    draft.filters.every((filter) => filter.name.trim()) &&
    draft.widgets.every((widget) => widget.title.trim());
  const saveEdit = () => {
    if (!canSave) return;
    const nextUi: OrgToolsAnalyticsUiState = {
      ...structuredClone(store.analyticsUi),
      activeTabId: draftActiveTabId,
      filterValuesByFilterId: structuredClone(draftFilterValues),
    };
    store.replaceAnalyticsConfiguration(draft, nextUi);
    setEditing(false);
  };
  const setActiveTab = (tabId: string | null) => {
    if (editing) setDraftActiveTabId(tabId);
    else store.setAnalyticsActiveTab(tabId);
  };
  const moveScopedWidget = (index: number, offset: -1 | 1) => {
    const widgets = moveAnalyticsItem(visibleWidgets, index, offset);
    setDraft((current) => replaceScopedWidgets(current, activeTabId, widgets));
    const widget = visibleWidgets[index];
    if (widget)
      setReorderAnnouncement(
        t("{name} moved to position {position}", {
          name: widget.title,
          position: index + offset + 1,
        }),
      );
  };
  const activeFiltersFor = (widget: AnalyticsWidget): AnalyticsAppliedFilter[] =>
    configuration.filters.flatMap((filter) => {
      if (filter.targetWidgetIds !== null && !filter.targetWidgetIds.includes(widget.id)) return [];
      if (!isAnalyticsFilterCompatible(filter, widget)) return [];
      return [{ field: filter.field, value: filterValues[filter.id] ?? filter.defaultValue }];
    });
  const openDrilldown = (employeeIds: EmployeeId[], widgetId: string) => {
    store.setAnalyticsDrilldown({ employeeIds, sourceWidgetId: widgetId });
    setDrilldownOpen(true);
  };
  const updateFilterValue = (filterId: string, value: AnalyticsFilterValue) => {
    if (editing)
      setDraftFilterValues((current) => ({ ...current, [filterId]: structuredClone(value) }));
    else store.setAnalyticsFilterValue(filterId, value);
  };
  const openExport = (node: HTMLElement | null, fileName: string) => {
    if (node) setExportTarget({ fileName: sanitizeName(fileName), node });
  };

  return (
    <ProductSurface className="flex min-h-0 flex-1 flex-col" data-demo-id="analytics-surface">
      <header className="flex flex-wrap items-center gap-2 border-b px-4 py-3" data-export-exclude>
        <h2 className="font-medium">{t("Analytics")}</h2>
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
            <>
              <Button
                aria-label={t("Export PNG")}
                disabled={visibleWidgets.length === 0}
                onClick={() => openExport(boardRef.current, "analytics")}
                size="icon"
                title={t("Export PNG")}
                type="button"
                variant="ghost"
              >
                <HiOutlineArrowDownTray />
              </Button>
              <Button
                data-demo-id="analytics-edit"
                onClick={beginEdit}
                type="button"
                variant="outline"
              >
                <HiOutlinePencilSquare />
                {t("Edit")}
              </Button>
            </>
          )}
        </div>
      </header>

      {editing ? (
        <div
          className="flex flex-wrap items-center gap-2 border-b bg-muted/20 px-4 py-3"
          data-demo-id="analytics-builder-toolbar"
        >
          <Button
            disabled={draft.filters.length >= ANALYTICS_LIMITS.filters}
            onClick={() =>
              setFilterEditor(createAnalyticsFilter(store.systemOrgViewId, t("Filter")))
            }
            type="button"
            variant="outline"
          >
            <HiOutlinePlus />
            {t("Filter")}
          </Button>
          <Button
            disabled={draft.tabs.length >= ANALYTICS_LIMITS.tabs}
            onClick={() => {
              const next = addAnalyticsTab(draft, t("Tab"));
              setDraft(next.configuration);
              setDraftActiveTabId(next.tabId);
            }}
            type="button"
            variant="outline"
          >
            <HiOutlinePlus />
            {t("Add tab")}
          </Button>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto">
        {!editing && !hasContent ? (
          <TopLevelEmptyState
            action={
              <Button onClick={beginEdit} type="button">
                <HiOutlinePencilSquare />
                {t("Edit")}
              </Button>
            }
            description={t("No widgets yet")}
            icon={<HiOutlineChartBar className="size-7" />}
            title={t("Analytics")}
          />
        ) : (
          <div className="grid gap-4 p-4">
            {configuration.filters.length > 0 ? (
              <div
                className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-3"
                data-demo-id="analytics-filter-strip"
                data-export-exclude
              >
                {configuration.filters.map((filter, index) => {
                  const structure = store.getViewModel(filter.viewId);
                  return (
                    // biome-ignore lint/a11y/noStaticElementInteractions: Adjacent buttons provide keyboard reordering.
                    <div
                      className="grid min-w-48 flex-1 gap-1"
                      draggable={editing}
                      key={filter.id}
                      onDragOver={(event) => {
                        if (editing) event.preventDefault();
                      }}
                      onDragStart={() => setDragItem({ id: filter.id, kind: "filter" })}
                      onDrop={() => {
                        if (dragItem?.kind === "filter")
                          setDraft((current) => ({
                            ...current,
                            filters: reorderById(current.filters, dragItem.id, filter.id),
                          }));
                        setDragItem(null);
                      }}
                    >
                      <div className="flex items-center gap-1">
                        <span className="min-w-0 flex-1 truncate text-xs font-medium">
                          {filter.name}
                        </span>
                        {editing ? (
                          <>
                            <ReorderButtons
                              index={index}
                              length={configuration.filters.length}
                              onMove={(offset) =>
                                setDraft((current) => ({
                                  ...current,
                                  filters: moveAnalyticsItem(current.filters, index, offset),
                                }))
                              }
                            />
                            <Button
                              aria-label={t("Edit")}
                              onClick={() => setFilterEditor(filter)}
                              size="icon"
                              title={t("Edit")}
                              type="button"
                              variant="ghost"
                            >
                              <HiOutlinePencilSquare />
                            </Button>
                            <Button
                              aria-label={t("Delete")}
                              onClick={() => {
                                setDraft((current) => ({
                                  ...current,
                                  filters: current.filters.filter(
                                    (candidate) => candidate.id !== filter.id,
                                  ),
                                }));
                                setDraftFilterValues((current) => {
                                  const next = { ...current };
                                  delete next[filter.id];
                                  return next;
                                });
                              }}
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
                      {structure ? (
                        <AnalyticsFilterControl
                          client={client}
                          filter={filter}
                          onChange={(value) => updateFilterValue(filter.id, value)}
                          revisionKey={`${store.organizationChangeSequence}:${filter.viewId}`}
                          structure={structure}
                          value={filterValues[filter.id] ?? filter.defaultValue}
                        />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}

            {configuration.tabs.length > 0 ? (
              <div
                className="flex min-w-0 gap-1 overflow-x-auto border-b"
                data-demo-id="analytics-tabs"
                data-export-exclude
                role="tablist"
              >
                {configuration.tabs.map((tab, index) => (
                  // biome-ignore lint/a11y/noStaticElementInteractions: Adjacent buttons provide keyboard reordering.
                  <div
                    className={cn(
                      "flex shrink-0 items-center rounded-t-md",
                      tab.id === activeTabId && "bg-accent",
                    )}
                    draggable={editing}
                    key={tab.id}
                    onDragOver={(event) => {
                      if (editing) event.preventDefault();
                    }}
                    onDragStart={() => setDragItem({ id: tab.id, kind: "tab" })}
                    onDrop={() => {
                      if (dragItem?.kind === "tab")
                        setDraft((current) => ({
                          ...current,
                          tabs: reorderById(current.tabs, dragItem.id, tab.id),
                        }));
                      setDragItem(null);
                    }}
                  >
                    {editing ? (
                      <Input
                        aria-label={t("Tab name")}
                        className="h-9 w-36 border-0 bg-transparent"
                        maxLength={100}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            tabs: current.tabs.map((candidate) =>
                              candidate.id === tab.id
                                ? { ...candidate, name: event.target.value }
                                : candidate,
                            ),
                          }))
                        }
                        onFocus={() => setActiveTab(tab.id)}
                        value={tab.name}
                      />
                    ) : (
                      <button
                        aria-selected={tab.id === activeTabId}
                        className="px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={() => setActiveTab(tab.id)}
                        role="tab"
                        type="button"
                      >
                        {tab.name}
                      </button>
                    )}
                    {editing ? (
                      <>
                        <ReorderButtons
                          index={index}
                          length={configuration.tabs.length}
                          onMove={(offset) =>
                            setDraft((current) => ({
                              ...current,
                              tabs: moveAnalyticsItem(current.tabs, index, offset),
                            }))
                          }
                        />
                        <Button
                          aria-label={t("Delete")}
                          onClick={() => {
                            const removed = removeAnalyticsTab(draft, tab.id);
                            setDraft(removed.configuration);
                            if (activeTabId === tab.id) setDraftActiveTabId(removed.activeTabId);
                          }}
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
              </div>
            ) : null}

            <div
              className="grid grid-cols-1 gap-3 md:grid-cols-2"
              data-demo-id="analytics-widget-grid"
              ref={boardRef}
            >
              {visibleWidgets.map((widget, index) => {
                const structure = store.getViewModel(widget.viewId);
                const editChrome = editing ? (
                  <>
                    <ReorderButtons
                      index={index}
                      length={visibleWidgets.length}
                      onMove={(offset) => moveScopedWidget(index, offset)}
                    />
                    <Button
                      aria-label={t("Edit")}
                      onClick={() => setWidgetEditor(widget)}
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
                        setDraft((current) => removeAnalyticsWidget(current, widget.id))
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
                  // biome-ignore lint/a11y/noStaticElementInteractions: Adjacent buttons provide keyboard reordering.
                  <div
                    className={cn(
                      "min-w-0",
                      widget.width === 2 ? "md:col-span-2" : "md:col-span-1",
                    )}
                    draggable={editing}
                    key={widget.id}
                    onDragOver={(event) => {
                      if (editing) event.preventDefault();
                    }}
                    onDragStart={() => setDragItem({ id: widget.id, kind: "widget" })}
                    onDrop={() => {
                      if (dragItem?.kind === "widget") {
                        const widgets = reorderById(visibleWidgets, dragItem.id, widget.id);
                        setDraft((current) => replaceScopedWidgets(current, activeTabId, widgets));
                      }
                      setDragItem(null);
                    }}
                    ref={(node) => {
                      if (node) widgetElements.current.set(widget.id, node);
                      else widgetElements.current.delete(widget.id);
                    }}
                  >
                    <AnalyticsWidgetCard
                      activeFilters={activeFiltersFor(widget)}
                      client={client}
                      {...(editChrome ? { editChrome } : {})}
                      onDrilldown={openDrilldown}
                      onExport={() =>
                        openExport(widgetElements.current.get(widget.id) ?? null, widget.title)
                      }
                      revisionKey={`${store.organizationChangeSequence}:${widget.viewId}`}
                      structure={structure}
                      widget={widget}
                    />
                  </div>
                );
              })}
              {editing && visibleWidgets.length < ANALYTICS_LIMITS.widgets ? (
                <button
                  className="grid min-h-40 place-items-center rounded-xl border border-dashed p-6 text-sm text-muted-foreground outline-none transition-colors hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring md:col-span-2"
                  onClick={() =>
                    setWidgetEditor(
                      createAnalyticsWidget(
                        "kpi",
                        store.systemOrgViewId,
                        t("KPI counter"),
                        activeTabId,
                      ),
                    )
                  }
                  type="button"
                >
                  <span className="inline-flex items-center gap-2">
                    <HiOutlinePlus />
                    {t("Add widget")}
                  </span>
                </button>
              ) : null}
              {!editing && visibleWidgets.length === 0 ? (
                <div className="grid min-h-40 place-items-center text-sm text-muted-foreground md:col-span-2">
                  {t("No widgets yet")}
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {widgetEditor ? (
        <AnalyticsWidgetEditorDialog
          definitions={store.employeeFieldDefinitions}
          onOpenChange={(open) => {
            if (!open) setWidgetEditor(null);
          }}
          onSave={(widget) => {
            setDraft((current) => ({
              ...current,
              widgets: current.widgets.some((candidate) => candidate.id === widget.id)
                ? current.widgets.map((candidate) =>
                    candidate.id === widget.id ? widget : candidate,
                  )
                : [...current.widgets, widget],
            }));
          }}
          open
          views={store.orgViewList}
          widget={widgetEditor}
        />
      ) : null}
      {filterEditor ? (
        <AnalyticsFilterEditorDialog
          definitions={store.employeeFieldDefinitions}
          filter={filterEditor}
          onOpenChange={(open) => {
            if (!open) setFilterEditor(null);
          }}
          onSave={(filter) =>
            setDraft((current) => ({
              ...current,
              filters: current.filters.some((candidate) => candidate.id === filter.id)
                ? current.filters.map((candidate) =>
                    candidate.id === filter.id ? filter : candidate,
                  )
                : [...current.filters, filter],
            }))
          }
          open
          views={store.orgViewList}
          widgets={draft.widgets}
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
