## MODIFIED Requirements

### Requirement: Employee import is atomic and non-relational
The application SHALL import mapped Employees into the global catalog without Unit assignments, SHALL convert mapped tag labels to records with null dates, and SHALL apply no changes until all accepted rows validate.

#### Scenario: Successful import
- **WHEN** every non-empty row is valid and the user confirms
- **THEN** all new Employees and normalized undated tags are added in one store update

#### Scenario: Invalid row
- **WHEN** any non-empty row lacks a display or identity value or contains invalid mapped data
- **THEN** no Employee is added and the preview identifies the row error
