## Why

The Analytics section adds a large dashboard, query, rendering, and export subsystem that is disproportionate to the product and no longer belongs in Org Tools. Removing it reduces the persistent contract, runtime surface, dependencies, maintenance burden, and navigation complexity while preserving every remaining organization workflow.

## What Changes

- **BREAKING** Remove Analytics from product navigation and delete its board, filters, tabs, widgets, drill-down, local Worker, chart rendering, and PNG export.
- **BREAKING** Remove `organization.analytics`, `ui.analytics`, the `analytics` active-tab value, and every exported Analytics type from exact State. Runtime readers do not accept the preceding State shape.
- Remove Analytics-only deletion guards, messages, CSS, fixtures, tests, documentation, screenshots, and the Recharts, react-is, and html-to-image dependencies.
- Reduce the maintained screenshot gallery from 59 to 56 PNG files by deleting the three Analytics scenarios.
- Convert the configured owned SQLite once, preserving a timestamped database-family backup and redirecting a saved Analytics active tab to Employees.
- Retain the general privacy prohibition on third-party analytics or telemetry and retain historical archived OpenSpec changes as audit history.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics-dashboard-builder`: Remove the complete product capability.
- `custom-employee-fields`: Remove Analytics field exposure and reference protection.
- `employee-model`: Remove Analytics from fallback Employee-card contexts.
- `interface-chrome`: Remove Analytics navigation and surface requirements.
- `interface-localization`: Remove Analytics-only catalog requirements and copy.
- `organization-editor`: Remove Analytics projections, birthday summaries, and surface behavior.
- `organization-views`: Remove Analytics View selection and deletion protection.
- `privacy-safety`: Remove Analytics calculation and image-capture requirements while retaining the no-telemetry guarantee.
- `project-tooling`: Remove Analytics dependencies, fixtures, performance checks, and three gallery scenarios.
- `single-state-runtime`: Remove Analytics definitions and UI from exact State.
- `state-transfer`: Remove Analytics from complete State transfer and projection requirements.

## Impact

The change deletes the Analytics UI and local computation modules, simplifies shared types, parsers, the MobX store, persistence, and synchronization, updates all six locale catalogs, and changes the exact State accepted by server and Pages runtimes. Existing Analytics configuration is intentionally discarded by the one-time owned SQLite conversion and remains recoverable only from the ignored backup.
