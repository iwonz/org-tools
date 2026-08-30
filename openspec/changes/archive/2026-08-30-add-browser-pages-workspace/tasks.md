## 1. Shared persistence shell

- [x] 1.1 Refactor the workspace context and shared application surface into SQLite and browser
  persistence modes without changing the public state contract.
- [x] 1.2 Add the default-off Autosave preference, accessible popover checkbox, trailing single-flight
  save scheduling, and SQLite conflict-safe integration.

## 2. Browser file workspace

- [x] 2.1 Implement strict New, Open, Save, Save As, fallback download, dirty navigation, and file
  fingerprint conflict behavior.
- [x] 2.2 Persist only the active File System Access handle in IndexedDB and implement granted,
  reconnect, denied, unavailable, invalid, and unsupported-browser recovery.
- [x] 2.3 Add focused unit tests for preferences, scheduling, handle storage, file validation,
  permissions, writes, fallback, and conflicts.

## 3. Static Pages application

- [x] 3.1 Add the separate `/org-tools/` static Next.js application and local Pages development entry
  while reusing the shared UI and excluding server routes.
- [x] 3.2 Replace showcase generation and validation with static application build, artifact safety,
  and guarded workflow publication.
- [x] 3.3 Add browser tests for core Pages workflows, local-file persistence, Autosave, reload,
  unsupported fallback, and zero organization-data network requests.

## 4. Documentation and screenshots

- [x] 4.1 Update repository invariants, README, architecture, privacy, performance, usage, and Pages
  documentation for both persistence modes.
- [x] 4.2 Add five supporting screenshot scenarios for SQLite Autosave and browser-file behavior,
  regenerate the complete 51-frame gallery, and visually review both runtimes.

## 5. Validation and delivery readiness

- [x] 5.1 Run format, lint, typecheck, unit, dev check, both production builds, server and Pages
  browser tests, deterministic screenshots, Pages checks, public safety, strict OpenSpec validation,
  performance checks, and diff checks.
- [x] 5.2 Synchronize canonical specs and prepare the complete validated change for archival,
  integration, publication, and post-deployment verification.
