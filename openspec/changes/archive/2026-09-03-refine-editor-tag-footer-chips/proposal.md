## Why

Direct-Tag chips in the Editor Unit footer reserve substantially more horizontal space than their
visible label and count require. The uneven empty area makes a compact summary look inflated and
causes avoidable wrapping and card height.

## What Changes

- Make footer chips content-sized with one consistent compact horizontal inset.
- Use one deterministic text-measurement model for live card wrapping, bounds, collision geometry,
  and PNG output so the visual result remains aligned.
- Keep complete labels and counts readable, wrap chips only when their measured content requires it,
  and preserve current Tag colors, ordering, direct-membership counts, and privacy behavior.
- Refresh the affected Editor screenshots and regression coverage without changing the gallery
  scenario count.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `organization-editor`: Require compact content-sized Unit footer chips and shared exact wrapping
  geometry between the live canvas and PNG export.
- `project-tooling`: Require the maintained Editor frames to demonstrate compact footer spacing.

## Impact

Affected areas are the shared Org Editor footer layout helpers, live Unit-card rendering, canvas PNG
painting, geometry tests, browser assertions, screenshots, and related documentation. There is no
state, API, SQLite, Import/Export contract, localization, dependency, storage, or network change.
