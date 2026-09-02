## MODIFIED Requirements

### Requirement: One strict current state contains organization data and durable UI
The application SHALL use one strict unversioned `OrgToolsState` with exactly `organization` and
`ui` at the top level. Organization SHALL contain the global Employee catalog and one current
`{ layoutMode, units }` structure. Durable UI SHALL contain locale, theme, shell state, active
section, Unit navigation, filters, searches, Calendar settings, and current JSON/Template Data
Download settings, plus the one Editor viewport and selection. Download settings SHALL store
ordered scalar fields, independently named Unit and Tag collection fields, exact exclusion keys,
Template row mode, and Template format; they SHALL NOT store CSV, flat Unit columns, or a Unit-path
separator. Transient overlays, notifications, unfinished form drafts, complete generated output,
and Editor export settings MUST NOT enter the state. There SHALL be no View array, View ID, local
View Employee, override, format discriminator, version, compatibility alias, legacy reader, or
partial document.

#### Scenario: Complete state round trip
- **WHEN** a current state is exported and imported, synchronized to another tab, or reopened from SQLite
- **THEN** organization data and valid durable UI context restore atomically

#### Scenario: Capture current state
- **WHEN** current state is captured after organization and UI actions
- **THEN** exactly one Employee catalog, one Unit structure, and one bounded UI projection validate

#### Scenario: Obsolete document
- **WHEN** input contains `kind`, `content`, version fields, a former project document, CSV Download settings, flat Unit fields, a configurable Unit-path separator, or a partial state
- **THEN** strict validation rejects it without changing memory or durable storage

#### Scenario: Reject old View state
- **WHEN** input contains `organization.views`, `activeViewId`, `ui.views`, or Download `sourceViewId`
- **THEN** strict validation rejects it without changing memory or durable storage

#### Scenario: Transient interface
- **WHEN** a dialog, popover, toast, output build, or Editor export session is active while state is captured
- **THEN** that transient condition is absent from the captured state
