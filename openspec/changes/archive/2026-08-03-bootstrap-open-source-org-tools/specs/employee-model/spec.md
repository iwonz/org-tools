## ADDED Requirements

### Requirement: Employees use generic persisted fields
The system SHALL persist Employee identity, contact, profile, embedded avatar, birthday, and tags without source-specific IDs, origins, remote photo fields, or gender.

#### Scenario: Employee persistence
- **WHEN** an Employee is created, edited, saved, and reopened
- **THEN** `firstName`, `lastName`, `email`, `username`, `profileUrl`, `avatarBase64Url`, `phone`, `birthday`, and `tags` retain their normalized values

### Requirement: Roles remain Unit-scoped
The system SHALL store position and boss status on Employee-to-Unit assignments rather than on the Employee card.

#### Scenario: Multiple positions
- **WHEN** one Employee is assigned to multiple Units
- **THEN** each assignment can retain an independent position and boss status

### Requirement: Profile and avatar values are safe
The system SHALL allow only HTTP(S) profile links and bounded PNG, JPEG, or WebP data URLs for avatars.

#### Scenario: Unsafe values
- **WHEN** imported or opened data contains an executable profile scheme or unsupported avatar data URL
- **THEN** validation rejects the affected operation without rendering or requesting the value
