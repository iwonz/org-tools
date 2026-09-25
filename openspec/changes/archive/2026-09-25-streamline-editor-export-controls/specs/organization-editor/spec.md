## ADDED Requirements

### Requirement: Editor creation tools use recognizable icons
The Editor toolbar SHALL represent the Arrow creation tool with an outlined arrow that runs from
bottom-left to top-right. The icon change SHALL NOT alter Arrow creation, geometry, markers,
attachments, history, or PNG behavior.

#### Scenario: Identify the Arrow tool
- **WHEN** the Editor creation toolbar is visible
- **THEN** the Arrow action uses the standard up-right arrow icon and retains its localized accessible name

## MODIFIED Requirements

### Requirement: Editor PNG cards follow the live canvas geometry
The Org Editor PNG renderer SHALL derive Unit width, header height, vertical padding, Employee row
height, avatar placement, text-column origin, wrapped Employee display rows, compact semantic chip
packing, configured Employee line gap, and hierarchy connection anchors from maintained Editor
geometry. The default exported card SHALL preserve the live canvas's stable visual hierarchy for
Unit identity, Employee-count summary, Employee display content, complete Tags, and boss indication
without including Unit membership type or transient editing controls. Image-specific background,
scope, padding, radius, and Employee-format controls SHALL remain available, and rendering MUST
remain local and bounded. Density SHALL be fixed to a requested 3x, standard structure content SHALL
use the system UI font, and a title or separate boss-label setting MUST NOT exist.

The Image Employee-format token picker MUST NOT offer `avatarBase64Url`; embedded avatars SHALL
remain a visual card concern rather than template text. Image dialogs MUST initialize their local
Employee format and line gap from `editorExport`; local format edits remain transient overrides.
The inline preview SHALL have no redundant Preview heading or expanded Open action/dialog.

#### Scenario: Export one Unit with a roster
- **WHEN** a static or dynamic Unit with ordinary and boss Employees is exported with default image settings
- **THEN** Unit content, wrapped Employee rows, avatars, Tags, localized ternary boss text, and row gaps align with the corresponding live Editor geometry
- **AND** no Static, Dynamic, or Live membership-type label appears in the image

#### Scenario: Export wrapped Employee content
- **WHEN** Employee text, Tags, positions, or authored blank lines create multiple visual rows
- **THEN** PNG and Editor DOM use matching visual-row order, text wrapping, semantic chip geometry, configured gaps, and Employee-row height
- **AND** no avatar, following Employee, anchor, or Unit boundary overlaps or shifts independently

#### Scenario: Export a Unit hierarchy
- **WHEN** a subtree containing Units with different roster heights is exported
- **THEN** every connection terminates at the actual exported card boundary derived from its rendered rows
- **AND** Unit coordinates and relative hierarchy placement remain unchanged

#### Scenario: Preserve supported image customization
- **WHEN** the user changes background, scope, padding, radius, or Employee format
- **THEN** the renderer applies those settings without changing shared structural alignment or adding transient Editor chrome

#### Scenario: Keep image generation local and bounded
- **WHEN** a PNG inline preview, copy, or download is generated
- **THEN** embedded avatars and local vector primitives are painted without an external request
- **AND** existing avatar-count, canvas-pixel, and layout-cache limits remain enforced

#### Scenario: Keep avatar data out of image text templates
- **WHEN** either Image Employee-format suggestion menu is opened
- **THEN** avatar data is absent while every supported Employee, contextual Unit, custom, and display-only token remains available

### Requirement: Editor export shares structured output behavior
The Editor export dialog SHALL offer Image, JSON, and Template formats. JSON and Template SHALL use
the same schemas, unified sortable top-level field list, nested field ordering, validation, naming,
tokens, fixed Unit-path separator, bounded previews, all-assignment Template evaluation, transient
line filters, and local generation behavior as Data Download while retaining independent
session-local settings. The selected Unit-only or subtree scope SHALL determine both the Employees
and the Unit assignments available to structured output; assignments outside that scope MUST NOT
appear. Unit-only and subtree scope controls SHALL include thematic leading icons.

#### Scenario: Export scoped JSON
- **WHEN** a user reorders fields and exports JSON for one Unit or a subtree
- **THEN** each scoped Employee appears once with keys in the configured order and contains only retained assignments inside that scope

#### Scenario: Exclude every scoped assignment
- **WHEN** exclusions remove every scoped Unit assignment for an otherwise included Employee
- **THEN** the Employee remains and the enabled Unit collection is an empty array

#### Scenario: Export a scoped template
- **WHEN** a scoped Employee belongs to multiple scoped Units
- **THEN** the formatter evaluates every scoped Unit assignment in stable structure order without a row-mode control

#### Scenario: Identify export scope
- **WHEN** the scope selector renders Unit-only and entire-subtree actions
- **THEN** each label follows a thematic icon without changing selection geometry

#### Scenario: Preserve image export
- **WHEN** the user selects Image
- **THEN** the local bounded inline PNG preview, supported customization, copy, and save behavior remains available

### Requirement: Editor exports one complete View image
The Editor SHALL provide bounded full-View and scoped Image export workflows. Standard Unit and
Employee content SHALL use the local system UI family. Before layout, preview, Copy, or Save, the
renderer SHALL wait for every unique Text-base, Sticker-base, Text-range, and Sticker-range font
request required by durable canvas elements. Text and Sticker rich glyph fragments, automatic and
manual fitting, effective scale, block/per-line fills, alignment, rotation, layers, attachments,
and normalized Arrow curves SHALL match the live canvas. Preview navigation, safety limits,
supported settings, Employee formatting, action icons, scope, and transient-chrome exclusions SHALL
remain consistent across both dialogs.

#### Scenario: Use the standard structure font
- **WHEN** full-View or Unit/subtree Image output contains standard Unit and Employee content
- **THEN** preview, Copy, and Save use the local system UI stack without a font selector

#### Scenario: Export fitted rich Text
- **WHEN** scoped or full-View PNG includes automatic or manually sized Text with mixed typography or fill
- **THEN** the image uses the same effective scale, fragments, lines, final bounds, glyph styling, and background geometry as the live canvas

#### Scenario: Export rich Sticker
- **WHEN** scoped or full-View PNG includes a Sticker with inline family, size, weight, or color ranges
- **THEN** the image uses the same fragments, wrapping, vertical alignment, minimum height, flat paper fill, and border as the live canvas

#### Scenario: Export a proportionally resolved Arrow
- **WHEN** PNG includes an Arrow whose endpoint moved directly or through an attachment
- **THEN** its cubic path and marker placement match the normalized shape visible on the canvas

#### Scenario: Keep fonts local
- **WHEN** either runtime renders canvas content or generates PNG with any durable canvas-element family
- **THEN** no remote font, font catalog, organization data, or image output request is made

#### Scenario: Preserve image workflows
- **WHEN** preview, zoom, pan, Fit, Copy, Save, density clamping, or Unit/subtree scope is used
- **THEN** the bounded local behavior remains available and transient interaction chrome stays out of the PNG
