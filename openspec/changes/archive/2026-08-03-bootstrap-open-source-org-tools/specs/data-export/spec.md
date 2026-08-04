## ADDED Requirements

### Requirement: Data export remains local and generic
The application SHALL export selected Employees and Units as CSV, JSON, separator templates, or a canvas PNG using only the generic data model.

#### Scenario: Employee field export
- **WHEN** a user selects profile, embedded avatar, birthday, tag, or contact fields
- **THEN** the exported value comes directly from the persisted Employee without deriving a URL from another identifier

#### Scenario: Local export
- **WHEN** a user copies or saves an export
- **THEN** the data is produced in the browser without an upload or remote API
