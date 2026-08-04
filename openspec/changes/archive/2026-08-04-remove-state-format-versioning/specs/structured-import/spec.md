## MODIFIED Requirements

### Requirement: Structured import has one current unversioned contract
The application SHALL recognize strict unversioned JSON objects with `kind: "org-tools-import"` and exact `employees` and `units` fields as current structured partial imports, and SHALL reject version fields, unknown fields, malformed tag records, invalid dates, and conflicting duplicate labels before preview.

#### Scenario: Supported current document
- **WHEN** a selected JSON file contains the current unversioned kind and valid arrays
- **THEN** the import dialog presents a structured preview containing normalized dated tags

#### Scenario: Obsolete versioned document
- **WHEN** a structured file contains `formatVersion` or `schemaVersion`
- **THEN** no preview can be committed and an owned localized validation error is shown

#### Scenario: Unknown structured field
- **WHEN** a structured import record contains an unknown field, invalid tag date, or conflicting duplicate label
- **THEN** no preview can be committed and an owned localized validation error identifies the issue

### Requirement: Structured import merges into Main atomically
The application SHALL preview semantic counts and hierarchy, then append a confirmed current structured import to Main through one strictly validated unversioned `OrgToolsState` candidate replacement while preserving all existing data, custom Views, and UI state.

#### Scenario: Successful partial merge
- **WHEN** a user confirms a valid current structured preview
- **THEN** new Employees, dated tags, and Units appear in Main with remapped assignments and Live roles while existing custom Views and UI state remain

#### Scenario: Candidate validation failure
- **WHEN** candidate construction, tag validation, graph validation, role resolution, or Live resolution fails
- **THEN** the current in-memory workspace remains byte-for-byte equivalent to its pre-import state

#### Scenario: Cancel structured import
- **WHEN** the user closes or cancels a structured preview
- **THEN** no organization state is changed
