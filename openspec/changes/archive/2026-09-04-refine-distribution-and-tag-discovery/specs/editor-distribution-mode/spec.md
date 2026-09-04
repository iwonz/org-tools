## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Multi-Unit Employees expose a placement map
Every rendered Employee occurrence SHALL expose a compact sibling action independent of
distribution-mode highlighting when it has direct current membership in at least two Units of the
active View.
Activating it SHALL open a read-only transient map with one Employee node, every direct manual or
resolved Live Unit placement, deterministic connections, and bounded pan, zoom, Fit, and Reset
controls. Hierarchy containment alone MUST NOT create an action or placement.

#### Scenario: Inspect several placements
- **WHEN** an Employee belongs directly to multiple Units and the row action is activated
- **THEN** the modal shows the Employee connected to every current Unit without changing selection or state

#### Scenario: Navigate to a placement
- **WHEN** the user activates a Unit's locate action in the placement map
- **THEN** the modal closes, the target Unit expands if required, and the exact Employee occurrence is centered and selected at the current Editor scale

#### Scenario: Membership becomes ineligible
- **WHEN** current state removes the Employee or leaves fewer than two direct placements while the map is open
- **THEN** the modal closes safely without retaining stale Unit or Employee data

#### Scenario: Use a large View
- **WHEN** selection, viewport, or placement-map controls change in a View with 4,000 Units
- **THEN** the membership index is not rebuilt and the map reads only the selected Employee's indexed Unit IDs
