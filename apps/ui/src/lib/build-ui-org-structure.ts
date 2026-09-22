import type {
  CustomEmployeeFieldDefinition,
  DatedTagEvent,
  Employee,
  EmployeeId,
  EmployeeSearchDocument,
  EmployeeTagDefinition,
  UiOrgStructure,
  Unit,
  UnitId,
  UnitPath,
} from "@org-tools/types";

import { getEmployeeTagOptionsFromSearchDocuments } from "@/lib/employee-tags";
import {
  createEmployeeSearchDocument,
  createUnitSearchDocument,
  getPositionOptionsFromSearchDocuments,
} from "@/lib/search-index";
import { createTagOrderIndex } from "@/lib/tag-order";

export const UI_UNIT_PATH_SEPARATOR = " · ";

export const createUnitPath = (
  parentPath: UnitPath | null,
  unitId: UnitId,
  unitName: string,
): UnitPath => {
  const ids = [...(parentPath?.ids ?? []), unitId];
  const names = [...(parentPath?.names ?? []), unitName];

  return { fullName: names.join(UI_UNIT_PATH_SEPARATOR), ids, names };
};

const compareEmployeesByName = (firstEmployee: Employee, secondEmployee: Employee) =>
  firstEmployee.fullName.localeCompare(secondEmployee.fullName, "en", {
    numeric: true,
    sensitivity: "base",
  });

export const createUiOrgStructure = ({
  allEmployees,
  deepEmployees,
  deepUnits,
  employeesById,
  employeeSearchDocuments: suppliedEmployeeSearchDocuments,
  manualEmployeeSearchDocuments: suppliedManualEmployeeSearchDocuments,
  roots,
  tagDefinitions = [],
  customFieldDefinitions = [],
  unitsById,
}: {
  allEmployees: Employee[];
  deepEmployees: Employee[];
  deepUnits: Unit[];
  employeesById: Map<EmployeeId, Employee>;
  employeeSearchDocuments?: EmployeeSearchDocument[];
  manualEmployeeSearchDocuments?: EmployeeSearchDocument[];
  roots: Unit[];
  tagDefinitions?: readonly EmployeeTagDefinition[];
  customFieldDefinitions?: readonly CustomEmployeeFieldDefinition[];
  unitsById: Map<UnitId, Unit>;
}): UiOrgStructure => {
  const unitOrderById = new Map(deepUnits.map((unit, index) => [unit.id, index]));
  const employeeSearchDocuments =
    suppliedEmployeeSearchDocuments ??
    allEmployees.map((employee) => createEmployeeSearchDocument(employee, customFieldDefinitions));
  const manualEmployeeSearchDocuments =
    suppliedManualEmployeeSearchDocuments ?? employeeSearchDocuments;
  const employeeSearchDocumentByEmployeeId = new Map(
    employeeSearchDocuments.map((document) => [document.employeeId, document]),
  );
  const manualEmployeeSearchDocumentByEmployeeId = new Map(
    manualEmployeeSearchDocuments.map((document) => [document.employeeId, document]),
  );
  const birthdayEmployeesByKey = new Map<string, Employee[]>();
  const datedTagEventsByDate = new Map<string, DatedTagEvent[]>();
  const datedTagGroupByNormalizedLabel = new Map<
    string,
    {
      color: EmployeeTagDefinition["color"];
      events: DatedTagEvent[];
      label: string;
      normalizedLabel: string;
      source: DatedTagEvent["source"];
    }
  >();
  const bossEmployeeIds = new Set<EmployeeId>();

  for (const employee of allEmployees) {
    const birthdayKey = employeeSearchDocumentByEmployeeId.get(employee.id)?.birthdayKey;
    if (birthdayKey) {
      const birthdayEmployees = birthdayEmployeesByKey.get(birthdayKey) ?? [];
      birthdayEmployees.push(employee);
      birthdayEmployeesByKey.set(birthdayKey, birthdayEmployees);
    }
    for (const tag of employee.tags) {
      if (!tag.date || !tag.tagId) continue;
      const event: DatedTagEvent = {
        color: tag.color ?? null,
        date: tag.date,
        employee,
        label: tag.label,
        source: { kind: "tag", tagId: tag.tagId },
      };
      const dateEvents = datedTagEventsByDate.get(tag.date) ?? [];
      dateEvents.push(event);
      datedTagEventsByDate.set(tag.date, dateEvents);
      const normalizedLabel = tag.label.toLocaleLowerCase("en-US");
      const group = datedTagGroupByNormalizedLabel.get(normalizedLabel) ?? {
        events: [],
        label: tag.label,
        normalizedLabel,
        color: tag.color ?? null,
        source: { kind: "tag", tagId: tag.tagId },
      };
      group.events.push(event);
      datedTagGroupByNormalizedLabel.set(normalizedLabel, group);
    }
    for (const definition of customFieldDefinitions) {
      if (definition.kind !== "composite") continue;
      const value = employee.customFieldValues[definition.id];
      if (!Array.isArray(value)) continue;
      const primary = definition.fields.find((field) => field.id === definition.primaryFieldId);
      if (!primary) continue;
      for (const record of value) {
        if (typeof record !== "object" || record === null || Array.isArray(record)) continue;
        const primaryValue = record[primary.id];
        const primaryLabel =
          primary.valueType === "option"
            ? primary.options.find((option) => option.id === primaryValue)?.label
            : primaryValue === null || primaryValue === undefined
              ? null
              : String(primaryValue);
        if (!primaryLabel) continue;
        for (const dateField of definition.fields) {
          if (dateField.valueType !== "date") continue;
          const customDate = record[dateField.id];
          if (typeof customDate !== "string") continue;
          const [day, month, year] = customDate.split(".");
          if (!day || !month || !year) continue;
          const date = `${year}-${month}-${day}`;
          const label = `${definition.name} · ${primaryLabel} · ${dateField.name}`;
          const normalizedLabel = label.toLocaleLowerCase("en-US");
          const groupKey = `composite:${definition.id}:${dateField.id}:${normalizedLabel}`;
          const event: DatedTagEvent = {
            color: null,
            date,
            employee,
            label,
            source: { fieldId: definition.id, kind: "composite" },
          };
          const dateEvents = datedTagEventsByDate.get(date) ?? [];
          dateEvents.push(event);
          datedTagEventsByDate.set(date, dateEvents);
          const group = datedTagGroupByNormalizedLabel.get(groupKey) ?? {
            color: null,
            events: [] as DatedTagEvent[],
            label,
            normalizedLabel: groupKey,
            source: { fieldId: definition.id, kind: "composite" } as const,
          };
          group.events.push(event);
          datedTagGroupByNormalizedLabel.set(groupKey, group);
        }
      }
    }
    if (employee.unitPositions.some((unitPosition) => unitPosition.isBoss)) {
      bossEmployeeIds.add(employee.id);
    }
  }

  for (const [birthdayKey, birthdayEmployees] of birthdayEmployeesByKey) {
    birthdayEmployeesByKey.set(birthdayKey, [...birthdayEmployees].sort(compareEmployeesByName));
  }
  const tagOrderById = createTagOrderIndex(tagDefinitions.map((tag) => tag.id));
  for (const [date, events] of datedTagEventsByDate) {
    datedTagEventsByDate.set(
      date,
      [...events].sort((first, second) => {
        const firstRank =
          first.source.kind === "tag"
            ? (tagOrderById.get(first.source.tagId) ?? Number.MAX_SAFE_INTEGER - 1)
            : Number.MAX_SAFE_INTEGER;
        const secondRank =
          second.source.kind === "tag"
            ? (tagOrderById.get(second.source.tagId) ?? Number.MAX_SAFE_INTEGER - 1)
            : Number.MAX_SAFE_INTEGER;
        return (
          firstRank - secondRank ||
          first.label.localeCompare(second.label, "en", { numeric: true, sensitivity: "base" }) ||
          compareEmployeesByName(first.employee, second.employee)
        );
      }),
    );
  }
  const datedTagGroups = [...datedTagGroupByNormalizedLabel.values()]
    .sort((first, second) => {
      const firstRank =
        first.source.kind === "tag"
          ? (tagOrderById.get(first.source.tagId) ?? Number.MAX_SAFE_INTEGER - 1)
          : Number.MAX_SAFE_INTEGER;
      const secondRank =
        second.source.kind === "tag"
          ? (tagOrderById.get(second.source.tagId) ?? Number.MAX_SAFE_INTEGER - 1)
          : Number.MAX_SAFE_INTEGER;
      return (
        firstRank - secondRank ||
        first.label.localeCompare(second.label, "en", { numeric: true, sensitivity: "base" })
      );
    })
    .map((group) => ({
      ...group,
      events: [...group.events].sort(
        (first, second) =>
          first.date.localeCompare(second.date) ||
          compareEmployeesByName(first.employee, second.employee),
      ),
    }));

  return {
    allEmployees,
    employeeFieldDefinitions: [...customFieldDefinitions],
    deepEmployees,
    deepUnits,
    indexes: {
      birthdayEmployeesByKey,
      datedTagEventsByDate,
      datedTagGroups,
      bossEmployeeCount: bossEmployeeIds.size,
      employeeSearchDocumentByEmployeeId,
      employeeSearchDocuments,
      employeesById,
      employeeFieldDefinitionById: new Map(
        customFieldDefinitions.map((definition) => [definition.id, definition]),
      ),
      customFieldOptionsById: new Map(
        customFieldDefinitions.map((definition) => {
          const values = new Set<string>();
          for (const document of employeeSearchDocuments) {
            for (const value of document.customFieldValues.get(definition.id) ?? []) {
              values.add(value);
            }
          }
          return [
            definition.id,
            [...values].sort((a, b) =>
              a.localeCompare(b, "en", { numeric: true, sensitivity: "base" }),
            ),
          ];
        }),
      ),
      employeesByName: [...allEmployees].sort(compareEmployeesByName),
      manualEmployeeSearchDocumentByEmployeeId,
      manualEmployeeSearchDocuments,
      manualPositionOptions: getPositionOptionsFromSearchDocuments(manualEmployeeSearchDocuments),
      positionOptions: getPositionOptionsFromSearchDocuments(employeeSearchDocuments),
      tagOptions:
        tagDefinitions.length > 0
          ? tagDefinitions.map((tag) => tag.label)
          : getEmployeeTagOptionsFromSearchDocuments(employeeSearchDocuments),
      tagsById: new Map(tagDefinitions.map((tag) => [tag.id, tag])),
      unitOrderById,
      unitSearchDocuments: deepUnits.map(createUnitSearchDocument),
      unitsById,
    },
    roots,
    tags: [...tagDefinitions],
  };
};
