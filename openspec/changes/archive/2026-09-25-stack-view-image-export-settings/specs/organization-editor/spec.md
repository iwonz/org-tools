## MODIFIED Requirements

### Requirement: Editor exports one complete View image
The Editor SHALL provide bounded full-View and scoped Image export workflows. Standard Unit and
Employee content SHALL use the local system UI family. Before layout, preview, Copy, or Save, the
renderer SHALL wait for every unique Text-base, Sticker-base, Text-range, and Sticker-range font
request required by durable canvas elements. Text and Sticker rich glyph fragments, automatic and
manual fitting, effective scale, block/per-line fills, alignment, rotation, layers, attachments,
and normalized Arrow curves SHALL match the live canvas. Preview navigation, safety limits,
supported settings, Employee formatting, action icons, scope, and transient-chrome exclusions SHALL
remain consistent across both dialogs. The full-View dialog SHALL place its complete preview before
one full-width settings section at every responsive breakpoint and SHALL omit a descriptive subtitle.

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

#### Scenario: Stack full-View image settings
- **WHEN** the full-View image export dialog opens at any supported viewport width
- **THEN** the complete preview appears above all image settings in one vertical flow and the header contains no explanatory subtitle
