## Why

Custom Employee fields currently allow only one fixed option and scalar values, which prevents teams from modelling reusable multi-valued attributes or repeated typed records such as dated qualifications. Editor keyboard paste also races its keyboard fallback against the browser paste event and can create two copies from one command.

## What Changes

- Add multi-select Option fields and an optional tag-like custom-option workflow whose new choices become shared field options after Employee save.
- Add repeatable Composite fields with ordered typed subfields, one required per-Employee unique primary key, per-subfield required settings, filtering, templates, transfer, export, and Calendar dates.
- Render Required, Multi-select, and custom-option booleans as accessible switch controls in Employee model settings.
- Make one keyboard paste command create exactly one Editor copy while retaining image paste, fallback paste, context-menu paste, and repeated intentional commands.
- Update all six bundled locale catalogs and the user, architecture, privacy, performance, transfer-format, and screenshot documentation.
- **BREAKING** Replace the strict unversioned `OrgToolsState` custom-field definition and value shapes. Complete-state Import remains current-only; an owned immediately previous SQLite snapshot receives the existing guarded one-time offline conversion before publication.
- Keep new custom values off Employee cards and Editor PNG output until those presentation rules are designed separately.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `custom-employee-fields`: Define multi-option values, shared user-created options, Composite schemas and records, filtering, template formatting, validation, and lifecycle behavior.
- `dated-employee-tags`: Include every populated Composite date subfield in Calendar event indexes and dialogs.
- `data-export`: Preserve array and object shapes for advanced custom fields in JSON and define their Template text representation.
- `state-transfer`: Import mapped advanced custom values and strictly validate the replacement complete-state shape.
- `organization-editor`: Make keyboard paste create one copy per command.
- `interface-localization`: Localize the new Employee model and editing workflows in all six catalogs.
- `project-tooling`: Cover advanced fields and paste arbitration in unit, browser, screenshot, and performance validation.

## Impact

The change affects shared Employee types, strict state parsing, the global store, derived search and Calendar indexes, Employee model and edit dialogs, mapped Employee Import, Data Download and Editor exports, Editor keyboard listeners, fixtures, tests, and documentation. It adds no dependency, remote request, telemetry, browser persistence, or third-party processing. Composite records remain normalized under the owning Employee field value and derived indexes preserve the 20,000 Employee target.
