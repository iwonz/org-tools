## 1. Contracts and dependencies

- [x] 1.1 Add strict dashboard, panel, tab, widget, query, filter, result, and analytics UI types with collection/reference validation and blank-State defaults.
- [x] 1.2 Add pinned Recharts, matching react-is, and html-to-image dependencies and verify local-only bundling.
- [x] 1.3 Extend store load/capture/save, BroadcastChannel, import/export, and deletion guards for analytics definitions and UI state.

## 2. Query engine

- [x] 2.1 Implement typed field discovery and normalized current-data snapshots for Employee, assignment, Tag, and Composite grains across selected Views.
- [x] 2.2 Implement dimensions, date buckets, typed predicates, measures, sorting, Top N, option labels, multi-value expansion, and result Employee identities.
- [x] 2.3 Implement table/pivot bounds, totals, subtotals, truncation, filter options, compatible active filter targeting, and query serialization.
- [x] 2.4 Add a cancellable local Worker transport with visibility-aware requests, in-flight deduplication, and bounded revision-aware LRU caches.

## 3. Dashboard constructor and widgets

- [x] 3.1 Replace fixed Analytics with empty/view/edit states and atomic draft dashboard lifecycle including clone-ID/reference remapping.
- [x] 3.2 Implement responsive panel/tab/widget grids with widths, heights, active tabs, pointer drag, and keyboard reorder.
- [x] 3.3 Implement the shared typed query and presentation editor for every dataset and widget union member.
- [x] 3.4 Implement KPI, virtual table, pivot, bar, line/area, pie/donut, gauge, and filter renderers with lazy active/visible calculation.
- [x] 3.5 Implement durable filter values and current virtualized Employee drill-down without chart cross-filtering.

## 4. Image export and shared preview

- [x] 4.1 Add the thematic Fit icon to the shared image preview.
- [x] 4.2 Implement local html-to-image widget and active-panel-tab preview/copy/save with 3x output, safety limits, font/SVG settling, and export-chrome exclusion.

## 5. Localization, documentation, and screenshots

- [x] 5.1 Replace obsolete fixed-Analytics copy and add complete dashboard builder messages to all six locale catalogs.
- [x] 5.2 Update architecture, usage, performance, privacy, screenshot documentation, and canonical capability behavior.
- [x] 5.3 Replace the three Analytics gallery scenarios with dashboard view, constructor, and PNG preview while preserving exactly 59 PNG files.

## 6. Automated coverage

- [x] 6.1 Add unit coverage for exact State, lifecycle cloning/cleanup, field discovery, all dataset grains, aggregations, dates, filters, cache invalidation, and bounds.
- [x] 6.2 Add browser coverage for empty start, draft/save/cancel, grids/reorder/tabs, every widget family, drill-down, responsive RTL, laziness, and PNG.
- [x] 6.3 Verify the 20,000 Employee / 4,000 Unit target and local-resource/privacy boundaries.

## 7. Owned SQLite conversion

- [x] 7.1 Stop runtime, back up the revision-34074 SQLite family, convert only analytics organization/UI projections externally, validate candidate and stored row with the production parser, compare unaffected data, and prove startup. (Configured owned snapshot had advanced to revision 34168 before this change; the one-time conversion wrote revision 34169.)

## 8. Validation and delivery

- [x] 8.1 Run format, lint, typecheck, unit, dev, build, browser, Pages, public, OpenSpec, and diff checks.
- [x] 8.2 Generate the 59-image gallery twice, compare deterministic hashes, and visually inspect every PNG.
- [x] 8.3 Synchronize and archive OpenSpec, integrate current origin/main, merge and push main, remove the change branch, and verify a clean synchronized repository with no active changes.
