import type {
  AnalyticsFilterScalar,
  AnalyticsFilterValue,
  AnalyticsMeasure,
  AnalyticsPredicate,
  AnalyticsWidget,
  CustomEmployeeFieldDefinition,
  CustomEmployeeFieldValue,
  Employee,
  EmployeeFieldId,
  EmployeeId,
  UiOrgStructure,
} from "@org-tools/types";

import { ANALYTICS_LIMITS } from "@/lib/analytics-state";
import { evaluateCustomEmployeeFields } from "@/lib/custom-employee-fields";

export type AnalyticsRowValue = AnalyticsFilterScalar | AnalyticsFilterScalar[] | null;

export type AnalyticsRow = {
  employeeId: EmployeeId;
  rowId: string;
  values: Record<string, AnalyticsRowValue>;
};

export type AnalyticsAppliedFilter = {
  field: string;
  value: AnalyticsFilterValue;
};

export type AnalyticsResultCell = {
  key: string;
  label: string;
  value: AnalyticsFilterScalar | null;
};

export type AnalyticsResultRow = {
  dimensions: AnalyticsResultCell[];
  employeeIds: EmployeeId[];
  id: string;
  kind?: "data" | "grandTotal" | "subtotal";
  measures: Record<string, number | null>;
};

export type AnalyticsQueryResult = {
  columns: { id: string; kind: "dimension" | "measure"; label: string }[];
  rows: AnalyticsResultRow[];
  totalRows: number;
  totals: Record<string, number | null>;
  truncated: boolean;
};

export type AnalyticsField = {
  id: string;
  kind: "boolean" | "date" | "number" | "text";
  label: string;
  scope: "employee" | "tag" | "unit";
};

const BUILT_IN_FIELDS: AnalyticsField[] = [
  { id: "employee.id", kind: "text", label: "Employee ID", scope: "employee" },
  { id: "employee.firstName", kind: "text", label: "First name", scope: "employee" },
  { id: "employee.lastName", kind: "text", label: "Last name", scope: "employee" },
  { id: "employee.fullName", kind: "text", label: "Full name", scope: "employee" },
  { id: "employee.gender", kind: "text", label: "Gender", scope: "employee" },
  { id: "employee.username", kind: "text", label: "Username", scope: "employee" },
  { id: "employee.profileUrl", kind: "text", label: "Profile URL", scope: "employee" },
  { id: "employee.email", kind: "text", label: "Email", scope: "employee" },
  { id: "employee.phone", kind: "text", label: "Phone", scope: "employee" },
  { id: "employee.birthday", kind: "date", label: "Birthday", scope: "employee" },
  { id: "employee.tags", kind: "text", label: "Tags", scope: "employee" },
  { id: "employee.tagDates", kind: "date", label: "Tag dates", scope: "employee" },
  { id: "assignment.unitId", kind: "text", label: "Unit ID", scope: "unit" },
  { id: "assignment.unitName", kind: "text", label: "Unit", scope: "unit" },
  { id: "assignment.unitFullPath", kind: "text", label: "Unit full path", scope: "unit" },
  { id: "assignment.position", kind: "text", label: "Position", scope: "unit" },
  { id: "assignment.isBoss", kind: "boolean", label: "Boss", scope: "unit" },
  { id: "tag.id", kind: "text", label: "Tag ID", scope: "tag" },
  { id: "tag.label", kind: "text", label: "Tag", scope: "tag" },
  { id: "tag.date", kind: "date", label: "Tag date", scope: "tag" },
];

const valueTypeToFieldKind = (valueType: string): AnalyticsField["kind"] => {
  if (valueType === "boolean" || valueType === "date" || valueType === "number") return valueType;
  return "text";
};

export const getAnalyticsFields = (
  definitions: readonly CustomEmployeeFieldDefinition[],
): AnalyticsField[] => [
  ...BUILT_IN_FIELDS,
  ...definitions.flatMap((definition): AnalyticsField[] => {
    if (definition.kind === "composite") {
      return definition.fields.map((field) => ({
        id: `composite:${definition.id}:${field.id}`,
        kind: valueTypeToFieldKind(field.valueType),
        label: `${definition.name} · ${field.name}`,
        scope: "employee",
      }));
    }
    return [
      {
        id: `custom:${definition.id}`,
        kind: definition.kind === "template" ? "text" : valueTypeToFieldKind(definition.valueType),
        label: definition.name,
        scope: "employee",
      },
    ];
  }),
];

const resolveOption = (
  options: readonly { id: string; label: string }[],
  value: unknown,
): AnalyticsRowValue => {
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      const label = options.find((option) => option.id === item)?.label;
      return label ? [label] : [];
    });
  }
  if (typeof value !== "string") return null;
  return options.find((option) => option.id === value)?.label ?? null;
};

const normalizeCustomValue = (
  definition: CustomEmployeeFieldDefinition,
  value: CustomEmployeeFieldValue | undefined,
): AnalyticsRowValue => {
  if (definition.kind === "template") return typeof value === "string" ? value : null;
  if (definition.kind === "composite") return null;
  if (definition.valueType === "option") return resolveOption(definition.options, value);
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  return typeof value === "boolean" || typeof value === "number" || typeof value === "string"
    ? value
    : null;
};

const employeeValues = (
  employee: Employee,
  definitions: readonly CustomEmployeeFieldDefinition[],
) => {
  const customValues = evaluateCustomEmployeeFields(employee, definitions);
  return {
    "employee.birthday": employee.birthday,
    "employee.email": employee.email,
    "employee.firstName": employee.firstName,
    "employee.fullName": employee.fullName,
    "employee.gender": employee.gender,
    "employee.id": employee.id,
    "employee.lastName": employee.lastName,
    "employee.phone": employee.phone,
    "employee.profileUrl": employee.profileUrl,
    "employee.tagDates": employee.tags.flatMap((tag) => (tag.date ? [tag.date] : [])),
    "employee.tags": employee.tags.map((tag) => tag.label),
    "employee.username": employee.username,
    "tag.date": employee.tags.flatMap((tag) => (tag.date ? [tag.date] : [])),
    "tag.id": employee.tags.flatMap((tag) => (tag.tagId ? [tag.tagId] : [])),
    "tag.label": employee.tags.map((tag) => tag.label),
    ...Object.fromEntries(
      definitions.flatMap((definition) =>
        definition.kind === "composite"
          ? []
          : [
              [
                `custom:${definition.id}`,
                normalizeCustomValue(
                  definition,
                  definition.kind === "template"
                    ? customValues.get(definition.id)
                    : employee.customFieldValues[definition.id],
                ),
              ],
            ],
      ),
    ),
  } satisfies Record<string, AnalyticsRowValue>;
};

const resolveCompositeRecord = (
  definition: Extract<CustomEmployeeFieldDefinition, { kind: "composite" }>,
  record: Record<EmployeeFieldId, unknown>,
) =>
  Object.fromEntries(
    definition.fields.map((field) => {
      const value = record[field.id];
      return [
        `composite:${definition.id}:${field.id}`,
        field.valueType === "option"
          ? resolveOption(field.options, value)
          : typeof value === "boolean" || typeof value === "number" || typeof value === "string"
            ? value
            : null,
      ];
    }),
  );

export const buildAnalyticsRows = (
  structure: UiOrgStructure,
  widget: Pick<AnalyticsWidget, "dataset">,
): AnalyticsRow[] => {
  const definitions = structure.employeeFieldDefinitions;
  if (widget.dataset.kind === "employees") {
    return structure.allEmployees.map((employee) => ({
      employeeId: employee.id,
      rowId: `employee:${employee.id}`,
      values: employeeValues(employee, definitions),
    }));
  }
  if (widget.dataset.kind === "assignments") {
    return structure.allEmployees.flatMap((employee) => {
      const base = employeeValues(employee, definitions);
      return employee.unitPositions.map((assignment) => ({
        employeeId: employee.id,
        rowId: `assignment:${employee.id}:${assignment.unitId}`,
        values: {
          ...base,
          "assignment.isBoss": assignment.isBoss,
          "assignment.position": assignment.position,
          "assignment.unitFullPath": assignment.unitPath.fullName,
          "assignment.unitId": assignment.unitId,
          "assignment.unitName": assignment.unitName,
        },
      }));
    });
  }
  if (widget.dataset.kind === "tags") {
    return structure.allEmployees.flatMap((employee) => {
      const base = employeeValues(employee, definitions);
      return employee.tags.map((tag, index) => ({
        employeeId: employee.id,
        rowId: `tag:${employee.id}:${tag.tagId ?? index}`,
        values: {
          ...base,
          "tag.date": tag.date,
          "tag.id": tag.tagId ?? null,
          "tag.label": tag.label,
        },
      }));
    });
  }
  const compositeFieldId = widget.dataset.fieldId;
  const definition = definitions.find(
    (candidate): candidate is Extract<CustomEmployeeFieldDefinition, { kind: "composite" }> =>
      candidate.id === compositeFieldId && candidate.kind === "composite",
  );
  if (!definition) return [];
  return structure.allEmployees.flatMap((employee) => {
    const base = employeeValues(employee, definitions);
    const records = employee.customFieldValues[definition.id];
    if (!Array.isArray(records)) return [];
    return records.flatMap((record, index) =>
      typeof record === "object" && record !== null && !Array.isArray(record)
        ? [
            {
              employeeId: employee.id,
              rowId: `composite:${definition.id}:${employee.id}:${index}`,
              values: { ...base, ...resolveCompositeRecord(definition, record) },
            },
          ]
        : [],
    );
  });
};

const scalarValues = (value: AnalyticsRowValue): AnalyticsFilterScalar[] =>
  value === null ? [] : Array.isArray(value) ? value : [value];

const comparable = (value: AnalyticsFilterScalar) =>
  typeof value === "string" ? value.normalize("NFKC").toLocaleLowerCase("en-US") : value;

const equals = (first: AnalyticsFilterScalar, second: AnalyticsFilterScalar) =>
  comparable(first) === comparable(second);

const matchesPredicate = (row: AnalyticsRow, predicate: AnalyticsPredicate) => {
  const values = scalarValues(row.values[predicate.field] ?? null);
  if (predicate.operator === "empty") return values.length === 0;
  if (predicate.operator === "notEmpty") return values.length > 0;
  const expected = Array.isArray(predicate.value)
    ? predicate.value
    : predicate.value === null
      ? []
      : [predicate.value];
  if (predicate.operator === "in")
    return values.some((value) => expected.some((item) => equals(value, item)));
  if (predicate.operator === "contains") {
    const needle = String(expected[0] ?? "")
      .normalize("NFKC")
      .toLocaleLowerCase("en-US");
    return values.some((value) =>
      String(value).normalize("NFKC").toLocaleLowerCase("en-US").includes(needle),
    );
  }
  if (predicate.operator === "equals")
    return values.some((value) => expected[0] !== undefined && equals(value, expected[0]));
  if (predicate.operator === "notEquals")
    return values.every((value) => expected[0] === undefined || !equals(value, expected[0]));
  const lower = predicate.value;
  const upper = predicate.valueTo;
  return values.some((value) => {
    const current = comparable(value);
    if (predicate.operator === "range")
      return (
        lower !== null &&
        upper !== null &&
        current >= comparable(lower as AnalyticsFilterScalar) &&
        current <= comparable(upper)
      );
    if (lower === null || Array.isArray(lower)) return false;
    if (predicate.operator === "greaterThan") return current > comparable(lower);
    if (predicate.operator === "greaterThanOrEqual") return current >= comparable(lower);
    if (predicate.operator === "lessThan") return current < comparable(lower);
    if (predicate.operator === "lessThanOrEqual") return current <= comparable(lower);
    return false;
  });
};

const matchesAppliedFilter = (row: AnalyticsRow, filter: AnalyticsAppliedFilter) => {
  const values = scalarValues(row.values[filter.field] ?? null);
  if (filter.value.includeEmpty && values.length === 0) return true;
  if (filter.value.search) {
    const needle = filter.value.search.normalize("NFKC").toLocaleLowerCase("en-US");
    if (
      !values.some((value) =>
        String(value).normalize("NFKC").toLocaleLowerCase("en-US").includes(needle),
      )
    )
      return false;
  }
  if (
    filter.value.values.length > 0 &&
    !values.some((value) => filter.value.values.some((candidate) => equals(value, candidate)))
  )
    return false;
  if (
    filter.value.from !== null &&
    !values.some(
      (value) => comparable(value) >= comparable(filter.value.from as AnalyticsFilterScalar),
    )
  )
    return false;
  if (
    filter.value.to !== null &&
    !values.some(
      (value) => comparable(value) <= comparable(filter.value.to as AnalyticsFilterScalar),
    )
  )
    return false;
  return true;
};

const parseDateParts = (value: string) => {
  const canonical = /^(\d{2})\.(\d{2})\.(\d{4})$/u.exec(value);
  if (canonical)
    return { day: Number(canonical[1]), month: Number(canonical[2]), year: Number(canonical[3]) };
  const iso = /^(\d{4})-(\d{2})-(\d{2})/u.exec(value);
  return iso ? { day: Number(iso[3]), month: Number(iso[2]), year: Number(iso[1]) } : null;
};

const dateBucket = (
  value: AnalyticsFilterScalar,
  grouping: NonNullable<AnalyticsWidget["query"]["dimensions"][number]["dateGrouping"]>,
) => {
  const parts = typeof value === "string" ? parseDateParts(value) : null;
  if (!parts) return String(value);
  if (grouping === "year") return String(parts.year);
  if (grouping === "quarter") return `${parts.year}-Q${Math.floor((parts.month - 1) / 3) + 1}`;
  if (grouping === "month") return `${parts.year}-${String(parts.month).padStart(2, "0")}`;
  if (grouping === "day")
    return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  const weekday = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - weekday);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
};

const dimensionValues = (
  row: AnalyticsRow,
  dimension: AnalyticsWidget["query"]["dimensions"][number],
) => {
  const values = scalarValues(row.values[dimension.field] ?? null);
  if (values.length === 0) return [null];
  return dimension.dateGrouping
    ? values.map((value) => dateBucket(value, dimension.dateGrouping as never))
    : values;
};

const cartesian = <T>(sets: T[][]): T[][] =>
  sets.reduce<T[][]>(
    (products, set) => products.flatMap((product) => set.map((value) => [...product, value])),
    [[]],
  );

const calculateMeasure = (
  rows: readonly AnalyticsRow[],
  measure: AnalyticsMeasure,
): number | null => {
  if (measure.operation === "countRows") return rows.length;
  if (measure.operation === "countDistinctEmployees")
    return new Set(rows.map((row) => row.employeeId)).size;
  const values = rows.flatMap((row) => scalarValues(row.values[measure.field ?? ""] ?? null));
  if (measure.operation === "countDistinct")
    return new Set(values.map((value) => `${typeof value}:${String(value)}`)).size;
  const numbers = values.filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );
  if (numbers.length === 0) return null;
  if (measure.operation === "sum") return numbers.reduce((sum, value) => sum + value, 0);
  if (measure.operation === "average")
    return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
  if (measure.operation === "min") return Math.min(...numbers);
  if (measure.operation === "max") return Math.max(...numbers);
  return null;
};

export const executeAnalyticsQuery = (
  widget: AnalyticsWidget,
  inputRows: readonly AnalyticsRow[],
  appliedFilters: readonly AnalyticsAppliedFilter[] = [],
): AnalyticsQueryResult => {
  const effectiveDimensions =
    widget.type === "pivot" && (widget.rowFields.length > 0 || widget.columnFields.length > 0)
      ? [...widget.rowFields, ...widget.columnFields].map((field) => ({
          dateGrouping:
            widget.query.dimensions.find((dimension) => dimension.field === field)?.dateGrouping ??
            null,
          field,
        }))
      : widget.query.dimensions;
  const filteredRows = inputRows.filter(
    (row) =>
      widget.query.filters.every((filter) => matchesPredicate(row, filter)) &&
      appliedFilters.every((filter) => matchesAppliedFilter(row, filter)),
  );
  const groups = new Map<string, { dimensions: AnalyticsResultCell[]; rows: AnalyticsRow[] }>();
  if (effectiveDimensions.length === 0)
    groups.set("all", { dimensions: [], rows: [...filteredRows] });
  for (const row of filteredRows) {
    const combinations = cartesian(
      effectiveDimensions.map((dimension) => dimensionValues(row, dimension)),
    );
    for (const values of combinations) {
      const key = JSON.stringify(values);
      const group = groups.get(key) ?? {
        dimensions: effectiveDimensions.map((dimension, index) => ({
          key: dimension.field,
          label: values[index] === null ? "" : String(values[index]),
          value: values[index] ?? null,
        })),
        rows: [],
      };
      group.rows.push(row);
      groups.set(key, group);
    }
  }
  const allRows = [...groups.entries()].map(([id, group]) => ({
    dimensions: group.dimensions,
    employeeIds: [...new Set(group.rows.map((row) => row.employeeId))],
    id,
    measures: Object.fromEntries(
      widget.query.measures.map((measure) => [measure.id, calculateMeasure(group.rows, measure)]),
    ),
  }));
  const sort = widget.query.sort;
  if (sort) {
    allRows.sort((first, second) => {
      const firstValue =
        first.measures[sort.key] ??
        first.dimensions.find((cell) => cell.key === sort.key)?.value ??
        "";
      const secondValue =
        second.measures[sort.key] ??
        second.dimensions.find((cell) => cell.key === sort.key)?.value ??
        "";
      const comparison =
        typeof firstValue === "number" && typeof secondValue === "number"
          ? firstValue - secondValue
          : String(firstValue).localeCompare(String(secondValue), "en", {
              numeric: true,
              sensitivity: "base",
            });
      return sort.direction === "asc" ? comparison : -comparison;
    });
  }
  const topRows = widget.query.topN === null ? allRows : allRows.slice(0, widget.query.topN);
  if (widget.type === "pivot" && widget.columnFields.length > 0) {
    const rowFieldCount = widget.rowFields.length;
    const columnLabelFor = (row: AnalyticsResultRow) =>
      row.dimensions
        .slice(rowFieldCount)
        .map((cell) => cell.label || "—")
        .join(" · ");
    const columnLabels = [...new Set(topRows.map(columnLabelFor))].slice(
      0,
      ANALYTICS_LIMITS.pivotCells,
    );
    const pivotSources = new Map<
      string,
      {
        byColumn: Map<string, AnalyticsRow[]>;
        dimensions: AnalyticsResultCell[];
        employeeIds: Set<EmployeeId>;
      }
    >();
    const columnSources = new Map<string, AnalyticsRow[]>();
    for (const row of topRows) {
      const rowDimensions = row.dimensions.slice(0, rowFieldCount);
      const rowKey = JSON.stringify(rowDimensions.map((cell) => cell.value));
      const columnLabel = columnLabelFor(row);
      const sourceRows = groups.get(row.id)?.rows ?? [];
      const current = pivotSources.get(rowKey) ?? {
        byColumn: new Map<string, AnalyticsRow[]>(),
        dimensions: rowDimensions,
        employeeIds: new Set<EmployeeId>(),
      };
      current.byColumn.set(columnLabel, [
        ...(current.byColumn.get(columnLabel) ?? []),
        ...sourceRows,
      ]);
      for (const employeeId of row.employeeIds) current.employeeIds.add(employeeId);
      pivotSources.set(rowKey, current);
      columnSources.set(columnLabel, [...(columnSources.get(columnLabel) ?? []), ...sourceRows]);
    }
    const materializePivotRow = (
      id: string,
      source: {
        byColumn: Map<string, AnalyticsRow[]>;
        dimensions: AnalyticsResultCell[];
        employeeIds: Set<EmployeeId>;
      },
      kind: AnalyticsResultRow["kind"] = "data",
    ): AnalyticsResultRow => ({
      dimensions: source.dimensions,
      employeeIds: [...source.employeeIds],
      id,
      kind,
      measures: Object.fromEntries(
        columnLabels.flatMap((columnLabel) =>
          widget.query.measures.map((measure) => [
            `${measure.id}:${columnLabel}`,
            calculateMeasure(source.byColumn.get(columnLabel) ?? [], measure),
          ]),
        ),
      ),
    });
    const pivotRows = [...pivotSources.entries()].map(([id, source]) =>
      materializePivotRow(id, source),
    );
    if (widget.showSubtotals && rowFieldCount > 1) {
      for (let prefixLength = 1; prefixLength < rowFieldCount; prefixLength += 1) {
        const subtotalSources = new Map<
          string,
          typeof pivotSources extends Map<string, infer T> ? T : never
        >();
        for (const row of topRows) {
          const rowDimensions = row.dimensions.slice(0, rowFieldCount);
          const subtotalDimensions = rowDimensions.slice(0, prefixLength);
          const subtotalKey = JSON.stringify(subtotalDimensions.map((cell) => cell.value));
          const current = subtotalSources.get(subtotalKey) ?? {
            byColumn: new Map<string, AnalyticsRow[]>(),
            dimensions: subtotalDimensions,
            employeeIds: new Set<EmployeeId>(),
          };
          const columnLabel = columnLabelFor(row);
          const sourceRows = groups.get(row.id)?.rows ?? [];
          current.byColumn.set(columnLabel, [
            ...(current.byColumn.get(columnLabel) ?? []),
            ...sourceRows,
          ]);
          for (const employeeId of row.employeeIds) current.employeeIds.add(employeeId);
          subtotalSources.set(subtotalKey, current);
        }
        pivotRows.push(
          ...[...subtotalSources.entries()].map(([id, source]) =>
            materializePivotRow(`subtotal:${prefixLength}:${id}`, source, "subtotal"),
          ),
        );
      }
    }
    const maxRows = Math.max(
      1,
      Math.floor(
        ANALYTICS_LIMITS.pivotCells /
          Math.max(1, columnLabels.length * widget.query.measures.length),
      ),
    );
    const boundedPivotRows = pivotRows.slice(0, maxRows);
    const totals = Object.fromEntries(
      columnLabels.flatMap((columnLabel) =>
        widget.query.measures.map((measure) => [
          `${measure.id}:${columnLabel}`,
          calculateMeasure(columnSources.get(columnLabel) ?? [], measure),
        ]),
      ),
    );
    return {
      columns: [
        ...widget.rowFields.map((field) => ({
          id: field,
          kind: "dimension" as const,
          label: field,
        })),
        ...columnLabels.flatMap((columnLabel) =>
          widget.query.measures.map((measure) => ({
            id: `${measure.id}:${columnLabel}`,
            kind: "measure" as const,
            label: `${columnLabel} · ${measure.operation}`,
          })),
        ),
      ],
      rows: boundedPivotRows,
      totalRows: pivotRows.length,
      totals,
      truncated:
        pivotRows.length > boundedPivotRows.length ||
        columnLabels.length * widget.query.measures.length * pivotRows.length >
          ANALYTICS_LIMITS.pivotCells,
    };
  }
  const resultLimit =
    widget.type === "pivot" ? ANALYTICS_LIMITS.pivotCells : ANALYTICS_LIMITS.tableRows;
  const boundedRows = topRows.slice(0, resultLimit);
  return {
    columns: [
      ...effectiveDimensions.map((dimension) => ({
        id: dimension.field,
        kind: "dimension" as const,
        label: dimension.field,
      })),
      ...widget.query.measures.map((measure) => ({
        id: measure.id,
        kind: "measure" as const,
        label: measure.operation,
      })),
    ],
    rows: boundedRows,
    totalRows: allRows.length,
    totals: Object.fromEntries(
      widget.query.measures.map((measure) => [measure.id, calculateMeasure(filteredRows, measure)]),
    ),
    truncated: topRows.length > resultLimit,
  };
};

export const getAnalyticsFilterOptions = (
  field: string,
  rows: readonly AnalyticsRow[],
): AnalyticsFilterScalar[] => {
  const unique = new Map<string, AnalyticsFilterScalar>();
  for (const row of rows) {
    for (const value of scalarValues(row.values[field] ?? null)) {
      unique.set(`${typeof value}:${String(value)}`, value);
      if (unique.size >= 1_000) break;
    }
  }
  return [...unique.values()].sort((first, second) =>
    String(first).localeCompare(String(second), "en", { numeric: true, sensitivity: "base" }),
  );
};
