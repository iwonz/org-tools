## MODIFIED Requirements

### Requirement: The generic editor retains six product surfaces
The application SHALL provide localized Units, Employees, Org Editor, Analytics, Calendar, and
Export surfaces in that visual and keyboard order, with Org Editor active for a blank workspace, a
compact accessible Org Tools brand in the header, and consistent actionable top-level empty states.

#### Scenario: Product navigation order
- **WHEN** the product shell renders in either locale
- **THEN** Export is the final tab after Calendar in both DOM and keyboard navigation order

#### Scenario: Empty workspace navigation
- **WHEN** the workspace has no Units or Employees in either supported locale
- **THEN** each tab remains reachable and shows the shared localized empty layout without controls that require absent data

#### Scenario: Feature-specific empty data
- **WHEN** Export or Analytics has no Employees or Calendar has no birthdays
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
- **THEN** it shows the accessible `Org 🧩 Tools` brand with a restrained graphite-to-blue gradient split continuously across both words
- **AND** it omits the active View and organization count subtitle

### Requirement: Calendar and analytics use normalized birthdays
The application SHALL use nullable `MM-DD` birthdays for Calendar and birthday analytics, SHALL put
the active month followed by Previous and Next actions in the Calendar header, SHALL fit a 31-day
grid without page scroll at the maintained 1280 by 720 desktop viewport, and SHALL render Analytics
as one continuous surface without a bordered card lattice.

#### Scenario: Birthday display
- **WHEN** an Employee has a valid birthday
- **THEN** the Employee appears on the matching Calendar day and birthday aggregates

#### Scenario: Calendar navigation layout
- **WHEN** Calendar has birthday data on a maintained desktop viewport
- **THEN** its header orders month, Previous, and Next on the right and the remaining grid uses four or five adaptive rows without horizontal or vertical overflow

#### Scenario: Continuous Analytics surface
- **WHEN** Analytics is ready
- **THEN** all six sortable virtualized groups and drill-down actions remain available without separate card backgrounds or the outer border matrix
