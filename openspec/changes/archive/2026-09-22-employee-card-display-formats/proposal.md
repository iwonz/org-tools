## Why

Employee cards currently have fixed content that differs between lists, the Editor, and Editor PNG
output. Organizations need one local Employee-model surface for controlling those presentations with
the same token language already used by templates, while retaining predictable card geometry and
explicit image-export overrides.

## What Changes

- Add Model and Display tabs to Employee model. Display owns four token-based formats with live
  previews for Employees, Units, Editor cards, and Editor PNG cards.
- Apply the Employees format to every Employee-card context without a dedicated format and resolve
  Unit fields from all system-View assignments there. Unit, Editor, and PNG cards resolve one
  contextual assignment.
- Render non-empty formatted lines as the complete information column beside the avatar while
  preserving card actions, safe explicit links, search highlighting, accessibility, and dynamic
  Editor geometry.
- Seed Editor image-export dialogs from the persisted PNG format while retaining their transient
  per-export override.
- Flatten Required switch rows in the custom-field editor by removing their surrounding background,
  rounding, and padding.
- **BREAKING** Add exact required `organization.employeeDisplayFormats` to `OrgToolsState`. Older
  complete State documents are rejected; the configured owned SQLite snapshot is converted once
  offline with a retained backup and production-parser validation.
- Keep all data, rendering, previews, and conversion local. No network path, telemetry, or browser
  persistence is added.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `employee-model`: Persist and edit the four Employee card display formats and render their previews.
- `custom-employee-fields`: Treat persisted card formats as token references during key rename and
  field deletion.
- `organization-editor`: Render multiline formatted Employee rows with shared DOM and geometry rules.
- `data-export`: Use the persisted Editor-export format as the editable default for PNG output.
- `state-transfer`: Require and round-trip the exact Employee display-format object.
- `single-state-runtime`: Persist and synchronize display formats as one organization mutation.
- `interface-localization`: Localize the new Employee-model tabs and display sections in all catalogs.
- `project-tooling`: Cover the new display workflow in the fixed deterministic screenshot gallery.

## Impact

The public TypeScript and JSON State contract gains `EmployeeDisplayFormats`. Employee card
components, template resolution, Editor row geometry, PNG painting, State parsing, MobX persistence,
browser tests, unit tests, documentation, localization catalogs, and the maintained screenshot
gallery change together. Existing explicit image-export settings remain transient overrides.
