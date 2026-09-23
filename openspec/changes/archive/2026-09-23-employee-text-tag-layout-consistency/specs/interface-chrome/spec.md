## MODIFIED Requirements

### Requirement: Tag color is expressed through restrained surface fill
Colored Tag chips and Tag-like controls SHALL use one low-chroma tonal fill and matching readable
foreground without decorative leading dots, added borders, or shadows. Neutral Tags SHALL retain a
neutral fill. Every Tag-like surface MUST use an 11 pixel font, 16 pixel line height, 8 pixel inline
padding, 2 pixel block padding, 6 pixel radius, and 6 pixel horizontal and vertical collection gaps.
A long logical Tag MUST render content-sized cloned decoration around each actual-font-measured
wrapped fragment. Hover, focus, active, and selected feedback SHALL not erase configured Tag identity
or change fragment geometry.

#### Scenario: Interact with a colored Tag surface
- **WHEN** a colored one-line or wrapped Tag surface is hovered, focused, activated, or selected in either theme
- **THEN** its configured fill remains recognizable, text remains readable, and the universal decoration geometry remains stable without a color dot

#### Scenario: Inspect a suffix inset
- **WHEN** a Tag surface ends with a date or count
- **THEN** measured content ends exactly 8 pixels before the surface's logical end edge in either writing direction
