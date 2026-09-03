## ADDED Requirements

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
