## ADDED Requirements

### Requirement: Editor geometry supports bounded distribution overlays
The Editor SHALL derive distribution row anchors from its existing deterministic Employee row
layout and SHALL cull connection paths against the visible world without adding overlay geometry to
Unit bounds, snapping, collision handling, or the Unit spatial index.

#### Scenario: Target row is virtualized
- **WHEN** a selected Employee's target row is outside the mounted virtual row range
- **THEN** its anchor is computed from cached row offsets without mounting or measuring that row

#### Scenario: Selection changes on a large View
- **WHEN** selection changes with 4,000 Units present
- **THEN** the Editor reads only the selected Employee's cached memberships and does not scan every Unit
