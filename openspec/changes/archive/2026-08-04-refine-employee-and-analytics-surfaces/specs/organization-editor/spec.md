## MODIFIED Requirements

### Requirement: The generic editor retains six product surfaces
The application SHALL provide localized Units, Employees, Org Editor, Analytics, Calendar, and
Download surfaces in that visual and keyboard order, with Org Editor active for a blank workspace,
a compact accessible monochrome text-only Org Tools brand without an intervening icon or emoji and
without text shadows, and consistent actionable top-level empty states. A populated Employees
surface SHALL show the total catalog count and SHALL additionally show the visible match count only
while search or filters are active.

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

#### Scenario: Compact application header
- **WHEN** the product shell renders in light or dark theme
- **THEN** it shows the accessible monochrome text-only `Org Tools` brand in the active foreground color with no gradient or drop shadow
- **AND** no icon or emoji appears between `Org` and `Tools`
- **AND** the header actions are Import followed by Export while the active View and organization count subtitle remain omitted

#### Scenario: Populated Employee catalog count
- **WHEN** the Employees surface contains Employees and no search or filter is active
- **THEN** its header shows the localized total Employee count without a match count

#### Scenario: Filtered Employee catalog count
- **WHEN** Employee search or filters are active
- **THEN** the header keeps the localized total Employee count and adds the localized visible match count

### Requirement: Calendar and analytics use normalized birthdays
The application SHALL use nullable `MM-DD` birthdays for Calendar and birthday analytics, SHALL
navigate a selected month and year across year boundaries, SHALL project February 29 birthdays to
February 28 in non-leap years, SHALL include exact-date global Main Employee tag events, SHALL fit a
31-day grid and bounded tag cloud without page scroll at the maintained 1280 by 720 desktop
viewport, and SHALL render Analytics as one continuous surface with a single header divider,
borderless content-sized groups, and no outer card matrix or repeated row rules. Each Analytics
group SHALL show at most eight estimated 42 px rows before using its existing virtualized internal
scroll container.

#### Scenario: Birthday display
- **WHEN** an Employee has a valid birthday and the calendar displays the corresponding year and month
- **THEN** the Employee appears on the matching day, using February 28 for a February 29 birthday in a non-leap year, and in birthday aggregates

#### Scenario: Calendar navigation layout
- **WHEN** Calendar has birthday or dated-tag data on a maintained desktop viewport
- **THEN** its header shows month and year followed by Previous and Next, and the remaining cloud and grid fit without horizontal or vertical page overflow

#### Scenario: Continuous Analytics surface
- **WHEN** Analytics is ready
- **THEN** all six sortable virtualized groups and drill-down actions remain available in two desktop columns and one narrow-screen column
- **AND** whitespace plus hover or focus feedback separates borderless group rows while only the surface header retains a horizontal divider

#### Scenario: Short Analytics group
- **WHEN** an Analytics group contains fewer than eight entries
- **THEN** the group height follows its title, table header, and rendered rows without reserving a fixed 384 px block

#### Scenario: Long Analytics group
- **WHEN** an Analytics group contains more than eight entries
- **THEN** eight rows remain visible and additional virtualized rows are reachable through internal scrolling
