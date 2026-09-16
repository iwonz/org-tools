## Why

Canvas Text currently measures and tracks selections inconsistently, Sticker cannot format a text
range, and Arrow endpoint edits distort an established curve. The Editor needs predictable Miro-like
text fitting, formatting, and Arrow controls whose live and PNG presentations remain identical.

## What Changes

- Fit automatic Text tightly up to 480 by 320 logical pixels, then uniformly reduce rendered rich
  typography to an 8 px floor and grow only the exceptional overflow height without clipping.
- Restore two-axis manual Text resize while retaining authored base and range font sizes and using
  one shared word-aware rich-text layout for drafts, resting DOM, anchors, fills, and PNG.
- Add persistent rich-format runs to Sticker and make Font, Size, Bold, and Color apply reliably to
  selected Text or Sticker ranges, caret input, and whole resting elements.
- Replace the Text and Arrow tool glyphs, replace Arrow marker Selects with icon toggles, and preserve
  normalized cubic curvature when an endpoint or attached target moves.
- Remove the Image geometry action while retaining perimeter resize, rotation, and Shift-modified
  proportional resize.
- **BREAKING**: the exact current Sticker State shape gains required `formatRuns`; the immediately
  preceding exact Sticker shape is accepted and normalized to an empty run list.
- Keep all rendering and font work local. Do not add remote assets, telemetry, or network requests.
- Update capability requirements, documentation, six locale catalogs, tests, and existing gallery
  scenarios. JSON, Template, Employee export, and image formats remain unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `organization-editor`: Change Text sizing, Text/Sticker range formatting, Arrow endpoint and marker
  interaction, Image properties, State validation, and matching Editor PNG output.

## Impact

This affects shared canvas-element types and strict State parsing, rich-text measurement and
rendering, canvas interaction state, tool/property controls, Arrow geometry resolution, both Editor
PNG paths, View-local copy/history/synchronization, six message catalogs, screenshots, tests, and
Editor documentation. Existing Text persistence remains compatible through `autoWidth`; preceding
Sticker data receives the narrow compatibility normalization required for safe startup and import.
