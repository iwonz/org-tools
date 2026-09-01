## MODIFIED Requirements

### Requirement: Editor commands retain readable interaction feedback
Editor toolbar controls and command actions SHALL use an opaque tonal hover surface with readable
foreground contrast and SHALL NOT fade into the canvas. An unselected Unit card SHALL preserve its
exact resting background color and opacity during passive pointer hover.

#### Scenario: Hover an Editor command
- **WHEN** a pointer hovers an available Editor toolbar or command action in either theme
- **THEN** its label and icon remain fully legible on an opaque accent surface without changing
  control geometry

#### Scenario: Hover an Editor Unit
- **WHEN** a pointer hovers an unselected Unit card in either theme
- **THEN** the complete card keeps its exact resting background color and opacity without changing
  its dimensions, position, or selection
