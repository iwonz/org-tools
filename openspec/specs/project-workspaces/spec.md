# project-workspaces Specification

## Purpose
Define persistent local project storage, lifecycle, explicit Save behavior, concurrency, and recovery.

## Requirements

### Requirement: Projects persist in one configurable local database
The application SHALL store multiple named projects in one SQLite database, SHALL store each
project's complete organization as a strictly validated `content: "workspace"` `OrgToolsState`, and
SHALL keep project metadata outside the public transfer document. The database path SHALL resolve
from `ORG_TOOLS_DB_PATH`, then strict local configuration, then the ignored repository-local
default. The runtime SHALL NOT silently fall back to transient memory when configuration or storage
is unavailable.

#### Scenario: Default local database
- **WHEN** the local server starts without a path override or local configuration
- **THEN** project state is stored in the ignored `.org-tools/org-tools.sqlite3` database

#### Scenario: Configured database path
- **WHEN** a valid environment override or local config path is present
- **THEN** the server resolves relative paths from the repository root and uses the highest-priority
  configured database

#### Scenario: Database unavailable
- **WHEN** configuration is invalid or the database cannot be opened or initialized
- **THEN** the application presents a blocking actionable error and does not create an in-memory
  replacement workspace

### Requirement: Projects have complete local lifecycle and stable links
Every project SHALL have a UUID, a required case-insensitively unique name of at most 100 normalized
Unicode characters, timestamps, and a stable `/projects/<uuid>` URL. The application SHALL open the
last selected project from `/`, SHALL automatically create a uniquely named `New project` when the
database has none, and SHALL expose create, switch, rename, copy-link, and confirmed delete actions
inside the sidebar footer without a separate project hub.

#### Scenario: Empty database startup
- **WHEN** `/` is opened and no project exists
- **THEN** one valid blank `New project` is created, selected, and opened through its stable URL

#### Scenario: Project management
- **WHEN** a user creates, selects, renames, copies the link for, or deletes a project
- **THEN** the project list, current route, and local database reflect the completed action without
  modifying another project's organization state

#### Scenario: Duplicate project name
- **WHEN** create or rename supplies a name equal to another normalized project name ignoring case
- **THEN** the operation fails without changing either project and the dialog remains actionable

#### Scenario: Delete final project
- **WHEN** the only project is deleted after confirmation
- **THEN** the application creates and opens a new uniquely named blank project

#### Scenario: Unknown project link
- **WHEN** a direct project URL contains a missing or malformed UUID
- **THEN** the application shows a localized not-found state with an action that resolves the current
  available project

### Requirement: Organization data saves explicitly and atomically
Organization changes SHALL remain dirty until a successful manual or enabled automatic Save, SHALL
support Ctrl+S and Cmd+S, and SHALL be written as one parsed full-state snapshot in an atomic SQLite
transaction. Autosave SHALL default off, debounce organization changes for 1000 ms, serialize at
most one request at a time, and schedule a follow-up when a newer change occurs during a request.
Every Save SHALL send the expected revision and increment it only after a successful write. Import
SHALL make organization state dirty; Export SHALL use live state regardless of save status. UI-only
changes SHALL NOT serialize the organization snapshot.

#### Scenario: Explicit Save
- **WHEN** a user manually saves a dirty project with the current revision
- **THEN** any pending timer is canceled, the exact validated state is committed once, and the
  project becomes clean unless a newer local change occurred

#### Scenario: Enabled Autosave
- **WHEN** Autosave is enabled and organization data changes
- **THEN** one trailing Save begins after 1000 ms and no concurrent state request is created

#### Scenario: Autosave follow-up
- **WHEN** organization data changes during an automatic Save
- **THEN** the completed request marks only its captured sequence saved and one later Save handles
  the newer sequence

#### Scenario: Autosave failure or conflict
- **WHEN** automatic Save fails or reports a stale revision
- **THEN** Autosave pauses, dirty state remains, and existing recovery actions require an explicit
  outcome

#### Scenario: Invalid state Save
- **WHEN** the submitted state fails the production parser
- **THEN** stored state and revision remain unchanged and the client remains dirty

#### Scenario: Unsaved project navigation
- **WHEN** a user leaves a project while organization data is dirty
- **THEN** Save, Discard, and Cancel are offered and navigation waits for the chosen safe outcome

#### Scenario: Browser close with unsaved data
- **WHEN** a page unload is attempted while organization data is dirty
- **THEN** the browser's native unsaved-change confirmation is requested

### Requirement: Concurrent saves require an explicit decision
The project state API MUST reject a stale expected revision without modifying stored bytes and MUST
return the current revision. The client SHALL preserve its local dirty state and offer to load the
stored version, explicitly overwrite at the returned revision, or cancel.

#### Scenario: Stale save
- **WHEN** another tab has already advanced the project's stored revision
- **THEN** Save returns a revision conflict and neither tab's state is silently selected or merged

#### Scenario: Load stored conflict version
- **WHEN** the user resolves a conflict by loading the stored version
- **THEN** the local store is replaced with the current validated database state and becomes clean

#### Scenario: Explicit conflict overwrite
- **WHEN** the user resolves a conflict by overwriting at the returned current revision
- **THEN** the preserved local state is validated and committed as the next revision

#### Scenario: Cancel conflict
- **WHEN** the user cancels conflict resolution
- **THEN** local edits remain visible and dirty while the database remains unchanged

### Requirement: Transient project UI persists separately
Theme, active tab and View, selected and expanded Units, and each View's viewport and selection SHALL
persist automatically as a bounded project UI projection without Employees, Units, assignments,
rules, or other organization data. UI persistence SHALL NOT make the project dirty or commit
unsaved organization changes. Invalid or dangling overlay references SHALL be discarded during
hydration.

#### Scenario: UI-only change
- **WHEN** a user changes theme, navigation, selection, or viewport without editing organization data
- **THEN** the project remains clean and the bounded UI projection is saved after a short debounce

#### Scenario: Reload after unsaved organization edit
- **WHEN** UI state referenced an unsaved organization entity and the project is reloaded without
  saving organization data
- **THEN** the last saved organization opens and the invalid UI reference is filtered without
  restoring the unsaved entity

#### Scenario: Explicit Save includes current UI
- **WHEN** a user saves organization data
- **THEN** the full state and matching UI projection are committed together while the public state
  document remains unchanged

### Requirement: Project persistence remains local and recoverable
The project runtime SHALL bind to loopback, SHALL expose project traffic only through same-origin
no-store endpoints, SHALL require JSON and a matching loopback Origin and Host for mutations, and
SHALL NOT enable CORS, telemetry, request-body logging, remote synchronization, or browser
organization storage. Corrupt stored state SHALL be preserved and SHALL NOT be replaced implicitly.

#### Scenario: Local project request
- **WHEN** the application opens or saves a project
- **THEN** organization bytes travel only between the page and its loopback same-origin runtime

#### Scenario: Cross-origin mutation
- **WHEN** a mutation has a non-loopback Host, mismatched Origin, or unsupported content type
- **THEN** it is rejected before parsing or changing project data

#### Scenario: Corrupt stored project
- **WHEN** stored state fails strict validation during open
- **THEN** the project shows Retry, Switch project, and Delete project recovery without overwriting
  the corrupt database row
