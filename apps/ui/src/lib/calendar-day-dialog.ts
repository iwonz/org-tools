import type { DatedTagEvent, Employee } from "@org-tools/types";

export type CalendarDayDialogRow =
  | { key: string; kind: "header"; label: string; normalizedLabel: string | null }
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
    rows.push({ key: "birthdays", kind: "header", label: "Birthdays", normalizedLabel: null });
    for (const employee of [...birthdayEmployees].sort(compareEmployees)) {
      rows.push({ employee, key: `birthdays:${employee.id}`, kind: "employee" });
    }
  }
  const groups = new Map<string, { employees: Map<Employee["id"], Employee>; label: string }>();
  for (const event of events) {
    const normalizedLabel = event.label.toLocaleLowerCase("en-US");
    const group = groups.get(normalizedLabel) ?? { employees: new Map(), label: event.label };
    group.employees.set(event.employee.id, event.employee);
    groups.set(normalizedLabel, group);
  }
  for (const [normalizedLabel, group] of [...groups].sort((first, second) =>
    collator.compare(first[1].label, second[1].label),
  )) {
    rows.push({
      key: `tag:${normalizedLabel}`,
      kind: "header",
      label: group.label,
      normalizedLabel,
    });
    for (const employee of [...group.employees.values()].sort(compareEmployees)) {
      rows.push({ employee, key: `tag:${normalizedLabel}:${employee.id}`, kind: "employee" });
    }
  }
  return rows;
};
