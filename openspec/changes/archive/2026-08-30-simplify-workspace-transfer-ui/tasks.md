## 1. Workspace-only transfer contract

- [x] 1.1 Narrow the public state type and parser to `content: "workspace"`, remove partial
  serializers/import planners and their compatibility tests, and keep full workspace fixtures valid.
- [x] 1.2 Replace global Import with bounded strict parsing, compact count confirmation, atomic
  replacement, owned invalid-state recovery, and persistence-identity preservation.
- [x] 1.3 Replace global Export with one immediate validated `org-tools-state.json` download while
  leaving the Download product workflow unchanged.

## 2. Shell and floating surfaces

- [x] 2.1 Implement the no-initial-label transient Save state machine with 2000 ms Unsaved/Saved,
  operation-long Saving, persistent failure, `aria-live`, and stable header geometry.
- [x] 2.2 Remove the browser file-menu heading and omit all Autosave UI when File System Access is
  unavailable while preserving New/Open/Save As fallback behavior.
- [x] 2.3 Apply one consistent neutral outline to every non-modal dropdown container without adding
  item or interaction borders, modal outlines, or extra elevation.

## 3. Tests, documentation, and visual catalog

- [x] 3.1 Update unit and browser coverage for strict full-workspace transfer, atomic failure,
  identity preservation, direct Export, transient status, unsupported fallback, and dropdown edges.
- [x] 3.2 Remove obsolete mapping examples and copy, and update README, architecture, privacy,
  performance, usage, contributor guidance, and workspace-file documentation.
- [x] 3.3 Reduce the manifest to 48 PNGs, update Import/Export/browser/status/menu scenarios, regenerate
  twice with identical hashes, and visually inspect both themes and runtimes.

## 4. Validation and delivery readiness

- [x] 4.1 Run format, lint, typecheck, unit, dev probe, both production builds, both browser suites,
  performance checks, Pages/public checks, strict OpenSpec validation, and diff checks.
- [x] 4.2 Synchronize canonical specs and prepare the complete validated change for archival, commit,
  local fast-forward integration, and merged-branch removal without pushing or publishing.
