## ADDED Requirements

### Requirement: Employee display formats are one organization change
Saving Employee display formats SHALL update one organization object, enqueue one server-mode
SQLite organization snapshot, and publish one browser-mode live-tab organization update. Reading
cards or previews MUST NOT create persistence or synchronization work.

#### Scenario: Save four formats
- **WHEN** a user saves a changed Display draft
- **THEN** the four formats persist and synchronize as one logical organization mutation
