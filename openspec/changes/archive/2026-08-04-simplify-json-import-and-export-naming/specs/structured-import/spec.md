## ADDED Requirements

### Requirement: Import begins with native JSON file selection
The application SHALL activate a local JSON file chooser directly from the header Import action and
SHALL open the import dialog only after a file has been selected.

#### Scenario: Choose an import file
- **WHEN** a user activates Import and selects a file
- **THEN** the dialog opens with that file loading as its initial source and offers Choose another file

#### Scenario: Cancel native selection
- **WHEN** a user dismisses the native chooser without selecting a file
- **THEN** no import dialog opens and workspace state remains unchanged

#### Scenario: Invalid selected JSON
- **WHEN** the selected file exceeds 25 MiB, is malformed JSON, or claims an invalid state
- **THEN** the post-selection dialog shows an owned localized error and allows another JSON file to be selected

## MODIFIED Requirements

### Requirement: Recognized states expose compatible projections
The application SHALL parse selected files only as JSON, detect a strictly valid `OrgToolsState`,
offer only projections contained by its `content`, and SHALL NOT show the removed Formats & examples
interface or fall back to another file format.

#### Scenario: Projection matrix
- **WHEN** a state has `teams`, `employees`, `teamsEmployees`, or `workspace` content
- **THEN** the dialog offers respectively Teams only, Employees only, the first three choices, or all four choices

#### Scenario: Invalid claimed state
- **WHEN** JSON has `kind: "org-tools-state"` but fails strict state validation
- **THEN** import stops with a localized state error and does not fall through to generic mapping
