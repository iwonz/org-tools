## Why

Org Tools needs a browser-only foundation with generic file-based data contracts, deterministic
quality tooling, and an auditable specification workflow.

## What Changes

- **BREAKING** Replace the legacy exporter and UI-state inputs with a versioned `org-tools-state` JSON contract.
- **BREAKING** Replace source-specific Employee fields with generic profile, embedded avatar, birthday, tag, and Unit-scoped position fields.
- Start directly in an empty browser-only workspace with Units, Employees, Org Editor, Export, Analytics, and Calendar.
- Add full-state open/save and mapped Employee-only import from arbitrary CSV and tabular JSON.
- Remove unsupported integration, guided-demo media, remote-avatar, and obsolete task-registry
  behavior.
- Translate the product, documentation, fixtures, tests, and specifications to English.
- Add deterministic screenshots, browser smoke tests, public-safety scanning, and open-source project files.
- Adopt OpenSpec as the sole change-management workflow.

## Capabilities

### New Capabilities

- `workspace-state`: Versioned browser-only organization workspace state, validation, open, and save.
- `employee-model`: Generic Employee fields, embedded avatars, profile links, tags, and Unit-scoped positions.
- `tabular-import`: CSV and JSON collection discovery, field mapping, preview, validation, deduplication, and atomic import.
- `organization-editor`: Empty-first Units, Employees, Views, Live Units, canvas editing, analytics, and birthday calendar.
- `data-export`: Local CSV, JSON, template, and canvas image export without source-specific fields.
- `privacy-safety`: Local processing, bounded data URLs, no telemetry or background external requests, and publication scans.
- `project-tooling`: OpenSpec workflow, English documentation, CI, synthetic fixtures, browser smoke, and screenshot generation.

### Modified Capabilities

None.

## Impact

- Rebrands the pnpm workspace and all internal package identifiers.
- Removes obsolete input types, tasks, demos, media, and external avatar behavior.
- Refactors shared types, state parsing, stores, search/filtering, analytics, export fields, Employee editing, and screenshot tooling.
- Introduces OpenSpec 1.5.0, a transient import session, new tests, and public repository metadata.
