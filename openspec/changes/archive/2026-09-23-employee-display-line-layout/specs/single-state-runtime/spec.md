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
independently named fields, exact exclusion keys, Template row mode, and Template format. They SHALL
NOT store a separate Employee-only top-level order, CSV, flat Unit columns, or a Unit-path separator.
Transient overlays, notifications, unfinished form drafts, complete generated output, Editor
history/clipboard, and Editor export settings MUST NOT enter the state. There SHALL be no
deterministic Employee digest, inline Tag label, obsolete Calendar cloud state, missing definition
reference, View-local Employee, override, format discriminator, version, compatibility alias,
legacy reader, partial document, unknown key, or old custom/output shape.

#### Scenario: Open the current state
- **WHEN** either runtime receives a fully valid current state with four bounded line gaps
- **THEN** organization and UI hydrate atomically, exactly one system View exists, Unit IDs are globally unique, and all definition and View references resolve

#### Scenario: Reject an obsolete state
- **WHEN** persisted or imported data omits a line gap, adds an unknown gap, or supplies a fractional, negative, or greater-than-24 value
- **THEN** strict parsing fails without compatibility conversion or partial replacement

#### Scenario: Complete state round trip
- **WHEN** a current state is exported and imported, synchronized to another tab, or reopened from SQLite
- **THEN** all View documents, global catalogs, Employee formats, line gaps, and valid durable UI context restore atomically

#### Scenario: Capture current state
- **WHEN** current state is captured after one atomic Employee-display save
- **THEN** all four formats and four line gaps appear in the same organization revision

#### Scenario: Obsolete document
- **WHEN** input contains a former State shape, partial line-gap object, format discriminator, version, compatibility alias, or unknown key
- **THEN** strict validation rejects it without changing memory or durable storage

#### Scenario: Transient interface
- **WHEN** a dialog, popover, toast, output build, View history/clipboard, or Editor export session is active while state is captured
- **THEN** that transient condition is absent from the captured state

## ADDED Requirements

### Requirement: Employee line gaps are converted once outside runtime
Delivery SHALL stop the owned runtime, preserve a timestamped ignored database-family backup, add
four 4-pixel Employee line gaps, rewrite legacy visible `isBoss` output to an equivalent locale
literal ternary, validate a detached candidate and committed row with the production parser, and
update the singleton row in one transaction. The converter and obsolete reader MUST NOT remain in
the repository or runtime.

#### Scenario: Convert the owned database
- **WHEN** the immediately previous valid SQLite row is converted
- **THEN** all previous organization and UI data remain equal except the required line gaps, equivalent `isBoss` format rewrite, revision, and update timestamp

#### Scenario: Conversion fails
- **WHEN** an assertion, production parse, transaction, or reopen check fails
- **THEN** the original transaction remains intact and the complete timestamped backup remains available
