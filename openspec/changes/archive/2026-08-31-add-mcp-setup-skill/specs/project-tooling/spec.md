## MODIFIED Requirements

### Requirement: MCP protocol and isolation have dedicated validation
The repository SHALL provide `pnpm mcp:check` as an isolated raw-protocol smoke test for disabled,
authentication, discovery, bounded read, Preview, Apply, idempotency, activity, and undo behavior,
and `pnpm skill:check` as a local validation of the public instruction-only skill. Unit and browser
validation SHALL additionally cover strict rejection of every non-current database shape without
mutation, token lifecycle, complete typed CRUD, expiry, staleness, selective undo conflicts,
revision reconciliation, localization, live UI updates, generated setup prompts, semantic enabled
color, and absence of unexpected diagnostics or external requests.

#### Scenario: Isolated protocol smoke
- **WHEN** `pnpm mcp:check` runs against a temporary database through the actual route handler
- **THEN** it enables MCP through the same-origin control contract, authenticates, discovers protocol surfaces, applies and undoes one preview, and removes owned state

#### Scenario: Public skill check
- **WHEN** `pnpm skill:check` runs without network access
- **THEN** it validates the discoverable skill name, frontmatter, instruction-only shape, source language, and absence of credentials or unfinished placeholders

#### Scenario: Large organization reads
- **WHEN** validation uses 20,000 Employees and 4,000 Units
- **THEN** reads remain paginated and cached, UI-only actions do not serialize organization, and one Apply produces one snapshot and transaction

#### Scenario: Pages isolation scan
- **WHEN** Pages and publication checks inspect source and output
- **THEN** any MCP SDK, `/mcp` or MCP control reference, token prefix, server chunk, SQLite symbol, credential, setup prompt, or organization fixture fails validation

### Requirement: Documentation and gallery explain local agent access
The repository SHALL document MCP setup, the globally installable `org-tools` skill, trust
boundaries, supported local clients, tools, explicit Preview approval before Apply, activity, undo,
revision reconciliation, and recovery in `docs/mcp.md` and the existing architecture, privacy,
performance, usage, screenshot, contributor, and README surfaces. Client setup SHALL be one
copyable English prompt containing the selected client's global skill command, loopback endpoint,
current token, exact configuration, reload step, and read-only verification without a separate
environment step. The deterministic gallery SHALL contain exactly 43 PNGs: the existing 38 product
scenarios plus disabled consent, enabled credentials, client setup, applied activity, and
selective-undo conflict. The README SHALL retain exactly ten featured product frames, and generated
frames MUST NOT contain a real token.

#### Scenario: MCP setup prompt
- **WHEN** a local user selects one supported client in the MCP Setup tab
- **THEN** one bundled prompt contains the exact global skill install, loopback endpoint, current token, client configuration, reload guidance, and read-only verification without an environment step, remote tunnel, or fetched instruction

#### Scenario: Complete gallery
- **WHEN** screenshot generation runs against the production runtimes
- **THEN** it deterministically replaces exactly 43 declared PNGs and the five MCP frames originate only from server mode without a real credential

#### Scenario: Featured README
- **WHEN** a visitor opens README
- **THEN** the same ten Import, Export, theme, language, Teams, Employees, Editor, Analytics, Calendar, and Download previews remain featured

#### Scenario: Deterministic generation
- **WHEN** the 43-frame gallery is generated twice from unchanged source and fixed fixtures
- **THEN** every PNG hash is identical and every owned page has no unexpected console or network diagnostic
