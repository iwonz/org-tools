## ADDED Requirements

### Requirement: Editor Employee rows use formatted multiline geometry
The Editor SHALL render Employee information from the persisted Editor format and calculate each
row from its non-empty line count with the existing height as a minimum. DOM rows, virtual offsets,
hit testing, anchors, Unit bounds, and PNG layout MUST use the same deterministic line geometry.
Open-position rows and Unit Tag footers SHALL retain their existing presentation.

#### Scenario: Render a multiline Editor Employee
- **WHEN** an Editor format produces multiple non-empty lines
- **THEN** the row, containing Unit, anchors, hit targets, and connections expand to the shared calculated geometry

#### Scenario: Collapse a Unit with a formatted boss
- **WHEN** a Unit is collapsed and its boss format produces multiple lines
- **THEN** the visible boss row retains the same line content and calculated row bounds
