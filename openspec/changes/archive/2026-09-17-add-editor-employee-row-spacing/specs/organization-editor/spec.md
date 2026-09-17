## ADDED Requirements

### Requirement: Unit people rows keep compact interior spacing

Every expanded Editor Unit SHALL place one four-logical-pixel vertical interval between adjacent
visible Employee or open-position rows. The first visible row SHALL remain flush with the existing
list start and the last visible row SHALL remain flush with the existing list end, so a row stack of
`n` items contains exactly `max(0, n - 1)` intervals. The interval MUST remain outside each row's
surface and MUST NOT change row content padding, ordering, selection, or persistent State.

DOM rendering, virtualization, Unit height, hierarchy placement, spatial hit testing, drag/drop,
row anchors, attachments, and full-View or Unit/subtree PNG SHALL consume the same gap-aware
tag-height layout.

#### Scenario: Render several Employees
- **WHEN** an expanded Unit shows three Employee rows
- **THEN** exactly two four-pixel intervals separate them with no added interval above the first or below the last row

#### Scenario: Mix Employees and an open position
- **WHEN** sorting places an open position between Employee rows
- **THEN** every adjacent pair has the same interval while the vacancy outline and all row surfaces retain their own bounds

#### Scenario: Render one visible row
- **WHEN** an expanded or collapsed Unit has exactly one visible row
- **THEN** the stack contributes no row interval and the row retains its existing height and list-edge position

#### Scenario: Preserve interactive geometry
- **WHEN** a row after the first is selected, dragged, used as a drop target, or attached to a canvas element
- **THEN** hit testing, preview, anchors, and committed geometry resolve against its gap-adjusted world position

#### Scenario: Export Unit rows
- **WHEN** full-View or scoped PNG includes a Unit with multiple variable-height rows
- **THEN** row content, surfaces, vacancy outlines, anchors, footer, Unit bounds, and hierarchy connections use the same intervals as the DOM
