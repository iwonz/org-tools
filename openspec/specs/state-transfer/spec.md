# state-transfer Specification

## Purpose
Define strict complete-state and mapped-Employee Import/Export.

## Requirements

### Requirement: Import supports complete State and mapped Employees
The global Import action SHALL open a modal with State and Employees tabs. State SHALL accept only a
strict current `OrgToolsState` no larger than 25 MiB and atomically replace memory after explicit
confirmation. Employees SHALL accept a top-level JSON array no larger than 25 MiB, require explicit
mapping for first name, last name, and email, allow optional field, tag, and Team mappings, preview
new and matched rows, surface invalid rows as a blocking localized error, and mutate current state
only after one valid confirmed Apply.

#### Scenario: Import complete State
- **WHEN** a user selects State, chooses a valid current state, and confirms replacement
- **THEN** organization and durable UI install atomically, including locale and theme, and the
  runtime immediately schedules its normal persistence or synchronization behavior

#### Scenario: Map Employee input
- **WHEN** a user selects Employees and chooses a JSON array
- **THEN** bounded discovered source paths can be mapped to current Employee fields, tags, and Teams
- **AND** identity, validity, new count, and existing-match count are recomputed once per mapping change

#### Scenario: Reject invalid input
- **WHEN** JSON is malformed, oversized, not an array for Employees, contains duplicate computed IDs,
  lacks identity mappings, or produces invalid current fields
- **THEN** a localized error and file re-selection remain available while current state is unchanged

#### Scenario: Cancel Import
- **WHEN** file selection, mapping, review, or confirmation is canceled
- **THEN** current memory, SQLite, and other live tabs are unchanged

### Requirement: Export selects complete State or flat Employees
The global Export action SHALL immediately validate and download the strict current state as
`org-tools-state.json`. It SHALL NOT open a mode dialog or offer a separate Employee export. State
and mapped Employee Import SHALL remain available as distinct Import tabs.

#### Scenario: Export complete State
- **WHEN** the user activates global Export
- **THEN** one current `{ organization, ui }` JSON document downloads immediately without changing runtime state or opening a dialog

#### Scenario: Export validation failure
- **WHEN** the live state cannot pass the production parser
- **THEN** no file downloads and the shell presents a localized owned error

#### Scenario: Import choices remain available
- **WHEN** the user opens Import
- **THEN** complete State and mapped Employees remain the only two Import tabs

### Requirement: Employee duplicate policies are bulk-selectable and individually overridable
Existing Employees SHALL be matched only by deterministic Employee ID. The review SHALL provide one
bulk policy of Update data, Skip, or Teams only and SHALL allow a sparse per-match override. Update
SHALL replace mapped core fields and upsert imported Teams when enabled; Skip SHALL change nothing;
Teams only SHALL retain core data and upsert imported Teams when enabled.

#### Scenario: Apply bulk policy
- **WHEN** matched Employees exist and the user changes the bulk policy
- **THEN** every match without an individual override uses that policy

#### Scenario: Override one match
- **WHEN** the user chooses a different policy for one matched Employee
- **THEN** only that Employee diverges from the bulk policy and the review count updates

### Requirement: Team assignment Import is explicit and additive
Employee Import SHALL expose an Import Teams control. When disabled, mapped Team data MUST be
ignored. When enabled, the importer SHALL match by Unit ID then normalized full path, create missing
manual path segments, and upsert imported position and boss status while preserving unrelated
assignments.

#### Scenario: Ignore Teams
- **WHEN** Import Teams is disabled
- **THEN** no Unit or assignment changes regardless of mapped Team input

#### Scenario: Import Teams
- **WHEN** Import Teams is enabled and mapped assignments reference existing or new paths
- **THEN** matching Units are reused, missing manual Units are created, and referenced assignments are upserted atomically

### Requirement: Large Employee transfer remains bounded
Mapping and matching SHALL process 20,000 Employees in linear time, cache the derived preview until
inputs change, and render matched rows through virtualization. Per-row policy state SHALL remain
sparse and transfer candidates SHALL be released when the modal closes.

#### Scenario: Review 20,000 Employees
- **WHEN** a valid 20,000-row Employee array is mapped
- **THEN** the application retains one derived index and renders only the visible review rows
- **AND** scrolling or changing one row policy does not remap the complete input

### Requirement: Employee transfer enforces complete birthday values
Complete-state Import and mapped Employee Import SHALL accept a non-null birthday only as a valid
canonical `DD.MM.YYYY` value. Year `1900` SHALL retain unknown-year semantics. Obsolete `MM-DD`, ISO,
timestamp, partial, and locale-inferred values MUST be rejected without fallback or mutation.

#### Scenario: Import a known year
- **WHEN** mapped Employee input contains a valid `DD.MM.YYYY` birthday with a year after 1900
- **THEN** the preview and atomic Apply retain the complete canonical value

#### Scenario: Import an unknown year
- **WHEN** mapped Employee input contains a valid birthday whose year is `1900`
- **THEN** Apply retains its day and month while the application treats its year as unknown

#### Scenario: Reject obsolete or invalid birthday input
- **WHEN** any selected Employee row or complete state contains a birthday outside the current contract
- **THEN** Import shows localized format feedback and current memory, SQLite, and live tabs remain unchanged
