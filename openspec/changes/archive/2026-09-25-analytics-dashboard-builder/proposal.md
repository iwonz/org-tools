## Why

The fixed Analytics page answers only a small set of predefined questions and cannot be adapted to an organization's current reporting needs. Org Tools needs a local dashboard builder that lets users compose metrics, tables, charts, and filters from the existing organization snapshot without sending data to an external BI service.

## What Changes

- Replace the fixed Analytics report with an initially empty collection of named, reorderable dashboards.
- Add an atomic draft editor for panels, tabs, responsive widget grids, queries, presentation, filters, and dashboard lifecycle operations.
- Add KPI, table, pivot, bar, line/area, pie/donut, gauge, and filter widgets over Employee, assignment, Tag, and composite-record datasets from a selected View.
- Add typed dimensions, measures, local filters, sorting, Top N, active-tab dashboard filters, virtualized drill-down, and bounded table/pivot results.
- Add a lazy local Worker query engine with request deduplication, cancellation, revision-aware bounded caching, visibility-aware execution, and no remote data flow.
- Add local Recharts rendering plus widget and active-panel-tab PNG preview/copy/save through bundled `html-to-image`.
- Add the thematic Fit icon to every image preview.
- **BREAKING**: extend the exact State with `organization.analyticsDashboards` and replace `ui.analytics`; the immediately previous owned SQLite snapshot requires a one-time offline conversion.

## Capabilities

### New Capabilities

- `analytics-dashboard-builder`: Dashboard lifecycle, layout editing, widget configuration, local querying, filtering, drill-down, rendering, and PNG export.

### Modified Capabilities

- `organization-analytics`: Replace fixed system-View age and count reports with configurable multi-View dashboards that may be absent.
- `organization-views`: Expose selectable View datasets and block deletion while analytics widgets reference a View.
- `custom-employee-fields`: Expose scalar, Template, and composite fields to analytics and block deletion while referenced.
- `single-state-runtime`: Persist and synchronize dashboard definitions and current analytics UI state in the exact State.
- `state-transfer`: Import and export the new exact analytics State shape.
- `organization-editor`: Add the Fit icon to shared image preview controls.
- `interface-chrome`: Add accessible dashboard editing, responsive grids, reorder controls, dialogs, and empty states.
- `interface-localization`: Localize all dashboard builder, query, widget, filter, drill-down, truncation, and export copy in six catalogs.
- `privacy-safety`: Keep query execution, chart rendering, and DOM image capture local and reject remote export resources.
- `project-tooling`: Bundle and validate Recharts and html-to-image and update deterministic screenshot coverage without changing the gallery count.

## Impact

- Affects shared State types and validation, blank State, store capture/load/save and BroadcastChannel synchronization, server SQLite persistence, Analytics UI, Employee/custom-field/View deletion guards, image previews, screenshot fixtures, tests, and documentation.
- Adds locally bundled `recharts`, matching `react-is`, and `html-to-image` dependencies. No organization data, query, image, font, or resource is sent to a third party.
- Replaces three fixed Analytics gallery frames with empty/view, builder, and PNG-preview coverage while preserving 59 PNG files.
- Historical organization snapshots and user-authored formula languages remain out of scope; queries use the current State and the maintained typed field/aggregation builder.
