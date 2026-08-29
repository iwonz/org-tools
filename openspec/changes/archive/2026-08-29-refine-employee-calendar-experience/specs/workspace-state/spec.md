## MODIFIED Requirements

### Requirement: Workspace state is current-schema and file-based
The application SHALL use one strict unversioned `org-tools-state` JSON contract with a required
`content` value of `teams`, `employees`, `teamsEmployees`, or `workspace`, SHALL require one
normalized gender value on every persisted Employee and Employee override, SHALL keep organization
data out of browser persistence and remote services, and SHALL reject obsolete or mismatched shapes
without migration.

#### Scenario: Full workspace round trip
- **WHEN** a user saves and opens a state with `content: "workspace"`
- **THEN** Employees including gender, dated tags, Views, Units, assignments, layout, and UI state
  are restored atomically

#### Scenario: Obsolete or mismatched state
- **WHEN** a claimed state contains a version field, unknown field, missing or invalid Employee
  gender, invalid reference, invalid tag date, or payload inconsistent with `content`
- **THEN** the current workspace remains unchanged and an actionable error is shown without
  generic-mapping fallback
