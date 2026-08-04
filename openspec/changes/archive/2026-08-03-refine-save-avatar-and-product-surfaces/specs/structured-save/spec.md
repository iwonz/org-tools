## ADDED Requirements

### Requirement: Save offers complete and structured partial documents
The application SHALL open a localized Save dialog ordered Teams, Employees, Teams + Employees,
and Full workspace, default to Full workspace, and download the chosen browser-local document only
after explicit confirmation.

#### Scenario: Open Save dialog
- **WHEN** a user activates the header Save action
- **THEN** no file is downloaded until the dialog displays the four choices and the user confirms one

#### Scenario: Empty data option
- **WHEN** a partial choice has none of the data named by that choice
- **THEN** that choice is disabled while Full workspace remains available

### Requirement: Partial saves are deterministic V2 Main subsets
The application SHALL serialize all applicable global Employees and Main Units into a strictly
validated `OrgToolsImportV2`, use current UUIDs only as file-local keys, and preserve hierarchy and
sibling order without including custom Views, layout, viewport, timestamps, or UI state.

#### Scenario: Save Teams
- **WHEN** the Teams choice is confirmed
- **THEN** the file contains Main hierarchy and Live rules without Employee records, assignments, bosses, or position overrides

#### Scenario: Save Employees
- **WHEN** the Employees choice is confirmed
- **THEN** the file contains the complete global Employee catalog and no Units

#### Scenario: Save Teams with Employees
- **WHEN** the combined choice is confirmed
- **THEN** the file contains all global Employees, Main hierarchy, manual assignments, bosses, Live rules, and Live role overrides

#### Scenario: Save complete workspace
- **WHEN** Full workspace is confirmed
- **THEN** the application downloads the unchanged strict `OrgToolsStateV1` document
