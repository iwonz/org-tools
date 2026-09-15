## Why

The Editor can arrange organization cards but cannot add the explanatory text, callouts, images,
or flexible relationships needed for a presentation-ready organization board. Its image export is
also rooted in one Unit, so it cannot preserve a complete View with durable canvas annotations.

## What Changes

- Add View-local Text, Sticker, Image, and cubic Arrow elements with persistent positioning,
  formatting, layers, selection, transformation, history, and a shared extensible anchor model.
- Add a toolbar below the existing upper-right Editor actions and local file/clipboard insertion for
  bounded embedded PNG, JPEG, and WebP images.
- Add a full-View image-only export dialog whose preview, copy, and save output includes every
  durable canvas element and shows the final pixel dimensions for selectable 1x, 2x, or 3x density.
- Extend Unit/subtree PNG export with annotations attached to the exported structure while keeping
  transient Editor chrome and unrelated free elements out of the image.
- Keep JSON, Template, and general Employee exports structural and unchanged.
- **BREAKING**: require `canvasElements` in every exact current View structure and permit element
  selection in View UI state. Former State shapes are rejected without migration or compatibility
  readers.
- Keep all image input and rendering local; no remote URL, upload, telemetry, or dependency is
  introduced.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `organization-editor`: define canvas tools, common anchors, editing behavior, layered rendering,
  and full/scoped PNG output.
- `organization-views`: make canvas elements isolated View document state with history, cloning,
  copy/paste, cleanup, and synchronization behavior.
- `state-transfer`: require and validate exact current canvas-element structures and embedded image
  limits.
- `privacy-safety`: restrict inserted images and generated PNGs to bounded local-only processing.
- `interface-localization`: require complete accessible tool, property, error, and export copy in all
  supported locale catalogs.
- `project-tooling`: update the maintained Editor screenshot scenarios and performance/browser
  coverage without increasing the gallery frame count.

## Impact

The shared TypeScript state contract, Org Editor store/history/clipboard, DOM canvas, geometry and
spatial indexes, PNG renderer and dialogs, strict state validation, six locale catalogs, browser and
unit fixtures, OpenSpec contracts, project documentation, and screenshot gallery change together.
The existing 25 MiB State limit, 40-megapixel local-image source limit, 8/32-megapixel PNG limits,
20,000-Employee/4,000-Unit target, light export palette, and local-only architecture remain in force.
