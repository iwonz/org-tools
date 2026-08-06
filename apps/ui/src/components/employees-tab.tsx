"use client";

import type { Employee } from "@org-tools/types";
import { observer } from "mobx-react-lite";
import { useDeferredValue, useMemo, useState } from "react";
import {
  HiOutlinePencilSquare,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineUsers,
} from "react-icons/hi2";

import { EmployeeCardList, EmployeeIdentity } from "@/components/employee-card-list";
import { EmployeeDialog } from "@/components/employee-dialog";
import { EmployeeTagPopover } from "@/components/employee-tag-picker";
import { HighlightedText } from "@/components/highlighted-text";
import {
  createEmptyEmployeeSearchFilters,
  EmployeeSearchInput,
  getEmployeeSearchFiltersKey,
  getEmployeesForSearch,
  getSearchTokens,
  hasActiveEmployeeSearchFilters,
} from "@/components/search-controls";
import { TopLevelEmptyState } from "@/components/source-empty-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useCountText, useUiText } from "@/i18n/use-ui-text";
import { useOrgStore } from "@/stores/org-store-context";

export const EmployeesTab = observer(() => {
  const store = useOrgStore();
  const t = useUiText();
  const countText = useCountText();
  const units = store.units;
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState(createEmptyEmployeeSearchFilters);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  const deferredQuery = useDeferredValue(query);
  const queryTokens = useMemo(() => getSearchTokens(deferredQuery), [deferredQuery]);
  const sortedEmployees = units?.indexes.employeesByName ?? [];
  const hasSearch = queryTokens.length > 0 || hasActiveEmployeeSearchFilters(filters);
  const visibleEmployees = useMemo(() => {
    if (!units) return [];

    return getEmployeesForSearch({
      employeeSearchDocumentByEmployeeId: units.indexes.employeeSearchDocumentByEmployeeId,
      employeeUnitMembershipsByEmployeeId: store.employeeUnitMembershipsByEmployeeId,
      employees: sortedEmployees,
      filters,
      queryTokens,
    });
  }, [filters, queryTokens, sortedEmployees, store.employeeUnitMembershipsByEmployeeId, units]);

  if (!units) return null;

  return (
    <section
      className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-transparent"
      data-demo-id="employees-tab"
    >
      {sortedEmployees.length > 0 && (
        <div
          className="flex min-h-16 shrink-0 flex-wrap items-center gap-3 px-4 py-3"
          data-demo-id="employees-header"
        >
          <div className="min-w-fit shrink-0" data-demo-id="employees-summary">
            <div className="text-sm font-medium">{t("Employees")}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              <span data-demo-id="employees-total-count">
                {countText("employees", { count: sortedEmployees.length })}
              </span>
              {hasSearch && (
                <>
                  {" "}
                  <span data-demo-id="employees-match-count">
                    · {countText("matches", { count: visibleEmployees.length })}
                  </span>
                </>
              )}
            </div>
          </div>
          <EmployeeSearchInput
            ariaLabel={t("Search Employees")}
            className="min-w-56 flex-1"
            dataDemoId="employees-search"
            filters={filters}
            onFiltersChange={setFilters}
            onValueChange={setQuery}
            placeholder={t("Search Employees")}
            positionButtonDemoId="employees-position-filter"
            positionOptions={units.indexes.positionOptions}
            positionPopoverDemoId="employees-position-popover"
            tagOptions={units.indexes.tagOptions}
            value={query}
          />
          <Button
            data-demo-id="employee-create-button"
            onClick={() => setIsCreateOpen(true)}
            type="button"
          >
            <HiOutlinePlus />
            {t("Create")}
          </Button>
        </div>
      )}
      {sortedEmployees.length === 0 ? (
        <TopLevelEmptyState
          action={
            <Button
              data-demo-id="employee-create-button"
              onClick={() => setIsCreateOpen(true)}
              type="button"
            >
              <HiOutlinePlus />
              {t("Create Employee")}
            </Button>
          }
          description={t("Create the first Employee to start building your organization.")}
          icon={<HiOutlineUsers className="size-6" />}
          title={t("No Employees yet")}
        />
      ) : (
        <EmployeeCardList
          actions={(employee) => {
            return (
              <>
                <EmployeeTagPopover
                  dataDemoId="employees-tag-picker"
                  employee={employee}
                  onApply={store.updateEmployeeTags}
                  tagOptions={units.indexes.tagOptions}
                />
                <Button
                  data-demo-id="employee-edit-button"
                  onClick={() => setEditingEmployee(employee)}
                  size="icon"
                  title={t("Edit")}
                  type="button"
                  variant="ghost"
                >
                  <HiOutlinePencilSquare />
                </Button>
                <Button
                  onClick={() => setDeletingEmployee(employee)}
                  size="icon"
                  title={t("Delete")}
                  type="button"
                  variant="ghost"
                >
                  <HiOutlineTrash />
                </Button>
              </>
            );
          }}
          className="flex-1"
          dataDemoId="employees-list"
          employees={visibleEmployees}
          emptyState={hasSearch ? t("No Employees found") : t("No Employees yet")}
          name={(employee) => (
            <HighlightedText queryTokens={queryTokens} text={employee.fullName} />
          )}
          onUnitContextClick={(unitContext) => {
            store.selectUnitFromEmployeeCard(unitContext.unitId);
          }}
          resetKey={`employees:${deferredQuery}:${getEmployeeSearchFiltersKey(filters)}`}
          queryTokens={queryTokens}
          subtitle={(employee) => (
            <EmployeeIdentity employee={employee} queryTokens={queryTokens} />
          )}
          unitContextsByEmployeeId={store.employeeUnitContextsByEmployeeId}
        />
      )}
      {isCreateOpen && (
        <EmployeeDialog
          mode="global"
          onOpenChange={setIsCreateOpen}
          onSave={(fields, memberships) => store.createEmployee(fields, memberships)}
          open={isCreateOpen}
          tagOptions={units.indexes.tagOptions}
          units={units}
        />
      )}
      {editingEmployee && (
        <EmployeeDialog
          employee={editingEmployee}
          mode="global"
          onOpenChange={(open) => !open && setEditingEmployee(null)}
          onSave={(fields, memberships) =>
            store.updateEmployee(editingEmployee.id, fields, memberships)
          }
          open={Boolean(editingEmployee)}
          tagOptions={units.indexes.tagOptions}
          units={units}
        />
      )}
      <AlertDialog
        onOpenChange={(open) => !open && setDeletingEmployee(null)}
        open={Boolean(deletingEmployee)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Delete Employee?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingEmployee
                ? t(
                    "Employee {name} will be removed from the global catalog and Main. Custom Views will keep a local copy.",
                    {
                      name: deletingEmployee.fullName,
                    },
                  )
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              data-demo-id="confirm-delete-employee"
              onClick={() => {
                if (deletingEmployee) {
                  store.deleteWorkspaceEmployee(deletingEmployee.id);
                }
                setDeletingEmployee(null);
              }}
            >
              {t("Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
});
