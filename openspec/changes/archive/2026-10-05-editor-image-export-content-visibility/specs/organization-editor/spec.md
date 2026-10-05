## ADDED Requirements

### Requirement: Editor PNG planning derives geometry from visible export content
The shared Editor PNG renderer SHALL apply image-only Tag and Staffing Slot visibility before row,
summary, footer, attachment, hierarchy, and image-bound calculations. Full-View and Unit/subtree
exports MUST use the same filtered planning model and MUST preserve the existing authorized source,
row grouping order, density, typography, and visual styling for retained content.

#### Scenario: Filter a Slot-only Unit
- **WHEN** an expanded Unit contains only Staffing Slots and image export suppresses Slots
- **THEN** the Unit uses the existing expanded-empty geometry without transient empty-state chrome
- **AND** DOM state and the persistent View document remain unchanged

#### Scenario: Filter a wrapped Tag surface
- **WHEN** removing a Tag reduces the number of wrapped visual rows
- **THEN** Employee/Slot row geometry, Unit bounds, connections, and Canvas anchors consume the reduced image-only height
