## Why

Canvas Stickers and contextual properties currently expose inconsistent editing geometry, visual
noise, and too many always-visible controls. Image export previews are static and layer commands do
not cross the Unit-card boundary, which prevents users from inspecting exports or deliberately
placing annotations above and below organization cards.

## What Changes

- Replace folded, shaded Stickers with one flat bordered surface shared by the live Editor and PNG.
- Keep Text and Sticker draft text at the same wrapped horizontal and vertical alignment before,
  during, and after editing, including transient overflow growth.
- Replace the multi-row property surface with one compact type-aware row, a 3-by-3 alignment
  popover, a geometry popover, and one overflow action menu.
- Remove Forward and Backward actions. Make Front and Back global extremes that move only the
  selected elements across the Unit-card layer while preserving attachments and relative group
  order.
- Remove final-dimension, effective-density, and density-clamping copy from Editor Image dialogs
  while keeping all raster safety limits.
- Add one local transient pan-and-zoom viewport to full-View and scoped PNG previews.
- Update tests, documentation, localization, and the existing 59-frame screenshot gallery.
- Preserve the current State shape, existing element and attachment fields, Copy/Save PNG output,
  local-only processing, and hierarchy/card rendering. No migration or remote behavior is added.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `organization-editor`: Refine Sticker parity, text editing, contextual properties, global element
  layering, and interactive local PNG previews.

## Impact

The change affects Editor canvas rendering, typography drafts, canvas-element ordering, Image export
dialogs, browser tests, all six locale catalogs, canonical Editor documentation, and screenshot
fixtures. It changes no public State schema or external API and adds no dependency, persistence, or
network access.
