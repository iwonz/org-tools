## MODIFIED Requirements

### Requirement: Assignment controls reflect catalog colors
Every Tag assignment and selection surface SHALL display the current global named or custom color
as its own restrained tonal fill with a readable matching foreground in light and dark themes.
Employee chips, form drafts, assignment pickers, filters, catalog identity labels and drag previews,
Calendar controls, color previews, Editor footers, and image output MUST share density-based font,
padding, radius, gap, and inline wrapping semantics without a separate leading color dot. Long
labels MUST remain complete and content-sized. Color SHALL be editable only in the central Tag
dialog. A new Tag staged in an Employee form SHALL use the neutral no-color fill and SHALL enter the
catalog only when the Employee save succeeds.

#### Scenario: Render a colored Tag
- **WHEN** a named or custom catalog color appears on any Tag surface
- **THEN** every decorated fragment uses its readable tonal color and no leading color dot

#### Scenario: Render a neutral Tag
- **WHEN** a Tag has no configured color
- **THEN** every fragment uses the neutral Tag treatment without an empty marker or reserved marker space

#### Scenario: Wrap a control label
- **WHEN** a Tag is wider than a form, picker, filter, catalog, Calendar, or color-preview surface
- **THEN** the complete label wraps without truncation while checkbox, date, delete, drag, and activation controls remain usable

#### Scenario: Cancel a new staged Tag
- **WHEN** a user creates a draft Tag and cancels the Employee form
- **THEN** neither the catalog nor the Employee is changed

## ADDED Requirements

### Requirement: Virtual Tag rows measure wrapped content
Virtualized Tag picker and filter rows SHALL derive their heights from mounted wrapped content and
SHALL invalidate measurements when width, locale, direction, density, or label content changes.
Stable Tag identity and bounded overscan MUST remain in use.

#### Scenario: Scroll long Tag options
- **WHEN** a virtualized Tag list contains mixed one-line and multi-line labels
- **THEN** rows do not overlap or leave stale gaps and every checkbox and action remains aligned with its Tag

