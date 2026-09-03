## MODIFIED Requirements

### Requirement: Import supports complete State and mapped Employees
The global Import action SHALL open State and Employees tabs. State SHALL accept only the strict
current state no larger than 25 MiB. Employees SHALL accept at most 20,000 JSON records, require
source mappings for UUID, first name, last name, and email, support standard fields, Tags, Teams,
and current Value fields, and atomically apply only after valid review. A mapping MAY stage a new
Value field definition, which SHALL be created only by the same successful Apply.

#### Scenario: Import complete State
- **WHEN** a user chooses a valid current State and confirms replacement
- **THEN** the new UUID, Tag catalog, custom field, organization, and UI data install atomically

#### Scenario: Map an existing custom field
- **WHEN** a source path is mapped to a current Value definition
- **THEN** every non-skipped valid row receives a typed value while Template fields remain computed

#### Scenario: Stage a new custom field
- **WHEN** mapping configures a new valid Value definition
- **THEN** the definition and imported values appear only after the complete Import Apply succeeds

#### Scenario: Reject invalid input
- **WHEN** input is malformed, oversized, has more than 20,000 rows, lacks required mappings, has
  invalid typed values, or contains ambiguous UUID or identity relationships
- **THEN** localized review remains available and organization state is unchanged

#### Scenario: Cancel Import
- **WHEN** file selection, mapping, review, or confirmation is canceled
- **THEN** current state and staged field definitions remain unchanged

### Requirement: Employee duplicate policies are bulk-selectable and individually overridable
Existing Employees SHALL be matched by the normalized identity tuple while retaining their current
UUID. New rows SHALL default to Add and support bulk or individual Skip. Matches SHALL support bulk
Update, Skip, and Teams only when Teams are mapped, with sparse per-row overrides. Review SHALL use
virtualized New, Duplicate, and Skipped columns; every skipped row SHALL appear in Skipped.

#### Scenario: Apply a duplicate update
- **WHEN** an imported identity matches an Employee and Update is applied
- **THEN** mapped data changes while the existing UUID remains stable

#### Scenario: Skip a new Employee
- **WHEN** a new row receives Skip individually or in bulk
- **THEN** it moves from New to Skipped and creates no Employee

#### Scenario: Apply Teams only
- **WHEN** a duplicate uses Teams only with a valid Teams mapping
- **THEN** core and custom fields remain unchanged while assignments are upserted

#### Scenario: Clear the Teams mapping
- **WHEN** Teams mapping is cleared while Teams-only choices exist
- **THEN** incompatible choices reset to Update before Apply

### Requirement: Large Employee transfer remains bounded
Import SHALL analyze at most 20,000 records in one indexed pass, retain a 128 KiB representative
preview, store sparse overrides, and virtualize New, Duplicate, and Skipped columns. Mapping changes
MUST reuse source analysis and SHALL recompute typed candidates without rendering complete lists.

#### Scenario: Review 20,000 Employees
- **WHEN** a maximum-size valid Employee array is mapped
- **THEN** scrolling or changing one policy does not rescan or mount the complete input

#### Scenario: Review on a narrow viewport
- **WHEN** Employee Import renders at 390 px
- **THEN** preview, mapping, and review sections stack without horizontal overflow

## ADDED Requirements

### Requirement: Mapped Tag Import ignores color
Mapped Employee Import SHALL consume Tag label and optional date, resolve or create a neutral catalog
definition by normalized label, and SHALL NOT import or overwrite Tag colors.

#### Scenario: Import an existing colored Tag
- **WHEN** mapped input references the label of a colored Tag
- **THEN** the assignment uses the existing definition and its color remains unchanged
