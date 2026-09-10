## ADDED Requirements

### Requirement: Grouping and Tag order use existing local persistence
Tag order changes and Unit grouping commands SHALL use the existing organization write and live-tab synchronization path once per logical mutation. Every runtime boundary SHALL validate the mandatory boolean groupByTag field. No legacy reader or automatic conversion SHALL be added.

#### Scenario: Restore preferences
- **WHEN** server state is reopened or a live peer receives a validated update
- **THEN** catalog order and each Unit grouping setting match the committed state

### Requirement: Current database grouping is converted once outside runtime
The authorized current local database conversion SHALL stop its writer, retain an ignored consistent backup, set groupByTag to true in every existing Unit, validate the full result with the production parser, and commit one transaction with one revision increment. It MUST preserve Tag order and unrelated data. Failure SHALL leave the original unchanged; an already-current database SHALL be a no-op. The conversion tool MUST NOT ship in runtime.

#### Scenario: Convert current database
- **WHEN** the recognized previous state converts and validates
- **THEN** every Unit has grouping enabled, one new revision is committed, and the backup remains available

#### Scenario: Fail conversion
- **WHEN** validation or writing fails
- **THEN** no partial conversion is committed
