## MODIFIED Requirements

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
- **WHEN** mapping configures a new valid Value definition for a source path
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
