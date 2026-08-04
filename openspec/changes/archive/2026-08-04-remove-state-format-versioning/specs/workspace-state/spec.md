## MODIFIED Requirements

### Requirement: Workspace state is current-schema and file-based
The application SHALL offer Full workspace in the header Save dialog and download one strict unversioned `org-tools-state` JSON document with dated tag records while keeping organization data out of browser persistence and remote services. It SHALL reject obsolete versioned shapes without migration.

#### Scenario: Current state round trip
- **WHEN** a user chooses Full workspace, downloads it, and opens the resulting JSON file
- **THEN** Employees, dated tags, Views, Units, assignments, layout, and UI state are restored atomically without a version field

#### Scenario: Obsolete versioned state
- **WHEN** a JSON document contains `formatVersion`, `schemaVersion`, an unknown structure, invalid date, conflicting duplicate tag, or invalid reference
- **THEN** the current workspace remains unchanged and an actionable error is shown

### Requirement: Partial structured imports preserve the complete state contract
The application SHALL build a partial import as a detached unversioned `OrgToolsState` candidate, preserve the current complete-state schema and UI/View records, and load only a candidate that passes the same strict parser used for opened workspace files.

#### Scenario: Partial import candidate
- **WHEN** a valid structured import is merged with a current workspace
- **THEN** the resulting saved workspace remains a valid unversioned `org-tools-state` document

#### Scenario: Complete workspace open
- **WHEN** a valid current `org-tools-state` file is selected through the import dialog
- **THEN** it replaces the workspace atomically rather than entering the partial merge path
