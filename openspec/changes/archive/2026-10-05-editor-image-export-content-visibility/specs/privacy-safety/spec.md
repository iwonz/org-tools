## ADDED Requirements

### Requirement: Image visibility preferences remain local account metadata
PNG Tag exclusions and Staffing Slot visibility SHALL be stored only in the authenticated account's
PostgreSQL UI state and encrypted Backup payload. They MUST NOT modify organization data, be sent to
third parties, enter browser persistence, or be included in another account's UI response. Stored
Tag preferences SHALL contain IDs only, without copied labels or hidden field values.

#### Scenario: Persist an image preference
- **WHEN** an authenticated account changes an image visibility control
- **THEN** the existing same-origin UI endpoint stores only that account's normalized IDs and boolean
- **AND** no organization revision, remote request, or telemetry event is created
