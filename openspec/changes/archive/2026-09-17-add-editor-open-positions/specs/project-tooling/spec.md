## ADDED Requirements

### Requirement: Open-position delivery updates deterministic Editor evidence

The existing Editor screenshot catalog SHALL demonstrate an open-position row and its interaction
without increasing the catalog size. Gallery generation MUST remain deterministic across two runs,
and fixtures MUST use synthetic titles, Employees, and Tags. A release that changes the exact Unit
State shape MUST record whether the configured owned SQLite database is absent, already current, or
safely converted from the immediately previous valid shape with the required backup and production
parser checks.

#### Scenario: Verify the updated gallery
- **WHEN** the screenshot gallery is generated twice after the change
- **THEN** every PNG is visually inspected and both SHA-256 sets are identical

#### Scenario: Prepare an owned previous-schema database
- **WHEN** the configured owned database contains the immediately previous valid Unit shape
- **THEN** the stopped-runtime backup, detached conversion, production-parser validation, atomic
  installation, committed-row validation, and normal-startup proof complete without committing the
  converter or database artifacts
