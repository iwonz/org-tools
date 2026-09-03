## MODIFIED Requirements

### Requirement: Employees use generic persisted fields
The system SHALL persist a stable UUID, Employee identity, contact, profile, embedded avatar,
birthday, normalized gender, Tag assignments by catalog UUID, and typed custom values without
source-specific origins or remote photo fields. Gender SHALL be exactly `male`, `female`, or
`unspecified` and SHALL NOT be inferred from another value.

#### Scenario: Employee persistence
- **WHEN** an Employee is created, edited, saved, and reopened
- **THEN** its UUID, standard fields, Tag assignments, and custom values retain their values

#### Scenario: Invalid Employee identifier
- **WHEN** a strict Employee record contains a missing or non-canonical UUID
- **THEN** strict validation rejects the complete operation without changing organization state

#### Scenario: Invalid gender
- **WHEN** a strict Employee record contains a missing or unknown gender value
- **THEN** validation rejects the complete operation without changing organization state

## ADDED Requirements

### Requirement: Employee identity uses a stable UUID and a separate duplicate key
Every newly created Employee SHALL receive UUID v4. Imported new Employees SHALL retain a canonical
UUID. Duplicate detection SHALL use normalized first name, last name, and email with Unicode NFKC,
trimmed and collapsed whitespace, and locale-independent case-folding. Editing identity fields MUST
NOT change the UUID or relationship references.

#### Scenario: Edit Employee identity
- **WHEN** an identity edit has no normalized duplicate
- **THEN** the existing UUID and every Unit and UI reference remain unchanged

#### Scenario: Reject duplicate identity
- **WHEN** a create or edit matches another normalized identity tuple
- **THEN** the mutation is rejected atomically even though the UUID differs

### Requirement: Employee filters use complete ordered criteria
Every shared Employee filter, including Live Unit rules, SHALL render Unit, Tag, position, gender,
complete birthday, then custom fields. Birthday SHALL include day, month, and year and SHALL match
the exact canonical value, including `1900` for unknown year.

#### Scenario: Filter an exact birthday
- **WHEN** day, month, and year are selected
- **THEN** only Employees with that complete canonical birthday match

#### Scenario: Persist a Live Unit custom filter
- **WHEN** a Live Unit rule contains gender, complete birthday, or custom field selections
- **THEN** the strict state retains those selections and derived membership uses them

## REMOVED Requirements

### Requirement: Employee identity is a deterministic full SHA-256 digest
**Reason**: Employee relationships need a stable UUID that does not change with editable identity.
**Migration**: Current local records receive UUIDs once during delivery; old public states are rejected.

### Requirement: Identity edits atomically re-key references
**Reason**: Identity edits no longer change the stable Employee UUID.
**Migration**: Duplicate identity validation replaces reference re-keying.
