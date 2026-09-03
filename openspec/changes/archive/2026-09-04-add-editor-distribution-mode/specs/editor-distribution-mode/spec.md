## ADDED Requirements

### Requirement: Units expose an independent distribution mode
The Editor SHALL allow distribution mode to be enabled independently for multiple Units in the
active View through a single-Unit context-menu switch. The mode SHALL remain View-local UI state
and MUST NOT change the Unit document, timestamps, history, selection, or geometry.

#### Scenario: Toggle one Unit
- **WHEN** the user activates Distribution mode from one Unit's context menu
- **THEN** the menu closes, the switch state persists for that Unit, and no structural command is created

#### Scenario: Enable multiple Units
- **WHEN** distribution mode is enabled on more than one Unit in the same View
- **THEN** each enabled Unit retains independent highlighting

### Requirement: Distribution status reflects current direct membership
Every rendered Employee row in an enabled Unit SHALL use green tonal highlighting when that
Employee is a direct current member of another Unit in the same View and amber tonal highlighting
otherwise. Manual and resolved Live membership SHALL count; hierarchy containment alone MUST NOT.

#### Scenario: Employee is placed elsewhere
- **WHEN** an Employee in an enabled Unit is also present in another manual or Live Unit
- **THEN** the source row is green and its accessible status reports the number of other Units

#### Scenario: Employee exists only in the source Unit
- **WHEN** an Employee in an enabled Unit has no other direct current membership
- **THEN** the source row is amber and its accessible status identifies it as source-only

### Requirement: One selected Employee reveals placement connections
The Editor SHALL draw pointer-inert green connections only when selection contains exactly one
Employee occurrence whose source Unit has distribution mode enabled. Each path SHALL connect that
row to one other current placement without changing selection, layout, spatial indexes, or output.

#### Scenario: Connect expanded placements
- **WHEN** the selected Employee is visible in another expanded Unit
- **THEN** a deterministic curve connects the opposing edges of the exact source and target rows

#### Scenario: Connect a hidden collapsed placement
- **WHEN** the selected Employee belongs to a collapsed Unit where its row is hidden
- **THEN** the curve terminates at the nearest Unit edge with a compact endpoint marker

#### Scenario: Select multiple items
- **WHEN** selection contains two or more items
- **THEN** all distribution connections are hidden while enabled-Unit row highlighting remains

### Requirement: Distribution visualization is excluded from reports
Distribution mode SHALL remain an Editor-only visualization. PNG, JSON, Template, and Employee
outputs MUST NOT include its switch, colors, markers, lines, or state.

#### Scenario: Export while distribution mode is visible
- **WHEN** the user exports Editor or Employee output with distribution mode enabled
- **THEN** output matches the mode-disabled structural content and contains no distribution overlay
