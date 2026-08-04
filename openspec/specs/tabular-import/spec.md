# tabular-import Specification

## Purpose
Define discovery, mapping, validation, deduplication, and atomic Employee-only import.
## Requirements
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

### Requirement: Generic JSON supports nested Team graphs
The JSON mapper SHALL recursively process mapped Team `children` and inline `employees` arrays using
the same selected mappings at every depth.

#### Scenario: Nested JSON hierarchy
- **WHEN** a chosen root collection contains nested Team records and inline Employee assignments
- **THEN** preview preserves source hierarchy and sibling order and reports Team, Employee, and assignment counts

### Requirement: JSON collections can be mapped to organization data
The application SHALL discover ordinary JSON object collections, let users choose Teams,
Employees, or Teams + Employees, map applicable entity and relation fields, and preview the
normalized append-only graph before import.

#### Scenario: JSON collection mapping
- **WHEN** a JSON value contains one or more object collections
- **THEN** the user can choose a root collection and map scalar fields plus recursive `children` and inline `employees` arrays

#### Scenario: Generic Live data
- **WHEN** ordinary JSON contains fields resembling Live rules
- **THEN** the mapper creates manual Teams only and explains that Live semantics require a recognized state

#### Scenario: Non-JSON input
- **WHEN** selected file content cannot be parsed as JSON
- **THEN** mapping is unavailable and a localized JSON parse error is shown
