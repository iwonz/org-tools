## ADDED Requirements

### Requirement: Employee identity is a deterministic full SHA-256 digest
Every global Employee SHALL have an ID equal to the 64-character lowercase hexadecimal SHA-256
digest of UTF-8 normalized first name, last name, and email joined by U+001F. Normalization SHALL use
Unicode NFKC, trim surrounding whitespace, collapse internal Unicode whitespace to one ASCII space,
and apply locale-independent lowercase. The system MUST reject two Employees with the same digest.

#### Scenario: Equivalent identity spelling
- **WHEN** two identity tuples differ only by Unicode compatibility form, case, or repeated whitespace
- **THEN** they produce the same ID and the second Employee is rejected without mutation

#### Scenario: Distinct identity
- **WHEN** any normalized first name, last name, or email value differs
- **THEN** the full SHA-256 Employee ID differs

### Requirement: Identity edits atomically re-key references
Editing an Employee identity field SHALL compute the new ID and atomically replace that ID in the
catalog, Unit membership, boss, position, Editor selection, and Download selection references.

#### Scenario: Successful identity edit
- **WHEN** an identity edit produces an unused valid digest
- **THEN** all references use the new ID and no reference to the former ID remains

#### Scenario: Conflicting identity edit
- **WHEN** an identity edit produces another Employee's ID
- **THEN** the edit and every reference change are rejected atomically

## MODIFIED Requirements

### Requirement: Employees use generic persisted fields
The system SHALL persist deterministic ID, Employee identity, contact, profile, embedded avatar,
birthday, normalized gender, and tags as unique label and optional-date records without
source-specific IDs, origins, or remote photo fields. Gender SHALL be exactly `male`, `female`, or
`unspecified` and SHALL NOT be inferred from another value.

#### Scenario: Employee persistence
- **WHEN** an Employee is created, edited, saved, and reopened
- **THEN** its deterministic `id`, `firstName`, `lastName`, `email`, `username`, `profileUrl`,
  `avatarBase64Url`, `phone`, `birthday`, `gender`, and normalized tags retain their values

#### Scenario: Invalid Employee identifier
- **WHEN** a record ID differs from the digest of its normalized identity fields
- **THEN** strict validation rejects the complete operation without changing organization state

#### Scenario: Invalid gender
- **WHEN** a strict Employee record contains a missing or unknown gender value
- **THEN** validation rejects the complete operation without changing organization state
