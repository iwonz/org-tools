## Why

Editor PNG exports currently render every authorized Tag and every visible Staffing Slot, so users
cannot prepare a deliberately reduced image for a specific audience without changing organization
data or access policies. Image-specific visibility controls are needed while preserving the
selected export subject's server-authorized boundary.

## What Changes

- Add one searchable, accessible Tag selector to both Editor PNG dialogs with all authorized Tags
  selected by default, bulk select/deselect actions, and per-Tag choices.
- Add a **Hide Staffing Slots** option that removes Slot rows, Slot summary counts, and canvas
  content dependent on hidden Slot anchors from Preview, Copy, and Save.
- Persist Tag exclusions and the Slot option in the current account's UI profile and synchronize
  them through the existing UI endpoint and server events.
- Filter semantic `{tags}` and `{tagDates}` output, Staffing Slot Tags, and Unit Tag clouds without
  changing membership, Live resolution, sorting, or grouping.
- **BREAKING**: extend the exact per-account UI State and migrate existing PostgreSQL JSONB UI rows
  to the new current-only shape.
- Keep arbitrary canvas text and resolved custom Template output unchanged; no new permission,
  export endpoint, organization field, or third-party data flow is introduced.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `data-export`: define persistent image-content visibility controls shared by both PNG exports.
- `organization-editor`: define filtered Tag geometry, complete Staffing Slot omission, and anchor
  behavior in exported Editor scenes.
- `authorization-and-access-control`: constrain Tag choices to the selected subject's authorized
  projection while keeping preferences owned by the acting account.
- `interface-localization`: add complete localized, accessible controls for all six locales.
- `privacy-safety`: preserve projection boundaries and avoid exposing unavailable Tag identities.
- `project-tooling`: extend migration, browser, deterministic gallery, and performance evidence.

## Impact

The change affects exact UI types and parsing, PostgreSQL migration `0004`, account UI projection
and MobX persistence, the two Editor image dialogs, the shared Canvas exporter, browser fixtures,
six bundled catalogs, OpenSpec capabilities, and product documentation. Existing organization
documents, permissions, APIs, and image-export subject endpoints remain unchanged.
