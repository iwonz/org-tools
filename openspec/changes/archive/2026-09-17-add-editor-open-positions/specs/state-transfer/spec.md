## ADDED Requirements

### Requirement: Current State persists exact open-position data

Every Unit in the current exact State contract SHALL contain `openPositions`. Each entry MUST have
exactly a UUID `id`, normalized non-empty `title`, and unique current Tag assignments with canonical
optional dates. IDs MUST be unique inside the View, referenced Tags MUST exist, Live Units MUST have
an empty array, and open-position selection or anchors MUST resolve to the named containing Unit.
The parser MUST reject previous, mixed, missing, extra, or dangling shapes atomically without a
version marker, migration, or compatibility reader.

#### Scenario: Import current open positions
- **WHEN** complete State contains valid manual-Unit open positions, Tags, selection, and anchors
- **THEN** Import accepts the complete State and round-trips the exact current data

#### Scenario: Reject invalid open-position State
- **WHEN** a position has an invalid or duplicate ID, blank title, duplicate or missing Tag,
  non-canonical date, Live owner, dangling selection, or dangling anchor
- **THEN** the complete State is rejected without partially replacing current data

#### Scenario: Reject the preceding Unit shape
- **WHEN** complete State contains a Unit without required `openPositions`
- **THEN** strict parsing rejects it without runtime conversion

### Requirement: Employee-oriented exports exclude open positions

Open positions SHALL remain present only in complete State Export and Editor PNG. Employee transfer,
JSON, Template, Units, Analytics, and Calendar projections MUST continue to operate only on global
Employees and MUST NOT serialize, count, search, or emit open positions.

#### Scenario: Export data from a View with positions
- **WHEN** a source View contains open positions and a user exports Employees, JSON, or Template data
- **THEN** output is identical to the same Employee assignments without those positions
