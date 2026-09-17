## ADDED Requirements

### Requirement: Open-position rows have a distinct vacancy outline

Every visible open-position row SHALL have a persistent one-pixel dashed outline around its complete
Employee-row bounds with the existing row radius, no additional fill, and the existing placeholder
avatar. The outline MUST NOT change measured height, content width, sorting, virtualization, hit
testing, selection, drop handling, or anchor geometry. Ordinary Employee rows MUST NOT receive the
vacancy outline.

#### Scenario: Render a resting vacancy
- **WHEN** an expanded manual Unit contains an open position
- **THEN** its complete row, including any wrapped Tag area, has the neutral dashed outline while
  neighboring Employee rows retain their ordinary presentation

#### Scenario: Interact with a vacancy
- **WHEN** an open position is hovered, focused, selected, or targeted by a single-Employee drop
- **THEN** the dashed outline remains visible with semantic contrast while existing fill, focus ring,
  and drop ring behavior remains intact

#### Scenario: Preserve row geometry
- **WHEN** the vacancy outline renders or changes interaction color
- **THEN** the row bounds, text and Tag layout, pointer target, side anchors, Unit bounds, and attached
  canvas geometry remain unchanged

#### Scenario: Export a vacancy
- **WHEN** full-View or Unit/subtree Image export includes an open position
- **THEN** PNG paints the same unfilled one-logical-pixel dashed outline over the complete shared row
  bounds and excludes transient hover, focus, selection, and drop styling
