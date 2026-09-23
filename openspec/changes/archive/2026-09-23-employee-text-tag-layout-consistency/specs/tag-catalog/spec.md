## MODIFIED Requirements

### Requirement: Assignment controls reflect catalog colors
Every Tag assignment and selection surface SHALL display the current global named or custom color
as its own restrained tonal fill with a readable matching foreground in light and dark themes.
Employee chips, form drafts, assignment pickers, filters, catalog identity labels and drag previews,
Calendar controls, color previews, Editor footers, and image output MUST use one 11 pixel font,
16 pixel line height, 8 pixel inline padding, 2 pixel block padding, 6 pixel radius, and 6 pixel row
and column gaps without a separate leading color dot. Long labels MUST remain complete,
actual-font-measured, and content-sized. Color SHALL be editable only in the central Tag dialog. A
new Tag staged in an Employee form SHALL use the neutral no-color fill and SHALL enter the catalog
only when the Employee save succeeds.

#### Scenario: Render a colored Tag
- **WHEN** a named or custom catalog color appears on any Tag surface
- **THEN** every decorated fragment uses its readable tonal color, shared metrics, and no leading color dot

#### Scenario: Render a neutral Tag
- **WHEN** a Tag has no configured color
- **THEN** every fragment uses the neutral Tag treatment without an empty marker or reserved marker space

#### Scenario: Compare Tag surfaces
- **WHEN** the same Tag appears in a card, form, picker, filter, catalog, Calendar, drag preview, Editor, Unit footer, and PNG
- **THEN** every surface uses the same font size, line height, padding, radius, and two-axis collection gap

#### Scenario: Cancel a new staged Tag
- **WHEN** a user creates a draft Tag and cancels the Employee form
- **THEN** neither the catalog nor the Employee is changed

#### Scenario: Wrap a control label
- **WHEN** a Tag is wider than a form, picker, filter, catalog, Calendar, or color-preview surface
- **THEN** the complete label wraps without truncation while checkbox, date, delete, drag, and activation controls remain usable
