## ADDED Requirements

### Requirement: Import formats are documented at the operation boundary
The application SHALL keep the current file import session while users switch between a file tab and
a localized Formats & examples tab that documents Employees, Units, Units with Employees, and the
complete workspace using bundled interfaces and valid synthetic examples.

#### Scenario: Inspect formats during mapping
- **WHEN** a user selects a file, switches to format guidance, and returns to file import
- **THEN** the selected file, collection, mapping, delimiter, validation, and preview remain unchanged

#### Scenario: Copy or download an example
- **WHEN** a user copies or downloads a bundled example
- **THEN** the browser produces the documented local content without a network request or workspace mutation

#### Scenario: Reopen import dialog
- **WHEN** the import dialog closes and later reopens
- **THEN** the file session is reset and the file import tab is active
