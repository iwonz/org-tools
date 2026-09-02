# single-state-runtime Specification

## Purpose
Define the strict singleton state contract, automatic SQLite persistence, private state API, and live-tab convergence.
## Requirements
### Requirement: One strict current state contains organization data and durable UI
The application SHALL use one strict unversioned `OrgToolsState` with exactly `organization` and
`ui` at the top level. Organization SHALL contain the global Employee catalog and one current
`{ layoutMode, units }` structure. Durable UI SHALL contain locale, theme, shell state, active
section, Unit navigation, filters, searches, Calendar and Download settings, plus the one Editor
viewport and selection. Download settings SHALL store ordered scalar fields, independently named
Unit and Tag collection fields, exact exclusion keys, Template row mode, and Template format; they
SHALL NOT store CSV, flat Unit columns, or a Unit-path separator. Transient overlays, notifications,
unfinished form drafts, complete generated output, and Editor export settings MUST NOT enter the
state. There SHALL be no View array, View ID, local View Employee, override, format discriminator,
version, compatibility alias, legacy reader, or partial document.

#### Scenario: Complete state round trip
- **WHEN** a current state is exported and imported, synchronized to another tab, or reopened from
  SQLite
- **THEN** organization data and valid durable UI context restore atomically

#### Scenario: Capture current state
- **WHEN** current state is captured after organization and UI actions
- **THEN** exactly one Employee catalog, one Unit structure, and one bounded UI projection validate

#### Scenario: Obsolete document
- **WHEN** input contains `kind`, `content`, version fields, a former project document, CSV Download settings, flat Unit fields, a configurable Unit-path separator, or a partial state
- **THEN** strict validation rejects it without changing memory or durable storage

#### Scenario: Reject old View state
- **WHEN** input contains `organization.views`, `activeViewId`, `ui.views`, or Download `sourceViewId`
- **THEN** strict validation rejects it without changing memory or durable storage

#### Scenario: Transient interface
- **WHEN** a dialog, popover, toast, output build, or Editor export session is active while state is captured
- **THEN** that transient condition is absent from the captured state

### Requirement: Server mode persists one state automatically
The loopback runtime SHALL expose one state at `/`, store organization and bounded UI projections
in one singleton SQLite row, and automatically enqueue a validated scoped write after each completed
logical action. It SHALL serialize writes, retain only the latest pending snapshot while a write is
active, and keep current memory plus an unload warning when persistence has not succeeded. It SHALL
preserve the configured database path precedence and SHALL NOT silently replace an unavailable or
corrupt current database with memory state.

#### Scenario: First valid database load
- **WHEN** the server opens an empty current database
- **THEN** one blank state is initialized and rendered directly at `/`

#### Scenario: Organization action
- **WHEN** a discrete organization command completes
- **THEN** its validated organization projection is enqueued immediately and committed atomically

#### Scenario: High-frequency interaction
- **WHEN** a drag, pan, or text stream updates state repeatedly
- **THEN** persistence captures drag and pan on gesture completion and text after 300 ms idle or blur

#### Scenario: Write during active request
- **WHEN** newer changes occur while a scoped write is in flight
- **THEN** no concurrent write starts and the latest pending projection is written next

#### Scenario: Persistence failure
- **WHEN** a write fails
- **THEN** current memory remains available, bounded retries and a localized Retry action are
  offered, and unloading warns until the latest state is durable

### Requirement: SQLite uses a singleton current schema
SQLite SHALL keep exactly one application-state row with separate validated organization and UI
JSON, one monotonic revision, and timestamps. SQLite SHALL keep exactly one `application_state`
table and one row. The repository SHALL use prepared statements, transactions, rollback journal
mode, foreign-key enforcement, full synchronous writes, and a busy timeout. Startup SHALL create the
current schema only when the database has no managed tables, reopen only the exact current table and
column shape, and reject every obsolete, incomplete, unknown, or corrupt shape without mutating it.
The runtime MUST NOT read, write, or branch on a schema-version marker and MUST NOT contain schema
migrations, compatibility readers, or automatic resets.

Startup SHALL accept only the current single-structure JSON contract.

#### Scenario: Empty database
- **WHEN** startup opens a database with no managed tables
- **THEN** the exact current singleton state table and row are created without a schema-version marker

#### Scenario: Exact current database
- **WHEN** startup opens the exact table with valid hash-ID Employees and one structure
- **THEN** the existing state and revision remain available without migration

#### Scenario: Obsolete View snapshot
- **WHEN** the table contains the former View-based JSON contract
- **THEN** startup fails visibly and existing bytes remain unchanged

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

### Requirement: Live tabs converge without browser persistence
Both runtimes SHALL synchronize validated scoped state through `BroadcastChannel` using unique tab
origins and deterministic logical stamps. A new tab SHALL make a bounded series of requests for the
latest complete state from live peers so channel-registration timing cannot silently miss an
already-live peer. Pages SHALL start blank when no peer responds and MUST NOT persist organization
or durable UI snapshots in cookies, IndexedDB, local storage, session storage, or Cache Storage.
Simultaneous independent tab updates SHALL converge through deterministic last-write-wins and SHALL
NOT be presented as collaborative merge behavior.

#### Scenario: New static tab with a live peer
- **WHEN** a Pages tab opens while another same-origin tab holds current state
- **THEN** it receives and applies the peer's latest valid complete snapshot even when its first
  request overlaps browser channel registration

#### Scenario: Final static tab closes
- **WHEN** the last Pages tab closes and the application is opened again
- **THEN** a blank state is created because no organization snapshot was persisted

#### Scenario: Origin suppression
- **WHEN** a tab receives its own message, a duplicate peer response, or an already applied stamp
- **THEN** it ignores the message without rebroadcasting or mutating state

#### Scenario: Concurrent tab messages
- **WHEN** two tabs emit independently before observing each other
- **THEN** every live tab deterministically selects the same winning stamped state

### Requirement: Both runtimes accept only the current birthday schema
Server and Pages state validation SHALL accept nullable Employee birthdays only in the current
canonical `DD.MM.YYYY` shape with the shared `1900` unknown-year semantics. Runtime code MUST NOT
include a state version, compatibility reader, or automatic conversion for obsolete birthday data.

#### Scenario: Open current birthday state
- **WHEN** SQLite, complete-state Import, or a live browser peer supplies only valid current birthdays
- **THEN** the state opens and follows normal automatic persistence or live-tab synchronization

#### Scenario: Open obsolete birthday state
- **WHEN** persisted or transferred state contains the former birthday representation
- **THEN** strict validation blocks it without rewriting, resetting, or partially installing the state
