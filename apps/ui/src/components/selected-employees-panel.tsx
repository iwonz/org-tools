"use client";

import type { Employee, EmployeeId, UiOrgStructure } from "@org-tools/types";
import type { ReactNode } from "react";
import { HiOutlineTrash, HiOutlineUserMinus } from "react-icons/hi2";

import { EmployeeCardList, EmployeeIdentity } from "@/components/employee-card-list";
import { HighlightedText } from "@/components/highlighted-text";
import { MiddleDot } from "@/components/middle-dot";
import { type EmployeeSearchFilters, EmployeeSearchInput } from "@/components/search-controls";
import { Button } from "@/components/ui/button";
import { useAppFormatter, useCountText, useUiText } from "@/i18n/use-ui-text";
import type { EmployeeUnitContext } from "@/lib/employee-unit-contexts";
import { cn } from "@/lib/utils";

type SelectedEmployeesPanelProps = {
  canClear: boolean;
  clearDataDemoId?: string;
  className?: string;
  dataDemoId?: string;
  employeeActions: (employee: Employee) => ReactNode;
  employeePositionOptions: string[];
  employeeTagOptions: string[];
  emptyState: ReactNode;
  hasSearch: boolean;
  headerClassName?: string;
  hideHeaderWhenEmpty?: boolean;
  includePositions?: boolean;
  listClassName?: string;
  matchCountLabel?: (count: number) => ReactNode;
  onClear: () => void;
  filters: EmployeeSearchFilters;
  onFiltersChange: (filters: EmployeeSearchFilters) => void;
  onQueryChange: (query: string) => void;
  onRemoveVisibleEmployees: () => void;
  onUnitContextClick?: (unitContext: EmployeeUnitContext) => void;
  panelDataDemoId?: string;
  positionButtonDemoId?: string;
  positionPopoverDemoId?: string;
  query: string;
  queryTokens: string[];
  resetKey: string;
  selectedEmployeeCount: number;
  searchDataDemoId?: string;
  showSummary?: boolean;
  summaryItems?: ReactNode[];
  title: string;
  unitContextsByEmployeeId?: ReadonlyMap<EmployeeId, EmployeeUnitContext[]>;
  unitStructure?: UiOrgStructure;
  visibleEmployees: Employee[];
  visibleRemoveDataDemoId?: string;
  visibleRemoveLabel?: string;
  visibleRemoveSuffix?: (count: number) => ReactNode;
};

export function SelectedEmployeesPanel({
  canClear,
  clearDataDemoId,
  className = "flex min-h-0 min-w-0 flex-col bg-transparent",
  dataDemoId,
  employeeActions,
  employeePositionOptions,
  employeeTagOptions,
  emptyState,
  hasSearch,
  headerClassName,
  hideHeaderWhenEmpty = false,
  filters,
  includePositions = false,
  listClassName = "flex-1",
  matchCountLabel,
  onClear,
  onFiltersChange,
  onQueryChange,
  onRemoveVisibleEmployees,
  onUnitContextClick,
  panelDataDemoId,
  positionButtonDemoId,
  positionPopoverDemoId,
  query,
  queryTokens,
  resetKey,
  selectedEmployeeCount,
  searchDataDemoId,
  showSummary = true,
  summaryItems,
  title,
  unitContextsByEmployeeId,
  unitStructure,
  visibleEmployees,
  visibleRemoveDataDemoId,
  visibleRemoveLabel,
  visibleRemoveSuffix,
}: SelectedEmployeesPanelProps) {
  const t = useUiText();
  const countText = useCountText();
  const format = useAppFormatter();
  const resolvedVisibleRemoveSuffix = visibleRemoveSuffix ?? format.number;
  const resolvedMatchCountLabel = matchCountLabel ?? ((count) => countText("matches", { count }));
  const resolvedSummaryItems = summaryItems ?? [
    countText("employees", { count: selectedEmployeeCount }),
  ];
  const resolvedVisibleRemoveLabel = visibleRemoveLabel ?? t("Exclude matching Employees");
  const hasSearchContent = selectedEmployeeCount > 0;
  const showHeader = !hideHeaderWhenEmpty || hasSearchContent;
  const showSearchState = hasSearchContent && hasSearch;

  return (
    <div className={className} data-demo-id={panelDataDemoId}>
      {showHeader && (
        <div className={cn("grid shrink-0 gap-3 p-3", headerClassName)}>
          {hasSearchContent && (
            <EmployeeSearchInput
              ariaLabel={t("Search Employees")}
              filters={filters}
              onFiltersChange={onFiltersChange}
              onValueChange={onQueryChange}
              placeholder={t("Search Employees")}
              positionOptions={employeePositionOptions}
              tagOptions={employeeTagOptions}
              {...(unitStructure ? { unitStructure } : {})}
              value={query}
              {...(positionButtonDemoId ? { positionButtonDemoId } : {})}
              {...(positionPopoverDemoId ? { positionPopoverDemoId } : {})}
              {...(searchDataDemoId ? { dataDemoId: searchDataDemoId } : {})}
            />
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {showSummary && (
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{title}</div>
                <div className="mt-0.5 flex flex-wrap items-center text-xs text-muted-foreground">
                  {resolvedSummaryItems.map((summaryItem, index) => (
                    <span className="contents" key={String(index)}>
                      {index > 0 && <MiddleDot />}
                      <span>{summaryItem}</span>
                    </span>
                  ))}
                  {showSearchState && (
                    <>
                      <MiddleDot />
                      <span>{resolvedMatchCountLabel(visibleEmployees.length)}</span>
                    </>
                  )}
                </div>
              </div>
            )}
            <div
              className={cn(
                "flex flex-wrap items-center gap-2",
                !showSummary && "ml-auto justify-end",
              )}
            >
              <Button
                data-demo-id={clearDataDemoId}
                disabled={!canClear}
                onClick={onClear}
                size="sm"
                type="button"
                variant="outline"
              >
                <HiOutlineTrash />
                <span>{t("Clear")}</span>
              </Button>
              {showSearchState && visibleEmployees.length > 0 && (
                <Button
                  data-demo-id={visibleRemoveDataDemoId}
                  onClick={onRemoveVisibleEmployees}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <HiOutlineUserMinus />
                  <span>{resolvedVisibleRemoveLabel}</span>
                  <MiddleDot />
                  <span>{resolvedVisibleRemoveSuffix(visibleEmployees.length)}</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
      <EmployeeCardList
        actions={employeeActions}
        className={listClassName}
        employees={visibleEmployees}
        emptyState={emptyState}
        name={(employee) => <HighlightedText queryTokens={queryTokens} text={employee.fullName} />}
        queryTokens={queryTokens}
        resetKey={resetKey}
        subtitle={(employee) => (
          <EmployeeIdentity
            employee={employee}
            includePositions={includePositions}
            queryTokens={queryTokens}
          />
        )}
        {...(onUnitContextClick ? { onUnitContextClick } : {})}
        {...(unitContextsByEmployeeId ? { unitContextsByEmployeeId } : {})}
        {...(dataDemoId ? { dataDemoId } : {})}
      />
    </div>
  );
}
