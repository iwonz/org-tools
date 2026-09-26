# analytics-dashboard-builder Specification

## Purpose
Define one local configurable Analytics board, typed current-state queries, interactive drill-down, and local PNG export.

## Requirements

### Requirement: Analytics owns one anonymous board
Analytics SHALL persist one anonymous configuration containing ordered filters, tabs, and widgets. The blank configuration MUST contain three empty arrays. Edit mode MUST isolate the complete configuration until Save atomically applies it; Cancel MUST discard it. Dashboard selection, naming, copy, creation, deletion, and panels MUST NOT exist.

#### Scenario: Open blank Analytics
- **WHEN** the organization has an empty Analytics configuration
- **THEN** one empty board and one Edit action render without dashboard or panel controls

### Requirement: Optional tabs scope one widget grid
Analytics SHALL allow zero through 16 ordered named tabs. Widgets SHALL belong to root when tabs are absent and to exactly one tab when tabs exist. Each scope SHALL contain at most 32 ordered widgets in a two-column half/full-width grid that collapses to one column on narrow screens.

#### Scenario: Create the first tab
- **WHEN** root widgets exist and the first tab is created
- **THEN** every existing widget moves to that tab without changing its ID or settings

#### Scenario: Delete a tab safely
- **WHEN** a tab is deleted
- **THEN** its widgets move to the next tab, otherwise the previous tab, or root when the final tab is removed

#### Scenario: Reorder by keyboard
- **WHEN** a focused tab or widget is moved with its keyboard reorder control
- **THEN** the draft order changes once and an accessible announcement identifies the new position

### Requirement: Widgets cover the maintained analytical catalog
Analytics SHALL support KPI, table, pivot, vertical/horizontal bar, line/area, pie/donut, and gauge data widgets as a strict discriminated union. Filters SHALL be a separate board-level entity. Each data widget SHALL select one View, dataset, typed query, optional tab, grid size, title, description, and applicable presentation settings for legend, labels, number format, orientation, stacking, palette, and series overrides.

#### Scenario: Configure each chart family
- **WHEN** a user changes a chart subtype, orientation, stacking, legend, label, format, or palette option and saves
- **THEN** the active widget renders the saved local presentation with an accessibility layer

#### Scenario: Reject a filter widget
- **WHEN** State places a filter discriminator inside the widget array
- **THEN** strict validation fails without changing saved Analytics

### Requirement: Queries operate on explicit current-data grains
Each widget SHALL query Employees, assignments, Tag assignments, or records of one selected Composite field. Available semantic fields SHALL include Employee built-ins, Unit context, Tags and dates, scalar custom values, Template values, and selected Composite subfields; option UUIDs MUST resolve through current labels. Multi-values SHALL expand as categories while preserving Employee identity.

Queries SHALL support typed dimensions, local predicates, sorting, Top N, day/week/month/quarter/year date grouping, row count, distinct Employee count, distinct value count, and numeric sum, average, minimum, and maximum. Line and area results MUST use existing current-state dates and MUST NOT create history.

#### Scenario: Avoid duplicate Employee counting
- **WHEN** one Employee produces several assignment, Tag, or multi-value rows and a measure counts distinct Employees
- **THEN** that Employee contributes exactly once to the measure group

#### Scenario: Group a current date
- **WHEN** a date dimension is grouped by calendar quarter
- **THEN** only populated dates in the current organization snapshot contribute to localized quarter buckets

### Requirement: Filters are independent and global
Analytics SHALL store up to 32 ordered filters outside the widget grid. Filters SHALL remain visible across tab changes, combine through AND with OR inside a multi-value filter, and target all compatible widgets by default or explicit widget IDs across tabs. Unit-context filters MUST target only widgets using the same View.

#### Scenario: Delete a filter
- **WHEN** a saved filter is removed
- **THEN** its definition and durable current value are removed atomically without deleting widgets

#### Scenario: Reject an incompatible target
- **WHEN** a Unit-context filter selects a widget that uses another View
- **THEN** validation rejects the target without changing saved definitions

### Requirement: Singleton Analytics UI is durable
The active tab, current filter values, and drill-down state SHALL live in `ui.analytics`, survive reload, and synchronize through BroadcastChannel. Deleting tabs, filters, or widgets MUST prune affected UI and target references atomically.

#### Scenario: Delete a targeted widget
- **WHEN** a saved widget is removed with its containing draft and Save succeeds
- **THEN** every filter target and UI entry referencing that widget is removed in the same state update

#### Scenario: Remove the active final tab
- **WHEN** the final tab is removed
- **THEN** its widgets become root widgets and durable active tab becomes null

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
A local Worker SHALL calculate only root widgets or widgets of the active tab that are visible through IntersectionObserver, and SHALL calculate filter options only while a board-level filter is open. It SHALL deduplicate identical work, cancel obsolete consumers, and maintain bounded revision-aware LRU caches.

#### Scenario: Switch a tab
- **WHEN** a user selects another Analytics tab
- **THEN** old-tab widgets unmount, obsolete work is ignored, and only visible new-tab widgets calculate

#### Scenario: Navigate a large board
- **WHEN** 20,000 Employees and 4,000 Units exist and the user switches tabs
- **THEN** obsolete requests are ignored, inactive content is not materialized, and no organization write occurs

### Requirement: Widget grids export locally to PNG
Every data widget and the current board widget grid SHALL offer PNG export through a preview dialog with background, padding, and corner radius. Board export SHALL contain only root widgets or active-tab widgets and MUST omit filters, tabs, constructor controls, and action menus. Table capture SHALL preserve the current visible size and scroll position. Preview MUST respect 8 MP; Copy and Save MUST request 3x and respect 32 MP and 16,384 px limits. Capture SHALL wait for local fonts and settled SVG layout and local resources.

#### Scenario: Export a tabbed board
- **WHEN** one Analytics tab is active and board PNG preview opens
- **THEN** only that tab's widget grid appears without filter or tab chrome
