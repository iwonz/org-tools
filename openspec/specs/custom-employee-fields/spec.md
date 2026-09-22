# custom-employee-fields Specification

## Purpose
Define typed stored and computed Employee fields, safe token dependencies, and their shared filter and output behavior.

## Requirements

### Requirement: Employee fields support stored and computed values
The system SHALL persist UUID-keyed custom Employee field definitions as either stored Value fields
or computed Template fields. Value fields SHALL support text, finite number, boolean, canonical
`DD.MM.YYYY` date, and UUID-keyed option values. Template fields SHALL support no hash, MD5, or
SHA-256 over the rendered UTF-8 value with lowercase hexadecimal output.

#### Scenario: Save a typed value
- **WHEN** a user saves a valid custom Value field on an Employee
- **THEN** the typed value is stored under the definition UUID and retains its JSON type

#### Scenario: Render a hashed template
- **WHEN** a Template field with SHA-256 references built-in and custom tokens
- **THEN** the dependency-ordered rendered UTF-8 value is returned as a lowercase full digest

### Requirement: Custom field keys and dependencies are safe
Every custom field SHALL have a unique normalized display name and mandatory ASCII token key. Keys
MUST be unique case-insensitively across built-in and custom tokens. Template dependencies SHALL be
acyclic, and key changes SHALL atomically rewrite parsed references in persisted and active formats.

#### Scenario: Reject a cyclic template
- **WHEN** a typed format directly or indirectly references its own field
- **THEN** saving is blocked and cyclic candidates are absent from token suggestions

#### Scenario: Rename a referenced key
- **WHEN** a valid custom key changes
- **THEN** every parsed dependent token reference changes atomically without rewriting literal text

### Requirement: Field lifecycle preserves explicit intent
Changing a field kind or Value type SHALL require confirmation and atomically clear incompatible
values, options, filters, and output selections. Deleting a field SHALL be blocked while another
template or saved format references it; otherwise deletion SHALL remove every Employee value and UI
reference. Required Value fields SHALL be enforced when an individual Employee is saved.

#### Scenario: Edit an older incomplete Employee
- **WHEN** a required Value field exists but the edited Employee has no value
- **THEN** the Employee form cannot save until that field is completed

#### Scenario: Delete a referenced field
- **WHEN** another format references the selected field key
- **THEN** deletion is blocked with the referencing formats identified

### Requirement: Custom fields participate in filters and output
Every custom field SHALL appear after built-in filters in a searchable virtualized multi-select and
as a selectable token and sortable JSON field in Data Download and Editor export. Filtering SHALL
OR selected values within one field and AND across fields, including a distinct unset choice.

#### Scenario: Filter a computed field
- **WHEN** a user selects values from a Template field filter
- **THEN** Employees are matched against the cached computed output without recomputing on render

#### Scenario: Export typed custom fields
- **WHEN** custom fields are selected for JSON output
- **THEN** Value fields retain their JSON type, options emit labels, unset values emit null, and
  Template fields emit rendered text or the configured digest

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

### Requirement: Card formats participate in custom-field dependencies
All four persisted Employee display formats SHALL expose valid custom field keys. Renaming a custom
field key MUST rewrite parsed references in every display format atomically, and deletion MUST be
rejected while any display format references that field.

#### Scenario: Rename a displayed custom field
- **WHEN** a custom field key referenced by card formats is renamed
- **THEN** all matching parsed format tokens use the new key without changing literal text

#### Scenario: Reject deletion of a displayed field
- **WHEN** any saved card format references a custom field
- **THEN** deleting that field fails without changing definitions, values, or formats
