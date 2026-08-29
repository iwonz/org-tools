## Why

Several Employee, Editor, and Calendar interactions remain visually inconsistent or unnecessarily
verbose, while Employee records cannot capture or filter by gender. The result is avoidable density,
weak calendar affordances, and a data workflow that is incomplete for common catalog use.

## What Changes

- Make Editor command hover states opaque and readable instead of visually fading into the canvas.
- Reduce quick Employee tag-option row height while retaining checkbox, label, and date actions.
- Replace the native tag-date input with a localized UI-kit calendar popover that shows only date
  selection and date clearing without repeating the tag label.
- **BREAKING**: add required current-schema Employee `gender` values (`male`, `female`, or
  `unspecified`) to persisted Employee and View override records; states without the
  field are no longer valid.
- Add Gender to Employee create/edit forms, Employee filters, ordinary JSON mapping, and generic
  Download fields.
- Remove redundant Employee storage and avatar-format helper copy from the Employee dialog.
- Remove the visible Membership mode label while preserving the accessible mode-switch name.
- Remove the redundant Calendar day-dialog description and outer list padding.
- Add the ordinary Employee tag, edit, and delete actions to birthday rows in Calendar day dialogs.
- Make every Calendar date cell an explicit pointer target with consistent number placement, hover,
  focus, and a stronger current-day treatment.
- Format the Calendar heading as localized month plus bare numeric year without the Russian year
  suffix.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `employee-model`: Persist and edit the required normalized Employee gender value.
- `workspace-state`: Require gender in the strict current unversioned Employee contract and preserve
  it through scoped and full state operations.
- `tabular-import`: Map and normalize ordinary JSON Employee gender values atomically.
- `data-export`: Expose Employee gender as a selectable local Download field.
- `organization-editor`: Refine Editor command feedback, Employee filtering, Unit dialog chrome, and
  Calendar date and day-dialog interactions.
- `dated-employee-tags`: Use compact quick-tag rows, a localized UI-kit date picker, and consistent
  Employee actions in Calendar day details.

## Impact

The change affects shared Employee types, strict state parsing, normalized runtime models, generic
import and Download fields, Employee forms and filters, Editor and Unit controls, Calendar rendering
and dialogs, localized catalogs, fixtures, tests, screenshots, a local calendar UI dependency, and
product documentation. Existing state files without `gender` are intentionally rejected under the
current-schema policy; no version, migration, or compatibility reader is added. The bundled calendar
component is the only new dependency. All processing remains in-browser with no new storage,
telemetry, remote avatar, or network behavior. Gender-based Live rules,
analytics, calendar grouping, and inference from names or other fields are explicit non-goals.
