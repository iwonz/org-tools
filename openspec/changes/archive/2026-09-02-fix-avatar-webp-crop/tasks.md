## 1. Resilient local avatar encoding

- [x] 1.1 Replace the WebP-only canvas helper with an ordered WebP-to-PNG encoder that accepts only safe local output types.
- [x] 1.2 Use the shared encoder for large-source preview preparation and final 512 by 512 crops while preserving validation and object-URL cleanup.
- [x] 1.3 Replace the WebP-specific failure copy with a format-neutral localized error.
- [x] 1.4 Keep the live-tab channel stable and retry the bounded startup request so the full Pages regression suite is deterministic.

## 2. Coverage and documentation

- [x] 2.1 Add unit coverage for WebP success, browser-selected PNG, null or throwing WebP attempts, explicit PNG retry, and complete encoder failure.
- [x] 2.2 Add server and Pages browser coverage that disables WebP canvas encoding and confirms crop, preview, Employee save, reload or export, local-only requests, clean diagnostics, and a reliable live-tab handoff.
- [x] 2.3 Update architecture, privacy, performance, usage, screenshot documentation, and the gallery manifest for the preferred-WebP/fallback-PNG behavior.
- [x] 2.4 Regenerate all 43 screenshots twice, visually inspect the complete gallery and avatar crop flow, and confirm deterministic hashes.

## 3. Validation and delivery

- [x] 3.1 Run format, lint, typecheck, unit, skill, MCP, dev, server/Pages builds, browser, Pages/public, strict OpenSpec, and diff checks.
- [x] 3.2 Synchronize capability deltas, archive the change, commit, fast-forward merge to main, push, remove the merged branch, and verify clean synchronized refs with no active changes.
