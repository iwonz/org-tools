## MODIFIED Requirements

### Requirement: SQLite uses a singleton current schema
SQLite SHALL keep exactly one application-state row with separate validated organization and UI
JSON, one monotonic revision, and timestamps. The exact current managed schema SHALL additionally
keep singleton MCP settings, short-lived MCP previews, and a bounded MCP activity journal outside
application state. The repository SHALL use prepared statements, transactions, rollback journal
mode, foreign-key enforcement, full synchronous writes, and a busy timeout. Startup SHALL create the
current schema only when the database has no managed tables, reopen only the exact current table and
column shape, and reject every obsolete, incomplete, unknown, or corrupt shape without mutating it.
The runtime MUST NOT read, write, or branch on a schema-version marker and MUST NOT contain schema
migrations, compatibility readers, or automatic resets.

#### Scenario: Empty database
- **WHEN** startup opens a database with no managed tables
- **THEN** the exact current singleton state and MCP tables are created without a schema-version marker

#### Scenario: Exact current database
- **WHEN** startup opens the exact current table and column shape with a valid singleton row
- **THEN** the existing state, revision, MCP settings, previews, and activity remain available without migration

#### Scenario: Obsolete or incomplete database
- **WHEN** startup opens a former project layout, a pre-MCP singleton layout, or any other incomplete managed shape
- **THEN** startup fails visibly and every existing table and row remains unchanged

#### Scenario: Unknown schema
- **WHEN** a configured database contains an unrecognized table shape
- **THEN** startup fails visibly without dropping or overwriting it

#### Scenario: Corrupt current state
- **WHEN** either stored JSON projection fails the production parser
- **THEN** the existing bytes remain unchanged and the application shows localized recovery
