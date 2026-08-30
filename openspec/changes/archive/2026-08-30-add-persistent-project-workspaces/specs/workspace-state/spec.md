## MODIFIED Requirements

### Requirement: New sessions start with an editable workspace
The application SHALL resolve the last opened local project from `/`, SHALL create one blank project
when the database is empty, and SHALL open the selected project directly in an editable organization
workspace with the Org Editor active and without a separate project-list landing page.

#### Scenario: First load
- **WHEN** the application loads against an empty valid database
- **THEN** it creates and opens one blank Main View inside `New project` and displays all six product
  tabs

#### Scenario: Returning load
- **WHEN** the application loads after a project was previously selected
- **THEN** it redirects to that stable project URL and restores its last saved organization plus its
  latest valid UI projection

### Requirement: Workspace state is current-schema and file-based
The application SHALL keep one strict unversioned `org-tools-state` JSON transfer contract with a
required `content` value of `teams`, `employees`, `teamsEmployees`, or `workspace`, SHALL require one
normalized gender value on every persisted Employee and Employee override, SHALL keep project names,
database revisions, and storage metadata outside that document, and SHALL reject obsolete or
mismatched transfer and stored shapes without public-format migration. Organization state SHALL stay
out of browser persistence and remote services while a validated full workspace MAY persist through
the loopback project database.

#### Scenario: Full workspace round trip
- **WHEN** a user exports and imports a state with `content: "workspace"` or saves and reopens a
  project containing that state
- **THEN** Employees including gender, dated tags, Views, Units, assignments, layout, and valid UI
  state are restored atomically

#### Scenario: Project metadata separation
- **WHEN** a project state is exported or an exported state is imported into a project
- **THEN** project ID, project name, SQLite revision, database path, and storage metadata are absent
  from the public document and the destination project's identity is unchanged

#### Scenario: Obsolete or mismatched state
- **WHEN** a claimed state contains a version field, unknown field, missing or invalid Employee
  gender, invalid reference, invalid tag date, or payload inconsistent with `content`
- **THEN** the current workspace and stored project remain unchanged and an actionable error is shown
  without generic-mapping fallback
