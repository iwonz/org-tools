# privacy-safety Specification

## Purpose
Define the browser data boundary, publication safeguards, and explicit external navigation rules.
## Requirements
### Requirement: Organization data remains local
The application SHALL transmit workspace state only between the local-server page and its loopback
same-origin project API, SHALL process Pages workspace state only in the current page and an explicit
user-selected file or download, and SHALL NOT transmit organization data, workspace candidates, tag
dates, calendar events, avatars, searches, analytics, or exports to a third party or non-loopback
service. Organization snapshots SHALL remain out of cookies, IndexedDB, session storage, local
storage, and Cache Storage. The browser MAY persist bounded non-sensitive preferences and one file
handle, the local project database MAY persist validated state and UI projections, and a selected
local file MAY persist one validated full workspace.

#### Scenario: Core workflow network audit
- **WHEN** either runtime opens or saves, imports, edits, searches, analyzes, renders, or exports
- **THEN** browser requests contain no organization data and are limited to application assets plus
  loopback project endpoints in SQLite mode

#### Scenario: Project database persistence
- **WHEN** a valid project state or bounded UI projection is saved
- **THEN** the bytes are written only to the configured local SQLite database and are not copied to
  browser storage, logs, telemetry, or another service

#### Scenario: Browser file persistence
- **WHEN** Pages opens, saves, reconnects, imports, or exports a workspace file
- **THEN** organization bytes remain in memory and explicit local files while IndexedDB stores only
  the active file handle

#### Scenario: Preference persistence
- **WHEN** locale, theme, or Autosave preference changes
- **THEN** local storage contains only bounded identifiers or booleans and no organization state

#### Scenario: Cancel transient operation
- **WHEN** a user cancels file selection, permission, Save As, workspace replacement, navigation,
  export, avatar, or crop
- **THEN** the candidate is not committed to a project, browser workspace, remembered handle, or
  external destination

#### Scenario: Candidate validation failure
- **WHEN** any opened, imported, exported, project-saved, or file-saved state fails strict validation
- **THEN** current state and its durable destination remain unchanged

### Requirement: Public artifacts use general safety checks
The repository SHALL validate tracked and generated artifacts for portable paths, secrets,
unexpected language, unsupported media, generated caches, and obsolete public contracts through
general project rules.

#### Scenario: Publication scan
- **WHEN** the public-safety check scans tracked files and the production build
- **THEN** a general artifact or contract violation causes a failing exit code without embedding project-origin-specific policy

### Requirement: External contact actions are explicit
The application SHALL open persisted profile links and mail links only after a user action with referrer protections.

#### Scenario: Profile navigation
- **WHEN** a user activates a valid Employee profile link
- **THEN** it opens separately with `noopener`, `noreferrer`, and no referrer

### Requirement: Public browser workspace cannot upload organization data
The functional Pages application SHALL contain local scripts and forms required by the product but
SHALL contain no backend endpoint, remote asset, telemetry, remote logging, synchronization, or
background organization-data request.

#### Scenario: Public browser workflow
- **WHEN** a visitor completes a normal Pages workflow
- **THEN** data moves only among page memory, explicit local files, explicit downloads, clipboard
  actions, and user-activated protected external navigation
