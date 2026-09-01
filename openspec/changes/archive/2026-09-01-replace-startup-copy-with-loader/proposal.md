## Why

The startup state currently shows a technical “Reading state…” label beside a pulsing database
icon. That copy adds visual noise during a short transition and makes the first paint feel more
like a diagnostic screen than part of the product.

## What Changes

- Replace the visible startup label and database glyph with one centered, restrained circular
  loading indicator.
- Keep the loading state accessible through a localized screen-reader name and status semantics.
- Use only bundled SVG/CSS and existing visual tokens in both the SQLite and Pages runtimes.
- Add a browser regression for icon-only content, exact centering, and accessible status behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `interface-chrome`: initial state hydration uses a centered icon-only loader without visible
  technical copy.

## Impact

The shared state runtime controller, English and Russian message catalogs, browser smoke coverage,
usage and screenshot documentation, and interface-chrome specification change. There are no state,
SQLite, API, MCP, Import/Export, dependency, compatibility, privacy, or network changes. The
43-screenshot gallery remains the maintained catalog.
