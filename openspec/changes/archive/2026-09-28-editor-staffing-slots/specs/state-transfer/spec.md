## ADDED Requirements

### Requirement: Current State persists exact Staffing Slot data

Every Unit in the current exact State contract SHALL contain `staffingSlots`. Each entry MUST have exactly a UUID `id`, nullable normalized `name`, and unique current Tag assignments with canonical optional dates. Slot IDs MUST be unique inside the View, referenced Tags MUST exist, and Staffing Slot selections or anchors MUST resolve to the named containing Unit. Manual and Live Units MAY contain slots. The parser MUST reject previous, mixed, missing, extra, invalid, duplicate, or dangling shapes atomically without a version marker or compatibility reader.

#### Scenario: Import current Staffing Slots
- **WHEN** complete State contains valid named and unnamed slots in manual or Live Units with Tags, selections, and anchors
- **THEN** Import accepts and round-trips the exact current data

#### Scenario: Reject preceding open-position State
- **WHEN** complete State contains `openPositions`, an open-position discriminant, or a background/title record
- **THEN** strict parsing rejects it without partially replacing current data

### Requirement: Employee-oriented projections exclude Staffing Slots

Staffing Slots SHALL remain present only in complete State Export and Editor PNG. Units, Employee transfer, JSON, Template, Calendar, filters, search, distribution, and Tag-cloud projections MUST operate only on global Employees and MUST NOT serialize, count, or emit slots.

#### Scenario: Export Employees from a View with slots
- **WHEN** a source View contains Staffing Slots and a user exports Employee JSON or Template data
- **THEN** output is identical to the same Employee assignments without those slots

## REMOVED Requirements

### Requirement: Current State persists exact open-position data
**Reason**: The exact State now persists Staffing Slots.
**Migration**: The owned previous SQLite row is converted once outside runtime.

### Requirement: Employee-oriented exports exclude open positions
**Reason**: The exclusion now applies to Staffing Slots.
**Migration**: Employee-oriented output remains unchanged.
