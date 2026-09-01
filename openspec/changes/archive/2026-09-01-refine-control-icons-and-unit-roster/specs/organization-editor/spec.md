## MODIFIED Requirements

### Requirement: The generic editor retains six product surfaces
The application SHALL provide localized Units, Employees, Editor, Analytics, Calendar, and Download
surfaces in that visual and keyboard order, with Editor active for a blank workspace, no visible
wordmark or brand icon, and consistent actionable top-level empty states. A populated Employees
surface SHALL show the total catalog count below search and SHALL additionally show the visible match
count only while search or filters are active. The populated Org Editor SHALL place View management,
layout, hierarchy, and search controls in one compact top-left toolbar surface and viewport controls
in one compact bottom-left toolbar surface. The Editor canvas SHALL retain a distinct neutral-gray
background while the sidebar, context header, and ordinary workflows use the layered shell system.
Selected Team nodes SHALL retain the same opaque background as their resting state and communicate
selection only through the existing semantic boundary. The View selector SHALL use the shared styled
Select surface and indicator. Arrange and hierarchy commands SHALL use normal text weight and place
their thematic icon before the label. Closing Editor Search SHALL clear its query, and an empty query
SHALL render no explanatory result surface.

#### Scenario: Product navigation order
- **WHEN** the product shell renders in either locale
- **THEN** Download is the final tab after Calendar in both DOM and keyboard navigation order

#### Scenario: Empty workspace navigation
- **WHEN** the workspace has no Units or Employees in either supported locale
- **THEN** each tab remains reachable and shows the shared localized empty layout without controls that require absent data

#### Scenario: Feature-specific empty data
- **WHEN** Download or Analytics has no Employees or Calendar has no birthdays or dated tags
- **THEN** the surface omits its data chrome and offers one relevant action through the header or shared empty layout

#### Scenario: Empty Org Editor
- **WHEN** the active View contains no Units
- **THEN** layout and zoom controls are absent, an add-to-canvas action is available, and View management remains only when multiple Views require it

#### Scenario: Localized active View label
- **WHEN** the Org Editor displays the built-in Main View in either supported locale
- **THEN** the localized label remains fully visible on one line inside the shared styled View selector without overlapping adjacent controls
- **AND** longer user-authored View names remain contained with a single-line ellipsis

#### Scenario: Sidebar application shell
- **WHEN** the product shell renders in light or dark theme
- **THEN** one dark 240 px sidebar contains the six product destinations followed by Import, Export,
  locale, and theme controls without a visible wordmark or Org Tools title
- **AND** one 64 px content header contains the active workflow icon, localized title, and at most one contextual workflow action

#### Scenario: Narrow application shell
- **WHEN** the viewport is narrower than 1024 px
- **THEN** the sidebar uses a 64 px icon rail whose controls hide visible labels while retaining
  localized accessible names and tooltips
- **AND** the workspace and icon-only context action remain contained without page-level overflow or changing navigation order

#### Scenario: Populated Employee catalog count
- **WHEN** the Employees surface contains Employees and no search or filter is active
- **THEN** the localized total Employee count appears below the search field without a redundant Employees heading

#### Scenario: Filtered Employee catalog count
- **WHEN** Employee search or filters are active
- **THEN** the count line keeps the localized total Employee count and adds the localized visible match count

#### Scenario: Editor control surfaces
- **WHEN** the active View contains Units
- **THEN** View selection and actions, layout, arrange, hierarchy, and Search appear in one compact
  top-left surface with an adaptive tonal background, radius, and padding
- **AND** zoom out, zoom in, scale reset, and primary-Team focus appear in one compact bottom-left surface with the same treatment
- **AND** individual resting controls and both toolbar groups add no decorative border or shadow

#### Scenario: Editor search placement
- **WHEN** Search is the final control in the top-left group and the user opens it
- **THEN** the field appears to the right of its trigger while the complete group remains within the viewport
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

### Requirement: Units detail counts follow the Employee catalog pattern
The selected Unit detail pane SHALL omit redundant direct-Employee and descendant-Employee section
labels and SHALL show the current Employee count in a compact line directly below search. Direct and
descendant Employees SHALL render as one contiguous virtualized list. The count SHALL update from the
current Unit membership and localized plural rules after search, assignment, edit, or deletion.

#### Scenario: Selected Unit Employee count
- **WHEN** a selected Unit contains direct or descendant Employees
- **THEN** one localized Employee count appears below search and no roster-section summary appears above or within the list

#### Scenario: Mixed selected Unit roster
- **WHEN** a selected Unit contains both direct and descendant Employees
- **THEN** their Employee cards retain the existing group order inside one contiguous virtualized list without a section header

#### Scenario: Unit membership changes
- **WHEN** an Employee is assigned, edited, or removed while the Unit remains selected
- **THEN** the count and visible list update from current membership without a stale snapshot
