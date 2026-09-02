## ADDED Requirements

### Requirement: Both runtimes accept only the current birthday schema
Server and Pages state validation SHALL accept nullable Employee birthdays only in the current
canonical `DD.MM.YYYY` shape with the shared `1900` unknown-year semantics. Runtime code MUST NOT
include a state version, compatibility reader, or automatic conversion for obsolete birthday data.

#### Scenario: Open current birthday state
- **WHEN** SQLite, complete-state Import, or a live browser peer supplies only valid current birthdays
- **THEN** the state opens and follows normal automatic persistence or live-tab synchronization

#### Scenario: Open obsolete birthday state
- **WHEN** persisted or transferred state contains the former birthday representation
- **THEN** strict validation blocks it without rewriting, resetting, or partially installing the state
