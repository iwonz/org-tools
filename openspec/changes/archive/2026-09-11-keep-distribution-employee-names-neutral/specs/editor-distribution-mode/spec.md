## MODIFIED Requirements

### Requirement: Distribution status reflects current direct membership
Every rendered Employee row in an enabled Unit SHALL use the View distributedColor tonal highlighting when that
Employee is a direct current member of another Unit in the same View and the View undistributedColor tonal highlighting
otherwise. Manual and resolved Live membership SHALL count; hierarchy containment alone MUST NOT.
Employee names SHALL retain the normal theme foreground for both statuses, including selected rows.
Status changes and custom distribution colors MUST NOT recolor name text.

#### Scenario: Employee is placed elsewhere
- **WHEN** an Employee in an enabled Unit is also present in another manual or Live Unit
- **THEN** the source row uses the distributed color and its accessible status reports the number of other Units

#### Scenario: Employee exists only in the source Unit
- **WHEN** an Employee in an enabled Unit has no other direct current membership
- **THEN** the source row uses the undistributed color and its accessible status identifies it as source-only

#### Scenario: Keep names neutral in either theme
- **WHEN** distribution status, selection, or custom status colors change in a light or dark theme
- **THEN** Employee names keep that theme's normal foreground while configured row fills, paths, and markers retain their status colors
