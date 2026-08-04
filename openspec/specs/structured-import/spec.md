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

### Requirement: Replacement import completes without a filename notice
The application SHALL close a successful partial or Full workspace replacement import without
rendering a global opened-file success banner, while preserving localized errors and successful
Append feedback.

#### Scenario: Successful replacement
- **WHEN** a user confirms a valid partial or Full workspace replacement import
- **THEN** the dialog closes, the candidate becomes current, and no global filename success banner is rendered

#### Scenario: Successful append
- **WHEN** a user confirms a valid Append import
- **THEN** the existing localized merge summary remains visible

#### Scenario: Failed replacement
- **WHEN** replacement candidate validation or commit fails
- **THEN** the current workspace remains unchanged and the localized error remains visible

### Requirement: Partial state operations are visually distinct
For Teams, Employees, and Teams + Employees, the application SHALL present Append and Replace all
current in a dedicated Import mode section separate from the state-content choices, SHALL select
Append by default, and SHALL give replacement an explicit destructive treatment.

#### Scenario: Choose a partial operation
- **WHEN** a user selects any partial projection
- **THEN** a responsive radio-card group presents Append and Replace all current with distinct selected and destructive states

#### Scenario: Full workspace operation
- **WHEN** Full workspace is selected
- **THEN** the operation radio-card group is absent and the dedicated replacement-only warning remains

### Requirement: Partial state preview shows normalized hierarchy and Employees
The application SHALL preview a selected partial projection as a virtualized ordered Team hierarchy
and normalized Employee cards before confirmation, without changing the detached candidate.

#### Scenario: Teams preview
- **WHEN** Teams is selected
- **THEN** every Team and nested Team appears in source order with hierarchy guides, mode, and direct-assignment count, and no Employee catalog is invented

#### Scenario: Employees preview
- **WHEN** Employees is selected
- **THEN** every imported Employee appears as a read-only card and no empty-Team placeholder is shown

#### Scenario: Teams and Employees preview
- **WHEN** Teams + Employees is selected
- **THEN** manual Employee cards appear inside their Teams with position and boss state, and Employees without a direct manual assignment appear in a separate section

#### Scenario: Live Team preview
- **WHEN** a Live Team references a Live boss or position overrides
- **THEN** those Employees appear as Live role cards while calculated Live membership is not presented as a direct assignment

#### Scenario: Append and Replace status
- **WHEN** the user switches between Append and Replace
- **THEN** Append distinguishes new and reused Employees while Replace shows a neutral imported total

#### Scenario: Large preview
- **WHEN** a valid import contains a large hierarchy and many assignments
- **THEN** stable flattened rows are virtualized and dynamically measured inside a bounded preview viewport
