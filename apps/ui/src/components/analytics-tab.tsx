"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { observer } from "mobx-react-lite";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HiOutlineChartBar, HiOutlineChevronDown, HiOutlineEye } from "react-icons/hi2";
import { EmployeeCardList, EmployeeIdentity } from "@/components/employee-card-list";
import { HighlightedText } from "@/components/highlighted-text";
import {
  createEmptyEmployeeSearchFilters,
  EmployeeSearchInput,
  filterEmployeesBySearch,
  getEmployeeSearchFiltersKey,
  getSearchTokens,
  hasActiveEmployeeSearchFilters,
} from "@/components/search-controls";
import { TopLevelEmptyState } from "@/components/source-empty-state";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { type UiTextKey, useAppFormatter, useCountText, useUiText } from "@/i18n/use-ui-text";
import type { AnalyticsCountEntry } from "@/lib/analytics";
import { useOrgStore } from "@/stores/org-store-context";

type AnalyticsView = {
  entry: AnalyticsCountEntry;
  groupTitleKey: UiTextKey;
};

type AnalyticsSortDirection = "asc" | "desc";
type AnalyticsSortKey = "count" | "label";
type AnalyticsSortState = {
  direction: AnalyticsSortDirection;
  key: AnalyticsSortKey;
};

const getDefaultSortDirection = (key: AnalyticsSortKey): AnalyticsSortDirection =>
  key === "count" ? "desc" : "asc";

const sortAnalyticsEntries = (
  entries: AnalyticsCountEntry[],
  sortState: AnalyticsSortState,
  getLabel: (entry: AnalyticsCountEntry) => string,
  collator: Intl.Collator,
) =>
  [...entries].sort((firstEntry, secondEntry) => {
    const labelSort = collator.compare(getLabel(firstEntry), getLabel(secondEntry));

    if (sortState.key === "label") {
      return sortState.direction === "asc" ? labelSort : -labelSort;
    }

    const countSort = firstEntry.count - secondEntry.count;

    if (countSort === 0) return labelSort;

    return sortState.direction === "asc" ? countSort : -countSort;
  });

const useAnalyticsEntryLabel = () => {
  const t = useUiText();
  const format = useAppFormatter();
  return useCallback(
    (entry: AnalyticsCountEntry) => {
      if (entry.kind === "missingPosition") return t("Position not specified");
      if (entry.kind === "birthdayMonth") {
        return format.dateTime(new Date(Date.UTC(2000, Number(entry.label) - 1, 1)), {
          month: "long",
          timeZone: "UTC",
        });
      }
      if (entry.kind === "birthdayDate") {
        const [month, day] = entry.label.split("-").map(Number);
        return format.dateTime(new Date(Date.UTC(2000, (month ?? 1) - 1, day ?? 1)), {
          day: "numeric",
          month: "long",
          timeZone: "UTC",
        });
      }
      return entry.label;
    },
    [format, t],
  );
};

function AnalyticsSortableHeader({
  align = "left",
  children,
  className,
  onSort,
  sortKey,
  sortState,
}: {
  align?: "left" | "right";
  children: string;
  className?: string;
  onSort: (key: AnalyticsSortKey) => void;
  sortKey: AnalyticsSortKey;
  sortState: AnalyticsSortState;
}) {
  const isActive = sortState.key === sortKey;

  return (
    <th
      aria-sort={isActive ? (sortState.direction === "asc" ? "ascending" : "descending") : "none"}
      className={className}
    >
      <button
        className={[
          "inline-flex w-full cursor-pointer items-center gap-1.5 rounded-sm py-1 font-medium outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
          align === "right" ? "justify-end text-right" : "justify-start text-left",
          isActive ? "text-foreground" : "text-muted-foreground",
        ].join(" ")}
        onClick={() => onSort(sortKey)}
        type="button"
      >
        <span>{children}</span>
        {isActive && (
          <HiOutlineChevronDown
            aria-hidden="true"
            className={[
              "size-3.5 shrink-0 transition-transform",
              sortState.direction === "asc" && "rotate-180",
            ]
              .filter(Boolean)
              .join(" ")}
          />
        )}
      </button>
    </th>
  );
}

function AnalyticsList({
  className,
  demoId,
  emptyState,
  entries,
  onView,
  title,
}: {
  className?: string;
  demoId: string;
  emptyState: string;
  entries: AnalyticsCountEntry[];
  onView: (entry: AnalyticsCountEntry) => void;
  title: string;
}) {
  const t = useUiText();
  const format = useAppFormatter();
  const locale = useLocale();
  const getEntryLabel = useAnalyticsEntryLabel();
  const collator = useMemo(() => new Intl.Collator(locale, { sensitivity: "base" }), [locale]);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [sortState, setSortState] = useState<AnalyticsSortState>({
    direction: "desc",
    key: "count",
  });
  const sortedEntries = useMemo(() => {
    if (sortState.key === "count" && sortState.direction === "desc") return entries;

    return sortAnalyticsEntries(entries, sortState, getEntryLabel, collator);
  }, [collator, entries, getEntryLabel, sortState]);
  const rowVirtualizer = useVirtualizer({
    count: sortedEntries.length,
    estimateSize: () => 42,
    getScrollElement: () => scrollRef.current,
    overscan: 10,
  });
  const virtualRows = rowVirtualizer.getVirtualItems();
  const paddingTop = virtualRows[0]?.start ?? 0;
  const paddingBottom =
    virtualRows.length > 0
      ? rowVirtualizer.getTotalSize() - (virtualRows[virtualRows.length - 1]?.end ?? 0)
      : 0;
  const handleSort = (key: AnalyticsSortKey) => {
    setSortState((currentSortState) =>
      currentSortState.key === key
        ? {
            direction: currentSortState.direction === "asc" ? "desc" : "asc",
            key,
          }
        : {
            direction: getDefaultSortDirection(key),
            key,
          },
    );
  };

  return (
    <section
      className={["flex h-96 min-w-0 flex-col", className].filter(Boolean).join(" ")}
      data-demo-id={demoId}
    >
      <header className="shrink-0 border-b pb-2">
        <h2 className="min-w-0 text-sm font-medium">{title}</h2>
      </header>
      <div className="flex min-h-0 flex-1 flex-col pt-2">
        {sortedEntries.length === 0 ? (
          <div className="grid min-h-0 flex-1 place-items-center p-4 text-sm text-muted-foreground">
            {emptyState}
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-auto" ref={scrollRef}>
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-background/95 text-left text-xs text-muted-foreground backdrop-blur">
                <tr>
                  <AnalyticsSortableHeader
                    className="px-3 py-1"
                    onSort={handleSort}
                    sortKey="label"
                    sortState={sortState}
                  >
                    {t("Value")}
                  </AnalyticsSortableHeader>
                  <AnalyticsSortableHeader
                    align="right"
                    className="w-24 px-3 py-1"
                    onSort={handleSort}
                    sortKey="count"
                    sortState={sortState}
                  >
                    {t("Count")}
                  </AnalyticsSortableHeader>
                  <th className="w-12 px-2 py-2" aria-label={t("Actions")} />
                </tr>
              </thead>
              <tbody>
                {paddingTop > 0 && (
                  <tr>
                    <td className="p-0" colSpan={3} style={{ height: paddingTop }} />
                  </tr>
                )}
                {virtualRows.map((virtualRow) => {
                  const entry = sortedEntries[virtualRow.index];

                  if (!entry) return null;

                  return (
                    <tr
                      className="border-t"
                      data-index={virtualRow.index}
                      key={`${entry.label}:${virtualRow.index}`}
                      ref={rowVirtualizer.measureElement}
                    >
                      <td className="min-w-0 break-words px-3 py-2">{getEntryLabel(entry)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                        {format.number(entry.count)}
                      </td>
                      <td className="px-2 py-1 text-right">
                        <Button
                          data-demo-id={`${demoId}-view-button`}
                          onClick={() => onView(entry)}
                          size="icon"
                          title={t("View")}
                          type="button"
                          variant="ghost"
                        >
                          <HiOutlineEye />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {paddingBottom > 0 && (
                  <tr>
                    <td className="p-0" colSpan={3} style={{ height: paddingBottom }} />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

export const AnalyticsTab = observer(() => {
  const store = useOrgStore();
  const t = useUiText();
  const countText = useCountText();
  const getEntryLabel = useAnalyticsEntryLabel();
  const units = store.units;
  const [view, setView] = useState<AnalyticsView | null>(null);
  const [viewSearchQuery, setViewSearchQuery] = useState("");
  const [viewFilters, setViewFilters] = useState(createEmptyEmployeeSearchFilters);
  const analytics = store.analyticsResult;
  const analyticsBuildStatus = store.analyticsBuildStatus;
  const employeePositionOptions = units?.indexes.positionOptions ?? [];
  const employeeTagOptions = units?.indexes.tagOptions ?? [];
  const employeeSearchDocumentByEmployeeId = units?.indexes.employeeSearchDocumentByEmployeeId;
  const viewSearchTokens = useMemo(() => getSearchTokens(viewSearchQuery), [viewSearchQuery]);
  const visibleViewEmployees = useMemo(() => {
    if (!employeeSearchDocumentByEmployeeId) return [];

    return filterEmployeesBySearch({
      employeeSearchDocumentByEmployeeId,
      employeeUnitMembershipsByEmployeeId: store.employeeUnitMembershipsByEmployeeId,
      employees: view?.entry.employees ?? [],
      filters: viewFilters,
      queryTokens: viewSearchTokens,
    });
  }, [
    employeeSearchDocumentByEmployeeId,
    store.employeeUnitMembershipsByEmployeeId,
    view?.entry.employees,
    viewFilters,
    viewSearchTokens,
  ]);
  const hasViewEmployees = (view?.entry.employees.length ?? 0) > 0;
  const hasViewSearch =
    hasViewEmployees &&
    (viewSearchTokens.length > 0 || hasActiveEmployeeSearchFilters(viewFilters));

  useEffect(() => {
    if (!units || units.allEmployees.length === 0 || analytics) return;

    store.ensureAnalyticsResult();
  }, [analytics, store, units]);

  if (!units) return null;
  if (units.allEmployees.length === 0) {
    return (
      <TopLevelEmptyState
        action={
          <Button onClick={() => store.setActiveTab("employees")} type="button">
            {t("Go to Employees")}
          </Button>
        }
        description={t("Add Employees to see organization analytics.")}
        icon={<HiOutlineChartBar className="size-6" />}
        title={t("No analytics yet")}
      />
    );
  }

  const openView = (groupTitleKey: UiTextKey, entry: AnalyticsCountEntry) => {
    setViewSearchQuery("");
    setViewFilters(createEmptyEmployeeSearchFilters());
    setView({
      entry,
      groupTitleKey,
    });
  };

  return (
    <>
      <section
        className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background"
        data-demo-id="analytics-tab"
      >
        <div
          className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b bg-background px-4 py-3"
          data-demo-id="analytics-header"
        >
          <div className="min-w-0">
            <div className="text-sm font-medium">{t("Analytics")}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {countText("employeesInMain", { count: units.allEmployees.length })}
            </div>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-4" data-demo-id="analytics-scroll-area">
          {!analytics ? (
            <div className="grid h-full min-h-[320px] place-items-center">
              <div className="grid justify-items-center gap-3 text-sm text-muted-foreground">
                <div
                  aria-hidden="true"
                  className="size-8 rounded-full border-2 border-primary/20 border-t-primary motion-safe:animate-spin"
                />
                <div>
                  {analyticsBuildStatus === "scheduled"
                    ? t("Preparing analytics")
                    : t("Building analytics")}
                </div>
              </div>
            </div>
          ) : (
            <div
              className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-2"
              data-demo-id="analytics-grid"
            >
              <AnalyticsList
                demoId="analytics-positions"
                emptyState={t("No positions found")}
                entries={analytics.positionCounts}
                onView={(entry) => openView("Positions", entry)}
                title={t("Positions")}
              />
              <AnalyticsList
                demoId="analytics-birthday-months"
                emptyState={t("No birth months found")}
                entries={analytics.birthdayMonthCounts}
                onView={(entry) => openView("Birth months", entry)}
                title={t("Birth months")}
              />
              <AnalyticsList
                demoId="analytics-birthday-dates"
                emptyState={t("No birthdays found")}
                entries={analytics.birthdayDateCounts}
                onView={(entry) => openView("Birthdays", entry)}
                title={t("Birthdays")}
              />
              <AnalyticsList
                demoId="analytics-first-names"
                emptyState={t("No first names found")}
                entries={analytics.firstNameCounts}
                onView={(entry) => openView("First names", entry)}
                title={t("First names")}
              />
              <AnalyticsList
                demoId="analytics-last-names"
                emptyState={t("No last names found")}
                entries={analytics.lastNameCounts}
                onView={(entry) => openView("Last names", entry)}
                title={t("Last names")}
              />
              <AnalyticsList
                className="lg:col-span-2"
                demoId="analytics-full-name-duplicates"
                emptyState={t("No duplicate full names")}
                entries={analytics.fullNameDuplicates}
                onView={(entry) => openView("Full names", entry)}
                title={t("Full names")}
              />
            </div>
          )}
        </div>
      </section>
      <Dialog
        onOpenChange={(open) => {
          if (open) return;

          setView(null);
          setViewSearchQuery("");
          setViewFilters(createEmptyEmployeeSearchFilters());
        }}
        open={Boolean(view)}
      >
        <DialogContent
          className="flex h-[min(760px,90dvh)] max-w-4xl flex-col"
          data-demo-id="analytics-employees-dialog"
        >
          <DialogHeader>
            <DialogTitle>
              {view ? `${t(view.groupTitleKey)}: ${getEntryLabel(view.entry)}` : null}
            </DialogTitle>
            <DialogDescription>
              {view ? (
                <>
                  {t("In group:")} {countText("employees", { count: view.entry.employees.length })}
                  {hasViewSearch && (
                    <>
                      {" "}
                      <span>· {countText("matches", { count: visibleViewEmployees.length })}</span>
                    </>
                  )}
                  .
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="flex flex-1 flex-col gap-3 overflow-hidden">
            {hasViewEmployees && (
              <EmployeeSearchInput
                ariaLabel={t("Search Employees")}
                dataDemoId="analytics-employees-search"
                filters={viewFilters}
                onFiltersChange={setViewFilters}
                onValueChange={setViewSearchQuery}
                placeholder={t("Search Employees")}
                positionButtonDemoId="analytics-employees-position-filter"
                positionOptions={employeePositionOptions}
                positionPopoverDemoId="analytics-employees-position-popover"
                tagOptions={employeeTagOptions}
                value={viewSearchQuery}
              />
            )}
            <EmployeeCardList
              className="min-h-0 flex-1 rounded-md border"
              dataDemoId="analytics-employees-dialog-list"
              employees={visibleViewEmployees}
              emptyState={
                hasViewSearch ? t("No Employees match the current search") : t("No Employees found")
              }
              name={(employee) => (
                <HighlightedText queryTokens={viewSearchTokens} text={employee.fullName} />
              )}
              resetKey={`analytics-view:${view?.groupTitleKey ?? ""}:${viewSearchQuery}:${getEmployeeSearchFiltersKey(viewFilters)}`}
              queryTokens={viewSearchTokens}
              subtitle={(employee) => (
                <EmployeeIdentity employee={employee} queryTokens={viewSearchTokens} />
              )}
              onUnitContextClick={(unitContext) => {
                store.selectUnitFromEmployeeCard(unitContext.unitId);
              }}
              unitContextsByEmployeeId={store.employeeUnitContextsByEmployeeId}
            />
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
});
