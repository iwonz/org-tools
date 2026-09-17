## MODIFIED Requirements

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

### Requirement: Nested Tag color selection remains scrollable
The bounded Tag color Popover SHALL permit wheel, trackpad, touch, and keyboard access to its full
palette, opacity controls, exact editor, wrapping preset chips, and actions inside the catalog Dialog
while keeping the background locked. Escape SHALL discard the draft, close the picker, and restore
focus to its trigger.

#### Scenario: Reach every bounded control
- **WHEN** the picker exceeds the available viewport height and the user scrolls within it
- **THEN** every color, opacity, exact-input, preset, and action control can be reached without moving the background or catalog dialog

## ADDED Requirements

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
