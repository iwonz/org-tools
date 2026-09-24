## MODIFIED Requirements

### Requirement: Employee visual rows share exact vertical spacing
The list DOM, Editor DOM geometry, and Editor PNG renderer SHALL consume the same measured format
block and visual-row layout. Adjacent resolved format blocks MUST insert the configured integer
format gap exactly once. A boundary that continues a Tag or assignment collection inside one block
MUST insert exactly 6 pixels, while an ordinary text-wrap boundary inside a block MUST insert the
configured format gap. Total height MUST equal the sum of block heights plus the configured gap
multiplied by one fewer than the number of blocks, without outer spacing. Each block height MUST
include its measured child rows and native internal continuation gaps. Unit bounds, virtual heights,
hit testing, and connection anchors MUST use that same result without line-height inflation or
negative compensation.

#### Scenario: Render one block
- **WHEN** one Employee resolves to one format block and its line gap changes between 0, 4, and 24
- **THEN** the DOM and PNG outer block height, Unit bounds, and connection anchors do not change unless ordinary text inside the block wraps

#### Scenario: Render adjacent blocks
- **WHEN** ordinary Employee text, authored blank lines, Tags, or assignments create adjacent format blocks
- **THEN** DOM and PNG add the configured format gap exactly once between blocks and add none before the first or after the last

#### Scenario: Render wrapped text rows
- **WHEN** ordinary Employee text produces several visual rows inside one block
- **THEN** DOM and PNG add the configured format gap exactly once between adjacent text rows

#### Scenario: Render wrapped semantic rows
- **WHEN** Tags or assignments continue onto another visual row inside one semantic block
- **THEN** DOM and PNG add exactly 6 pixels at each semantic continuation boundary regardless of the configured format gap

#### Scenario: Preserve collapsed Unit geometry
- **WHEN** a Unit with multi-block Employee content is collapsed and expanded
- **THEN** its hidden and visible bounds, hit targets, and anchors derive from the same shared block and row measurements
