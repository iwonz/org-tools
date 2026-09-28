## ADDED Requirements

### Requirement: Views isolate Staffing Slots with their Unit documents

Each View SHALL own the Staffing Slots inside its Units. Slot creation, editing, movement, deletion, selection, Tags, and counts MUST NOT change another View or the global Units projection. Copying a View or Unit closure SHALL create new slot UUIDs and remap copied slot selections and internal canvas anchors.

#### Scenario: Edit a custom-View slot
- **WHEN** a Staffing Slot changes inside a custom View
- **THEN** the system View, Units section, global Employees, and every other custom View remain unchanged

#### Scenario: Copy a Unit with slots
- **WHEN** a Unit closure containing slots and attached canvas elements is copied within or across Views
- **THEN** the pasted closure receives new Unit and slot UUIDs with matching internal anchors and one target-View history command

## REMOVED Requirements

### Requirement: View operations preserve local open positions
**Reason**: Replaced by View-local Staffing Slots.
**Migration**: Existing Slot names, Tags, and anchors are retained while IDs are regenerated only for copied content.
