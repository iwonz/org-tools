## Why

Org Editor PNG output currently uses a separate set of card dimensions and drawing offsets, so Unit
headers, Employee avatars, names, tags, and row heights drift from the same structure on the live
canvas. Exported organization diagrams should look deliberate and preserve the visual rhythm users
already reviewed in the Editor.

## What Changes

- Align PNG Unit-card dimensions, internal padding, typography, avatar/text geometry, tag packing,
  and hierarchy connectors with the live Editor card model.
- Render the Unit identity and Employee boss treatment consistently with the live canvas while
  retaining image-specific title, background, font, scope, and template-format controls.
- Derive screen and PNG layout from shared geometry constants so future card changes cannot silently
  reintroduce offset drift.
- Add unit and browser visual coverage for long rosters, wrapped tags, embedded avatars, boss rows,
  and multi-Unit hierarchy output.
- Regenerate and review the complete deterministic screenshot gallery.
- Keep all rendering local; do not change `OrgToolsState`, SQLite, state transfer, MCP, or external
  network behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `organization-editor`: require exported PNG Unit cards and connections to use the live Editor's
  structural geometry and consistent visual hierarchy.

## Impact

- Affected code: shared Org Editor geometry, the canvas PNG renderer, renderer tests, browser tests,
  screenshot scenarios, and Editor export documentation.
- Public state and APIs remain unchanged. Existing image settings remain available, and generated
  PNG pixels may change intentionally.
- No new dependency, browser persistence, remote asset, telemetry, or network request is introduced.
- Pixel-perfect browser DOM capture is not a goal; the deterministic canvas renderer remains the
  export mechanism and mirrors the maintained live-card design within its configurable output model.
