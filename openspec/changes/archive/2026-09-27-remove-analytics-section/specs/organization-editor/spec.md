## MODIFIED Requirements

### Requirement: Image preview Fit actions use a thematic icon
Every Editor image preview Fit action SHALL place the `HiOutlineArrowsPointingIn` icon before its localized label while retaining its accessible name and behavior.

#### Scenario: Open an image preview
- **WHEN** an Editor image preview is displayed
- **THEN** Fit shows the thematic icon and fits the complete preview without changing export output

## REMOVED Requirements

### Requirement: The generic editor retains six product surfaces
**Reason**: Analytics is removed, leaving five product destinations.
**Migration**: A saved Analytics destination becomes Employees in the owned SQLite conversion; remaining destinations retain their order.

### Requirement: Calendar and analytics use normalized birthdays
**Reason**: Analytics birthday aggregation is removed while Calendar birthday behavior remains.
**Migration**: The replacement Calendar requirement retains every Calendar and Employee birthday rule.

## ADDED Requirements

### Requirement: The generic editor retains five product surfaces
The application SHALL provide localized Employees, Units, Editor, Calendar, and Download surfaces in
that visual and keyboard order, with Editor active for a blank workspace, no visible wordmark or
brand icon, and consistent actionable top-level empty states. A populated Employees surface SHALL
show the total catalog count below search and SHALL additionally show the visible match count only
while search or filters are active. The populated Editor SHALL place Search, layout, hierarchy, and
Image export controls in one compact top logical-end toolbar surface, a View selector and lifecycle
actions at the top logical start, history plus viewport controls at the bottom logical start, and
tools at the bottom geometric center. Editor and Units SHALL operate on the same Unit document only
while the system View is active; custom Views SHALL keep independent Unit documents over the global
Employee catalog. The Editor canvas SHALL retain a distinct neutral-gray background while the
sidebar, context header, and ordinary workflows use the layered shell system. Selected Team nodes
SHALL retain the same opaque background as their resting state and communicate selection only
through the existing semantic boundary. Layout and hierarchy commands SHALL use normal text weight
and place their thematic icon before the label. Closing Editor Search SHALL clear its query, and an
empty query SHALL render no explanatory result surface.

#### Scenario: Product navigation order
- **WHEN** the product shell renders in any supported locale
- **THEN** Download is the final tab after Calendar in both DOM and keyboard navigation order

#### Scenario: Empty workspace navigation
- **WHEN** the workspace has no Units or Employees in either supported locale
- **THEN** each of the five tabs remains reachable and shows the shared localized empty layout without controls that require absent data

#### Scenario: Feature-specific empty data
- **WHEN** Download has no Employees or Calendar has no birthdays or dated tags
- **THEN** the surface omits its data chrome and offers one relevant action through the header or shared empty layout

#### Scenario: Empty Org Editor
- **WHEN** the active View contains no Units
- **THEN** Unit-dependent layout and zoom controls are absent while View management, canvas tools, and full-View Image export remain available

#### Scenario: Sidebar application shell
- **WHEN** the product shell renders in light or dark theme
- **THEN** one dark 240 px sidebar contains the five product destinations followed by Import, Export,
  locale, and theme controls without a visible wordmark or Org Tools title
- **AND** one 64 px content header contains the active workflow icon, localized title, and at most one contextual workflow action

#### Scenario: Narrow application shell
- **WHEN** the viewport is narrower than 1024 px
- **THEN** the sidebar uses a 64 px icon rail whose controls hide visible labels while retaining localized accessible names and tooltips
- **AND** the workspace and icon-only context action remain contained without page-level overflow or changing navigation order

#### Scenario: Populated Employee catalog count
- **WHEN** the Employees surface contains Employees and no search or filter is active
- **THEN** the localized total Employee count appears below the search field without a redundant Employees heading

#### Scenario: Filtered Employee catalog count
- **WHEN** Employee search or filters are active
- **THEN** the count line keeps the localized total Employee count and adds the localized visible match count

#### Scenario: Editor control surfaces
- **WHEN** current Units exist
- **THEN** View management is top-left, Search, layout, hierarchy, and Image export are top-right, history plus viewport controls are bottom-left without an internal separator, and tools are centered at the bottom
- **AND** every toolbar surface shares the same background, blur, radius, six-pixel padding, 48-pixel height, and 36-pixel control height without a decorative border or shadow

#### Scenario: Editor search placement
- **WHEN** Search is the inner-start control in the top logical-end group and the user opens it
- **THEN** the field expands inward from its trigger while the complete group remains within the viewport
- **AND** no results surface appears until the user enters a non-empty query

#### Scenario: Selected Team node
- **WHEN** a Team node is selected or passively hovered in either theme
- **THEN** its computed background and opacity equal its resting presentation
- **AND** selection changes only the existing border color without a shadow, transform, or geometry change

#### Scenario: Close Editor search
- **WHEN** the user closes Editor Search
- **THEN** the field and results close together and the retained query becomes empty

#### Scenario: Neutral Editor canvas
- **WHEN** the Org Editor is visible in light or dark theme
- **THEN** its canvas uses a neutral-gray canvas background distinct from the root application surface
- **AND** Team nodes, selection, connectors, search, and viewport controls remain legible

### Requirement: Calendar uses normalized birthdays
The application SHALL use nullable complete `DD.MM.YYYY` birthdays for Employee forms and exports
and SHALL treat year `1900` as unknown. Employee create and edit SHALL provide coordinated styled
Day, Month, and Year selectors, including an explicit unknown-year choice, and SHALL reject
incomplete or impossible selections. Calendar SHALL navigate a selected month and year across year
boundaries, SHALL project February 29 birthdays to February 28 in non-leap years independent of
whether their birth year is known, SHALL include exact-date Tags, SHALL align dates under
locale-ordered weekdays, and SHALL style actual Saturday and Sunday headings and cells with one
restrained rose weekend tone. Russian weeks SHALL begin Monday and English weeks SHALL begin Sunday.
Calendar SHALL fit its week-aligned grid and bounded Tag rail without page scroll at the maintained
1280 by 720 desktop viewport.

#### Scenario: Birthday selection
- **WHEN** a user creates or edits an Employee birthday
- **THEN** styled Day, Month, and Year selectors produce one valid canonical complete date or null
- **AND** selecting Unknown year persists the chosen day and month with year `1900`

#### Scenario: Birthday display
- **WHEN** an Employee has a valid birthday and the calendar displays the corresponding year and month
- **THEN** the Employee appears on the matching recurring day, using February 28 for a February 29 birthday in a non-leap display year

#### Scenario: Calendar week alignment
- **WHEN** a month begins after the locale's first weekday
- **THEN** leading placeholders align every date below its localized weekday heading

#### Scenario: Weekend styling
- **WHEN** Saturday or Sunday renders in the active locale order
- **THEN** its heading and current-month date cell use the same dedicated tonal surface

#### Scenario: Calendar navigation layout
- **WHEN** Calendar has birthday or dated-tag data on a maintained desktop viewport
- **THEN** its header keeps the Tag rail, month, year, Previous, and Next visible while the week-aligned grid fits without horizontal or vertical page overflow
