## MODIFIED Requirements

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
