## MODIFIED Requirements

### Requirement: Workspace state is current-schema and file-based
The application SHALL use one strict unversioned `org-tools-state` JSON contract with a required
`content` value of `teams`, `employees`, `teamsEmployees`, or `workspace`, SHALL keep organization
data out of browser persistence and remote services, and SHALL reject obsolete or mismatched shapes
without migration.

#### Scenario: Full workspace round trip
- **WHEN** a user saves and opens a state with `content: "workspace"`
- **THEN** Employees, dated tags, Views, Units, assignments, layout, and UI state are restored atomically

#### Scenario: Obsolete or mismatched state
- **WHEN** a claimed state contains a version field, unknown field, invalid reference, invalid tag date, or payload inconsistent with `content`
- **THEN** the current workspace remains unchanged and an actionable error is shown without generic-mapping fallback

### Requirement: Partial structured imports preserve the complete state contract
The application SHALL represent every partial transfer as a canonical `OrgToolsState`, build every
append or replacement as a detached `content: "workspace"` candidate, and commit only a candidate
that passes the strict parser used for opened workspace files.

#### Scenario: Canonical partial state
- **WHEN** a Teams, Employees, or Teams + Employees projection is saved
- **THEN** it contains exactly one Main View, a canonical partial UI shell, and only data allowed by its `content`

#### Scenario: Partial import candidate
- **WHEN** a valid partial state is appended or installed as a clean replacement
- **THEN** the resulting in-memory workspace is a strictly valid `content: "workspace"` state

#### Scenario: Full workspace open
- **WHEN** a valid `content: "workspace"` state is selected
- **THEN** it replaces the workspace atomically and cannot enter a partial append path

## ADDED Requirements

### Requirement: State content matches canonical payload invariants
The state parser MUST validate exact keys and enforce the canonical data subset declared by
`content`.

#### Scenario: Teams state
- **WHEN** `content` is `teams`
- **THEN** the state contains one Main hierarchy with order, coordinates, viewport, layout, and Live filters but no Employees, assignments, bosses, positions, overrides, or custom Views

#### Scenario: Employees state
- **WHEN** `content` is `employees`
- **THEN** the state contains the complete Employee catalog and one empty Main View

#### Scenario: Teams and Employees state
- **WHEN** `content` is `teamsEmployees`
- **THEN** the state contains the complete Employee catalog and complete Main View but no custom Views

#### Scenario: Full workspace state
- **WHEN** `content` is `workspace`
- **THEN** the state can contain all valid Views and runtime UI state
