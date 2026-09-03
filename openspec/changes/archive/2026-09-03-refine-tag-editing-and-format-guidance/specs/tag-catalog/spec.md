## MODIFIED Requirements

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
and confirmed deletion. Editing a Tag SHALL open a dedicated modal draft with label, one shared
color dropdown, Save, and Cancel. The dropdown SHALL place a full-spectrum color picker first,
exact typed color entry next, and localized named presets plus No color below them. Deleting a
definition SHALL atomically remove its assignments, filters, and output exclusions.

#### Scenario: Open Tag editing
- **WHEN** a user activates Edit for a catalog Tag
- **THEN** a separate focused modal opens without expanding or reflowing the catalog list

#### Scenario: Save a Tag draft
- **WHEN** a user changes the label or color to valid values and activates Save
- **THEN** the existing Tag definition changes atomically and the edit modal closes

#### Scenario: Cancel a Tag draft
- **WHEN** a user closes or cancels the edit modal after making draft changes
- **THEN** the Tag definition and its assignments remain unchanged

#### Scenario: Choose an arbitrary color
- **WHEN** a user chooses a color from the full palette
- **THEN** the draft stores its canonical lowercase six-digit HEX value and previews the resulting Tag fill

#### Scenario: Choose a named color
- **WHEN** a user selects a localized named preset below the palette
- **THEN** the draft stores that semantic preset, previews its filled surface, and closes the dropdown

#### Scenario: Reset a Tag color
- **WHEN** a user selects No color
- **THEN** the draft uses the neutral Tag treatment and no color marker appears

#### Scenario: Delete an assigned Tag
- **WHEN** the user confirms deletion after seeing affected counts
- **THEN** the definition and all references disappear in one organization mutation

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
