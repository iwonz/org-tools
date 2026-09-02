## ADDED Requirements

### Requirement: An unusable SQLite database can be explicitly recreated
The loopback runtime SHALL offer Retry and Create new without silently changing any file when the
configured SQLite database is unavailable or its stored state is corrupt. Create new SHALL require
destructive confirmation, close the shared SQLite connection, move the database and every existing
`-journal`, `-wal`, and `-shm` sidecar into one timestamped backup family, and create and validate the
exact current singleton schema at the configured path. A partial failure MUST remove only newly
created files and restore every moved original. No schema version, migration, compatibility reader,
alternate path, or memory fallback SHALL be introduced.

#### Scenario: Create a new database from a blocking error
- **WHEN** startup reports database unavailable or corrupt stored state and the user confirms Create new
- **THEN** the original database family is retained under timestamped backup names
- **AND** the root application loads a validated blank current state from the configured path

#### Scenario: Cancel database recreation
- **WHEN** the user opens the Create new confirmation and cancels it
- **THEN** the database files, error state, and in-memory runtime remain unchanged

#### Scenario: Restore after a partial recreation failure
- **WHEN** moving a sidecar or creating or validating the replacement database fails
- **THEN** every successfully moved original is restored, partial replacement files are removed,
  and the application remains on a localized blocking error

#### Scenario: Reject an unsafe recreation request
- **WHEN** a client sends a non-JSON, cross-origin, non-loopback, or non-exact create-new request
- **THEN** no database file changes and the API returns a stable error code without CORS
