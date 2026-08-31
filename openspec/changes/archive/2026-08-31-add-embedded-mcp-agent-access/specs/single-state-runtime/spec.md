## MODIFIED Requirements

### Requirement: SQLite uses a singleton current schema
SQLite SHALL keep exactly one application-state row with separate validated organization and UI
JSON, one monotonic revision, and timestamps. Schema v2 SHALL additionally keep singleton MCP
settings, short-lived MCP previews, and a bounded MCP activity journal outside application state.
The repository SHALL use prepared statements, transactions, rollback journal mode, foreign-key
enforcement, full synchronous writes, and a busy timeout. It SHALL migrate the exact current v1
singleton schema to v2 without changing state bytes or revision, destructively replace only the
recognized obsolete `projects` and `app_state` schema without reading its data, and reject unknown
or corrupt current schemas.

#### Scenario: Current v1 migration
- **WHEN** startup opens an exact valid v1 singleton database
- **THEN** MCP tables and schema version 2 are committed while the state JSON, revision, and timestamps remain unchanged

#### Scenario: Obsolete multi-project database
- **WHEN** startup detects the exact former project-table schema
- **THEN** those managed tables are dropped and one blank current singleton state plus disabled MCP settings is created without migration

#### Scenario: Unknown schema
- **WHEN** a configured database contains an unrecognized table shape
- **THEN** startup fails visibly without dropping or overwriting it

#### Scenario: Corrupt current state
- **WHEN** either stored JSON projection fails the production parser
- **THEN** the existing bytes remain unchanged and the application shows localized recovery

### Requirement: The local state API is scoped and private
`GET /api/state` SHALL return the complete state and current revision. `PUT /api/state` SHALL accept
only JSON with an `organization`, `ui`, or `all` scope plus `expectedRevision`, validate the complete
affected result, and update only when the expected revision is current. A successful write SHALL
increment revision atomically and notify local subscribers. `/api/state/events` SHALL stream only
no-store local revision metadata so browsers can fetch current state after external changes. Every
route SHALL return stable error codes; mutations MUST reject a non-loopback Host, mismatched Origin,
CORS use, and unsupported content type.

#### Scenario: Bounded UI update
- **WHEN** a client submits a valid UI-scoped update at the expected revision
- **THEN** SQLite changes `ui_json` and revision without parsing or serializing the Employee catalog

#### Scenario: Atomic state replacement
- **WHEN** a client submits a valid all-scoped update at the expected revision
- **THEN** both projections and one new revision commit in the same transaction

#### Scenario: Stale state update
- **WHEN** expected revision differs from the persisted revision
- **THEN** neither projection nor revision changes and the stable conflict response identifies the current revision

#### Scenario: External revision event
- **WHEN** MCP or another accepted writer commits a revision
- **THEN** connected loopback browsers receive its revision and source without organization data in the event

#### Scenario: Invalid or cross-origin update
- **WHEN** input is invalid or violates the loopback same-origin boundary
- **THEN** neither projection nor revision changes and a stable code is returned

## ADDED Requirements

### Requirement: Browser and MCP edits reconcile without silent loss
The server controller SHALL retain its last acknowledged base state. After an external revision it
SHALL three-way merge local and persisted values by stable semantic identity. Independent changes
SHALL merge automatically. Overlapping values MUST pause persistence and present Keep local, Use
MCP, or Cancel; no choice SHALL be selected silently.

#### Scenario: Independent concurrent changes
- **WHEN** the user changes one Employee while MCP changes a different Employee or field from the same base
- **THEN** the validated merged state preserves both changes and becomes the next revision

#### Scenario: Keep local overlap
- **WHEN** both writers change the same value and the user chooses Keep local
- **THEN** that local value and all independent current MCP values are written over the latest revision

#### Scenario: Use MCP overlap
- **WHEN** both writers change the same value and the user chooses Use MCP
- **THEN** the persisted MCP value and all independent local values are retained

#### Scenario: Cancel overlap
- **WHEN** the user cancels conflict resolution
- **THEN** current local memory remains protected from unload and no conflicting write occurs
