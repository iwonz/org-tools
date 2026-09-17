## Why

Open-position rows currently differ from Employees mainly through a small placeholder avatar, so an
unfilled role is easy to misread as an ordinary Employee occurrence. The Editor needs a persistent,
subtle vacancy treatment that remains recognizable on canvas and in exported PNGs.

## What Changes

- Give the complete open-position row a one-pixel inset dashed outline without changing its fill,
  bounds, row layout, hit testing, virtualization, or attachment geometry.
- Keep the vacancy outline visible with appropriate semantic contrast during hover, focus,
  selection, and Employee-drop feedback while retaining the current placeholder avatar.
- Reproduce the stable neutral outline in full-View and Unit/subtree PNG output while excluding
  transient interaction states.
- Update automated DOM and painter coverage plus the existing deterministic Editor gallery evidence.
- Keep persistent State, public types, localization, Employee behavior, privacy, and local-only
  execution unchanged.

## Capabilities

### New Capabilities

<!-- None. This change refines existing Editor presentation. -->

### Modified Capabilities

- `organization-editor`: Require an identifiable, geometry-neutral dashed open-position row in DOM
  and Editor PNG output.
- `project-tooling`: Require deterministic gallery evidence for the refined vacancy presentation.

## Impact

The Editor Unit-row renderer, Editor PNG painter, shared presentation constants, browser/painter
tests, usage guidance, screenshot documentation, and affected generated PNGs change. No schema,
SQLite conversion, dependency, locale string, remote request, or data-export contract changes.
