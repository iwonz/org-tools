import { describe, expect, test } from "vitest";

import {
  createAnalyticsDashboard,
  createAnalyticsPanel,
  createAnalyticsWidget,
} from "@/lib/analytics-dashboard";
import { ANALYTICS_LIMITS } from "@/lib/analytics-state";
import { createBlankOrgToolsState, parseOrgToolsState } from "@/lib/org-file";
import { OrgStore } from "@/stores/org-store";

const uuid = (value: number) => `00000000-0000-4000-8000-${String(value).padStart(12, "0")}`;

const stateWithDashboard = () => {
  const state = createBlankOrgToolsState();
  const viewId = state.organization.views[0]?.id ?? "";
  const dashboard = createAnalyticsDashboard("Dashboard");
  const panel = createAnalyticsPanel("Panel", "Tab");
  const widget = createAnalyticsWidget("kpi", viewId, "Employees");
  panel.tabs[0]?.widgets.push(widget);
  dashboard.panels.push(panel);
  state.organization.analyticsDashboards = [dashboard];
  state.ui.analytics.activeDashboardId = dashboard.id;
  state.ui.analytics.activeTabIdsByPanelId[panel.id] = panel.tabs[0]?.id ?? "";
  return { dashboard, panel, state, widget };
};

describe("Analytics exact State", () => {
  test("starts empty and round-trips strict dashboard and UI definitions", () => {
    expect(createBlankOrgToolsState().organization.analyticsDashboards).toEqual([]);
    const { state } = stateWithDashboard();
    expect(parseOrgToolsState(structuredClone(state))).toEqual(state);
  });

  test("rejects the preceding UI shape and a missing organization collection", () => {
    const state = createBlankOrgToolsState() as unknown as {
      organization: Record<string, unknown>;
      ui: { analytics: unknown };
    };
    delete state.organization.analyticsDashboards;
    expect(() => parseOrgToolsState(state)).toThrow("invalid top-level structure");
    const current = createBlankOrgToolsState() as unknown as { ui: { analytics: unknown } };
    current.ui.analytics = { filters: {}, query: "" };
    expect(() => parseOrgToolsState(current)).toThrow("invalid durable UI state");
  });

  test("rejects dashboard limits and dangling View references", () => {
    const state = createBlankOrgToolsState();
    state.organization.analyticsDashboards = Array.from(
      { length: ANALYTICS_LIMITS.dashboards + 1 },
      (_, index) => ({ ...createAnalyticsDashboard(`Dashboard ${index}`), id: uuid(index + 1) }),
    );
    expect(() => parseOrgToolsState(state)).toThrow("invalid Analytics dashboards");
    const valid = stateWithDashboard();
    valid.widget.viewId = uuid(999);
    expect(() => parseOrgToolsState(valid.state)).toThrow("missing View");
  });

  test("saves complete dashboard drafts and blocks referenced View deletion", () => {
    const store = new OrgStore();
    const dashboard = createAnalyticsDashboard("Dashboard");
    const panel = createAnalyticsPanel("Panel", "Tab");
    panel.tabs[0]?.widgets.push(createAnalyticsWidget("kpi", store.systemOrgViewId, "Employees"));
    dashboard.panels.push(panel);
    store.replaceAnalyticsDashboards([dashboard]);
    expect(store.createOrgToolsState().organization.analyticsDashboards).toHaveLength(1);
    const viewId = store.createOrgView("Report", { type: "blank" });
    const custom = createAnalyticsDashboard("Custom");
    const customPanel = createAnalyticsPanel("Panel", "Tab");
    customPanel.tabs[0]?.widgets.push(createAnalyticsWidget("table", viewId, "Table"));
    custom.panels.push(customPanel);
    store.replaceAnalyticsDashboards([dashboard, custom]);
    expect(() => store.deleteOrgView(viewId)).toThrow("View is still in use by Analytics");
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
    const dashboard = createAnalyticsDashboard("Dashboard");
    const panel = createAnalyticsPanel("Panel", "Tab");
    const widget = createAnalyticsWidget("kpi", store.systemOrgViewId, "Score");
    widget.query.measures = [{ field: `custom:${fieldId}`, id: uuid(501), operation: "average" }];
    panel.tabs[0]?.widgets.push(widget);
    dashboard.panels.push(panel);
    store.replaceAnalyticsDashboards([dashboard]);
    expect(() => store.deleteEmployeeFieldDefinition(fieldId)).toThrow(
      "Custom Employee field is still in use.",
    );
  });
});
