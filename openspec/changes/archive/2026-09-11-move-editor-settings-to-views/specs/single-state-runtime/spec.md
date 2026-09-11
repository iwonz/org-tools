## MODIFIED Requirements

### Requirement: One strict current state contains organization data and durable UI
The application SHALL use one strict unversioned `OrgToolsState` with exactly `organization` and
`ui` at the top level. Organization SHALL contain UUID Employees with custom values, exactly one
system View, zero or more custom Views, UUID-keyed custom field definitions, and a UUID-keyed Tag
catalog whose optional color is a supplied semantic name or canonical lowercase six- or eight-digit
HEX value. Every View SHALL contain its own `{ layoutMode, settings, units }` structure and timestamps without
Employee copies or overrides. Durable UI SHALL contain locale, theme, shell state, active section,
system Unit navigation, complete birthday and custom filters, searches, Calendar and Download
settings, active Editor View, and bounded viewport, selection, and distribution-mode entries for
every View. Download
settings SHALL store its source View, one complete `jsonTopLevelFieldOrder` covering scalar Employee
fields plus Unit and Tag collection keys, ordered nested Unit and Tag fields, independently named
fields, exact exclusion keys, Template row mode, and Template format. They SHALL NOT store a separate
Employee-only top-level order, CSV, flat Unit columns, or a Unit-path separator. Transient overlays,
notifications, unfinished form drafts, complete generated output, Editor history/clipboard, and
Editor export settings MUST NOT enter the state. There SHALL be no deterministic Employee digest,
inline Tag label, obsolete Calendar cloud state, missing definition reference, View-local Employee,
override, format discriminator, version, compatibility alias, legacy reader, partial document,
unknown key, or old custom/output shape.

#### Scenario: Open the current state
- **WHEN** either runtime receives a fully valid current state
- **THEN** organization and UI hydrate atomically, exactly one system View exists, Unit IDs are globally unique, and all definition and View references resolve

#### Scenario: Reject an obsolete state
- **WHEN** persisted or imported data uses the former single structure, Employee ID, inline Tag, filter, Calendar shape, or a noncanonical custom Tag color
- **THEN** strict parsing fails without compatibility conversion or partial replacement

#### Scenario: Complete state round trip
- **WHEN** a current state is exported and imported, synchronized to another tab, or reopened from SQLite
- **THEN** all View documents, global catalogs, and valid durable UI context restore atomically

#### Scenario: Capture current state
- **WHEN** current state is captured after organization and UI actions
- **THEN** exactly one Employee catalog, one system View, every custom View, one Tag catalog, and one bounded UI projection validate

#### Scenario: Obsolete document
- **WHEN** input contains `kind`, `content`, version fields, `organization.structure`, a former project document, View-local Employees, a separate Employee-only JSON field order, CSV settings, flat Unit fields, a configurable Unit-path separator, or a partial state
- **THEN** strict validation rejects it without changing memory or durable storage

#### Scenario: Transient interface
- **WHEN** a dialog, popover, toast, output build, View history/clipboard, or Editor export session is active while state is captured
- **THEN** that transient condition is absent from the captured state

### Requirement: Grouping and Tag order use existing local persistence
Tag order changes and View settings commands SHALL use the existing organization write and live-tab
synchronization path once per logical mutation. Every runtime boundary SHALL validate exact required
View settings. No legacy reader or automatic conversion SHALL be added. A delayed SQLite startup
response MUST NOT overwrite a newer peer snapshot or decrease its logical stamp.

#### Scenario: Restore preferences
- **WHEN** server state is reopened or a live peer receives a validated update
- **THEN** catalog order and each View's settings match the committed state

#### Scenario: Race initial local state sources
- **WHEN** SQLite loading finishes after a newer peer snapshot has been installed
- **THEN** the newer state and stamp remain authoritative and subsequent changes synchronize

### Requirement: Current database grouping is converted once outside runtime
The authorized current local database conversion SHALL stop its writer, retain an ignored consistent
backup, add default settings to every View, remove Unit groupByTag, validate the full result with the
production parser, and commit one transaction with one revision increment. It MUST preserve Tag order
and unrelated data. Failure SHALL leave the original unchanged; an already-current database SHALL be
a validated no-op. The conversion tool MUST NOT ship in runtime.

#### Scenario: Convert current database
- **WHEN** the recognized previous state converts and validates
- **THEN** every View has default settings, Units have no grouping property, one revision is committed, and the backup remains available

#### Scenario: Fail conversion
- **WHEN** validation or writing fails
- **THEN** no partial conversion is committed
