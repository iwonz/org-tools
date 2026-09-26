import { describe, expect, test } from "vitest";

import {
  addAnalyticsTab,
  createAnalyticsFilter,
  createAnalyticsWidget,
  createEmptyAnalyticsConfiguration,
  removeAnalyticsTab,
  removeAnalyticsWidget,
} from "@/lib/analytics-dashboard";
import { ANALYTICS_LIMITS } from "@/lib/analytics-state";
import { createBlankOrgToolsState, parseOrgToolsState } from "@/lib/org-file";
import { OrgStore } from "@/stores/org-store";

const uuid = (value: number) => `00000000-0000-4000-8000-${String(value).padStart(12, "0")}`;

const stateWithAnalytics = () => {
  const state = createBlankOrgToolsState();
  const viewId = state.organization.views[0]?.id ?? "";
  const withTab = addAnalyticsTab(createEmptyAnalyticsConfiguration(), "Overview");
  const widget = createAnalyticsWidget("kpi", viewId, "Employees", withTab.tabId);
  state.organization.analytics = { ...withTab.configuration, widgets: [widget] };
  state.ui.analytics.activeTabId = withTab.tabId;
  return { state, widget };
};

describe("Analytics exact State", () => {
  test("starts as an empty singleton board and round-trips its exact shape", () => {
    expect(createBlankOrgToolsState().organization.analytics).toEqual({
      filters: [],
      tabs: [],
      widgets: [],
    });
    const { state } = stateWithAnalytics();
    expect(parseOrgToolsState(structuredClone(state))).toEqual(state);
  });

  test("rejects the dashboard hierarchy and preceding UI shape", () => {
    const state = createBlankOrgToolsState() as unknown as {
      organization: Record<string, unknown>;
      ui: { analytics: unknown };
    };
    state.organization.analyticsDashboards = [];
    delete state.organization.analytics;
    expect(() => parseOrgToolsState(state)).toThrow("invalid top-level structure");
    const current = createBlankOrgToolsState() as unknown as { ui: { analytics: unknown } };
    current.ui.analytics = { filters: {}, query: "" };
    expect(() => parseOrgToolsState(current)).toThrow("invalid durable UI state");
  });

  test("enforces root widget limits and View references", () => {
    const state = createBlankOrgToolsState();
    const viewId = state.organization.views[0]?.id ?? "";
    state.organization.analytics.widgets = Array.from(
      { length: ANALYTICS_LIMITS.widgets + 1 },
      (_, index) => ({
        ...createAnalyticsWidget("kpi", viewId, `KPI ${index}`),
        id: uuid(index + 1),
      }),
    );
    expect(() => parseOrgToolsState(state)).toThrow("root widget limit");
    const valid = stateWithAnalytics();
    valid.widget.viewId = uuid(999);
    expect(() => parseOrgToolsState(valid.state)).toThrow("missing View");
  });

  test("moves root widgets into the first tab and preserves widgets when tabs are removed", () => {
    const viewId = uuid(100);
    const rootWidget = createAnalyticsWidget("table", viewId, "Employees");
    const first = addAnalyticsTab(
      { ...createEmptyAnalyticsConfiguration(), widgets: [rootWidget] },
      "First",
    );
    expect(first.configuration.widgets[0]?.tabId).toBe(first.tabId);
    const second = addAnalyticsTab(first.configuration, "Second");
    const withoutFirst = removeAnalyticsTab(second.configuration, first.tabId);
    expect(withoutFirst.configuration.widgets[0]?.tabId).toBe(second.tabId);
    const withoutLast = removeAnalyticsTab(withoutFirst.configuration, second.tabId);
    expect(withoutLast.configuration.widgets[0]?.tabId).toBeNull();
  });

  test("saves the whole configuration and blocks referenced View deletion", () => {
    const store = new OrgStore();
    const viewId = store.createOrgView("Report", { type: "blank" });
    const widget = createAnalyticsWidget("table", viewId, "Table");
    store.replaceAnalyticsConfiguration({ filters: [], tabs: [], widgets: [widget] });
    expect(store.createOrgToolsState().organization.analytics.widgets).toHaveLength(1);
    expect(() => store.deleteOrgView(viewId)).toThrow("View is still in use by Analytics");
  });

  test("removes a deleted widget from explicit filter targets", () => {
    const viewId = uuid(100);
    const widget = createAnalyticsWidget("kpi", viewId, "Employees");
    const filter = { ...createAnalyticsFilter(viewId, "Team"), targetWidgetIds: [widget.id] };
    const configuration = removeAnalyticsWidget(
      { filters: [filter], tabs: [], widgets: [widget] },
      widget.id,
    );
    expect(configuration.filters[0]?.targetWidgetIds).toEqual([]);
  });

  test("blocks a custom field referenced by a saved Analytics query", () => {
    const store = new OrgStore();
    const fieldId = uuid(500);
    store.saveEmployeeFieldDefinition({
      allowCustomOptions: false,
      id: fieldId,
      key: "score",
      kind: "value",
      multiple: false,
      name: "Score",
      options: [],
      required: false,
      valueType: "number",
    });
    const widget = createAnalyticsWidget("kpi", store.systemOrgViewId, "Score");
    widget.query.measures = [{ field: `custom:${fieldId}`, id: uuid(501), operation: "average" }];
    store.replaceAnalyticsConfiguration({ filters: [], tabs: [], widgets: [widget] });
    expect(() => store.deleteEmployeeFieldDefinition(fieldId)).toThrow(
      "Custom Employee field is still in use.",
    );
  });
});
