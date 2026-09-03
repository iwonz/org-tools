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
      tagId: string;
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
      const event = {
        color: tag.color ?? null,
        date: tag.date,
        employee,
        label: tag.label,
        tagId: tag.tagId,
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
        tagId: tag.tagId,
      };
      group.events.push(event);
      datedTagGroupByNormalizedLabel.set(normalizedLabel, group);
    }
    if (employee.unitPositions.some((unitPosition) => unitPosition.isBoss)) {
      bossEmployeeIds.add(employee.id);
    }
  }

  for (const [birthdayKey, birthdayEmployees] of birthdayEmployeesByKey) {
    birthdayEmployeesByKey.set(birthdayKey, [...birthdayEmployees].sort(compareEmployeesByName));
  }
  for (const [date, events] of datedTagEventsByDate) {
    datedTagEventsByDate.set(
      date,
      [...events].sort((first, second) => compareEmployeesByName(first.employee, second.employee)),
    );
  }
  const datedTagGroups = [...datedTagGroupByNormalizedLabel.values()]
    .map((group) => ({
      ...group,
      events: [...group.events].sort(
        (first, second) =>
          first.date.localeCompare(second.date) ||
          compareEmployeesByName(first.employee, second.employee),
      ),
    }))
    .sort((first, second) =>
      first.label.localeCompare(second.label, "en", { sensitivity: "base" }),
    );

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
            const value = document.customFieldValues.get(definition.id);
            if (value !== null && value !== undefined) values.add(value);
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
      tagOptions: getEmployeeTagOptionsFromSearchDocuments(employeeSearchDocuments),
      tagsById: new Map(tagDefinitions.map((tag) => [tag.id, tag])),
      unitOrderById,
      unitSearchDocuments: deepUnits.map(createUnitSearchDocument),
      unitsById,
    },
    roots,
    tags: [...tagDefinitions],
  };
};
