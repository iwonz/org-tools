## ADDED Requirements

### Requirement: Complete State requires Employee display formats
Every complete State SHALL contain exact `organization.employeeDisplayFormats` with string
`employees`, `units`, `editor`, and `editorExport` values. Complete Export and Import SHALL preserve
all four strings exactly. Missing, extra, or non-string values and the previous organization shape
MUST be rejected atomically without a version marker or runtime compatibility reader.

#### Scenario: Round-trip display formats
- **WHEN** a current complete State is exported and imported
- **THEN** all four Employee display formats retain their exact strings

#### Scenario: Reject the previous organization shape
- **WHEN** a complete State omits `employeeDisplayFormats`
- **THEN** validation rejects it without changing memory, SQLite, or live peers

### Requirement: New State has stable Employee display defaults
Blank State and the one-time owned SQLite conversion MUST create Employees and Units formats with
full name, username, email, position, Unit name, and Tags on separate lines; Editor MUST use full
name and Tags; Editor export MUST use full name with a conditional manager marker followed by Tags.

#### Scenario: Create blank State
- **WHEN** the application creates a new blank organization
- **THEN** its four required display formats exactly match the maintained defaults
