## MODIFIED Requirements

### Requirement: Editor commands retain readable interaction feedback
Editor toolbar controls, command actions, and Unit cards SHALL use an opaque tonal hover surface
with readable foreground contrast and SHALL NOT fade the command or Unit into the canvas.

#### Scenario: Hover an Editor command
- **WHEN** a pointer hovers an available Editor toolbar or command action in either theme
- **THEN** its label and icon remain fully legible on an opaque accent surface without changing
  control geometry

#### Scenario: Hover an Editor Unit
- **WHEN** a pointer hovers an unselected Unit card in either theme
- **THEN** the complete card remains opaque and readable on the accent surface without changing its
  dimensions, position, or selection
