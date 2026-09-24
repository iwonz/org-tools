## Why

Employee display content currently flattens authored rows and wrapped semantic surfaces into one list of positioned rows. That makes the relationship between the configurable format gap and the native six-pixel wrapping gap of `{tags}` and `{positions}` implicit and allows the spacing between complete format blocks to drift from the saved setting.

## What Changes

- Represent every resolved format row as a visual block with its own measured child rows.
- Apply the saved Employee display line gap only between adjacent format blocks, including the space above and below complete `{tags}` and `{positions}` blocks.
- Preserve the native six-pixel vertical gap inside wrapped Tag and assignment blocks, together with the existing six-pixel horizontal chip gap and surface styling.
- Render the list-card information column as a vertical flex stack of measured blocks and feed the same block geometry to Editor layout and PNG rendering.
- Cover exact zero spacing, authored blank rows, ordinary text wrapping, mixed inline content, semantic wrapping, and DOM/PNG geometry parity.

This change does not alter State, exports, localization catalogs, public template tokens, standalone Tag surfaces, privacy boundaries, or network behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `employee-model`: Define configurable spacing between complete Employee format blocks while preserving native spacing inside wrapped `{tags}` and `{positions}` blocks.
- `organization-editor`: Require Editor DOM and PNG geometry to consume the same nested Employee format block layout.

## Impact

The shared Employee display layout model, list-card DOM renderer, Editor geometry, PNG renderer tests, browser smoke coverage, documentation, and screenshot gallery are affected. Persistent State and the configured SQLite snapshot remain unchanged, so no conversion is required.
