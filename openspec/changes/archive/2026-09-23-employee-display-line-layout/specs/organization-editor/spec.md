## MODIFIED Requirements

### Requirement: Editor PNG cards follow the live canvas geometry
The Org Editor PNG renderer SHALL derive Unit width, header height, vertical padding, Employee row
height, avatar placement, text-column origin, wrapped Employee display rows, compact semantic chip
packing, configured Employee line gap, and hierarchy connection anchors from maintained Editor
geometry. The default exported card SHALL preserve the live canvas's stable visual hierarchy for
Unit identity, Employee-count summary, Employee display content, complete Tags, and boss indication
without including Unit membership type or transient editing controls. Image-specific title,
background, font, scope, radius, and Employee-format controls SHALL remain available, and rendering
MUST remain local and bounded. A separate boss-label setting MUST NOT exist.

The Image Employee-format token picker MUST NOT offer `avatarBase64Url`; embedded avatars SHALL
remain a visual card concern rather than template text. Image dialogs MUST initialize their local
Employee format and line gap from `editorExport`; local format edits remain transient overrides.
The inline preview SHALL have no redundant Preview heading or expanded Open action/dialog. Title
alignment SHALL use three accessible icon-only controls placed after Title and Size in their shared
row.

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

#### Scenario: Preserve image customization
- **WHEN** the user changes title, background, font, scope, radius, Employee format, or icon-only title alignment
- **THEN** the renderer applies those settings without changing shared structural alignment or adding transient Editor chrome

#### Scenario: Keep image generation local and bounded
- **WHEN** a PNG inline preview, copy, or download is generated
- **THEN** embedded avatars and local vector primitives are painted without an external request
- **AND** existing avatar-count, canvas-pixel, and layout-cache limits remain enforced

#### Scenario: Keep avatar data out of image text templates
- **WHEN** the Image Employee-format token list is rendered
- **THEN** it excludes `avatarBase64Url` while Employee avatars can still appear in exported cards

#### Scenario: Use the compact inline preview
- **WHEN** Image export is open
- **THEN** the bounded image remains visible without a Preview label, Open action, secondary image dialog, or boss-label field

### Requirement: Editor PNG follows persistent View presentation
The Editor PNG renderer SHALL reflect persistent active-View presentation settings and stable Unit
and Employee card semantics by default. A change that adds or modifies persistent View presentation
or stable Unit/Employee card content, styling, visibility, ordering, status, or line layout SHALL
define and test the corresponding PNG behavior in the same change. Shared semantic status, rich
rows, width-aware wrapping, line gaps, geometry, and tonal primitives SHALL be used where the DOM
and Canvas renderers require different drawing mechanisms. The PNG SHALL retain its light export
palette and explicit image-only title, background, font, scope, radius, and Employee-format
settings. Selection, hover, focus, menus, handles, placement overlays, and other transient Editor
chrome MUST NOT be mirrored.

#### Scenario: Change persistent View presentation
- **WHEN** a persistent View setting changes stable Unit or Employee card presentation
- **THEN** the live Editor and the next PNG preview, copy, or save render the same applicable content, ordering, visibility, status, and card styling

#### Scenario: Change stable card presentation
- **WHEN** stable Unit or Employee card content, geometry, wrapping, or line spacing is changed
- **THEN** the same change specifies, implements, and tests its applicable PNG representation through shared semantics

#### Scenario: Apply image-only customization
- **WHEN** the user customizes an explicit Image export setting
- **THEN** that output setting overrides its corresponding PNG attribute without mutating or weakening persistent View presentation parity
