## MODIFIED Requirements

### Requirement: One strict current state contains organization data and durable UI
Org Tools SHALL use one strict unversioned `OrgToolsState` with exactly `organization` and `ui`.
Organization SHALL contain the global Employee catalog and one current `{ layoutMode, units }`
structure. Durable UI SHALL contain locale, theme, shell state, active section, Unit navigation,
filters, searches, Calendar and Download settings, plus the one Editor viewport and selection.
There SHALL be no View array, View ID, local View Employee, override, format discriminator, version,
compatibility alias, or legacy reader.

#### Scenario: Capture current state
- **WHEN** current state is captured after organization and UI actions
- **THEN** exactly one Employee catalog, one Unit structure, and one bounded UI projection validate

#### Scenario: Reject old View state
- **WHEN** input contains `organization.views`, `activeViewId`, `ui.views`, or Download `sourceViewId`
- **THEN** strict validation rejects it without changing memory or durable storage

### Requirement: SQLite uses a singleton current schema
SQLite SHALL keep exactly one `application_state` table and row with separately validated current
organization and UI JSON, one monotonic revision, and timestamps. Startup SHALL accept only the new
single-structure JSON contract. Runtime code MUST NOT contain schema versions, migration branches,
compatibility readers, or automatic resets.

#### Scenario: Exact current database
- **WHEN** startup opens the exact table with valid hash-ID Employees and one structure
- **THEN** state and revision load without migration

#### Scenario: Obsolete View snapshot
- **WHEN** the table contains the former View-based JSON contract
- **THEN** startup fails visibly and existing bytes remain unchanged
