## REMOVED Requirements

### Requirement: Dashboards have a complete draft lifecycle

### Requirement: Panels, tabs, and widgets form bounded responsive grids

### Requirement: Dashboard filters target compatible active widgets

### Requirement: Current filter and drill-down state is durable UI

### Requirement: Widgets and active panel tabs export locally to PNG

## MODIFIED Requirements

### Requirement: Widgets cover the maintained analytical catalog
Analytics SHALL support KPI, table, pivot, vertical/horizontal bar, line/area, pie/donut, and gauge data widgets as a strict discriminated union. Filters SHALL be a separate board-level entity. Each data widget SHALL select one View, dataset, typed query, optional tab, grid size, title, description, and applicable presentation settings.

#### Scenario: Reject a filter widget
- **WHEN** State places a filter discriminator inside the widget array
- **THEN** strict validation fails without changing saved Analytics

### Requirement: Analytics queries are lazy, cancellable, and bounded
A local Worker SHALL calculate only root widgets or widgets of the active tab that are visible through IntersectionObserver, and SHALL calculate filter options only while a board-level filter is open. It SHALL deduplicate identical work, cancel obsolete consumers, and maintain bounded revision-aware LRU caches.

#### Scenario: Switch a tab
- **WHEN** a user selects another Analytics tab
- **THEN** old-tab widgets unmount, obsolete work is ignored, and only visible new-tab widgets calculate

## ADDED Requirements

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

### Requirement: Filters are independent and global
Analytics SHALL store up to 32 ordered filters outside the widget grid. Filters SHALL remain visible across tab changes, combine through AND with OR inside a multi-value filter, and target all compatible widgets by default or explicit widget IDs across tabs. Unit-context filters MUST target only widgets using the same View.

#### Scenario: Delete a filter
- **WHEN** a saved filter is removed
- **THEN** its definition and durable current value are removed atomically without deleting widgets

### Requirement: Singleton Analytics UI is durable
The active tab, current filter values, and drill-down state SHALL live in `ui.analytics`, survive reload, and synchronize through BroadcastChannel. Deleting tabs, filters, or widgets MUST prune affected UI and target references atomically.

#### Scenario: Remove the active final tab
- **WHEN** the final tab is removed
- **THEN** its widgets become root widgets and durable active tab becomes null

### Requirement: Widget grids export locally to PNG
Every data widget and the current board widget grid SHALL offer PNG export. Board export SHALL contain only root widgets or active-tab widgets and MUST omit filters, tabs, constructor controls, and action menus. Existing pixel limits, local fonts, settled SVG layout, and local-resource restrictions SHALL remain.

#### Scenario: Export a tabbed board
- **WHEN** one Analytics tab is active and board PNG preview opens
- **THEN** only that tab's widget grid appears without filter or tab chrome
