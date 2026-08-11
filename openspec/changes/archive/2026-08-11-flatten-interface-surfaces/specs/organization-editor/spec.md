## MODIFIED Requirements

### Requirement: The generic editor retains six product surfaces
The application SHALL provide localized Units, Employees, Editor, Analytics, Calendar, and Download
surfaces in that visual and keyboard order, with Editor active for a blank workspace, no visible
wordmark or brand icon, and consistent actionable top-level empty states. A populated Employees
surface SHALL show the total catalog count below search and SHALL additionally show the visible match
count only while search or filters are active. The populated Org Editor SHALL place View management,
layout, hierarchy, and search controls in one flat top-left group and viewport controls in one flat
bottom-left group without enclosing toolbar islands. The Editor canvas SHALL retain a distinct
neutral-gray background while application chrome and ordinary workflow content use the continuous
root surface.

#### Scenario: Product navigation order
- **WHEN** the product shell renders in either locale
- **THEN** Download is the final tab after Calendar in both DOM and keyboard navigation order

#### Scenario: Empty workspace navigation
- **WHEN** the workspace has no Units or Employees in either supported locale
- **THEN** each tab remains reachable and shows the shared localized empty layout without controls that require absent data

#### Scenario: Feature-specific empty data
- **WHEN** Download or Analytics has no Employees or Calendar has no birthdays or dated tags
- **THEN** the surface omits its data chrome and offers one relevant action through the shared empty layout

#### Scenario: Empty Org Editor
- **WHEN** the active View contains no Units
- **THEN** layout and zoom controls are absent, an add-to-canvas action is available, and View management remains only when multiple Views require it

#### Scenario: Localized active View label
- **WHEN** the Org Editor displays the built-in Main View in either supported locale
- **THEN** the localized label remains fully visible on one line inside the View selector without overlapping adjacent controls
- **AND** longer user-authored View names remain contained with a single-line ellipsis

#### Scenario: Unified application header
- **WHEN** the product shell renders in light or dark theme
- **THEN** one 56 px header contains the six flat product tabs on the left and flat locale, theme, Import, and Export actions on the right without a visible wordmark
- **AND** Import and Export use matched document-arrow icons while the active View and organization count subtitle remain omitted

#### Scenario: Narrow application header
- **WHEN** the viewport is narrower than 1024 px
- **THEN** Import and Export hide their visible labels but retain localized accessible names and tooltips
- **AND** the tab region scrolls horizontally without page-level overflow or changing tab order

#### Scenario: Populated Employee catalog count
- **WHEN** the Employees surface contains Employees and no search or filter is active
- **THEN** the localized total Employee count appears below the search field without a redundant Employees heading

#### Scenario: Filtered Employee catalog count
- **WHEN** Employee search or filters are active
- **THEN** the count line keeps the localized total Employee count and adds the localized visible match count

#### Scenario: Flat Editor control groups
- **WHEN** the active View contains Units
- **THEN** View selection and actions, layout, arrange, hierarchy, and Search appear in one spaced top-left group without an enclosing border, fill, radius, shadow, or backdrop
- **AND** zoom out, zoom in, scale reset, and primary-Team focus appear in one spaced bottom-left group with the same flat treatment

#### Scenario: Editor search placement
- **WHEN** Search is the final control in the top-left group and the user opens it
- **THEN** the field appears to the right of its trigger while the complete group and results remain within the viewport

#### Scenario: Neutral Editor canvas
- **WHEN** the Org Editor is visible in light or dark theme
- **THEN** its canvas uses a neutral-gray canvas background distinct from the root application surface
- **AND** Team nodes, selection, connectors, search, and viewport controls remain legible

### Requirement: Calendar and analytics use normalized birthdays
The application SHALL use nullable `MM-DD` birthdays for Calendar and birthday analytics, SHALL
navigate a selected month and year across year boundaries, SHALL project February 29 birthdays to
February 28 in non-leap years, SHALL include exact-date global Main Employee tag events, SHALL fit a
31-day grid and bounded tag cloud without page scroll at the maintained 1280 by 720 desktop
viewport, and SHALL render Analytics as six content-sized groups directly on one continuous root
surface with compact gaps and no outer island, nested group fill, header rule, or repeated row rule.
Each Analytics group SHALL show at most eight estimated 42 px rows before using its existing
virtualized internal scroll container.

#### Scenario: Birthday display
- **WHEN** an Employee has a valid birthday and the calendar displays the corresponding year and month
- **THEN** the Employee appears on the matching day, using February 28 for a February 29 birthday in a non-leap year, and in birthday aggregates

#### Scenario: Calendar navigation layout
- **WHEN** Calendar has birthday or dated-tag data on a maintained desktop viewport
- **THEN** its header shows month and year followed by Previous and Next, and the remaining cloud and grid fit without horizontal or vertical page overflow

#### Scenario: Flat Analytics surface
- **WHEN** Analytics is ready
- **THEN** all six sortable virtualized groups and drill-down actions remain available directly on one continuous root surface in two desktop columns and one narrow-screen column
- **AND** compact gaps, headings, columns, scrolling, and hover or focus feedback separate groups and rows without an outer island, nested background tile, or horizontal divider line

#### Scenario: Short Analytics group
- **WHEN** an Analytics group contains fewer than eight entries
- **THEN** the group height follows its title, table header, and rendered rows without reserving a fixed 384 px block

#### Scenario: Long Analytics group
- **WHEN** an Analytics group contains more than eight entries
- **THEN** eight rows remain visible and additional virtualized rows are reachable through internal scrolling
