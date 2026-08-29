## MODIFIED Requirements

### Requirement: Employees use generic persisted fields
The system SHALL persist Employee identity, contact, profile, embedded avatar, birthday, normalized
gender, and tags as unique label and optional-date records without source-specific IDs, origins, or
remote photo fields. Gender SHALL be exactly `male`, `female`, or `unspecified` and
SHALL NOT be inferred from any other Employee value.

#### Scenario: Employee persistence
- **WHEN** an Employee is created, edited, saved, and reopened
- **THEN** `firstName`, `lastName`, `email`, `username`, `profileUrl`, `avatarBase64Url`, `phone`,
  `birthday`, `gender`, and normalized tag labels and dates retain their values

#### Scenario: Invalid gender
- **WHEN** a strict Employee record contains a missing or unknown gender value
- **THEN** validation rejects the complete operation without changing organization state
