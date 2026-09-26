# Change: Flatten Analytics into one board

## Why

The current Analytics hierarchy exposes multiple dashboards and panels even though the product needs one analytical workspace. Filters are modeled as layout widgets, and tabs cannot be omitted, which adds persistent structure and UI controls without useful behavior.

## What Changes

- Replace the dashboard collection with one anonymous Analytics configuration containing filters, tabs, and widgets.
- Remove dashboard and panel lifecycle controls and panel layout.
- Make tabs optional and store widget membership through an optional tab reference.
- Promote filters to a board-level entity outside the widget grid.
- Preserve draft Save/Cancel, typed queries, lazy execution, drill-down, widget sizing, and local PNG export.
- Export the current widget grid without filter or tab chrome.
- Replace the exact State shape and convert the configured owned SQLite snapshot once outside runtime.

## Impact

- Affected capabilities: analytics-dashboard-builder, interface-chrome, interface-localization, project-tooling, single-state-runtime, state-transfer.
- Affected code: Analytics types/parser/store, constructor UI, filter rendering, image export, fixtures, browser tests, documentation, and localization catalogs.
