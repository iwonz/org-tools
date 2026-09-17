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
The Employees header SHALL expose a Tag dialog with search, persisted catalog ordering,
Employee count, positive dated-assignment count, flat borderless rows, and confirmed deletion. Each row SHALL
place its colored Tag surface, Employee count, and dated-assignment count in one inline identity
group with equal compact gaps; counts MUST NOT render below the Tag. Tag rows SHALL have no wrapper
padding, row hover effect, border, shadow, or resting card fill; only their explicit controls SHALL
provide interaction feedback. Every row SHALL expose Eye, Color, Edit, and Delete actions in that
order. Edit SHALL open a dedicated rename-only modal with Save and Cancel. Color SHALL open the
shared full-spectrum picker directly from the row and SHALL persist at most one valid color and
opacity change when Apply is activated. Deleting a definition SHALL atomically remove its
assignments, filters, and output exclusions.

#### Scenario: Search and order Tags
- **WHEN** the catalog opens or its query changes
- **THEN** visible Tags preserve their relative order in organization.tags

#### Scenario: Render inline counts
- **WHEN** a catalog Tag has Employee and dated-assignment counts
- **THEN** the Employee count and a nonzero With date count appear immediately after the Tag at equal gaps rather than below it

#### Scenario: Render a narrow catalog
- **WHEN** the dialog renders at narrow width
- **THEN** the Tag name yields available width while counts and the logical-end action group retain stable geometry without horizontal overflow

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
- **THEN** the shared full palette, exact input, compact named chips, opacity controls, No color, Apply, and Cancel appear from that row

#### Scenario: Draft an arbitrary color
- **WHEN** a palette, hue, exact, or opacity gesture changes the local draft
- **THEN** its preview updates without an organization write

#### Scenario: Apply a color draft
- **WHEN** a user selects a named or custom color and opacity and activates Apply
- **THEN** one canonical color change is persisted and the picker closes

#### Scenario: Reset a Tag color
- **WHEN** a user selects No color and activates Apply
- **THEN** the definition uses the neutral Tag treatment in one organization change

#### Scenario: Cancel a color draft
- **WHEN** a user activates Cancel, presses Escape, or dismisses the picker outside after changing its draft
- **THEN** the Tag definition remains unchanged and focus returns to the Color action

#### Scenario: Delete an assigned Tag
- **WHEN** the user confirms deletion after seeing affected counts
- **THEN** the definition and all references disappear in one organization mutation

#### Scenario: Render flat Tag rows
- **WHEN** the Tag catalog row is idle or the pointer is over its non-control area
- **THEN** the row has zero wrapper padding and no border, shadow, resting fill, hover fill, or geometry change

#### Scenario: Hide zero dated assignments
- **WHEN** a Tag has no dated assignments
- **THEN** its With date label is absent and the Employee count remains visible

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
The shared Tag color dropdown SHALL show a full-spectrum picker, a synchronized opacity slider and
integer percentage field, an exact color editor, and one wrapping listbox of localized named preset
chips using the same filled-surface semantics as rendered Tags rather than detached swatch dots or
full-width rows. Exact entry SHALL offer HTML Keyword, HEX, RGB, and RGBA types with type-specific
placeholder and validation. Keyword, HEX, and RGB SHALL preserve draft opacity, while RGBA SHALL
update color and opacity together. Valid input SHALL normalize locally to a semantic named value at
full opacity or canonical lowercase six- or eight-digit HEX.

#### Scenario: Open the Tag color dropdown
- **WHEN** a user opens the Tag color control in either theme
- **THEN** the full palette, opacity controls, exact typed entry, optional No color, eight named chips, Apply, and Cancel appear without changing dialog geometry

#### Scenario: Adjust opacity independently
- **WHEN** a user changes opacity from zero through one hundred percent and then changes hue, palette color, or preset
- **THEN** the chosen opacity remains in the local draft and every picker preview displays the combined color

#### Scenario: Encode named and custom opacity
- **WHEN** Apply receives a valid named or custom draft
- **THEN** a full-opacity named color retains its semantic value, a full-opacity custom color uses six-digit HEX, and a lower opacity uses eight-digit HEX with 40 percent encoded as `66`

#### Scenario: Keep no color distinct from zero opacity
- **WHEN** No color or a zero-percent configured color is applied
- **THEN** No color stores null while the configured color stores eight-digit HEX ending in `00`

#### Scenario: Enter each supported color type
- **WHEN** a user enters a valid HTML Keyword, HEX, RGB, or RGBA value
- **THEN** the draft receives the canonical color, non-alpha modes preserve current opacity, RGBA synchronizes opacity, and no organization write occurs before Apply

#### Scenario: Reject invalid draft input
- **WHEN** exact color or opacity text is incomplete, out of range, or invalid
- **THEN** localized validation or `aria-invalid` appears, Apply is disabled, and the persisted color remains unchanged

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

### Requirement: Catalog order governs every Tag surface
The system SHALL use `organization.tags` as the only global Tag order. Catalog rows SHALL expose a leading drag handle and keyboard reordering. One completed move SHALL insert the source before or after its target in the full catalog, preserving other Tags' relative order even during search. Preview, cancel, invalid, and no-op drops MUST NOT write state. Renames and color edits SHALL retain position; new Tags SHALL append. Employee chips, draft pickers, filters, Calendar, Unit footers, and exports SHALL preserve this order without promoting search matches.

#### Scenario: Reorder filtered Tags
- **WHEN** a user completes a drag between visible filtered rows
- **THEN** the source moves relative to its target in the complete catalog with one logical write and all other Tags retain their relative order

#### Scenario: Cancel or use the keyboard
- **WHEN** a drag is canceled or a focused handle receives an arrow key
- **THEN** cancellation leaves state unchanged and an available keyboard move performs one adjacent move

#### Scenario: Reopen ordered state
- **WHEN** state is restored from SQLite, Import, or a live peer
- **THEN** all Tag surfaces use the restored catalog order

### Requirement: Nested Tag color selection remains scrollable
The bounded Tag color Popover SHALL permit wheel, trackpad, touch, and keyboard access to its full
palette, opacity controls, exact editor, wrapping preset chips, and actions inside the catalog Dialog
while keeping the background locked. Escape SHALL discard the draft, close the picker, and restore
focus to its trigger.

#### Scenario: Reach every bounded control
- **WHEN** the picker exceeds the available viewport height and the user scrolls within it
- **THEN** every color, opacity, exact-input, preset, and action control can be reached without moving the background or catalog dialog

### Requirement: Shared color drafts commit atomically
Every use of the shared dropdown color picker SHALL keep color and opacity changes transient until
Apply. One changed Apply SHALL invoke its consumer once; unchanged Apply, Cancel, Escape, outside
dismissal, invalid input, or intermediate pointer and keyboard samples MUST NOT invoke it.

#### Scenario: Apply in any shared picker
- **WHEN** a valid changed draft is applied from a field or icon variant
- **THEN** the owning Tag or View operation receives exactly one canonical nullable color value

#### Scenario: Dismiss in any shared picker
- **WHEN** a draft is canceled, dismissed, invalid, or unchanged
- **THEN** the owning operation receives no callback and persisted state remains unchanged

### Requirement: Tag dragging previews the complete committed row position
The catalog SHALL use captured pointer gestures from its handle with a four-pixel activation threshold. An inert full-row overlay SHALL follow the pointer while a row-sized placeholder and displaced siblings preview the final position. The entire scroll container, including gaps and row controls, SHALL accept release. Edge scrolling SHALL be bounded and local and continue through rounded zero-pixel frame samples until the actual scroll boundary. Reduced motion SHALL suppress animation. Drag state MUST remain transient until one final moveTag mutation; the committed order MUST match the last preview. Keyboard reordering, focus restoration, filtered full-catalog insertion, and screen-reader announcements SHALL remain available.

#### Scenario: Move through a gap
- **WHEN** the dragged row crosses sibling midpoints and the pointer is released in a list gap
- **THEN** siblings make room during the gesture and exactly the previewed position is committed once

#### Scenario: Cancel an active gesture
- **WHEN** Escape, outside release, pointer cancellation, query change, dialog closure, or unmount interrupts the gesture
- **THEN** capture and preview are cleared without changing catalog order

#### Scenario: Receive a replacement catalog
- **WHEN** a live peer replaces the catalog during a gesture
- **THEN** the stale gesture is canceled and cannot overwrite the peer's order

#### Scenario: Reach offscreen rows
- **WHEN** a mouse, pen, or touch pointer approaches the list's top or bottom edge during dragging
- **THEN** only the list scrolls and the full-row preview remains aligned to the insertion destination
