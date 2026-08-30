# workspace-state Specification

## Purpose
Define blank startup and the strict, file-based, UUID-referenced workspace contract.

## Requirements

### Requirement: New sessions start with an editable workspace
The local server SHALL resolve or create its last SQLite project, while the static browser runtime
SHALL restore an accessible remembered file or create one blank unbound workspace. Both runtimes
SHALL open directly in the Editor with one Main View and all six product tabs without a landing
page.

#### Scenario: First SQLite load
- **WHEN** the local server loads an empty valid database
- **THEN** it creates and opens `New project` at its stable project URL

#### Scenario: Returning SQLite load
- **WHEN** the local server loads after a project was selected
- **THEN** it restores the saved organization and valid UI projection

#### Scenario: First browser load
- **WHEN** Pages has no remembered file handle
- **THEN** it opens one editable blank unbound workspace without writing it to browser storage

#### Scenario: Returning browser load
- **WHEN** Pages has an accessible remembered handle
- **THEN** it strictly reads that full workspace, or requires explicit reconnect/recovery before
  editing when access is not already granted

### Requirement: Workspace state is current-schema and file-based
The application SHALL keep one strict unversioned `org-tools-state` JSON transfer contract with a
required content scope, required normalized Employee gender, exact keys, UUID references, and no
project or storage metadata. Organization snapshots SHALL stay out of browser persistence and remote
services while a validated full workspace MAY persist through SQLite or an explicit user-selected
JSON file.

#### Scenario: Full workspace round trip
- **WHEN** a full state is exported and imported, saved and reopened from SQLite, or written and
  reopened through a browser file handle
- **THEN** Employees, tags, Views, Units, assignments, layout, and valid UI state restore atomically

#### Scenario: Project and file metadata separation
- **WHEN** state is transferred or written
- **THEN** project IDs, names, revisions, database paths, file handles, permissions, and fingerprints
  are absent from the public document

#### Scenario: Obsolete or mismatched state
- **WHEN** a claimed state has an obsolete field, unknown field, invalid gender, reference, tag date,
  or content mismatch
- **THEN** current memory and durable destinations remain unchanged without migration fallback

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
