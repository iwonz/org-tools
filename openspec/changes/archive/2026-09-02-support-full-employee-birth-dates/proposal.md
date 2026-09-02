## Why

Employee birthdays currently retain only month and day in an `MM-DD` string, so Employee Import rejects complete dates and the Employee form cannot capture a known birth year. Org Tools needs one explicit full-date contract while still representing the common case where only the recurring day and month are known.

## What Changes

- **BREAKING** Replace nullable `MM-DD` Employee birthdays with nullable strict `DD.MM.YYYY` values throughout state, Employee Import, state Import/Export, Data Download, Editor export, fixtures, and tests.
- Reserve year `1900` as the persisted sentinel for an unknown birth year; consumers treat it as day-and-month-only data, including accepting `29.02.1900` and projecting recurring leap-day birthdays as before.
- Add one styled Day / Month / Year selector group to Employee create and edit dialogs. The year control exposes an explicit unknown-year choice that persists `1900`.
- Keep Calendar and Analytics recurrence based on the birthday day and month while allowing the known year to remain available in Employee data and exports.
- Reject obsolete `MM-DD` birthdays and all malformed or impossible complete dates atomically with localized, format-specific feedback.
- Update the local current SQLite snapshot once while the runtime is stopped; do not add runtime migrations or compatibility readers.
- Preserve local-only processing, the deterministic Employee identity rule, the single Unit structure, and the existing 38-scenario screenshot catalog.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `employee-model`: define the complete persisted birthday and unknown-year sentinel contract.
- `state-transfer`: require the current complete birthday format in state and mapped Employee Import.
- `organization-editor`: capture Day, Month, and Year and preserve recurring Calendar and Analytics behavior.
- `data-export`: expose the persisted complete birthday value consistently in JSON and Template output.
- `single-state-runtime`: enforce the breaking current-only birthday schema in both runtimes without a compatibility reader.
- `interface-localization`: localize the Year and unknown-year controls and all birthday validation feedback.

## Impact

The change affects shared Employee types, strict state validation, mapped Employee transfer, the Employee dialog, birthday indexes and formatters, Calendar and Analytics derivation, export fixtures, test data, localized catalogs, the local singleton SQLite snapshot, and product documentation. No network boundary, dependency, Employee ID algorithm, Unit schema, storage location, or external API is added.
