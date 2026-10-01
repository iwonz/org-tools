## REMOVED Requirements

### Requirement: Initial state loading is quiet and centered
**Reason**: Startup now resolves authentication, migration readiness, and an authorized projection rather than SQLite or Pages State.
**Migration**: Retain the centered accessible indicator while the authenticated bootstrap request is pending.

### Requirement: Navigation states are explicit and responsive
**Reason**: Import/Export and Pages parity leave the sidebar, while account and Administration destinations become permission-aware.
**Migration**: Preserve established responsive shell geometry and workflow actions with the new authenticated navigation contract.

### Requirement: Dialogs and overlays preserve task context
**Reason**: The former requirement contains an obsolete State Import dialog scenario.
**Migration**: Preserve the overlay hierarchy for current dialogs and add authentication, Administration, Backup, and Restore dialogs.

## ADDED Requirements

### Requirement: Authenticated startup is quiet and centered
While the server resolves session and projection state, the application SHALL show the established
centered icon-only accessible loading indicator. A logged-out installation SHALL transition to Setup
or Login, and a readiness failure SHALL transition to a localized blocking error without briefly
rendering organization data.

#### Scenario: Resolve an authenticated session
- **WHEN** the application waits for session bootstrap
- **THEN** one centered local indicator renders until the authorized shell or a logged-out state replaces it

### Requirement: Navigation reflects account access
The responsive sidebar SHALL preserve its compact and expanded geometry and current workflow order,
remove State Import/Export, and add an account menu. Administration SHALL appear only for a Super
Administrator. Workflow actions SHALL render only when their command is permitted. Editor SHALL
retain its full-height canvas behavior.

#### Scenario: Render an Employee account
- **WHEN** an authenticated Employee opens the shell
- **THEN** only readable destinations and permitted actions appear and Administration is absent

#### Scenario: Render a Super Administrator
- **WHEN** a Super Administrator opens the shell
- **THEN** Administration exposes Users, Roles, Access, and Audit with localized thematic icons

### Requirement: Logged-out and forced-password states are isolated
Setup, Login, and forced-password screens SHALL contain no organization navigation or values. They
SHALL retain responsive, RTL, keyboard, focus, error, and reduced-motion behavior and SHALL use only
bundled assets.

#### Scenario: Require password replacement
- **WHEN** a temporary-password session is established
- **THEN** only the localized password-change surface and Logout are reachable until success

### Requirement: Current dialogs preserve task context
The application SHALL preserve task context in authentication, account, Administration, Backup,
Restore, language, theme, product, and Editor dialogs. These dialogs use the established modal
focus, portal, overlay, spacing, and z-index hierarchy.
Nested popovers and selects SHALL remain above their owning dialog, and runtime blocking errors SHALL
remain above ordinary interaction layers.

#### Scenario: Open Restore confirmation
- **WHEN** a Super Administrator reviews a valid detached Backup candidate
- **THEN** the destructive confirmation traps focus, keeps its bounded summary visible, and remains above shell and canvas controls
