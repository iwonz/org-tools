## MODIFIED Requirements

### Requirement: Data export remains local and generic
The application SHALL export selected Employees and Units as CSV, JSON, separator templates, or a canvas PNG using only the generic data model. Employee JSON SHALL keep `tags` as an array of labels and add `tagDates` records containing `tag` and `date`; CSV and templates SHALL encode dated assignments as `tag=YYYY-MM-DD`.

#### Scenario: Employee field export
- **WHEN** a user selects profile, embedded avatar, birthday, tags, tag dates, or contact fields
- **THEN** the exported value comes directly from the persisted Employee without deriving a URL from another identifier

#### Scenario: Backward-compatible tags field
- **WHEN** an Employee with dated and undated tags is exported
- **THEN** `tags` contains every label while `tagDates` contains only assignments with dates in the selected output syntax

#### Scenario: Local export
- **WHEN** a user copies or saves an export
- **THEN** the data is produced in the browser without an upload or remote API
