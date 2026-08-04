## MODIFIED Requirements

### Requirement: Employees use generic persisted fields
The system SHALL persist Employee identity, contact, profile, embedded avatar, birthday, and tags as unique label and optional-date records without source-specific IDs, origins, remote photo fields, or gender.

#### Scenario: Employee persistence
- **WHEN** an Employee is created, edited, saved, and reopened
- **THEN** `firstName`, `lastName`, `email`, `username`, `profileUrl`, `avatarBase64Url`, `phone`, `birthday`, and normalized tag labels and dates retain their values
