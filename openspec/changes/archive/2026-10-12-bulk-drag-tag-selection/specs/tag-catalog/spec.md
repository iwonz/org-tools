## MODIFIED Requirements

### Requirement: Catalog order governs every Tag surface
The system SHALL use `organization.tags` as the only global Tag order. Catalog rows SHALL expose a
leading drag handle, keyboard reordering, and transient selection through plain activation plus
Ctrl on Windows/Linux or Command on macOS for additive toggling. One completed move SHALL insert
the ordered selected source group before or after its target in the full catalog as one authorized
organization change, preserving all other Tags' relative order during search. Dragging an
unselected row SHALL retain single-row behavior. Preview, cancel, invalid, unauthorized, unchanged,
and no-op drops MUST NOT write state. Renames and color edits SHALL retain position; new Tags SHALL
append. Every authorized Employee chip, picker, filter, Calendar, Unit footer, Data Download, and
PNG surface SHALL preserve the filtered catalog order.

#### Scenario: Select several Tags
- **WHEN** an authorized user activates one Tag normally and then Ctrl-activates or Command-activates
  other Tag identities
- **THEN** the first Tag becomes the sole selection and each modifier activation toggles one Tag in
  the visibly and accessibly selected set without changing organization state

#### Scenario: Reorder filtered Tags
- **WHEN** an authorized user completes a drag of selected visible rows between filtered rows
- **THEN** the server commits one revisioned catalog move, selected Tags become one ordered block,
  and every other Tag retains relative order

#### Scenario: Drag an unselected Tag
- **WHEN** a drag begins from a Tag outside the current selection
- **THEN** that Tag becomes the sole dragged selection and the gesture retains the existing
  single-row result

#### Scenario: Cancel or use the keyboard
- **WHEN** a drag is canceled or a focused selected handle receives an available arrow key
- **THEN** cancellation leaves the document unchanged and the keyboard move performs one adjacent
  group command

#### Scenario: Reload ordered data
- **WHEN** a session reloads after an ordered catalog revision is committed
- **THEN** every authorized Tag surface uses the PostgreSQL-backed catalog order while transient
  selection is empty

### Requirement: Tag dragging previews the complete committed row position
The catalog SHALL use captured pointer gestures from its handle with a four-pixel activation
threshold. An inert overlay containing every dragged row SHALL follow the pointer while a
group-sized placeholder and displaced siblings preview the final position. Selected rows SHALL
retain catalog order in the overlay and SHALL become one contiguous block on successful release.
The complete scroll container SHALL accept release. Edge scrolling SHALL be bounded and local.
Reduced motion SHALL suppress animation. Drag and selection state MUST remain transient until one
final authorized group move command; the committed order matches the last preview. Keyboard
reordering, focus restoration, filtered full-catalog insertion, and screen-reader announcements
remain available.

#### Scenario: Move a selected group through a gap
- **WHEN** a dragged selected group crosses sibling midpoints and the pointer is released in a list
  gap
- **THEN** siblings make room for the complete ordered group during the gesture and exactly the
  previewed position is committed once

#### Scenario: Cancel an active gesture
- **WHEN** Escape, outside release, pointer cancellation, query change, dialog closure, or unmount
  interrupts a single-row or grouped gesture
- **THEN** capture and preview are cleared without changing catalog order

#### Scenario: Receive a server refresh
- **WHEN** a newer authorized catalog revision arrives during a grouped gesture
- **THEN** the stale gesture is canceled, removed or hidden selection is discarded, and the gesture
  cannot overwrite the committed server order

#### Scenario: Reach offscreen rows
- **WHEN** a pointer approaches the list's top or bottom edge during grouped dragging
- **THEN** only the list scrolls and the complete group preview remains aligned to the insertion
  destination
