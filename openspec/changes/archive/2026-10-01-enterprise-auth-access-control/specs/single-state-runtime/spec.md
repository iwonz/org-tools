## REMOVED Requirements

### Requirement: One strict current state contains organization data and durable UI
**Reason**: The browser no longer owns or receives a complete organization-and-UI State.
**Migration**: PostgreSQL stores a versioned organization document and separate per-account UI state; clients receive authorized projections.

### Requirement: Server mode persists one state automatically
**Reason**: Whole-state client persistence is replaced by server commands and transactions.
**Migration**: Each logical action submits one validated command with expected revisions.

### Requirement: SQLite uses a singleton current schema
**Reason**: SQLite runtime persistence is removed.
**Migration**: Convert the immediately preceding owned snapshot once into the checked PostgreSQL schema.

### Requirement: The local state API is scoped and private
**Reason**: `/api/state` exposes too much data for multiple authenticated users.
**Migration**: Use authenticated bootstrap, command, UI-state, Administration, Backup, and event APIs.

### Requirement: An unusable SQLite database can be explicitly recreated
**Reason**: The application no longer opens or recreates SQLite files.
**Migration**: PostgreSQL readiness and migration failures remain blocking until the operator repairs the external database.

### Requirement: Live tabs converge without browser persistence
**Reason**: `BroadcastChannel` and the Pages runtime are removed.
**Migration**: Authenticated tabs converge through PostgreSQL revisions and authorized server events.

### Requirement: Both runtimes accept only the current birthday schema
**Reason**: There is one server runtime rather than two State consumers.
**Migration**: The current organization parser continues to enforce canonical birthdays inside server commands and Backup.

### Requirement: Current local state is rewritten once outside runtime
**Reason**: The historical SQLite State rewrite is superseded by the PostgreSQL conversion.
**Migration**: Preserve its already-current values during the one-time conversion.

### Requirement: The current state accepts all supported locales
**Reason**: Locale is per-account UI data rather than a complete shared State contract.
**Migration**: The first administrator receives the preceding shared locale and each account subsequently stores its own supported locale.

### Requirement: Current local state is converted to the View contract once
**Reason**: This historical conversion no longer defines runtime persistence.
**Migration**: Preserve the current system and custom View documents during PostgreSQL conversion.

### Requirement: Saved Unit notes use the existing state runtime
**Reason**: Unit notes no longer use whole-state persistence.
**Migration**: Authorized Unit commands preserve and validate existing note values.

### Requirement: Distribution mode uses bounded automatic UI persistence
**Reason**: View UI persistence is now per account in PostgreSQL.
**Migration**: Preserve bounded distribution UI behavior through per-account UI commands.

### Requirement: Grouping and Tag order use existing local persistence
**Reason**: Organization mutations no longer write a client snapshot.
**Migration**: Preserve grouping and Tag order through transactional organization commands.

### Requirement: Current database grouping is converted once outside runtime
**Reason**: The referenced SQLite conversion is historical.
**Migration**: Preserve the already-converted grouping values in the PostgreSQL document.

### Requirement: Current owned SQLite state is repaired for required canvas elements
**Reason**: The referenced SQLite repair is historical.
**Migration**: Preserve the already-repaired canvas documents during conversion.

### Requirement: Employee display formats are one organization change
**Reason**: Display formats no longer persist through the complete State API.
**Migration**: Save their atomic behavior with one authorized organization command.

### Requirement: Employee line gaps are converted once outside runtime
**Reason**: The referenced SQLite conversion is historical.
**Migration**: Preserve current line-gap values during PostgreSQL conversion.

### Requirement: Download row mode is removed once outside runtime
**Reason**: The referenced SQLite conversion is historical.
**Migration**: Preserve the current row-mode-free Download configuration in per-account UI state.

### Requirement: Exact State excludes removed Analytics data
**Reason**: The complete shared State contract is removed.
**Migration**: The organization and UI parsers continue to reject Analytics data independently.

## ADDED Requirements

### Requirement: One authenticated server owns current organization data
Org Tools SHALL have one self-hosted server runtime backed by PostgreSQL. Organization data SHALL be
mutated only through authenticated commands, durable UI SHALL be account-specific, and clients SHALL
receive only authorized projections. No browser snapshot, Pages runtime, SQLite runtime,
`BroadcastChannel`, or whole-state API SHALL remain.

#### Scenario: Open an authenticated tab
- **WHEN** an account with a valid session opens the application
- **THEN** the server returns its current authorized projection and per-account UI state without exposing a complete State

#### Scenario: Open without a session
- **WHEN** a caller without a valid session opens an initialized installation
- **THEN** only localized Login and nonsecret bootstrap status are available

### Requirement: Per-account UI state remains bounded and separate
The server SHALL persist locale, theme, shell, active workflow, searches, filters, Download settings,
active View, viewport, selection, and distribution mode per account with the same bounded shapes as before.
Transient overlays, drafts, clipboard, generated output, invalid input, history, and export sessions
MUST NOT persist.

#### Scenario: Two accounts use different UI state
- **WHEN** two accounts change locale, active View, filters, or viewport independently
- **THEN** each account restores only its own bounded UI state while organization data remains shared
