## ADDED Requirements

### Requirement: MCP modal controls use leading decorative icons
The server-only MCP modal SHALL place one bundled thematic decorative icon before the localized
visible label in its Setup and Activity tabs and current Enable, Disable, or Rotate token action. Every supported
Client setup choice SHALL place one bundled client-specific decorative icon before its unchanged
visible client name. The icons MUST NOT alter the accessible names, control geometry, or Pages
runtime surface.

#### Scenario: Leading MCP action icons
- **WHEN** the user opens the disabled or enabled MCP modal
- **THEN** each visible Enable, Disable, Rotate token, Setup, and Activity label follows exactly one thematic decorative icon

#### Scenario: Leading client icons
- **WHEN** Client setup lists Codex, Claude Code, Cursor, OpenClaw, Hermes, Pi, and OpenCode
- **THEN** every choice begins with its own bundled client-specific decorative icon and retains its full accessible name

#### Scenario: Static runtime remains isolated
- **WHEN** the Pages application is built or used
- **THEN** it contains no MCP control or client icon surface
