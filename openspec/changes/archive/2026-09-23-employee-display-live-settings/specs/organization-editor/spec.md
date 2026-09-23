## ADDED Requirements

### Requirement: Employee visual rows share exact vertical spacing
The list DOM, Editor DOM geometry, and Editor PNG renderer SHALL consume the same measured visual-row
layout for Employee formats. The configured integer gap MUST be inserted only between adjacent
visible rows, and the measured height MUST equal the sum of row heights plus `gap × (row count - 1)`
for a nonempty layout. Unit bounds, virtual heights, hit testing, and connection anchors MUST use
that same result without line-height inflation or negative compensation.

#### Scenario: Render one row
- **WHEN** one Employee resolves to one visual row and its line gap changes between 0, 4, and 24
- **THEN** the DOM and PNG row height, Unit bounds, and connection anchors do not change

#### Scenario: Render wrapped rows
- **WHEN** Employee text, Tags, positions, or authored blank lines produce several visual rows
- **THEN** DOM and PNG use identical row positions and add the selected gap exactly once between adjacent rows

#### Scenario: Preserve collapsed Unit geometry
- **WHEN** a Unit with multi-row Employee content is collapsed and expanded
- **THEN** its hidden and visible bounds, hit targets, and anchors derive from the same shared row measurements

### Requirement: Editor and PNG Employee links remain inert
Editor DOM rows and Editor PNG output SHALL preserve explicit Markdown-link styling and native
`{positions}` styling without creating a navigation target for any fragment.

#### Scenario: Render linked Editor content
- **WHEN** an Editor or PNG format resolves an explicit Markdown link or a `{positions}` Unit segment
- **THEN** its visual styling is preserved and activation performs no navigation
