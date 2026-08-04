## ADDED Requirements

### Requirement: New sessions start with an editable workspace
The application SHALL open directly in a blank organization workspace with the Org Editor active and without a landing screen.

#### Scenario: First load
- **WHEN** the application loads without an opened file
- **THEN** it displays an empty Main View and all six product tabs

### Requirement: Workspace state is versioned and file-based
The application SHALL save and open a strict `org-tools-state` JSON document with `formatVersion: 1` while keeping organization data out of browser persistence and remote services.

#### Scenario: State round trip
- **WHEN** a user saves a workspace and opens the resulting JSON file
- **THEN** Employees, Views, Units, assignments, layout, and UI state are restored atomically

#### Scenario: Unsupported state
- **WHEN** a JSON document has a legacy kind, unsupported version, unknown structure, or invalid references
- **THEN** the current workspace remains unchanged and an actionable error is shown

### Requirement: Persisted entity references use UUIDs
The application SHALL use UUID strings for every persisted Employee, Unit, and View identifier.

#### Scenario: Non-UUID identifier
- **WHEN** an opened state contains a numeric, sentinel, malformed, or dangling entity identifier
- **THEN** strict validation rejects the complete state before replacing the workspace
