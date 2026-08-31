## ADDED Requirements

### Requirement: MCP protocol and isolation have dedicated validation
The repository SHALL provide `pnpm mcp:check` as an isolated raw-protocol smoke test for disabled,
authentication, discovery, bounded read, Preview, Apply, idempotency, activity, and undo behavior.
Unit and browser validation SHALL additionally cover schema migration, token lifecycle, complete
typed CRUD, expiry, staleness, selective undo conflicts, revision reconciliation, localization,
live UI updates, and absence of unexpected diagnostics or external requests.

#### Scenario: Isolated protocol smoke
- **WHEN** `pnpm mcp:check` runs against a temporary database through the actual route handler
- **THEN** it enables MCP through the same-origin control contract, authenticates, discovers protocol surfaces, applies and undoes one preview, and removes owned state

#### Scenario: Large organization reads
- **WHEN** validation uses 20,000 Employees and 4,000 Units
- **THEN** reads remain paginated and cached, UI-only actions do not serialize organization, and one Apply produces one snapshot and transaction

#### Scenario: Pages isolation scan
- **WHEN** Pages and publication checks inspect source and output
- **THEN** any MCP SDK, `/mcp` or MCP control reference, token prefix, server chunk, SQLite symbol, credential, or organization fixture fails validation

### Requirement: Documentation and gallery explain local agent access
The repository SHALL document MCP setup, trust boundaries, supported local clients, tools,
Preview -> Apply, activity, undo, revision reconciliation, and recovery in `docs/mcp.md` and the
existing architecture, privacy, performance, usage, screenshot, contributor, and README surfaces.
The deterministic gallery SHALL contain exactly 43 PNGs: the existing 38 product scenarios plus
disabled consent, enabled credentials, client setup, applied activity, and selective-undo conflict.
The README SHALL retain exactly ten featured product frames.

#### Scenario: MCP documentation
- **WHEN** a local user follows one supported client setup
- **THEN** bundled instructions use the loopback endpoint and environment-backed token where supported without requiring a remote tunnel or fetched documentation

#### Scenario: Complete gallery
- **WHEN** screenshot generation runs against the production runtimes
- **THEN** it deterministically replaces exactly 43 declared PNGs and the five MCP frames originate only from server mode

#### Scenario: Featured README
- **WHEN** a visitor opens README
- **THEN** the same ten Import, Export, theme, language, Teams, Employees, Editor, Analytics, Calendar, and Download previews remain featured

#### Scenario: Deterministic generation
- **WHEN** the 43-frame gallery is generated twice from unchanged source and fixed fixtures
- **THEN** every PNG hash is identical and every owned page has no unexpected console or network diagnostic
