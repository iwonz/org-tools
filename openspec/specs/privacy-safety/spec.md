# privacy-safety Specification

## Purpose
Define the browser data boundary, publication safeguards, and explicit external navigation rules.
## Requirements
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

### Requirement: Public artifacts use general safety checks
The repository SHALL validate tracked and generated artifacts for portable paths, secrets,
unexpected language, unsupported media, generated caches, and obsolete public contracts through
general project rules.

#### Scenario: Publication scan
- **WHEN** the public-safety check scans tracked files and the production build
- **THEN** a general artifact or contract violation causes a failing exit code without embedding project-origin-specific policy

### Requirement: Import previews remain transient and local
The application SHALL derive hierarchy rows and Employee cards only from the selected in-memory
import session, SHALL make no external request for preview content, and SHALL discard preview UI
state when the source or dialog is cleared.

#### Scenario: Render preview cards
- **WHEN** a selected JSON file contains embedded avatars, contact fields, tags, Teams, and assignments
- **THEN** preview rendering stays in the current page and contact values are non-interactive text

#### Scenario: Cancel preview
- **WHEN** the user cancels a hierarchical preview
- **THEN** normalized rows, collapse state, and candidate data are discarded without persistence or mutation

### Requirement: External contact actions are explicit
The application SHALL open persisted profile links and mail links only after a user action with referrer protections.

#### Scenario: Profile navigation
- **WHEN** a user activates a valid Employee profile link
- **THEN** it opens separately with `noopener`, `noreferrer`, and no referrer

### Requirement: Public showcase cannot receive organization data
The public showcase SHALL be a non-interactive static documentation artifact with no application
runtime, project endpoint, writable form, browser persistence, external asset request, telemetry, or
mechanism for opening, importing, saving, or exporting organization data.

#### Scenario: Public network audit
- **WHEN** a visitor opens and browses the generated Pages artifact
- **THEN** it loads only same-site generated HTML and synthetic screenshot files and sends no
  organization data, interaction data, or background request to another service

#### Scenario: Local application boundary remains unchanged
- **WHEN** a visitor follows the showcase's usage guidance
- **THEN** the functional application is started separately on loopback with its configured local
  SQLite database, and GitHub Pages is not part of the organization-data path
