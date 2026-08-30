## MODIFIED Requirements

### Requirement: Organization data remains local
The application SHALL transmit workspace state only between the local-server page and its loopback
same-origin project API, SHALL process Pages workspace state only in the current page and an explicit
user-selected file or download, and SHALL NOT transmit organization data, imports, previews, tag
dates, calendar events, avatars, searches, analytics, or exports to a third party or non-loopback
service. Organization snapshots SHALL remain out of cookies, IndexedDB, session storage, local
storage, and Cache Storage. The browser MAY persist bounded non-sensitive preferences and one file
handle, the local project database MAY persist validated state and UI projections, and a selected
local file MAY persist one validated full workspace.

#### Scenario: Core workflow network audit
- **WHEN** either runtime opens or saves, imports, edits, searches, analyzes, renders, or exports
- **THEN** browser requests contain no organization data and are limited to application assets plus
  loopback project endpoints in SQLite mode

#### Scenario: Browser file persistence
- **WHEN** Pages opens, saves, or reconnects a workspace file
- **THEN** organization bytes remain in memory and that explicit file while IndexedDB stores only its
  file handle

#### Scenario: Preference persistence
- **WHEN** locale, theme, or Autosave preference changes
- **THEN** local storage contains only bounded identifiers or booleans and no organization state

#### Scenario: Cancel transient operation
- **WHEN** a user cancels file selection, permission, Save As, import, replacement, navigation,
  export, avatar, or crop
- **THEN** the candidate is not committed to a project, browser workspace, remembered handle, or
  external destination

#### Scenario: Candidate validation failure
- **WHEN** any opened, imported, downloaded, project-saved, or file-saved state fails strict
  validation
- **THEN** current state and its durable destination remain unchanged

## ADDED Requirements

### Requirement: Public browser workspace cannot upload organization data
The functional Pages application SHALL contain local scripts and forms required by the product but
SHALL contain no backend endpoint, remote asset, telemetry, remote logging, synchronization, or
background organization-data request.

#### Scenario: Public browser workflow
- **WHEN** a visitor completes a normal Pages workflow
- **THEN** data moves only among page memory, explicit local files, explicit downloads, clipboard
  actions, and user-activated protected external navigation

## REMOVED Requirements

### Requirement: Public showcase cannot receive organization data

**Reason**: GitHub Pages now hosts the functional local browser workspace rather than a screenshot-only showcase.

**Migration**: Apply the new public browser workspace privacy requirement and static runtime network audit.
