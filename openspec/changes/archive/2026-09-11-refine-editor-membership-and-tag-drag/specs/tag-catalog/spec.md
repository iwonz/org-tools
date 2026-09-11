## ADDED Requirements

### Requirement: Tag dragging previews the complete committed row position
The catalog SHALL use captured pointer gestures from its handle with a four-pixel activation threshold. An inert full-row overlay SHALL follow the pointer while a row-sized placeholder and displaced siblings preview the final position. The entire scroll container, including gaps and row controls, SHALL accept release. Edge scrolling SHALL be bounded and local and continue through rounded zero-pixel frame samples until the actual scroll boundary. Reduced motion SHALL suppress animation. Drag state MUST remain transient until one final moveTag mutation; the committed order MUST match the last preview. Keyboard reordering, focus restoration, filtered full-catalog insertion, and screen-reader announcements SHALL remain available.

#### Scenario: Move through a gap
- **WHEN** the dragged row crosses sibling midpoints and the pointer is released in a list gap
- **THEN** siblings make room during the gesture and exactly the previewed position is committed once

#### Scenario: Cancel an active gesture
- **WHEN** Escape, outside release, pointer cancellation, query change, dialog closure, or unmount interrupts the gesture
- **THEN** capture and preview are cleared without changing catalog order

#### Scenario: Receive a replacement catalog
- **WHEN** a live peer replaces the catalog during a gesture
- **THEN** the stale gesture is canceled and cannot overwrite the peer's order

#### Scenario: Reach offscreen rows
- **WHEN** a mouse, pen, or touch pointer approaches the list's top or bottom edge during dragging
- **THEN** only the list scrolls and the full-row preview remains aligned to the insertion destination
