## MODIFIED Requirements

### Requirement: The generic editor retains six product surfaces
The application SHALL provide localized Units, Employees, Editor, Analytics, Calendar, and Download
surfaces in that visual and keyboard order, with Editor active for a blank workspace, no visible
wordmark or brand icon, and consistent actionable top-level empty states. A populated Employees
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

#### Scenario: Unified application header
- **WHEN** the product shell renders in light or dark theme
- **THEN** one 56 px header contains the six product tabs on the left and locale, theme, Import, and Export actions on the right without a visible wordmark
- **AND** Import and Export use matched document-arrow icons while the active View and organization count subtitle remain omitted

#### Scenario: Narrow application header
- **WHEN** the viewport is narrower than 1024 px
- **THEN** Import and Export hide their visible labels but retain localized accessible names and tooltips
- **AND** the tab region scrolls horizontally without page-level overflow or changing tab order

#### Scenario: Populated Employee catalog count
- **WHEN** the Employees surface contains Employees and no search or filter is active
- **THEN** its header shows the localized total Employee count without a match count

#### Scenario: Filtered Employee catalog count
- **WHEN** Employee search or filters are active
- **THEN** the header keeps the localized total Employee count and adds the localized visible match count
