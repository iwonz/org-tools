## ADDED Requirements

### Requirement: Applied agent changes update the live organization safely
An MCP Apply SHALL update the persisted singleton state once and notify open server-mode editors.
The editor SHALL rehydrate affected Employees, Units, assignments, hierarchy, geometry, Main or
custom Views, derived indexes, and durable selections from the validated current revision without a
reload. Independent local edits SHALL survive automatic three-way merge; overlapping edits MUST
remain visible in memory until the user resolves them.

#### Scenario: Agent creates a planning View
- **WHEN** MCP applies a Main-derived custom View while the Editor is open
- **THEN** the new View and its exact structure become selectable without reloading or changing Main

#### Scenario: Agent updates active structure
- **WHEN** MCP applies Employee, Unit, hierarchy, assignment, or geometry changes visible in the active workflow
- **THEN** current lists, canvas, Analytics, Calendar, and derived counts update from the new revision

#### Scenario: Independent user edit
- **WHEN** a pending local edit and MCP Apply affect disjoint stable values
- **THEN** both changes remain in the live validated organization after reconciliation

#### Scenario: Overlapping editor edit
- **WHEN** a pending local edit and MCP Apply affect the same stable value
- **THEN** the editor shows localized Keep local, Use MCP, and Cancel choices without changing the local value silently

### Requirement: Agent operations preserve editor invariants
Agent-created or updated Views and Units SHALL follow the same identifier, reference, hierarchy,
membership, position, geometry, Main/custom isolation, and adaptive 24-unit grid invariants as
interactive editor commands. Full structure replacement SHALL be atomic and MUST NOT leave dangling
durable UI references.

#### Scenario: Agent geometry
- **WHEN** an agent previews explicit Unit movement or arrangement
- **THEN** every produced Unit origin is normalized to the shared 24-unit grid before the preview is valid

#### Scenario: Invalid graph
- **WHEN** agent operations create a hierarchy cycle, dangling assignment, invalid Live rule, or duplicate stable ID
- **THEN** Preview rejects the complete batch and neither the live editor nor SQLite changes

#### Scenario: Delete selected entity
- **WHEN** Apply validly deletes an entity referenced by durable selection or expansion state
- **THEN** the structural deletion commits and dangling UI references are filtered in the resulting state
