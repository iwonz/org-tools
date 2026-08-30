## ADDED Requirements

### Requirement: Import replaces one complete workspace atomically
The global Import action SHALL accept only a strictly valid unversioned `OrgToolsState` whose
`content` is `workspace`, SHALL parse it into a detached candidate no larger than 25 MiB, and SHALL
replace the current in-memory workspace only after an explicit destructive confirmation. The
confirmation SHALL show filename, file size, and Employee, Unit, and View counts, SHALL allow a
different file to be selected, and SHALL preserve the current SQLite project identity or browser
file binding.

#### Scenario: Confirm valid workspace
- **WHEN** a user selects a valid complete workspace and confirms Replace
- **THEN** the entire organization and workspace UI state are installed in one mutation, the result
  becomes dirty, and its imported theme becomes active

#### Scenario: Reject unsupported input
- **WHEN** the selected file is malformed, oversized, arbitrary JSON, or declares a partial content
  value
- **THEN** the dialog owns a localized error, offers another file, and changes no workspace data,
  project metadata, revision, or file binding

#### Scenario: Cancel replacement
- **WHEN** the user cancels the native chooser or replacement confirmation
- **THEN** the current workspace and persistence identity remain unchanged

### Requirement: Export downloads the complete live workspace immediately
The global Export action SHALL create and strictly validate one current complete workspace snapshot
and SHALL immediately download it as `org-tools-state.json` without a content selector,
confirmation dialog, or success banner.

#### Scenario: Export unsaved state
- **WHEN** a user activates Export while organization changes are dirty
- **THEN** the downloaded `content: "workspace"` document contains those live changes and does not
  alter dirty or persistence state

#### Scenario: Export validation failure
- **WHEN** the live snapshot cannot pass the production parser
- **THEN** no file is downloaded and the shell displays an owned localized error
