## ADDED Requirements

### Requirement: Current owned SQLite state is repaired for required canvas elements
The configured owned SQLite snapshot SHALL be repaired once outside runtime while the server is
stopped. The guarded operation SHALL accept only the exact prior View structure missing
`canvasElements`, add one empty array to every such View, preserve the complete organization and UI
payload otherwise, create an ignored timestamped database-family backup, validate with the production
parser before and after commit, and increment the singleton revision exactly once. Runtime parsing
MUST remain strict and MUST NOT add migration or compatibility behavior.

#### Scenario: Repair the diagnosed prior state
- **WHEN** every stored View has the exact prior structure shape and no `canvasElements` field
- **THEN** the offline operation adds an empty collection to every View and the configured server reopens the complete organization normally
- **AND** Employee, Unit, assignment, Tag, custom-field, timestamp, View, and UI fingerprints remain unchanged

#### Scenario: Preserve an already-current state
- **WHEN** every stored View already contains valid canvas elements
- **THEN** the operation performs no database write, revision change, or backup replacement

#### Scenario: Reject an unexpected or mixed state
- **WHEN** the database schema, singleton row, View structure, or candidate contains any other invalid or mixed shape
- **THEN** validation aborts before commit and the original database plus its retained backup remain available

#### Scenario: Roll back a failed commit
- **WHEN** backup, validation, transaction, or post-commit reopening fails
- **THEN** no partial converted state becomes authoritative and the complete original family can be restored locally
