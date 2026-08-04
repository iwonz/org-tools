## MODIFIED Requirements

### Requirement: Workspace state is versioned and file-based
The application SHALL offer Full workspace in the header Save dialog and download a strict `org-tools-state` JSON document with `formatVersion: 2` and dated tag records while keeping organization data out of browser persistence and remote services. It SHALL continue to accept strict version 1 documents by migrating string tags to records with null dates in memory.

#### Scenario: State V2 round trip
- **WHEN** a user chooses Full workspace, downloads it, and opens the resulting version 2 JSON file
- **THEN** Employees, dated tags, Views, Units, assignments, layout, and UI state are restored atomically

#### Scenario: State V1 migration
- **WHEN** a valid version 1 state is opened
- **THEN** each string tag becomes the same label with a null date before the workspace is replaced

#### Scenario: Unsupported state
- **WHEN** a JSON document has a legacy kind, unsupported version, unknown structure, invalid date, conflicting duplicate tag, or invalid reference
- **THEN** the current workspace remains unchanged and an actionable error is shown

### Requirement: Partial structured imports preserve the complete state contract
The application SHALL build a partial import as a detached `OrgToolsStateV2` candidate, preserve the current complete-state schema and UI/View records, and load only a candidate that passes the same strict parser used for opened workspace files.

#### Scenario: Partial import candidate
- **WHEN** a valid structured import is merged with a current workspace
- **THEN** the resulting saved workspace remains a valid version 2 `org-tools-state` document

#### Scenario: Complete workspace open
- **WHEN** a valid version 1 or version 2 `org-tools-state` file is selected through the import dialog
- **THEN** it replaces the workspace atomically after any required in-memory migration rather than entering the partial merge path
