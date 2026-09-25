# single-state-runtime Specification

## Purpose
Define the strict singleton state contract, automatic SQLite persistence, private state API, and live-tab convergence.
## Requirements
### Requirement: One strict current state contains organization data and durable UI
The application SHALL use one strict unversioned `OrgToolsState` with exactly `organization` and
`ui` at the top level. Organization SHALL contain UUID Employees, exactly one system View, zero or
more custom Views, UUID-keyed custom field definitions, a UUID-keyed Tag catalog, four Employee
display-format strings, and four matching integer `employeeDisplayLineGaps` values from 0 through
24. Every View SHALL contain its own `{ layoutMode, settings, units }` structure and timestamps
without Employee copies or overrides. Durable UI SHALL contain locale, theme, shell state, active
section, system Unit navigation, complete birthday and custom filters, searches, Calendar and
Download settings, active Editor View, and bounded viewport, selection, and distribution-mode
entries for every View.

Download settings SHALL store its source View, one complete `jsonTopLevelFieldOrder` covering
scalar Employee fields plus Unit and Tag collection keys, ordered nested Unit and Tag fields,
independently named fields, exact exclusion keys, and Template format. They SHALL NOT store a
Template row mode, line-processing option, separate Employee-only top-level order, CSV, flat Unit
columns, or a Unit-path separator. Transient overlays, notifications, unfinished form drafts,
invalid Display number-input text, complete generated output, Editor history/clipboard, and Editor
export settings MUST NOT enter the state. There SHALL be no deterministic Employee digest, inline
Tag label, obsolete Calendar cloud state, missing definition reference, View-local Employee,
override, format discriminator, version, compatibility alias, legacy reader, partial document,
unknown key, or old custom/output shape.

#### Scenario: Open the current state
- **WHEN** either runtime receives a fully valid current state without a Download row mode and with four bounded line gaps
- **THEN** organization and UI hydrate atomically, exactly one system View exists, Unit IDs are globally unique, and all definition and View references resolve

#### Scenario: Reject an obsolete state
- **WHEN** persisted or imported data contains `ui.download.rowMode`, omits a line gap, adds an unknown gap, or supplies an invalid gap value
- **THEN** strict parsing fails without compatibility conversion or partial replacement

#### Scenario: Complete state round trip
- **WHEN** a current state is exported and imported, synchronized to another tab, or reopened from SQLite
- **THEN** all View documents, global catalogs, Employee formats, line gaps, and valid durable UI context restore atomically without an obsolete Template row mode

#### Scenario: Capture current state
- **WHEN** current state is captured after valid focused Employee-display edits
- **THEN** the latest four formats and four line gaps appear in the organization snapshot

#### Scenario: Obsolete document
- **WHEN** input contains a former State shape, Download row mode, partial line-gap object, format discriminator, version, compatibility alias, or unknown key
- **THEN** strict validation rejects it without changing memory or durable storage

#### Scenario: Transient interface
- **WHEN** a dialog, popover, toast, invalid Display number input, Template line option, output build, View history/clipboard, or Editor export session is active while state is captured
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

Startup SHALL accept only the current strict View-state JSON contract.

#### Scenario: Empty database
- **WHEN** startup opens a database with no managed tables
- **THEN** the exact current singleton state table and row are created without a schema-version marker

#### Scenario: Exact current database
- **WHEN** startup opens the exact table with valid UUID Employees and strict system/custom View documents
- **THEN** the existing state and revision remain available without migration

#### Scenario: Obsolete single-structure snapshot
- **WHEN** the table contains the former single-structure JSON contract
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

### Requirement: Current local state is rewritten once outside runtime
Delivery SHALL stop the server, preserve a timestamped ignored database-family backup, transform all
Employee and Tag references, validate the exact new state, and update the singleton row in one
transaction with one revision increment. No transformation code SHALL remain on the runtime path.

#### Scenario: Rewrite succeeds
- **WHEN** the current local state transforms and validates
- **THEN** Employee and Unit counts and timestamps remain stable while IDs and references use the new shape

#### Scenario: Rewrite fails
- **WHEN** conversion, validation, or SQLite commit fails
- **THEN** the original transaction remains intact and the backup remains available for restoration

### Requirement: The current state accepts all supported locales
The strict `ui.locale` value SHALL be exactly `en`, `zh`, `ru`, `es`, `fr`, or `ar`. Existing state
and an explicit selected locale SHALL override browser detection. Only a blank state without a valid
preference SHALL use the first supported browser language or English fallback.

#### Scenario: Parse a supported locale
- **WHEN** strict current state contains any of the six locale values
- **THEN** both runtimes hydrate it without changing organization data or persistence shape

#### Scenario: Reject an unknown locale
- **WHEN** current state contains another locale value
- **THEN** strict parsing rejects the state atomically without a compatibility fallback

#### Scenario: Bootstrap a blank state
- **WHEN** no authoritative state or valid locale metadata exists
- **THEN** the first supported browser language initializes locale and English remains the fallback

### Requirement: Current local state is converted to the View contract once
The owned SQLite snapshot SHALL be converted outside runtime while the server is stopped. The
conversion SHALL create an ignored backup, wrap the exact current structure in one system View,
preserve all global catalogs and `created_at`, add valid View UI and Download references, advance
revision once, and validate with the production parser. Runtime compatibility code SHALL NOT remain.

#### Scenario: Convert the current database
- **WHEN** the guarded one-time converter succeeds
- **THEN** Employee, Unit, membership, Tag, custom-field, and timestamp fingerprints match and the new state reopens normally

#### Scenario: Conversion fails
- **WHEN** an assertion, transaction, or validation step fails
- **THEN** the transaction rolls back and the original database and backup remain available

### Requirement: Saved Unit notes use the existing state runtime
Saving a Unit note SHALL enqueue the same immediate organization write and live-tab broadcast as
other structural commands. Draft text and dialog state MUST remain component-local and MUST NOT be
written to SQLite, browser storage, `BroadcastChannel`, or the public State before Save.

#### Scenario: Persist a saved note in server mode
- **WHEN** a valid note is saved and the local application reloads
- **THEN** the singleton SQLite state restores that note

#### Scenario: Synchronize a saved note in browser mode
- **WHEN** a note is saved while another Pages tab is live
- **THEN** the peer tab receives the complete validated state containing the note, while unsaved
  drafts are never broadcast

### Requirement: Distribution mode uses bounded automatic UI persistence
Changing distribution mode SHALL increment only the UI change sequence and SHALL use the existing
automatic server write or live Pages-tab broadcast. It MUST NOT serialize or mutate organization
data solely because the mode or Employee selection changed.

#### Scenario: Reload server mode
- **WHEN** distribution mode is toggled and the local application reloads after automatic UI write
- **THEN** the same Units remain enabled in the same View

#### Scenario: Synchronize Pages tabs
- **WHEN** one live Pages tab changes distribution mode
- **THEN** another live tab receives the bounded UI setting without browser snapshot persistence

### Requirement: Grouping and Tag order use existing local persistence
Tag order changes and View settings commands SHALL use the existing organization write and live-tab
synchronization path once per logical mutation. Every runtime boundary SHALL validate exact required
View settings. No legacy reader or automatic conversion SHALL be added. A delayed SQLite startup
response MUST NOT overwrite a newer peer snapshot or decrease its logical stamp.

#### Scenario: Restore preferences
- **WHEN** server state is reopened or a live peer receives a validated update
- **THEN** catalog order and each View's settings match the committed state

#### Scenario: Race initial local state sources
- **WHEN** SQLite loading finishes after a newer peer snapshot has been installed
- **THEN** the newer state and stamp remain authoritative and subsequent changes synchronize

### Requirement: Current database grouping is converted once outside runtime
The authorized current local database conversion SHALL stop its writer, retain an ignored consistent
backup, add default settings to every View, remove Unit groupByTag, validate the full result with the
production parser, and commit one transaction with one revision increment. It MUST preserve Tag order
and unrelated data. Failure SHALL leave the original unchanged; an already-current database SHALL be
a validated no-op. The conversion tool MUST NOT ship in runtime.

#### Scenario: Convert current database
- **WHEN** the recognized previous state converts and validates
- **THEN** every View has default settings, Units have no grouping property, one revision is committed, and the backup remains available

#### Scenario: Fail conversion
- **WHEN** validation or writing fails
- **THEN** no partial conversion is committed

### Requirement: Current owned SQLite state is repaired for required canvas elements
The configured owned SQLite snapshot SHALL be repaired once outside runtime while the server is
stopped. The guarded operation SHALL accept only the exact prior View structure missing
`canvasElements`, add one empty array to every such View, preserve the complete organization and UI
payload otherwise, create an ignored timestamped database-family backup, validate with the production
parser before and after commit, and increment the singleton revision exactly once. Runtime parsing
MUST remain strict and MUST NOT add migration or compatibility behavior.

#### Scenario: Repair the diagnosed prior state
- **WHEN** every stored View has the exact prior structure shape and no `canvasElements` field
- **THEN** the offline operation adds an empty collection to every View and the configured server reopens the complete organization normally
- **AND** Employee, Unit, assignment, Tag, custom-field, timestamp, View, and UI fingerprints remain unchanged

#### Scenario: Preserve an already-current state
- **WHEN** every stored View already contains valid canvas elements
- **THEN** the operation performs no database write, revision change, or backup replacement

#### Scenario: Reject an unexpected or mixed state
- **WHEN** the database schema, singleton row, View structure, or candidate contains any other invalid or mixed shape
- **THEN** validation aborts before commit and the original database plus its retained backup remain available

#### Scenario: Roll back a failed commit
- **WHEN** backup, validation, transaction, or post-commit reopening fails
- **THEN** no partial converted state becomes authoritative and the complete original family can be restored locally

### Requirement: Employee display formats are one organization change
Each valid Employee display format or line-gap edit SHALL update only the selected organization
value, enqueue one server-mode SQLite organization snapshot, and publish one browser-mode live-tab
organization update. Writing a value equal to the current value and reading cards or previews MUST
NOT create a revision, persistence write, or synchronization message. The automatic writer MAY
coalesce successive typing snapshots while preserving the latest validated state.

#### Scenario: Edit one format
- **WHEN** a user changes one Employee display format to a different string
- **THEN** that one logical organization mutation persists and synchronizes immediately

#### Scenario: Edit one line gap
- **WHEN** a user changes one Employee display line gap to a different valid integer
- **THEN** that one logical organization mutation persists and synchronizes immediately

#### Scenario: Repeat the current value
- **WHEN** a format or line-gap operation receives its already stored value
- **THEN** the organization revision, SQLite writer, and live-tab publisher receive no work

#### Scenario: Read a preview
- **WHEN** a card or preview resolves current Employee display settings
- **THEN** no persistence or synchronization work is created

### Requirement: Employee line gaps are converted once outside runtime
Delivery SHALL stop the owned runtime, preserve a timestamped ignored database-family backup, add
four 4-pixel Employee line gaps, rewrite legacy visible `isBoss` output to an equivalent locale
literal ternary, validate a detached candidate and committed row with the production parser, and
update the singleton row in one transaction. The converter and obsolete reader MUST NOT remain in
the repository or runtime.

#### Scenario: Convert the owned database
- **WHEN** the immediately previous valid SQLite row is converted
- **THEN** all previous organization and UI data remain equal except the required line gaps, equivalent `isBoss` format rewrite, revision, and update timestamp

#### Scenario: Conversion fails
- **WHEN** an assertion, production parse, transaction, or reopen check fails
- **THEN** the original transaction remains intact and the complete timestamped backup remains available

### Requirement: Download row mode is removed once outside runtime
Delivery SHALL stop the owned runtime, retain a timestamped ignored backup of the configured SQLite
family, remove only `ui.download.rowMode` from the immediately previous valid snapshot, validate a
detached candidate with the production parser, and update the singleton row in one transaction with
one revision increment. The committed row SHALL pass the production parser and reopen normally.
Conversion code MUST NOT remain in runtime or complete-State Import.

#### Scenario: Convert the owned database
- **WHEN** the configured previous snapshot contains a valid `allUnits` or `firstUnit` Download row mode and every other current value
- **THEN** conversion removes only that key, preserves all unrelated data and timestamps, advances revision once, and the new runtime opens normally

#### Scenario: Preserve the original on failure
- **WHEN** candidate parsing, preservation comparison, SQLite commit, or reopen fails
- **THEN** the original transaction remains intact and the complete timestamped backup family remains available

