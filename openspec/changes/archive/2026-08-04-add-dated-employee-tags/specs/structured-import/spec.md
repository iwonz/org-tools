## MODIFIED Requirements

### Requirement: Structured import has an explicit versioned contract
The application SHALL recognize strict JSON objects with `kind: "org-tools-import"` and format version 3 as current structured partial imports, SHALL accept format version 2 by migrating string tags to undated records, and SHALL reject other versions, unknown fields, malformed tag records, invalid dates, and conflicting duplicate labels before preview.

#### Scenario: Supported version 3 document
- **WHEN** a selected JSON file contains the supported kind, version 3, and valid arrays
- **THEN** the import dialog presents a structured preview containing normalized dated tags

#### Scenario: Migrated version 2 document
- **WHEN** a valid format version 2 structured file is selected
- **THEN** every string tag becomes the same label with a null date before preview and candidate construction

#### Scenario: Unknown structured field
- **WHEN** a structured import record contains an unknown field, unsupported version, invalid tag date, or conflicting duplicate label
- **THEN** no preview can be committed and an owned localized validation error identifies the issue

### Requirement: Structured import merges into Main atomically
The application SHALL preview semantic counts and hierarchy, then append a confirmed version 3 or migrated version 2 structured import to Main through one strictly validated State V2 candidate replacement while preserving all existing data, custom Views, and UI state.

#### Scenario: Successful partial merge
- **WHEN** a user confirms a valid current or migrated structured preview
- **THEN** new Employees, dated tags, and Units appear in Main with remapped assignments and Live roles while existing custom Views and UI state remain

#### Scenario: Candidate validation failure
- **WHEN** candidate construction, tag validation, graph validation, role resolution, or Live resolution fails
- **THEN** the current in-memory workspace remains byte-for-byte equivalent to its pre-import state

#### Scenario: Cancel structured import
- **WHEN** the user closes or cancels a structured preview
- **THEN** no organization state is changed
