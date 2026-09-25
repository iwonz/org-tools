# analytics-dashboard-builder Specification

## Purpose
Define local configurable analytics dashboards, typed current-state queries, interactive drill-down, and local PNG export.

## Requirements

### Requirement: Dashboards have a complete draft lifecycle
Analytics SHALL start with zero dashboards and SHALL support creating blank dashboards or copies, renaming, reordering, deleting, and selecting up to 32 named dashboards. Edit mode MUST isolate every definition change until Save atomically validates and applies the complete draft; Cancel MUST discard it. Copy MUST allocate new UUIDs for the dashboard and all descendants and rewrite internal filter targets.

#### Scenario: Cancel a new dashboard
- **WHEN** a user creates and configures a dashboard in edit mode and chooses Cancel
- **THEN** the saved dashboard collection and durable active dashboard remain unchanged

#### Scenario: Save a copied dashboard
- **WHEN** a user copies a dashboard and saves the draft
- **THEN** the equivalent copy has unique descendant IDs and every copied filter targets copied widgets

### Requirement: Panels, tabs, and widgets form bounded responsive grids
A dashboard SHALL contain at most 64 ordered named panels with widths 1/3, 2/3, or 3/3. A panel SHALL contain at most 16 named tabs, and each tab SHALL contain at most 32 ordered widgets in a two-column grid with width 1/2 or 2/2 and height S, M, or L. Pointer drag and keyboard controls SHALL reorder dashboards, panels, tabs, and widgets. Both grids MUST collapse to one column on narrow screens.

#### Scenario: Render only active content
- **WHEN** a dashboard and one tab per panel are active
- **THEN** inactive dashboards and inactive tab contents are neither rendered nor queried

#### Scenario: Reorder by keyboard
- **WHEN** a focused panel or widget is moved with its keyboard reorder control
- **THEN** the draft order changes once and an accessible announcement identifies the new position

### Requirement: Widgets cover the maintained analytical catalog
Analytics SHALL support KPI, table, pivot, vertical/horizontal bar, line/area, pie/donut, gauge, and filter widgets as a strict discriminated union. Each data widget SHALL select one View, dataset, typed query, grid size, title, description, and applicable presentation settings for legend, labels, number format, orientation, stacking, palette, and series overrides.

#### Scenario: Configure each chart family
- **WHEN** a user changes a chart subtype, orientation, stacking, legend, label, format, or palette option and saves
- **THEN** the active widget renders the saved local presentation with an accessibility layer

### Requirement: Queries operate on explicit current-data grains
Each widget SHALL query Employees, assignments, Tag assignments, or records of one selected Composite field. Available semantic fields SHALL include Employee built-ins, Unit context, Tags and dates, scalar custom values, Template values, and selected Composite subfields; option UUIDs MUST resolve through current labels. Multi-values SHALL expand as categories while preserving Employee identity.

Queries SHALL support typed dimensions, local predicates, sorting, Top N, day/week/month/quarter/year date grouping, row count, distinct Employee count, distinct value count, and numeric sum, average, minimum, and maximum. Line and area results MUST use existing current-state dates and MUST NOT create history.

#### Scenario: Avoid duplicate Employee counting
- **WHEN** one Employee produces several assignment, Tag, or multi-value rows and a measure counts distinct Employees
- **THEN** that Employee contributes exactly once to the measure group

#### Scenario: Group a current date
- **WHEN** a date dimension is grouped by calendar quarter
- **THEN** only populated dates in the current organization snapshot contribute to localized quarter buckets

### Requirement: Dashboard filters target compatible active widgets
A filter widget SHALL define one field, control type, default value, and either all compatible dashboard data widgets or explicit target widget IDs. Filter widgets MUST NOT target filter widgets. Active filter widgets SHALL combine with AND; multiple selected values within one filter SHALL combine with OR. Only filters in active tabs SHALL affect queries. Employee, Tag, and custom fields MAY target widgets across Views; Unit, position, and boss fields MUST target only widgets using the same View.

#### Scenario: Switch an active panel tab
- **WHEN** the old tab contains a filter and the new active tab does not
- **THEN** the old filter stops affecting results and its widget content is not calculated

#### Scenario: Reject an incompatible target
- **WHEN** a Unit-context filter selects a widget that uses another View
- **THEN** validation rejects the target without changing saved definitions

### Requirement: Current filter and drill-down state is durable UI
The active dashboard, active tab per panel, current filter values, and drill-down search/filter state SHALL live in `ui.analytics`, survive reload, and synchronize through BroadcastChannel. Dashboard definitions and filter defaults SHALL live in organization state. Definition deletion MUST prune affected active-tab, filter-value, and target references atomically.

#### Scenario: Delete a targeted widget
- **WHEN** a saved widget is removed with its containing draft and Save succeeds
- **THEN** every filter target and UI entry referencing that widget is removed in the same state update

### Requirement: Drill-down remains current and virtualized
Selecting a chart point, segment, table row, or pivot value SHALL open a bounded virtualized list of current Employee cards resolved from result Employee IDs. The action MUST NOT mutate dashboard filters. Search and current Employee edits/deletes SHALL re-resolve the list without stale snapshots.

#### Scenario: Open a chart segment
- **WHEN** a user activates one categorical segment
- **THEN** a virtualized drill-down opens with the segment's current Employees and dashboard filters stay unchanged

### Requirement: Tables and pivots are bounded and explicit
Tables SHALL provide a sticky header, virtual scrolling, sorting, totals, and at most 20,000 result rows. Pivots SHALL provide row and column dimensions, values, subtotals, a grand total, and at most 10,000 materialized cells. Any truncation MUST be visibly identified.

#### Scenario: Truncate an oversized pivot
- **WHEN** a pivot would materialize more than 10,000 cells
- **THEN** it renders the bounded prefix and a localized truncation notice

### Requirement: Analytics queries are lazy, cancellable, and bounded
A local Worker SHALL normalize only Views requested by active content, calculate only active-tab widgets visible through IntersectionObserver, and calculate filter options only while the filter is open. It SHALL deduplicate identical work, cancel obsolete consumers, and maintain bounded LRU caches keyed by relevant View/global revisions, query, and active filters.

#### Scenario: Navigate a large dashboard
- **WHEN** 20,000 Employees and 4,000 Units exist and the user switches dashboards or tabs
- **THEN** obsolete requests are ignored, inactive content is not materialized, and no organization write occurs

### Requirement: Widgets and active panel tabs export locally to PNG
Every data widget and panel SHALL offer PNG export through a preview dialog with background, padding, and corner radius. Panel export SHALL capture only its active tab. Table capture SHALL preserve the current visible size and scroll position. Preview MUST respect 8 MP; Copy and Save MUST request 3x and respect 32 MP and 16,384 px limits. Capture SHALL wait for local fonts and settled SVG layout and omit edit chrome, drag handles, and action menus.

#### Scenario: Export an active panel tab
- **WHEN** a panel has multiple tabs and the user opens panel PNG export
- **THEN** preview, Copy, and Save contain only the active tab without constructor controls
