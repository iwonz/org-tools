## ADDED Requirements

### Requirement: Custom field computation remains local
Custom field computation SHALL keep custom values, template dependencies, distinct filter values,
MD5/SHA-256 hashing, Import mapping, and output generation only in browser memory or the loopback
same-origin runtime. It SHALL NOT add remote requests, telemetry, or browser snapshot storage.

#### Scenario: Compute a custom digest
- **WHEN** a user previews, copies, or downloads a hashed custom field
- **THEN** the clear value and digest remain within the current local runtime

### Requirement: Employee Import definitions remain transient until Apply
Staged field definitions, representative input, review groups, and per-row decisions SHALL remain
transient and SHALL be released on cancel or dialog close.

#### Scenario: Cancel staged schema Import
- **WHEN** a user stages a Value definition and closes Import
- **THEN** no organization, SQLite, browser storage, or other tab receives it
