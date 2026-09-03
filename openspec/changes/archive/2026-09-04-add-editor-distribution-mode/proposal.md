## Why

The Editor shows the same Employee in multiple Units but offers no fast way to see which members of
a Unit have already been distributed elsewhere or to trace those placements on the canvas. A
View-local distribution mode makes scenario planning legible without changing the organization
document or exporting transient analysis overlays.

## What Changes

- Add a persisted View-local UI toggle for distribution mode on individual Units.
- Highlight members of enabled Units green when present in another Unit and amber when present only
  in the source Unit, using current manual and resolved Live membership.
- Draw non-interactive connections from one selected Employee occurrence to every other placement,
  with exact row anchors and collapsed-Unit fallbacks.
- Keep multi-selection, structure history, Unit geometry, Editor output, and Employee output
  unchanged.
- **BREAKING**: require `distributionModeUnitIds` in every View UI entry of the strict current State;
  older State files are rejected and the configured local SQLite state is converted once offline.
- Keep all derivation local and bounded; no external requests, telemetry, or browser snapshot
  storage are introduced.

## Capabilities

### New Capabilities
- `editor-distribution-mode`: View-local toggles, membership status, highlighting, connection
  overlays, accessibility, and interaction rules.

### Modified Capabilities
- `organization-editor`: integrate the mode with selection, deterministic row geometry, canvas
  layering, Live membership, and output exclusions.
- `organization-views`: persist independent mode selections per View and remap them when cloning a
  View without copying them through Unit clipboard Paste.
- `single-state-runtime`: automatically persist and synchronize the bounded UI setting without an
  organization write.
- `state-transfer`: require and validate the new View UI field in complete State transfer.
- `interface-localization`: localize the action and distribution status in all six bundled locales.
- `privacy-safety`: keep distribution derivation and overlays local and absent from report output.
- `project-tooling`: cover the workflow in both runtimes and expand the deterministic gallery from
  54 to 56 frames.

## Impact

The change affects shared UI-state types, strict parsing and blank fixtures, `OrgEditorStore` and
View cloning, Editor context controls and SVG rendering, six message catalogs, local database data,
unit/browser/performance tests, documentation, screenshots, and canonical OpenSpec capabilities.
It adds no dependency, route, remote integration, structural Unit field, or exported report field.
