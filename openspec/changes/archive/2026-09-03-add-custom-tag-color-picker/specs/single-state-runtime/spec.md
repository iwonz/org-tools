## MODIFIED Requirements

### Requirement: One strict current state contains organization data and durable UI
The application SHALL use one strict unversioned `OrgToolsState` with exactly `organization` and
`ui` at the top level. Organization SHALL contain UUID Employees with custom values, one current
`{ layoutMode, units }` structure, UUID-keyed custom field definitions, and a UUID-keyed Tag catalog
whose optional color is a supplied semantic name or canonical lowercase six-digit HEX value.
Durable UI SHALL contain locale, theme, shell state, active section, Unit navigation, complete
birthday and custom filters, searches, Calendar and Download settings, plus the one Editor viewport
and selection. Download settings SHALL store one complete `jsonTopLevelFieldOrder` covering scalar
Employee fields plus Unit and Tag collection keys, ordered nested Unit and Tag fields, independently
named fields, exact exclusion keys, Template row mode, and Template format. They SHALL NOT store a
separate Employee-only top-level order, CSV, flat Unit columns, or a Unit-path separator. Transient
overlays, notifications, unfinished form drafts, complete generated output, and Editor export
settings MUST NOT enter the state. There SHALL be no deterministic Employee digest, inline Tag
label, obsolete Calendar cloud state, missing definition reference, View array, View ID, local View
Employee, override, format discriminator, version, compatibility alias, legacy reader, partial
document, unknown key, or old custom/output shape.

#### Scenario: Open the current state
- **WHEN** either runtime receives a fully valid current state
- **THEN** organization and UI hydrate atomically and all definition references resolve

#### Scenario: Reject an obsolete state
- **WHEN** persisted or imported data uses the former Employee ID, inline Tag, filter, Calendar shape, or a noncanonical custom Tag color
- **THEN** strict parsing fails without compatibility conversion or partial replacement

#### Scenario: Complete state round trip
- **WHEN** a current state is exported and imported, synchronized to another tab, or reopened from SQLite
- **THEN** organization data and valid durable UI context restore atomically, including exact named or custom Tag colors and unified JSON field order

#### Scenario: Capture current state
- **WHEN** current state is captured after organization and UI actions
- **THEN** exactly one Employee catalog, one Unit structure, one Tag catalog, and one bounded UI projection validate

#### Scenario: Obsolete document
- **WHEN** input contains `kind`, `content`, version fields, a former project document, a separate Employee-only JSON field order, CSV Download settings, flat Unit fields, a configurable Unit-path separator, or a partial state
- **THEN** strict validation rejects it without changing memory or durable storage

#### Scenario: Reject old View state
- **WHEN** input contains `organization.views`, `activeViewId`, `ui.views`, or Download `sourceViewId`
- **THEN** strict validation rejects it without changing memory or durable storage

#### Scenario: Transient interface
- **WHEN** a dialog, popover, toast, output build, or Editor export session is active while state is captured
- **THEN** that transient condition is absent from the captured state
