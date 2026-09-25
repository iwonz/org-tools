## Context

Analytics is currently one eager system-View calculation rendered by a fixed component. The requested builder crosses the exact State, View derivation, custom fields, worker execution, responsive UI, SVG charting, DOM capture, local persistence, and deterministic browser/screenshot suites. Both server and Pages deliveries must use the same local implementation and preserve the 20,000 Employee / 4,000 Unit target.

## Goals / Non-Goals

**Goals:**

- Persist strict dashboard definitions separately from current dashboard interaction state.
- Support bounded dashboard, panel, tab, widget, query, filter, drill-down, and PNG workflows.
- Calculate only active and visible content in a cancellable local Worker with revision-aware reuse.
- Resolve fields and option labels from current Views and global catalogs without copying organization data into persistent widget results.
- Keep all chart and image resources locally bundled and preserve exact draft cancellation and atomic save.

**Non-Goals:**

- Historical snapshots, scheduled refresh, remote data sources, telemetry, collaboration servers, or network export.
- A user-authored expression language, arbitrary SQL, joins outside the defined dataset grains, or chart cross-filtering.
- Persisting query results, rendered SVG, captured images, open menus, constructor drafts, or IntersectionObserver state.

## Decisions

### Strict definitions and bounded UI state

`organization.analyticsDashboards` stores ordered dashboard definitions. `ui.analytics` stores only the active dashboard ID, active tab IDs, current filter values, and drill-down query/filter state. Widgets use a strict discriminated union whose shared source, query, size, and presentation fields are specialized by type. Parsers enforce UUID/reference integrity and the 32/64/16/32 collection limits. This keeps definitions portable while allowing interaction state to synchronize and survive reload.

An editor session deep-clones the complete dashboard collection into a transient draft. Create, copy, rename, reorder, delete, panel/tab/widget edits, and internal reference rewrites affect only that draft. Save validates and replaces definitions plus cleans UI references in one store action; Cancel discards the draft. Copy allocates fresh UUIDs and rewrites filter targets.

### Explicit row grains and typed query model

Every widget chooses one View and one of four row grains: Employee, assignment, Tag assignment, or records from one Composite field. The snapshot builder emits stable row IDs, Employee IDs, typed built-ins, View context, resolved option labels, scalar/Template custom values, and typed composite cells. Multi-values expand during grouping while the original Employee ID remains available for distinct counting.

Queries refer to stable semantic field references instead of display labels. The engine supports dimensions with optional date grouping, typed local predicates, ordered measures, sorting, and Top N. Supported measures are row count, distinct Employee count, distinct value count, and numeric sum/average/minimum/maximum. Result contracts are discriminated for KPI, tabular, pivot, categorical, gauge, and filter-options output and carry Employee IDs for drill-down.

### Worker ownership, laziness, and caching

A browser Worker owns normalized per-View snapshots and the query/result caches. Main-thread requests include organization and View revision tokens, the minimal current catalogs/documents needed by that dataset, query, and active dashboard-filter values. The Worker deduplicates equivalent in-flight queries, checks request generation before publishing, and stores bounded least-recently-used snapshots/results. Newer requests cancel obsolete consumers. The component mounts only the active dashboard and active tab; each non-filter widget requests data after IntersectionObserver visibility. Filter option requests start only when the control opens.

The synchronous query core is pure and unit-testable. A small transport falls back to the same async core only when Worker construction is unavailable, preserving Pages/test behavior without changing results.

### Responsive composition and accessible ordering

Dashboard panels use a three-column CSS grid and span one, two, or three columns. Active tab widgets use a nested two-column grid and span one or two columns; height presets map to bounded viewport-independent minimum heights. Both grids collapse to one column at the maintained narrow breakpoint. Native pointer drag uses stable item IDs, while adjacent move buttons and keyboard shortcuts provide the same reorder commands and announcements.

Inactive dashboards and inactive tabs are not mounted. Tables and employee drill-down use the existing virtual-list primitives. Tables cap results at 20,000 rows; pivots cap materialized cells at 10,000 and show an explicit localized truncation status.

### Local visualization and capture

Recharts 3 supplies responsive SVG chart primitives and its accessibility layer. Chart points, segments, and table rows expose result Employee IDs to open the virtualized drill-down; selection never mutates filters. Palette settings use existing local colors with per-series overrides.

Widget and panel export capture the already rendered DOM with bundled `html-to-image`. Panel capture targets only the active tab. Tables preserve their current visible viewport and scroll position. Preview uses the existing 8 MP limit; copy/save request 3x and apply the existing 32 MP and 16,384 px clamp. Export clones omit nodes marked as edit chrome or action menus, wait for `document.fonts.ready` and two animation frames, and reject non-data/non-local resource URLs. No capture or resource leaves the browser.

### Deletion integrity

View deletion and custom-field deletion consult normalized analytics references and fail with a localized reference message while a saved widget depends on the target. Panel, tab, and widget deletion rewrites filter target arrays and prunes active-tab/filter UI records in the same saved dashboard replacement. Removing a dashboard selects the next dashboard when available or stores `null`.

### Shared image preview icon

The shared image preview owns the Fit control, so `HiOutlineArrowsPointingIn` is added once there and appears for every current and future image preview without duplicated call-site markup.

## Risks / Trade-offs

- **Worker payloads can become large** → send a normalized snapshot once per relevant revision, transfer only selected View/global inputs, reuse bounded snapshots, and cancel stale results.
- **DOM and SVG capture can exceed browser limits** → retain pixel and dimension clamps, show effective scale, capture only one widget or one active panel tab, and keep tables at the visible viewport.
- **Recharts and html-to-image increase the client bundle** → lazy-load Analytics-only rendering and export modules and verify both server and Pages builds.
- **Many query combinations can exhaust memory** → cap definitions/results, use structural query keys and bounded LRU eviction, and never persist results.
- **Field deletion could invalidate saved dashboards** → block deletion before mutation and report each referencing dashboard/widget.
- **Strict State replacement rejects current SQLite** → perform the required one-time offline conversion with family backup and production-parser verification before runtime restart.

## Migration Plan

1. Stop the owned runtime and record the configured SQLite family at revision 34074.
2. Create a timestamped ignored backup of the database and every existing sidecar.
3. Use a temporary uncommitted converter outside the repository to add `organization.analyticsDashboards: []`, replace `ui.analytics` with the new fields, and carry prior `filters` and `query` into drill-down state; increment revision once.
4. Validate a detached candidate with the production parser and compare every unaffected JSON path and database field.
5. Replace the owned row transactionally, validate the committed row, and prove normal startup.
6. Roll back by stopping the runtime and restoring the retained database family if verification fails. Runtime compatibility parsing is not added.

## Open Questions

None. Widget formulas, remote sources, and historical storage are explicitly deferred.
