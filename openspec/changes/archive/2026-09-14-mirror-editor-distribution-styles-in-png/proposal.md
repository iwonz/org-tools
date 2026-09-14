## Why

Editor PNG export currently drops the persistent distributed and source-only Employee row tones
shown by the active View, so the downloaded image does not match the stable card presentation that
the user reviewed. The repository also needs an explicit invariant that future View and card
presentation changes address PNG parity in the same change.

## What Changes

- **BREAKING** Include active-View distribution row tones in Editor PNG preview, copy, and save
  output while keeping Employee names neutral.
- Resolve exported distribution status from complete active-View direct manual and Live membership,
  including placements outside a Unit-only or subtree export scope.
- Share distribution-status resolution between the live Editor and PNG painter, without exporting
  selection, hover, controls, placement paths, or endpoint markers.
- Establish persistent Unit and Employee card presentation parity as the default contract for future
  Editor PNG work while retaining the light export palette and explicit image-only customization.
- Update architecture, privacy, performance, usage, screenshots, and contributor guidance without
  changing state, JSON, Template, or Employee export contracts.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `editor-distribution-mode`: Export persistent distribution row tones to Editor PNG while keeping
  transient distribution overlays and non-image outputs excluded.
- `organization-editor`: Require Editor PNG to mirror stable active-View and card presentation by
  default, subject to explicit image settings and transient-UI exclusions.

## Impact

The shared distribution helpers, Editor card composition, image-export dialog, canvas PNG painter,
browser workflows, screenshot fixture, capability specs, and product documentation change. The PNG
output is intentionally different when an exported Unit has distribution mode enabled. No state
schema, database migration, dependency, localization catalog, network boundary, or non-image export
format changes.
