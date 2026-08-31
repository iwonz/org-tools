# single-state-runtime Specification

## Purpose
Define the strict singleton state contract, automatic SQLite persistence, private state API, and live-tab convergence.
## Requirements
### Requirement: Org Tools uses one strict current state
The application SHALL use one strict unversioned `OrgToolsState` with exactly `organization` and
`ui` at the top level. Organization SHALL contain Employees and structural View documents. Durable
UI SHALL contain locale, theme, sidebar mode, active navigation and View, Unit expansion and
selection, per-View viewport and selection, and bounded workflow filters, search, Calendar,
Analytics, and Download settings. Transient overlays, notifications, and unfinished form drafts
MUST NOT enter the state. No obsolete discriminator, project metadata, version, compatibility
reader, or partial document SHALL be accepted.

#### Scenario: Complete state round trip
- **WHEN** a current state is exported and imported, synchronized to another tab, or reopened from
  SQLite
- **THEN** organization data and valid durable UI context restore atomically

#### Scenario: Obsolete document
- **WHEN** input contains `kind`, `content`, version fields, a former project document, or a partial
  state
- **THEN** strict validation rejects it without changing memory or durable storage

#### Scenario: Transient interface
- **WHEN** a dialog, popover, toast, or form draft is open while state is captured
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

### Requirement: Live tabs converge without browser persistence
Both runtimes SHALL synchronize validated scoped state through `BroadcastChannel` using unique tab
origins and deterministic logical stamps. A new tab SHALL request the latest complete state from
live peers. Pages SHALL start blank when no peer responds and MUST NOT persist organization or
durable UI snapshots in cookies, IndexedDB, local storage, session storage, or Cache Storage.
Simultaneous independent tab updates SHALL converge through deterministic last-write-wins and SHALL
NOT be presented as collaborative merge behavior.

#### Scenario: New static tab with a live peer
- **WHEN** a Pages tab opens while another same-origin tab holds current state
- **THEN** it receives and applies the peer's latest valid complete snapshot

#### Scenario: Final static tab closes
- **WHEN** the last Pages tab closes and the application is opened again
- **THEN** a blank state is created because no organization snapshot was persisted

#### Scenario: Origin suppression
- **WHEN** a tab receives its own message or an already applied stamp
- **THEN** it ignores the message without rebroadcasting or mutating state

#### Scenario: Concurrent tab messages
- **WHEN** two tabs emit independently before observing each other
- **THEN** every live tab deterministically selects the same winning stamped state

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
