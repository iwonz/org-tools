## Why

Data Download currently mixes CSV-specific controls with JSON and templates, hard-codes the
top-level `units` field, and computes complete previews while settings change. Editor export then
duplicates only part of that behavior. A single structured JSON/template model will make both
surfaces consistent and keep 20,000-Employee exports responsive.

## What Changes

- **BREAKING** Replace the durable Download settings with a current-only JSON/template contract;
  remove CSV, flat Unit fields, and the configurable Unit-path separator.
- Add independently named and selectable `units` and `tags` JSON groups, nested field naming,
  exact Unit/tag exclusions, tri-state group controls, and bounded previews.
- Reuse the structured JSON and template projectors in Editor export while keeping Editor settings
  session-local and restricting its output to the selected Unit scope.
- **BREAKING** Make the global Export sidebar action download only the complete current state
  immediately; remove the Employee Export mode and its modal while retaining both State and mapped
  Employee Import modes.
- Remove Papa Parse and obsolete Employee-export, CSV, documentation, test, and screenshot paths.
- Preserve local-only processing, the singleton SQLite organization, current Import behavior, and
  the existing PNG renderer.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `data-export`: Define JSON groups, exclusions, templates, Editor reuse, and bounded large output.
- `state-transfer`: Replace the modal State/Employee Export choice with direct complete-state Export.
- `organization-editor`: Add scoped JSON and common template output beside PNG.
- `single-state-runtime`: Replace the strict durable Download UI projection.
- `interface-localization`: Keep JSON/Template naming and direct Export feedback localized.
- `privacy-safety`: Remove Employee Export while retaining explicit local downloads.
- `project-tooling`: Replace obsolete CSV and Employee-export gallery/test requirements.

## Impact

The change affects the public `OrgToolsState.ui.download` shape, MobX Download state, JSON/template
formatting, Editor export, sidebar Export behavior, message catalogs, browser/unit suites, canonical
specifications, documentation, and the 38-image gallery. Existing state files with the obsolete
Download projection are rejected. The ignored local SQLite row will be converted once while the
server is stopped; no runtime migration or compatibility reader is added. GitHub `main` will be
pushed, but Pages will not be manually republished.
