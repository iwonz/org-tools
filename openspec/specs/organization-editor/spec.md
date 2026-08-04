# organization-editor Specification

## Purpose
Define the retained editor surfaces, View isolation, and birthday-driven product behavior.
## Requirements
### Requirement: The generic editor retains six product surfaces
The application SHALL provide localized Units, Employees, Org Editor, Analytics, Calendar, and
Download surfaces in that visual and keyboard order, with Org Editor active for a blank workspace,
a compact accessible monochrome text-only Org Tools brand without an intervening icon or emoji and
without text shadows, and consistent actionable top-level empty states.

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

### Requirement: Main and custom Views remain independent
The editor SHALL preserve the canonical Main View, custom Views, Live Units, undo/redo, drag-and-drop, layout, and viewport isolation.

#### Scenario: Custom View edit
- **WHEN** a global Employee or Unit is edited only in a custom View
- **THEN** the Main View remains unchanged

### Requirement: Calendar and analytics use normalized birthdays
The application SHALL use nullable `MM-DD` birthdays for Calendar and birthday analytics, SHALL navigate a selected month and year across year boundaries, SHALL project February 29 birthdays to February 28 in non-leap years, SHALL include exact-date global Main Employee tag events, SHALL fit a 31-day grid and bounded tag cloud without page scroll at the maintained 1280 by 720 desktop viewport, and SHALL render Analytics as one continuous surface without a bordered card lattice.

#### Scenario: Birthday display
- **WHEN** an Employee has a valid birthday and the calendar displays the corresponding year and month
- **THEN** the Employee appears on the matching day, using February 28 for a February 29 birthday in a non-leap year, and in birthday aggregates

#### Scenario: Calendar navigation layout
- **WHEN** Calendar has birthday or dated-tag data on a maintained desktop viewport
- **THEN** its header shows month and year followed by Previous and Next, and the remaining cloud and grid fit without horizontal or vertical page overflow

#### Scenario: Continuous Analytics surface
- **WHEN** Analytics is ready
- **THEN** all six sortable virtualized groups and drill-down actions remain available without separate card backgrounds or the outer border matrix

### Requirement: Calendar exposes dated tag events and details
The Calendar SHALL show exact-date tag events separately from birthday avatars, limit a day cell to two inline tag events plus an overflow count, and open a localized day dialog with Birthday and Dated tags sections.

#### Scenario: Open a populated day
- **WHEN** a user activates a day containing birthdays and dated tags
- **THEN** the dialog lists both event sections with their Employees and labels

### Requirement: Calendar provides a bounded dated-tag cloud
The Calendar SHALL show all dated tag labels from global Main Employees as localized chips with event counts in at most two rows, disclose overflow without expanding the page, and open a virtualized dialog for the selected label.

#### Scenario: Open a tag from the cloud
- **WHEN** a user activates a dated-tag cloud chip
- **THEN** current and future events appear in ascending date order and past events appear separately in descending date order with localized dates and Employees

#### Scenario: Calendar empty state
- **WHEN** no global Main Employee has either a birthday or a dated tag
- **THEN** the shared Calendar empty state is shown instead of the cloud and grid

### Requirement: Org Editor Employee geometry follows wrapped tags
The Org Editor SHALL compute Employee row heights from all rendered localized tag chips and SHALL
use shared prefix offsets for virtualization, hitboxes, selection, connectors, layout, and bounds.

#### Scenario: Tag rows change
- **WHEN** Employee tags or the active locale changes the packed chip rows
- **THEN** measurements are invalidated and every downstream canvas geometry consumer uses the updated offsets without overlap

#### Scenario: Large View virtualization
- **WHEN** a large View contains variable-height Employee rows
- **THEN** only visible rows render while hit testing and connector anchors remain aligned with their Employees
