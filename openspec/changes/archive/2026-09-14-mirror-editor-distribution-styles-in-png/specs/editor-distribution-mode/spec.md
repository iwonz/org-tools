## MODIFIED Requirements

### Requirement: Distribution visualization is excluded from reports
Editor PNG preview, copy, and save output SHALL include the persistent distributed or source-only
tonal Employee row fill for each exported Unit with distribution mode enabled. Status SHALL use the
active View's configured colors and complete direct current manual or resolved Live membership,
including other placements outside the selected Unit-only or subtree export scope. Employee names
SHALL retain the neutral light export foreground. PNG output MUST NOT include the distribution
switch, accessible status text, selection, placement paths, endpoint markers, placement maps, or
other transient Editor interaction. JSON, Template, and Employee outputs MUST NOT include
distribution-mode state, colors, markers, lines, or status.

#### Scenario: Export persistent row status to PNG
- **WHEN** the user previews, copies, or saves Editor PNG with distribution mode enabled for an exported Unit
- **THEN** distributed and source-only Employee rows use the active View's corresponding light tonal fills while names remain neutral

#### Scenario: Resolve status outside image scope
- **WHEN** a Unit-only or subtree PNG contains an Employee whose other direct placement is outside the selected export scope
- **THEN** the exported source row remains distributed because status is resolved from the complete active View

#### Scenario: Exclude transient distribution interaction
- **WHEN** the user exports PNG while an Employee is selected and placement paths or endpoint markers are visible
- **THEN** the PNG contains persistent row tones and ordinary hierarchy connections without selection, placement paths, or endpoint markers

#### Scenario: Export non-image output
- **WHEN** the user exports Editor JSON or Template output or Employee output while distribution mode is enabled
- **THEN** output matches the mode-disabled structural content and contains no distribution visualization or state
