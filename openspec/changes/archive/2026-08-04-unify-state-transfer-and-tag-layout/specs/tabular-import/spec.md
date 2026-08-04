## MODIFIED Requirements

### Requirement: CSV and JSON rows can be mapped to Employees
The application SHALL discover ordinary CSV columns and JSON collections, let users choose Teams,
Employees, or Teams + Employees, map applicable entity and relation fields, and preview the
normalized append-only graph before import.

#### Scenario: CSV mapping
- **WHEN** a user selects CSV with arbitrary headers
- **THEN** the dialog maps flat Team, Employee, parent, position, and boss fields for the selected target

#### Scenario: JSON collection mapping
- **WHEN** a JSON value contains one or more object collections
- **THEN** the user can choose a root collection and map scalar fields plus recursive `children` and inline `employees` arrays

#### Scenario: Generic Live data
- **WHEN** ordinary JSON or CSV contains fields resembling Live rules
- **THEN** the mapper creates manual Teams only and explains that Live semantics require a recognized state

### Requirement: Employee import is atomic and non-relational
The application SHALL convert generic mapped data into one detached append candidate, create
undated tag records for mapped tag labels, and apply no changes until every Team, Employee,
assignment, hierarchy edge, and identity passes validation.

#### Scenario: Successful Employee import
- **WHEN** an Employees mapping is valid and confirmed
- **THEN** all new Employees and normalized undated tags are appended in one store update without Team assignments

#### Scenario: Successful combined import
- **WHEN** a Teams + Employees mapping is valid and confirmed
- **THEN** manual Teams, nested hierarchy, Employees, assignments, positions, and bosses are appended atomically

#### Scenario: Invalid graph
- **WHEN** a row or nested record has invalid data, an unknown parent, a hierarchy cycle, conflicting repeated keys, ambiguous identity, or multiple bosses in one Team
- **THEN** nothing is imported and the preview identifies the owned validation error

### Requirement: Duplicate identities are not overwritten
The application SHALL match normalized username first and email second, reuse an unambiguous
existing Employee without overwriting it, group repeated keys only when entity data agrees, and
block ambiguous conflicts.

#### Scenario: Existing username
- **WHEN** an imported Employee matches exactly one existing normalized username
- **THEN** assignments can reference that Employee while its persisted fields remain unchanged

#### Scenario: Conflicting repeated key
- **WHEN** repeated Team or Employee keys carry inconsistent entity fields or identities point to different existing Employees
- **THEN** the complete generic import is blocked before mutation

## ADDED Requirements

### Requirement: Generic JSON supports nested Team graphs
The JSON mapper SHALL recursively process mapped Team `children` and inline `employees` arrays using
the same selected mappings at every depth.

#### Scenario: Nested JSON hierarchy
- **WHEN** a chosen root collection contains nested Team records and inline Employee assignments
- **THEN** preview preserves source hierarchy and sibling order and reports Team, Employee, and assignment counts

### Requirement: Generic CSV supports flat Team relations
The CSV mapper SHALL accept `teamName`, optional `teamKey` and `parentTeamKey`, Employee fields,
optional `employeeKey`, `position`, and `isBoss`; it SHALL require Team keys for hierarchy or combined
mapping while permitting generated row keys for a simple root-Team list.

#### Scenario: Hierarchical CSV
- **WHEN** mapped CSV rows use unique Team keys and valid parent keys
- **THEN** preview reconstructs the hierarchy and groups repeated identical Team records

#### Scenario: Missing required Team key
- **WHEN** a hierarchical or combined CSV mapping cannot identify a Team key
- **THEN** commit remains disabled with a localized mapping error

## REMOVED Requirements

### Requirement: Import formats are documented at the operation boundary
**Reason**: Import adapts directly to recognized state or generic mapping and no longer embeds format examples.

**Migration**: Select a file and use the recognized-state choices or explicit generic field mapping.
