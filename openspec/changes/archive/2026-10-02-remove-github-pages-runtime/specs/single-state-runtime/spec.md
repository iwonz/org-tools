## MODIFIED Requirements

### Requirement: One authenticated server owns current organization data
Org Tools SHALL have exactly one self-hosted application runtime backed by PostgreSQL. Organization
data SHALL be mutated only through authenticated commands, durable UI SHALL be account-specific,
and clients SHALL receive only authorized projections. Browser snapshots, alternate static
runtimes, SQLite persistence, `BroadcastChannel`, and whole-state APIs MUST NOT exist.

#### Scenario: Open an authenticated tab
- **WHEN** an account with a valid session opens the application
- **THEN** the server returns its current authorized projection and per-account UI state without
  exposing a complete State

#### Scenario: Open without a session
- **WHEN** a caller without a valid session opens an initialized installation
- **THEN** only localized Login and nonsecret bootstrap status are available
