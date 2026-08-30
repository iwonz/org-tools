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
The application SHALL keep one strict unversioned `org-tools-state` JSON transfer contract whose
`content` is exactly `workspace`, with required normalized Employee gender, exact keys, UUID
references, and no project or storage metadata. Organization snapshots SHALL stay out of browser
persistence and remote services while a validated workspace MAY persist through SQLite or an
explicit user-selected JSON file. Obsolete partial content values and arbitrary JSON SHALL be
rejected without compatibility fallback.

#### Scenario: Full workspace round trip
- **WHEN** a full state is exported and imported, saved and reopened from SQLite, or written and
  reopened through a browser file handle
- **THEN** Employees, tags, Views, Units, assignments, layout, and valid UI state restore atomically

#### Scenario: Project and file metadata separation
- **WHEN** state is transferred or written
- **THEN** project IDs, names, revisions, database paths, file handles, permissions, and fingerprints
  are absent from the public document

#### Scenario: Obsolete or mismatched state
- **WHEN** a claimed state has an obsolete field, unknown field, non-workspace content, invalid
  gender, reference, or tag date
- **THEN** current memory and durable destinations remain unchanged without migration or mapping
  fallback

### Requirement: Persisted entity references use UUIDs
The application SHALL use UUID strings for every persisted Employee, Unit, and View identifier.

#### Scenario: Non-UUID identifier
- **WHEN** an opened state contains a numeric, sentinel, malformed, or dangling entity identifier
- **THEN** strict validation rejects the complete state before replacing the workspace
