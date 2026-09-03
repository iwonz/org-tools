## Why

Tag colors are currently limited to eight semantic presets. Users need the speed and clarity of
named choices while also being able to match an arbitrary organization color without a detached
marker or external conversion.

## What Changes

- Replace the fixed-only Tag color Select with one dropdown whose top section exposes the native
  full color palette and whose lower section lists localized named presets plus No color.
- Persist arbitrary choices as canonical lowercase six-digit HEX colors while retaining semantic
  named colors for the supplied presets.
- Render arbitrary colors as restrained tonal Tag fills with a calculated readable foreground in
  light and dark themes, including stable hover and active states.
- Validate arbitrary colors strictly in state Import, SQLite hydration, live-tab synchronization,
  and normal organization writes.
- Keep color editing centralized in the Tag catalog and keep Tag surfaces free of leading dots.
- Do not add remote palettes, telemetry, network requests, gradients, per-assignment colors, or
  compatibility readers.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `tag-catalog`: allow arbitrary colors through a full palette above the named preset list and
  define their fill/contrast behavior.
- `single-state-runtime`: include canonical custom Tag HEX values in the strict current state.
- `interface-localization`: localize the custom color controls and accessible names in all six
  bundled languages.
- `project-tooling`: cover arbitrary Tag colors in deterministic browser and screenshot checks.

## Impact

The Employee Tag type, strict state parser, Tag catalog editor, shared Tag surface styling, message
catalogs, unit/browser tests, specifications, usage documentation, and screenshots change. The
public state remains unversioned and current-only; fixed named values remain valid, while a custom
value must be exact `#rrggbb`. No dependency, network, persistence boundary, or Employee assignment
shape changes.
