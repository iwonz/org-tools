## MODIFIED Requirements

### Requirement: Distribution status reflects current direct membership
Every rendered Employee row in an enabled Unit SHALL use the View distributedColor tonal highlighting when that
Employee is a direct current member of another Unit in the same View and the View undistributedColor tonal highlighting
otherwise. Manual and resolved Live membership SHALL count; hierarchy containment alone MUST NOT.

#### Scenario: Employee is placed elsewhere
- **WHEN** an Employee in an enabled Unit is also present in another manual or Live Unit
- **THEN** the source row uses the distributed color and its accessible status reports the number of other Units

#### Scenario: Employee exists only in the source Unit
- **WHEN** an Employee in an enabled Unit has no other direct current membership
- **THEN** the source row uses the undistributed color and its accessible status identifies it as source-only

### Requirement: One selected Employee reveals placement connections
The Editor SHALL draw pointer-inert connections using the View distributedColor foreground only when selection contains exactly one
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

## ADDED Requirements

### Requirement: View distribution colors use the shared local picker
View settings SHALL offer Distributed and Not distributed color fields using the existing presets,
full palette, and exact input without a No color choice. Rows SHALL use readable themed tonal fills;
distribution connections and endpoint markers SHALL use the distributed foreground. Palette drafts
MUST remain transient and each completed valid color choice SHALL create one undoable command.

#### Scenario: Select colors
- **WHEN** a valid named or custom color is selected in either theme
- **THEN** the View's rows and applicable paths/markers update without changing membership or report content

#### Scenario: Cancel or enter invalid color
- **WHEN** a gesture is canceled or exact input is invalid
- **THEN** no settings command is committed and the previous persisted color remains intact
