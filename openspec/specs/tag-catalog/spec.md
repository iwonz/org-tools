# tag-catalog Specification

## Purpose
Define stable global Tag definitions, catalog management, colored assignments, and reference cleanup.
## Requirements
### Requirement: Tags use stable catalog definitions
The system SHALL persist Tags as UUID-keyed global definitions with a unique normalized label and an
optional color that is either a named supplied preset or a canonical lowercase six- or eight-digit
HEX value. Employee assignments SHALL reference Tag IDs and retain only an optional exact date.
Unassigned definitions SHALL remain until explicitly deleted.

#### Scenario: Rename a Tag
- **WHEN** a Tag receives a new unique label
- **THEN** every Employee assignment retains the same Tag ID and displays the new label

#### Scenario: Reject a duplicate label
- **WHEN** a label matches another Tag after Unicode normalization and case-folding
- **THEN** the change is rejected without merging definitions or assignments

#### Scenario: Reject an invalid custom color
- **WHEN** a state contains malformed, uppercase, short, or unsupported Tag color syntax
- **THEN** strict validation rejects the complete state without mutation

#### Scenario: Retain an RGBA color
- **WHEN** exact RGBA entry includes a non-opaque alpha channel
- **THEN** the Tag stores a canonical lowercase eight-digit HEX color and restores the same alpha

### Requirement: Users manage Tags centrally
The Employees header SHALL expose a Tag dialog with search, Employee count, dated-assignment count,
flat borderless rows, and confirmed deletion. Tag rows SHALL have no wrapper padding, row hover
effect, border, shadow, or resting card fill; only their explicit controls SHALL provide interaction
feedback. Every row SHALL expose Eye, Color, Edit, and Delete actions in that order. Edit SHALL open
a dedicated rename-only modal with Save and Cancel. Color SHALL open the shared full-spectrum picker
directly from the row and SHALL persist one valid color change per completed interaction. Deleting a
definition SHALL atomically remove its assignments, filters, and output exclusions.

#### Scenario: Open Tag editing
- **WHEN** a user activates Edit for a catalog Tag
- **THEN** a separate focused rename modal opens without color controls or catalog reflow

#### Scenario: Save a Tag draft
- **WHEN** a user changes the label to a unique valid value and activates Save
- **THEN** the existing Tag definition changes atomically and the edit modal closes

#### Scenario: Cancel a Tag draft
- **WHEN** a user closes or cancels the edit modal after changing its draft label
- **THEN** the Tag definition and its assignments remain unchanged

#### Scenario: Open quick color editing
- **WHEN** a user activates the Color action for a Tag
- **THEN** the shared full palette, exact input, named colors, and No color appear from that row

#### Scenario: Choose an arbitrary color
- **WHEN** a palette or hue gesture completes
- **THEN** one canonical color change is persisted and pointer samples do not create organization writes

#### Scenario: Choose a named color
- **WHEN** a user selects a localized named preset below the palette
- **THEN** the definition stores that semantic preset and the picker closes

#### Scenario: Reset a Tag color
- **WHEN** a user selects No color
- **THEN** the definition uses the neutral Tag treatment and the picker closes

#### Scenario: Delete an assigned Tag
- **WHEN** the user confirms deletion after seeing affected counts
- **THEN** the definition and all references disappear in one organization mutation

#### Scenario: Render flat Tag rows
- **WHEN** the Tag catalog row is idle or the pointer is over its non-control area
- **THEN** the row has zero wrapper padding and no border, shadow, resting fill, hover fill, or geometry change

### Requirement: Tag membership is inspectable through full Employee cards
The Tag catalog SHALL provide an Eye action that opens a separate modal resolved by stable Tag ID.
The modal SHALL render every currently assigned Employee through the ordinary virtualized full-card
composition with Tag, Edit, and Delete actions. Membership changes MUST update the open list without
retaining stale Employee snapshots or scanning on scroll.

#### Scenario: View assigned Employees
- **WHEN** the Eye action opens for a Tag used by Employees
- **THEN** every current member appears as a full Employee card with standard actions on the right

#### Scenario: Remove membership while viewing
- **WHEN** an Employee loses the viewed Tag through the card action
- **THEN** that Employee disappears and the catalog count updates from current state

#### Scenario: View an unused Tag
- **WHEN** the Eye action opens for a Tag with no assignments
- **THEN** the modal shows the localized ordinary empty state without hiding the action

### Requirement: Assignment controls reflect catalog colors
Every Tag assignment surface SHALL display the current global named or custom color as its own
restrained tonal fill with a readable matching foreground in light and dark themes. Tag chips,
assignment pickers, catalog identity labels, and Calendar Tag controls MUST NOT add a separate
leading color dot. Color SHALL be editable only in the central Tag dialog. A new Tag staged in an
Employee form SHALL use the neutral no-color fill and SHALL enter the catalog only when the Employee
save succeeds.

#### Scenario: Render a colored Tag
- **WHEN** a Tag with a named or custom catalog color appears in an Employee chip, assignment picker, catalog, or Calendar
- **THEN** the Tag surface uses a readable tonal form of that color as its fill and no leading color dot is rendered

#### Scenario: Render a neutral Tag
- **WHEN** a Tag has no configured color
- **THEN** its surface uses the neutral Tag treatment without an empty marker or reserved marker space

#### Scenario: Cancel a new staged Tag
- **WHEN** a user creates a draft Tag and cancels the Employee form
- **THEN** neither the catalog nor the Employee is changed

### Requirement: Palette choices preview the Tag surface
The central Tag color dropdown SHALL show a full-spectrum picker first, an exact color editor, and
each localized named preset below them using the same filled-surface semantics as rendered Tags
rather than a detached swatch dot. Exact entry SHALL offer HTML Keyword, HEX, RGB, and RGBA types
with a type-specific placeholder and validation. A standard keyword, `#rgb` or `#rrggbb`, integer
`rgb(r, g, b)`, or integer-channel `rgba(r, g, b, a)` with alpha from zero through one SHALL
normalize locally to canonical lowercase six- or eight-digit HEX.

#### Scenario: Open the Tag color dropdown
- **WHEN** a user opens the Tag color control in either theme
- **THEN** the full palette, exact typed entry, No color, and all named choices appear without changing dialog geometry

#### Scenario: Preview a custom Tag color
- **WHEN** a user changes the full palette value
- **THEN** the trigger and Tag preview use a readable tonal fill derived from that exact color

#### Scenario: Enter each supported color type
- **WHEN** a user selects HTML Keyword, HEX, RGB, or RGBA and enters a valid value for that type
- **THEN** the draft receives its canonical HEX value and every preview updates to the same readable fill

#### Scenario: Reject invalid exact input
- **WHEN** exact color text is incomplete, out of range, or invalid for the selected type
- **THEN** localized validation appears and the last valid Tag draft color remains unchanged

### Requirement: Flat Tag rows remain separated without hover chrome
The Tag catalog SHALL render rows with zero row padding, no border, no shadow, no permanent fill,
and no hover fill or geometry change. The list SHALL provide a consistent vertical gap between rows.

#### Scenario: Inspect the Tag catalog
- **WHEN** multiple Tags are visible and a row is hovered
- **THEN** rows remain visually separated by the list gap and the hovered row retains its transparent background and geometry

### Requirement: Tag lifecycle changes propagate across Views
Tag assignment changes SHALL update global Employees and every derived View. Tag deletion SHALL
clear global assignments, Download exclusions, Employee filters, and Live-rule references in every
View atomically.

#### Scenario: Edit a Tag in a custom View
- **WHEN** the user changes an Employee Tag from a custom View
- **THEN** the Employee and every View footer or row display the same current Tag

#### Scenario: Delete a Tag used by several Views
- **WHEN** Tag deletion is confirmed
- **THEN** no Employee, View Live rule, filter, footer, or export setting retains its ID or normalized label
