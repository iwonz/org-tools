# privacy-safety Specification

## Purpose
Define the browser data boundary, publication safeguards, and explicit external navigation rules.
## Requirements
### Requirement: Organization data remains local
The application SHALL transmit state only between the local-server page and its loopback same-origin
singleton state API. Pages SHALL process state only in current page memory, live same-origin tab
messages, explicit Import, and explicit Export. Neither runtime SHALL transmit organization data,
durable UI, candidates, tag dates, events, avatars, searches, analytics, or exports to a third party
or non-loopback service. State snapshots SHALL remain out of cookies, IndexedDB, local storage,
session storage, and Cache Storage. The browser MAY persist only bounded locale and theme bootstrap
metadata, and the local database MAY persist the validated singleton state.

#### Scenario: Core workflow network audit
- **WHEN** either runtime loads, imports, edits, searches, analyzes, renders, synchronizes tabs, or
  exports
- **THEN** requests contain no third-party organization data and are limited to assets plus the
  loopback singleton API in server mode

#### Scenario: Singleton database persistence
- **WHEN** a valid organization or UI projection changes in server mode
- **THEN** it is written only to the configured local SQLite database and not copied to browser
  storage, logs, telemetry, or another service

#### Scenario: Pages tab synchronization
- **WHEN** Pages initializes or updates state with live same-origin peers
- **THEN** bytes use only in-memory BroadcastChannel messages and disappear after the final tab closes

#### Scenario: Preference persistence
- **WHEN** locale or theme changes
- **THEN** local storage contains only bounded bootstrap identifiers and no organization or other
  durable UI snapshot

#### Scenario: Candidate validation failure
- **WHEN** any imported, exported, synchronized, or API-written state fails strict validation
- **THEN** current state and its durable destination remain unchanged

### Requirement: Public artifacts use general safety checks
The repository SHALL validate tracked and generated artifacts for portable paths, secrets,
unexpected language, unsupported media, generated caches, and obsolete public contracts through
general project rules.

#### Scenario: Publication scan
- **WHEN** the public-safety check scans tracked files and the production build
- **THEN** a general artifact or contract violation causes a failing exit code without embedding
  project-origin-specific policy

### Requirement: External contact actions are explicit
The application SHALL open persisted profile links and mail links only after a user action with
referrer protections.

#### Scenario: Profile navigation
- **WHEN** a user activates a valid Employee profile link
- **THEN** it opens separately with `noopener`, `noreferrer`, and no referrer

### Requirement: Employee transfer candidates remain local and transient
Employee files, parsed rows, mapping choices, duplicate indexes, and per-row policies SHALL remain in
the current tab only until Apply or close. They MUST NOT enter browser storage, logs, URLs,
BroadcastChannel before Apply, SQLite before Apply, or a network request.

#### Scenario: Cancel large Import
- **WHEN** a user cancels a mapped 20,000-row Employee Import
- **THEN** the candidate is released and no organization, durable UI, local database, peer tab, or browser storage changes

#### Scenario: Export Employees
- **WHEN** Employee Export is generated
- **THEN** data is written only to the user-initiated local download

### Requirement: Public browser workspace cannot upload organization data
The functional Pages application SHALL contain local scripts required by the product but SHALL
contain no backend endpoint, remote asset, telemetry, remote logging, remote synchronization,
background organization-data request, File System Access persistence, or browser snapshot store.

#### Scenario: Public browser workflow
- **WHEN** a visitor completes a normal Pages workflow
- **THEN** state moves only among current page memory, live same-origin tabs, explicit Import,
  explicit download, clipboard actions, and user-activated protected external navigation
