# workspace-state Specification

## Purpose
Define blank startup and the strict, file-based, UUID-referenced workspace contract.

## Requirements

### Requirement: New sessions start with an editable workspace
The application SHALL resolve the last opened local project from `/`, SHALL create one blank project
when the database is empty, and SHALL open the selected project directly in an editable organization
workspace with the Org Editor active and without a separate project-list landing page.

#### Scenario: First load
- **WHEN** the application loads against an empty valid database
- **THEN** it creates and opens one blank Main View inside `New project` and displays all six product
  tabs

#### Scenario: Returning load
- **WHEN** the application loads after a project was previously selected
- **THEN** it redirects to that stable project URL and restores its last saved organization plus its
  latest valid UI projection

### Requirement: Workspace state is current-schema and file-based
The application SHALL keep one strict unversioned `org-tools-state` JSON transfer contract with a
required `content` value of `teams`, `employees`, `teamsEmployees`, or `workspace`, SHALL require one
normalized gender value on every persisted Employee and Employee override, SHALL keep project names,
database revisions, and storage metadata outside that document, and SHALL reject obsolete or
mismatched transfer and stored shapes without public-format migration. Organization state SHALL stay
out of browser persistence and remote services while a validated full workspace MAY persist through
the loopback project database.

#### Scenario: Full workspace round trip
- **WHEN** a user exports and imports a state with `content: "workspace"` or saves and reopens a
  project containing that state
- **THEN** Employees including gender, dated tags, Views, Units, assignments, layout, and valid UI
  state are restored atomically

#### Scenario: Project metadata separation
- **WHEN** a project state is exported or an exported state is imported into a project
- **THEN** project ID, project name, SQLite revision, database path, and storage metadata are absent
  from the public document and the destination project's identity is unchanged

#### Scenario: Obsolete or mismatched state
- **WHEN** a claimed state contains a version field, unknown field, missing or invalid Employee
  gender, invalid reference, invalid tag date, or payload inconsistent with `content`
- **THEN** the current workspace and stored project remain unchanged and an actionable error is shown
  without generic-mapping fallback

### Requirement: Persisted entity references use UUIDs
The application SHALL use UUID strings for every persisted Employee, Unit, and View identifier.

#### Scenario: Non-UUID identifier
- **WHEN** an opened state contains a numeric, sentinel, malformed, or dangling entity identifier
- **THEN** strict validation rejects the complete state before replacing the workspace

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
