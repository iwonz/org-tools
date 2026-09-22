import type { DatedTagEvent, Employee } from "@org-tools/types";

export type CalendarDayDialogRow =
  | { historyKey: string | null; key: string; kind: "header"; label: string }
  | { employee: Employee; key: string; kind: "employee" };

export const buildCalendarDayDialogRows = ({
  birthdayEmployees,
  events,
  locale,
}: {
  birthdayEmployees: Employee[];
  events: DatedTagEvent[];
  locale: string;
}): CalendarDayDialogRow[] => {
  const collator = new Intl.Collator(locale, { numeric: true, sensitivity: "base" });
  const compareEmployees = (first: Employee, second: Employee) =>
    collator.compare(first.fullName, second.fullName) || first.id.localeCompare(second.id);
  const rows: CalendarDayDialogRow[] = [];
  if (birthdayEmployees.length > 0) {
    rows.push({ historyKey: null, key: "birthdays", kind: "header", label: "Birthdays" });
    for (const employee of [...birthdayEmployees].sort(compareEmployees)) {
      rows.push({ employee, key: `birthdays:${employee.id}`, kind: "employee" });
    }
  }
  const groups = new Map<
    string,
    { employees: Map<Employee["id"], Employee>; historyKey: string | null; label: string }
  >();
  for (const event of events) {
    const normalizedLabel = event.label.toLocaleLowerCase("en-US");
    const groupKey =
      event.source.kind === "tag"
        ? `tag:${normalizedLabel}`
        : `composite:${event.source.fieldId}:${normalizedLabel}`;
    const group = groups.get(groupKey) ?? {
      employees: new Map(),
      historyKey: event.source.kind === "tag" ? normalizedLabel : null,
      label: event.label,
    };
    group.employees.set(event.employee.id, event.employee);
    groups.set(groupKey, group);
  }
  for (const [groupKey, group] of groups) {
    rows.push({
      historyKey: group.historyKey,
      key: groupKey,
      kind: "header",
      label: group.label,
    });
    for (const employee of [...group.employees.values()].sort(compareEmployees)) {
      rows.push({ employee, key: `${groupKey}:${employee.id}`, kind: "employee" });
    }
  }
  return rows;
};
