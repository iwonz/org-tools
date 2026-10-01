import type {
  AuthorizedOrganizationProjection,
  CustomEmployeeFieldDefinition,
  OrganizationDocument,
  OrganizationEmployee,
  OrgEditorUnit,
  OrgToolsViewDocument,
} from "@org-tools/types";

const own = (value: object, key: PropertyKey): boolean => Object.hasOwn(value, key);

const mergeVisibleCatalog = <T>(input: {
  candidate: readonly T[];
  current: readonly T[];
  key: (value: T) => string;
  visibleKeys: ReadonlySet<string>;
}): T[] => {
  const candidateByKey = new Map(input.candidate.map((value) => [input.key(value), value]));
  const currentKeys = new Set(input.current.map(input.key));
  return [
    ...input.current.flatMap((value) => {
      const key = input.key(value);
      if (!input.visibleKeys.has(key)) return [value];
      const replacement = candidateByKey.get(key);
      return replacement === undefined ? [] : [replacement];
    }),
    ...input.candidate.filter((value) => !currentKeys.has(input.key(value))),
  ];
};

const mergeEmployee = (
  current: OrganizationEmployee,
  baseline: AuthorizedOrganizationProjection["employees"][number],
  candidate: OrganizationEmployee,
  visibleCustomFieldIds: Set<string>,
  visibleTagIds: Set<string>,
): OrganizationEmployee => {
  const next = structuredClone(current);
  for (const key of [
    "avatarBase64Url",
    "birthday",
    "email",
    "firstName",
    "gender",
    "lastName",
    "phone",
    "profileUrl",
    "username",
  ] as const) {
    if (own(baseline, key)) next[key] = candidate[key] as never;
  }
  next.customFieldValues = Object.fromEntries(
    mergeVisibleCatalog({
      candidate: Object.entries(candidate.customFieldValues).filter(([id]) =>
        visibleCustomFieldIds.has(id),
      ),
      current: Object.entries(current.customFieldValues),
      key: ([id]) => id,
      visibleKeys: visibleCustomFieldIds,
    }),
  );
  next.tags = mergeVisibleCatalog({
    candidate: candidate.tags.filter((tag) => visibleTagIds.has(tag.tagId)),
    current: current.tags,
    key: (tag) => tag.tagId,
    visibleKeys: visibleTagIds,
  });
  next.updatedAt = candidate.updatedAt;
  return next;
};

const mergeUnit = (
  current: OrgEditorUnit,
  baseline: OrgEditorUnit,
  candidate: OrgEditorUnit,
  visibleEmployeeIds: Set<string>,
): OrgEditorUnit => {
  const baselineSlotIds = new Set(baseline.staffingSlots.map((slot) => slot.id));
  const bossEmployeeId =
    current.bossEmployeeId && !visibleEmployeeIds.has(current.bossEmployeeId)
      ? current.bossEmployeeId
      : candidate.bossEmployeeId;
  return {
    ...structuredClone(candidate),
    bossEmployeeId,
    employeeIds: mergeVisibleCatalog({
      candidate: candidate.employeeIds.filter((id) => visibleEmployeeIds.has(id)),
      current: current.employeeIds,
      key: (id) => id,
      visibleKeys: visibleEmployeeIds,
    }),
    employeePositions: mergeVisibleCatalog({
      candidate: candidate.employeePositions.filter((position) =>
        visibleEmployeeIds.has(position.employeeId),
      ),
      current: current.employeePositions,
      key: (position) => position.employeeId,
      visibleKeys: visibleEmployeeIds,
    }),
    staffingSlots: mergeVisibleCatalog({
      candidate: candidate.staffingSlots,
      current: current.staffingSlots,
      key: (slot) => slot.id,
      visibleKeys: baselineSlotIds,
    }),
  };
};

const mergeView = (
  current: OrgToolsViewDocument,
  baseline: OrgToolsViewDocument,
  candidate: OrgToolsViewDocument,
  visibleEmployeeIds: Set<string>,
): OrgToolsViewDocument => {
  const baselineUnits = new Map(baseline.structure.units.map((unit) => [unit.id, unit]));
  const currentUnits = new Map(current.structure.units.map((unit) => [unit.id, unit]));
  const candidateUnits = new Map(candidate.structure.units.map((unit) => [unit.id, unit]));
  const units: OrgEditorUnit[] = [];
  for (const currentUnit of current.structure.units) {
    const baselineUnit = baselineUnits.get(currentUnit.id);
    if (!baselineUnit) {
      units.push(structuredClone(currentUnit));
      continue;
    }
    const candidateUnit = candidateUnits.get(currentUnit.id);
    if (candidateUnit)
      units.push(mergeUnit(currentUnit, baselineUnit, candidateUnit, visibleEmployeeIds));
  }
  for (const candidateUnit of candidate.structure.units) {
    if (!currentUnits.has(candidateUnit.id)) units.push(structuredClone(candidateUnit));
  }
  const baselineElementIds = new Set(
    baseline.structure.canvasElements.map((element) => element.id),
  );
  const canvasElements = mergeVisibleCatalog({
    candidate: candidate.structure.canvasElements,
    current: current.structure.canvasElements,
    key: (element) => element.id,
    visibleKeys: baselineElementIds,
  });
  return {
    ...structuredClone(candidate),
    structure: { ...structuredClone(candidate.structure), canvasElements, units },
  } as OrgToolsViewDocument;
};

export const mergeAuthorizedProjection = (input: {
  baseline: AuthorizedOrganizationProjection;
  candidate: OrganizationDocument;
  current: OrganizationDocument;
}): OrganizationDocument => {
  const visibleFieldIds = new Set(input.baseline.employeeFieldDefinitions.map((field) => field.id));
  const visibleTagIds = new Set(input.baseline.tags.map((tag) => tag.id));
  const visibleEmployeeIds = new Set(input.baseline.employees.map((employee) => employee.id));
  const baselineEmployees = new Map(
    input.baseline.employees.map((employee) => [employee.id, employee]),
  );
  const currentEmployees = new Map(
    input.current.employees.map((employee) => [employee.id, employee]),
  );
  const candidateEmployees = new Map(
    input.candidate.employees.map((employee) => [employee.id, employee]),
  );
  const employees: OrganizationEmployee[] = [];
  for (const currentEmployee of input.current.employees) {
    const baselineEmployee = baselineEmployees.get(currentEmployee.id);
    if (!baselineEmployee) {
      employees.push(structuredClone(currentEmployee));
      continue;
    }
    const candidateEmployee = candidateEmployees.get(currentEmployee.id);
    if (candidateEmployee) {
      employees.push(
        mergeEmployee(
          currentEmployee,
          baselineEmployee,
          candidateEmployee,
          visibleFieldIds,
          visibleTagIds,
        ),
      );
    }
  }
  for (const employee of input.candidate.employees) {
    if (!currentEmployees.has(employee.id)) employees.push(structuredClone(employee));
  }

  const baselineViews = new Map(input.baseline.views.map((view) => [view.id, view]));
  const currentViews = new Map(input.current.views.map((view) => [view.id, view]));
  const candidateViews = new Map(input.candidate.views.map((view) => [view.id, view]));
  const views: OrgToolsViewDocument[] = [];
  for (const currentView of input.current.views) {
    const baselineView = baselineViews.get(currentView.id);
    if (!baselineView) {
      views.push(structuredClone(currentView));
      continue;
    }
    const candidateView = candidateViews.get(currentView.id);
    if (candidateView) {
      views.push(mergeView(currentView, baselineView, candidateView, visibleEmployeeIds));
    }
  }
  for (const view of input.candidate.views) {
    if (!currentViews.has(view.id)) views.push(structuredClone(view));
  }

  const currentFields = new Map(
    input.current.employeeFieldDefinitions.map((field) => [field.id, field]),
  );
  const baselineFields = new Map(
    input.baseline.employeeFieldDefinitions.map((field) => [field.id, field]),
  );
  const candidateFields = input.candidate.employeeFieldDefinitions.map((field) => {
    const baseline = baselineFields.get(field.id);
    const current = currentFields.get(field.id);
    if (
      field.kind === "template" &&
      baseline?.kind === "template" &&
      baseline.template === "" &&
      current?.kind === "template"
    ) {
      return { ...field, template: current.template } satisfies CustomEmployeeFieldDefinition;
    }
    return field;
  });
  return {
    employeeDisplayFormats: structuredClone(input.candidate.employeeDisplayFormats),
    employeeDisplayLineGaps: structuredClone(input.candidate.employeeDisplayLineGaps),
    employeeFieldDefinitions: mergeVisibleCatalog({
      candidate: candidateFields,
      current: input.current.employeeFieldDefinitions,
      key: (field) => field.id,
      visibleKeys: visibleFieldIds,
    }),
    employees,
    tags: mergeVisibleCatalog({
      candidate: input.candidate.tags,
      current: input.current.tags,
      key: (tag) => tag.id,
      visibleKeys: visibleTagIds,
    }),
    views,
  };
};
