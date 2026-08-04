## ADDED Requirements

### Requirement: CSV and JSON rows can be mapped to Employees
The application SHALL discover CSV columns and tabular JSON fields, allow explicit target mapping, and preview normalized Employees before import.

#### Scenario: CSV mapping
- **WHEN** a user selects a CSV file with arbitrary headers
- **THEN** the mapping dialog suggests matching Employee fields and shows source and normalized preview values

#### Scenario: JSON collection mapping
- **WHEN** a JSON object contains one or more object collections
- **THEN** the user can choose a collection and map nested scalar leaf fields by dot path

### Requirement: Employee import is atomic and non-relational
The application SHALL import mapped Employees into the global catalog without Unit assignments and SHALL apply no changes until all accepted rows validate.

#### Scenario: Successful import
- **WHEN** every non-empty row is valid and the user confirms
- **THEN** all new Employees and normalized tags are added in one store update

#### Scenario: Invalid row
- **WHEN** any non-empty row lacks a display or identity value or contains invalid mapped data
- **THEN** no Employee is added and the preview identifies the row error

### Requirement: Duplicate identities are not overwritten
The application SHALL match normalized username first and email second, skip unambiguous existing matches, and block ambiguous identity conflicts.

#### Scenario: Existing username
- **WHEN** an imported row matches exactly one existing normalized username
- **THEN** the existing Employee remains unchanged and the row is counted as skipped

#### Scenario: Ambiguous conflict
- **WHEN** mapped identities point to different existing Employees or duplicate ambiguously
- **THEN** the import is blocked before mutation
