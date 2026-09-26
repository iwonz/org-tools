## Context

Analytics currently persists `analyticsDashboards[]`, panels, mandatory panel tabs, and filter widgets. The requested model has one anonymous board, no panels, optional tabs, and board-level filters. The exact State, configured SQLite, fixtures, and all Analytics rendering paths must change together.

## Decisions

### One anonymous configuration

`organization.analytics` stores `{ filters, tabs, widgets }`. Dashboard IDs, names, timestamps, selectors, copy/delete actions, and panel definitions are removed. The blank organization stores three empty arrays. Editing deep-clones this one object and Save atomically replaces definitions plus reconciled UI state; Cancel discards it.

### Independent tabs and widgets

Tabs contain only stable ID and name. Widgets remain one ordered array and carry `tabId: UUID | null`. With no tabs every widget has `null`; with tabs every widget references one tab. Creating the first tab assigns every root widget to it. Deleting a tab moves its widgets to the next tab, otherwise the previous tab, and deleting the final tab restores them to root.

Each active scope has at most 32 widgets, tabs are capped at 16, and the two-column half/full-width layout remains. Only the active tab's widgets are mounted and queried.

### Board-level filters

`AnalyticsFilter` owns ID, name, View, field, control, default, and optional target widget IDs. Filters are ordered independently, capped at 32, displayed above tabs, and stay active across tab changes. Default targeting covers all compatible widgets; explicit targets may span tabs. Unit-context filters require the same View. Filter options remain lazy.

### Durable UI and export

`ui.analytics` stores one `activeTabId`, `filterValuesByFilterId`, and drill-down state. Reconciliation removes deleted filter values, missing targets, invalid active tabs, and stale drill-down sources.

Board PNG export captures only the root or active-tab widget grid. Filter controls, tab controls, and edit chrome are excluded. Per-widget PNG remains unchanged.

## Migration

The configured snapshot was observed at revision 34178 with two empty dashboards. Before publication, stop the runtime, retain a timestamped ignored backup of the SQLite family, and use an external temporary converter to replace `organization.analyticsDashboards` with empty `organization.analytics` and rewrite `ui.analytics`. Increment revision once, validate a detached candidate and the committed row with the production parser, compare unaffected paths, and prove normal startup. Runtime compatibility is not added.

## Risks

- Tab deletion could lose content: deterministic safe movement preserves every widget.
- Global filters can target inactive content: validate all target IDs but execute only visible active-tab widgets.
- Exact State replacement rejects prior exports: keep the required one-time owned SQLite conversion and strict rejection elsewhere.
