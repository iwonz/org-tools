## MODIFIED Requirements

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

## ADDED Requirements

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
