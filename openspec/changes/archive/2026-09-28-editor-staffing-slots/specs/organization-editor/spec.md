## ADDED Requirements

### Requirement: Units own View-local Staffing Slots

The Org Editor SHALL let users create, edit, select, and delete Staffing Slots inside manual and Live Units. Each slot MUST have a stable UUID, a normalized optional name, and zero or more unique dated or undated assignments to the global Tag catalog. An unnamed slot SHALL render the localized Staffing Slot label without persisting that translation.

#### Scenario: Create an unnamed slot in a Live Unit
- **WHEN** a user adds a Staffing Slot with an empty name and Tags to a Live Unit
- **THEN** one history command stores a null name and the selected Tags while the row displays the localized fallback label

#### Scenario: Cancel slot editing
- **WHEN** a user cancels a create or edit dialog
- **THEN** no Unit, selection, history, persistence, or global Tag state changes

### Requirement: Staffing Slots share Editor row geometry without Employee semantics

Employee and Staffing Slot rows SHALL use one discriminated ordered layout with measured Tag-chip heights and prefix offsets for DOM rendering, virtualization, bounds, hit testing, Unit layout, and canvas anchors. Slots SHALL retain the neutral placeholder avatar and one-pixel dashed vacancy outline, and SHALL NOT have a persistent configurable background. Slot Tags MAY affect row ordering but MUST NOT affect Employee counts, distribution, Employee search, or Unit Tag-cloud summaries. Collapse SHALL hide slots and retain a deterministic Unit-edge anchor fallback.

#### Scenario: Render a mixed Live Unit
- **WHEN** an expanded Live Unit contains derived Employees and named or unnamed tagged slots
- **THEN** the Editor renders all rows with shared geometry while Employee-only projections remain unchanged

#### Scenario: Collapse an attached slot
- **WHEN** a canvas element targets a Staffing Slot side anchor and its Unit collapses
- **THEN** the target resolves to the corresponding Unit edge without losing its persistent link

### Requirement: Staffing Slots move independently between Units

Dragging an unselected slot SHALL move that slot, and dragging a selected slot SHALL move every selected slot, excluding Employees, between any manual or Live Units as one undoable command. The operation MUST preserve slot IDs, names, Tags, selection, and attachments while rewriting Unit ownership. A drop that changes no owner MUST be a no-op. Slot menus SHALL expose only Edit and Delete, and Employee drops MUST use ordinary Unit behavior without consuming a slot.

#### Scenario: Move selected slots from several Units
- **WHEN** selected slots from multiple source Units are dragged onto another Unit
- **THEN** all selected slots move once, their anchors reference the target Unit, and one Undo restores the complete preceding state

#### Scenario: Delete an attached slot
- **WHEN** a selected Staffing Slot is deleted from its menu or the keyboard
- **THEN** the slot is removed and incoming canvas attachments detach at their last resolved world coordinates in the same command

### Requirement: Unit headers report Employees and Staffing Slots separately

Every Editor Unit summary SHALL derive distinct direct and descendant Employee counts plus direct and descendant Staffing Slot counts. A Unit with children SHALL render a total line followed by an in-Unit line; a leaf SHALL render one unprefixed direct line. Zero slot counts MUST remain visible. Slots MUST NOT contribute to either Employee count.

#### Scenario: Summarize a parent Unit
- **WHEN** a Unit and its descendants contain repeated Employee assignments and several unique Staffing Slots
- **THEN** the first line reports distinct subtree Employees and all subtree slots and the second reports only the direct values

#### Scenario: Summarize a leaf Unit
- **WHEN** a Unit has no children
- **THEN** its fixed summary area centers one line containing direct Employees and direct Staffing Slots

### Requirement: Editor PNG reproduces Staffing Slots and Unit summaries

The Editor DOM and full-View or Unit/subtree PNG SHALL use the same Staffing Slot rows, ordering, measured geometry, fallback names, placeholder avatars, dashed outlines, complete Tag chips, collapse visibility, anchor resolution, and Unit summary lines. Scoped PNG SHALL include canvas elements transitively attached to included slots. Employee-format templates SHALL apply only to Employees, and transient interaction styling MUST NOT appear in PNG.

#### Scenario: Export a mixed hierarchy
- **WHEN** a hierarchy containing Employees and Staffing Slots is exported
- **THEN** DOM and PNG contain matching rows, summaries, bounds, and attachments while employee-only counts remain distinct

## MODIFIED Requirements

### Requirement: Org Editor Employee geometry follows wrapped tags

The Org Editor SHALL compute Employee and Staffing Slot row heights from one actual-font-measured
inline layout of text, localized Tag fragments, and assignment fragments. The same layout MUST drive
virtual offsets, hitboxes, selection, connectors, layout, bounds, DOM rendering, and PNG drawing.
Tags SHALL use the one catalog-colored decoration with complete `label · date` content. Oversized
content MUST wrap by words and then grapheme clusters into content-sized decorated fragments without
ellipsis, overflow, hidden content, or unused colored row width.

#### Scenario: Tag rows change
- **WHEN** Employee Tags, a format, width, direction, font, or locale changes the measured fragments
- **THEN** every downstream canvas geometry consumer uses the updated shared layout without overlap

#### Scenario: Large structure virtualization
- **WHEN** a large current structure contains variable-height Employee or Staffing Slot rows
- **THEN** only visible rows render while hit testing and connector anchors remain aligned with their rows

#### Scenario: Export Employee tags to PNG
- **WHEN** an Employee with dated, undated, counted, or wider-than-column Tags is included in an Org Editor PNG export
- **THEN** PNG draws the same ordered fragments, padding, radii, colors, typography, gaps, and row geometry as Editor DOM for the selected image font

### Requirement: Unit people rows keep compact interior spacing

Every expanded Editor Unit SHALL place one four-logical-pixel vertical interval between adjacent
visible Employee or Staffing Slot rows. The first visible row SHALL remain flush with the existing
list start and the last visible row SHALL remain flush with the existing list end, so a row stack of
`n` items contains exactly `max(0, n - 1)` intervals. The interval MUST remain outside each row's
surface and MUST NOT change row content padding, ordering, selection, or persistent State.

DOM rendering, virtualization, Unit height, hierarchy placement, spatial hit testing, drag/drop,
row anchors, attachments, and full-View or Unit/subtree PNG SHALL consume the same gap-aware
tag-height layout.

#### Scenario: Render several Employees
- **WHEN** an expanded Unit shows three Employee rows
- **THEN** exactly two four-pixel intervals separate them with no added interval above the first or below the last row

#### Scenario: Mix Employees and a Staffing Slot
- **WHEN** sorting places a Staffing Slot between Employee rows
- **THEN** every adjacent pair has the same interval while the dashed Slot outline and all row surfaces retain their own bounds

#### Scenario: Render one visible row
- **WHEN** an expanded or collapsed Unit has exactly one visible row
- **THEN** the stack contributes no row interval and the row retains its existing height and list-edge position

#### Scenario: Preserve interactive geometry
- **WHEN** a row after the first is selected, dragged, used as a drop target, or attached to a canvas element
- **THEN** hit testing, preview, anchors, and committed geometry resolve against its gap-adjusted world position

#### Scenario: Export Unit rows
- **WHEN** full-View or scoped PNG includes a Unit with multiple variable-height rows
- **THEN** row content, surfaces, dashed Slot outlines, anchors, footer, Unit bounds, and hierarchy connections use the same intervals as the DOM

### Requirement: Editor color controls and renderers preserve real alpha

Every Editor control backed by the shared color dropdown SHALL provide the same independent opacity draft and explicit Apply or Cancel workflow as the Tag catalog. Canonical eight-digit colors SHALL retain their actual alpha in Text foreground and fill, Sticker foreground, surface, and border, Arrow stroke and markers, distribution rows, Tag-bearing DOM surfaces, and matching full-View or Unit/subtree PNG. Foreground text on semantic surfaces SHALL remain opaque and readable after the fill is composited against maintained light or dark backgrounds.

#### Scenario: Apply an Editor tool color
- **WHEN** a user drafts a color and opacity for Text, Sticker, or Arrow and activates Apply
- **THEN** one history command stores the canonical value and the resting DOM plus PNG use the same actual alpha

#### Scenario: Apply a View presentation color
- **WHEN** a user applies a transparent distribution color
- **THEN** one View operation stores it and live rows plus light-palette PNG composite the same source color and alpha

#### Scenario: Cancel an Editor color draft
- **WHEN** a user changes color or opacity and cancels, presses Escape, clicks outside, or leaves invalid input
- **THEN** no View history, persistence, or synchronization write occurs and the preceding rendered color remains

#### Scenario: Retain existing State
- **WHEN** current State contains semantic, six-digit, or eight-digit Editor colors
- **THEN** strict parsing accepts the unchanged color shape and opening or canceling a picker does not rewrite those values

### Requirement: Editor contributes every configured canvas color to the shared palette

The organization-wide Used colors palette SHALL include each View's distributed and undistributed settings, Text base, range, and fill colors, Sticker base, range, and background colors, and Arrow strokes. Collection SHALL include inactive Views in stable View, Unit, canvas-element, and format-run order without cloning or serializing full State. Closed shared pickers MUST NOT trigger collection work on ordinary Editor renders.

#### Scenario: Reuse an inactive View color
- **WHEN** an inactive View contains a unique Text, Sticker, Arrow, or distribution color
- **THEN** opening any shared picker exposes that exact color and alpha for reuse

#### Scenario: Preserve Editor performance
- **WHEN** the maintained large Editor renders while no shared color picker is open
- **THEN** Used colors derivation does not scan Views or cause canvas-element or Unit re-renders

#### Scenario: Apply a used color to an Editor property
- **WHEN** a Used colors swatch is selected for Text, Sticker, Arrow, or distribution and Apply is activated
- **THEN** the existing owning View operation commits once and Undo restores its complete prior value

## REMOVED Requirements

### Requirement: Manual Units support View-local open positions
**Reason**: Replaced by Staffing Slots available in manual and Live Units.
**Migration**: Existing titles and Tags become slot names and Tags; background colors are discarded.

### Requirement: Open positions participate in Editor row geometry and Tags
**Reason**: Replaced by the Staffing Slot geometry requirement.
**Migration**: Existing position IDs and anchor relationships become slot IDs and relationships.

### Requirement: Open positions support replacement and deletion
**Reason**: Staffing Slots are edited, moved, or deleted and are never converted into Employees.
**Migration**: No persisted replacement state exists.

### Requirement: Editor PNG reproduces open positions
**Reason**: Replaced by the Staffing Slot PNG requirement.
**Migration**: Existing rows retain their names, Tags, IDs, and attachments.

### Requirement: Open-position rows have a distinct vacancy outline
**Reason**: The vacancy outline is retained under the Staffing Slot requirement while configurable backgrounds are removed.
**Migration**: Existing background values are intentionally discarded.
