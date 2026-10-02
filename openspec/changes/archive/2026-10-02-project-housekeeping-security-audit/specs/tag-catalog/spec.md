## MODIFIED Requirements

### Requirement: Catalog order governs every Tag surface
The system SHALL use `organization.tags` as the only global Tag order. Catalog rows SHALL expose a
leading drag handle and keyboard reordering. One completed move SHALL insert the source before or
after its target in the full catalog, preserving other Tags' relative order during search. Preview,
cancel, invalid, unauthorized, and no-op drops MUST NOT write state. Renames and color edits SHALL
retain position; new Tags SHALL append. Every authorized Employee chip, picker, filter, Calendar,
Unit footer, Data Download, and PNG surface SHALL preserve the filtered catalog order.

#### Scenario: Reorder filtered Tags
- **WHEN** an authorized user completes a drag between visible filtered rows
- **THEN** the server commits one revisioned catalog move and all other Tags retain relative order

#### Scenario: Cancel or use the keyboard
- **WHEN** a drag is canceled or a focused handle receives an available arrow key
- **THEN** cancellation leaves the document unchanged and the keyboard move performs one adjacent command

#### Scenario: Reload ordered data
- **WHEN** a session reloads after an ordered catalog revision is committed
- **THEN** every authorized Tag surface uses the PostgreSQL-backed catalog order

### Requirement: Tag dragging previews the complete committed row position
The catalog SHALL use captured pointer gestures from its handle with a four-pixel activation
threshold. An inert full-row overlay SHALL follow the pointer while a row-sized placeholder and
displaced siblings preview the final position. The complete scroll container SHALL accept release.
Edge scrolling SHALL be bounded and local. Reduced motion SHALL suppress animation. Drag state MUST
remain transient until one final authorized move command; the committed order matches the last
preview. Keyboard reordering, focus restoration, filtered full-catalog insertion, and screen-reader
announcements remain available.

#### Scenario: Move through a gap
- **WHEN** the dragged row crosses sibling midpoints and the pointer is released in a list gap
- **THEN** siblings make room during the gesture and exactly the previewed position is committed once

#### Scenario: Cancel an active gesture
- **WHEN** Escape, outside release, pointer cancellation, query change, dialog closure, or unmount interrupts the gesture
- **THEN** capture and preview are cleared without changing catalog order

#### Scenario: Receive a server refresh
- **WHEN** a newer authorized catalog revision arrives during a gesture
- **THEN** the stale gesture is canceled and cannot overwrite the committed server order

#### Scenario: Reach offscreen rows
- **WHEN** a pointer approaches the list's top or bottom edge during dragging
- **THEN** only the list scrolls and the full-row preview remains aligned to the insertion destination
