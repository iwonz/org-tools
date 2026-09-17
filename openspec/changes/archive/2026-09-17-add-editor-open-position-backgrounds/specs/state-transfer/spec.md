## MODIFIED Requirements

### Requirement: Current State persists exact open-position data

Every Unit in the current exact State contract SHALL contain `openPositions`. Each entry MUST have
exactly a nullable validated `backgroundColor`, UUID `id`, normalized non-empty `title`, and unique
current Tag assignments with canonical optional dates. IDs MUST be unique inside the View,
referenced Tags MUST exist, Live Units MUST have an empty array, and open-position selection or
anchors MUST resolve to the named containing Unit. The parser MUST reject previous, mixed, missing,
extra, invalid-color, or dangling shapes atomically without a version marker, migration, or
compatibility reader.

#### Scenario: Import current open positions
- **WHEN** complete State contains valid transparent or colored manual-Unit open positions, Tags,
  selection, and anchors
- **THEN** Import accepts the complete State and round-trips the exact current data

#### Scenario: Reject invalid open-position State
- **WHEN** a position has a missing or invalid background color, invalid or duplicate ID, blank
  title, duplicate or missing Tag, non-canonical date, Live owner, dangling selection, or dangling
  anchor
- **THEN** the complete State is rejected without partially replacing current data

#### Scenario: Reject the preceding open-position shape
- **WHEN** complete State contains an open position without required `backgroundColor`
- **THEN** strict parsing rejects it without runtime conversion
