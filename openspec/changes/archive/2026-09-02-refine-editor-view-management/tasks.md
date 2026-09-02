## 1. Editor View behavior

- [x] 1.1 Rename the canonical View presentation and related localized copy to the Units destination term in both catalogs.
- [x] 1.2 Keep accessible Create, Rename, and Delete management available for empty custom Views while protecting the canonical View.
- [x] 1.3 Clean active View, per-View UI, and Download source references when a custom View is deleted without changing canonical organization data.

## 2. Tests and documentation

- [x] 2.1 Add unit coverage for canonical deletion protection, custom View deletion, durable reference cleanup, and strict state validity.
- [x] 2.2 Add English and Russian browser coverage for the canonical label and populated or empty custom View cancellation and deletion.
- [x] 2.3 Update architecture, usage, screenshot documentation, screenshot manifest, and capability deltas.
- [x] 2.4 Regenerate and visually inspect all 43 screenshots twice and confirm deterministic hashes.

## 3. Validation and delivery

- [x] 3.1 Run format, lint, typecheck, unit, skill, MCP, dev, server/Pages builds, browser, Pages/public, strict OpenSpec, and diff checks.
- [x] 3.2 Synchronize capability deltas, archive the change, commit, fast-forward merge to main, push, remove the merged branch, and verify clean synchronized refs with no active changes.
