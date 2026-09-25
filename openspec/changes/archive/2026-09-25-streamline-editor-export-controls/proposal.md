## Why

Editor export exposes choices that duplicate or weaken the intended output contract: Template users must choose a multi-Unit row policy, while PNG users can lower density and customize title and font settings that no longer belong to the exported View. The Arrow tool also uses a curved glyph that does not read as a directional arrow, and Template output lacks a direct way to remove repeated rendered lines.

## What Changes

- Replace the Arrow tool glyph with a clear outlined up-right arrow.
- **BREAKING** Remove the durable Template row mode and always evaluate every retained Unit assignment in stable structure order, while JSON continues to emit one Employee record with all retained assignments.
- Add a transient **Keep only unique values** Template option that retains the first exact occurrence of each rendered text line in Data Download and scoped Editor export.
- Remove PNG density, title, title size, title alignment, and font controls from both Editor image dialogs. Copy and Save always request 3x output subject to the existing canvas safety limits, and the renderer uses the system UI font for standard structure content.
- Replace each solid-background HTML color input with the shared local color dropdown, including presets, colors already used by the organization, custom color entry, and alpha.
- **BREAKING** Remove `ui.download.rowMode` from the exact current State shape and convert the configured immediately previous SQLite snapshot once while the runtime is stopped. Runtime and State Import compatibility readers are not added.
- Keep all rendering, export processing, preview generation, SQLite work, and color discovery local with no new network behavior.
- Do not change JSON field structure, canvas element typography, Employee display formats, image padding, Unit radius, gradients, or transparent backgrounds.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `data-export`: replace selectable Template row modes with all-assignment evaluation, add exact rendered-line deduplication, and simplify Editor PNG settings.
- `organization-editor`: update the Arrow tool affordance, scoped Template behavior, and both PNG dialog and renderer contracts.
- `single-state-runtime`: remove the durable Download row-mode field and define the guarded one-time SQLite projection rewrite.
- `state-transfer`: require the new exact State shape without the obsolete Download row-mode key.
- `project-tooling`: update deterministic browser and screenshot coverage for the simplified controls.

## Impact

Affected areas include the strict State types and parser, Download and Editor export session stores, Template processing and previews, both Editor PNG dialogs and the Canvas renderer, the Editor toolbar, shared color selection, six locale catalogs, current fixtures, tests, documentation, and the maintained 59-image gallery. The configured SQLite row is currently revision 33893 with `ui.locale` set to `ru` and `ui.download.rowMode` set to `allUnits`; it requires one offline key removal and revision increment before the new runtime can open it.
