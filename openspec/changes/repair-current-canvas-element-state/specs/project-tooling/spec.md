## ADDED Requirements

### Requirement: Strict State changes prepare the configured local database before publication
A repository change that replaces the exact State shape SHALL inspect the configured owned SQLite
snapshot before integration. If that snapshot uses the immediately previous valid shape, delivery
SHALL stop owned processes, retain an ignored timestamped database-family backup, run a guarded
offline conversion, validate the candidate and committed state with the production parser, and prove
normal startup. The converter and all database artifacts MUST remain outside Git. If no conversion is
applicable, the change SHALL record that the database is absent or already current.

#### Scenario: Deliver an additive required field
- **WHEN** a release makes a new field mandatory in every current View or record
- **THEN** its validation checklist includes the configured database readiness result and the local server starts on that database before merge and push

#### Scenario: Keep compatibility out of runtime
- **WHEN** the prior owned snapshot needs conversion
- **THEN** the one-time operation runs offline without weakening current State Import, SQLite startup, or live-peer validation

#### Scenario: Refuse an unsafe conversion
- **WHEN** the snapshot does not match the converter's exact expected source shape or preservation checks fail
- **THEN** delivery stops without publishing a claimed-successful change or mutating the authoritative state
