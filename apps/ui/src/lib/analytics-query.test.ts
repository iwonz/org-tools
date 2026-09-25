import type {
  AnalyticsWidget,
  CustomEmployeeFieldDefinition,
  UiOrgStructure,
} from "@org-tools/types";
import { describe, expect, test } from "vitest";

import {
  cloneAnalyticsDashboard,
  createAnalyticsDashboard,
  createAnalyticsPanel,
  createAnalyticsWidget,
} from "@/lib/analytics-dashboard";
import {
  type AnalyticsRow,
  buildAnalyticsRows,
  executeAnalyticsQuery,
  getAnalyticsFields,
  getAnalyticsFilterOptions,
} from "@/lib/analytics-query";
import {
  createEmptyAnalyticsFilterValue,
  reconcileAnalyticsDefinitions,
  reconcileAnalyticsUi,
} from "@/lib/analytics-state";
import { createEmptyEmployeeFiltersState } from "@/lib/org-file";

const uuid = (value: number) => `00000000-0000-4000-8000-${String(value).padStart(12, "0")}`;
const rows: AnalyticsRow[] = [
  {
    employeeId: uuid(1),
    rowId: "one",
    values: {
      "employee.birthday": "10.01.2025",
      "employee.fullName": "Alex Example",
      "employee.tags": ["Backend", "Core"],
      "custom:number": 10,
    },
  },
  {
    employeeId: uuid(1),
    rowId: "two",
    values: {
      "employee.birthday": "10.02.2025",
      "employee.fullName": "Alex Example",
      "employee.tags": ["Backend"],
      "custom:number": 20,
    },
  },
  {
    employeeId: uuid(2),
    rowId: "three",
    values: {
      "employee.birthday": "10.02.2026",
      "employee.fullName": "Blair Example",
      "employee.tags": ["Core"],
      "custom:number": 30,
    },
  },
];

const widget = (value: Partial<AnalyticsWidget> = {}): AnalyticsWidget =>
  ({
    ...createAnalyticsWidget("bar", uuid(100), "Widget"),
    id: uuid(101),
    query: {
      dimensions: [{ dateGrouping: null, field: "employee.tags" }],
      filters: [],
      measures: [
        { field: null, id: uuid(102), operation: "countRows" },
        { field: null, id: uuid(103), operation: "countDistinctEmployees" },
        { field: "custom:number", id: uuid(104), operation: "average" },
      ],
      sort: { direction: "asc", key: "employee.tags" },
      topN: null,
    },
    ...value,
  }) as AnalyticsWidget;

describe("Analytics query engine", () => {
  test("expands multi-values while preserving distinct Employee counting", () => {
    const result = executeAnalyticsQuery(widget(), rows);
    expect(result.rows.map((row) => row.dimensions[0]?.value)).toEqual(["Backend", "Core"]);
    expect(result.rows[0]?.measures[uuid(102)]).toBe(2);
    expect(result.rows[0]?.measures[uuid(103)]).toBe(1);
    expect(result.rows[0]?.measures[uuid(104)]).toBe(15);
    expect(result.rows[1]?.measures[uuid(103)]).toBe(2);
  });

  test("groups dates and applies typed local and dashboard filters", () => {
    const current = widget();
    current.query.dimensions = [{ dateGrouping: "quarter", field: "employee.birthday" }];
    current.query.filters = [
      { field: "custom:number", operator: "greaterThanOrEqual", value: 20, valueTo: null },
    ];
    const result = executeAnalyticsQuery(current, rows, [
      {
        field: "employee.fullName",
        value: { ...createEmptyAnalyticsFilterValue(), values: ["Alex Example"] },
      },
    ]);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.dimensions[0]?.value).toBe("2025-Q1");
    expect(result.rows[0]?.employeeIds).toEqual([uuid(1)]);
  });

  test("deduplicates and sorts filter options", () => {
    expect(getAnalyticsFilterOptions("employee.tags", rows)).toEqual(["Backend", "Core"]);
  });

  test("builds Employee, assignment, Tag, and Composite grains with current labels", () => {
    const optionFieldId = uuid(200);
    const optionId = uuid(201);
    const compositeFieldId = uuid(202);
    const compositeNameId = uuid(203);
    const definitions: CustomEmployeeFieldDefinition[] = [
      {
        allowCustomOptions: false,
        id: optionFieldId,
        key: "level",
        kind: "value",
        multiple: false,
        name: "Level",
        options: [{ id: optionId, label: "Senior" }],
        required: false,
        valueType: "option",
      },
      {
        fields: [
          {
            id: compositeNameId,
            name: "Certification",
            options: [],
            required: true,
            valueType: "text",
          },
        ],
        id: compositeFieldId,
        key: "certifications",
        kind: "composite",
        name: "Certifications",
        primaryFieldId: compositeNameId,
        required: false,
      },
    ];
    const structure = {
      allEmployees: [
        {
          avatarBase64Url: null,
          birthday: "10.01.2025",
          customFieldValues: {
            [compositeFieldId]: [{ [compositeNameId]: "TypeScript" }],
            [optionFieldId]: optionId,
          },
          email: "alex@example.test",
          firstName: "Alex",
          fullName: "Alex Example",
          gender: "unspecified",
          id: uuid(1),
          lastName: "Example",
          phone: null,
          profileUrl: null,
          tagPriority: 0,
          tags: [{ date: "2026-04-05", label: "Core", tagId: uuid(204) }],
          unitIds: [uuid(205)],
          unitPositions: [
            {
              isBoss: true,
              parentId: null,
              position: "Lead",
              unitId: uuid(205),
              unitName: "Platform",
              unitPath: { fullName: "Platform", ids: [uuid(205)], names: ["Platform"] },
            },
          ],
          username: "alex",
        },
      ],
      employeeFieldDefinitions: definitions,
    } as unknown as UiOrgStructure;

    const employeeRows = buildAnalyticsRows(structure, { dataset: { kind: "employees" } });
    const assignmentRows = buildAnalyticsRows(structure, { dataset: { kind: "assignments" } });
    const tagRows = buildAnalyticsRows(structure, { dataset: { kind: "tags" } });
    const compositeRows = buildAnalyticsRows(structure, {
      dataset: { fieldId: compositeFieldId, kind: "composite" },
    });
    expect(employeeRows[0]?.values[`custom:${optionFieldId}`]).toBe("Senior");
    expect(employeeRows[0]?.values["tag.label"]).toEqual(["Core"]);
    expect(assignmentRows[0]?.values["assignment.unitName"]).toBe("Platform");
    expect(tagRows[0]?.values["tag.date"]).toBe("2026-04-05");
    expect(compositeRows[0]?.values[`composite:${compositeFieldId}:${compositeNameId}`]).toBe(
      "TypeScript",
    );
    expect(getAnalyticsFields(definitions).map((field) => field.id)).toContain(
      `composite:${compositeFieldId}:${compositeNameId}`,
    );
  });

  test("materializes pivot columns, subtotals, grand totals, and explicit bounds", () => {
    const pivot = {
      ...createAnalyticsWidget("pivot", uuid(100), "Pivot"),
      columnFields: ["assignment.position"],
      query: {
        dimensions: [],
        filters: [],
        measures: [{ field: null, id: uuid(120), operation: "countRows" }],
        sort: null,
        topN: null,
      },
      rowFields: ["assignment.unitName", "employee.gender"],
      showGrandTotal: true,
      showSubtotals: true,
    } as AnalyticsWidget;
    const pivotRows: AnalyticsRow[] = [
      {
        employeeId: uuid(1),
        rowId: "a",
        values: {
          "assignment.position": "Lead",
          "assignment.unitName": "Platform",
          "employee.gender": "female",
        },
      },
      {
        employeeId: uuid(2),
        rowId: "b",
        values: {
          "assignment.position": "Engineer",
          "assignment.unitName": "Platform",
          "employee.gender": "male",
        },
      },
      {
        employeeId: uuid(3),
        rowId: "c",
        values: {
          "assignment.position": "Engineer",
          "assignment.unitName": "Product",
          "employee.gender": "female",
        },
      },
    ];
    const result = executeAnalyticsQuery(pivot, pivotRows);
    expect(result.columns.map((column) => column.label)).toContain("Engineer · countRows");
    expect(result.rows.filter((row) => row.kind === "subtotal")).toHaveLength(2);
    expect(result.totals[`${uuid(120)}:Engineer`]).toBe(2);

    const table = widget({
      query: {
        dimensions: [{ dateGrouping: null, field: "employee.fullName" }],
        filters: [],
        measures: [{ field: null, id: uuid(121), operation: "countRows" }],
        sort: null,
        topN: null,
      },
      type: "table",
    } as Partial<AnalyticsWidget>);
    const largeRows = Array.from({ length: 20_005 }, (_, index) => ({
      employeeId: uuid((index % 999) + 1),
      rowId: String(index),
      values: { "employee.fullName": `Employee ${String(index).padStart(5, "0")}` },
    }));
    const bounded = executeAnalyticsQuery(table, largeRows);
    expect(bounded.rows).toHaveLength(20_000);
    expect(bounded.totalRows).toBe(20_005);
    expect(bounded.truncated).toBe(true);
  });

  test("groups the maintained 20,000 Employee and 4,000 Unit assignment target", () => {
    const assignmentRows: AnalyticsRow[] = Array.from({ length: 20_000 }, (_, index) => ({
      employeeId: uuid(index + 1),
      rowId: `assignment:${index}`,
      values: { "assignment.unitName": `Unit ${index % 4_000}` },
    }));
    const assignmentWidget = widget({
      dataset: { kind: "assignments" },
      query: {
        dimensions: [{ dateGrouping: null, field: "assignment.unitName" }],
        filters: [],
        measures: [{ field: null, id: uuid(130), operation: "countDistinctEmployees" }],
        sort: null,
        topN: null,
      },
    });
    const result = executeAnalyticsQuery(assignmentWidget, assignmentRows);
    expect(result.rows).toHaveLength(4_000);
    expect(result.rows.every((row) => row.measures[uuid(130)] === 5)).toBe(true);
  });

  test("clones every UUID and rewrites filter targets", () => {
    const dashboard = createAnalyticsDashboard("Source");
    const panel = createAnalyticsPanel("Panel", "Tab");
    const target = { ...createAnalyticsWidget("kpi", uuid(100), "KPI"), id: uuid(110) };
    const filter = {
      ...createAnalyticsWidget("filter", uuid(100), "Filter"),
      id: uuid(111),
      targetWidgetIds: [target.id],
    } as AnalyticsWidget;
    panel.tabs[0]?.widgets.push(target, filter);
    dashboard.panels.push(panel);
    const copy = cloneAnalyticsDashboard(dashboard, "Copy");
    const copiedWidgets = copy.panels[0]?.tabs[0]?.widgets ?? [];
    expect(copy.id).not.toBe(dashboard.id);
    expect(copy.panels[0]?.id).not.toBe(panel.id);
    expect(copiedWidgets[0]?.id).not.toBe(target.id);
    expect(copiedWidgets[0]?.query.measures[0]?.id).not.toBe(target.query.measures[0]?.id);
    expect(copiedWidgets[1]?.type === "filter" ? copiedWidgets[1].targetWidgetIds : null).toEqual([
      copiedWidgets[0]?.id,
    ]);
  });

  test("removes stale filter targets and durable UI references atomically", () => {
    const dashboard = createAnalyticsDashboard("Dashboard");
    const panel = createAnalyticsPanel("Panel", "Tab");
    const filter = {
      ...createAnalyticsWidget("filter", uuid(100), "Filter"),
      targetWidgetIds: [uuid(999)],
    } as AnalyticsWidget;
    panel.tabs[0]?.widgets.push(filter);
    dashboard.panels.push(panel);
    const definitions = reconcileAnalyticsDefinitions([dashboard]);
    const ui = reconcileAnalyticsUi(definitions, {
      activeDashboardId: uuid(999),
      activeTabIdsByPanelId: { [uuid(999)]: uuid(998) },
      drilldown: {
        employeeIds: [uuid(1)],
        filters: createEmptyEmployeeFiltersState(),
        query: "Alex",
        sourceWidgetId: uuid(999),
      },
      filterValuesByWidgetId: { [uuid(999)]: createEmptyAnalyticsFilterValue() },
    });
    const currentFilter = definitions[0]?.panels[0]?.tabs[0]?.widgets[0];
    expect(currentFilter?.type === "filter" ? currentFilter.targetWidgetIds : null).toEqual([]);
    expect(ui.activeDashboardId).toBe(dashboard.id);
    expect(ui.filterValuesByWidgetId).toEqual({});
    expect(ui.drilldown.sourceWidgetId).toBeNull();
    expect(ui.drilldown.employeeIds).toEqual([]);
  });
});
