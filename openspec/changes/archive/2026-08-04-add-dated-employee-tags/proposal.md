## Why

Employee tags currently carry only labels, so workflows such as a start date, last day, or termination cannot be represented without inventing separate fields. The calendar is also limited to birthdays and cannot surface these employee-specific milestones.

## What Changes

- Add an optional one-time calendar date to each employee tag assignment while keeping tag identity, search, and Live Unit filtering label-based.
- Add localized date controls to employee, quick-tag, and bulk-tag editing, including mixed-date handling and compact dates on tag chips.
- Extend the calendar with month-and-year navigation, dated-tag events, day details, a bounded tag cloud, and a virtualized per-tag event dialog.
- **BREAKING**: write complete workspaces as `OrgToolsStateV2` and structured partial files as `OrgToolsImportV3`; continue to read and migrate State V1 and Import V2 files in memory.
- Preserve the existing `tags` label export and add `tagDates` to JSON, CSV, and templates.
- Keep all processing in the browser and all runtime text bilingual. Do not add reminders, notifications, remote storage, synchronization, or date mapping to the tabular import flow.

## Capabilities

### New Capabilities

- `dated-employee-tags`: Defines dated tag assignments, editing semantics, display, validation, and calendar events.

### Modified Capabilities

- `employee-model`: Changes employee tag values from strings to label/date records while preserving label-based identity.
- `workspace-state`: Introduces State V2 output and explicit State V1 migration.
- `structured-import`: Introduces Import V3 and migration of Import V2 tags.
- `structured-save`: Emits Import V3 partial files and State V2 complete files.
- `tabular-import`: Keeps mapped CSV and ordinary JSON tags undated.
- `data-export`: Preserves label exports and adds dated-tag export fields.
- `organization-editor`: Adds dated-tag controls, chip dates, and the expanded calendar experience.
- `interface-localization`: Adds bilingual tag-date and calendar text and localized date formatting.
- `privacy-safety`: Covers local processing of the additional employee date data.
- `project-tooling`: Extends validation, browser coverage, screenshots, and publication checks for the new formats and interfaces.

## Impact

The change affects shared employee and file-format types, strict file parsers and serializers, import candidate construction, export field generation, MobX actions and derived indexes, employee/tag editors, employee chips, the calendar tab and dialogs, English and Russian catalogs, documentation, tests, and screenshot fixtures. Existing State V1 and Import V2 files remain readable through in-memory migration, filenames remain unchanged, and no organization data is persisted or transmitted implicitly.
