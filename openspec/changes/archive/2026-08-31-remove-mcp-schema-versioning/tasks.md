## 1. Strict current database

- [x] 1.1 Remove SQLite schema-version reads/writes/constants and every legacy migration or reset branch; accept only empty or exact-current database shapes.
- [x] 1.2 Replace migration fixtures with atomic rejection tests for former project, pre-MCP singleton, incomplete, unknown, and corrupt database shapes.

## 2. Focused MCP interface

- [x] 2.1 Rename the sidebar action, tooltip, accessibility name, and dialog title to MCP; load settings for a green enabled icon and remove the Enabled badge.
- [x] 2.2 Generate ready-to-paste client configuration with the current token, including supported static Codex headers, while keeping the credential row masked by default.
- [x] 2.3 Remove the environment-variable step, Examples tab and strings, and provider-notice section; update English/Russian catalogs and browser coverage.

## 3. Documentation and visual catalog

- [x] 3.1 Remove schema-version and compatibility language from architecture, usage, MCP, README, and related docs; document strict current-shape failure and ready configuration.
- [x] 3.2 Regenerate all 43 PNGs, visually inspect MCP disabled/enabled/setup/activity/conflict surfaces, and verify a second generation has identical hashes without real tokens.

## 4. Validation and delivery

- [x] 4.1 Run format, lint, typecheck, unit, dev check, MCP check, server build, both browser suites, Pages build/check, public check, strict OpenSpec validation, and diff check.
- [x] 4.2 Synchronize canonical specs, archive the change, verify no active changes, commit meaningfully, fast-forward into main, push, delete the merged branch, and verify clean identical local/remote main without publishing Pages.
