## MODIFIED Requirements

### Requirement: Workspace state is versioned and file-based
The application SHALL offer Full workspace in the header Save dialog and download a strict
`org-tools-state` JSON document with `formatVersion: 1` while keeping organization data out of
browser persistence and remote services.

#### Scenario: State round trip
- **WHEN** a user chooses Full workspace, downloads it, and opens the resulting JSON file
- **THEN** Employees, Views, Units, assignments, layout, and UI state are restored atomically

#### Scenario: Unsupported state
- **WHEN** a JSON document has a legacy kind, unsupported version, unknown structure, or invalid references
- **THEN** the current workspace remains unchanged and an actionable error is shown
