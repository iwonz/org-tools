## MODIFIED Requirements

### Requirement: Organization data remains local
The application SHALL transmit workspace state only between the current page and its loopback
same-origin project API, SHALL NOT transmit organization data, generic JSON rows, state projections,
detached candidates, mapping previews, Employee tag dates, calendar events, avatar sources or crop
results, search terms, analytics, or exports to a third party or non-loopback host, and SHALL make no
background external requests. Organization data SHALL remain out of cookies, IndexedDB, session
storage, and local storage. The browser MAY persist only bounded non-sensitive preferences, and the
local project database MAY persist strictly validated workspace state and bounded UI projections.

#### Scenario: Core workflow network audit
- **WHEN** a user opens or saves a project, maps JSON, appends or replaces a state projection, edits
  tag dates, opens calendar dialogs, exports workspace state, searches, analyzes, downloads tabular
  data, and changes locale
- **THEN** browser requests are limited to locally served assets and same-origin loopback project
  endpoints with no third-party or non-loopback request

#### Scenario: Project database persistence
- **WHEN** a valid project state or bounded UI projection is saved
- **THEN** the bytes are written only to the configured local SQLite database and are not copied to
  browser storage, logs, telemetry, or another service

#### Scenario: Locale preference persistence
- **WHEN** a user selects an interface locale
- **THEN** browser local storage contains only bounded preference identifiers and no organization
  data, import rows, candidates, project state, or tag dates

#### Scenario: Cancel transient operation
- **WHEN** a user cancels native file selection, mapping, state projection, destructive replacement,
  project navigation, tag-date edit, workspace Export dialog, avatar source, or crop
- **THEN** the canceled candidate is not committed to project state, browser persistence, or an
  external destination

#### Scenario: Candidate validation failure
- **WHEN** any import, project Save, append, or replace candidate fails strict validation
- **THEN** the in-memory workspace and database revision remain unchanged and no candidate data is
  persisted or transmitted externally
