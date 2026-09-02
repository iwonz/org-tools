## MODIFIED Requirements

### Requirement: SQLite uses a singleton current schema
SQLite SHALL keep exactly one `application_state` table and one row with separate validated
organization and UI JSON, one monotonic revision, and timestamps. The repository SHALL use prepared
statements, transactions, rollback journal mode, foreign-key enforcement, full synchronous writes,
and a busy timeout. Startup SHALL create the current schema only when the database has no managed
tables, reopen only the exact current table and column shape, and reject every obsolete, incomplete,
unknown, or corrupt shape without mutating it. The runtime MUST NOT read, write, or branch on a
schema-version marker and MUST NOT contain schema migrations, compatibility readers, or automatic
resets.

#### Scenario: Empty database
- **WHEN** startup opens a database with no managed tables
- **THEN** the exact current singleton state table and row are created without a schema-version marker

#### Scenario: Exact current database
- **WHEN** startup opens the exact current table and column shape with a valid singleton row
- **THEN** the existing state and revision remain available without migration

#### Scenario: Obsolete or incomplete database
- **WHEN** startup opens a former multi-project, multi-table, or otherwise incomplete managed shape
- **THEN** startup fails visibly and every existing table and row remains unchanged

#### Scenario: Unknown schema
- **WHEN** a configured database contains an unrecognized table shape
- **THEN** startup fails visibly without dropping or overwriting it

#### Scenario: Corrupt current state
- **WHEN** either stored JSON projection fails the production parser
- **THEN** the existing bytes remain unchanged and the application shows localized recovery

### Requirement: The local state API is scoped and private
`GET /api/state` SHALL return the complete state and current revision. `PUT /api/state` SHALL accept
only JSON with an `organization`, `ui`, or `all` scope, validate the complete affected result, commit
the selected projection atomically, and increment revision. Every response SHALL use stable error
codes; mutations MUST reject a non-loopback Host, mismatched Origin, CORS use, and unsupported
content type.

#### Scenario: Bounded UI update
- **WHEN** a client submits a valid UI-scoped update
- **THEN** SQLite changes `ui_json` and revision without parsing or serializing the Employee catalog

#### Scenario: Atomic state replacement
- **WHEN** a client submits a valid all-scoped update
- **THEN** both projections and one new revision commit in the same transaction

#### Scenario: Serialized state writes
- **WHEN** the application produces organization or UI updates
- **THEN** its single-flight writer sends one request at a time and the latest pending projection is committed next

#### Scenario: Invalid or cross-origin update
- **WHEN** input is invalid or violates the loopback same-origin boundary
- **THEN** neither projection nor revision changes and a stable code is returned

## REMOVED Requirements

### Requirement: Browser and MCP edits reconcile without silent loss
**Reason**: No external agent writer remains, so external-revision merge and conflict choices are obsolete.
**Migration**: Normal tabs continue to converge through deterministic `BroadcastChannel` stamps and serialized state writes.
