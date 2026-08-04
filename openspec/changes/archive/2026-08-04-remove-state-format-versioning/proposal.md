## Why

The public workspace and structured-import contracts accumulated version branches and in-memory migrations that the product does not intend to maintain. Removing those branches now establishes one current schema at a time and keeps future interface changes from carrying compatibility code indefinitely.

## What Changes

- **BREAKING** Remove `formatVersion` and any `schemaVersion` concept from Org Tools file contracts.
- **BREAKING** Replace `OrgToolsStateV1`/`OrgToolsStateV2` with `OrgToolsState` and `OrgToolsImportV2`/`OrgToolsImportV3` with `OrgToolsImport`.
- **BREAKING** Remove legacy migrations and reject versioned workspace or structured-import files rather than converting them.
- Update current writers, strict readers, examples, fixtures, tests, screenshots, and documentation to the unversioned contracts.
- Record a project rule that future public schema changes replace the previous contract and delete obsolete parsing, migration, documentation, and test paths.
- Keep filenames, file selection, local-only processing, atomic validation, runtime data, and UI behavior otherwise unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `workspace-state`: The complete workspace contract becomes unversioned and legacy migration is removed.
- `structured-import`: The current additive contract becomes unversioned and legacy migration is removed.
- `structured-save`: Save writers emit only the unversioned current contracts.
- `interface-localization`: Locale independence refers to the single current state contract and obsolete version-specific errors are removed.
- `project-tooling`: Automation and project context enforce the no-versioning, no-compatibility policy.

## Impact

This affects shared public types, strict parsers and serializers, import session state, store APIs, synthetic fixtures, performance generation, localized errors, browser tests, capability specifications, and architecture/import documentation. Previously saved versioned files become intentionally unsupported. Processing remains browser-local, explicit, and atomic, and no dependency, storage path, network request, or telemetry is added.
