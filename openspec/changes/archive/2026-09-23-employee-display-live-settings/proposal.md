## Why

Employee display settings currently require a separate Save action and expose line spacing through a slider whose visual model obscures the fact that spacing belongs only between rendered rows. Automatic profile and ordinary Unit-field links also make configured text behave differently from the same text elsewhere. The display editor should apply changes immediately, expose a precise numeric gap, and keep navigation limited to the semantic `{positions}` Unit segment that users explicitly expect.

## What Changes

- Replace each Employee display line-gap slider and pixel readout with one bounded integer number input.
- Persist every valid format or gap edit immediately through focused no-op-aware store operations; remove the Display-tab Save action while leaving Model-tab field saving unchanged.
- Add a localized Reset text action beside each format label that restores only that format from the defaults for the current locale.
- Define line gaps as space strictly between adjacent visible visual rows, with no space above a first row, below a last row, or around a single row, and preserve the same calculation in list DOM, Editor geometry, and PNG output.
- Render ordinary tokens, including profile, email, position, and Unit tokens, as plain text unless the author creates an explicit safe Markdown link.
- Keep native Unit navigation only on the Unit-name portion of `{positions}`, and only in Employees and Units list contexts; all other surfaces render that segment inert.
- Update maintained browser coverage, documentation, translations, and the existing 59-image gallery.
- Preserve the exact State shape, existing line-gap defaults, local-only processing, and existing stored values. No SQLite conversion is required.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `employee-model`: display settings become live, individually resettable, precisely spaced, and explicit about token link semantics.
- `single-state-runtime`: focused Employee display edits persist and synchronize immediately while unchanged edits are ignored.
- `organization-editor`: Editor DOM and PNG use the same between-row gap geometry and inert navigation rules.
- `interface-localization`: every locale provides the Reset action and no longer describes slider-only controls.
- `privacy-safety`: ordinary Employee tokens no longer create implicit external or internal navigation.
- `project-tooling`: browser checks and the maintained gallery demonstrate the live controls and reset behavior.

## Impact

The change affects the Employee model dialog, format input composition, Employee card rendering and layout, MobX store mutation APIs, runtime persistence triggers, Editor/PNG geometry tests, browser smoke tests, six locale catalogs, OpenSpec capability contracts, and user/architecture/performance/privacy/screenshot documentation. It adds no dependency, remote request, state field, compatibility reader, or background service.
