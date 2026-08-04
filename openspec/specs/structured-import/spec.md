# structured-import Specification

## Purpose
Define the strict versioned contract and atomic Main merge behavior for structured partial imports.
## Requirements
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

### Requirement: Partial state import supports append and replace-all
For Teams, Employees, and Teams + Employees, the application SHALL default to Append and offer
Replace all current with explicit destructive copy.

#### Scenario: Append projection
- **WHEN** a user confirms Append
- **THEN** Employees are matched username then email without overwrite, imported IDs and references are remapped, root Teams follow existing roots, relative layout moves to a free canvas area, and current custom Views and UI state remain

#### Scenario: Replace partial projection
- **WHEN** a user confirms Replace all current
- **THEN** all current Employees, Teams, and custom Views are removed and a clean workspace containing only the chosen projection is installed

### Requirement: Full workspace import is replacement-only
The application SHALL import Full workspace only through an atomic complete replacement and SHALL
show a dedicated destructive warning before confirmation.

#### Scenario: Confirm Full workspace
- **WHEN** a user confirms the Full workspace choice
- **THEN** the imported workspace replaces all current organization and UI state

#### Scenario: Cancel destructive import
- **WHEN** a user cancels a partial replace or Full workspace replacement
- **THEN** the current workspace remains unchanged

### Requirement: Every state import is failure-atomic
The application SHALL build and strictly validate a detached complete candidate before a single store
mutation.

#### Scenario: Candidate failure
- **WHEN** identity resolution, UUID remapping, reference validation, Live-cycle validation, layout translation, or strict state parsing fails
- **THEN** no Employee, Team, View, assignment, or UI field changes

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
