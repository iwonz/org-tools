## MODIFIED Requirements

### Requirement: Save offers complete and structured partial documents
The application SHALL open a localized Save dialog ordered Teams, Employees, Teams + Employees,
and Full workspace, default to Full workspace, and download the chosen strictly validated
`OrgToolsState` only after explicit confirmation.

#### Scenario: Open Save dialog
- **WHEN** a user activates the header Save action
- **THEN** no file is downloaded until the dialog displays the four choices and the user confirms one

#### Scenario: Empty data option
- **WHEN** a partial choice has none of the data named by that choice
- **THEN** that choice is disabled while Full workspace remains available

### Requirement: Partial saves are deterministic current-schema Main subsets
The application SHALL serialize all four choices through the same strict `OrgToolsState` parser,
preserve current UUIDs and deterministic order, and use canonical content-specific Main subsets.

#### Scenario: Save Teams
- **WHEN** the Teams choice is confirmed
- **THEN** `org-tools-teams.json` contains `content: "teams"`, Main hierarchy, layout, viewport, and Live rules without Employee records, assignments, bosses, or positions

#### Scenario: Save Employees
- **WHEN** the Employees choice is confirmed
- **THEN** `org-tools-employees.json` contains `content: "employees"`, the complete Employee catalog including tag dates, and an empty Main View

#### Scenario: Save Teams with Employees
- **WHEN** the combined choice is confirmed
- **THEN** `org-tools-teams-employees.json` contains `content: "teamsEmployees"`, all Employees, and the complete Main View with assignments, roles, Live rules, layout, and viewport

#### Scenario: Save complete workspace
- **WHEN** Full workspace is confirmed
- **THEN** `org-tools-state.json` contains `content: "workspace"` and the complete current workspace
