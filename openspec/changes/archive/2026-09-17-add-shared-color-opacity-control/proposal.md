## Why

The shared color Popover requires users to encode transparency through RGBA text, while its named
presets consume excessive vertical space and commit before color plus opacity can be reviewed as one
choice. A compact draft-based picker should make independent opacity available everywhere the
shared dropdown is used and preserve real alpha consistently in the Editor and PNG output.

## What Changes

- Replace the vertical named-color rows with one wrapping set of filled Tag-like preset chips.
- Add a synchronized zero-through-one-hundred percent opacity slider and numeric field that preserve
  opacity while the user changes named, palette, or exact colors.
- Keep color and opacity in a local draft until Apply; Cancel, Escape, outside dismissal, invalid
  exact input, and invalid opacity make no organization or View change.
- Encode non-opaque colors as canonical lowercase eight-digit HEX while retaining semantic named
  values at full opacity and keeping `No color` distinct from zero-percent alpha.
- Render existing and newly selected alpha colors as real transparency in shared Tag surfaces,
  distribution rows, open positions, canvas tools, and matching full-View or scoped PNG output.
- Localize the opacity control in all six bundled catalogs and extend browser, documentation, and
  deterministic gallery coverage.
- Keep native Image-export `<input type="color">` controls unchanged because they do not use the
  shared dropdown and cannot represent alpha.

## Capabilities

### New Capabilities

<!-- None. This change extends the existing shared color workflow. -->

### Modified Capabilities

- `tag-catalog`: The shared color Popover gains compact preset chips, an independent opacity draft,
  and explicit Apply/Cancel semantics while preserving exact color entry.
- `organization-editor`: Alpha colors render as actual transparency with matching DOM and Editor PNG
  behavior for distribution, open positions, Text, Sticker, Arrow, and Tag-bearing rows.
- `project-tooling`: Server/Pages browser coverage and the fixed screenshot gallery verify the new
  picker workflow and deterministic transparent rendering.

## Impact

The shared color component and color helpers, Editor Canvas and PNG color resolution, six locale
catalogs, tests, documentation, capability specs, and affected existing screenshots change. The
`EmployeeTagColor` type and exact State shape already accept canonical `#rrggbbaa`, so no SQLite
conversion, runtime compatibility reader, dependency, network request, telemetry, or native Image
export color change is introduced.
