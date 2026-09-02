## MODIFIED Requirements

### Requirement: Employee transfer candidates remain local and transient
Employee Import files, parsed rows, mapping choices, duplicate indexes, and per-row policies SHALL
remain in the current tab only until Apply or close. They MUST NOT enter browser storage, logs,
URLs, BroadcastChannel before Apply, SQLite before Apply, or a network request. Global Export SHALL
write only the validated complete state to a user-initiated local download; no separate Employee
Export projection SHALL exist.

#### Scenario: Cancel large Import
- **WHEN** a user cancels a mapped 20,000-row Employee Import
- **THEN** the candidate is released and no organization, durable UI, local database, peer tab, or browser storage changes

#### Scenario: Direct State Export
- **WHEN** the user activates global Export
- **THEN** the validated complete state is written only to the user-initiated local download
