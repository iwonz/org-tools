## ADDED Requirements

### Requirement: Tag color is expressed through restrained surface fill
Colored Tag chips and Tag-like controls SHALL use one low-chroma tonal fill and matching readable
foreground without decorative leading dots, added borders, shadows, or geometry changes. Neutral
Tags SHALL retain a neutral fill, and hover, focus, active, and selected feedback SHALL not erase the
configured Tag identity.

#### Scenario: Interact with a colored Tag surface
- **WHEN** a colored Tag surface is hovered, focused, activated, or selected in either theme
- **THEN** its configured fill remains recognizable and its text remains readable without a color dot
