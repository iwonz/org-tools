## ADDED Requirements

### Requirement: PNG content preferences cannot widen the selected subject projection
The Tag selector SHALL contain only Tag definitions present in the currently selected Editor image
export source. The acting account's persisted exclusions MAY further reduce that source but MUST NOT
restore, name, count, or otherwise reveal a Tag, Employee, Unit, Staffing Slot, field, or canvas
attachment absent from the selected subject's authorized projection. No additional permission is
required to reduce image content.

#### Scenario: Export as a restricted account
- **WHEN** a Super Administrator selects an account that cannot read one or more Tags
- **THEN** those Tags are absent from selector options, counts, Preview, Copy, and Save
- **AND** the administrator's session and organization projection remain unchanged

#### Scenario: Project persisted preferences
- **WHEN** persisted exclusions contain a Tag that is no longer readable or no longer exists
- **THEN** the account UI response omits that ID without exposing its label or existence
