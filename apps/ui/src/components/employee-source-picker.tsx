"use client";

import type { Employee, EmployeeId, UiOrgStructure } from "@org-tools/types";
import type { ReactNode } from "react";
import { HiOutlineUserGroup, HiOutlineUserMinus, HiOutlineUserPlus } from "react-icons/hi2";

import { EmployeeCardList, EmployeeIdentity } from "@/components/employee-card-list";
import { HighlightedText } from "@/components/highlighted-text";
import { MiddleDot } from "@/components/middle-dot";
import { type EmployeeSearchFilters, EmployeeSearchInput } from "@/components/search-controls";
import { SourceEmptyBody } from "@/components/source-empty-state";
import { Button } from "@/components/ui/button";
import { useAppFormatter, useUiText } from "@/i18n/use-ui-text";
import type { EmployeeUnitContext } from "@/lib/employee-unit-contexts";
import { cn } from "@/lib/utils";

type EmployeeSourcePickerProps = {
  addFoundCount: number;
  addFoundDataDemoId?: string;
  bulkActionsIconOnly?: boolean;
  bulkActionsClassName?: string;
  dataDemoId?: string;
  employeeActions: (employee: Employee) => ReactNode;
  employees: Employee[];
  emptyState?: ReactNode;
  excludeFoundDataDemoId?: string;
  hasSourceEmployees: boolean;
  includePositions?: boolean;
  listClassName?: string;
  listDataDemoId?: string;
  onUnitContextClick?: (unitContext: EmployeeUnitContext) => void;
  onAddFound: () => void;
  onExcludeFound: () => void;
  filters: EmployeeSearchFilters;
  onFiltersChange: (filters: EmployeeSearchFilters) => void;
  onQueryChange: (query: string) => void;
  positionButtonDemoId?: string;
  positionOptions: string[];
  positionPopoverDemoId?: string;
  query: string;
  queryTokens: string[];
  removeFoundCount: number;
  resetKey: string;
  searchClassName?: string;
  searchDataDemoId?: string;
  selected?: (employee: Employee) => boolean;
  tagOptions: string[];
  unitContextsByEmployeeId?: ReadonlyMap<EmployeeId, EmployeeUnitContext[]>;
  unitStructure?: UiOrgStructure;
};

export function EmployeeSourcePicker({
  addFoundCount,
  addFoundDataDemoId,
  bulkActionsIconOnly = false,
  bulkActionsClassName = "mt-2 flex shrink-0 justify-end gap-2",
  dataDemoId,
  employeeActions,
  employees,
  emptyState,
  excludeFoundDataDemoId,
  filters,
  hasSourceEmployees,
  includePositions = false,
  listClassName = "flex-1 bg-muted/20 p-0",
  listDataDemoId,
  onAddFound,
  onExcludeFound,
  onFiltersChange,
  onQueryChange,
  onUnitContextClick,
  positionButtonDemoId,
  positionOptions,
  positionPopoverDemoId,
  query,
  queryTokens,
  removeFoundCount,
  resetKey,
  searchClassName,
  searchDataDemoId,
  selected,
  tagOptions,
  unitContextsByEmployeeId,
  unitStructure,
}: EmployeeSourcePickerProps) {
  const t = useUiText();
  const format = useAppFormatter();
  const resolvedEmptyState = emptyState ?? (
    <SourceEmptyBody icon={<HiOutlineUserGroup className="size-5" />}>
      {t("No Employees found")}
    </SourceEmptyBody>
  );
  const hasBulkActions = hasSourceEmployees && (addFoundCount > 0 || removeFoundCount > 0);

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col" data-demo-id={dataDemoId}>
      {hasSourceEmployees && (
        <EmployeeSearchInput
          ariaLabel={t("Search Employees")}
          filters={filters}
          onFiltersChange={onFiltersChange}
          onValueChange={onQueryChange}
          placeholder={t("Search Employees")}
          positionOptions={positionOptions}
          tagOptions={tagOptions}
          {...(unitStructure ? { unitStructure } : {})}
          value={query}
          {...(positionButtonDemoId ? { positionButtonDemoId } : {})}
          {...(positionPopoverDemoId ? { positionPopoverDemoId } : {})}
          {...(searchDataDemoId ? { dataDemoId: searchDataDemoId } : {})}
          {...(searchClassName ? { className: searchClassName } : {})}
        />
      )}
      {hasBulkActions && (
        <div className={bulkActionsClassName}>
          {addFoundCount > 0 && (
            <Button
              aria-label={t("Add matching Employees: {count}", {
                count: format.number(addFoundCount),
              })}
              data-demo-id={addFoundDataDemoId}
              onClick={onAddFound}
              size={bulkActionsIconOnly ? "icon" : "sm"}
              title={t("Add matching Employees: {count}", { count: format.number(addFoundCount) })}
              type="button"
              variant="outline"
            >
              <HiOutlineUserPlus />
              {!bulkActionsIconOnly && (
                <>
                  <span>{t("Add")}</span>
                  <MiddleDot />
                  <span>{format.number(addFoundCount)}</span>
                </>
              )}
            </Button>
          )}
          {removeFoundCount > 0 && (
            <Button
              aria-label={t("Exclude matching Employees: {count}", {
                count: format.number(removeFoundCount),
              })}
              data-demo-id={excludeFoundDataDemoId}
              onClick={onExcludeFound}
              size={bulkActionsIconOnly ? "icon" : "sm"}
              title={t("Exclude matching Employees: {count}", {
                count: format.number(removeFoundCount),
              })}
              type="button"
              variant="outline"
            >
              <HiOutlineUserMinus />
              {!bulkActionsIconOnly && (
                <>
                  <span>{t("Remove")}</span>
                  <MiddleDot />
                  <span>{format.number(removeFoundCount)}</span>
                </>
              )}
            </Button>
          )}
        </div>
      )}
      <EmployeeCardList
        actions={employeeActions}
        className={cn(hasSourceEmployees && (hasBulkActions ? "mt-2" : "mt-3"), listClassName)}
        employees={employees}
        emptyState={resolvedEmptyState}
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
        {...(selected ? { selected } : {})}
        {...(unitContextsByEmployeeId ? { unitContextsByEmployeeId } : {})}
        {...(listDataDemoId ? { dataDemoId: listDataDemoId } : {})}
      />
    </section>
  );
}
