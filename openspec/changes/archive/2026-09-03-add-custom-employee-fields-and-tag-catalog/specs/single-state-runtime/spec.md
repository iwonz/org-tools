## MODIFIED Requirements

### Requirement: One strict current state contains organization data and durable UI
The strict unversioned state SHALL contain Employees with UUIDs and custom values, one Unit
structure, UUID-keyed custom field definitions, a UUID-keyed Tag catalog, and bounded durable UI
including complete birthday and custom filters. It SHALL NOT accept deterministic Employee digests,
inline Tag labels, obsolete Calendar cloud state, missing definition references, unknown keys, or
old custom/output shapes.

#### Scenario: Open the current state
- **WHEN** either runtime receives a fully valid current state
- **THEN** organization and UI hydrate atomically and all definition references resolve

#### Scenario: Reject an obsolete state
- **WHEN** persisted or imported data uses the former Employee ID, inline Tag, filter, or Calendar shape
- **THEN** strict parsing fails without compatibility conversion or partial replacement

## ADDED Requirements

### Requirement: Current local state is rewritten once outside runtime
Delivery SHALL stop the server, preserve a timestamped ignored database-family backup, transform all
Employee and Tag references, validate the exact new state, and update the singleton row in one
transaction with one revision increment. No transformation code SHALL remain on the runtime path.

#### Scenario: Rewrite succeeds
- **WHEN** the current local state transforms and validates
- **THEN** Employee and Unit counts and timestamps remain stable while IDs and references use the new shape

#### Scenario: Rewrite fails
- **WHEN** conversion, validation, or SQLite commit fails
- **THEN** the original transaction remains intact and the backup remains available for restoration
