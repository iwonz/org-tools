## MODIFIED Requirements

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
