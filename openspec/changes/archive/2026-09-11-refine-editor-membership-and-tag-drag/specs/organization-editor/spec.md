## ADDED Requirements

### Requirement: Layout directions are independently selectable
The Editor SHALL preserve the compact two-icon layout control while providing separate accessible pressed buttons for top-down and left-to-right direction. Selecting a different direction SHALL invoke the existing undoable arrangement command once. Selecting the active direction MUST NOT change state or geometry. The separate Arrange command SHALL remain available.

#### Scenario: Select one direction explicitly
- **WHEN** a user clicks or keyboard-activates a direction button
- **THEN** that direction becomes active and repeated activation is a no-op

#### Scenario: Undo a direction change
- **WHEN** the user changes direction and then performs Undo
- **THEN** the previous direction and Unit geometry are restored together

### Requirement: Every hierarchy count is a unique subtree total
The total for each Unit SHALL be the number of distinct Employee IDs in its own direct membership and all descendants. An Employee present in an ancestor MUST remain included in this Unit's count. Bosses SHALL follow the same ID deduplication rule. Manual and resolved Live membership SHALL count. Direct totals SHALL count distinct own IDs. Canvas, PNG, Units, selection trees, and export source trees SHALL follow this rule independently of collapse, search, Tag grouping, or distribution mode.

#### Scenario: Count repeated memberships at every level
- **WHEN** root contains E1, child contains E1 and E2, and grandchild contains E1 and E3
- **THEN** root and child totals are three and grandchild total is two, regardless of boss roles

#### Scenario: Count sibling overlap
- **WHEN** the same Employee is assigned to multiple descendants or Live Units
- **THEN** each Unit includes that Employee once in its own subtree and PNG matches the canvas calculation
