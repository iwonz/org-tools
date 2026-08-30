## 1. Local persistence foundation

- [x] 1.1 Replace static-export runtime assumptions with a loopback Next.js Node server on Node 22.13+ and add strict database path configuration plus ignored defaults.
- [x] 1.2 Implement the SQLite schema, lazy repository, project name normalization, default and last-project resolution, CRUD, strict state validation, UI projections, and optimistic revisions.
- [x] 1.3 Add repository and configuration unit tests covering reopen, uniqueness, atomic failures, revision conflicts, UI sanitization, and default-project recovery.

## 2. Same-origin project API

- [x] 2.1 Add no-store list, create, open, rename, delete, state Save, and UI Save endpoints with stable error responses.
- [x] 2.2 Enforce loopback Host, matching Origin, JSON mutations, no CORS, and organization-data-free logging and error behavior.
- [x] 2.3 Add API-level tests for validation, atomicity, security rejection, missing and corrupt projects, and conflict responses.

## 3. Project-aware workspace lifecycle

- [x] 3.1 Add root-to-last-project routing, stable project pages, asynchronous hydration, not-found recovery, and unchanged project-scoped Import and Export behavior.
- [x] 3.2 Separate organization and UI change sequences, implement explicit revisioned Save, Ctrl/Cmd+S, 300 ms bounded UI persistence, and in-flight dirty correctness.
- [x] 3.3 Implement unsaved navigation protection and Load, Overwrite, or Cancel conflict resolution without silent data loss.

## 4. Project interface

- [x] 4.1 Add the responsive sidebar-footer project switcher with accessible selection, stable compact geometry, and direct-link copy.
- [x] 4.2 Add localized create, rename, and delete dialogs with normalized unique-name errors and final-project recovery.
- [x] 4.3 Add restrained header Save and status states plus blocking database, missing-project, and corrupt-project recovery surfaces.

## 5. Tooling, documentation, and visual catalog

- [x] 5.1 Update browser helpers and CI to use the production Next server and isolated temporary SQLite databases while preserving all existing smoke coverage.
- [x] 5.2 Update AGENTS, README, architecture, privacy, performance, usage, screenshot guidance, configuration example, and publication safety for the local runtime and untracked databases.
- [x] 5.3 Add five supporting project screenshots, regenerate all 46 PNGs, and visually inspect project CRUD, link, Save, conflict, themes, sidebar states, and every existing workflow.

## 6. Validation and archival readiness

- [x] 6.1 Run format, lint, typecheck, unit tests, production build, full browser tests, screenshot generation, public-safety checks, strict OpenSpec validation, and diff checks.
- [x] 6.2 Verify 20,000-Employee and 4,000-Unit Save behavior, unchanged public `OrgToolsState`, exact screenshot manifest coverage, and a clean publication set ready for spec sync and archival.
