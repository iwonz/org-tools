# state-transfer Specification

## Purpose
Define strict complete-state and mapped-Employee Import/Export.

## Requirements

### Requirement: Import supports complete State and mapped Employees
The global Import action SHALL open a modal with State and Employees tabs. State SHALL accept only a
strict current `OrgToolsState` no larger than 25 MiB and atomically replace memory after explicit
confirmation. Employees SHALL accept at most 20,000 JSON records, require source mappings for UUID,
first name, last name, and email, support standard fields, Tags, Teams, and current Value fields, and
atomically apply only after valid review. A mapping MAY stage a new Value field definition, which
SHALL be created only by the same successful Apply. Mapping rows SHALL read from source JSON path on
the left toward one fixed Org Tools field on the right. Tags and Teams SHALL use the same mapping-row
composition as scalar fields.

#### Scenario: Import complete State
- **WHEN** a user selects State, chooses a valid current state, and confirms replacement
- **THEN** the new UUID, Tag catalog, custom field, organization, and UI data install atomically

#### Scenario: Map Employee input
- **WHEN** a user selects Employees and chooses a JSON array
- **THEN** bounded discovered source paths can be mapped left-to-right to fixed current Employee fields, Tags, and Teams
- **AND** identity, validity, new count, and existing-match count are recomputed once per mapping change

#### Scenario: Map an existing custom field
- **WHEN** a source path is mapped to a current Value definition
- **THEN** every non-skipped valid row receives a typed value while Template fields remain computed

#### Scenario: Stage a new custom field
- **WHEN** mapping configures a new valid Value definition
- **THEN** the definition and imported values appear only after the complete Import Apply succeeds

#### Scenario: Inspect the representative record
- **WHEN** a heterogeneous Employee array is read
- **THEN** the first record with the greatest number of mappable paths is shown in a scrollable JSON preview with its one-based index and total record count
- **AND** the preview is explicitly marked when its UTF-8 representation is truncated at 128 KiB

#### Scenario: Reject invalid input
- **WHEN** input is malformed, oversized, has more than 20,000 rows, lacks required mappings, has
  invalid typed values, or contains ambiguous UUID or identity relationships
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
Existing Employees SHALL be matched by the normalized identity tuple while retaining their current
UUID. New rows SHALL default to Add and support bulk or individual Skip. Matches SHALL support bulk
Update, Skip, and Teams only when Teams are mapped, with sparse per-row overrides. Review SHALL use
virtualized New, Duplicate, and Skipped columns; every skipped row SHALL appear in Skipped. Clearing
the Teams mapping MUST reset a Teams-only bulk policy and every incompatible per-row override before
Apply can continue.

#### Scenario: Apply bulk policy
- **WHEN** matched Employees exist and the user changes the bulk policy
- **THEN** every match without an individual override uses that policy

#### Scenario: Apply a duplicate update
- **WHEN** an imported identity matches an Employee and Update is applied
- **THEN** mapped data changes while the existing UUID remains stable

#### Scenario: Skip a new Employee
- **WHEN** a new row receives Skip individually or in bulk
- **THEN** it moves from New to Skipped and creates no Employee

#### Scenario: Apply Teams only
- **WHEN** a duplicate uses Teams only with a valid Teams mapping
- **THEN** core and custom fields remain unchanged while assignments are upserted

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
Import SHALL analyze at most 20,000 records in one indexed pass, retain a 128 KiB representative
preview, store sparse overrides, and virtualize New, Duplicate, and Skipped columns. Mapping changes
MUST reuse source analysis and SHALL recompute typed candidates without rendering complete lists.

#### Scenario: Review 20,000 Employees
- **WHEN** a valid 20,000-row Employee array is read and mapped
- **THEN** the application performs one source-analysis pass, retains one derived match index, and renders only visible review rows
- **AND** scrolling, changing one row policy, or rendering the representative preview does not rescan the complete input

#### Scenario: Review mapping on a narrow viewport
- **WHEN** Employee Import renders at 390 px
- **THEN** the representative preview and source-to-target mapping stack vertically without horizontal overflow

### Requirement: Mapped Tag Import ignores color
Mapped Employee Import SHALL consume Tag label and optional date, resolve or create a neutral catalog
definition by normalized label, and SHALL NOT import or overwrite Tag colors.

#### Scenario: Import an existing colored Tag
- **WHEN** mapped input references the label of a colored Tag
- **THEN** the assignment uses the existing definition and its color remains unchanged

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
