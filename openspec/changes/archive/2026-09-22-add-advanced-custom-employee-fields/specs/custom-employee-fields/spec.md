## ADDED Requirements

### Requirement: Option fields support fixed and extensible multiple values
An Option Value field SHALL persist explicit multiple-selection and custom-option settings. Multiple values SHALL be ordered unique option UUID arrays, and user-created options SHALL become normalized shared options of that field only after the complete Employee save succeeds. Custom options MUST be enabled only with multiple selection.

#### Scenario: Save multiple fixed options
- **WHEN** a user selects several configured options for one Employee and saves
- **THEN** the Employee stores one ordered duplicate-free option-ID array

#### Scenario: Create a shared option
- **WHEN** a user enters a new normalized label in an extensible multi-option field and the Employee save succeeds
- **THEN** one stable option is added to that field and becomes available to every Employee

#### Scenario: Reject an invalid mode combination
- **WHEN** a definition enables custom options without multiple selection
- **THEN** the definition is rejected without changing fields or Employees

### Requirement: Composite fields store repeated typed records
A Composite field SHALL define an ordered set of text, finite-number, boolean, canonical-date, or single-option subfields with stable UUIDs and per-subfield required settings. Exactly one subfield SHALL be the primary key, it SHALL be required, and its normalized populated value MUST be unique among that Employee's records. The Composite-level required switch SHALL require at least one record.

#### Scenario: Save valid repeated records
- **WHEN** an Employee supplies complete records with distinct primary values
- **THEN** their ordered typed values are stored under subfield UUIDs

#### Scenario: Reject a duplicate primary value
- **WHEN** two records for one Employee have equivalent normalized primary values
- **THEN** the Employee save fails atomically

#### Scenario: Require records and cells
- **WHEN** a required Composite has no records or a record lacks a required subfield
- **THEN** the Employee save fails atomically

### Requirement: Advanced field values participate in derived workflows
Multi-option fields SHALL filter by any selected resolved label. Composite fields SHALL filter by their primary-key display values. Unset filtering SHALL match empty arrays. Template output SHALL join multi-option labels and serialize Composite records deterministically, while structured JSON SHALL preserve native arrays, objects, booleans, numbers, strings, and null semantics with Option UUIDs resolved to labels.

#### Scenario: Filter a multi-option value
- **WHEN** a filter selects a label contained in any of an Employee's selected options
- **THEN** that Employee matches the field filter

#### Scenario: Filter a Composite value
- **WHEN** a filter selects one Composite primary-key value
- **THEN** every Employee with a matching record is included

#### Scenario: Export a Composite value
- **WHEN** a Composite field is enabled in structured JSON
- **THEN** its value is an ordered array of typed objects using subfield names and resolved Option labels

### Requirement: Field switches use accessible switch controls
Employee model boolean settings for Required, Multiple selection, and custom options SHALL render as keyboard-operable controls with switch semantics and localized accessible names.

#### Scenario: Toggle required behavior
- **WHEN** a keyboard user activates the Required switch
- **THEN** its checked state changes without submitting or closing the field editor
