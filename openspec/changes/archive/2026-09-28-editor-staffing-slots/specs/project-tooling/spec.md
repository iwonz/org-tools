## ADDED Requirements

### Requirement: Staffing Slot delivery has deterministic Editor evidence

Browser validation SHALL cover named and unnamed Staffing Slots in manual and Live Units, create/edit/delete, one-slot and selected-slot movement, Tags, strict State, selection, anchors, Unit/View copy, separate summary counts, collapse, virtualization, Undo/Redo, and DOM/PNG parity in both production runtimes. The maintained 56-frame gallery SHALL show the revised Editor without adding a scenario and SHALL remain deterministic across two runs.

#### Scenario: Validate Staffing Slot workflows
- **WHEN** Server and Pages browser checks exercise a mixed Unit hierarchy
- **THEN** slot lifecycle and geometry pass while Units and Employee-oriented surfaces remain unchanged

#### Scenario: Regenerate maintained screenshots
- **WHEN** the 56-frame gallery is generated twice from unchanged source and fixtures
- **THEN** every PNG is visually inspected and both SHA-256 sets are identical

### Requirement: Delivery converts an owned previous-schema database safely

A release replacing the exact open-position State shape MUST record whether the configured owned SQLite database is absent, already current, or safely converted from the immediately previous valid shape. Conversion MUST occur with the runtime stopped, a timestamped database-family backup, detached and committed-row production-parser validation, preservation comparison, and ordinary startup proof. Converter and database artifacts MUST remain uncommitted.

#### Scenario: Convert the configured previous snapshot
- **WHEN** the owned database contains the immediately previous valid open-position shape
- **THEN** slot names, Tags, IDs, selections, and anchors are retained, obsolete colors are removed, revision advances once, and all checks complete before publication

## REMOVED Requirements

### Requirement: Open-position delivery updates deterministic Editor evidence
**Reason**: Replaced by Staffing Slot delivery evidence.
**Migration**: Existing Editor scenarios are updated in place.

### Requirement: Gallery verifies open-position vacancy styling
**Reason**: Staffing Slots retain the vacancy outline without configurable backgrounds.
**Migration**: The existing Editor frame is replaced in place.

## MODIFIED Requirements

### Requirement: Gallery verifies Tag fill semantics
The deterministic screenshot gallery SHALL show named, arbitrary, and alpha Tag colors as readable
filled surfaces without separate leading color dots in representative Employee, Tag catalog,
Calendar, assignment, and Editor PNG workflows. Tag supporting frames SHALL show the separate rename
modal, row-level quick color Popover with full palette, opacity controls, exact type Select, wrapping
preset chips, and Apply or Cancel actions, plus the full Employee membership dialog. The maintained
Template token frame SHALL show the Format help affordance and localized guidance.

#### Scenario: Regenerate Tag-bearing frames
- **WHEN** the maintained 56-frame gallery is generated twice from unchanged source
- **THEN** affected PNGs show named, arbitrary, and transparent fills, compact presets, opacity, draft actions, flat rows, rename, membership, and identical hash manifests

#### Scenario: Validate exact custom color behavior
- **WHEN** browser validation enters HTML Keyword, HEX, RGB, and RGBA colors plus opacity in both runtimes
- **THEN** valid drafts preview locally and Apply resolves one canonical color, invalid or canceled drafts preserve the previous value, and the type Select remains inside its parent Popover

#### Scenario: Validate shared picker consumers
- **WHEN** browser validation opens Tag, distribution, Text, Sticker, and Arrow color controls
- **THEN** every shared Popover exposes the same compact presets, opacity, atomic Apply, and Cancel behavior while the Image-export background uses the same picker contract

#### Scenario: Validate Format guidance
- **WHEN** browser validation visits each token-aware Format surface
- **THEN** a help icon follows the label and exposes localized `@` guidance on hover and keyboard focus

### Requirement: Browser and gallery checks cover organization color reuse and refined tool glyphs

Automated Server and Pages checks SHALL verify Used colors across every remaining shared picker consumer, including inactive-View sources, alpha variants, atomic Apply/Cancel behavior, keyboard operation, narrow width, and RTL. The maintained deterministic gallery SHALL show the Used colors section and refined Arrow and Image icons without increasing its 56 scenarios.

#### Scenario: Validate every shared picker consumer
- **WHEN** browser validation opens Tag, distribution, Text, Sticker, and Arrow color controls
- **THEN** each exposes the same organization-wide Used colors and reuses a swatch only through Apply

#### Scenario: Validate refined toolbar icons
- **WHEN** browser validation inspects the Editor tool surface
- **THEN** the Arrow SVG has one cubic path plus a filled end triangle, the Image tool uses the rounded photo glyph, and both retain their accessible names

#### Scenario: Regenerate maintained screenshots
- **WHEN** the 56-frame gallery is generated twice from unchanged source
- **THEN** affected color-picker and Editor frames show the current section and icons and both SHA-256 manifests match

### Requirement: Validation covers Editor Unit row spacing

Unit and browser validation SHALL cover first, middle, and last Employee/Staffing Slot rows, variable Tag heights, virtualization, collapse, attachments, DOM/PNG agreement, and both production runtimes. The deterministic gallery SHALL retain its existing 56 scenarios while showing the current row rhythm.

#### Scenario: Validate both runtimes
- **WHEN** Server and Pages browser checks inspect a mixed expanded Unit
- **THEN** computed row bounds contain only interior four-pixel intervals and interaction geometry remains aligned

#### Scenario: Regenerate Editor evidence
- **WHEN** the 56-frame gallery is generated twice from unchanged source and fixtures
- **THEN** affected Editor and Image-export frames show matching spacing and both SHA-256 manifests match
