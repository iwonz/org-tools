## MODIFIED Requirements

### Requirement: Assignment controls reflect catalog colors
Every Tag assignment surface SHALL display the current global color as its own restrained tonal fill
with a readable matching foreground in light and dark themes. Tag chips, assignment pickers, catalog
identity labels, and Calendar Tag controls MUST NOT add a separate leading color dot. Color SHALL be
editable only in the central Tag dialog. A new Tag staged in an Employee form SHALL use the neutral
no-color fill and SHALL enter the catalog only when the Employee save succeeds.

#### Scenario: Render a colored Tag
- **WHEN** a Tag with a catalog color appears in an Employee chip, assignment picker, catalog, or Calendar
- **THEN** the Tag surface uses that color as its fill and no leading color dot is rendered

#### Scenario: Render a neutral Tag
- **WHEN** a Tag has no configured color
- **THEN** its surface uses the neutral Tag treatment without an empty marker or reserved marker space

#### Scenario: Cancel a new staged Tag
- **WHEN** a user creates a draft Tag and cancels the Employee form
- **THEN** neither the catalog nor the Employee is changed

## ADDED Requirements

### Requirement: Palette choices preview the Tag surface
The central Tag color selector SHALL show each named palette option using the same filled-surface
semantics as rendered Tags rather than a detached swatch dot.

#### Scenario: Choose a Tag color
- **WHEN** a user opens the Tag color selector in either theme
- **THEN** every choice previews a readable filled label and selection does not change row geometry
