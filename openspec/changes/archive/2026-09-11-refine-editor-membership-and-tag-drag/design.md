## Context

The Editor has a full materialized Employee-to-Unit index used by distribution status and every placement map. Tag dragging currently handles native drops only on individual rows. The layout control is one switch containing two icons. The shared canvas/PNG summary excludes non-boss memberships seen in ancestors, unlike the correct subtree-local union used by Units.

## Goals / Non-Goals

**Goals:** Source-sensitive placement discovery, reliable full-row sorting, explicit direction buttons, exact unique subtree counts, accessible interactions, and bounded local derivation.

**Non-Goals:** New persisted fields, database conversion, dependencies, global changes to reference-Unit distribution status, new report modes, or new gallery scenarios.

## Decisions

### Derive ordinary placements from the existing complete index

Keep the complete direct manual/resolved Live index unchanged. Memoize a filtered index excluding distribution-enabled Unit IDs, invalidated only by membership or enabled IDs. Ordinary rows and maps select the filtered index; enabled sources retain the complete index for maps, status, and paths. Resolve an open map against its live source Unit and close if that source disappears, loses the Employee, or has fewer than two eligible placements. Mode changes remain bounded UI writes and do not touch the organization document.

### Capture a pointer gesture and render a transient sort preview

Use Pointer Events on the existing handle with a four-pixel activation threshold and pointer capture. Render an inert full-row overlay at the original pointer offset, a row-sized destination placeholder, and animated sibling displacement with reduced-motion support. A stable measured list coordinate system determines insertion from row midpoints, including gaps. Coalesce samples and vertical edge auto-scroll through requestAnimationFrame. Continue edge scrolling until the actual scroll boundary, even when closely timed frames produce a rounded zero-pixel sample. Only pointer release within the list commits the currently previewed source/target/placement through moveTag once. Escape, outside release, pointer cancellation, closing, query change, unmount, or external catalog replacement clears the preview and releases capture without a write. Restore focus and retain keyboard arrows and localized announcements. Pointer movement never rebuilds organization models.

### Reuse existing layout history and summary ownership

Replace the single layout switch with two independently focusable pressed buttons using the current icon geometry. Only selecting another mode invokes applyLayout, preserving one undoable arrangement operation. Repeated selection is a no-op; Arrange remains independent.

In buildOrgEditorUnitEmployeeSummaryById, union a Unit's direct IDs with each child's complete union. Remove ancestor subtraction and boss exceptions. Both canvas and PNG already consume this helper. Preserve correct deepEmployeeIds calculations in Units and selection trees and test their agreement. Count derivation is memoized outside render loops and never depends on filtering, collapse, Tag grouping, or distribution UI.

## Risks / Trade-offs

- Captured pointer no longer targets DOM rows -> use the measured scroll-container bounds and stable insertion slots, including gaps and auto-scroll.
- Animated siblings can cause collision oscillation -> calculate from untransformed slot geometry rather than animated rectangles.
- A peer replaces the catalog mid-gesture -> cancel against the initial catalog reference before committing.
- Filtering references could change source highlighting -> keep complete and ordinary indexes separate and cover both source modes.
- Duplicate memberships can hide in intermediate hierarchy levels -> assert every Unit against independent descendant ID unions, including Live Units and repeated bosses.

## Migration Plan

No state or database migration. Deliver through the normal validated OpenSpec branch lifecycle; existing state and persistence boundaries remain unchanged.

## Open Questions

None.
