## Why

The current header adds an unnecessary empty import step and uses overlapping Save and Export terminology for different download workflows. Restricting import to JSON, launching the file chooser immediately, and separating workspace Export from the data Download surface makes the primary actions clearer and simpler.

## What Changes

- **BREAKING** Remove CSV as an accepted import format, including CSV parsing, flat relationship mapping, fixtures, documentation, and tests; generic JSON mapping and strict `OrgToolsState` import remain.
- Make the header Import action open the native JSON file chooser directly and show the import dialog only after a file is selected.
- Rename the header Save workflow to Export and the existing data-export tab to Download in English and its localized equivalent in Russian, without renaming Save actions in editor forms.
- Keep CSV, JSON, template, and PNG output formats unchanged.
- Replace the gradient wordmark with one monochrome foreground-colored `Org Tools` label while preserving its accessible name and no-shadow treatment.
- Preserve the `OrgToolsState` contract, scoped state filenames, tab identity, privacy boundaries, and file-size limits.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `organization-editor`: Change the compact header actions, the visible name of the final data-download surface, and the wordmark color treatment.
- `structured-import`: Require file selection before the import dialog and accept recognized states only from JSON.
- `tabular-import`: Remove CSV mapping and retain JSON collection and nested-graph mapping only.
- `structured-save`: Rename the scoped state Save workflow to Export without changing its files or schema.
- `privacy-safety`: Update local file-processing and cancellation behavior for the JSON-only chooser-first import flow.
- `project-tooling`: Replace CSV-import and gradient-wordmark deterministic coverage with JSON-only import and monochrome-wordmark coverage.

## Impact

The header shell, import dialog/session/parser, generic mapper, localization catalogs, browser helpers, unit and browser tests, examples, screenshots, documentation, OpenSpec context, and the listed capability specifications change. CSV-import users must convert input to JSON; exported files and organization state remain compatible. No data is sent over the network, no organization data is persisted in browser storage, no dependency is added, and PapaParse remains for CSV output.
