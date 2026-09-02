## ADDED Requirements

### Requirement: Documentation and gallery cover current product surfaces
The repository SHALL document the current browser-memory and loopback SQLite runtimes, state
transfer, privacy, performance, usage, and screenshot workflows without obsolete agent-access
guidance. The deterministic gallery SHALL contain exactly 38 PNGs covering the existing product
scenarios. The README SHALL retain exactly ten featured Import, Export, theme, language, Teams,
Employees, Editor, Analytics, Calendar, and Download frames.

#### Scenario: Complete gallery
- **WHEN** screenshot generation runs against the production runtimes
- **THEN** it deterministically replaces exactly 38 declared PNGs covering only current product workflows

#### Scenario: Featured README
- **WHEN** a visitor opens README
- **THEN** the same ten current product previews remain featured and every linked PNG exists

#### Scenario: Deterministic generation
- **WHEN** the 38-frame gallery is generated twice from unchanged source and fixed fixtures
- **THEN** every PNG hash is identical and every owned page has no unexpected console or network diagnostic

## REMOVED Requirements

### Requirement: MCP protocol and isolation have dedicated validation
**Reason**: The MCP protocol, SDK, credentials, and public Agent Skill are removed.
**Migration**: The standard unit, browser, Pages, public-safety, and OpenSpec checks validate the remaining product.

### Requirement: Documentation and gallery explain local agent access
**Reason**: Agent access and its five supporting scenarios are no longer part of Org Tools.
**Migration**: Use the 38-frame product gallery and current runtime documentation.
