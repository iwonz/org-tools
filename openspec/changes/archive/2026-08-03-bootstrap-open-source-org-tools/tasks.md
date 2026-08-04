## 1. Repository and workflow

- [x] 1.1 Rename the pnpm workspace, packages, application metadata, and technical identifiers to org-tools
- [x] 1.2 Configure OpenSpec 1.5.0, English project rules, scripts, and Codex integration
- [x] 1.3 Remove exporter, legacy input, landing, old demo, video, audio, task-registry, and source-specific dependencies

## 2. State and Employee model

- [x] 2.1 Introduce strict OrgToolsStateV1, string IDs, blank startup, and atomic open/save
- [x] 2.2 Replace Employee fields with profileUrl, avatarBase64Url, MM-DD birthday, tags, and Unit-scoped positions
- [x] 2.3 Remove gender, source origin, numeric source IDs, remote photos, and all dependent filters and analytics
- [x] 2.4 Add state, model, URL, avatar, graph, and legacy-rejection tests

## 3. Tabular import

- [x] 3.1 Implement CSV parsing and JSON collection and dot-path discovery
- [x] 3.2 Implement mapping, normalization, preview, validation, deduplication, and atomic unassigned import
- [x] 3.3 Add the English import mapping dialog and full-state replacement confirmation
- [x] 3.4 Add CSV, JSON, mapping, duplicate, conflict, and rollback tests

## 4. Product UI and export

- [x] 4.1 Start directly in the blank Org Editor and preserve all six tabs and empty states
- [x] 4.2 Translate retained UI, errors, selectors, locale behavior, and comments to English
- [x] 4.3 Adapt profile links, embedded avatars, Calendar, analytics, Live Units, search, and export to the new model
- [x] 4.4 Preserve Main/custom Views, DnD, undo/redo, local text export, and canvas PNG export

## 5. Open-source artifacts

- [x] 5.1 Add MIT, README, contributing, security, conduct, architecture, usage, privacy, performance, and screenshot documentation
- [x] 5.2 Add compact synthetic fixtures and temporary large-fixture generation
- [x] 5.3 Add screenshot-only Playwright smoke and deterministic PNG generation
- [x] 5.4 Add CI and deterministic tracked/build public-safety scanning

## 6. Verification and handoff

- [x] 6.1 Run frozen install, lint, typecheck, unit tests, production build, strict OpenSpec validation, and public-safety checks
- [x] 6.2 Run browser smoke and screenshot generation and manually inspect every PNG
- [x] 6.3 Sync capability specs and archive the completed bootstrap change
- [x] 6.4 Verify the repository is clean, has no remote, and contains only reviewed artifacts
