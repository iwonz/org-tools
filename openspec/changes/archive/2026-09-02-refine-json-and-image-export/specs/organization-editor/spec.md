## MODIFIED Requirements

### Requirement: Editor PNG cards follow the live canvas geometry
The Org Editor PNG renderer SHALL derive Unit width, header height, vertical padding, Employee row
height, avatar placement, text-column origin, compact tag packing, and hierarchy connection anchors
from maintained Editor geometry and its measured export-tag layout. The default exported card SHALL
preserve the live canvas's stable visual hierarchy for Unit identity, Employee-count summary,
Employee names and complete tags, and boss indication without including Unit membership type or
transient editing controls. Image-specific title, background, font, scope, radius, Employee format,
and boss-label controls SHALL remain available, and rendering MUST remain local and bounded.

The Image Employee-format token picker MUST NOT offer `avatarBase64Url`; embedded avatars SHALL
remain a visual card concern rather than template text. The default boss value SHALL be the active
locale's equivalent of `Manager`. The inline preview SHALL have
no redundant Preview heading or expanded Open action/dialog. Title alignment SHALL use three
accessible icon-only controls placed after Title and Size in their shared row.

#### Scenario: Export one Unit with a roster
- **WHEN** a static or dynamic Unit with ordinary and boss Employees is exported with default image settings
- **THEN** the Unit header, icon, summary, avatar centers, name column, compact tags, and localized boss indicator align with the corresponding live Editor card geometry
- **AND** every Employee row begins from the same horizontal and vertical layout rhythm
- **AND** no Static, Dynamic, or Live membership-type label appears in the image

#### Scenario: Export wrapped Employee tags
- **WHEN** Employee tags wrap across or within one or more chip rows in the exported Editor geometry
- **THEN** the PNG uses one measured layout for chip positions, complete text lines, compact dimensions, and row-height growth
- **AND** no avatar, name, tag, following Employee, or Unit boundary overlaps or shifts independently

#### Scenario: Export a Unit hierarchy
- **WHEN** a subtree containing Units with different roster heights is exported
- **THEN** every connection terminates at the actual exported card boundary derived from its rendered rows
- **AND** Unit coordinates and relative hierarchy placement remain unchanged

#### Scenario: Preserve image customization
- **WHEN** the user changes title, background, font, scope, radius, Employee format, boss label, or icon-only title alignment
- **THEN** the renderer applies those settings without changing shared structural alignment or adding transient Editor chrome

#### Scenario: Keep image generation local and bounded
- **WHEN** a PNG inline preview, copy, or download is generated
- **THEN** embedded avatars and local vector primitives are painted without an external request
- **AND** existing avatar-count and canvas-pixel limits remain enforced

#### Scenario: Keep avatar data out of image text templates
- **WHEN** the Image Employee-format token list is rendered
- **THEN** it excludes `avatarBase64Url` while Employee avatars can still appear in exported cards

#### Scenario: Use the compact inline preview
- **WHEN** Image export is open
- **THEN** the bounded image remains visible without a Preview label, Open action, or secondary image dialog

### Requirement: Editor export shares structured output behavior
The Editor export dialog SHALL offer Image, JSON, and Template formats. JSON and Template SHALL use
the same schemas, unified sortable top-level field list, nested field ordering, validation, naming,
tokens, fixed Unit-path separator, bounded previews, shared Template row-mode control, and local
generation behavior as Data Download while retaining independent session-local settings. The
selected Unit-only or subtree scope SHALL determine both the Employees and the Unit assignments
available to structured output; assignments outside that scope MUST NOT appear. Unit-only and
subtree scope controls SHALL include thematic leading icons.

#### Scenario: Export scoped JSON
- **WHEN** a user reorders fields and exports JSON for one Unit or a subtree
- **THEN** each scoped Employee appears once with keys in the configured order and contains only retained assignments inside the selected scope

#### Scenario: Exclude every scoped assignment
- **WHEN** exclusions remove every scoped Unit assignment for an otherwise included Employee
- **THEN** the Employee remains and the enabled Unit collection is an empty array

#### Scenario: Export a scoped template
- **WHEN** a scoped Employee belongs to multiple scoped Units and the user selects a Template row mode
- **THEN** the common visual control and Template formatter produce All Units or First Unit rows from only that scope

#### Scenario: Identify export scope
- **WHEN** the scope selector renders Unit-only and entire-subtree actions
- **THEN** each label follows a thematic icon without changing selection geometry

#### Scenario: Preserve image export
- **WHEN** the user selects Image
- **THEN** the local bounded inline PNG preview, customization, copy, and save behavior remains available
