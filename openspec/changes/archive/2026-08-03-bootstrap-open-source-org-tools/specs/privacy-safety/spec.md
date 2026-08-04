## ADDED Requirements

### Requirement: Organization data remains local
The application SHALL not transmit workspace state, imported rows, search terms, analytics, or exports and SHALL make no background external requests.

#### Scenario: Core workflow network audit
- **WHEN** a user edits, imports, searches, analyzes, and exports a workspace
- **THEN** browser requests are limited to the locally served application assets

### Requirement: Public artifacts use general safety checks
The repository SHALL validate tracked and generated artifacts for portable paths, secrets,
unexpected language, unsupported media, generated caches, and obsolete public contracts through
general project rules.

#### Scenario: Publication scan
- **WHEN** the public-safety check scans tracked files and the production build
- **THEN** a general artifact or contract violation causes a failing exit code

### Requirement: External contact actions are explicit
The application SHALL open persisted profile links and mail links only after a user action with referrer protections.

#### Scenario: Profile navigation
- **WHEN** a user activates a valid Employee profile link
- **THEN** it opens separately with `noopener`, `noreferrer`, and no referrer
