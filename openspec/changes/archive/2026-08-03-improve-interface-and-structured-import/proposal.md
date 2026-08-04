## Why

The localized application still exposes an overcrowded header, inconsistent empty product surfaces,
and Russian Unit terminology that does not match the intended product language. Import guidance also
documents only Employee rows and complete workspace replacement, leaving users without a safe,
understandable way to add nested manual and Live Units with assignments.

## What Changes

- Replace the header subtitle with an accessible Org Tools wordmark whose full text uses a gradient,
  place a thematic organization emoji between the words, and show local flag glyphs in the language
  selector.
- Render every Russian Unit term as the correctly declined form of Team while preserving English
  machine keys, serialized values, and user content.
- Standardize top-level empty states across all six product tabs and omit irrelevant controls when
  their required data is absent.
- Add a localized Formats & examples tab to the import dialog with interfaces, examples, copy, and
  local download actions for Employees, Units, Units with Employees, and a complete workspace.
- Add a strict `org-tools-import` version 1 JSON contract for atomically merging Employees, nested
  manual/Live Units, and assignments into Main without replacing existing Views or UI state.
- Keep complete `OrgToolsStateV1` opening as an atomic replacement and keep arbitrary CSV/tabular
  JSON as Employee-only mapping imports.

Non-goals are changing `OrgToolsStateV1`, export formats, internal Unit identifiers, URLs, locale
routing, remote schema loading, or translating user-authored organization data.

## Capabilities

### New Capabilities

- `structured-import`: Versioned partial import parsing, validation, preview, identity resolution,
  nested Unit/Live rule normalization, and atomic Main merge.

### Modified Capabilities

- `interface-localization`: Russian Team terminology, flag presentation, and localized import
  guidance become part of the two-locale contract.
- `organization-editor`: The shared header and six product surfaces gain simplified, consistent
  empty layouts.
- `tabular-import`: The import dialog exposes a persistent file workflow beside local format
  documentation and examples.
- `workspace-state`: A validated partial import can merge into Main while complete state opening
  continues to replace the workspace.
- `privacy-safety`: Structured previews, examples, and copy/download actions remain browser-local.
- `project-tooling`: Automation validates built-in import examples and the revised localized empty
  and import surfaces.

## Impact

- Adds public TypeScript definitions for `OrgToolsImportV1` and its Employee, Unit, assignment, and
  Live filter records without changing the complete state API.
- Adds a structured import parser/planner and candidate-state builder, extends the import session,
  and updates the MobX commit boundary for atomic merge.
- Refactors the application header, language menu, top-level empty rendering, import dialog, message
  catalogs, documentation, unit/browser tests, and deterministic screenshots.
- Adapts sentence-style catalog IDs before they reach `next-intl`, preventing reserved dot
  characters from being interpreted as namespace separators without changing typed source IDs.
- Adds no runtime dependency, network request, storage path, telemetry, or migration.
