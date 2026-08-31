## 1. Agent setup contract

- [x] 1.1 Add typed client descriptors and a pure setup-prompt builder for all seven clients with the current endpoint, token, global skill install, exact configuration, reload, and read-only verification.
- [x] 1.2 Add the instruction-only `org-tools` skill and offline `pnpm skill:check` validation for discovery, frontmatter, source language, placeholders, secrets, and resource shape.
- [x] 1.3 Strengthen bundled MCP guidance and the public skill so Preview and Undo require an explicit approval before Apply and unavailable MCP never triggers token discovery.

## 2. MCP interface

- [x] 2.1 Replace the raw configuration block with a localized copyable setup-prompt surface, regenerate it on client or token changes, and keep prompt/token data transient.
- [x] 2.2 Remove the visible title description while retaining a localized screen-reader description and complete English/Russian catalog coverage.
- [x] 2.3 Define semantic success colors for both themes and keep the enabled MCP icon green through compact, expanded, hover, active, and open states.

## 3. Tests, documentation, and gallery

- [x] 3.1 Add unit and browser coverage for prompt contents, skill mappings, copy, rotation, read-only setup, hidden description, computed icon color, Pages isolation, localization, diagnostics, and external requests.
- [x] 3.2 Update README, MCP, architecture, privacy, usage, performance, screenshot, and contributor documentation plus canonical capability deltas for the skill and setup prompt.
- [x] 3.3 Regenerate all 43 PNGs, visually inspect the five MCP frames and both themes/locales, sanitize credentials, and verify a second generation has identical hashes.

## 4. Validation and delivery

- [x] 4.1 Run format, lint, typecheck, unit, skill check, dev check, MCP check, server and Pages builds, both browser suites, Pages/public checks, strict OpenSpec validation, and diff check.
- [x] 4.2 Synchronize canonical specs, archive the change, verify no active changes, commit `feat: add MCP setup skill`, fast-forward into main, push, delete the merged branch, verify an isolated post-push GitHub skill install, and confirm clean identical local/remote main without publishing Pages.
