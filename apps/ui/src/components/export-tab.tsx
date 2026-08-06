"use client";

import type { Employee, EmployeeId, UiOrgStructure, Unit, UnitId } from "@org-tools/types";
import { observer } from "mobx-react-lite";
import { useCallback, useMemo, useState } from "react";
import {
  HiOutlineArrowRight,
  HiOutlineFolder,
  HiOutlineUserMinus,
  HiOutlineUserPlus,
  HiOutlineUsers,
} from "react-icons/hi2";

import { ActionIconButton } from "@/components/action-icon-button";
import { EmployeeSourcePicker } from "@/components/employee-source-picker";
import { ExportSettingsStep } from "@/components/export-settings-step";
import {
  createEmptyEmployeeSearchFilters,
  filterEmployeesBySearch,
  getEmployeeSearchFiltersKey,
  getSearchTokens,
  hasActiveEmployeeSearchFilters,
  UnitSearchInput,
} from "@/components/search-controls";
import { SelectedEmployeesPanel } from "@/components/selected-employees-panel";
import {
  SourceEmptyBody,
  SourceEmptyState,
  TopLevelEmptyState,
} from "@/components/source-empty-state";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UnitTree } from "@/components/unit-tree";
import { type UiTextKey, useCountText, useUiText } from "@/i18n/use-ui-text";
import {
  buildEmployeeUnitContextIndex,
  buildEmployeeUnitMembershipIndex,
} from "@/lib/employee-unit-contexts";
import {
  buildEmployeeExportRows,
  countEmployeeExportRows,
  createExportText as createExportTextValue,
  type ExportRow,
  validateExportFieldNames,
} from "@/lib/export-format";
import { copyTextToClipboard, downloadText } from "@/lib/org-file";
import { getVisibleUnitIdsForNameSearch } from "@/lib/unit-search";
import { useUnitEmployeeSummary } from "@/lib/unit-summary";
import type { ExportEmployeeFieldKey, ExportRowMode, ExportSelection } from "@/stores/org-store";
import { useOrgStore } from "@/stores/org-store-context";

type ExportSourceSection = "employees" | "units";

const emptyRowCountByMode = {
  allUnits: 0,
  firstUnit: 0,
} satisfies Record<ExportRowMode, number>;

const getSelectionId = (selection: ExportSelection) => selection.id;

const unitSelection = (unitId: UnitId): ExportSelection => ({
  id: `unit:${unitId}`,
  type: "unit",
  unitId,
});

const employeeSelection = (employeeId: EmployeeId): ExportSelection => ({
  employeeId,
  id: `employee:${employeeId}`,
  type: "employee",
});

function ExportSelectedEmployeesEmptyState() {
  const t = useUiText();
  return (
    <SourceEmptyBody
      icon={
        <span className="relative inline-flex size-6 items-center justify-center">
          <HiOutlineFolder className="absolute left-0 top-0 size-4" />
          <HiOutlineUsers className="absolute bottom-0 right-0 size-4" />
        </span>
      }
    >
      {t("Select a Unit or Employee")}
    </SourceEmptyBody>
  );
}

export const ExportTab = observer(() => {
  const store = useOrgStore();
  const t = useUiText();
  const countText = useCountText();
  const getUnitEmployeeSummary = useUnitEmployeeSummary();
  const exportViewId = store.exportSourceViewId;
  const units = useMemo<UiOrgStructure | null>(
    () => store.getOrgViewStructure(exportViewId),
    [exportViewId, store],
  );
  const [status, setStatus] = useState<UiTextKey | null>(null);
  const [isExportSettingsDialogOpen, setIsExportSettingsDialogOpen] = useState(false);
  const [sourceSection, setSourceSection] = useState<ExportSourceSection>("units");
  const [unitQuery, setUnitQuery] = useState("");
  const [employeeQuery, setEmployeeQuery] = useState("");
  const [selectedQuery, setSelectedQuery] = useState("");
  const [employeeFilters, setEmployeeFilters] = useState(createEmptyEmployeeSearchFilters);
  const [selectedFilters, setSelectedFilters] = useState(createEmptyEmployeeSearchFilters);
  const [expandedExportUnitIds, setExpandedExportUnitIds] = useState<Set<UnitId>>(
    () => new Set(units?.roots.map((root) => root.id) ?? []),
  );
  const activeTab = store.exportTabMode;
  const rowMode = store.exportRowMode;
  const selectedEmployeeFieldKeys = store.exportSelectedEmployeeFieldKeys;
  const selectedFlatUnitFieldKeys = store.exportSelectedFlatUnitFieldKeys;
  const selectedJsonUnitFieldKeys = store.exportSelectedJsonUnitFieldKeys;
  const exportFieldNames = store.exportFieldNames;
  const unitFullPathSeparator = store.exportUnitFullPathSeparator;
  const templateFormat = store.exportTemplateFormat;
  const selections = store.exportSelections;
  const excludedEmployeeIds = store.exportExcludedEmployeeIds;

  const employeeById = units?.indexes.employeesById;
  const unitsById = units?.indexes.unitsById;
  const unitOrderById = units?.indexes.unitOrderById;
  const employeePositionOptions = units?.indexes.positionOptions ?? [];
  const employeeTagOptions = units?.indexes.tagOptions ?? [];
  const employeeSearchDocumentByEmployeeId = units?.indexes.employeeSearchDocumentByEmployeeId;
  const employeeUnitContextsByEmployeeId = useMemo(
    () => buildEmployeeUnitContextIndex(units?.allEmployees ?? []),
    [units],
  );
  const employeeUnitMembershipsByEmployeeId = useMemo(
    () => buildEmployeeUnitMembershipIndex(units?.allEmployees ?? [], units?.indexes.unitsById),
    [units],
  );
  const unitQueryTokens = getSearchTokens(unitQuery);
  const employeeQueryTokens = getSearchTokens(employeeQuery);
  const selectedQueryTokens = getSearchTokens(selectedQuery);
  const visibleUnitIds = useMemo(
    () => getVisibleUnitIdsForNameSearch(units?.indexes.unitSearchDocuments, unitQueryTokens),
    [unitQueryTokens, units],
  );
  const hasVisibleUnits = visibleUnitIds === null || visibleUnitIds.size > 0;
  const selectionIdSet = useMemo(
    () => new Set(selections.map((selection) => selection.id)),
    [selections],
  );
  const selectedUnitSelectionIds = useMemo(
    () =>
      new Set(
        selections
          .filter((selection): selection is Extract<ExportSelection, { type: "unit" }> => {
            return selection.type === "unit";
          })
          .map((selection) => selection.unitId),
      ),
    [selections],
  );
  const selectedUnits = useMemo(
    () =>
      selections
        .filter(
          (selection): selection is Extract<ExportSelection, { type: "unit" }> =>
            selection.type === "unit",
        )
        .map((selection) => unitsById?.get(selection.unitId))
        .filter((unit): unit is Unit => Boolean(unit)),
    [selections, unitsById],
  );
  const selectedDirectEmployees = useMemo(
    () =>
      selections
        .filter(
          (selection): selection is Extract<ExportSelection, { type: "employee" }> =>
            selection.type === "employee",
        )
        .map((selection) => employeeById?.get(selection.employeeId))
        .filter((employee): employee is Employee => Boolean(employee)),
    [employeeById, selections],
  );
  const selectedDirectEmployeeIdSet = useMemo(
    () => new Set(selectedDirectEmployees.map((employee) => employee.id)),
    [selectedDirectEmployees],
  );
  const selectedEmployeeIds = useMemo(() => {
    if (!employeeById) return new Set<EmployeeId>();

    const excludedIds = new Set(excludedEmployeeIds);
    const nextSelectedEmployeeIds = new Set<EmployeeId>();
    const addEmployeeId = (employeeId: EmployeeId) => {
      if (!excludedIds.has(employeeId) && employeeById.has(employeeId)) {
        nextSelectedEmployeeIds.add(employeeId);
      }
    };

    for (const unit of selectedUnits) {
      for (const employeeId of unit.deepEmployeeIds) {
        addEmployeeId(employeeId);
      }
    }

    for (const employee of selectedDirectEmployees) {
      addEmployeeId(employee.id);
    }

    return nextSelectedEmployeeIds;
  }, [employeeById, excludedEmployeeIds, selectedDirectEmployees, selectedUnits]);
  const selectedEmployees = useMemo(
    () =>
      [...selectedEmployeeIds]
        .map((employeeId) => employeeById?.get(employeeId))
        .filter((employee): employee is Employee => Boolean(employee)),
    [employeeById, selectedEmployeeIds],
  );
  const visibleSelectedEmployees = useMemo(() => {
    if (!employeeSearchDocumentByEmployeeId) return [];

    return filterEmployeesBySearch({
      employeeSearchDocumentByEmployeeId,
      employeeUnitMembershipsByEmployeeId,
      employees: selectedEmployees,
      filters: selectedFilters,
      queryTokens: selectedQueryTokens,
    });
  }, [
    employeeSearchDocumentByEmployeeId,
    selectedEmployees,
    selectedFilters,
    selectedQueryTokens,
    employeeUnitMembershipsByEmployeeId,
  ]);
  const hasSelectedEmployeeSearch =
    selectedQueryTokens.length > 0 || hasActiveEmployeeSearchFilters(selectedFilters);
  const selectedEmployeeIdSet = selectedEmployeeIds;
  const foundEmployees = useMemo(() => {
    if (!employeeSearchDocumentByEmployeeId) return [];

    return filterEmployeesBySearch({
      employeeSearchDocumentByEmployeeId,
      employeeUnitMembershipsByEmployeeId,
      employees: units?.allEmployees ?? [],
      filters: employeeFilters,
      queryTokens: employeeQueryTokens,
    });
  }, [
    employeeFilters,
    employeeQueryTokens,
    employeeSearchDocumentByEmployeeId,
    employeeUnitMembershipsByEmployeeId,
    units,
  ]);
  const foundEmployeesToAdd = useMemo(
    () => foundEmployees.filter((employee) => !selectedEmployeeIdSet.has(employee.id)),
    [foundEmployees, selectedEmployeeIdSet],
  );
  const foundEmployeesToExclude = useMemo(
    () => foundEmployees.filter((employee) => selectedEmployeeIdSet.has(employee.id)),
    [foundEmployees, selectedEmployeeIdSet],
  );
  const rowCountByMode = useMemo(() => {
    if (!isExportSettingsDialogOpen || !unitOrderById) return emptyRowCountByMode;

    const countRows = (mode: ExportRowMode) =>
      selectedEmployees.reduce((totalCount, employee) => {
        return (
          totalCount +
          countEmployeeExportRows({
            isDirectlySelected: selectedDirectEmployeeIdSet.has(employee.id),
            mode,
            unitContexts: employeeUnitContextsByEmployeeId.get(employee.id) ?? [],
            unitOrderById,
          })
        );
      }, 0);

    return {
      allUnits: countRows("allUnits"),
      firstUnit: countRows("firstUnit"),
    } satisfies Record<ExportRowMode, number>;
  }, [
    employeeUnitContextsByEmployeeId,
    isExportSettingsDialogOpen,
    selectedDirectEmployeeIdSet,
    selectedEmployees,
    unitOrderById,
  ]);
  const rows = useMemo(() => {
    if (!isExportSettingsDialogOpen || !unitOrderById) return [];

    return selectedEmployees.flatMap((employee): ExportRow[] => {
      return buildEmployeeExportRows({
        employee,
        isDirectlySelected: selectedDirectEmployeeIdSet.has(employee.id),
        mode: rowMode,
        unitContexts: employeeUnitContextsByEmployeeId.get(employee.id) ?? [],
        unitOrderById,
      });
    });
  }, [
    employeeUnitContextsByEmployeeId,
    isExportSettingsDialogOpen,
    rowMode,
    selectedDirectEmployeeIdSet,
    selectedEmployees,
    unitOrderById,
  ]);
  const exportRecordCount =
    activeTab === "json" ? new Set(rows.map((row) => row.employee.id)).size : rows.length;
  const exportFieldNameValidation = useMemo(
    () =>
      validateExportFieldNames({
        fieldNames: exportFieldNames,
        selectedEmployeeFieldKeys,
        selectedFlatUnitFieldKeys,
        selectedJsonUnitFieldKeys,
        tabMode: activeTab,
      }),
    [
      activeTab,
      exportFieldNames,
      selectedEmployeeFieldKeys,
      selectedFlatUnitFieldKeys,
      selectedJsonUnitFieldKeys,
    ],
  );
  const hasSelectedEmployees = selectedEmployees.length > 0;
  const canExport = rows.length > 0 && exportFieldNameValidation.isValid;
  const createExportText = useCallback(
    () =>
      createExportTextValue({
        fieldNames: exportFieldNames,
        rows,
        selectedEmployeeFieldKeys,
        selectedFlatUnitFieldKeys,
        selectedJsonUnitFieldKeys,
        tabMode: activeTab,
        templateFormat,
        unitFullPathSeparator,
      }),
    [
      activeTab,
      exportFieldNames,
      rows,
      selectedEmployeeFieldKeys,
      selectedFlatUnitFieldKeys,
      selectedJsonUnitFieldKeys,
      templateFormat,
      unitFullPathSeparator,
    ],
  );
  const exportPreviewText = useMemo(
    () => (isExportSettingsDialogOpen && canExport ? createExportText() : ""),
    [canExport, createExportText, isExportSettingsDialogOpen],
  );
  const toggleEmployeeExportField = useCallback(
    (fieldKey: ExportEmployeeFieldKey) => {
      store.toggleExportEmployeeFieldKey(fieldKey);
    },
    [store],
  );

  const hasEmployeeSourceContent = (units?.allEmployees.length ?? 0) > 0;

  if (!units) return null;
  if (!hasEmployeeSourceContent) {
    return (
      <TopLevelEmptyState
        action={
          <Button onClick={() => store.setActiveTab("employees")} type="button">
            {t("Go to Employees")}
          </Button>
        }
        description={t("Add Employees before configuring an export.")}
        icon={<HiOutlineUsers className="size-6" />}
        title={t("No Employees to export")}
      />
    );
  }

  const toggleSelection = (selection: ExportSelection) => {
    if (selectionIdSet.has(selection.id)) {
      store.removeExportSelection(selection.id);
    } else {
      store.addExportSelection(selection);
    }
    setStatus(null);
  };

  const addUnitToExport = (unit: Unit) => {
    store.addExportSelection(unitSelection(unit.id));
    setStatus(null);
  };

  const excludeUnitFromExport = (unit: Unit) => {
    store.removeExportSelection(unitSelection(unit.id).id);
    setStatus(null);
  };

  const toggleExportUnit = (unitId: UnitId) => {
    setExpandedExportUnitIds((currentUnitIds) => {
      const nextUnitIds = new Set(currentUnitIds);

      if (nextUnitIds.has(unitId)) {
        nextUnitIds.delete(unitId);
      } else {
        nextUnitIds.add(unitId);
      }

      return nextUnitIds;
    });
  };

  const removeEmployee = (employee: Employee) => {
    store.removeEmployeeFromExport(employee.id);
    setStatus(null);
  };

  const addFoundEmployeesToExport = () => {
    store.addExportSelections(
      foundEmployeesToAdd.map((employee) => employeeSelection(employee.id)),
    );
    setStatus(null);
  };

  const excludeFoundEmployeesFromExport = () => {
    store.removeEmployeesFromExport(foundEmployeesToExclude.map((employee) => employee.id));
    setStatus(null);
  };

  const removeVisibleSelectedEmployees = () => {
    store.removeEmployeesFromExport(visibleSelectedEmployees.map((employee) => employee.id));
    setStatus(null);
  };

  const download = () => {
    if (!canExport) return;

    const extension = activeTab === "json" ? "json" : activeTab === "csv" ? "csv" : "txt";
    const type =
      activeTab === "json"
        ? "application/json;charset=utf-8"
        : activeTab === "csv"
          ? "text/csv;charset=utf-8"
          : "text/plain;charset=utf-8";

    downloadText(createExportText(), `org-tools-export.${extension}`, type);
    setStatus("File downloaded");
  };

  const copy = async () => {
    if (!canExport) return;

    await copyTextToClipboard(createExportText());
    setStatus("Copied to the clipboard");
  };

  const continueToSettings = () => {
    if (!hasSelectedEmployees) return;

    setIsExportSettingsDialogOpen(true);
    setStatus(null);
  };

  return (
    <section
      className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-transparent"
      data-demo-id="export-tab"
    >
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div
          className="grid h-full min-h-0 overflow-hidden pb-[86px]"
          data-demo-id="export-selection-grid"
          style={{
            gridTemplateColumns:
              sourceSection === "employees"
                ? "minmax(24rem, 42%) minmax(0, 1fr)"
                : "fit-content(70%) minmax(30%, 1fr)",
          }}
        >
          <aside className="flex min-h-0 min-w-0 flex-col border-r bg-transparent">
            {store.orgViewList.length > 1 && (
              <div className="p-2.5">
                <Select
                  onValueChange={(viewId) => {
                    store.selectExportOrgView(viewId);
                    setExpandedExportUnitIds(new Set());
                    store.clearExportSelection();
                    setStatus(null);
                  }}
                  value={exportViewId}
                >
                  <SelectTrigger aria-label={t("View to export")} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {store.orgViewList.map((view) => (
                      <SelectItem key={view.id} value={view.id}>
                        {view.kind === "main" ? t("Main") : view.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Tabs
              className="min-h-0 flex-1"
              onValueChange={(value) => setSourceSection(value as ExportSourceSection)}
              value={sourceSection}
            >
              <TabsList
                className="mx-2.5 mt-2.5 h-auto w-fit shrink-0"
                data-demo-id="export-source-tabs"
              >
                <TabsTrigger
                  className="h-auto min-h-8 px-2 text-xs"
                  data-demo-id="export-source-tab-units"
                  value="units"
                >
                  <HiOutlineFolder />
                  {t("Units")}
                </TabsTrigger>
                <TabsTrigger
                  className="h-auto min-h-8 px-2 text-xs"
                  data-demo-id="export-source-tab-employees"
                  value="employees"
                >
                  <HiOutlineUsers />
                  {t("Employees")}
                </TabsTrigger>
              </TabsList>
              {units.roots.length > 0 && (
                <TabsContent className="min-h-0" value="units">
                  <section
                    className="flex h-full min-h-0 min-w-0 flex-col"
                    data-demo-id="export-units-panel"
                  >
                    <UnitSearchInput
                      ariaLabel={t("Search Units by name")}
                      className="mx-2.5 mt-2.5"
                      dataDemoId="export-unit-search"
                      onValueChange={setUnitQuery}
                      placeholder={t("Search Units by name")}
                      value={unitQuery}
                    />
                    <ScrollArea className="mt-3 min-h-0 flex-1 bg-muted/20" scrollbars="none">
                      {hasVisibleUnits ? (
                        <ul
                          className="grid min-w-max gap-2 px-2.5 pb-3"
                          data-demo-id="export-unit-tree"
                        >
                          <UnitTree
                            actions={(unit) => {
                              const selection = unitSelection(unit.id);
                              const isSelected = selectionIdSet.has(getSelectionId(selection));

                              return (
                                <>
                                  <ActionIconButton
                                    disabled={isSelected}
                                    icon={<HiOutlineUserPlus />}
                                    label={t("Add Unit Employees to export")}
                                    onClick={() => addUnitToExport(unit)}
                                    tooltip={t("Add Employees from this Unit to export")}
                                  />
                                  <ActionIconButton
                                    disabled={!isSelected}
                                    icon={<HiOutlineUserMinus />}
                                    label={t("Exclude Unit Employees from export")}
                                    onClick={() => excludeUnitFromExport(unit)}
                                    tooltip={t("Exclude Employees from this Unit from export")}
                                  />
                                </>
                              );
                            }}
                            dataDemoId="export-unit-card"
                            employeesById={units.indexes.employeesById}
                            expandedUnitIds={expandedExportUnitIds}
                            onToggle={toggleExportUnit}
                            queryTokens={unitQueryTokens}
                            roots={units.roots}
                            selected={(unit) => selectedUnitSelectionIds.has(unit.id)}
                            subtitle={getUnitEmployeeSummary}
                            variant="compact"
                            visibleUnitIds={visibleUnitIds}
                          />
                        </ul>
                      ) : (
                        <SourceEmptyState icon={<HiOutlineFolder className="size-5" />}>
                          {t("No Units found")}
                        </SourceEmptyState>
                      )}
                    </ScrollArea>
                  </section>
                </TabsContent>
              )}
              {units.roots.length === 0 && (
                <TabsContent className="min-h-0" value="units">
                  <SourceEmptyState icon={<HiOutlineFolder className="size-5" />}>
                    {t("This View does not have any Units yet")}
                  </SourceEmptyState>
                </TabsContent>
              )}
              <TabsContent className="min-h-0" value="employees">
                <EmployeeSourcePicker
                  addFoundCount={foundEmployeesToAdd.length}
                  addFoundDataDemoId="export-add-found-employees"
                  bulkActionsIconOnly
                  bulkActionsClassName="mx-2.5 mb-2 mt-2 flex shrink-0 justify-end gap-2"
                  dataDemoId="export-employee-picker"
                  employeeActions={(employee) => {
                    const isSelected = selectedEmployeeIdSet.has(employee.id);

                    return (
                      <ActionIconButton
                        dataDemoId="export-toggle-employee"
                        disabled={false}
                        icon={isSelected ? <HiOutlineUserMinus /> : <HiOutlineUserPlus />}
                        label={
                          isSelected
                            ? t("Exclude Employee from export")
                            : t("Add Employee to export")
                        }
                        onClick={() => {
                          if (isSelected) {
                            removeEmployee(employee);
                          } else {
                            toggleSelection(employeeSelection(employee.id));
                          }
                        }}
                        tooltip={
                          isSelected
                            ? t("Exclude Employee from export")
                            : t("Add Employee to export")
                        }
                      />
                    );
                  }}
                  employees={foundEmployees}
                  excludeFoundDataDemoId="export-exclude-found-employees"
                  hasSourceEmployees={hasEmployeeSourceContent}
                  listClassName="flex-1 bg-muted/20 p-2"
                  listDataDemoId="export-employee-results"
                  onAddFound={addFoundEmployeesToExport}
                  onExcludeFound={excludeFoundEmployeesFromExport}
                  filters={employeeFilters}
                  onFiltersChange={setEmployeeFilters}
                  onQueryChange={setEmployeeQuery}
                  onUnitContextClick={(unitContext) => {
                    store.selectUnitFromOrgView(exportViewId, unitContext.unitId);
                  }}
                  positionButtonDemoId="export-employee-position-filter"
                  positionOptions={employeePositionOptions}
                  positionPopoverDemoId="export-employee-position-popover"
                  tagOptions={employeeTagOptions}
                  query={employeeQuery}
                  queryTokens={employeeQueryTokens}
                  removeFoundCount={foundEmployeesToExclude.length}
                  resetKey={`export-employee-search:${employeeQuery}:${getEmployeeSearchFiltersKey(employeeFilters)}`}
                  searchClassName="mx-2.5 mt-2.5"
                  searchDataDemoId="export-employee-search"
                  selected={(employee) => selectedEmployeeIdSet.has(employee.id)}
                  unitContextsByEmployeeId={employeeUnitContextsByEmployeeId}
                  unitStructure={units}
                />
              </TabsContent>
            </Tabs>
          </aside>
          <SelectedEmployeesPanel
            canClear={selections.length > 0 || excludedEmployeeIds.length > 0}
            className="flex min-h-0 min-w-0 flex-col bg-transparent"
            clearDataDemoId="export-clear-selected"
            dataDemoId="export-selected-employees"
            employeeActions={(employee) => (
              <Button
                onClick={() => removeEmployee(employee)}
                size="icon"
                title={t("Exclude from export")}
                type="button"
                variant="ghost"
              >
                <HiOutlineUserMinus />
              </Button>
            )}
            employeePositionOptions={employeePositionOptions}
            employeeTagOptions={employeeTagOptions}
            emptyState={<ExportSelectedEmployeesEmptyState />}
            filters={selectedFilters}
            hasSearch={hasSelectedEmployeeSearch}
            onClear={() => {
              store.clearExportSelection();
              setStatus(null);
            }}
            onFiltersChange={setSelectedFilters}
            onQueryChange={setSelectedQuery}
            onRemoveVisibleEmployees={removeVisibleSelectedEmployees}
            onUnitContextClick={(unitContext) => {
              store.selectUnitFromOrgView(exportViewId, unitContext.unitId);
            }}
            panelDataDemoId="export-selected-panel"
            positionButtonDemoId="export-selected-position-filter"
            positionPopoverDemoId="export-selected-position-popover"
            query={selectedQuery}
            queryTokens={selectedQueryTokens}
            resetKey={`export-selected-employees:${selectedQuery}:${getEmployeeSearchFiltersKey(selectedFilters)}`}
            searchDataDemoId="export-selected-search"
            selectedEmployeeCount={selectedEmployees.length}
            summaryItems={[countText("employees", { count: selectedEmployees.length })]}
            title={t("Selected Employees")}
            unitContextsByEmployeeId={employeeUnitContextsByEmployeeId}
            unitStructure={units}
            visibleEmployees={visibleSelectedEmployees}
            visibleRemoveDataDemoId="export-remove-visible-selected"
            visibleRemoveLabel={t("Exclude matches")}
            visibleRemoveSuffix={(count) => countText("employees", { count })}
          />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-[70px] items-center justify-center bg-gradient-to-t from-background via-background/90 to-background/0 px-6 backdrop-blur-sm">
          <Button
            className="pointer-events-auto h-12 min-w-72 text-base"
            data-demo-id="export-continue-button"
            disabled={!hasSelectedEmployees}
            onClick={continueToSettings}
            type="button"
          >
            {t("Continue")}
            <HiOutlineArrowRight />
          </Button>
        </div>
      </div>
      <Dialog
        onOpenChange={(open) => {
          setIsExportSettingsDialogOpen(open);
          setStatus(null);
        }}
        open={isExportSettingsDialogOpen}
      >
        <DialogContent
          className="flex h-[min(840px,calc(100dvh-32px))] max-w-6xl flex-col gap-0 overflow-hidden p-0"
          data-demo-id="export-settings-dialog"
        >
          <ExportSettingsStep
            canExport={canExport}
            fieldNameErrors={exportFieldNameValidation.errors}
            onEmployeeFieldToggle={toggleEmployeeExportField}
            onCopy={copy}
            onDownload={download}
            previewText={exportPreviewText}
            rowCount={exportRecordCount}
            rowCountByMode={rowCountByMode}
            selectedEmployeeCount={selectedEmployees.length}
            status={status ? t(status) : null}
          />
        </DialogContent>
      </Dialog>
    </section>
  );
});
