## 1. State contract and stores

- [x] 1.1 Replace public state and View document types with the strict `{ organization, ui }` contract.
- [x] 1.2 Rebuild production parsing, blank-state creation, Import, Export, and synthetic fixtures for the current-only contract.
- [x] 1.3 Move all durable shell and workflow context into typed MobX UI slices while excluding transient drafts and overlays.

## 2. Singleton server persistence

- [x] 2.1 Replace the multi-project repository with the singleton SQLite schema and destructive recognition of the obsolete managed schema.
- [x] 2.2 Replace project routes and APIs with root rendering plus strict no-store `GET` and scoped `PUT /api/state` handlers.
- [x] 2.3 Implement serialized automatic organization/UI writes, bounded retry, unload protection, and localized persistence recovery.

## 3. Static and cross-tab runtime

- [x] 3.1 Implement validated BroadcastChannel handshake, origin suppression, deterministic stamps, and server-revision convergence.
- [x] 3.2 Replace the Pages file controller with the tab-lifetime memory adapter and verify zero browser snapshot persistence.
- [x] 3.3 Remove project, browser-file, Save, Autosave, dirty, conflict, file-handle, and compatibility implementation and dependencies.

## 4. Product UI and localization

- [x] 4.1 Remove all persistence controls and terminology while preserving Import, Export, six workflows, theme, language, and responsive sidebar behavior.
- [x] 4.2 Bind locale, theme, navigation, editor UI, filters, Calendar, Analytics, and Download context to the durable UI state.
- [x] 4.3 Complete English/Russian catalogs and add source, placeholder, fallback, accessibility-copy, and stable error-code validation.

## 5. Tests, documentation, and visual catalog

- [x] 5.1 Replace unit coverage with current state, singleton repository/API, automatic queue, strict transfer, and cross-tab tests.
- [x] 5.2 Replace server and Pages browser coverage with automatic persistence, tab synchronization, memory lifetime, localization, privacy, and large-state scenarios.
- [x] 5.3 Update AGENTS, README, architecture, privacy, performance, usage, import-format, and screenshot documentation.
- [x] 5.4 Remove ten obsolete persistence PNGs and regenerate, visually inspect, and deterministically verify the 38-image gallery.

## 6. Validation and delivery

- [x] 6.1 Run format, lint, typecheck, unit, dev probe, both builds, both browser suites, Pages/public checks, strict OpenSpec validation, and diff checks.
- [x] 6.2 Synchronize canonical specs, remove obsolete capabilities, archive the change, validate no active changes, and create the requested commit.
- [x] 6.3 Fast-forward the completed commit into local main, delete the merged change branch, and verify a clean local worktree without pushing.
