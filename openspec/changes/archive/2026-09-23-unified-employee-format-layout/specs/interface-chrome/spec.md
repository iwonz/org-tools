## MODIFIED Requirements

### Requirement: Tag color is expressed through restrained surface fill
Colored Tag chips and Tag-like controls SHALL use one low-chroma tonal fill and matching readable
foreground without decorative leading dots, added borders, or shadows. Neutral Tags SHALL retain a
neutral fill. Normal and compact densities MUST obtain font size, line height, padding, radius, and
gap from one shared contract. A long logical Tag MUST render content-sized cloned decoration around
each wrapped fragment. Hover, focus, active, and selected feedback SHALL not erase configured Tag
identity or change fragment geometry.

#### Scenario: Interact with a colored Tag surface
- **WHEN** a colored one-line or wrapped Tag surface is hovered, focused, activated, or selected in either theme
- **THEN** its configured fill remains recognizable, text remains readable, and decoration geometry remains stable without a color dot

