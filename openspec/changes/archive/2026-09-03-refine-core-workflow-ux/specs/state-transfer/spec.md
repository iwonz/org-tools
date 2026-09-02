## MODIFIED Requirements

### Requirement: Import supports complete State and mapped Employees
The global Import action SHALL open a modal with State and Employees tabs. State SHALL accept only a
strict current `OrgToolsState` no larger than 25 MiB and atomically replace memory after explicit
confirmation. Employees SHALL accept a top-level JSON array no larger than 25 MiB, require explicit
mapping for first name, last name, and email, allow optional field, Tag, and Team mappings, preview
one representative source record, preview new and matched rows, surface invalid rows as a blocking
localized error, and mutate current state only after one valid confirmed Apply. Mapping rows SHALL
read from source JSON path on the left toward one fixed Org Tools field on the right. Tags and Teams
SHALL use the same mapping-row composition as scalar fields.

#### Scenario: Import complete State
- **WHEN** a user selects State, chooses a valid current state, and confirms replacement
- **THEN** organization and durable UI install atomically, including locale and theme, and the
  runtime immediately schedules its normal persistence or synchronization behavior

#### Scenario: Map Employee input
- **WHEN** a user selects Employees and chooses a JSON array
- **THEN** bounded discovered source paths can be mapped left-to-right to fixed current Employee fields, Tags, and Teams
- **AND** identity, validity, new count, and existing-match count are recomputed once per mapping change

#### Scenario: Inspect the representative record
- **WHEN** a heterogeneous Employee array is read
- **THEN** the first record with the greatest number of mappable paths is shown in a scrollable JSON preview with its one-based index and total record count
- **AND** the preview is explicitly marked when its UTF-8 representation is truncated at 128 KiB

#### Scenario: Reject invalid input
- **WHEN** JSON is malformed, oversized, not an array for Employees, contains duplicate computed IDs,
  lacks identity mappings, or produces invalid current fields
- **THEN** a localized error and file re-selection remain available while current state is unchanged

#### Scenario: Cancel Import
- **WHEN** file selection, mapping, review, or confirmation is canceled
- **THEN** current memory, SQLite, and other live tabs are unchanged

### Requirement: Employee duplicate policies are bulk-selectable and individually overridable
Existing Employees SHALL be matched only by deterministic Employee ID. The review SHALL provide one
bulk policy of Update data or Skip, plus Teams only when a Teams source path is mapped, and SHALL
allow a sparse per-match override. Update SHALL replace mapped core fields and upsert imported Teams
when mapped; Skip SHALL change nothing; Teams only SHALL retain core data and upsert imported Teams.
Clearing the Teams mapping MUST reset a Teams-only bulk policy and every incompatible per-row
override before Apply can continue.

#### Scenario: Apply bulk policy
- **WHEN** matched Employees exist and the user changes the bulk policy
- **THEN** every match without an individual override uses that policy

#### Scenario: Override one match
- **WHEN** the user chooses a different available policy for one matched Employee
- **THEN** only that Employee diverges from the bulk policy and the review count updates

#### Scenario: Clear the Teams mapping
- **WHEN** Teams only is selected in bulk or per-row and the user clears the Teams source mapping
- **THEN** Teams only becomes unavailable and every incompatible choice resets to Update data

### Requirement: Team assignment Import is mapping-driven and additive
Employee Import SHALL import Team assignments exactly when a Teams source path is mapped. With no
Teams mapping, Team data and Teams-only duplicate policies MUST be absent. With a Teams mapping, the
importer SHALL require the strict Team shape, match by Unit ID then normalized full path, create
missing manual path segments, and upsert imported position and boss status while preserving unrelated
assignments. It SHALL NOT expose a separate Import Teams switch.

#### Scenario: Omit Teams mapping
- **WHEN** no Teams source path is mapped
- **THEN** no Unit or assignment changes and no Teams-only policy is available

#### Scenario: Import mapped Teams
- **WHEN** mapped assignments reference existing or new paths
- **THEN** matching Units are reused, missing manual Units are created, and referenced assignments are upserted atomically

### Requirement: Large Employee transfer remains bounded
File analysis SHALL discover paths and choose the representative record in one linear pass over at
most 20,000 Employees. The representative JSON preview SHALL be capped at 128 KiB. Mapping and
matching SHALL cache the derived preview until inputs change, render the mapping and source preview
without horizontal overflow at 390 px, and render matched rows through virtualization. Per-row
policy state SHALL remain sparse and transfer candidates SHALL be released when the modal closes.

#### Scenario: Review 20,000 Employees
- **WHEN** a valid 20,000-row Employee array is read and mapped
- **THEN** the application performs one source-analysis pass, retains one derived match index, and renders only visible review rows
- **AND** scrolling, changing one row policy, or rendering the representative preview does not rescan the complete input

#### Scenario: Review mapping on a narrow viewport
- **WHEN** Employee Import renders at 390 px
- **THEN** the representative preview and source-to-target mapping stack vertically without horizontal overflow
