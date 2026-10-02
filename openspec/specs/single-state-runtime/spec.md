# single-state-runtime Specification

## Purpose
Define the strict authenticated server state contract, PostgreSQL persistence, and authorized client projection.
## Requirements
### Requirement: One authenticated server owns current organization data
Org Tools SHALL have exactly one self-hosted application runtime backed by PostgreSQL. Organization
data SHALL be mutated only through authenticated commands, durable UI SHALL be account-specific,
and clients SHALL receive only authorized projections. Browser snapshots, alternate static
runtimes, SQLite persistence, `BroadcastChannel`, and whole-state APIs MUST NOT exist.

#### Scenario: Open an authenticated tab
- **WHEN** an account with a valid session opens the application
- **THEN** the server returns its current authorized projection and per-account UI state without exposing a complete State

#### Scenario: Open without a session
- **WHEN** a caller without a valid session opens an initialized installation
- **THEN** only localized Login and nonsecret bootstrap status are available

### Requirement: Per-account UI state remains bounded and separate
The server SHALL persist locale, theme, shell, active workflow, searches, filters, Download settings,
active View, viewport, selection, and distribution mode per account with the same bounded shapes as before.
Transient overlays, drafts, clipboard, generated output, invalid input, history, and export sessions
MUST NOT persist. Malformed or inexact UI payloads MUST return the standard invalid-input response
without writing data.

#### Scenario: Two accounts use different UI state
- **WHEN** two accounts change locale, active View, filters, or viewport independently
- **THEN** each account restores only its own bounded UI state while organization data remains shared

#### Scenario: Reject malformed UI state
- **WHEN** an authenticated account submits a UI object outside the exact production schema
- **THEN** the server returns an invalid-input response and preserves the prior per-account UI state
