## MODIFIED Requirements

### Requirement: Partial saves are deterministic current-schema Main subsets
The application SHALL serialize all applicable global Employees and Main Units into a strictly validated unversioned `OrgToolsImport`, use current UUIDs only as file-local keys, preserve hierarchy and sibling order, and include normalized tag dates without custom Views, layout, viewport, timestamps, or UI state.

#### Scenario: Save Teams
- **WHEN** the Teams choice is confirmed
- **THEN** the unversioned file contains Main hierarchy and Live rules without Employee records, assignments, bosses, or position overrides

#### Scenario: Save Employees
- **WHEN** the Employees choice is confirmed
- **THEN** the unversioned file contains the complete global Employee catalog including tag labels and dates and no Units

#### Scenario: Save Teams with Employees
- **WHEN** the combined choice is confirmed
- **THEN** the unversioned file contains all global Employees and tag dates, Main hierarchy, manual assignments, bosses, Live rules, and Live role overrides

#### Scenario: Save complete workspace
- **WHEN** Full workspace is confirmed
- **THEN** the application downloads the strict unversioned `OrgToolsState` document
