## 1. Remove the MCP runtime and persistence surface

- [x] 1.1 Delete the MCP transport, control APIs, domain services, security, repositories, prompts, and protocol types.
- [x] 1.2 Reduce SQLite persistence to the single `application_state` table and simplify `/api/state` writes by removing expected-revision conflicts, state events, and three-way merge behavior.
- [x] 1.3 Remove MCP dependencies, commands, CI hooks, contributor tooling, and the installable agent skill.
- [x] 1.4 Drop the three MCP tables from the owned local database in one transaction and verify that the application revision and organization/UI JSON hashes are unchanged.

## 2. Remove MCP product surfaces

- [x] 2.1 Remove the MCP sidebar action, modal, client configuration UI, success color token, translations, and conflict-resolution UI while keeping both runtimes geometrically consistent.
- [x] 2.2 Remove MCP-specific unit and browser suites and update state persistence, API, localization, and Pages-isolation tests for the simplified runtime.
- [x] 2.3 Remove MCP documentation and current capability requirements, update architecture/privacy/performance/usage/import-format guidance, and preserve historical OpenSpec archives unchanged.
- [x] 2.4 Remove the five MCP screenshot scenarios and PNG files, update the 38-image manifest and documentation, and keep the ten README primary images intact.

## 3. Verify and deliver the change

- [x] 3.1 Run formatting, linting, type checking, unit tests, the development probe, both production builds and browser suites, Pages/public checks, strict OpenSpec validation, and `git diff --check`.
- [x] 3.2 Regenerate and visually inspect all 38 screenshots twice and verify identical SHA-256 hashes.
- [x] 3.3 Synchronize canonical specifications, archive the change, validate that no OpenSpec changes remain active, and review the final staged contents for publication hazards.
- [x] 3.4 Commit as `refactor: remove MCP functionality`, fast-forward merge into `main`, push GitHub, delete the merged change branch, and verify clean synchronized refs without publishing Pages manually.
