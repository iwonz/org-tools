## 1. Exact contracts

- [x] 1.1 Replace dashboard/panel/filter-widget types with singleton Analytics configuration, independent filters/tabs, data widgets, and exact UI state.
- [x] 1.2 Update strict parsing, graph validation, defaults, State transfer, store persistence, BroadcastChannel reconciliation, and View/custom-field deletion guards.
- [x] 1.3 Add lifecycle helpers for first-tab adoption, safe tab deletion, filter/widget cleanup, and scoped reordering.

## 2. Constructor and rendering

- [x] 2.1 Flatten Analytics view/edit states into one board with no dashboard or panel controls.
- [x] 2.2 Implement optional tab lifecycle and root/active-tab widget grid with pointer and keyboard ordering.
- [x] 2.3 Implement the separate global filter strip and filter editor with lazy options and compatible targeting.
- [x] 2.4 Adapt widget querying, durable filter values, drill-down, and deletion cleanup to the singleton model.
- [x] 2.5 Replace panel export with board-grid PNG export that omits filter/tab chrome while retaining widget export.

## 3. Product surfaces

- [x] 3.1 Update all six localization catalogs and remove obsolete dashboard/panel lifecycle copy.
- [x] 3.2 Update architecture, usage, performance, privacy, screenshot documentation, and OpenSpec capabilities.
- [x] 3.3 Update the deterministic fixture and three Analytics gallery scenarios while preserving exactly 59 PNG files.

## 4. Verification and migration

- [x] 4.1 Cover exact State, relationships, lifecycle movement, cleanup, deletion guards, and query compatibility with unit tests.
- [x] 4.2 Cover empty/edit/save/cancel, tabs, filters, reorder, responsive/RTL, laziness, drill-down, and both PNG paths in browser tests.
- [x] 4.3 Stop runtime, back up and convert the configured SQLite once, validate preservation with the production parser, and prove startup.
- [x] 4.4 Run the full AGENTS.md checks, generate and inspect the 59-PNG gallery twice, and compare deterministic hashes.
- [x] 4.5 Sync and archive OpenSpec, integrate current origin/main, push main, remove the change branch, and verify a clean synchronized repository.
