## ADDED Requirements

### Requirement: Editor PNG cards follow the live canvas geometry
The Org Editor PNG renderer SHALL derive Unit width, header height, vertical padding, Employee row
height, avatar placement, text-column origin, compact tag packing, and hierarchy connection anchors
from the maintained live Editor geometry. The default exported card SHALL preserve the live canvas's
stable visual hierarchy for Unit identity, summary, conditional Live membership, Employee names and tags, and
boss indication without including transient editing controls. Image-specific title, background,
font, scope, radius, Employee format, and boss-label controls SHALL remain available, and rendering
MUST remain local and bounded.

#### Scenario: Export one Unit with a roster
- **WHEN** a Unit with ordinary and boss Employees is exported with default image settings
- **THEN** the Unit header, icon, summary, conditional Live badge, avatar centers, name column, compact tags, and boss indicator align with the corresponding live Editor card geometry
- **AND** every Employee row begins from the same horizontal and vertical layout rhythm

#### Scenario: Export wrapped Employee tags
- **WHEN** Employee tags wrap across one or more lines in the live Editor geometry
- **THEN** the PNG uses the same tag width estimator, row count, compact chip dimensions, and row-height growth
- **AND** no avatar, name, tag, following Employee, or Unit boundary overlaps or shifts independently

#### Scenario: Export a Unit hierarchy
- **WHEN** a subtree containing Units with different roster heights is exported
- **THEN** every connection terminates at the actual exported card boundary derived from its rendered rows
- **AND** Unit coordinates and relative hierarchy placement remain unchanged

#### Scenario: Preserve image customization
- **WHEN** the user changes title, background, font, scope, radius, Employee format, or boss label
- **THEN** the renderer applies those settings without changing shared structural alignment or adding transient Editor chrome

#### Scenario: Keep image generation local and bounded
- **WHEN** a PNG preview, copy, or download is generated
- **THEN** embedded avatars and local vector primitives are painted without an external request
- **AND** existing avatar-count and canvas-pixel limits remain enforced
