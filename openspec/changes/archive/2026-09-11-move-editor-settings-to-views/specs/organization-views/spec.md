## ADDED Requirements

### Requirement: View settings are strict isolated document state
Each View structure SHALL own required settings containing boolean groupByTag and showTagCloud plus
non-null distributedColor and undistributedColor using the existing named or canonical six/eight-digit
HEX color contract. Defaults SHALL be true, true, green, and amber. Unit documents MUST NOT retain
groupByTag. Settings SHALL participate in complete state transfer, SQLite, live-tab synchronization,
and View-local undo/redo; runtime compatibility readers MUST NOT be added.

#### Scenario: Copy or create a View
- **WHEN** a View is copied or created blank
- **THEN** the copy receives independent source settings and a blank View receives the defaults

#### Scenario: Paste Units across Views
- **WHEN** Units are pasted into another View
- **THEN** their presentation follows target View settings without importing source preferences

#### Scenario: Reject obsolete or invalid state
- **WHEN** settings are missing, have extra keys or invalid values, or a Unit retains groupByTag
- **THEN** complete state validation rejects the value without mutation

#### Scenario: Synchronize settings
- **WHEN** a valid settings command is restored, imported, or received from a live peer
- **THEN** every affected Unit uses the current View settings and other Views remain independent


#### Scenario: Receive a newer peer during SQLite startup
- **WHEN** a live peer supplies newer settings before an outstanding SQLite load finishes
- **THEN** the older response cannot replace that state or reduce its logical stamp, and the next settings change synchronizes to both tabs
