## Why

The README now presents the ten primary workflows clearly, but the detailed screenshot guide repeats
the same ten frames and leaves most secondary functionality discoverable only by running the app or
reading prose. A visitor should be able to understand the complete practical scope of org-tools from
the full visual catalog while the repository front page remains concise.

## What Changes

- Keep exactly ten featured module screenshots in the README: Import, Workspace Export, theme,
  language, Teams, Employees, Editor, Analytics, Calendar, and Data Download.
- Expand the full screenshot guide with grouped supporting states for every featured workflow,
  including mapping, replacement, forms, filters, tags, avatars, Live Teams, custom Views, Editor
  commands and exports, Analytics drill-down, Calendar dialogs, and Download formats.
- Evolve the screenshot manifest into a complete visual capability catalog with module ownership,
  featured status, descriptive purpose, and explicit capability labels for each frame.
- Generate every manifest frame deterministically from the same synthetic local workspace, remove
  stale PNGs, and validate that README links include featured frames only while the detailed guide
  includes the complete manifest.
- Update screenshot documentation and automation whenever a product change adds, removes, or
  materially changes user-visible functionality, so the visual catalog remains a reliable product
  reference rather than a historical gallery.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `project-tooling`: Separate the ten-frame README showcase from a comprehensive, grouped,
  manifest-driven feature catalog and require both to remain complete and deterministic.

## Impact

The change affects screenshot metadata, Playwright gallery scenarios, generated PNG assets,
publication validation, the README link contract, detailed screenshot documentation, and the
canonical project-tooling specification. It does not change runtime product behavior, public state
or import/export schemas, dependencies, persistence, privacy boundaries, or performance targets.
All captures remain local, browser-only, deterministic, and obviously synthetic.
