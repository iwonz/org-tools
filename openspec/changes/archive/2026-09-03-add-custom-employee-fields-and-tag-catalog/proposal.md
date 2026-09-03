## Why

Employee records need organization-specific attributes and centrally managed Tags without losing
the current local-only, large-catalog workflow. The current identity-derived Employee ID, inline
Tag labels, limited birthday filter, and compact Calendar also prevent reliable imports, safe Tag
renames, and clear month navigation.

## What Changes

- **BREAKING** Replace deterministic SHA-256 Employee IDs with stable UUIDs while continuing to
  detect duplicate people by normalized first name, last name, and email.
- **BREAKING** Replace inline Employee Tag labels with a stable global Tag catalog and references.
- Add typed stored and computed custom Employee fields, dependency-safe template tokens, optional
  MD5/SHA-256 rendering, Employee form controls, and compound filters.
- Add Employee-model and Tag-management dialogs, reorder the main navigation, and expose the new
  fields in structured JSON and Template output.
- Expand mapped Employee Import with required UUIDs, custom field mapping/creation, scalable
  three-column review, and explicit UUID/identity conflict handling.
- Rebuild Calendar week alignment, weekend styling, top Tag navigation, Today navigation, and
  compact per-day dated-Tag summaries.
- Convert the current ignored SQLite state once during delivery, without shipping a runtime
  compatibility reader or migration path.

## Capabilities

### New Capabilities

- `custom-employee-fields`: Typed stored and computed fields, template dependencies, hashes,
  editing, filtering, and export behavior.
- `tag-catalog`: Stable Tag definitions, colors, assignments, management, filtering, and rendering.

### Modified Capabilities

- `employee-model`: UUID identity, custom values, full birthday filters, and Employee form rules.
- `state-transfer`: Current-only state and mapped Employee Import contracts.
- `data-export`: Custom field ordering, names, token resolution, typed JSON, and hashes.
- `organization-editor`: Calendar layout, day cells, Tag navigation, and Editor export tokens.
- `interface-chrome`: Sidebar order and Employees header actions.
- `interface-localization`: New controls, validation, review states, and Calendar copy.
- `single-state-runtime`: Strict replacement state shape and one-time local state rewrite boundary.
- `privacy-safety`: Local hashing, Import analysis, and unchanged local-only data boundary.
- `project-tooling`: Updated deterministic screenshots and verification coverage.

## Impact

The public unversioned `OrgToolsState`, Employee and Tag types, strict parser, MobX stores, derived
indexes, shared filters, Employee dialogs, Import, structured output, Calendar, fixtures, tests,
documentation, screenshots, and current local SQLite row change. Old state and Employee transfer
files are intentionally rejected. No data is sent off-device, no remote dependency or telemetry is
added, and browser-only Pages remains free of server code and persistent organization storage.
