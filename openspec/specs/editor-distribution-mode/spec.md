# editor-distribution-mode Specification

## Purpose
Define View-local Employee distribution status and placement connections in the organization Editor.

## Requirements

### Requirement: Units expose an independent distribution mode
The Editor SHALL allow distribution mode to be enabled independently for one or many selected Units
in the active View through one context-menu switch. The switch SHALL expose checked, unchecked, and
accessible mixed states. Activating an all-enabled selection SHALL disable every selected Unit;
activating an unchecked or mixed selection SHALL enable every selected Unit in one bounded UI
update. The mode SHALL remain View-local UI state and MUST NOT change the Unit document, timestamps,
history, selection, or geometry.

#### Scenario: Toggle one Unit
- **WHEN** the user activates Distribution mode from one Unit's context menu
- **THEN** the menu closes, the switch state persists for that Unit, and no structural command is created

#### Scenario: Enable a mixed selection
- **WHEN** selected Units contain enabled and disabled distribution modes and the user activates the mixed switch
- **THEN** every selected Unit becomes enabled through one UI update while selection remains unchanged

#### Scenario: Disable an enabled selection
- **WHEN** every selected Unit has distribution mode enabled and the user activates the checked switch
- **THEN** every selected Unit becomes disabled through one UI update while selection remains unchanged

### Requirement: Distribution status reflects current direct membership
Every rendered Employee row in an enabled Unit SHALL use the View distributedColor tonal highlighting when that
Employee is a direct current member of another Unit in the same View and the View undistributedColor tonal highlighting
otherwise. Manual and resolved Live membership SHALL count; hierarchy containment alone MUST NOT.
Employee names SHALL retain the normal theme foreground for both statuses, including selected rows.
Status changes and custom distribution colors MUST NOT recolor name text.

#### Scenario: Employee is placed elsewhere
- **WHEN** an Employee in an enabled Unit is also present in another manual or Live Unit
- **THEN** the source row uses the distributed color and its accessible status reports the number of other Units

#### Scenario: Employee exists only in the source Unit
- **WHEN** an Employee in an enabled Unit has no other direct current membership
- **THEN** the source row uses the undistributed color and its accessible status identifies it as source-only

#### Scenario: Keep names neutral in either theme
- **WHEN** distribution status, selection, or custom status colors change in a light or dark theme
- **THEN** Employee names keep that theme's normal foreground while configured row fills, paths, and markers retain their status colors

### Requirement: One selected Employee reveals placement connections
The Editor SHALL draw pointer-inert connections using the View distributedColor foreground only when selection contains exactly one
Employee occurrence whose source Unit has distribution mode enabled. Each path SHALL connect that
row to one other current placement without changing selection, layout, spatial indexes, or output.

#### Scenario: Connect expanded placements
- **WHEN** the selected Employee is visible in another expanded Unit
- **THEN** a deterministic curve connects the opposing edges of the exact source and target rows

#### Scenario: Connect a hidden collapsed placement
- **WHEN** the selected Employee belongs to a collapsed Unit where its row is hidden
- **THEN** the curve terminates at the nearest Unit edge with a compact endpoint marker

#### Scenario: Select multiple items
- **WHEN** selection contains two or more items
- **THEN** all distribution connections are hidden while enabled-Unit row highlighting remains

### Requirement: Distribution visualization is excluded from reports
Distribution mode SHALL remain an Editor-only visualization. PNG, JSON, Template, and Employee
outputs MUST NOT include its switch, colors, markers, lines, or state.

#### Scenario: Export while distribution mode is visible
- **WHEN** the user exports Editor or Employee output with distribution mode enabled
- **THEN** output matches the mode-disabled structural content and contains no distribution overlay

### Requirement: Multi-Unit Employees expose a placement map
Every rendered Employee occurrence SHALL expose a compact sibling action independent of
distribution-mode highlighting when it has direct current membership in at least two eligible Units of the
active View. For an ordinary source, eligible Units MUST exclude every distribution-enabled Unit.
A distribution-enabled source SHALL retain every direct placement, including other enabled Units. Activating it SHALL open a read-only transient map with one Employee node, every eligible direct
manual or resolved Live Unit placement, deterministic connections, and bounded pan, zoom, Fit, and
Reset controls. Hierarchy containment alone MUST NOT create an action or placement.

#### Scenario: Inspect several placements
- **WHEN** an Employee belongs directly to multiple Units and the row action is activated
- **THEN** the modal shows the Employee connected to every eligible current Unit without changing selection or state

#### Scenario: Navigate to a placement
- **WHEN** the user activates a Unit's locate action in the placement map
- **THEN** the modal closes, the target Unit expands if required, and the exact Employee occurrence is centered and selected at the current Editor scale

#### Scenario: Membership becomes ineligible
- **WHEN** current membership or distribution mode removes the source occurrence or leaves fewer than two eligible placements while the map is open
- **THEN** the modal closes safely without retaining stale Unit or Employee data

#### Scenario: Use a large View
- **WHEN** selection, viewport, or placement-map controls change in a View with 4,000 Units
- **THEN** the membership index is not rebuilt and the map reads only the selected Employee's indexed Unit IDs

#### Scenario: Reference membership alone does not create an ordinary action
- **WHEN** an Employee belongs to one ordinary Unit and any number of distribution-enabled Units
- **THEN** the ordinary occurrence has no placement action while enabled sources retain their current behavior

#### Scenario: Open an ordinary placement map
- **WHEN** the Employee belongs to two ordinary Units and a distribution-enabled reference
- **THEN** either ordinary source opens a map containing only the two ordinary Units

#### Scenario: Change modes while a map is open
- **WHEN** a peer or local action changes distribution-enabled Unit IDs
- **THEN** the open map re-evaluates eligibility from its source without rebuilding organization data

### Requirement: View distribution colors use the shared local picker
View settings SHALL offer Distributed and Not distributed color fields using the existing presets,
full palette, and exact input without a No color choice. Rows SHALL use readable themed tonal fills;
distribution connections and endpoint markers SHALL use the distributed foreground. Palette drafts
MUST remain transient and each completed valid color choice SHALL create one undoable command.

#### Scenario: Select colors
- **WHEN** a valid named or custom color is selected in either theme
- **THEN** the View's rows and applicable paths/markers update without changing membership or report content

#### Scenario: Cancel or enter invalid color
- **WHEN** a gesture is canceled or exact input is invalid
- **THEN** no settings command is committed and the previous persisted color remains intact
