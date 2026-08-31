## 1. Server foundation and persistence

- [x] 1.1 Add the pinned MCP server and schema dependencies only to the local server application and extend Pages/public scans to reject MCP artifacts.
- [x] 1.2 Migrate exact SQLite schema v1 to v2 without changing singleton state or revision; add settings, previews, activity retention, and migration/unknown-schema tests.
- [x] 1.3 Implement token generation, constant-time authentication, enable/disable/rotate lifecycle, preview revocation, stable control errors, and same-origin control APIs.

## 2. Agent domain and protocol

- [x] 2.1 Implement exact typed MCP operation schemas, temporary reference resolution, detached complete-state validation, semantic diffs, and full Employee/Unit/View CRUD coverage.
- [x] 2.2 Implement immutable ten-minute Preview, atomic and idempotent Apply, bounded activity summaries, selective Undo preview, overlap conflicts, and journal retention.
- [x] 2.3 Implement bounded cached read tools, avatar opt-in, composition analysis, activity reads, resource guide, prompts, and truthful tool annotations.
- [x] 2.4 Add the authenticated stateless Streamable HTTP `/mcp` route with loopback Host/Origin guards, bearer auth, no-store responses, POST-only behavior, and compatible protocol negotiation.

## 3. Revision coordination and live interface

- [x] 3.1 Add `expectedRevision` to state writes, stable stale responses, local revision events, and one transaction/revision notification per accepted write.
- [x] 3.2 Add controller base-state tracking, external revision refresh, stable-ID three-way merge, automatic independent reconciliation, bounded retry, and localized Keep local/Use MCP/Cancel overlap handling.
- [x] 3.3 Add the server-only MCP sidebar action and responsive modal for consent, status, credentials, setup, examples, activity, confirmed undo, and privacy disclosure while keeping Pages free of MCP imports.
- [x] 3.4 Complete English/Russian catalog entries, accessibility names, stable error mappings, and runtime localization coverage for all MCP and reconciliation surfaces.

## 4. Verification and product documentation

- [x] 4.1 Add unit and protocol tests for migration, transport/auth, token lifecycle, schemas, pagination, CRUD, expiry/staleness, Apply idempotency, summaries, selective undo, reconciliation, and Pages isolation.
- [x] 4.2 Add `pnpm mcp:check` and browser coverage for real protocol mutation, live UI/reload, rotation, activity/undo, concurrent edits, both themes/locales, diagnostics, external requests, and large-state bounds.
- [x] 4.3 Add `docs/mcp.md` and update AGENTS, README, architecture, privacy, performance, usage, and screenshot documentation with supported clients and local trust boundaries.
- [x] 4.4 Extend the manifest and deterministic gallery from 38 to 43 PNGs, generate and visually inspect all frames, then regenerate and verify identical hashes.

## 5. Validation and delivery

- [x] 5.1 Run format, lint, typecheck, unit, dev check, MCP check, server build, both browser suites, Pages build/check, public check, strict OpenSpec validation, and diff check.
- [x] 5.2 Synchronize every delta into canonical specs, archive the completed change, validate again, and verify no active OpenSpec changes.
- [x] 5.3 Commit as `feat: add embedded MCP agent access`, integrate current origin/main without history rewriting, merge and push main, delete merged change branches, and verify clean identical local/remote main without publishing Pages.
