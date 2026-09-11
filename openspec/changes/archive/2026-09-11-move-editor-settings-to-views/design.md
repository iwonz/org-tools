## Context

Unit grouping currently lives on each Unit; distribution colors are fixed theme variables. View
stores already own isolated structural snapshots, and canvas/PNG share pure row and footer helpers.

## Goals / Non-Goals

**Goals:** one accessible View dialog, consistent rendering, immediate undoable settings, strict
persistence, safe offline conversion, and the existing 20,000 Employee / 4,000 Unit target.

**Non-Goals:** changing membership or distribution eligibility, exposing overlays in reports,
adding dependencies, runtime migrations, compatibility readers, or external services.

## Decisions

- Add required `OrgEditorViewSettings` to `structure.settings` and Editor state/history with
  `groupByTag`, `showTagCloud`, `distributedColor`, and `undistributedColor`. Defaults are true, true,
  green, and amber. Remove Unit grouping. Structural ownership reuses View copying and undo rather
  than duplicating settings across Units or a separate history system.
- Pass grouping explicitly through the shared row-order helpers and distribution anchors. Hidden
  clouds contribute no footer geometry in store caches, canvas, or PNG; Employee Tags remain visible.
- Reuse the current color picker with an accessible label and an option to omit No color. Shared
  tonal color helpers supply readable themed row fills and distribution path/marker foregrounds.
  Exact invalid input and canceled gestures do not commit; each completed choice is one command.
- Put the gear next to the View selector, including system/empty Views. Remove Unit settings and move
  the note action to the free corner. Close the View dialog when its source View changes or vanishes.
- View copying clones settings; Unit Paste uses target settings. Strict validation accepts exact
  current settings with booleans and non-null named/canonical HEX colors at all trust boundaries.

## Risks / Trade-offs

- A format change invalidates old files and the existing SQLite row. Use the authorized offline
  conversion below, never a startup fallback. UI preview remains transient and never serializes data.
- Stale geometry could misalign paths after grouping or footer changes. Exercise shared row offsets,
  footer caches, virtualized navigation, collapsed endpoints, and PNG against the same settings.
- Color previews could generate excessive writes. Retain gesture-final commits and no-op detection.

## Migration Plan

Stop the verified configured-database process, create a consistent local backup, then add defaults
to every View and remove Unit grouping in a detached full state. Current Units all have grouping on.
Validate with the production validator before one immediate SQLite transaction updates the state
and increments revision. Verify the written state; roll back failures. Already-current input is a
validated no-op. Test success, idempotence, and invalid-input rollback on synthetic databases. Keep
conversion tooling, backup, and databases outside Git. Restore the dev server after verification.

## Validation finding

A newer live-peer snapshot can arrive before an outstanding SQLite startup response. Startup now
compares logical stamps and cannot overwrite that newer state or reset its counter. The browser
settings scenario delays initial SQLite hydration to reproduce this ordering deterministically.

## Open Questions

None. The user confirmed that cloud visibility also controls PNG and distributed color controls paths.
