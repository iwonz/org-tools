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
SHALL be created only by the same successful Apply. Mapping SHALL show every discovered source JSON
path once on the left and a selectable Org Tools target or Do not import on the right. Targets MUST
remain unique; selecting an occupied target SHALL transfer it from its previous source. Tags and
Teams SHALL use the same mapping-row composition as scalar fields.

#### Scenario: Import complete State
- **WHEN** a user selects State, chooses a valid current state, and confirms replacement
- **THEN** the new UUID, Tag catalog, custom field, organization, and UI data install atomically

#### Scenario: Map Employee input
- **WHEN** a user selects Employees and chooses a JSON array
- **THEN** every bounded discovered source path appears with a Select for an Org Tools field or Do not import
- **AND** identity, validity, new count, and existing-match count are recomputed once per mapping change

#### Scenario: Transfer an occupied target
- **WHEN** a user assigns an Org Tools target already selected for another source path
- **THEN** the target moves to the new source and the previous source becomes Do not import

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

### Requirement: State transfer uses only the strict View state
Full State Import and Export SHALL contain every View document and bounded per-View UI record in the
current strict contract. A previous single-structure state SHALL be rejected atomically. Employee
array Import with Teams SHALL create or update assignments only in the system View.

#### Scenario: Round-trip Views
- **WHEN** a valid current State containing custom Views is exported and imported
- **THEN** View isolation, global catalogs, active View, per-View viewport, selection, distribution
  mode, and Download source restore exactly

#### Scenario: Reject single-structure State
- **WHEN** State Import receives `organization.structure` without the current View array
- **THEN** the confirmation cannot apply and memory and SQLite remain unchanged

#### Scenario: Import Employee Teams
- **WHEN** mapped Employee Import creates or updates Team assignments
- **THEN** only the system View changes and custom Views remain byte-equivalent

### Requirement: Complete State transfer requires Unit notes
Every Unit in the current exact State contract SHALL contain `noteMarkdown`. Complete State Export
SHALL include the source exactly after normalization, and complete State Import SHALL reject a Unit
that omits the field, provides a non-string value, or exceeds the UTF-8 bound. Employee transfer
SHALL NOT expose or modify Unit notes.

#### Scenario: Export and import noted Units
- **WHEN** a valid complete State containing notes is exported and imported
- **THEN** every View-local Unit note is preserved exactly

#### Scenario: Import the former Unit shape
- **WHEN** a complete State contains a Unit without `noteMarkdown`
- **THEN** strict validation rejects the file atomically without changing current state

### Requirement: Complete State requires distribution View UI
Every View UI entry in the strict current State SHALL contain a unique
`distributionModeUnitIds` array whose IDs belong to that View. Complete State Import SHALL reject a
missing, duplicate, or foreign Unit ID atomically; complete State Export SHALL preserve valid mode
settings.

#### Scenario: Transfer enabled Units
- **WHEN** a valid complete State with enabled distribution Units is exported and imported
- **THEN** every View restores its own enabled Unit IDs

#### Scenario: Import the former View UI shape
- **WHEN** complete State omits `distributionModeUnitIds`
- **THEN** validation rejects it without changing the current state

### Requirement: Complete state requires View settings
Every View SHALL contain exact required `structure.settings` with boolean groupByTag and showTagCloud
plus non-null distributedColor and undistributedColor using the existing named or canonical lowercase
six/eight-digit HEX contract. Missing, extra, or invalid settings and obsolete Unit groupByTag SHALL
reject the complete candidate atomically. New Views SHALL default to true, true, green, and amber.
Complete Export and Import SHALL preserve View settings and catalog array order exactly.

#### Scenario: Round-trip grouping
- **WHEN** a complete current state is exported and imported
- **THEN** every View's settings and the global Tag order are preserved

#### Scenario: Reject obsolete grouping shape
- **WHEN** a View lacks valid settings or any Unit retains groupByTag
- **THEN** the complete import fails without changing current state

### Requirement: Complete State requires exact canvas elements
Every current View structure SHALL contain a `canvasElements` array whose entries use the exact Text,
Sticker, Image, or Arrow shape. Complete State validation SHALL require unique UUIDs, supported
discriminators and exact keys, finite bounded geometry, valid layer and style values, bounded UTF-8
content, same-View target references, valid anchor IDs, acyclic element dependencies, and safe
embedded Image data. View UI element selections SHALL reference existing elements. Validation MUST
remain atomic and MUST NOT add a format version, migration, or compatibility reader.

#### Scenario: Round-trip canvas elements
- **WHEN** a valid complete State containing attached elements is exported and imported
- **THEN** element order, geometry, style, image bytes, attachment references, and selection are preserved exactly after normalization

#### Scenario: Reject the former View shape
- **WHEN** complete State omits `structure.canvasElements`
- **THEN** the candidate is rejected atomically without changing memory, SQLite, or live peers

#### Scenario: Reject invalid element relationships
- **WHEN** canvas elements contain a duplicate ID, missing target, invalid anchor, self-reference, or dependency cycle
- **THEN** the complete candidate is rejected before replacement

#### Scenario: Reject unsafe image data
- **WHEN** an Image element contains a remote URL, unsupported MIME, malformed base64, mismatched intrinsic dimensions, more than 25 MiB compressed bytes, or more than 40 megapixels
- **THEN** the complete candidate is rejected without decoding or fetching remote content

### Requirement: Current State persists exact open-position data

Every Unit in the current exact State contract SHALL contain `openPositions`. Each entry MUST have
exactly a nullable validated `backgroundColor`, UUID `id`, normalized non-empty `title`, and unique
current Tag assignments with canonical optional dates. IDs MUST be unique inside the View,
referenced Tags MUST exist, Live Units MUST have an empty array, and open-position selection or
anchors MUST resolve to the named containing Unit. The parser MUST reject previous, mixed, missing,
extra, invalid-color, or dangling shapes atomically without a version marker, migration, or
compatibility reader.

#### Scenario: Import current open positions
- **WHEN** complete State contains valid transparent or colored manual-Unit open positions, Tags,
  selection, and anchors
- **THEN** Import accepts the complete State and round-trips the exact current data

#### Scenario: Reject invalid open-position State
- **WHEN** a position has a missing or invalid background color, invalid or duplicate ID, blank
  title, duplicate or missing Tag, non-canonical date, Live owner, dangling selection, or dangling
  anchor
- **THEN** the complete State is rejected without partially replacing current data

#### Scenario: Reject the preceding open-position shape
- **WHEN** complete State contains an open position without required `backgroundColor`
- **THEN** strict parsing rejects it without runtime conversion

### Requirement: Employee-oriented exports exclude open positions

Open positions SHALL remain present only in complete State Export and Editor PNG. Employee transfer,
JSON, Template, Units, Analytics, and Calendar projections MUST continue to operate only on global
Employees and MUST NOT serialize, count, search, or emit open positions.

#### Scenario: Export data from a View with positions
- **WHEN** a source View contains open positions and a user exports Employees, JSON, or Template data
- **THEN** output is identical to the same Employee assignments without those positions

### Requirement: Employee Import maps advanced custom values
Mapped Employee Import SHALL accept arrays for current multi-option fields and arrays of objects for current Composite fields. Option values SHALL resolve by UUID or normalized label, Composite object properties SHALL resolve by stable subfield UUID or configured name, and the complete candidate SHALL be rejected atomically for unknown, duplicate, missing-required, or incorrectly typed values. Staging a new Import-created field SHALL remain limited to ordinary Value fields.

#### Scenario: Import advanced values
- **WHEN** mapped rows contain valid option arrays and Composite record arrays
- **THEN** the typed values are applied under the existing definitions in the same atomic Import

#### Scenario: Reject malformed advanced values
- **WHEN** one mapped row contains a duplicate Composite primary value or unknown option
- **THEN** no Employee, option catalog, or definition changes

### Requirement: Complete State uses only the current advanced-field shape
Complete State Import and the SQLite runtime SHALL accept only definitions and Employee values with the current exact advanced-field shape. They SHALL NOT add a schema version, legacy reader, automatic migration, or compatibility aliases.

#### Scenario: Load an obsolete field definition
- **WHEN** a complete State omits newly required Option mode properties or contains an obsolete custom value shape
- **THEN** strict validation rejects it without mutating current state

### Requirement: Complete State requires Employee display formats
Every complete State SHALL contain exact `organization.employeeDisplayFormats` with string
`employees`, `units`, `editor`, and `editorExport` values. Complete Export and Import SHALL preserve
all four strings exactly. Missing, extra, or non-string values and the previous organization shape
MUST be rejected atomically without a version marker or runtime compatibility reader.

#### Scenario: Round-trip display formats
- **WHEN** a current complete State is exported and imported
- **THEN** all four Employee display formats retain their exact strings

#### Scenario: Reject the previous organization shape
- **WHEN** a complete State omits `employeeDisplayFormats`
- **THEN** validation rejects it without changing memory, SQLite, or live peers

### Requirement: New State has stable Employee display defaults
Blank State and the one-time owned SQLite conversion MUST create Employees and Units formats with
full name, username, email, position, Unit name, and Tags on separate lines; Editor MUST use full
name and Tags; Editor export MUST use full name with a conditional manager marker followed by Tags.

#### Scenario: Create blank State
- **WHEN** the application creates a new blank organization
- **THEN** its four required display formats exactly match the maintained defaults
