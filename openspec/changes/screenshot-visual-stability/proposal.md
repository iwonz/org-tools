## Why

The complete gallery is now the longest CI job and a fixed 1.5-second delay before every capture still allowed `demo-teams.png` to differ between two unchanged passes. Screenshot evidence needs an observed readiness condition that is both faster and stricter than sleeping for an assumed duration.

## What Changes

- Wait for bundled fonts and embedded images to finish decoding before capture.
- Replace the fixed per-frame delay with bounded consecutive visual samples and require the rendered pixels to stabilize before accepting a frame.
- Preserve the existing bounded antialiasing policy, including the stricter large-delta boundary around explicitly marked raster regions, and fail with diagnostic images when a frame never stabilizes.
- Order Administration permission grants explicitly so clean PostgreSQL instances render the same role cards.
- Keep the authoritative two-pass, 56-file SHA-256 comparison and visual review unchanged.
- Record measured gallery time and the observed nondeterminism in validation documentation.
- No runtime, State, PostgreSQL, localization, export, or privacy behavior changes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `project-tooling`: Screenshot generation uses resource readiness and bounded visual stabilization before the unchanged two-pass gallery comparison.
- `authorization-and-access-control`: Administration read models return grants in a deterministic permission/scope order.

## Impact

The change affects Playwright screenshot helpers, Administration read ordering, gallery failure artifacts, CI documentation, and project-tooling requirements. It adds no dependency, network request, or persistent data change.
