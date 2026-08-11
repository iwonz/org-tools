"use client";

import type {
  Employee,
  EmployeeId,
  EmployeeLiveFilterRule,
  OrgEditorEmployeePosition,
  OrgEditorUnit,
  UiOrgStructure,
  UnitId,
} from "@org-tools/types";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  HiOutlineBolt,
  HiOutlineBuildingOffice2,
  HiOutlineStar,
  HiOutlineUserMinus,
  HiOutlineUserPlus,
  HiOutlineXMark,
} from "react-icons/hi2";

import { ActionIconButton } from "@/components/action-icon-button";
import { EmployeeCardList } from "@/components/employee-card-list";
import { EmployeeSourcePicker } from "@/components/employee-source-picker";
import {
  createEmptyEmployeeSearchFilters,
  type EmployeeSearchFilters,
  EmployeeSearchInput,
  getEmployeeSearchFiltersKey,
  getEmployeesForSearch,
  getSearchTokens,
} from "@/components/search-controls";
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
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { describeError, type UiMessageDescriptor } from "@/i18n/messages";
import { useAppFormatter, useCountText, useMessageText, useUiText } from "@/i18n/use-ui-text";
import { buildEmployeeUnitMembershipIndex } from "@/lib/employee-unit-contexts";
import {
  cloneEmployeeLiveFilterRule,
  createEmptyEmployeeLiveFilterRule,
  getInvalidLiveUnitDependencyIds,
  hasEmployeeLiveFilterCriteria,
} from "@/lib/live-unit-filter";
import {
  getDefaultLiveEmployeePosition,
  normalizeLivePositionOverrides,
} from "@/lib/live-unit-position";
import type {
  OrgEditorUnitConfiguration,
  OrgEditorUnitMemberAssignment,
} from "@/stores/org-editor-store";

type UnitMembershipMode = OrgEditorUnitConfiguration["membershipMode"];

type UnitDialogProps = {
  editorUnits: readonly OrgEditorUnit[];
  initialUnit?: OrgEditorUnit | null;
  onOpenChange: (open: boolean) => void;
  onSave: (configuration: OrgEditorUnitConfiguration) => void;
  open: boolean;
  parentName?: string | null;
  structure: UiOrgStructure;
};

const ruleToFilters = (rule: EmployeeLiveFilterRule): EmployeeSearchFilters => ({
  birthday: rule.birthday ? { ...rule.birthday } : null,
  includeWithoutTags: rule.includeWithoutTags,
  includeWithoutUnits: rule.includeWithoutUnits,
  selectedPositions: [...rule.selectedPositions],
  selectedTags: [...rule.selectedTags],
  selectedUnitIds: [...rule.selectedUnitIds],
});

const createRule = (query: string, filters: EmployeeSearchFilters): EmployeeLiveFilterRule => ({
  birthday: filters.birthday ? { ...filters.birthday } : null,
  includeWithoutTags: filters.includeWithoutTags,
  includeWithoutUnits: filters.includeWithoutUnits,
  query,
  selectedPositions: [...filters.selectedPositions],
  selectedTags: [...filters.selectedTags],
  selectedUnitIds: [...filters.selectedUnitIds],
});

const getInitialManualAssignments = (
  initialUnit: OrgEditorUnit | null | undefined,
  structure: UiOrgStructure,
): OrgEditorUnitMemberAssignment[] => {
  if (!initialUnit) return [];

  if (initialUnit.liveFilter) {
    return (structure.indexes.unitsById.get(initialUnit.id)?.directEmployeeIds ?? []).map(
      (employeeId) => ({
        employeeId,
        position:
          structure.indexes.employeesById
            .get(employeeId)
            ?.unitPositions.find((position) => position.unitId === initialUnit.id)?.position ??
          null,
      }),
    );
  }

  const positionByEmployeeId = new Map(
    initialUnit.employeePositions.map((position) => [position.employeeId, position.position]),
  );

  return initialUnit.employeeIds.map((employeeId) => ({
    employeeId,
    position: positionByEmployeeId.get(employeeId) ?? null,
  }));
};

export function UnitDialog({
  editorUnits,
  initialUnit = null,
  onOpenChange,
  onSave,
  open,
  parentName = null,
  structure,
}: UnitDialogProps) {
  const t = useUiText();
  const countText = useCountText();
  const format = useAppFormatter();
  const initialMode: UnitMembershipMode = initialUnit?.liveFilter ? "live" : "manual";
  const initialRule = initialUnit?.liveFilter ?? null;
  const [mode, setMode] = useState<UnitMembershipMode>(initialMode);
  const [name, setName] = useState(initialUnit?.name ?? t("New Unit"));
  const [manualAssignments, setManualAssignments] = useState<OrgEditorUnitMemberAssignment[]>(() =>
    getInitialManualAssignments(initialUnit, structure),
  );
  const [manualBossEmployeeId, setManualBossEmployeeId] = useState<EmployeeId | null>(
    initialMode === "manual" ? (initialUnit?.bossEmployeeId ?? null) : null,
  );
  const [manualDraftCaptured, setManualDraftCaptured] = useState(initialMode !== "live");
  const [manualQuery, setManualQuery] = useState("");
  const [manualFilters, setManualFilters] = useState(createEmptyEmployeeSearchFilters);
  const [liveQuery, setLiveQuery] = useState(initialRule?.query ?? "");
  const [liveFilters, setLiveFilters] = useState<EmployeeSearchFilters>(
    initialRule ? ruleToFilters(initialRule) : createEmptyEmployeeSearchFilters(),
  );
  const [liveBossEmployeeId, setLiveBossEmployeeId] = useState<EmployeeId | null>(
    initialMode === "live" ? (initialUnit?.bossEmployeeId ?? null) : null,
  );
  const [livePositionOverrides, setLivePositionOverrides] = useState<OrgEditorEmployeePosition[]>(
    () =>
      initialMode === "live"
        ? normalizeLivePositionOverrides(initialUnit?.employeePositions ?? [])
        : [],
  );
  const [pendingConfiguration, setPendingConfiguration] =
    useState<OrgEditorUnitConfiguration | null>(null);
  const [error, setError] = useState<UiMessageDescriptor | null>(null);
  const messageText = useMessageText();
  const deferredManualQuery = useDeferredValue(manualQuery);
  const deferredLiveQuery = useDeferredValue(liveQuery);
  const manualQueryTokens = useMemo(
    () => getSearchTokens(deferredManualQuery),
    [deferredManualQuery],
  );
  const liveQueryTokens = useMemo(() => getSearchTokens(deferredLiveQuery), [deferredLiveQuery]);
  const membershipsByEmployeeId = useMemo(
    () => buildEmployeeUnitMembershipIndex(structure.allEmployees, structure.indexes.unitsById),
    [structure.allEmployees, structure.indexes.unitsById],
  );
  const visibleManualEmployees = useMemo(
    () =>
      getEmployeesForSearch({
        employeeSearchDocumentByEmployeeId: structure.indexes.employeeSearchDocumentByEmployeeId,
        employeeUnitMembershipsByEmployeeId: membershipsByEmployeeId,
        employees: structure.indexes.employeesByName,
        filters: manualFilters,
        queryTokens: manualQueryTokens,
      }),
    [
      manualFilters,
      manualQueryTokens,
      membershipsByEmployeeId,
      structure.indexes.employeeSearchDocumentByEmployeeId,
      structure.indexes.employeesByName,
    ],
  );
  const visibleLiveEmployees = useMemo(
    () =>
      getEmployeesForSearch({
        employeeSearchDocumentByEmployeeId:
          structure.indexes.manualEmployeeSearchDocumentByEmployeeId,
        employeeUnitMembershipsByEmployeeId: membershipsByEmployeeId,
        employees: structure.indexes.employeesByName,
        filters: liveFilters,
        queryTokens: liveQueryTokens,
        unitAbsenceScope: "manual",
      }),
    [
      liveFilters,
      liveQueryTokens,
      membershipsByEmployeeId,
      structure.indexes.employeesByName,
      structure.indexes.manualEmployeeSearchDocumentByEmployeeId,
    ],
  );
  const manualAssignmentByEmployeeId = useMemo(
    () =>
      new Map(manualAssignments.map((assignment) => [assignment.employeeId, assignment] as const)),
    [manualAssignments],
  );
  const selectedManualEmployeeIdSet = useMemo(
    () => new Set(manualAssignments.map((assignment) => assignment.employeeId)),
    [manualAssignments],
  );
  const visibleLiveEmployeeIdSet = useMemo(
    () => new Set(visibleLiveEmployees.map((employee) => employee.id)),
    [visibleLiveEmployees],
  );
  const foundManualEmployeesToAdd = useMemo(
    () =>
      visibleManualEmployees.filter((employee) => !selectedManualEmployeeIdSet.has(employee.id)),
    [selectedManualEmployeeIdSet, visibleManualEmployees],
  );
  const foundManualEmployeesToRemove = useMemo(
    () => visibleManualEmployees.filter((employee) => selectedManualEmployeeIdSet.has(employee.id)),
    [selectedManualEmployeeIdSet, visibleManualEmployees],
  );
  const invalidDependencyIds = useMemo(
    () =>
      initialUnit
        ? getInvalidLiveUnitDependencyIds(editorUnits, initialUnit.id)
        : new Set<UnitId>(),
    [editorUnits, initialUnit],
  );
  const unavailableUnitIds = liveFilters.selectedUnitIds.filter(
    (selectedUnitId) => !structure.indexes.unitsById.has(selectedUnitId),
  );
  const currentLiveRule = createRule(liveQuery, liveFilters);
  const canSave =
    name.trim().length > 0 && (mode === "manual" || hasEmployeeLiveFilterCriteria(currentLiveRule));
  const liveBossEmployee = liveBossEmployeeId
    ? (structure.indexes.employeesById.get(liveBossEmployeeId) ?? null)
    : null;
  const livePositionOverrideByEmployeeId = useMemo(
    () =>
      new Map(
        livePositionOverrides.map(
          (positionOverride) => [positionOverride.employeeId, positionOverride] as const,
        ),
      ),
    [livePositionOverrides],
  );
  const getLivePositionBaseline = (employee: Employee) => {
    if (initialMode === "manual") {
      const manualAssignment = manualAssignmentByEmployeeId.get(employee.id);
      if (manualAssignment) return manualAssignment.position?.trim() || null;
    }

    return getDefaultLiveEmployeePosition({
      employee,
      rule: currentLiveRule,
      unitOrderById: structure.indexes.unitOrderById,
      unitsById: structure.indexes.unitsById,
    });
  };
  const getLivePositionDraft = (employee: Employee) => {
    const positionOverride = livePositionOverrideByEmployeeId.get(employee.id);

    return positionOverride
      ? (positionOverride.position ?? "")
      : (getLivePositionBaseline(employee) ?? "");
  };
  const getLivePositionOverridesForSave = () => {
    const overrideByEmployeeId = new Map(
      livePositionOverrides.map(
        (positionOverride) => [positionOverride.employeeId, positionOverride] as const,
      ),
    );

    if (initialMode === "manual") {
      for (const employee of visibleLiveEmployees) {
        if (overrideByEmployeeId.has(employee.id)) continue;
        const manualAssignment = manualAssignmentByEmployeeId.get(employee.id);
        if (!manualAssignment) continue;

        overrideByEmployeeId.set(employee.id, {
          employeeId: employee.id,
          position: manualAssignment.position?.trim() || null,
        });
      }
    }

    return normalizeLivePositionOverrides([...overrideByEmployeeId.values()]);
  };

  useEffect(() => {
    if (!open) return;

    const nextRule = initialRule
      ? cloneEmployeeLiveFilterRule(initialRule)
      : createEmptyEmployeeLiveFilterRule();
    setMode(initialMode);
    setName(initialUnit?.name ?? t("New Unit"));
    setManualAssignments(getInitialManualAssignments(initialUnit, structure));
    setManualBossEmployeeId(
      initialMode === "manual" ? (initialUnit?.bossEmployeeId ?? null) : null,
    );
    setManualDraftCaptured(initialMode !== "live");
    setManualQuery("");
    setManualFilters(createEmptyEmployeeSearchFilters());
    setLiveQuery(nextRule.query);
    setLiveFilters(ruleToFilters(nextRule));
    setLiveBossEmployeeId(initialMode === "live" ? (initialUnit?.bossEmployeeId ?? null) : null);
    setLivePositionOverrides(
      initialMode === "live"
        ? normalizeLivePositionOverrides(initialUnit?.employeePositions ?? [])
        : [],
    );
    setPendingConfiguration(null);
    setError(null);
  }, [initialMode, initialRule, initialUnit, open, structure, t]);

  useEffect(() => {
    if (manualBossEmployeeId !== null && !selectedManualEmployeeIdSet.has(manualBossEmployeeId)) {
      setManualBossEmployeeId(null);
    }
  }, [manualBossEmployeeId, selectedManualEmployeeIdSet]);

  useEffect(() => {
    if (liveBossEmployeeId !== null && !visibleLiveEmployeeIdSet.has(liveBossEmployeeId)) {
      setLiveBossEmployeeId(null);
    }
  }, [liveBossEmployeeId, visibleLiveEmployeeIdSet]);

  const updateManualAssignments = (
    update: (assignments: OrgEditorUnitMemberAssignment[]) => OrgEditorUnitMemberAssignment[],
  ) => {
    setManualAssignments(update);
  };

  const removeManualEmployeeIds = (employeeIds: Iterable<EmployeeId>) => {
    const employeeIdSet = new Set(employeeIds);
    updateManualAssignments((assignments) =>
      assignments.filter((assignment) => !employeeIdSet.has(assignment.employeeId)),
    );
  };

  const createConfiguration = (): OrgEditorUnitConfiguration =>
    mode === "manual"
      ? {
          assignments: manualAssignments,
          bossEmployeeId: manualBossEmployeeId,
          membershipMode: "manual",
          name: name.trim(),
        }
      : {
          bossEmployeeId: liveBossEmployeeId,
          liveFilter: currentLiveRule,
          membershipMode: "live",
          name: name.trim(),
          positionOverrides: getLivePositionOverridesForSave(),
        };

  const saveConfiguration = (configuration: OrgEditorUnitConfiguration) => {
    try {
      onSave(configuration);
      setPendingConfiguration(null);
      onOpenChange(false);
    } catch (saveError) {
      setPendingConfiguration(null);
      setError(describeError(saveError));
    }
  };

  const submit = () => {
    if (!canSave) return;

    const configuration = createConfiguration();
    if (initialUnit && initialMode !== configuration.membershipMode) {
      setPendingConfiguration(configuration);
      return;
    }
    saveConfiguration(configuration);
  };

  const changeMode = (nextValue: string) => {
    const nextMode = nextValue === "live" ? "live" : "manual";

    if (
      nextMode === "manual" &&
      mode === "live" &&
      initialMode === "live" &&
      !manualDraftCaptured
    ) {
      const nextAssignments = visibleLiveEmployees.map((employee) => ({
        employeeId: employee.id,
        position: getLivePositionDraft(employee),
      }));
      const nextEmployeeIdSet = new Set(nextAssignments.map((assignment) => assignment.employeeId));
      setManualAssignments(nextAssignments);
      setManualBossEmployeeId(
        liveBossEmployeeId !== null && nextEmployeeIdSet.has(liveBossEmployeeId)
          ? liveBossEmployeeId
          : null,
      );
      setManualDraftCaptured(true);
    }

    if (
      nextMode === "live" &&
      liveBossEmployeeId === null &&
      manualBossEmployeeId !== null &&
      visibleLiveEmployeeIdSet.has(manualBossEmployeeId)
    ) {
      setLiveBossEmployeeId(manualBossEmployeeId);
    }

    setMode(nextMode);
  };

  return (
    <>
      <Dialog onOpenChange={onOpenChange} open={open}>
        <DialogContent
          className="h-[min(840px,calc(100dvh-2rem))] max-w-5xl grid-rows-[auto_minmax(0,1fr)_auto] p-0"
          data-demo-id="unit-dialog"
        >
          <DialogHeader>
            <DialogTitle>{initialUnit ? t("Edit Unit") : t("Add Unit")}</DialogTitle>
          </DialogHeader>
          <DialogBody className="flex min-h-0 flex-col gap-4 overflow-hidden">
            <div className="grid shrink-0 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="unit-dialog-name">{t("Name")}</Label>
                <Input
                  autoFocus
                  id="unit-dialog-name"
                  onChange={(event) => setName(event.currentTarget.value)}
                  placeholder={t("Unit name")}
                  value={name}
                />
              </div>
              <div className="text-xs text-muted-foreground">
                {parentName ? t("Parent: {name}", { name: parentName }) : t("Root level")}
              </div>
              <div className="grid gap-2">
                <Label>{t("Membership mode")}</Label>
                <Tabs onValueChange={changeMode} value={mode}>
                  <TabsList
                    aria-label={t("Unit membership mode")}
                    className="grid w-full grid-cols-2"
                    data-demo-id="unit-mode-switcher"
                  >
                    <TabsTrigger className="w-full" value="manual">
                      <HiOutlineBuildingOffice2 />
                      {t("Static")}
                    </TabsTrigger>
                    <TabsTrigger className="w-full" value="live">
                      <HiOutlineBolt />
                      {t("Live")}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            {mode === "manual" ? (
              <EmployeeSourcePicker
                addFoundCount={foundManualEmployeesToAdd.length}
                dataDemoId="unit-manual-picker"
                employeeActions={(employee) => {
                  const assignment = manualAssignmentByEmployeeId.get(employee.id);

                  if (!assignment) {
                    return (
                      <ActionIconButton
                        disabled={false}
                        icon={<HiOutlineUserPlus />}
                        label={t("Add Employee")}
                        onClick={() =>
                          updateManualAssignments((assignments) => [
                            ...assignments,
                            { employeeId: employee.id, position: null },
                          ])
                        }
                        tooltip={t("Add Employee to Unit")}
                      />
                    );
                  }

                  return (
                    <>
                      <Input
                        aria-label={t("Employee position {name} in Unit", {
                          name: employee.fullName,
                        })}
                        className="h-8 w-40"
                        data-demo-id="unit-member-position"
                        onChange={(event) => {
                          const position = event.currentTarget.value;
                          updateManualAssignments((assignments) =>
                            assignments.map((currentAssignment) =>
                              currentAssignment.employeeId === employee.id
                                ? { ...currentAssignment, position }
                                : currentAssignment,
                            ),
                          );
                        }}
                        onClick={(event) => event.stopPropagation()}
                        placeholder={t("Position")}
                        value={assignment.position ?? ""}
                      />
                      <Button
                        aria-label={
                          manualBossEmployeeId === employee.id ? t("Remove boss") : t("Make boss")
                        }
                        onClick={(event) => {
                          event.stopPropagation();
                          setManualBossEmployeeId((currentEmployeeId) =>
                            currentEmployeeId === employee.id ? null : employee.id,
                          );
                        }}
                        size="icon"
                        title={
                          manualBossEmployeeId === employee.id
                            ? t("Remove boss")
                            : t("Make Unit boss")
                        }
                        type="button"
                        variant={manualBossEmployeeId === employee.id ? "secondary" : "ghost"}
                      >
                        <HiOutlineStar />
                      </Button>
                      <ActionIconButton
                        disabled={false}
                        icon={<HiOutlineUserMinus />}
                        label={t("Remove Employee")}
                        onClick={() => removeManualEmployeeIds([employee.id])}
                        tooltip={t("Remove Employee from Unit")}
                      />
                    </>
                  );
                }}
                employees={visibleManualEmployees}
                filters={manualFilters}
                hasSourceEmployees={structure.indexes.employeesByName.length > 0}
                listClassName="flex-1 bg-transparent px-1 py-0"
                listDataDemoId="unit-manual-results"
                onAddFound={() =>
                  updateManualAssignments((assignments) => [
                    ...assignments,
                    ...foundManualEmployeesToAdd.map((employee) => ({
                      employeeId: employee.id,
                      position: null,
                    })),
                  ])
                }
                onExcludeFound={() =>
                  removeManualEmployeeIds(
                    foundManualEmployeesToRemove.map((employee) => employee.id),
                  )
                }
                onFiltersChange={setManualFilters}
                onQueryChange={setManualQuery}
                positionButtonDemoId="unit-manual-filter-button"
                positionOptions={structure.indexes.positionOptions}
                positionPopoverDemoId="unit-manual-filter-popover"
                query={manualQuery}
                queryTokens={manualQueryTokens}
                removeFoundCount={foundManualEmployeesToRemove.length}
                resetKey={`unit-manual:${deferredManualQuery}:${getEmployeeSearchFiltersKey(manualFilters)}:${manualAssignments.length}`}
                searchDataDemoId="unit-manual-search"
                selected={(employee) => selectedManualEmployeeIdSet.has(employee.id)}
                tagOptions={structure.indexes.tagOptions}
                unitStructure={structure}
              />
            ) : (
              <div className="flex min-h-0 flex-1 flex-col gap-3">
                <EmployeeSearchInput
                  ariaLabel={t("Live Employee filter")}
                  dataDemoId="live-unit-employee-search"
                  excludedUnitIds={invalidDependencyIds}
                  filters={liveFilters}
                  onFiltersChange={setLiveFilters}
                  onValueChange={setLiveQuery}
                  placeholder={t("Search Employees")}
                  positionButtonDemoId="live-unit-filter-button"
                  positionOptions={structure.indexes.manualPositionOptions}
                  positionPopoverDemoId="live-unit-filter-popover"
                  preserveUnavailableUnitIds
                  tagOptions={structure.indexes.tagOptions}
                  unitStructure={structure}
                  value={liveQuery}
                />
                {unavailableUnitIds.length > 0 && (
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    {t(
                      "Unavailable Unit references: {count}. They remain in the rule and do not expand the result.",
                      {
                        count: format.number(unavailableUnitIds.length),
                      },
                    )}
                  </p>
                )}
                <div className="flex shrink-0 items-center justify-between gap-3">
                  <div className="text-sm font-medium">
                    {t("Matches:")} {format.number(visibleLiveEmployees.length)}
                  </div>
                  {liveBossEmployee && (
                    <div className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
                      <span className="truncate">
                        {t("Boss: {name}", { name: liveBossEmployee.fullName })}
                      </span>
                      <ActionIconButton
                        disabled={false}
                        icon={<HiOutlineXMark />}
                        label={t("Remove boss")}
                        onClick={() => setLiveBossEmployeeId(null)}
                        tooltip={t("Remove boss")}
                      />
                    </div>
                  )}
                </div>
                <EmployeeCardList
                  actions={(employee: Employee) => (
                    <>
                      <Input
                        aria-label={t("Employee position {name} in Live Unit", {
                          name: employee.fullName,
                        })}
                        className="h-8 w-40"
                        data-demo-id="live-unit-member-position"
                        onChange={(event) => {
                          const position = event.currentTarget.value;
                          const normalizedPosition = position.trim() || null;
                          const baselinePosition = getLivePositionBaseline(employee);

                          setLivePositionOverrides((currentOverrides) => {
                            const nextOverrides = currentOverrides.filter(
                              (currentOverride) => currentOverride.employeeId !== employee.id,
                            );

                            return normalizedPosition === baselinePosition
                              ? nextOverrides
                              : [
                                  ...nextOverrides,
                                  {
                                    employeeId: employee.id,
                                    position: normalizedPosition,
                                  },
                                ];
                          });
                        }}
                        onClick={(event) => event.stopPropagation()}
                        placeholder={t("Position")}
                        value={getLivePositionDraft(employee)}
                      />
                      <ActionIconButton
                        disabled={liveBossEmployeeId === employee.id}
                        icon={<HiOutlineStar />}
                        label={t("Make boss")}
                        onClick={() => setLiveBossEmployeeId(employee.id)}
                        tooltip={
                          liveBossEmployeeId === employee.id
                            ? t("Employee is the boss")
                            : t("Make boss of Live Unit")
                        }
                      />
                    </>
                  )}
                  bossUnitId={initialUnit?.id ?? null}
                  cardClassName="bg-transparent"
                  className="flex-1"
                  dataDemoId="live-unit-preview"
                  employees={visibleLiveEmployees}
                  emptyState={t("No Employees currently match this filter")}
                  queryTokens={liveQueryTokens}
                  resetKey={`live-unit:${deferredLiveQuery}:${JSON.stringify(liveFilters)}`}
                  variant="compact"
                />
              </div>
            )}
            {error && <p className="shrink-0 text-sm text-destructive">{messageText(error)}</p>}
          </DialogBody>
          <DialogFooter className="items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              {mode === "manual"
                ? countText("selectedEmployees", { count: manualAssignments.length })
                : `${t("Matches:")} ${format.number(visibleLiveEmployees.length)}`}
            </div>
            <div className="flex gap-2">
              <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
                {t("Cancel")}
              </Button>
              <Button data-demo-id="unit-dialog-submit" disabled={!canSave} onClick={submit}>
                {t("Save")}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        onOpenChange={(confirmationOpen) => {
          if (!confirmationOpen) setPendingConfiguration(null);
        }}
        open={pendingConfiguration !== null}
      >
        <AlertDialogContent data-demo-id="unit-mode-confirmation">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Change Unit mode?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingConfiguration?.membershipMode === "live"
                ? countText("manualToLive", { count: manualAssignments.length })
                : countText("liveToManual", { count: manualAssignments.length })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Go back")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingConfiguration) saveConfiguration(pendingConfiguration);
              }}
            >
              {t("Change mode")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
