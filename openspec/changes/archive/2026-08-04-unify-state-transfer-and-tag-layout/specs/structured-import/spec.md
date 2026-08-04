## REMOVED Requirements

### Requirement: Structured import has one current unversioned contract
**Reason**: The separate `org-tools-import` contract is replaced by scoped `OrgToolsState` files.

**Migration**: Save or map current data into the sole `org-tools-state` contract.

### Requirement: Structured Units preserve hierarchy and Live semantics
**Reason**: Hierarchy and Live semantics are now validated as scoped state projections.

**Migration**: Use a recognized Teams or Teams + Employees state.

### Requirement: Structured Employee identities and assignments are deterministic
**Reason**: Identity and role handling move to the state append workflow.

**Migration**: Select a compatible projection from a recognized state.

### Requirement: Structured import merges into Main atomically
**Reason**: Scoped state import supports both append and replace-all rather than one structured merge.

**Migration**: Choose Append or Replace all current for a partial state projection.

## ADDED Requirements

### Requirement: Recognized states expose compatible projections
The application SHALL detect a strictly valid `OrgToolsState`, offer only projections contained by
its `content`, and SHALL NOT show the removed Formats & examples interface.

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
